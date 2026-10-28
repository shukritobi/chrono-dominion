import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game = new Game();');
const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const elements=new Map(),local=new Map();
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
const localStorage={getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,String(v))};
const window={addEventListener(){}};
runInNewContext(source,{window,document,localStorage,console,performance:{now:()=>0},
  devicePixelRatio:1,requestAnimationFrame(){},setTimeout(){return 1;},clearTimeout(){}},{timeout:4000});
const g=window.__game,settings={playerFaction:'coalition',enemyFaction:'federation',map:'verdant',difficulty:'recruit',startingCredits:5000};
const reset=()=>{g.newMatch(settings);g.entities=[];g.unitBuckets=null;g.water=()=>false;g.nextAI=1e9;};
reset();

// The loaded harvester outranks fighting units and deterministically asks a
// lower-priority friendly blocker to pull into an open passing pocket.
const ha=g.add(0,'harvester',11,12),inf=g.add(0,'soldier',11.9,12);
ha.load=220;
inf.order={type:'move',x:7,y:12};
assert.ok(g.trafficPriority(ha)>g.trafficPriority(inf));
assert.ok(g.tryTrafficYield(ha,1,0),'harvester receives right-of-way through ally');
assert.ok(inf.yieldOrder,'lower priority blocker has a temporary pocket order');
assert.ok(Math.abs(inf.yieldOrder.y-12)>.7,'yield position is off the traffic lane');
assert.equal(g.trafficYieldCount,1);
assert.ok(!g.tryTrafficYield(ha,1,0),'yield directives cannot be duplicated');
const goal={...inf.yieldOrder},originalOrder={...inf.order};
for(let i=0;i<130&&inf.yieldOrder;i++)g.step(.05);
assert.equal(inf.yieldOrder,null,'finished yield is cleared');
assert.equal(inf.order?.x,originalOrder.x,'the normal order resumes after yielding');
assert.equal(inf.order?.y,originalOrder.y,'normal target is preserved');
assert.ok(Math.hypot(inf.x-goal.x,inf.y-goal.y)<1.0,'blocker actually walks toward its pocket');
assert.ok((inf.yieldRetryAt||0)>g.time-.1,'yielding has a brief repeat cooldown');

// Stationary hold-position troops are not displaced by others.
reset();
const mover=g.add(0,'tank',11,12),sentry=g.add(0,'soldier',11.85,12);
sentry.stance='hold';
assert.equal(g.tryTrafficYield(mover,1,0),false,'hold-position defenders keep their post');
assert.equal(sentry.yieldOrder,undefined);
// Opponents never cooperate by yielding to hostile moves.
reset();
const attacker=g.add(0,'tank',11,12),hostile=g.add(1,'soldier',11.85,12);
assert.equal(g.tryTrafficYield(attacker,1,0),false,'enemy units never yield');
assert.equal(hostile.yieldOrder,undefined);

// A full ore truck can detour around a stationary friendly Hold defender.
// The sentry stays put; only the truck receives a short lateral yield order.
reset();
const loaded=g.add(0,'harvester',11,12),parked=g.add(0,'soldier',11.85,12);
loaded.load=360;parked.stance='hold';
assert.equal(g.tryTrafficYield(loaded,1,0),true,
  'full harvester may use its own safe pocket when a friendly sentry cannot yield');
assert.ok(loaded.yieldOrder,'the loaded truck receives the temporary detour');
assert.equal(parked.yieldOrder,undefined,'hold-position defender never yields');
const pocket={...loaded.yieldOrder};
for(let i=0;i<130&&loaded.yieldOrder;i++)g.step(.05);
assert.equal(loaded.yieldOrder,null,'truck detour finishes and restores harvesting');
assert.ok(Math.hypot(loaded.x-pocket.x,loaded.y-pocket.y)<1,
  'the truck moves to the pocket without teleporting the defender');

// An idle Guard-position soldier that cannot yield should not indefinitely
// pin a full truck. The soldier's own order/stance must remain untouched.
reset();
const guardTruck=g.add(0,'harvester',11,12),guard=g.add(0,'soldier',11.85,12);
guardTruck.load=360;guard.stance='guard';
guard.stunnedUntil=g.time+10;
assert.equal(g.tryTrafficYield(guardTruck,1,0),true,
  'loaded harvester can detour when an idle Guard soldier cannot yield');
assert.ok(guardTruck.yieldOrder);
assert.equal(guard.yieldOrder,undefined);
assert.equal(guard.stance,'guard');
const guardPocket={...guardTruck.yieldOrder};
for(let i=0;i<130&&guardTruck.yieldOrder;i++)g.step(.05);
assert.ok(Math.hypot(guardTruck.x-guardPocket.x,guardTruck.y-guardPocket.y)<1,
  'loaded truck can actually travel into a collision-safe guard passing pocket');

// No legal shoulder: the loaded truck cannot invent a route through water.
reset();
const trapped=g.add(0,'harvester',11,12),fixed=g.add(0,'soldier',11.85,12);
trapped.load=360;fixed.stance='hold';
g.water=(x,y)=>!(y>11.6&&y<12.4);
assert.equal(g.tryTrafficYield(trapped,1,0),false,
  'a blocked lateral pocket cannot be used as an escape');
assert.equal(trapped.yieldOrder,undefined);
assert.equal(fixed.yieldOrder,undefined);
g.water=()=>false;

// When the terrain has no pocket, no order is created and no teleport occurs.
reset();
const first=g.add(0,'heavy',11,12),other=g.add(0,'soldier',11.85,12);
g.water=(x,y)=>!(y>11.6&&y<12.4);
const positions=[[first.x,first.y],[other.x,other.y]];
assert.equal(g.tryTrafficYield(first,1,0),false,'impossible corridor does not invent side space');
assert.ok(!other.yieldOrder);
for(let i=0;i<20;i++)g.move(first,17,12,.04);
assert.ok(Math.abs(first.y-positions[0][1])<.42,'blocked unit stays inside corridor');
assert.ok(!g.water(first.x,first.y),'unit does not enter solid water');

// Persist a valid yield over a local save, and resume without corrupting
// the temporary collision index or the original movement order.
g.water=()=>false;
reset();
const lead=g.add(0,'harvester',11,12),follower=g.add(0,'soldier',11.9,12);
lead.load=180;follower.order={type:'move',x:5,y:8};
assert.ok(g.tryTrafficYield(lead,1,0));
assert.ok(g.saveGame());
const memory=JSON.parse(localStorage.getItem('chrono-dominion-skirmish-v1'));
assert.ok(memory.entities.some(e=>e.id===follower.id&&e.yieldOrder),'save includes resumable yield');
assert.ok(g.loadGame());
const restored=g.entityById(follower.id);
assert.ok(restored?.yieldOrder);
assert.equal(restored.order?.x,5);
assert.equal(g.unitBuckets,null);
// Fresh player orders override the temporary courtesy manoeuvre immediately.
g.selected=[restored.id];
g.command({gx:19,gy:19},{shiftKey:false});
assert.equal(restored.yieldOrder,null,'new direct destination overrides temporary yield');
assert.equal(restored.order?.type,'move');
assert.equal(restored.yieldRetryAt,0);
restored.yieldOrder={x:9,y:9,expires:g.time+3};
assert.equal(g.unitAction('stop'),true);
assert.equal(restored.yieldOrder,null,'stop stance immediately cancels yielding');
assert.equal(restored.order,null);
g.draw();
console.log('PASS: harvester priority, ally yielding, hold and hostile exclusions, no-pocket safety and save resume');
