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
  map:'verdant',difficulty:'standard',startingCredits:5000});
const pad=g.add(0,'airfield',27,16),plane=g.add(0,'aircraft',5,16);
const beam={id:8000,x:16,y:16,type:'building',kind:'beam',time:g.time};
g.intel[0]=[beam];g.intel[1]=[beam];
assert.ok(g.scoutThreatPenalty(beam)>200,'reported beam threatens scouts');
assert.ok(g.scoutThreatPenalty({x:16,y:23.5})>=200,'beam hazard extends beyond sentry core');
const exposure=g.airReturnExposure(0,plane,pad);
assert.ok(exposure>.16,'observed beam exposes direct return');
const waypoint=g.airReturnDetour(plane,pad);
assert.ok(waypoint&&Math.abs(waypoint.y-16)>4,'detour avoids observed beam');
g.intel[0]=[];
assert.equal(g.airReturnDetour(plane,pad),null,'hidden beam cannot influence route');
g.intel[1]=[];
assert.equal(g.airReturnDetour({...plane,owner:1},pad),null,'AI cannot use player intel');
g.intel[0]=[beam];g.intel[1]=[beam];
assert.ok(g.airReturnDetour({...plane,owner:1},pad),'AI uses own observed beam');
g.intel[1]=[{...beam,kind:'turret'}];
assert.ok(g.scoutThreatPenalty(beam)>200,'existing sentry avoidance preserved');
g.intel[1]=[beam];
plane.ammo=0;plane.order={type:'attackMove',x:7,y:8};
assert.equal(g.serviceAircraft(plane,.2),true);
assert.equal(plane.rearming,true);
assert.ok(plane.rearmDetour);
assert.equal(plane.rearmResume.type,'attackMove');
const detour=plane.rearmDetour;
plane.x=detour.x;plane.y=detour.y;
g.serviceAircraft(plane,.2);
assert.equal(plane.rearmDetour,null);
assert.equal(plane.rearmDetourDoneFor,pad.id,'waypoint cannot loop');
plane.x=pad.x;plane.y=pad.y;
g.serviceAircraft(plane,11);
assert.equal(plane.ammo,4);
assert.equal(plane.rearming,false);
assert.equal(plane.order.type,'attackMove','mission resumes');
assert.equal(plane.rearmDetourDoneFor,null);
plane.ammo=0;g.serviceAircraft(plane,.1);
pad.hp=0;
assert.equal(g.serviceAircraft(plane,.1),false);
assert.equal(plane.rearming,false);
assert.equal(plane.rearmDetour,null);
assert.equal(plane.order.type,'attackMove');
g.intel[0]=[{...beam,time:g.time-181}];
g.intel[1]=[{...beam,time:g.time-181}];
assert.equal(g.scoutThreatPenalty(beam),0,'expired tower report ignored');
assert.equal(g.airReturnExposure(0,plane,{x:27,y:16}),0);
g.intel[0]=[];g.intel[1]=[];
assert.equal(g.saveGame(),true);
const key='chrono-dominion-skirmish-v1',saved=JSON.parse(storage.get(key));
const legacy=saved.entities.find(e=>e.id===plane.id);
delete legacy.rearmDetour;delete legacy.rearmDetourDoneFor;
storage.set(key,JSON.stringify(saved));
assert.equal(g.loadGame(),true);
assert.ok(g.entityById(plane.id));
console.log('v2.28 air return and threat memory regression passed');
