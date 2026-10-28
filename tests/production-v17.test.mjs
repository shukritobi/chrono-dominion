import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game = new Game();');
const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const elements=new Map(),storage=new Map();
const document={getElementById(id){
  if(!elements.has(id))elements.set(id,{
    id,value:'',style:{},disabled:false,classList:{add(){},remove(){},toggle(){}},
    addEventListener(){},setAttribute(){},querySelectorAll(){return[];},
    querySelector(){return{disabled:true,textContent:''}},
    getContext(){return ctx},getBoundingClientRect(){return{left:0,top:0,width:id==='world'?1100:272,height:id==='world'?720:144}},
    set innerHTML(v){this._html=v;},get innerHTML(){return this._html||''},
    set textContent(v){this._text=v;},get textContent(){return this._text||''}
  });return elements.get(id);
}};
const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
const window={addEventListener(){}};
runInNewContext(source,{window,document,localStorage,console,performance:{now:()=>0},
  devicePixelRatio:1,requestAnimationFrame(){},setTimeout(){return 1;},clearTimeout(){}},{timeout:4000});
const g=window.__game,settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'recruit',startingCredits:5000};
const reset=()=>{
  g.newMatch(settings);g.entities=[];g.queues=[];g.unitBuckets=null;
  g.water=()=>false;g.nextAI=1e9;
};
const unitCount=(side,kind)=>g.entities.filter(e=>e.owner===side&&e.kind===kind&&e.hp>0).length;
const queue=(side,key,elapsed=0,total=2)=>{
  const q={side,key,elapsed,total};g.queues.push(q);return q;
};
reset();

// A fixed spawn offset (producer +2,+2) is occupied. Search must find a
// different real exit, not overlap a parked vehicle or the factory footprint.
const factory=g.add(0,'factory',12,12),parked=g.add(0,'heavy',14,14);
const training=queue(0,'tank',1.95,2);
g.advanceProduction(.1);
const spawned=g.entities.find(e=>e.owner===0&&e.kind==='tank');
assert.ok(spawned,'finished queue deploys a unit');
assert.equal(g.queues.length,0,'successful deployment consumes exactly one queue');
assert.ok(Math.hypot(spawned.x-parked.x,spawned.y-parked.y)>
  g.unitRadius(spawned)+g.unitRadius(parked)*.7,'spawn is not on a parked unit');
assert.ok(Math.hypot(spawned.x-factory.x,spawned.y-factory.y)>1.7,'spawn is outside factory footprint');
assert.ok(g.canOccupyUnit(spawned,spawned.x,spawned.y),'deployed unit has a clear location');
assert.ok(Math.hypot(spawned.x-factory.x,spawned.y-factory.y)<=13,'spawn is local to producer');
g.advanceProduction(.1);
assert.equal(unitCount(0,'tank'),1,'queue cannot deploy the same unit twice');

// A fully enclosed producer holds a completed order at 100% until land opens.
reset();
g.add(0,'factory',12,12);
const pending=queue(0,'heavy',2,2);
g.water=(x,y)=>!(Math.abs(x-12)<.15&&Math.abs(y-12)<.15);
g.advanceProduction(.1);
assert.equal(pending.blockedReason,'exit','closed terrain reports blocked exit');
assert.equal(pending.elapsed,2,'production stays complete, not lost');
assert.equal(unitCount(0,'heavy'),0,'no unit spawns into water');
assert.equal(g.queues.length,1,'blocked order is retained');
g.updateUI(true);
assert.ok(elements.get('queueList').innerHTML.includes('EXIT BLOCKED'),'HUD explains a blocked exit');
const heldTime=pending.nextDeployAt;
g.advanceProduction(.1);
assert.equal(pending.nextDeployAt,heldTime,'blocked queues throttle retries');
g.water=()=>false;
g.time=heldTime+.01;
g.advanceProduction(.1);
assert.equal(unitCount(0,'heavy'),1,'queue deploys once the exit opens');
assert.equal(g.queues.length,0);

// Footprint checks reject a centre that is clear but whose edges are water.
reset();
const shoreline=g.add(0,'factory',12,12);
g.water=(x,y)=>Math.abs(x-Math.round(x))>.15||Math.abs(y-Math.round(y))>.15;
assert.equal(g.findProductionExit(shoreline,'heavy',0),null,
  'center-only collision checks cannot bypass shoreline footprint');
g.water=()=>false;

// Destroying the only producer pauses a paid queue rather than deleting it.
reset();
const producer=g.add(0,'factory',12,12);
const waiting=queue(0,'tank',.6,2);
producer.hp=0;
g.advanceProduction(.7);
assert.equal(waiting.elapsed,.6,'production pauses when factory is destroyed');
assert.equal(waiting.blockedReason,'producer');
assert.equal(g.queues.length,1,'reserved credits and order survive destruction');
g.updateUI(true);
assert.ok(elements.get('queueList').innerHTML.includes('PRODUCER OFFLINE'));
const replacement=g.add(0,'factory',13,13);
g.advanceProduction(3);
assert.equal(unitCount(0,'tank'),1,'rebuilt factory finishes old order, even under low power');
assert.equal(g.queues.length,0);
assert.ok(replacement.hp>0);

