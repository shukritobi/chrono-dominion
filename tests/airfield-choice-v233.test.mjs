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
g.time=60;
const plane=g.add(0,'aircraft',5,16),near=g.add(0,'airfield',15,16);
const safe=g.add(0,'airfield',5,30);
const contact={id:999,kind:'flak',type:'building',x:10,y:16,time:g.time};
assert.equal(g.chooseAirfield(plane)?.id,near.id,'no intel selects nearest pad');
g.intel[1]=[contact];
assert.equal(g.chooseAirfield(plane)?.id,near.id,'player cannot use AI intelligence');
g.intel[0]=[contact];
assert.ok(g.airReturnExposure(0,plane,near)>g.airReturnExposure(0,plane,safe));
assert.equal(g.chooseAirfield(plane)?.id,safe.id,'known AA favors safer airfield');
const enemy=g.add(1,'airfield',5,17),unfinished=g.add(0,'airfield',5,18,false);
assert.notEqual(g.chooseAirfield(plane)?.id,enemy.id,'enemy pad excluded');
assert.notEqual(g.chooseAirfield(plane)?.id,unfinished.id,'unfinished pad excluded');
plane.ammo=0;plane.order={type:'attackMove',x:23,y:23};
assert.equal(g.serviceAircraft(plane,.1),true);
assert.equal(plane.rearmPadId,safe.id);
assert.equal(plane.rearmResume.type,'attackMove');
assert.equal(plane.ammo,0,'no free ammo while airborne');
g.intel[0]=[];
g.serviceAircraft(plane,.1);
assert.equal(plane.rearmPadId,safe.id,'assignment remains pinned after intel changes');
assert.equal(g.saveGame(),true);
assert.equal(g.loadGame(),true);
const loaded=g.entityById(plane.id);
assert.equal(loaded.rearmPadId,safe.id,'assigned pad survives save/load');
assert.equal(loaded.rearmResume.type,'attackMove');
g.entityById(safe.id).hp=0;
assert.equal(g.serviceAircraft(loaded,.1),true);
assert.equal(loaded.rearmPadId,near.id,'destroyed pad triggers failover');
assert.equal(loaded.rearmDetour?.padId??near.id,near.id,'detour is cleared or reassigned');
assert.equal(loaded.ammo,0);
g.entityById(near.id).hp=0;
assert.equal(g.serviceAircraft(loaded,.1),false);
assert.equal(loaded.rearming,false);
assert.equal(loaded.rearmPadId,null);
assert.equal(loaded.order.type,'attackMove','no pads restores previous mission');

// Historical snapshots omit the new optional assignment field.
const revived=g.entities.find(e=>e.id===near.id);
revived.hp=revived.maxHp;
const legacy=g.add(0,'aircraft',6,16);
legacy.ammo=0;legacy.order={type:'move',x:20,y:20};
g.serviceAircraft(legacy,.1);
assert.equal(g.saveGame(),true);
const key='chrono-dominion-skirmish-v1',saved=JSON.parse(storage.get(key));
for(const entity of saved.entities)delete entity.rearmPadId;
storage.set(key,JSON.stringify(saved));
assert.equal(g.loadGame(),true);
const restored=g.entityById(legacy.id);
assert.equal(g.serviceAircraft(restored,.1),true);
assert.equal(restored.rearmPadId,near.id,'legacy return reselects a valid pad');
assert.equal(restored.rearmResume.type,'move');
console.log('v2.33 multi-airfield threat-aware return regression passed');
