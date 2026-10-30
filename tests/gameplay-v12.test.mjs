import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game = new Game();');
const counts={ellipse:0,stroke:0,fill:0};
const ctx=new Proxy({}, {get(obj,key){
  if(key in obj)return obj[key];
  if(key in counts)return()=>{counts[key]++;};
  return()=>{};
},set(obj,k,value){obj[k]=value;return true;}});
const nodes=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',style:{},disabled:false,classList:{add(){},remove(){},toggle(){}},
    addEventListener(){},querySelectorAll(){return[];},querySelector(){return{disabled:true,textContent:''};},
    getContext(){return ctx;},getBoundingClientRect(){return{width:id==='world'?1100:272,height:id==='world'?700:144,left:0,top:0};},
    set innerHTML(v){this._html=v;},get innerHTML(){return this._html||'';},
    set textContent(v){this._text=v;},get textContent(){return this._text||'';}
  });return nodes.get(id);
}};
const store=new Map();
const localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))};
const window={addEventListener(){}};
runInNewContext(source,{window,document,localStorage,console,performance:{now:()=>0},
  requestAnimationFrame(){},devicePixelRatio:1,setTimeout:()=>1,clearTimeout(){}
},{timeout:4000});
const g=window.__game;
const settings={playerFaction:'coalition',enemyFaction:'federation',map:'verdant',difficulty:'recruit',startingCredits:5000};
const reset=()=>g.newMatch(settings);

// Unreachable clicks must end on reachable ground, never cross a water wall
// or falsely claim completion while more than two cells away.
reset();
g.entities=[];
const realWater=g.water;
g.water=(x,y)=>x>=16&&x<=18;
const mover=g.add(0,'soldier',12,12);
const path=g.findPath(12,12,25,12);
assert.ok(path.length>0,'A* provides accessible partial route');
assert.ok(path.every(p=>p.x<16),'no waypoint crosses complete water barrier');
assert.ok(path.at(-1).x>=14,'closest reachable shoreline is selected');
let arrived=false;
for(let i=0;i<200;i++){
  arrived=g.move(mover,25,12,.08);
  assert.ok(mover.x<16,'unit never clips through impassable wall');
  if(arrived)break;
}
assert.ok(arrived,'unit completes the nearest reachable landing point');
assert.ok(Math.abs(mover.x-25)>8,'unit did not teleport or claim direct arrival');
g.water=realWater;

// The AI must not select distant undiscovered structures on the first tick.
reset();
g.time=100;g.nextAI=Infinity;
const playerHQ=g.entities.find(e=>e.owner===0&&e.kind==='hq');
const enemyHQ=g.entities.find(e=>e.owner===1&&e.kind==='hq');
assert.equal(g.sideCanSee(1,playerHQ),false,'enemy has no map-wide base vision');
const fighter1=g.add(1,'soldier',25,23),fighter2=g.add(1,'soldier',24,23);
g.runAI();
assert.ok(!g.intel[1].some(k=>k.id===playerHQ.id),'AI intel cannot see unseen HQ');
assert.ok(!fighter1.order||fighter1.order.id!==playerHQ.id,'AI cannot lock unseen base');

// A scout should discover real positions; last-seen contacts persist after scout leaves.
const scout=g.add(1,'recon',7,7);
const seen=g.updateIntel(1);
assert.ok(seen.some(x=>x.id===playerHQ.id&&x.type==='building'),'AI scout reveals a real building');
assert.ok(g.sideCanSee(1,playerHQ));
scout.hp=0;g.time+=1;g.updateIntel(1);
assert.ok(!g.sideCanSee(1,playerHQ),'visibility ends when scout is removed');
assert.ok(g.intel[1].some(x=>x.id===playerHQ.id),'brief last-seen position memory remains');
// Recruit difficulty needs five unreserved fighters for an assault. The
// existing base tank is now reserved for the operational refinery.
g.add(1,'soldier',25,24);
g.runAI();
assert.ok(g.aiPlatoon?.phase==='rally'&&g.aiPlatoon.ids.length>=3,
  'AI forms a scouting-informed platoon instead of sending one fighter to attack');
assert.ok(g.aiPlatoon.ids.every(id=>g.entityById(id)?.order?.type==='move'),
  'platoon members receive coordinated rally orders before assault');
assert.ok(g.saveGame());
const saved=JSON.parse(store.get('chrono-dominion-skirmish-v1'));
assert.ok(saved.intel[1].some(x=>x.id===playerHQ.id),'intel persisted in skirmish save');
g.intel=[[],[]];assert.equal(g.loadGame(),true);
assert.ok(g.intel[1].some(x=>x.id===playerHQ.id),'intel restored from save');

// AI must not learn of enemy destruction while all its eyes are elsewhere.
reset();
const enemyObserver=g.add(1,'recon',6,7),unseenHQ=g.entities.find(e=>e.owner===0&&e.kind==='hq');
g.time=31;g.updateIntel(1);
assert.ok(g.intel[1].some(x=>x.id===unseenHQ.id),'scout recorded enemy building');
enemyObserver.hp=0;
unseenHQ.hp=0;
g.time+=.5;g.updateIntel(1);
assert.ok(g.intel[1].some(x=>x.id===unseenHQ.id),
  'destroyed buildings remain last-known contacts until sight confirms absence');
// An enemy witness returning should reveal that the building no longer exists.
const witness=g.add(1,'recon',7,7);
g.updateIntel(1);
assert.ok(!g.intel[1].some(x=>x.id===unseenHQ.id),
  'old contact is cleared when scouts inspect its empty last-known location');
witness.hp=0;

// Damaged structures render smoke/cracks; repair sparks and destruction rubble.
reset();
const building=g.entities.find(e=>e.owner===0&&e.kind==='generator');
building.hp=building.maxHp*.21;building.repairing=true;
const ellipseBefore=counts.ellipse,strokeBefore=counts.stroke;
g.drawBuildingCondition(building,92,62);
assert.ok(counts.ellipse>ellipseBefore,'critical damage produces smoke clouds');
assert.ok(counts.stroke>strokeBefore,'visible cracks and repair sparks are drawn');
const particleCount=g.particles.length;
g.recordLoss(building,1);
assert.equal(g.particles.filter(p=>p.type==='debris').length,7,'building destruction releases rubble');
g.recordLoss(building,1);
assert.equal(g.particles.length,particleCount+7,'losses create debris only once');
g.drawEffects();
console.log('PASS: reachable A* fallback, fog-limited AI, intel save round-trip, damaged buildings and rubble');
