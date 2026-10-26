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
console.log('PASS: blocked refinery ore, river isolation, stalled-deposit blacklisting and old-save recovery');
