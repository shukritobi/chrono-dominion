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
g.nextAI=Infinity;g.nextUi=Infinity;g.nextFog=Infinity;

// An air target outranks closer infantry, but only when actually detected.
const beam=g.add(0,'beam',11,10);
const infantry=g.add(1,'soldier',12,10);
const plane=g.add(1,'aircraft',14,10);
assert.equal(g.defenseTarget(beam)?.id,plane.id,'detected aircraft take priority');
plane.x=17.1;plane.y=10; // in tower range, outside its 5.8-tile sight
assert.equal(g.defenseTarget(beam)?.id,infantry.id,'hidden aircraft cannot be targeted');
const recon=g.add(0,'recon',15,10);
assert.equal(g.defenseTarget(beam)?.id,plane.id,'allied reconnaissance reveals aircraft');
recon.hp=0;
plane.x=14;plane.y=10;

// A conventional sentry can defend itself from air, without the tower damage bonus.
const turret=g.add(0,'turret',10,14);
const nearbyAir=g.add(1,'aircraft',11,15);
assert.equal(g.defenseTarget(turret)?.id,nearbyAir.id);
g.projectiles.length=0;
g.shoot(beam,plane);
const airShot=g.projectiles.at(-1);
assert.equal(airShot.targetId,plane.id);
assert.equal(airShot.damage,g.stat(beam,'damage')*1.5,
  'energy tower has a measured anti-air damage bonus');
g.shoot(beam,infantry);
assert.equal(g.projectiles.at(-1).damage,g.stat(beam,'damage'),
  'ground damage is unchanged');
g.shoot(turret,nearbyAir);
assert.equal(g.projectiles.at(-1).damage,g.stat(turret,'damage'),
  'ordinary sentries retain normal aircraft damage');

// Enemy towers follow the same sensor rules as player towers.
const enemyTower=g.add(1,'beam',26,25);
const playerPlane=g.add(0,'aircraft',29,25);
assert.equal(g.defenseTarget(enemyTower)?.id,playerPlane.id);
playerPlane.x=32.2;playerPlane.y=25;
assert.notEqual(g.defenseTarget(enemyTower)?.id,playerPlane.id,
  'AI cannot fire at aircraft beyond its sensor coverage');

// The real combat step uses the priority selector, and low power disables fire.
g.projectiles.length=0;
beam.ready=0;turret.ready=100;enemyTower.ready=100;
plane.x=14;plane.y=10;
const power=g.power.bind(g);
g.power=side=>side===0?{make:0,use:100,low:true}:power(side);
g.step(.05);
assert.equal(g.projectiles.filter(p=>p.sourceId===beam.id).length,0,
  'unpowered energy tower cannot fire');
g.power=power;
beam.ready=0;
g.step(.05);
assert.equal(g.projectiles.find(p=>p.sourceId===beam.id)?.targetId,plane.id,
  'combat loop fires at the detected aircraft first');

// No new serialized state or save-key migration is required.
assert.equal(g.saveGame(),true);
assert.equal(g.loadGame(),true);
assert.ok(g.entityById(beam.id),'existing buildings survive a save/load');
console.log('v2.27 anti-air targeting and visibility regression checks passed');
