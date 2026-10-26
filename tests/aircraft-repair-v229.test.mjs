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
const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-7,
  message+' (got '+actual+', expected '+expected+')');
const pad=g.add(0,'airfield',8,9),plane=g.add(0,'aircraft',9,9);
plane.hp=100;plane.ammo=4;
assert.equal(g.serviceAircraft(plane,5),false,'fully armed plane is not forced to repair');
assert.equal(plane.hp,100,'no free healing outside service');

plane.ammo=0;plane.order={type:'attackMove',x:21,y:18};
const startCredits=g.players[0].credits;
assert.equal(g.serviceAircraft(plane,2.5),true);
assert.equal(plane.rearming,true);
assert.equal(plane.ammo,1,'ammo reloads on its original schedule');
near(plane.hp,130,'12 HP per second');
near(g.players[0].credits,startCredits-22.5,'repairs debit 0.75 per HP');
assert.equal(plane.rearmResume.type,'attackMove');

const power=g.power.bind(g);
g.power=side=>side===0?{make:0,use:100,low:true}:power(side);
g.serviceAircraft(plane,5);
near(plane.hp,130,'unpowered airfield cannot repair');
assert.equal(plane.ammo,1,'unpowered airfield cannot reload');
near(g.players[0].credits,startCredits-22.5,'no charge during outage');
g.power=power;

g.players[0].credits=3;
g.serviceAircraft(plane,2.5);
near(plane.hp,134,'limited credits cap healing');
near(g.players[0].credits,0,'repair never overdrafts');
assert.equal(plane.ammo,2,'reload continues despite low credits');
g.serviceAircraft(plane,5);
assert.equal(plane.ammo,4,'zero credits do not prevent rearming');
near(plane.hp,134,'no free repair after credits run out');
assert.equal(plane.rearming,false);
assert.equal(plane.order.type,'attackMove','saved mission resumes');

plane.hp=100;plane.ammo=0;plane.x=22;plane.y=9;
g.players[0].credits=200;
g.serviceAircraft(plane,.5);
near(plane.hp,100,'aircraft cannot repair while still flying home');
near(g.players[0].credits,200,'no charges during return flight');
plane.x=pad.x+1;plane.y=pad.y;
g.serviceAircraft(plane,1);
near(plane.hp,112,'repairs resume once near pad');
pad.hp=0;
assert.equal(g.serviceAircraft(plane,.1),false,'destroyed pad releases aircraft');
assert.equal(plane.rearming,false);
assert.equal(plane.order.type,'attackMove','lost pad restores mission');

const enemyPad=g.add(1,'airfield',27,26);
const enemyPlane=g.add(1,'aircraft',26,26);
enemyPlane.hp=enemyPlane.maxHp-2;enemyPlane.ammo=0;
g.players[1].credits=20;g.players[0].credits=200;
g.serviceAircraft(enemyPlane,2.5);
near(enemyPlane.hp,enemyPlane.maxHp,'repair caps at max hull');
near(g.players[1].credits,18.5,'AI pays from its own wallet');
near(g.players[0].credits,200,'opponent credits are untouched');
assert.equal(enemyPlane.ammo,1,'AI plane also reloads');

assert.equal(g.saveGame(),true,'service state saves with existing key');
const key='chrono-dominion-skirmish-v1',saved=JSON.parse(storage.get(key));
const legacy=saved.entities.find(e=>e.id===enemyPlane.id);
delete legacy.rearmDetour;delete legacy.rearmDetourDoneFor;
storage.set(key,JSON.stringify(saved));
assert.equal(g.loadGame(),true,'legacy save loads without migration');
assert.equal(g.entityById(enemyPlane.id).kind,'aircraft');
assert.equal(g.entityById(enemyPlane.id).hp,enemyPlane.maxHp);
console.log('v2.29 paid aircraft hull repair regression passed');
