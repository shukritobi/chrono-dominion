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


/**
 * Larger sorties expose interactions that single-aircraft exercises miss:
 * simultaneous targeting, multiple Skyguard batteries and shared servicing.
 * These are deliberately scripted; strategic AI is tested separately below.
 */
function exerciseWing(faction,skyguard){
  const g=createGame();
  g.newMatch({map:'verdant',difficulty:'standard',
    playerFaction:faction,enemyFaction:FACTIONS[(FACTIONS.indexOf(faction)+1)%3],
    startingCredits:5000});
  g.nextAI=Infinity;g.nextUi=Infinity;g.nextFog=Infinity;
  const pad=g.add(0,'airfield',9,12);
  const target=g.add(1,'hq',16,12);
  // A second enemy generator ensures two batteries do not brown out.
  g.add(1,'generator',20,18);
  const batteries=skyguard?[g.add(1,'flak',16,15),g.add(1,'flak',19,13)]:[];
  const planes=[0,1,2].map(i=>{
    const plane=g.add(0,'aircraft',12+i*.4,11.6+i*.5);
    plane.order={type:'attack',id:target.id};
    return plane;
  });
  assert.equal(g.power(0).low,false,'wing airfield must be powered');
  assert.equal(g.power(1).low,false,'wing defenses must be powered');
  const shots={aircraft:0,flak:0},previousAmmo=new Map(planes.map(p=>[p.id,p.ammo]));
  const shoot=g.shoot.bind(g);
  g.shoot=(source,victim)=>{
    const before=g.projectiles.length;
    shoot(source,victim);
    if(g.projectiles.length>before&&Object.hasOwn(shots,source.kind))
      shots[source.kind]++;
  };
  let reloadedRounds=0,serviceTicks=0,minHull=Infinity;
  const step=.2;
  for(let i=0;i<225&&g.state==='playing';i++){
    g.step(step);
    for(const plane of planes){
      const before=previousAmmo.get(plane.id);
      if(plane.ammo>before)reloadedRounds+=plane.ammo-before;
      previousAmmo.set(plane.id,plane.ammo);
      if(plane.rearming)serviceTicks++;
      minHull=Math.min(minHull,plane.hp);
      assert.ok(Number.isFinite(plane.x)&&Number.isFinite(plane.y),
        'wing aircraft position must remain finite');
      assert.ok(Number.isFinite(plane.hp),'wing aircraft health must remain finite');
      assert.ok(plane.ammo>=0&&plane.ammo<=4,'wing ammunition must remain bounded');
    }
    assert.ok(g.players.every(p=>p.credits>=0),'wing repairs cannot overdraw credits');
  }
  const result={faction,skyguard,aircraftDeployed:planes.length,
    skyguardBatteries:batteries.length,seconds:Math.round(g.time*10)/10,
    aircraftShots:shots.aircraft,skyguardShots:shots.flak,
    aircraftDamage:Math.round(g.stats[0].damageDealt),
    skyguardDamage:Math.round(g.stats[1].damageDealt),
    minAircraftHull:Math.round(minHull),
    aircraftLost:planes.filter(p=>p.hp<=0).length,
    reloadedRounds,serviceSeconds:Math.round(serviceTicks*step*10)/10,
    targetHull:Math.round(target.hp),airfieldAlive:pad.hp>0};
  assert.ok(result.aircraftShots>=3,'three-plane wing must launch actual attacks');
  assert.ok(result.aircraftDamage>0,'wing projectiles must hit');
  if(skyguard){
    assert.ok(result.skyguardShots>0,'two Skyguards must engage the wing');
    assert.ok(result.skyguardDamage>0,'Skyguard projectiles must hit the wing');
    assert.ok(result.minAircraftHull<planes[0].maxHp,'wing must take anti-air damage');
  }else{
    assert.equal(result.skyguardShots,0,'wing control has no Skyguard fire');
    assert.equal(result.skyguardDamage,0,'wing control has no anti-air damage');
    assert.equal(result.aircraftLost,0,'unopposed wing must survive');
    assert.ok(result.reloadedRounds>0,'unopposed wing must visit airfield and reload');
  }
  return result;
}

/**
 * The AI must pay for and complete an aircraft using its actual production
 * queue, rather than receiving a free test-spawned aircraft.
 */
