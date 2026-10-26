import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const js=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const context=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    value:'',style:{},disabled:false,classList:{add(){},remove(){},toggle(){}},
    addEventListener(){},setAttribute(){},querySelectorAll(){return[];},
    querySelector(){return{disabled:true,textContent:''}},
    getContext(){return context},
    getBoundingClientRect(){return{left:0,top:0,width:id==='world'?1024:272,height:id==='world'?700:144}},
    set innerHTML(v){this._html=v;},get innerHTML(){return this._html||'';},
    set textContent(v){this._text=v;},get textContent(){return this._text||'';}
  });return nodes.get(id);
}};
const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))};
const window={addEventListener(){}};
runInNewContext(js,{window,document,localStorage,console,performance:{now:()=>0},
  requestAnimationFrame(){},setTimeout(){return 1},clearTimeout(){},devicePixelRatio:1},{timeout:5000});
const g=window.__game;
const settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000};
g.newMatch(settings);
const scout=g.add(1,'recon',30,20); // passable starting tile outside all buildings
const playerHQ=g.entities.find(e=>e.owner===0&&e.kind==='hq');
const enemyHQ=g.entities.find(e=>e.owner===1&&e.kind==='hq');
assert.equal(g.sideCanSee(1,playerHQ),false,'enemy HQ not revealed by default');
assert.ok(g.scoutWaypoints().length>7,'recon has map-wide exploration sectors');
assert.equal(g.assignScoutPatrol(scout),true);
assert.equal(scout.order.type,'move','scout should move rather than initiate a suicidal attack');
assert.ok(Math.hypot(scout.order.x-enemyHQ.x,scout.order.y-enemyHQ.y)>4,
  'initial scouting patrol explores beyond its own base');
assert.ok(g.intel[1].every(k=>k.id!==playerHQ.id),
  'planning a patrol must not reveal unseen enemy buildings');

// A blocked first landmark must be skipped, rather than stalling a scout.
const originalWater=g.water;
g.water=(x,y)=>x>=20&&x<=22&&y>=20&&y<=22;
scout.patrolIndex=0;
assert.equal(g.assignScoutPatrol(scout),true);
assert.notDeepEqual({x:scout.order.x,y:scout.order.y},{x:21,y:21},
  'blocked waypoint is skipped');
g.water=originalWater;

// Contact requires actual sensor coverage. Once discovered, the normal
// intel-driven platoon planner may act on that report.
g.time=100;
scout.x=9;scout.y=7;
assert.ok(g.sideCanSee(1,playerHQ),'recon now observes enemy command base');
g.runAI();
const report=g.intel[1].find(k=>k.id===playerHQ.id);
assert.ok(report&&report.type==='building','actual reconnaissance records enemy HQ');
assert.ok(g.aiPlatoon&&['rally','assault'].includes(g.aiPlatoon.phase),
  'scouted structure unlocks an ordinary AI platoon plan');
const chosenReport=g.intel[1].find(k=>k.id===g.aiPlatoon.targetId&&k.type==='building');
assert.ok(chosenReport,'platoon target must be an actually scouted building');
assert.ok(g.aiPlatoon.target.x===chosenReport.x&&g.aiPlatoon.target.y===chosenReport.y,
  'platoon uses observed coordinates');

// Recon is not commandeered by routine tactical fire allocation; its
// dedicated harvester-defense logic is preserved in runAI.
const soldier=g.entities.find(e=>e.owner===0&&e.kind==='soldier');
soldier.x=10;soldier.y=7;
const fighters=g.entities.filter(e=>e.owner===1&&e.type==='unit'&&e.kind!=='harvester');
const assignments=g.assignAIEngagements(fighters,[],enemyHQ);
assert.equal(assignments.has(scout.id),false,'scout remains available for exploration');

// Patrol state is embedded in entity saves and survives a reload.
scout.patrolIndex=6;
scout.order={type:'move',x:26,y:8};
assert.ok(g.saveGame());
assert.ok(g.loadGame());
const restored=g.entityById(scout.id);
assert.equal(restored.patrolIndex,6);
assert.equal(restored.order.type,'move');
assert.equal(restored.order.x,26);
assert.equal(g.aiPlatoon.targetId,chosenReport.id);
console.log('PASS: sector exploration, blocked routes, honest building discovery, platoon launch and scout save/load');
