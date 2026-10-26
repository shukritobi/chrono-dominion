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
const settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000};
const reset=()=>g.newMatch(settings);

// A new plane carries four shots. Dry firing cannot create free projectiles.
reset();
const pad=g.add(0,'airfield',8,9),plane=g.add(0,'aircraft',15,14);
const enemy=g.add(1,'turret',18,18);
plane.order={type:'attackMove',x:20,y:20};
assert.equal(plane.ammo,4);
for(let i=0;i<4;i++)g.shoot(plane,enemy);
assert.equal(plane.ammo,0);
assert.equal(g.projectiles.length,4);
g.shoot(plane,enemy);
assert.equal(g.projectiles.length,4,'empty aircraft cannot shoot');

// Empty aircraft return to a living friendly pad and keep their prior order.
const before=Math.hypot(plane.x-pad.x,plane.y-pad.y);
assert.equal(g.serviceAircraft(plane,.25),true);
assert.equal(plane.rearming,true);
assert.equal(plane.order,null);
assert.equal(plane.rearmResume.type,'attackMove');
assert.ok(Math.hypot(plane.x-pad.x,plane.y-pad.y)<before,'plane approaches its airfield');
const home=g.entities.find(e=>e.owner===1&&e.kind==='hq');
g.coordinateAIAirWing([plane],[],home,[]);
assert.equal(plane.order,null,'AI must not interrupt rearming');
// Service takes 2.5 seconds per round and does not grant ammunition immediately.
plane.x=pad.x+1;plane.y=pad.y;
g.serviceAircraft(plane,2.4);
assert.equal(plane.ammo,0);
g.serviceAircraft(plane,.2);
assert.equal(plane.ammo,1);
g.serviceAircraft(plane,7.5);
assert.equal(plane.ammo,4);
assert.equal(plane.rearming,false);
assert.equal(plane.order.type,'attackMove','prior mission resumes after servicing');

// No power means no ammunition, even when the aircraft reaches its pad.
plane.ammo=0;plane.order={type:'move',x:22,y:22};
g.serviceAircraft(plane,.1);
const power=g.power.bind(g);
g.power=()=>({make:0,use:200,low:true});
g.serviceAircraft(plane,30);
assert.equal(plane.ammo,0,'unpowered airfield cannot reload');
g.power=power;

// Losing the pad must release the aircraft rather than trapping it forever.
pad.hp=0;
assert.equal(g.serviceAircraft(plane,.1),false);
assert.equal(plane.rearming,false);
assert.equal(plane.order.type,'move');

// No airfield: aircraft may move but cannot fire until a new pad is built.
plane.ammo=0;
assert.equal(g.serviceAircraft(plane,.1),false);
g.shoot(plane,enemy);
assert.equal(plane.ammo,0);

// Historical saves without ammo restore a full load, preserving save schema v1.
plane.ammo=3;plane.rearming=false;plane.rearmResume=null;
assert.equal(g.saveGame(),true);
const key='chrono-dominion-skirmish-v1',saved=JSON.parse(storage.get(key));
const historical=saved.entities.find(e=>e.id===plane.id);
delete historical.ammo;delete historical.rearming;delete historical.rearmResume;
storage.set(key,JSON.stringify(saved));
assert.equal(g.loadGame(),true);
const restored=g.entityById(plane.id);
assert.equal(g.serviceAircraft(restored,.1),false);
assert.equal(restored.ammo,4,'legacy aircraft have full ammunition');
assert.equal(g.entityById(plane.id).kind,'aircraft');
console.log('v2.26 aircraft ordnance and rearm regression checks passed');
