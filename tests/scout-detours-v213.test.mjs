import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const noop=()=>{},drawing=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',style:{},disabled:false,dataset:{},
    classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,
    setAttribute:noop,querySelectorAll:()=>[],
    querySelector:()=>({disabled:true,textContent:''}),getContext:()=>drawing,
    setPointerCapture:noop,
    getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
    set innerHTML(v){this._html=v},get innerHTML(){return this._html||''},
    set textContent(v){this._text=v},get textContent(){return this._text||''}
  });return nodes.get(id);
}};
const window={addEventListener:noop};
runInNewContext(source,{window,document,console,performance:{now:()=>0},
  devicePixelRatio:1,localStorage:{
    getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))
  },setTimeout:()=>1,clearTimeout:noop,requestAnimationFrame:noop},{timeout:10000});
const g=window.__game;
g.newMatch({playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000});
const scout=g.add(1,'recon',4,16);
g.walkable=(x,y)=>x>=1&&y>=1&&x<=32&&y<=32;
const danger=p=>p.x===6&&p.y>=2&&p.y<=28?200:0;
g.scoutThreatPenalty=danger;
const weighted=g.findPath(4,16,10,16,null,p=>danger(p)/25);
assert.ok(weighted.some(p=>danger(p)>=200),
  'baseline cheap weighted route crosses the reported defense');
const safe=g.scoutPath(scout,{x:10,y:16});
assert.ok(safe&&safe.path.length>weighted.length,'planner finds a longer safe detour');
assert.ok(safe.path.every(p=>danger(p)<200),'planner excludes defended tiles');
scout.order={type:'move',x:10,y:16};
g.move(scout,10,16,.1);
assert.ok(scout.path.length&&scout.path.every(p=>danger(p)<200),
  'movement follows the same safe detour as patrol planning');
scout.retreatUntil=g.time+8;
scout.path=[];scout.pathTarget=null;scout.pathRecheck=0;
g.move(scout,10,16,.1);
assert.ok(scout.path.length&&scout.path.every(p=>danger(p)<200),
  'retreat cooldown must not bypass the safe route');
g.walkable=(x,y)=>x>=4&&x<=10&&y===16;
assert.equal(g.scoutPath(scout,{x:10,y:16}),null,
  'defended one-tile chokepoint still cannot be crossed');
g.walkable=(x,y)=>x>=1&&y>=1&&x<=32&&y<=32;
g.scoutThreatPenalty=()=>0;
assert.ok(g.scoutPath(scout,{x:10,y:16}),
  'scouts still travel normally when no threats are known');
assert.equal(g.saveGame(),true);
assert.equal(g.loadGame(),true);
console.log('PASS: v2.13 safe detour fallback, movement parity, retreat, chokepoint and saves');
