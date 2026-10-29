import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const elements=new Map(),storage=new Map();
const document={getElementById(id){
  if(!elements.has(id))elements.set(id,{
    value:'',style:{},disabled:false,
    classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},
    querySelectorAll(){return[]},querySelector(){return{disabled:true,textContent:''}},
    getContext(){return ctx},
    getBoundingClientRect(){return{left:0,top:0,width:id==='world'?1024:272,height:id==='world'?700:144}},
    set innerHTML(v){this._h=v},get innerHTML(){return this._h||''},
    set textContent(v){this._t=v},get textContent(){return this._t||''}
  });return elements.get(id);
}};
const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))};
const window={addEventListener(){}};
runInNewContext(source,{window,document,localStorage,console,performance:{now:()=>0},
  setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){},devicePixelRatio:1},{timeout:5000});
const g=window.__game,settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'desert',difficulty:'standard',startingCredits:5000};
g.newMatch(settings);
const savedWater=g.water;
g.water=()=>false;
g.entities=[];g.ores=[];
const refinery=g.add(0,'refinery',12,12);
const harvester=g.add(0,'harvester',15,12);
g.ores=[{x:12,y:12,amount:1200,max:1200},{x:18,y:12,amount:1200,max:1200}];
assert.equal(g.chooseHarvestDeposit(harvester),1,
  'harvester does not select ore submerged under a friendly building');
g.processHarvester(harvester,.1);
assert.equal(harvester.oreIndex,1);
assert.ok(harvester.order===null||harvester.order.type!=='attack');

// A direct but separated deposit is less useful than another across open
// ground. Use an unbroken vertical water barrier for the test.
g.entities=[];g.ores=[];
const riverFarmer=g.add(0,'harvester',10,12);
g.ores=[{x:18,y:12,amount:1200,max:1200},{x:8,y:12,amount:1200,max:1200}];
g.water=(x,y)=>x>=14&&x<=15;
assert.equal(g.chooseHarvestDeposit(riverFarmer),1,
  'pathfinding skips the closer-looking but unreachable deposit across water');

// Stalled harvesters may blacklist one ore location and choose another.
g.water=()=>false;
riverFarmer.oreSkipIndex=1;
riverFarmer.oreSkipUntil=g.time+16;
assert.equal(g.chooseHarvestDeposit(riverFarmer),0,'temporary blacklist prevents repeating blocked ore');
riverFarmer.oreSkipUntil=g.time-1;
assert.equal(g.chooseHarvestDeposit(riverFarmer),1,'blacklist expires');

// A missing persisted ore index is fine: older save data must be compatible.
g.water=savedWater;
g.newMatch(settings);
const live=g.entities.find(e=>e.owner===1&&e.kind==='harvester');
delete live.oreIndex;
assert.ok(g.saveGame());
assert.ok(g.loadGame());
const restored=g.entityById(live.id);
assert.ok(restored);
g.processHarvester(restored,.08);
assert.ok(Number.isInteger(restored.oreIndex),'older harvesters can choose a new ore destination');
// A full truck must not choose a closer-looking refinery across an
// impassable river when another owned, operational depot is reachable.
g.entities=[];g.ores=[];g.water=(x,y)=>x>=14&&x<=15;
const isolatedDepot=g.add(0,'refinery',18,12);
const reachableDepot=g.add(0,'refinery',4,12);
const returningTruck=g.add(0,'harvester',12,12);
returningTruck.load=360;
let returnRoute=g.chooseHarvesterReturn(returningTruck);
assert.equal(returnRoute.refinery.id,reachableDepot.id,
  'loaded harvester selects reachable depot rather than closer isolated depot');
const originalMove=g.move;
let requested=null;
g.move=(_unit,x,y)=>{requested={x,y};return false;};
g.processHarvester(returningTruck,.1);
assert.equal(requested.x,returnRoute.x,'return movement uses reachable approach X');
assert.equal(requested.y,returnRoute.y,'return movement uses reachable approach Y');
g.move=originalMove;
assert.ok(!Object.keys(returningTruck).some(k=>k.startsWith('returnRefinery')),
  'refinery route cache must not add fields to saved entities');

