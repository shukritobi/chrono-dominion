#!/usr/bin/env node
/**
 * Deterministic aircraft-versus-Skyguard balance exercise.
 * Runs the production game.js simulation; no mocked combat or free damage.
 * This complements (does not replace) the nine ground-focused skirmish cases.
 * Usage: node tools/simulate-air-engagements.mjs [--out=air-report.json]
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('game.js').replace('  new Game();','  window.__airGame=new Game();');
const noop=()=>{};
const FACTIONS=['coalition','federation','psionic'];
const options=process.argv.slice(2);
const out=options.find(x=>x.startsWith('--out='))?.slice(6);
const windowCatalog={addEventListener:noop};
runInNewContext(read('maps/catalog.js'),{window:windowCatalog,console},{timeout:1000});

function createGame(){
  const nodes=new Map(),storage=new Map();
  const drawing=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
  const document={getElementById(id){
    if(!nodes.has(id))nodes.set(id,{
      id,value:'',style:{},dataset:{},disabled:false,
      classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
      setAttribute:noop,addEventListener:noop,querySelectorAll:()=>[],
      querySelector:()=>({disabled:true,textContent:''}),setPointerCapture:noop,
      getContext:()=>drawing,
      getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
      set innerHTML(v){this._html=v;},get innerHTML(){return this._html||'';},
      set textContent(v){this._text=v;},get textContent(){return this._text||'';}
    });
    return nodes.get(id);
  }};
  const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
  const window={...windowCatalog};
  runInNewContext(source,{window,document,localStorage,console,
    performance:{now:()=>0},devicePixelRatio:1,
    requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop},{timeout:10000});
  const g=window.__airGame;
  g.updateUI=noop;g.notify=noop;g.draw=noop;
  return g;
}

function exercise(faction,skyguard){
  const g=createGame();
  g.newMatch({map:'verdant',difficulty:'standard',
    playerFaction:faction,enemyFaction:FACTIONS[(FACTIONS.indexOf(faction)+1)%3],
    startingCredits:5000});
  // Isolate the combat/service systems from strategic AI; the aircraft still
  // moves, acquires, shoots, receives projectiles and rearms in real game.step().
  g.nextAI=Infinity;g.nextUi=Infinity;g.nextFog=Infinity;
  const pad=g.add(0,'airfield',9,12);
  const target=g.add(1,'generator',16,12);
  const plane=g.add(0,'aircraft',12.5,12);
  if(skyguard)g.add(1,'flak',16,15);
  assert.equal(g.power(0).low,false,'airfield must have power for a fair servicing comparison');
  assert.equal(g.power(1).low,false,'Skyguard must have power for a fair combat comparison');
  plane.order={type:'attack',id:target.id};
  const shots={aircraft:0,flak:0};
  const shoot=g.shoot.bind(g);
  g.shoot=(source,victim)=>{
    const before=g.projectiles.length;
    shoot(source,victim);
    if(g.projectiles.length>before&&Object.hasOwn(shots,source.kind))
      shots[source.kind]++;
  };
  let reloads=0,serviceTicks=0,minHull=plane.hp,previousAmmo=plane.ammo;
  const step=.2;
  for(let i=0;i<175&&g.state==='playing';i++){
    g.step(step);
    if(plane.rearming)serviceTicks++;
    if(plane.ammo>previousAmmo)reloads+=plane.ammo-previousAmmo;
    previousAmmo=plane.ammo;
    minHull=Math.min(minHull,plane.hp);
    assert.ok(Number.isFinite(plane.x)&&Number.isFinite(plane.y),'aircraft location remains finite');
    assert.ok(Number.isFinite(plane.hp),'aircraft hull remains finite');
    assert.ok(plane.ammo>=0&&plane.ammo<=4,'aircraft ammunition remains bounded');
    assert.ok(g.players.every(p=>p.credits>=0),'repairs must not overdraw credits');
  }
  const result={
    faction,skyguard,seconds:Math.round(g.time*10)/10,
    aircraftShots:shots.aircraft,skyguardShots:shots.flak,
    aircraftDamage:Math.round(g.stats[0].damageDealt),
    skyguardDamage:Math.round(g.stats[1].damageDealt),
    minAircraftHull:Math.round(minHull),
    aircraftLost:plane.hp<=0,reloadedRounds:reloads,
    serviceSeconds:Math.round(serviceTicks*step*10)/10,
    targetHull:Math.round(target.hp),airfieldAlive:pad.hp>0
  };
  assert.ok(result.aircraftShots>=1,'aircraft must fire in actual combat');
  assert.ok(result.aircraftDamage>0,'aircraft projectiles must land');
  if(skyguard){
    assert.ok(result.skyguardShots>=1,'powered Skyguard must acquire and fire at aircraft');
    assert.ok(result.skyguardDamage>0,'Skyguard projectiles must damage aircraft');
    assert.ok(result.minAircraftHull<plane.maxHp,'aircraft must be exposed to actual anti-air fire');
  }else{
    assert.equal(result.skyguardShots,0,'control scenario has no Skyguard');
    assert.equal(result.skyguardDamage,0,'control scenario has no hostile fire');
    assert.ok(result.reloadedRounds>=1,'control aircraft must return and reload');
    assert.ok(result.serviceSeconds>0,'control aircraft must actually visit an airfield');
    assert.equal(result.aircraftLost,false,'unopposed aircraft should survive');
  }
  return result;
}

const results=FACTIONS.flatMap(faction=>[false,true].map(skyguard=>exercise(faction,skyguard)));
const report={
  schema:'chrono-dominion-air-exercise-v1',
  engine:'production game.js',simulationStep:.2,scenarios:results.length,
  disclaimer:'Deterministic scripted encounters, not human win rates or measured real-device FPS.',
  results,
  summary:{
    casesWithAircraftFire:results.filter(r=>r.aircraftShots>0).length,
    casesWithSkyguardFire:results.filter(r=>r.skyguardShots>0).length,
    casesWithAirfieldReload:results.filter(r=>r.reloadedRounds>0).length,
    aircraftLostUnderSkyguard:results.filter(r=>r.skyguard&&r.aircraftLost).length,
    aircraftLostWithoutSkyguard:results.filter(r=>!r.skyguard&&r.aircraftLost).length
  }
};
assert.equal(report.summary.casesWithAircraftFire,6);
assert.equal(report.summary.casesWithSkyguardFire,3);
assert.equal(report.summary.aircraftLostWithoutSkyguard,0);
if(out)writeFileSync(out,JSON.stringify(report,null,2)+'\n');
for(const r of results)console.log(
  [r.faction.padEnd(10),r.skyguard?'Skyguard':'Control ',
   'shots '+r.aircraftShots+'/'+r.skyguardShots,
   'damage '+r.aircraftDamage+'/'+r.skyguardDamage,
   'reload '+r.reloadedRounds,'lost '+r.aircraftLost].join(' | '));
console.log('AIR EXERCISE SUMMARY:',JSON.stringify(report.summary));
console.log('PASS: six real-engine aircraft/Skyguard encounters with projectile damage and servicing telemetry');
