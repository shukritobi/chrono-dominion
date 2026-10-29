import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const noop=()=>{},drawing=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',disabled:false,style:{},dataset:{},
    classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
    addEventListener:noop,setAttribute:noop,querySelectorAll:()=>[],
    querySelector:()=>({disabled:true,textContent:''}),
    getContext:()=>drawing,setPointerCapture:noop,
    getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
    set innerHTML(v){this._html=v},get innerHTML(){return this._html||''},
    set textContent(v){this._text=v},get textContent(){return this._text||''}
  });return nodes.get(id);
}};
const window={addEventListener:noop};
const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
runInNewContext(read('maps/catalog.js'),{window,console},{timeout:1000});
runInNewContext(read('game.js').replace('  new Game();','  window.__game=new Game();'),{
  window,document,console,localStorage,performance:{now:()=>0},
  devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop
},{timeout:10000});
const g=window.__game;
g.newMatch({playerFaction:'coalition',enemyFaction:'federation',
  map:'expanse',difficulty:'standard',startingCredits:5000});
assert.equal(g.worldSize,48);

const originalEntities=g.entities,originalWater=g.water;
g.water=()=>false;
g.entities=[];
const building=(id,x,y,hp=100)=>({id,type:'building',kind:'power',x,y,hp,maxHp:100,owner:0});
for(let i=0;i<100;i++)g.entities.push(building(20000+i,2+i%10,2+Math.floor(i/10)));
const blocker=building(21000,23,23);
g.entities.push(blocker);

// Navigation must not invoke Array.some for every tile in a crowded map.
let entityScans=0;
g.entities.some=function(...args){
  entityScans++;
  return Array.prototype.some.apply(this,args);
};
let path=g.findPath(19,23,27,23);
assert.deepEqual([path.at(-1)?.x,path.at(-1)?.y],[27,23]);
assert.ok(path.some(p=>p.y!==23),'active building forces a detour');
assert.equal(entityScans,0,'A* must use indexed footprints, not repeated entity scans');
assert.ok(path.every(p=>g.walkable(p.x,p.y)),'route never enters a building');

entityScans=0;
const connected=g.reachableTiles({x:19,y:23});
assert.ok(connected.has('27,23'),'flood-fill still reaches around the building');
const slots=g.formationSlots(27,23,6,{x:19,y:23});
assert.equal(slots.length,6);
assert.equal(entityScans,0,'flood-fill and formation search use indexed footprints');

// The index must be discarded after every query, including when a building
// moves, dies, or water changes. No stale obstacle state can enter saves.
blocker.x=31;
path=g.findPath(19,23,27,23);
assert.ok(path.some(p=>p.x===23&&p.y===23),'moved building frees its old tile');
blocker.x=23;blocker.hp=0;
assert.equal(g.navigationWalk()(23,23),true,'destroyed building is passable');
blocker.hp=100;blocker.x=23.5;blocker.y=23.5;
const walk=g.navigationWalk();
assert.equal(walk(22,22),true,'strict footprint excludes exact 1.5-tile boundary');
assert.equal(walk(23,23),false);
assert.equal(walk(24,24),false);
assert.equal(walk(25,25),true);

g.water=(x,y)=>x===26&&y===23;
assert.equal(g.navigationWalk()(26,23),false,'terrain water remains authoritative');
g.water=()=>false;
assert.equal(g.navigationWalk()(26,23),true,'later queries observe terrain changes');

// Custom walkable hooks must still be called and cached exactly once per tile.
let customCalls=0;
g.walkable=(x,y)=>{customCalls++;return x!==24;};
const custom=g.navigationWalk();
assert.equal(custom(24,23),false);
assert.equal(custom(24,23),false);
assert.equal(custom(23,23),true,'custom hook overrides indexed building rules');
assert.equal(customCalls,2);
delete g.walkable;

// Many paths during one movement tick must share a single immutable building
// footprint, while retaining a separate water/tile cache for every request.
g._movementNavCache={blocked:null};
const firstWalk=g.navigationWalk();
const sharedFootprint=g._movementNavCache.blocked;
assert.equal(Object.prototype.toString.call(sharedFootprint),'[object Set]',
  'movement phase creates an indexed footprint');
assert.equal(firstWalk(23,23),false,'active blocker remains impassable');
const secondWalk=g.navigationWalk();
assert.equal(g._movementNavCache.blocked,sharedFootprint,
  'second route reuses the same building footprint');
assert.equal(secondWalk(23,23),false);
g.water=(x,y)=>x===26&&y===23;
assert.equal(g.navigationWalk()(26,23),false,
  'a new route observes current water even with a shared building footprint');
g.water=()=>false;
assert.equal(g.navigationWalk()(26,23),true,
  'water probes are not shared across navigation queries');
g._movementNavCache=null;
blocker.hp=0;
assert.equal(g.navigationWalk()(23,23),true,
  'after movement, a destroyed building is immediately passable');
blocker.hp=100;

g.entities=originalEntities;g.water=originalWater;
// The real step() must establish and release the frame cache, including when
// multiple ordinary units request their initial route in the same tick.
g.nextAI=Infinity;g.updateUI=noop;
const navWalk=g.navigationWalk.bind(g),phaseFootprints=[];
g.navigationWalk=(...args)=>{
  const walk=navWalk(...args);
  if(g._movementNavCache?.blocked)phaseFootprints.push(g._movementNavCache.blocked);
  return walk;
};
const moverA=g.add(0,'soldier',12,17),moverB=g.add(0,'soldier',12,19);
moverA.order={type:'move',x:32,y:17};
moverB.order={type:'move',x:32,y:19};
g.step(.2);
assert.ok(phaseFootprints.length>=2,
  'two real movement orders must query navigation during the same tick');
assert.ok(phaseFootprints.every(blocked=>blocked===phaseFootprints[0]),
  'all real movement-phase routes reuse one building footprint');
assert.equal(g._movementNavCache,null,
  'the footprint is discarded before projectiles and production');
g.navigationWalk=navWalk;
assert.equal(g.saveGame(),true);
assert.equal(g.loadGame(),true);
assert.equal(window.ChronoDominion.version,'2.42.0');
console.log('v2.37 indexed XL navigation, dynamic obstacles, custom hooks and saves passed');
