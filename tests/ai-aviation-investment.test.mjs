import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Exercise the real construction planner and placement rules, not a mock AI.
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
  const g=window.__game;
  g.updateUI=noop;g.notify=noop;g.draw=noop;
  return g;
}

for(const faction of ['coalition','federation','psionic']){
  const g=game();
  const reset=()=>g.newMatch({map:'verdant',difficulty:'standard',
    playerFaction:'coalition',enemyFaction:faction,startingCredits:5000});
  const prerequisites=()=>{
    g.add(1,'factory',24,23);g.add(1,'radar',23,25);
    g.add(1,'generator',21,24);g.add(1,'generator',22,20);
  };
  reset();prerequisites();g.time=150;g.players[1].credits=2400;
  assert.equal(g.power(1).low,false,faction+': powered prerequisites required');
  assert.ok(g.prereq(1,'airfield'),faction+': factory and radar unlock aviation');
  const before=g.players[1].credits,spent=g.stats[1].creditsSpent;
  g.runAI();
  const fields=g.entities.filter(e=>e.owner===1&&e.kind==='airfield'&&e.hp>0);
  assert.equal(fields.length,1,faction+': affordable Air Command must be constructed');
  assert.equal(fields[0].built,false,'normal construction timer required');
  assert.ok(before-g.players[1].credits>=1750,'Air Command must cost at least 1750 credits');
  assert.ok(g.stats[1].creditsSpent-spent>=1750,'spending telemetry must record Air Command');
  assert.ok(g.saveGame()&&g.loadGame(),'construction must survive save/load');
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='airfield').length,1);

  reset();prerequisites();
  g.add(1,'tank',24,20);g.add(1,'tank',23,19);
  g.time=150;g.players[1].credits=1800;g.queues=[];
  const bank=g.players[1].credits;
  g.runAI();
  assert.equal(g.players[1].credits,bank,
    faction+': safe two-tank base should bank credits toward aviation');
  assert.equal(g.queues.filter(q=>q.side===1).length,0,
    faction+': routine tank recruitment must pause during aviation saving');
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='turret').length,0,
    faction+': optional turret must not consume the aviation reserve');

  // Real matches can lose a tank after the factory and radar are paid for.
  // One surviving armoured defender must preserve Air Command savings
  // without bypassing construction costs, power or the existing queue.
  reset();prerequisites();
  for(const u of g.entities.filter(e=>e.owner===1&&
    ['tank','heavy'].includes(e.kind)))u.hp=0;
  const loneTank=g.add(1,'tank',24,20);
  g.time=150;g.players[1].credits=1800;g.queues=[];
  assert.equal(g.power(1).low,false,faction+': single-tank base must be powered');
  g.runAI();
  assert.equal(g.players[1].credits,1800,
    faction+': one surviving tank must preserve the Air Command reserve');
  assert.equal(g.queues.filter(q=>q.side===1).length,0,
    faction+': optional ground recruitment must pause with one tank');
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='airfield').length,0,
    faction+': cannot buy Air Command before the full 2400-credit threshold');
  assert.ok(g.saveGame()&&g.loadGame(),faction+': saving state must survive v1 save/load');
  assert.equal(g.players[1].credits,1800,
    faction+': saving must not create credits or saved-state changes');
  g.players[1].credits=2400;
  g.runAI();
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='airfield'&&e.hp>0).length,1,
    faction+': funded single-tank base must buy an actual Air Command');
  assert.equal(g.players[1].credits,650,
    faction+': paid construction must retain generator reserve');

  reset();prerequisites();
  for(const u of g.entities.filter(e=>e.owner===1&&
    ['tank','heavy'].includes(e.kind)))u.hp=0;
  g.time=150;g.players[1].credits=1800;g.queues=[];
  g.runAI();
  assert.ok(g.queues.some(q=>q.side===1&&q.key!=='aircraft'),
    faction+': losing all armour must release savings for ground recruitment');

  reset();prerequisites();
  for(const u of g.entities.filter(e=>e.owner===1&&
    ['tank','heavy'].includes(e.kind)))u.hp=0;
  g.add(1,'tank',24,20);
  const hq=g.entities.find(e=>e.owner===1&&e.kind==='hq');
  g.add(0,'soldier',hq.x+1,hq.y+1);
  g.time=150;g.players[1].credits=1800;g.queues=[];
  g.runAI();
  assert.ok(g.queues.some(q=>q.side===1&&q.key!=='aircraft'),
    faction+': visible local attack must override single-tank saving');

  reset();prerequisites();g.time=150;g.players[1].credits=2399;
  g.runAI();
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='airfield').length,0,
    faction+': emergency generator reserve must be respected');

  reset();g.add(1,'factory',24,23);g.add(1,'generator',21,24);
  g.time=150;g.players[1].credits=5000;g.runAI();
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='airfield').length,0,
    faction+': cannot bypass radar prerequisite');

  reset();g.add(1,'factory',24,23);g.add(1,'radar',23,25);
  g.time=150;g.players[1].credits=5000;
  assert.equal(g.power(1).low,true,'brownout fixture must be unpowered');
  g.runAI();
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='airfield').length,0,
    faction+': power recovery must precede aviation');
}

