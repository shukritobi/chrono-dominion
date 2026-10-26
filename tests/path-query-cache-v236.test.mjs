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

delete g.walkable;
assert.equal(g.saveGame(),true);
assert.equal(g.loadGame(),true);
assert.equal(window.ChronoDominion.version,'2.36.0');
console.log('v2.36 navigation cache, dynamic obstacles, formations and saves passed');
