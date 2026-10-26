import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const noop=()=>{},canvas=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',style:{},disabled:false,dataset:{},
    classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,
    setAttribute:noop,querySelectorAll:()=>[],querySelector:()=>({disabled:true,textContent:''}),
    getContext:()=>canvas,
    getBoundingClientRect:()=>({left:0,top:0,width:id==='world'?1024:272,height:id==='world'?700:144}),
    set innerHTML(v){this._h=v},get innerHTML(){return this._h||''},
    set textContent(v){this._t=v},get textContent(){return this._t||''}
  });return nodes.get(id);
}};
const window={addEventListener:noop};
runInNewContext(source,{window,document,console,performance:{now:()=>0},devicePixelRatio:1,
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},
  setTimeout:()=>1,clearTimeout:noop,requestAnimationFrame:noop
},{timeout:10000});
const g=window.__game;
g.newMatch({playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000});
const scout=g.add(1,'recon',4,4);
const originalWalkable=g.walkable.bind(g);
const originalRisk=g.scoutThreatPenalty.bind(g);
// A direct route crosses a reported danger tile; weighted A* should detour.
g.walkable=(x,y)=>x>=1&&y>=1&&x<=32&&y<=32;
const danger=p=>p.y===4&&p.x>=6&&p.x<=8?250:0;
const direct=g.findPath(4,4,10,4);
assert.ok(direct.some(p=>danger(p)>=200),'baseline route crosses synthetic danger');
const detour=g.findPath(4,4,10,4,null,p=>danger(p)/25);
assert.ok(detour.length&&detour.every(p=>danger(p)<200),'weighted A* avoids defended corridor');
g.scoutThreatPenalty=danger;
assert.ok(g.scoutPath(scout,{x:10,y:4}),'scout accepts reachable safe detour');
scout.order={type:'move',x:10,y:4};
g.move(scout,10,4,.1);
assert.ok(scout.path.length&&scout.path.every(p=>danger(p)<200),
  'actual scout movement must use same threat-aware A* as patrol planning');
// An entirely defended one-tile passage cannot be silently accepted.
scout.x=4;scout.y=4;scout.path=[];scout.pathTarget=null;scout.pathRecheck=0;
g.walkable=(x,y)=>x>=4&&x<=10&&y===4;
assert.equal(g.scoutPath(scout,{x:10,y:4}),null,
  'known defended chokepoint is rejected when no safe route exists');
g.scoutWaypoints=()=>[{x:10,y:4}];g.scoutFrontiers=()=>[];
assert.equal(g.assignScoutPatrol(scout),false,'scout must wait instead of suiciding through known defense');
assert.equal(scout.order,null);
// No hidden hostile positions are allowed to affect route selection.
g.walkable=(x,y)=>x>=1&&y>=1&&x<=32&&y<=32;
g.scoutThreatPenalty=originalRisk;g.intel[1]=[];
g.entities.push({id:99001,owner:0,type:'building',kind:'turret',x:7,y:4,
  hp:100,maxHp:100,built:true});
assert.ok(g.scoutPath(scout,{x:10,y:4}),
  'hidden enemy must not affect AI path danger before a sensor report');
g.entities.pop();
g.intel[1]=[{id:99001,x:7,y:4,time:g.time,type:'building',kind:'turret'}];
assert.equal(g.scoutPath(scout,{x:10,y:4}),null,
  'reported turret zone blocks exposed route when no safe approach exists');
g.walkable=originalWalkable;
// The existing local save key and schema remain unchanged.
assert.equal(g.saveGame(),true);
assert.equal(g.loadGame(),true);
console.log('PASS: v2.11 threat-aware A*, movement detours, defended chokepoints, sensor-only danger and saves');
