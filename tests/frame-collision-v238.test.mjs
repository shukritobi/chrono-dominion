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
g.water=()=>false;
g.nextAI=Infinity;g.nextFog=Infinity;g.nextUi=Infinity;

// Dense, distant structures must not be revisited for every nearby movement
// and narrow-lane probe, while ordinary out-of-frame queries stay live.
for(let i=0;i<120;i++)g.entities.push({
  id:20000+i,type:'building',kind:'generator',owner:i%2,
  x:30+(i%12),y:30+Math.floor(i/12),hp:100,maxHp:100,built:true,
  ready:0,construction:1
});
const far=g.entities.find(e=>e.id===20000);
let farX=far.x,farReads=0;
Object.defineProperty(far,'x',{configurable:true,get(){farReads++;return farX;},set(v){farX=v;}});
const mover=g.entities.find(e=>e.owner===0&&e.kind==='soldier');
mover.order={type:'move',x:13,y:14};
const probe=()=>{
  for(let i=0;i<100;i++){
    g.canOccupyUnit(mover,18+(i%3)*.1,18,true);
    g.walkable(18+(i%3)*.1,18);
  }
};
probe();
assert.ok(farReads>=100,'outside the tick, collision reads live buildings');
farReads=0;
let indexed=false;
const originalMove=g.move;
g.move=function(...args){
  if(!indexed){
    indexed=true;
    assert.ok(this.buildingBuckets,'movement must use the frame building index');
    const before=farReads;
    probe();
    assert.equal(farReads,before,'distant buildings must not be rescanned');
  }
  return originalMove.apply(this,args);
};
g.step(.016);
assert.ok(indexed,'a moving unit must exercise the frame collision index');
assert.equal(g.buildingBuckets,null,'the frame index must be discarded after movement');

// No persistent index: new positions, destruction and water are reflected by
// subsequent queries, even if buildings were not in the previous nearby set.
far.x=18;far.y=18;
assert.equal(g.walkable(18,18),false,'a moved building blocks its new tile');
assert.equal(g.canOccupyUnit(mover,18,18,true),false);
far.hp=0;
assert.equal(g.walkable(18,18),true,'destroyed buildings do not block');
assert.equal(g.canOccupyUnit(mover,18,18,true),true);
far.hp=100;
g.water=(x,y)=>x===18&&y===18;
assert.equal(g.walkable(18,18),false,'terrain remains authoritative');
g.water=()=>false;
far.x=42;far.y=42;
assert.equal(g.walkable(18,18),true);

delete g.move;
assert.equal(g.saveGame(),true);
assert.equal(g.loadGame(),true);
assert.equal(window.ChronoDominion.version,'2.42.0');
console.log('v2.38 per-frame indexed ground collision, live obstacles and saves passed');
