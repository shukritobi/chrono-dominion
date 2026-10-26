import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const noop=()=>{},canvas=new Proxy({},{
  get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}
});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',disabled:false,style:{},dataset:{},
    classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
    addEventListener:noop,setAttribute:noop,querySelectorAll:()=>[],
    querySelector:()=>({disabled:true,textContent:''}),
    getContext:()=>canvas,setPointerCapture:noop,
    getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
    set innerHTML(v){this._html=v},get innerHTML(){return this._html||''},
    set textContent(v){this._text=v},get textContent(){return this._text||''}
  });
  return nodes.get(id);
}};
const localStorage={
  getItem:k=>storage.get(k)??null,
  setItem:(k,v)=>storage.set(k,String(v))
};
const window={addEventListener:noop};
runInNewContext(read('maps/catalog.js'),{window,console},{timeout:1000});
runInNewContext(read('game.js').replace('  new Game();','  window.__game=new Game();'),
  {window,document,console,localStorage,performance:{now:()=>0},
    devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop},
  {timeout:10000});
const g=window.__game;
const settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

// Single aircraft should be able to receive an order directly over water.
g.newMatch(settings);
const single=g.add(0,'aircraft',10,10);
g.selected=[single.id];
g.command({gx:25,gy:5},{shiftKey:false});
assert.equal(single.order.type,'move');
assert.equal(single.order.x,25);
assert.equal(single.order.y,5);
assert.equal(g.water(25,5),true);
const start=single.x;
g.move(single,single.order.x,single.order.y,.2);
assert.ok(single.x>start,'aircraft advances directly over water');

// Mixed selections must not force aircraft into ground-only reachable slots,
// nor assign ground troops to water or remove their orders.
g.newMatch(settings);
const a=g.add(0,'aircraft',10,10);
const b=g.add(0,'aircraft',11,10);
const infantry=g.add(0,'soldier',11,11);
g.selected=[a.id,b.id,infantry.id];
g.command({gx:25,gy:5},{shiftKey:true});
for(const plane of [a,b]){
  assert.equal(plane.order?.type,'attackMove');
  assert.ok(g.water(plane.order.x,plane.order.y),
    'aircraft may occupy water-based formation slots');
}
assert.ok(distance(a.order,b.order)>0,'aircraft get distinct flight slots');
assert.equal(infantry.order?.type,'attackMove');
assert.ok(g.walkable(infantry.order.x,infantry.order.y),
  'ground units retain connected, walkable destinations');
assert.equal(g.attackMoveArmed,false,'command mode resets normally');

// Ground-only formations keep the original path-connected behavior.
g.selected=[infantry.id];
g.command({gx:25,gy:5},{shiftKey:false});
assert.equal(infantry.order?.type,'move');
assert.ok(g.walkable(infantry.order.x,infantry.order.y));

// Existing local save key and orders remain compatible.
assert.ok(g.saveGame());
assert.ok(g.loadGame());
assert.equal(g.entityById(a.id)?.order?.type,'attackMove');
assert.equal(g.entityById(infantry.id)?.order?.type,'move');

// Flight formations also work on the new 48x48 map and do not clamp to 34.
g.newMatch({...settings,map:'expanse'});
const xl=g.add(0,'aircraft',12,15);
g.selected=[xl.id];
g.command({gx:24,gy:23},{shiftKey:false});
assert.equal(g.worldSize,48);
assert.equal(g.water(24,23),true);
assert.equal(xl.order.x,24);
assert.equal(xl.order.y,23);
assert.ok(g.saveGame());
assert.ok(g.loadGame());
assert.equal(g.entityById(xl.id)?.order?.x,24);
console.log('PASS: v2.23 independent air formations, mixed orders, XL map and saves');
