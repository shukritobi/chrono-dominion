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
const g=window.__game,settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'expanse',difficulty:'standard',startingCredits:5000};
g.newMatch(settings);
assert.equal(g.worldSize,48);

// Alternating narrow openings force a 457-step path across the XL map.
// The former 1,450-heap-pop limit stopped before reaching this valid goal.
const walls=new Set();
for(let x=7,band=0;x<46;x+=3,band++)
  for(let y=1;y<47;y++)
    if(y!==(band%2===0?4:43))walls.add(x+','+y);
g.walkable=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&
  x>0&&y>0&&x<47&&y<47&&!walls.has(x+','+y);
const path=g.findPath(5,2,42,45);
assert.ok(path.length>200,'XL serpentine route should be substantially longer than direct distance');
assert.equal(path.at(-1)?.x,42,'A* must reach the actual distant destination');
assert.equal(path.at(-1)?.y,45,'A* must reach the actual distant destination');
let prev={x:5,y:2};
for(const point of path){
  assert.ok(g.walkable(point.x,point.y),'every waypoint is traversable');
  const dx=Math.abs(point.x-prev.x),dy=Math.abs(point.y-prev.y);
  assert.ok(dx<=1&&dy<=1&&dx+dy>0,'each waypoint is adjacent');
  if(dx&&dy)assert.ok(g.walkable(prev.x,point.y)&&g.walkable(point.x,prev.y),
    'diagonal movement never clips a corner');
  prev=point;
}

// A genuinely unreachable target still returns a safe partial route.
g.walkable=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&
  x>0&&y>0&&x<47&&y<47&&x!==24;
const partial=g.findPath(5,20,42,20);
assert.ok(partial.length>0,'unreachable destination yields a useful partial route');
assert.ok(partial.every(p=>p.x<24),'fallback never crosses an impassable barrier');

// Historical 34x34 navigation and localStorage save format remain intact.
delete g.walkable;
g.newMatch({...settings,map:'verdant'});
assert.equal(g.worldSize,34);
assert.equal(g.saveGame(),true);
assert.equal(g.loadGame(),true);
g.entities=[];
g.water=()=>false;
const legacy=g.findPath(8,12,23,12);
assert.equal(legacy.length,15,'legacy open-terrain shortest path is unchanged');
assert.equal(legacy.at(-1)?.x,23);
assert.equal(window.ChronoDominion.version,'2.40.0');
console.log('v2.35 XL full-route A*, safe fallback, corner and save regression passed');
