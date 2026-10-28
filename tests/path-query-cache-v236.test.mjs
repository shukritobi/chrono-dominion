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

const blocked=new Set(),calls=new Map();
for(let y=1;y<47;y++)blocked.add('22,'+y);
const gap=y=>blocked.delete('22,'+y);
g.walkable=(x,y)=>{
  const k=x+','+y;
  calls.set(k,(calls.get(k)||0)+1);
  return Number.isInteger(x)&&Number.isInteger(y)&&
    x>=1&&y>=1&&x<=46&&y<=46&&!blocked.has(k);
};
const unique=label=>{
  assert.ok(calls.size>0,label+' must probe tiles');
  assert.ok([...calls.values()].every(n=>n===1),
    label+' must probe each tile no more than once per request');
};

gap(40);
let path=g.findPath(6,6,40,6);
assert.equal(path.at(-1)?.x,40);
assert.equal(path.at(-1)?.y,6);
assert.ok(path.some(p=>p.x===22&&p.y===40),'first route uses southern opening');
unique('XL A* southern detour');

calls.clear();
blocked.add('22,40');gap(5);
path=g.findPath(6,6,40,6);
assert.equal(path.at(-1)?.x,40);
assert.equal(path.at(-1)?.y,6);
assert.ok(path.some(p=>p.x===22&&p.y===5),'new path sees northern opening');
assert.ok(!path.some(p=>p.x===22&&p.y===40),'closed opening stays blocked');
unique('XL A* after terrain change');

calls.clear();
blocked.add('22,5');
let connected=g.reachableTiles({x:6,y:6});
assert.ok(connected.has('6,6'));
assert.ok(!connected.has('40,6'),'solid wall disconnects the battlefield');
unique('connected-area flood-fill');

const slots=g.formationSlots(40,6,4,{x:6,y:6});
assert.equal(slots.length,4,'formations still find reachable slots');
assert.ok(slots.every(p=>p.x<22),'formations stay on the connected side');

calls.clear();
gap(40);
connected=g.reachableTiles({x:6,y:6});
assert.ok(connected.has('40,6'),'new flood-fill sees reopened gap');
unique('flood-fill after terrain change');

// Packed navigation cache keys must preserve the *live* walkability result
// for every XL tile, including fractional building footprints and water.
delete g.walkable;
const savedEntities=g.entities,savedWater=g.water,savedBuckets=g.buildingBuckets;
const footprint={id:98765,type:'building',kind:'generator',owner:0,
  x:12.5,y:13.25,hp:500,built:true};
g.entities=[footprint];
g.buildingBuckets=null;
g.water=(x,y)=>x===17&&y>=10&&y<=14;
const assertWalkParity=label=>{
  const walk=g.navigationWalk();
  for(let y=0;y<g.worldSize;y++)for(let x=0;x<g.worldSize;x++){
    assert.equal(walk(x,y),g.walkable(x,y),
      label+': tile '+x+','+y+' must match the live engine');
    assert.equal(walk(x,y),g.walkable(x,y),
      label+': repeat lookup must not change passability');
  }
  return walk;
};
let cached=assertWalkParity('fractional footprint and water');
assert.equal(cached(12,13),false,'fractional footprint blocks its covered tiles');
assert.equal(cached(17,12),false,'water stays impassable');
footprint.hp=0;
cached=assertWalkParity('destroyed footprint');
assert.equal(cached(12,13),true,'new query must see destroyed building removed');
footprint.hp=500;footprint.x=27.5;footprint.y=27.25;
cached=assertWalkParity('relocated footprint');
assert.equal(cached(12,13),true,'old location reopens after moving building');
assert.equal(cached(27,27),false,'new footprint blocks its new location');

// Fractional coordinates and out-of-grid custom hooks must not collide
// with packed in-grid keys, and each unique probe is cached once.
let customProbes=0;
g.walkable=(x,y)=>{customProbes++;return x===.5&&y===.25;};
const customWalk=g.navigationWalk();
assert.equal(customWalk(.5,.25),true);
assert.equal(customWalk(.5,.25),true);
assert.equal(customWalk(0,0),false);
assert.equal(customWalk(0,0),false);
assert.equal(customWalk(1,0),false);
assert.equal(customWalk(1,0),false);
assert.equal(customProbes,3,'custom fractional and boundary probes cached separately');
g.entities=savedEntities;g.water=savedWater;g.buildingBuckets=savedBuckets;

delete g.walkable;
assert.equal(g.saveGame(),true);
assert.equal(g.loadGame(),true);
assert.equal(window.ChronoDominion.version,'2.42.0');
console.log('v2.36 navigation cache, dynamic obstacles, formations and saves passed');