function exerciseAIProduction(faction){
  const g=createGame();
  g.newMatch({map:'verdant',difficulty:'standard',
    playerFaction:FACTIONS[(FACTIONS.indexOf(faction)+1)%3],
    enemyFaction:faction,startingCredits:5000});
  g.nextAI=Infinity;g.nextUi=Infinity;g.nextFog=Infinity;
  g.add(1,'factory',22,24);
  g.add(1,'radar',22,21);
  g.add(1,'airfield',21,27);
  g.add(1,'generator',19,25);
  g.add(1,'generator',19,29);
  // Existing reconnaissance/specialist priorities must be satisfied first.
  g.add(1,'recon',23,23);
  g.add(1,'specialist',24,23);
  g.time=245;
  g.players[1].credits=10000;
  assert.equal(g.power(1).low,false,'AI aviation infrastructure must be powered');
  assert.ok(g.prereq(1,'aircraft'),'AI aircraft tech prerequisites must be present');
  const creditsBefore=g.players[1].credits;
  const deployedBefore=g.stats[1].unitsDeployed;
  g.runAI();
  const queued=g.queues.find(q=>q.side===1&&q.key==='aircraft');
  assert.ok(queued,'AI must queue an aircraft using real production priorities');
  assert.ok(g.players[1].credits<=creditsBefore-1600,
    'AI aircraft purchase must debit at least its full unit cost');
  for(let i=0;i<55&&g.queues.some(q=>q.side===1&&q.key==='aircraft');i++)
    g.step(.2);
  const aircraft=g.entities.filter(e=>e.owner===1&&e.kind==='aircraft'&&e.hp>0);
  assert.equal(aircraft.length,1,'paid AI aircraft must deploy from the real queue');
  assert.equal(g.queues.some(q=>q.side===1&&q.key==='aircraft'),false,
    'AI aircraft production queue must complete');
  assert.ok(g.stats[1].unitsDeployed>deployedBefore,
    'AI aircraft deployment must be recorded in statistics');
  return {faction,queued:true,aircraftDeployed:aircraft.length,
    creditsBefore,creditsAfter:g.players[1].credits,
    seconds:Math.round(g.time*10)/10};
}

const results=FACTIONS.flatMap(faction=>[false,true].map(skyguard=>exercise(faction,skyguard)));
const wingResults=FACTIONS.flatMap(faction=>[false,true].map(skyguard=>exerciseWing(faction,skyguard)));
const aiProduction=FACTIONS.map(exerciseAIProduction);
const report={
  schema:'chrono-dominion-air-exercise-v2',
  engine:'production game.js',simulationStep:.2,scenarios:results.length+wingResults.length+aiProduction.length,
  disclaimer:'Deterministic scripted encounters, not human win rates or measured real-device FPS.',
  results,wingResults,aiProduction,
  summary:{
    casesWithAircraftFire:results.filter(r=>r.aircraftShots>0).length,
    casesWithSkyguardFire:results.filter(r=>r.skyguardShots>0).length,
    casesWithAirfieldReload:results.filter(r=>r.reloadedRounds>0).length,
    aircraftLostUnderSkyguard:results.filter(r=>r.skyguard&&r.aircraftLost).length,
    aircraftLostWithoutSkyguard:results.filter(r=>!r.skyguard&&r.aircraftLost).length,
    wingScenarios:wingResults.length,
    wingAircraftDeployed:wingResults.reduce((n,r)=>n+r.aircraftDeployed,0),
    wingCasesWithSkyguardFire:wingResults.filter(r=>r.skyguard&&r.skyguardShots>0).length,
    wingAircraftLostUnderSkyguard:wingResults.filter(r=>r.skyguard).reduce((n,r)=>n+r.aircraftLost,0),
    aiAircraftProduced:aiProduction.reduce((n,r)=>n+r.aircraftDeployed,0)
  }
};
assert.equal(report.summary.casesWithAircraftFire,6);
assert.equal(report.summary.casesWithSkyguardFire,3);
assert.equal(report.summary.aircraftLostWithoutSkyguard,0);
assert.equal(report.summary.wingScenarios,6);
assert.equal(report.summary.wingCasesWithSkyguardFire,3);
assert.equal(report.summary.aiAircraftProduced,3);
if(out)writeFileSync(out,JSON.stringify(report,null,2)+'\n');
for(const r of results)console.log(
  [r.faction.padEnd(10),r.skyguard?'Skyguard':'Control ',
   'shots '+r.aircraftShots+'/'+r.skyguardShots,
   'damage '+r.aircraftDamage+'/'+r.skyguardDamage,
   'reload '+r.reloadedRounds,'lost '+r.aircraftLost].join(' | '));
for(const r of wingResults)console.log('WING:',r.faction,r.skyguard?'two Skyguards':'control',JSON.stringify(r));
for(const r of aiProduction)console.log('AI PRODUCTION:',JSON.stringify(r));
console.log('AIR EXERCISE SUMMARY:',JSON.stringify(report.summary));
console.log('PASS: six single-aircraft engagements, six three-aircraft wing engagements and three paid AI aircraft production cases');
