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
g.water=()=>false;g.nextAI=Infinity;g.nextFog=Infinity;g.nextUi=Infinity;

// 120 remote sensors simulate a crowded XL battle. An off-frame query must
// still read live entities, but a combat-phase query should visit only
// nearby observer buckets, without changing visibility results.
const scout=g.add(0,'recon',20,20);
for(let i=0;i<120;i++)g.entities.push({
  id:10000+i,owner:0,type:'building',kind:'hq',
  x:41,y:41,hp:100,maxHp:100,built:true,ready:0
});
const far=g.entities.at(-1);
let farX=far.x,farReads=0;
Object.defineProperty(far,'x',{configurable:true,
  get(){farReads++;return farX;},set(v){farX=v;}});
const points=Array.from({length:40},(_,i)=>({
  x:2+(i*11)%44,y:2+(i*17)%44
}));
const expected=points.map(p=>g.sideCanSee(0,p));
assert.equal(g.sideCanSee(0,{x:15,y:30}),false);
const mover=g.entities.find(e=>e.owner===0&&e.kind==='soldier');
mover.order={type:'move',x:13,y:14};
const originalMove=g.move;
let checked=false;
g.move=function(...args){
  if(!checked){
    checked=true;
    assert.ok(this.sensorBuckets?.[0]&&this.sensorBuckets?.[1],
      'both factions have temporary sensor indexes');
    points.forEach((p,i)=>assert.equal(this.sideCanSee(0,p),expected[i],
      'indexed visibility matches the live observer scan'));
    const before=farReads;
    for(let i=0;i<50;i++)assert.equal(this.sideCanSee(0,{x:15,y:30}),false);
    assert.equal(farReads,before,'distant sensors are not read on remote misses');
    this.setUnitPosition(scout,28,28);
    assert.equal(this.sideCanSee(0,{x:28,y:28}),true,
      'a moving scout updates its sensor bucket in the same tick');
    assert.equal(this.sideCanSee(0,{x:20,y:20}),false,
      'old scout position is no longer visible');
    const added=this.add(0,'recon',9,27);
    assert.equal(this.sideCanSee(0,{x:9,y:27}),true,
      'new sensors are indexed immediately');
    assert.equal(this.sideCanSee(1,{x:9,y:27}),false,
      'enemy sensors cannot reveal locations for the other faction');
    added.hp=0;
    assert.equal(this.sideCanSee(0,{x:9,y:27}),false,
      'destroyed sensors stop revealing targets immediately');
    const incomplete=this.add(0,'radar',13,34,false);
    assert.equal(this.sideCanSee(0,{x:13,y:34}),false);
    incomplete.built=true;
    assert.equal(this.sideCanSee(0,{x:13,y:34}),true,
      'completed buildings become active sensors without rebuilding');
  }
  return originalMove.apply(this,args);
};
g.step(.016);
assert.ok(checked,'a moving unit must exercise indexed combat detection');
assert.equal(g.sensorBuckets,null,'temporary sensor index is cleared after combat');
const readsBefore=farReads;
g.sideCanSee(0,{x:15,y:30});
assert.ok(farReads>readsBefore,'out-of-tick visibility still scans live entities');
delete g.move;
assert.equal(g.saveGame(),true);
assert.equal(g.loadGame(),true);
assert.equal(g.sensorBuckets,null,'sensor buckets are never persisted');
assert.equal(g.sideCanSee(0,{x:28,y:28}),true,
  'scout vision survives ordinary save/load');
assert.equal(window.ChronoDominion.version,'2.41.0');
console.log('v2.39 faction sensor indexing, dynamic sight and legacy saves passed');