// A destroyed ore economy must be rebuilt BEFORE optional construction.
// At exactly 2,400 credits, buying a 1,750-credit Air Command first would
// strand the AI with only 650, unable to afford its 900-credit harvester.
for(const faction of ['coalition','federation','psionic']){
  const g=game();
  const reset=()=>g.newMatch({map:'verdant',difficulty:'standard',
    playerFaction:'coalition',enemyFaction:faction,startingCredits:5000});
  const removeWorkers=()=>{
    for(const worker of g.entities.filter(e=>e.owner===1&&e.kind==='harvester'))
      worker.hp=0;
  };
  reset();
  g.add(1,'factory',24,23);g.add(1,'radar',23,25);
  g.add(1,'generator',21,24);g.add(1,'generator',22,20);
  g.time=150;g.queues=[];removeWorkers();
  assert.equal(g.power(1).low,false,faction+': recovery fixture is powered');
  assert.equal(g.prereq(1,'harvester'),true,
    faction+': living refinery can build a paid replacement');
  assert.equal(g.prereq(1,'airfield'),true,
    faction+': aviation is technically available but must wait for income');
  g.players[1].credits=2400;
  const spent=g.stats[1].creditsSpent;
  g.runAI();
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='airfield'&&e.hp>0).length,0,
    faction+': never spend recovery credits on an Air Command');
  assert.equal(g.queues.find(q=>q.side===1)?.key,'harvester',
    faction+': prioritize a paid ore truck over optional construction');
  assert.equal(g.players[1].credits,1500,
    faction+': preserve enough credits after the 900-credit replacement');
  assert.equal(g.stats[1].creditsSpent-spent,900,
    faction+': record the real harvester purchase without free income');
  g.advanceProduction(10);
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='harvester'&&e.hp>0).length,1,
    faction+': replacement must actually deploy through the refinery');
  assert.ok(g.saveGame()&&g.loadGame(),faction+': recovery must preserve legacy saves');
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='harvester'&&e.hp>0).length,1);
  g.players[1].credits=2400;g.runAI();
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='airfield'&&e.hp>0).length,1,
    faction+': aviation construction resumes once ore income is restored');

  reset();removeWorkers();g.time=150;g.queues=[];g.players[1].credits=5000;
  g.runAI();
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='factory'&&e.hp>0).length,0,
    faction+': do not buy a factory before replacing a lost harvester');
  assert.equal(g.queues.find(q=>q.side===1)?.key,'harvester',
    faction+': a refinery can produce the replacement without a factory');

  reset();removeWorkers();g.time=150;g.queues=[];g.players[1].credits=899;
  g.runAI();
  assert.equal(g.players[1].credits,899,
    faction+': insufficient replacement funds must not be spent on optional tech');
  assert.equal(g.queues.filter(q=>q.side===1).length,0,
    faction+': no free harvester when credits are insufficient');
}

console.log('PASS: affordable AI aviation across three factions, power reserve, prerequisites and saves');
