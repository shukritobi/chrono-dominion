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
const normalPower=g.power.bind(g);
const outage=side=>side===0?{make:0,use:100,low:true}:normalPower(side);
const pad=g.add(0,'airfield',8,9),plane=g.add(0,'aircraft',pad.x+1,pad.y);
plane.ammo=0;plane.hp=100;plane.order={type:'attackMove',x:19,y:19};
const credits=g.players[0].credits;
g.power=outage;
assert.equal(g.serviceAircraft(plane,7),true,'unpowered airfield shelters aircraft temporarily');
assert.equal(plane.rearmPowerOutage,7);
assert.equal(plane.ammo,0,'no free ordnance during outage');
assert.equal(plane.hp,100,'no free hull repair during outage');
assert.equal(g.players[0].credits,credits,'no repair charge during outage');
assert.equal(g.serviceAircraft(plane,7.99),true,'aircraft stays for less than 15 seconds');
assert.equal(g.serviceAircraft(plane,.02),false,'prolonged outage releases plane');
assert.equal(plane.rearming,false);
assert.equal(plane.order.type,'attackMove','previous mission is restored');
assert.equal(plane.rearmResume,null);
assert.equal(plane.rearmRetryAt,g.time+25);
assert.equal(g.serviceAircraft(plane,1),false,'unpowered retry holdoff prevents oscillation');
assert.equal(plane.rearming,false);
assert.equal(plane.ammo,0);
g.power=normalPower;
assert.equal(g.serviceAircraft(plane,2.5),true,'power restoration cancels holdoff');
assert.equal(plane.ammo,1,'rearming resumes at original speed');
assert.equal(plane.rearmPowerOutage,0,'powered service resets outage timer');

// Intermittent outages reset their counter rather than adding disjoint intervals.
const second=g.add(0,'aircraft',pad.x+1,pad.y);
second.ammo=0;
g.power=outage;
assert.equal(g.serviceAircraft(second,8),true);
g.power=normalPower;
assert.equal(g.serviceAircraft(second,2.5),true);
assert.equal(second.rearmPowerOutage,0);
g.power=outage;
assert.equal(g.serviceAircraft(second,8),true);
assert.equal(second.rearming,true,'a fresh outage has a fresh 15-second allowance');

// The outage counter survives save/load; old saves lacking it remain compatible.
assert.equal(g.saveGame(),true);
assert.equal(g.loadGame(),true);
const loaded=g.entityById(second.id);
assert.equal(loaded.rearmPowerOutage,8);
assert.equal(g.serviceAircraft(loaded,7.1),false,'outage timeout persists across saves');
assert.equal(loaded.order,null,'idle mission remains idle');
const key='chrono-dominion-skirmish-v1',snapshot=JSON.parse(storage.get(key));
for(const e of snapshot.entities){delete e.rearmPowerOutage;delete e.rearmRetryAt;}
storage.set(key,JSON.stringify(snapshot));
assert.equal(g.loadGame(),true,'historical save with no outage fields loads');

// AI emergency retreats also release when a pad has no power.
g.power=side=>side===1?{make:0,use:100,low:true}:normalPower(side);
const aiPad=g.add(1,'airfield',25,25),aiPlane=g.add(1,'aircraft',aiPad.x+1,aiPad.y);
aiPlane.hp=50;aiPlane.ammo=4;aiPlane.order={type:'move',x:10,y:10};
assert.equal(g.serviceAircraft(aiPlane,15.1),false);
assert.equal(aiPlane.rearming,false);
assert.equal(aiPlane.repairRetreat,false);
assert.equal(aiPlane.order.type,'move');
assert.equal(aiPlane.retreatCooldownAt,g.time+40,'AI emergency cooldown still applies');
assert.equal(aiPlane.ammo,4);
g.power=normalPower;
assert.equal(g.serviceAircraft(aiPlane,1),false,'AI emergency retreat cooldown still applies');

// Destroyed power buildings must not supply or consume power even before cleanup.
const generator=g.entities.find(e=>e.owner===0&&e.kind==='generator'&&e.hp>0);
const beforeMake=g.power(0).make;
generator.hp=0;
assert.equal(g.power(0).make,beforeMake-110,'destroyed generator cannot power airfield');
const turret=g.add(0,'turret',12,12),beforeUse=g.power(0).use;
turret.hp=0;
assert.equal(g.power(0).use,beforeUse-20,'destroyed turret does not consume power');
console.log('v2.31 airfield outage recovery regression passed');