// A destroyed selected depot invalidates the cache immediately; a newly
// built reachable one can be selected on the next bounded route refresh.
reachableDepot.hp=0;
returnRoute=g.chooseHarvesterReturn(returningTruck);
assert.equal(returnRoute.refinery.id,isolatedDepot.id,
  'if all routes are blocked, preserve the old nearest-depot fallback');
const rebuiltDepot=g.add(0,'refinery',10,17);
g.time+=7;
returnRoute=g.chooseHarvesterReturn(returningTruck);
assert.equal(returnRoute.refinery.id,rebuiltDepot.id,
  'route refresh selects a newly operational reachable depot');
const enemyDepot=g.add(1,'refinery',12,10);
g.time+=7;
assert.equal(g.chooseHarvesterReturn(returningTruck).refinery.id,rebuiltDepot.id,
  'harvester cannot unload at an enemy refinery');

// Preserve the old exact approach and behavior when there is only one
// friendly depot, which covers the established natural-match economy.
g.entities=[];g.water=()=>false;
const soleDepot=g.add(0,'refinery',9,9);
const soloTruck=g.add(0,'harvester',17,9);
soloTruck.load=360;
returnRoute=g.chooseHarvesterReturn(soloTruck);
assert.equal(returnRoute.refinery.id,soleDepot.id);
assert.equal(returnRoute.x,soleDepot.x+1.9);
assert.equal(returnRoute.y,soleDepot.y+1.3);


// An AI harvester should not repeatedly select a visible enemy's firing
// position when a comparably near, reachable ore deposit is available.
// Hidden enemies, player workers and single-deposit fallback remain unchanged.
for(const faction of ['coalition','federation','psionic']){
  g.newMatch({...settings,enemyFaction:faction});
  g.entities=[];g.water=()=>false;g.time=100;
  const worker=g.add(1,'harvester',14,14);
  const attacker=g.add(0,'soldier',17,14);
  g.ores=[
    {x:16,y:14,amount:1200,max:1200},
    {x:12,y:18,amount:1200,max:1200}
  ];
  assert.ok(g.sideCanSee(1,attacker),
    faction+': only a genuinely visible enemy can mark ore as unsafe');
  assert.equal(g.chooseHarvestDeposit(worker),1,
    faction+': select nearby safe ore instead of a visible firing position');
  assert.ok(g.saveGame()&&g.loadGame(),
    faction+': threat-aware ore selection must not add save fields');
  const restored=g.entityById(worker.id);
  assert.equal(g.chooseHarvestDeposit(restored),1,
    faction+': the same ore choice survives legacy save/load');
  const hostile=g.entityById(attacker.id);
  hostile.x=20;
  g.ores[0].x=17;
  assert.equal(g.sideCanSee(1,hostile),false,
    faction+': distant hostile is outside the worker sensor radius');
  assert.equal(g.chooseHarvestDeposit(restored),0,
    faction+': never avoid ore using an enemy hidden from AI sensors');
  hostile.x=17;g.ores[0].x=16;g.ores=[g.ores[0]];
  assert.equal(g.chooseHarvestDeposit(restored),0,
    faction+': keep harvesting when every available deposit is contested');

  g.entities=[];g.ores=[
    {x:16,y:14,amount:1200,max:1200},
    {x:12,y:18,amount:1200,max:1200}
  ];
  const playerWorker=g.add(0,'harvester',14,14);
  g.add(1,'soldier',17,14);
  assert.equal(g.chooseHarvestDeposit(playerWorker),0,
    faction+': player ore selection retains original nearest-first behavior');
}

console.log('PASS: reachable ore, visible-threat avoidance, multi-refinery returns and saves');
