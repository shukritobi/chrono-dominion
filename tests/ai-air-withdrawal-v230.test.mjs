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
const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-6,
  message+' (got '+actual+', expected '+expected+')');

// Human planes do not automatically withdraw just because their hull is low.
const humanPad=g.add(0,'airfield',8,9);
const human=g.add(0,'aircraft',9,9);
human.hp=40;human.order={type:'attackMove',x:19,y:19};
assert.equal(g.serviceAircraft(human,1),false);
assert.equal(human.order.type,'attackMove');

// A full-ammunition AI plane below 30% hull abandons combat for friendly service.
const pad=g.add(1,'airfield',25,25);
const plane=g.add(1,'aircraft',26,25);
plane.hp=60;plane.order={type:'attackMove',x:9,y:10};
g.players[1].credits=500;
const before=g.players[1].credits;
assert.equal(plane.ammo,4);
assert.equal(g.serviceAircraft(plane,1),true);
assert.equal(plane.rearming,true);
assert.equal(plane.repairRetreat,true);
assert.equal(plane.order,null);
assert.equal(plane.rearmResume.type,'attackMove');
near(plane.hp,72,'first second of paid emergency hull service');
near(g.players[1].credits,before-9,'AI pays for its own repairs');
const base=g.entities.find(e=>e.owner===1&&e.kind==='hq');
g.coordinateAIAirWing([plane],[],base,[]);
assert.equal(plane.order,null,'air wing cannot override emergency servicing');
g.serviceAircraft(plane,8);
assert.equal(plane.rearming,false,'plane launches again at 75% hull');
assert.ok(plane.hp/plane.maxHp>=.75);
assert.equal(plane.order.type,'attackMove','original mission resumes');
assert.equal(plane.repairRetreat,false);
assert.equal(plane.retreatCooldownAt,g.time+40);
assert.equal(g.serviceAircraft(plane,.2),false,'cooldown prevents instant retreat');

// A wounded AI plane must travel to the airfield before any repairs are charged.
const traveller=g.add(1,'aircraft',13,14);
traveller.hp=45;traveller.order={type:'move',x:11,y:10};
const credits=g.players[1].credits;
assert.equal(g.serviceAircraft(traveller,.5),true);
assert.equal(traveller.rearming,true);
assert.equal(traveller.hp,45);
near(g.players[1].credits,credits,'no in-flight repair charges');

// No credits: do not immobilize a full-ammo emergency return indefinitely.
const broke=g.add(1,'aircraft',pad.x+1,pad.y);
broke.hp=45;broke.order={type:'move',x:15,y:15};
g.players[1].credits=0;
assert.equal(g.serviceAircraft(broke,1),true);
assert.equal(broke.rearming,false,'insufficient funds release the plane');
assert.equal(broke.order.type,'move');
assert.equal(broke.retreatCooldownAt,g.time+40);
assert.equal(g.serviceAircraft(broke,.1),false,'no oscillating return orders');

// A destroyed airfield releases an emergency return and restores the mission.
g.players[1].credits=500;
pad.hp=0;
assert.equal(g.serviceAircraft(traveller,.1),false);
assert.equal(traveller.rearming,false);
assert.equal(traveller.order.type,'move');
assert.equal(traveller.repairRetreat,false);
assert.equal(traveller.retreatCooldownAt,g.time+40);

// Save/load during emergency return retains the mission, without a schema bump.
pad.hp=pad.maxHp;
const savedPlane=g.add(1,'aircraft',18,18);
savedPlane.hp=35;savedPlane.order={type:'attackMove',x:9,y:9};
assert.equal(g.serviceAircraft(savedPlane,.1),true);
assert.equal(savedPlane.repairRetreat,true);
assert.equal(g.saveGame(),true);
assert.equal(g.loadGame(),true);
const loaded=g.entityById(savedPlane.id);
assert.equal(loaded.rearming,true);
assert.equal(loaded.repairRetreat,true);
assert.equal(loaded.rearmResume.type,'attackMove');

// Historical saves without the new optional flag remain loadable.
const key='chrono-dominion-skirmish-v1',snapshot=JSON.parse(storage.get(key));
for(const entity of snapshot.entities)delete entity.repairRetreat;
storage.set(key,JSON.stringify(snapshot));
assert.equal(g.loadGame(),true);
assert.equal(g.entityById(savedPlane.id).kind,'aircraft');
console.log('v2.30 AI critical aircraft withdrawal regression passed');
