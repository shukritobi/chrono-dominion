import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const canvas=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',style:{},disabled:false,dataset:{},
    classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},
    querySelectorAll(){return[];},querySelector(){return{disabled:true,textContent:''}},
    getContext(){return canvas},
    getBoundingClientRect(){return{left:0,top:0,width:id==='world'?1024:272,height:id==='world'?700:144}},
    set innerHTML(v){this._h=v},get innerHTML(){return this._h||''},
    set textContent(v){this._t=v},get textContent(){return this._t||''}
  });return nodes.get(id);
}};
const window={addEventListener(){}};
runInNewContext(source,{window,document,console,performance:{now:()=>0},devicePixelRatio:1,
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},
  setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){}
},{timeout:10000});
const g=window.__game;
g.newMatch({playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000});
const scout=g.add(1,'recon',17,23);
const hostile={id:9981,owner:0,kind:'turret',type:'building',x:21,y:21,
  hp:100,maxHp:100,built:true};
// Physical hostile objects must never affect the planner without AI intel.
g.entities.push(hostile);
g.intel[1]=[];
assert.equal(g.scoutThreatPenalty({x:21,y:21}),0,
  'unseen hostile entities cannot leak their positions into scouting risk');
g.entities.pop();
const turretReport={id:hostile.id,x:21,y:21,time:g.time,type:'building',kind:'turret'};
g.intel[1]=[turretReport];
assert.ok(g.scoutThreatPenalty({x:21,y:21})>=200);
assert.equal(g.scoutThreatPenalty({x:5,y:5}),0);
const originalWaypoints=g.scoutWaypoints.bind(g),originalFrontiers=g.scoutFrontiers.bind(g);
const safe=originalWaypoints().find(p=>g.walkable(p.x,p.y)&&
  Math.hypot(p.x-scout.x,p.y-scout.y)>2&&g.scoutThreatPenalty(p)===0&&
  g.findPath(scout.x,scout.y,p.x,p.y).length>0);
assert.ok(safe,'map must offer at least one reachable safe landmark');
g.scoutWaypoints=()=>[{x:21,y:21},safe];
g.scoutFrontiers=()=>[];
assert.equal(g.assignScoutPatrol(scout),true,'scout finds safe alternative');
assert.equal(scout.order.x,safe.x,'observed turret blocks dangerous sector destination');
assert.equal(scout.order.y,safe.y);
assert.equal(g.scoutThreatPenalty(scout.order),0);
// Recent enemy combat units are also dangerous, but reports expire quickly.
g.intel[1]=[{id:9982,x:safe.x,y:safe.y,time:g.time,type:'unit',kind:'tank'}];
assert.ok(g.scoutThreatPenalty(safe)>=200);
g.time+=13;
assert.equal(g.scoutThreatPenalty(safe),0,'stale mobile threats expire');
g.intel[1]=[turretReport];
g.time=20;
assert.ok(g.scoutThreatPenalty({x:21,y:21})>=200,
  'previously observed static defenses remain dangerous');
// A newly discovered defense invalidates a previous move destination.
scout.order={type:'move',x:21,y:21};
g.entities.push(hostile); // Observed by the AI, not secretly inferred.
g.runAI();
g.entities=g.entities.filter(e=>e.id!==hostile.id);
assert.ok(!scout.order||scout.order.x!==21||scout.order.y!==21,
  'AI must replan a patrol whose destination becomes dangerous');
// A retreating scout must not receive a fresh patrol or harvester-defense order.
scout.order=null;
scout.retreatUntil=g.time+12;
scout.retreatCooldownAt=g.time+45;
g.runAI();
assert.equal(scout.order,null,'retreat cooldown keeps wounded recon out of patrol loop');
scout.retreatUntil=0;
g.runAI();
assert.equal(scout.order,null,'recovery cooldown persists after reaching shelter');
// Saved entity cooldown survives and old saves remain readable.
assert.equal(g.saveGame(),true);
const snapshot=JSON.parse(storage.get('chrono-dominion-skirmish-v1'));
assert.ok(snapshot.entities.some(e=>e.id===scout.id&&e.retreatCooldownAt>g.time));
assert.equal(g.loadGame(),true);
const restored=g.entityById(scout.id);
assert.ok(restored.retreatCooldownAt>g.time);
const old=JSON.parse(storage.get('chrono-dominion-skirmish-v1'));
for(const e of old.entities)delete e.retreatCooldownAt;
storage.set('chrono-dominion-skirmish-v1',JSON.stringify(old));
assert.equal(g.loadGame(),true,'legacy saves omit optional scout recovery metadata');
g.scoutWaypoints=originalWaypoints;
g.scoutFrontiers=originalFrontiers;
console.log('PASS: fog-honest scout risk, safe patrol rerouting, stale intel, recovery cooldown and saves');
