import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Real movement, visibility, ore handling and v1 saves; no planner mocks.
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const noop=()=>{};
const drawing=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const catalog={addEventListener:noop};
runInNewContext(read('maps/catalog.js'),{window:catalog,console},{timeout:1000});
function game(){
  const nodes=new Map(),storage=new Map();
  const document={getElementById(id){
    if(!nodes.has(id))nodes.set(id,{
      id,value:'',disabled:false,style:{},dataset:{},
      classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
      addEventListener:noop,setAttribute:noop,querySelectorAll:()=>[],
      querySelector:()=>({disabled:true,textContent:''}),
      getContext:()=>drawing,setPointerCapture:noop,
      getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
      set innerHTML(v){this._html=v;},get innerHTML(){return this._html||'';},
      set textContent(v){this._text=v;},get textContent(){return this._text||'';}
    });return nodes.get(id);
  }};
  const window={...catalog};
  const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
  runInNewContext(read('game.js').replace('  new Game();','  window.__game=new Game();'),{
    window,document,localStorage,console,performance:{now:()=>0},
    devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop
  },{timeout:10000});
  const g=window.__game;g.updateUI=noop;g.notify=noop;g.draw=noop;
  return g;
}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
for(const faction of ['coalition','federation','psionic']){
  const g=game();
  g.newMatch({map:'verdant',difficulty:'standard',playerFaction:'coalition',
    enemyFaction:faction,startingCredits:5000});
  g.nextAI=1e6;
  const truck=g.entities.find(e=>e.owner===1&&e.kind==='harvester');
  const refinery=g.entities.find(e=>e.owner===1&&e.kind==='refinery');
  const spots=[];
  for(let x=15;x<29;x++)for(let y=15;y<29;y++){
    if(!g.canOccupyUnit(truck,x,y,true)||!g.canOccupyUnit(truck,x-2.8,y,true))continue;
    spots.push({x,y});
  }
  spots.sort((a,b)=>distance(a,refinery)-distance(b,refinery));
  assert.ok(spots.length,faction+': an open retreat fixture must exist');
  truck.x=spots[0].x;truck.y=spots[0].y;
  truck.path=[];truck.pathRecheck=0;truck.oreIndex=0;
  const enemy=g.add(0,'soldier',truck.x-2.8,truck.y);
  // Keep the attacker alive while nearby AI defenders return fire, so the
  // test measures sustained evasion rather than normal post-kill harvesting.
  enemy.hp=1e6;enemy.maxHp=1e6;enemy.ready=1e6;enemy.stance='hold';
  assert.equal(g.sideCanSee(1,enemy),true,faction+': hostile must be visible');
  const before=distance(truck,enemy),credits=g.players[1].credits;
  assert.equal(g.evadeAIHarvester(truck,.2),true,faction+': evade a visible armed enemy');
  assert.ok(g.harvesterEvadeTargets.get(truck),faction+': safe route must be planned');
  assert.equal(truck.oreSkipIndex,0,faction+': avoid the ambushed ore deposit');
  assert.ok(truck.oreSkipUntil>g.time,faction+': ore retry is delayed');
  const trace=[];
  for(let i=0;i<20;i++){
    g.step(.2);
    if(i%2===0)trace.push({i,x:truck.x,y:truck.y,d:distance(truck,enemy),
      visible:g.sideCanSee(1,enemy),hp:enemy.hp,evading:!!g.harvesterEvadeTargets.get(truck),
      oreIndex:truck.oreIndex,yield:!!truck.yieldOrder});
  }
  assert.ok(distance(truck,enemy)>before+.2,
    faction+': real movement increases separation '+JSON.stringify({before,after:distance(truck,enemy),
      truck:{x:truck.x,y:truck.y},enemy:{x:enemy.x,y:enemy.y},
      target:g.harvesterEvadeTargets.get(truck),path:truck.path?.slice(0,3),stuck:truck.stuck,trace}));
  assert.ok(g.players[1].credits>=credits,faction+': evasion cannot charge or grant credits');
  assert.equal(truck.order?.type,'harvest',faction+': original harvesting order remains');
  enemy.hp=0;
  g.step(.2);
  assert.equal(g.harvesterEvadeTargets.get(truck),undefined,
    faction+': escape cache clears when visible threat disappears');
  assert.ok(g.saveGame()&&g.loadGame(),faction+': v1 save/load remains compatible');
  const loaded=g.entities.find(e=>e.owner===1&&e.kind==='harvester');
  assert.equal(g.harvesterEvadeTargets.get(loaded),undefined,
    faction+': transient escape plans must never persist into saves');
  assert.equal(g.evadeAIHarvester(loaded,.2),false,
    faction+': resume normal harvesting without visible threats');
  const far=g.add(0,'soldier',3,3);far.ready=1e6;
  assert.equal(g.evadeAIHarvester(loaded,.2),false,
    faction+': no omniscient reaction to distant hidden enemies');
  const playerTruck=g.entities.find(e=>e.owner===0&&e.kind==='harvester');
  assert.equal(g.evadeAIHarvester(playerTruck,.2),false,
    faction+': player-controlled harvesting remains unchanged');
}
console.log('PASS: three-faction visible-threat ore truck evasion, normal recovery and v1 saves');
