import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const noop=()=>{};
const drawing=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',style:{},disabled:false,
    classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
    addEventListener:noop,setAttribute:noop,querySelectorAll:()=>[],
    querySelector:()=>({disabled:true,textContent:''}),
    getContext:()=>drawing,
    getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
    set innerHTML(v){this._html=v;},get innerHTML(){return this._html||'';},
    set textContent(v){this._text=v;},get textContent(){return this._text||'';}
  });return nodes.get(id);
}};
const window={addEventListener:noop};
const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
runInNewContext(source,{window,document,localStorage,console,
  performance:{now:()=>0},devicePixelRatio:1,requestAnimationFrame:noop,
  setTimeout:()=>1,clearTimeout:noop},{timeout:10000});
const g=window.__game;
g.updateUI=noop;g.notify=noop;g.draw=noop;
const alive=(side,kind)=>g.entities.find(e=>e.owner===side&&e.kind===kind&&e.hp>0);
const reset=faction=>{
  g.newMatch({map:'verdant',difficulty:'standard',
    playerFaction:'coalition',enemyFaction:faction,startingCredits:5000});
  g.time=10;
};
for(const faction of ['coalition','federation','psionic']){
  reset(faction);
  const h=alive(1,'harvester'),refinery=alive(1,'refinery');
  h.x=refinery.x-8;h.y=refinery.y-6;
  h.load=80;h.work=0;h.hp=Math.floor(h.maxHp*.7);
  const enemy=g.add(0,'soldier',h.x+1,h.y+1);
  assert.ok(g.sideCanSee(1,enemy),faction+': local threat must be visible');
  let retreat=null;
  const originalMove=g.move;
  g.move=(unit,x,y)=>{if(unit.id===h.id)retreat={x,y};};
  g.processHarvester(h,.1);
  g.move=originalMove;
  assert.ok(retreat&&Math.abs(retreat.x-(refinery.x+1.9))<.01&&
    Math.abs(retreat.y-(refinery.y+1.3))<.01,
    faction+': endangered AI harvester must retreat to refinery');
  assert.equal(h.load,80,'cargo remains intact during retreat');
  assert.equal(h.oreIndex,-1,'old dangerous ore destination is invalidated');
  const beforeCredits=g.players[1].credits,beforeOre=g.stats[1].oreHarvested;
  h.x=refinery.x+2;h.y=refinery.y+1;
  g.time+=1;
  g.processHarvester(h,.1);
  assert.equal(h.load,0,faction+': partial cargo delivered at safety');
  assert.equal(g.players[1].credits,beforeCredits+80,
    faction+': real credits equal actual recovered cargo');
  assert.equal(g.stats[1].oreHarvested,beforeOre+80,
    faction+': partial delivery is recorded once');
  g.processHarvester(h,.1);
  assert.equal(g.players[1].credits,beforeCredits+80,
    faction+': never duplicate a delivered cargo');
  assert.ok(g.saveGame()&&g.loadGame(),faction+': legacy v1 saves remain valid');

  reset(faction);
  const scoutHarvester=alive(1,'harvester');
  scoutHarvester.x=10;scoutHarvester.y=10;
  const spotted=g.add(0,'soldier',11,11);
  g.entities=[scoutHarvester,spotted];
  g.water=()=>false;
  g.ores=[{x:10,y:10,amount:1200,max:1200},
    {x:19,y:19,amount:1200,max:1200}];
  assert.equal(g.chooseHarvestDeposit(scoutHarvester),1,
    faction+': avoid the visible hostile ore field');
  spotted.hp=0;
  assert.equal(g.chooseHarvestDeposit(scoutHarvester),0,
    faction+': resume nearest ore after the threat disappears');

  reset(faction);
  const hiddenHarvester=alive(1,'harvester');
  hiddenHarvester.x=10;hiddenHarvester.y=10;
  const hidden=g.add(0,'soldier',18,10);
  g.entities=[hiddenHarvester,hidden];
  g.water=()=>false;
  g.ores=[{x:18,y:10,amount:1200,max:1200},
    {x:10,y:19,amount:1200,max:1200}];
  assert.equal(g.sideCanSee(1,hidden),false,
    faction+': distant enemy is outside AI sensor coverage');
  assert.equal(g.chooseHarvestDeposit(hiddenHarvester),0,
    faction+': cannot use hidden enemy positions to reject ore');
}
console.log('PASS: three-faction visible-threat retreats, partial cargo delivery, fog honesty and save compatibility');