// Blocked production remains cancelable with a full refund, even at 100%.
reset();
g.add(0,'factory',12,12);
g.water=()=>true;
g.chooseProduction('tank');
const balance=g.players[0].credits;
g.advanceProduction(9);
assert.equal(g.queues.length,1);
assert.equal(g.queues[0].blockedReason,'exit');
assert.equal(g.cancelProduction('tank'),true);
assert.equal(g.players[0].credits,balance+850);
assert.equal(g.queues.length,0);

// A queued unit blocked by a missing producer persists through a v1 save.
reset();
const removed=g.add(0,'barracks',12,12);removed.hp=0;
const stored=queue(0,'soldier',1.2,2);
g.advanceProduction(.3);
assert.ok(g.saveGame());
const json=JSON.parse(storage.get('chrono-dominion-skirmish-v1'));
assert.equal(json.version,1,'save schema remains compatible');
assert.equal(json.queues[0].blockedReason,'producer');
assert.equal(g.loadGame(),true);
assert.equal(g.queues.length,1);
assert.equal(g.queues[0].elapsed,1.2);
g.add(0,'barracks',12,12);
g.advanceProduction(2);
assert.equal(unitCount(0,'soldier'),1,'loaded queue resumes after rebuilding');
assert.equal(g.queues.length,0);

// Enemy production follows the same safe-exit rule, not a privileged spawn.
reset();
g.add(1,'factory',23,23);
g.add(1,'heavy',21,21);
queue(1,'recon',2,2);
g.advanceProduction(.1);
const enemyScout=g.entities.find(e=>e.owner===1&&e.kind==='recon');
assert.ok(enemyScout);
assert.ok(g.canOccupyUnit(enemyScout,enemyScout.x,enemyScout.y));
assert.equal(g.queues.length,0);
// A finished, already-paid order must use another friendly factory when the
// preferred factory has no legal exit. An unblocked preferred factory retains
// its existing deterministic spawn choice (covered above).
reset();
const blockedFactory=g.add(0,'factory',7,7);
const openFactory=g.add(0,'factory',25,25);
queue(0,'tank',2,2);
g.water=(x,y)=>Math.hypot(x-blockedFactory.x,y-blockedFactory.y)<10;
assert.equal(g.productionBuilding(0,'tank').id,blockedFactory.id,
  'the original producer preference is the obstructed factory');
assert.equal(g.findProductionExit(blockedFactory,'tank',0),null,
  'primary factory has no legal exit');
g.advanceProduction(.1);
const diverted=g.entities.find(e=>e.owner===0&&e.kind==='tank');
assert.ok(diverted,'an open secondary factory deploys the paid tank');
assert.ok(Math.hypot(diverted.x-openFactory.x,diverted.y-openFactory.y)<13,
  'the unit actually spawns near the alternate producer');
assert.ok(g.canOccupyUnit(diverted,diverted.x,diverted.y),
  'alternate deployment uses the same collision-checked exit');
assert.equal(g.queues.length,0,'fallback consumes the queue exactly once');

// Enemy factories and unfinished friendly factories are never eligible.
// The blocked queue and its original cost survive a v1 save/load, then
// deploy as soon as a friendly backup finishes construction.
reset();
const enclosed=g.add(0,'factory',7,7);
g.add(1,'factory',26,8);
const unfinished=g.add(0,'factory',25,25,false);
const stalled=queue(0,'heavy',2,2);
g.water=(x,y)=>Math.hypot(x-enclosed.x,y-enclosed.y)<10;
g.advanceProduction(.1);
assert.equal(stalled.blockedReason,'exit',
  'enemy and unfinished producers cannot bypass a blocked exit');
assert.equal(unitCount(0,'heavy'),0);
assert.equal(g.queues.length,1);
assert.ok(g.saveGame()&&g.loadGame(),'blocked alternate-production queue survives a v1 save');
const recovered=g.queues[0];
assert.equal(recovered.blockedReason,'exit');
g.entityById(unfinished.id).built=true;
g.water=(x,y)=>Math.hypot(x-enclosed.x,y-enclosed.y)<10;
g.time=(recovered.nextDeployAt||g.time)+.01;
g.advanceProduction(.1);
assert.equal(unitCount(0,'heavy'),1,
  'a completed backup resumes the same paid queue after loading');
assert.equal(g.queues.length,0,'recovered order deploys exactly once');

// Air Commands use the same fallback without placing a plane at an enemy pad.
reset();
const firstPad=g.add(0,'airfield',7,7);
const secondPad=g.add(0,'airfield',25,25);
queue(0,'aircraft',2,2);
g.water=(x,y)=>Math.hypot(x-firstPad.x,y-firstPad.y)<10;
assert.equal(g.findProductionExit(firstPad,'aircraft',0),null);
g.advanceProduction(.1);
const aircraft=g.entities.find(e=>e.owner===0&&e.kind==='aircraft');
assert.ok(aircraft&&Math.hypot(aircraft.x-secondPad.x,aircraft.y-secondPad.y)<13,
  'an aircraft can deploy from a second operational friendly Air Command');
assert.equal(g.queues.length,0);

g.draw();
console.log('PASS: clear production exits, blocked queues, footprint, factory loss, refunds, save/load, enemy spawns and alternate factories/airfields');
