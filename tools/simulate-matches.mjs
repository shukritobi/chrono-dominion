#!/usr/bin/env node
/**
 * Chrono Dominion headless match laboratory.
 * Uses the same game.js simulation as the browser (no duplicate rules engine).
 * No browser, third-party dependencies, graphics or network required.
 *
 * npm run balance          -> nine map/difficulty scenarios, 240 game seconds
 * npm run balance:quick    -> CI smoke matrix, 75 game seconds
 * npm run balance:full     -> extended 540 game seconds
 * node tools/simulate-matches.mjs --duration=300 --out=balance-report.json
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__balanceGame=new Game();');
const MAPS=['verdant','desert','snow'];
const DIFFICULTIES=['recruit','standard','veteran'];
const FACTIONS=['coalition','federation','psionic'];
const options=process.argv.slice(2);
const progression=options.includes('--progression');
const arg=name=>options.find(a=>a.startsWith(name+'='));
const seconds=Number(arg('--duration')?.split('=')[1]||
  (options.includes('--quick')?'75':options.includes('--full')?'540':progression?'720':'240'));
const frame=Number(arg('--step')?.split('=')[1]||'.20');
const out=arg('--out')?.split('=').slice(1).join('=');
if(!Number.isFinite(seconds)||seconds<10||seconds>1800||
   !Number.isFinite(frame)||frame<=0||frame>.25)throw Error('Invalid simulation duration or frame step');
const noop=()=>{};
function createGame(){
  const drawing=new Proxy({},{
    get(obj,key){return obj[key]??noop;},
    set(obj,key,value){obj[key]=value;return true;}
  });
  const dom=new Map(),storage=new Map();
  const document={getElementById(id){
    if(!dom.has(id))dom.set(id,{
      id,value:'',style:{},disabled:false,
      classList:{add:noop,remove:noop,toggle:noop},
      setAttribute:noop,addEventListener:noop,querySelectorAll:()=>[],
      querySelector:()=>({disabled:true,textContent:''}),
      getContext:()=>drawing,
      getBoundingClientRect:()=>({left:0,top:0,width:id==='world'?1024:272,height:id==='world'?700:144}),
      set innerHTML(value){this.html=value;},get innerHTML(){return this.html||'';},
      set textContent(value){this.text=value;},get textContent(){return this.text||'';}
    });return dom.get(id);
  }};
  const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
  const window={addEventListener:noop};
  const globals={window,document,localStorage,console,performance:{now:()=>0},
    devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop};
  runInNewContext(source,globals,{timeout:10000});
  const game=window.__balanceGame;
  game.updateUI=noop;game.notify=noop;game.draw=noop;
  return {game,storage};
}
function buildPlayerStructure(g,kind){
  const base=g.entities.find(e=>e.owner===0&&e.kind==='hq'&&e.hp>0);
  if(!base||!g.prereq(0,kind))return false;
  if(g.entities.some(e=>e.owner===0&&e.kind===kind&&e.hp>0))return false;
  if(g.players[0].credits<({factory:1700,radar:900,tech:2200,turret:600,generator:650}[kind]||99999))return false;
  let target=null,best=Infinity;
  for(let x=3;x<=30;x++)for(let y=3;y<=30;y++){
    if(!g.canPlace(x,y,0))continue;
    const d=Math.hypot(x-base.x,y-base.y);
    if(d>8.1)continue;
    const score=d+Math.abs(x-y)*.03;
    if(score<best){best=score;target={x,y};}
  }
  if(!target)return false;
  const credits=g.players[0].credits;
  g.chooseProduction(kind);
  if(g.placing!==kind)return false;
  g.placeBuilding(target.x,target.y);
  assert.ok(g.players[0].credits<credits,'player scripted build must pay credits');
  return true;
}
function scriptedPlayer(g,iteration){
  const tech=['factory','radar','generator','tech'];
  for(const kind of tech){
    if(buildPlayerStructure(g,kind))break;
  }
  const deployed=g.entities.filter(u=>u.owner===0&&u.type==='unit'&&u.hp>0);
  const fighters=deployed.filter(u=>u.kind!=='harvester'&&u.kind!=='recon');
  const unitsQueued=g.queues.filter(q=>q.side===0);
  if(g.count(0,'factory')&&g.players[0].credits>1250&&
      fighters.filter(u=>['tank','heavy'].includes(u.kind)).length<8&&
      !unitsQueued.some(q=>q.key==='tank')){
    g.chooseProduction('tank');
  }else if(g.count(0,'barracks')&&g.players[0].credits>500&&
      fighters.filter(u=>u.kind==='soldier').length<7&&!unitsQueued.some(q=>q.key==='soldier')){
    g.chooseProduction('soldier');
  }
  if(g.count(0,'factory')&&g.players[0].credits>1250&&!deployed.some(u=>u.kind==='recon')&&
     !unitsQueued.some(q=>q.key==='recon'))g.chooseProduction('recon');

  const home=g.entities.find(e=>e.owner===0&&e.kind==='hq'&&e.hp>0);
  if(!home)return;
  const observed=g.entities.filter(e=>e.owner===1&&e.hp>0&&e.type==='unit'&&g.sideCanSee(0,e));
  const hostile=observed.sort((a,b)=>Math.hypot(a.x-home.x,a.y-home.y)-
      Math.hypot(b.x-home.x,b.y-home.y))[0];
  if(hostile&&Math.hypot(hostile.x-home.x,hostile.y-home.y)<8){
    const team=[...fighters].sort((a,b)=>Math.hypot(a.x-hostile.x,a.y-hostile.y)-
        Math.hypot(b.x-hostile.x,b.y-hostile.y)).slice(0,3);
    for(const unit of team)unit.order={type:'attack',id:hostile.id};
  }else if(iteration%3===0){
    const candidates=fighters.filter(u=>!u.order||u.order.type!=='attack');
    const patrol=[{x:13,y:15},{x:18,y:18},{x:21,y:23}][Math.floor(iteration/3)%3];
    const slots=g.formationSlots(patrol.x,patrol.y,Math.min(candidates.length,5),
      {x:home.x,y:home.y});
    candidates.slice(0,slots.length).forEach((unit,i)=>{
      unit.order={type:'attackMove',x:slots[i].x,y:slots[i].y};
    });
  }
}
function checkIntegrity(g,tag){
  const ids=new Set();
  for(const e of g.entities){
    assert.ok(Number.isInteger(e.id)&&!ids.has(e.id),tag+': duplicate/invalid entity ID');
    ids.add(e.id);
    assert.ok(Number.isFinite(e.x)&&Number.isFinite(e.y)&&e.x>=0&&e.x<=34&&e.y>=0&&e.y<=34,
      tag+': invalid entity position');
    assert.ok(Number.isFinite(e.hp)&&Number.isFinite(e.maxHp)&&e.maxHp>0,
      tag+': invalid health');
    assert.ok(e.owner===0||e.owner===1,tag+': invalid owner');
  }
  assert.equal(g.unitBuckets,null,tag+': spatial index leaked after tick');
  assert.ok(g.players.every(p=>Number.isFinite(p.credits)&&p.credits>=0),
    tag+': invalid credit ledger');
  assert.ok(g.ores.every(o=>Number.isFinite(o.amount)&&o.amount>=0),
    tag+': invalid ore balance');
  assert.ok(g.queues.every(q=>Number.isFinite(q.elapsed)&&q.elapsed>=0&&
    Number.isFinite(q.total)&&q.total>0),tag+': invalid production queue');
  assert.ok(g.projectiles.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),
    tag+': invalid projectile coordinates');
}
function runScenario(map,difficulty,mi,di){
  const playerFaction=FACTIONS[(mi+di)%3];
  const enemyFaction=FACTIONS[(mi+di+1)%3];
  const {game:g}=createGame();
  g.newMatch({map,difficulty,playerFaction,enemyFaction,startingCredits:5000});
  const base=g.entities.filter(e=>e.kind==='hq');
  assert.equal(base.length,2);
  assert.ok(!g.fog[28]?.[27]?.seen,'fresh map must not expose the opposing command base');
  let nextAction=5,iteration=0,peak=0,samples=0,platoonSeen=false,supportSeen=false,assaultLaunched=false,
    damageEvents=0,firstDamage=0,oreEvents=0,firstHarvest=0,
    firstObjectiveDiscovery=null,firstPlatoonAt=null;
  const observedRecon=new Set(),observedAircraft=new Set();
  let airfieldSeen=false;
  // Record natural AI technology milestones, without pre-spawning structures,
  // granting free credits, bypassing placement or disabling the AI planner.
  const aiMilestones=Object.fromEntries(
    ['generator','refinery','factory','radar','tech','airfield']
      .map(kind=>[kind,{startedAt:null,operationalAt:null}]));
  let firstAircraftQueuedAt=null,firstAircraftDeployedAt=null;
  const maxSteps=Math.ceil(seconds/frame);
  let previousDamage=0,previousOre=0;
  for(let i=0;i<maxSteps&&g.state==='playing';i++){
    if(g.time>=nextAction){
      scriptedPlayer(g,iteration++);
      nextAction+=7.5;
    }
    g.step(frame);
    peak=Math.max(peak,g.entities.length);
    for(const e of g.entities){
      if(e.owner!==1||e.hp<=0)continue;
      const milestone=aiMilestones[e.kind];
      if(milestone){
        if(milestone.startedAt===null)milestone.startedAt=Number(g.time.toFixed(1));
        if(e.built&&milestone.operationalAt===null)
          milestone.operationalAt=Number(g.time.toFixed(1));
      }
      if(e.kind==='aircraft'&&firstAircraftDeployedAt===null)
        firstAircraftDeployedAt=Number(g.time.toFixed(1));
    }
    if(firstAircraftQueuedAt===null&&g.queues.some(q=>q.side===1&&q.key==='aircraft'))
      firstAircraftQueuedAt=Number(g.time.toFixed(1));
    if(g.aiPlatoon){
      platoonSeen=true;
      if(firstPlatoonAt===null)firstPlatoonAt=g.time;
    }
    if(g.aiSupportPlatoon)supportSeen=true;
    if(g.aiPlatoon?.phase==='assault'||g.aiSupportPlatoon?.phase==='assault')assaultLaunched=true;
    if(firstObjectiveDiscovery===null&&g.intel[1].some(report=>
      report.type==='building'&&g.time-report.time<=180))
      firstObjectiveDiscovery=g.time;
    for(const unit of g.entities){
      if(unit.owner!==1)continue;
      if(unit.kind==='recon')observedRecon.add(unit.id);
      if(unit.kind==='aircraft')observedAircraft.add(unit.id);
      if(unit.kind==='airfield')airfieldSeen=true;
    }
    if(i%Math.max(1,Math.round(12/frame))===0){
      checkIntegrity(g,map+'/'+difficulty+' @'+g.time.toFixed(1));
      samples++;
      const damage=g.stats[0].damageDealt+g.stats[1].damageDealt;
      const ore=g.stats[0].oreHarvested+g.stats[1].oreHarvested;
      if(damage>previousDamage){damageEvents++;if(!firstDamage)firstDamage=g.time;}
      if(ore>previousOre){oreEvents++;if(!firstHarvest)firstHarvest=g.time;}
      previousDamage=damage;previousOre=ore;
    }
  }
  checkIntegrity(g,map+'/'+difficulty+' end');
  const units=side=>g.entities.filter(e=>e.owner===side&&e.type==='unit'&&e.hp>0).length;
  const buildings=side=>g.entities.filter(e=>e.owner===side&&e.type==='building'&&e.hp>0).length;
  const outcome=g.state==='finished'?g.lastBattleSummary?.outcome||'ended':'time limit';
  const reconAlive=g.entities.filter(e=>e.owner===1&&e.kind==='recon'&&e.hp>0).length;
  const aircraftAlive=g.entities.filter(e=>e.owner===1&&e.kind==='aircraft'&&e.hp>0).length;
  const aiSurveyPercent=Math.round(g.aiExplored.size/(34*34)*1000)/10;
  return {map,difficulty,playerFaction,enemyFaction,seconds:Math.round(g.time),outcome,
    credits:[...g.players.map(p=>Math.floor(p.credits))],
    harvest:[...g.stats.map(s=>Math.round(s.oreHarvested))],
    spent:[...g.stats.map(s=>Math.round(s.creditsSpent))],
    damage:[...g.stats.map(s=>Math.round(s.damageDealt))],
    kills:[...g.stats.map(s=>s.enemyUnitsDestroyed)],
    units:[units(0),units(1)],buildings:[buildings(0),buildings(1)],
    peakEntities:peak,platoonSeen,supportSeen,assaultLaunched,
    assaultReroutes:g.aiAssaultReroutes||0,rallyResumes:g.aiRallyResumes||0,
    siegeFocusOrders:g.aiSiegeOrders||0,aiStructureHits:g.aiSiegeHits||0,firstDamage:Math.round(firstDamage),
    firstHarvest:Math.round(firstHarvest),damageEvents,oreEvents,samples,
    firstObjectiveDiscovery:firstObjectiveDiscovery===null?null:Math.round(firstObjectiveDiscovery),
    firstPlatoonAt:firstPlatoonAt===null?null:Math.round(firstPlatoonAt),
    aiSurveyPercent,reconBuilt:observedRecon.size,
    reconAlive,reconLost:Math.max(0,observedRecon.size-reconAlive),
    airfieldSeen,aircraftBuilt:observedAircraft.size,aircraftAlive,
    aircraftLost:Math.max(0,observedAircraft.size-aircraftAlive),
    aiMilestones,firstAircraftQueuedAt,firstAircraftDeployedAt};
}
const results=[];
for(let mi=0;mi<MAPS.length;mi++)for(let di=0;di<DIFFICULTIES.length;di++){
  // One standard-difficulty match per map yields all three enemy factions.
  if(progression&&di!==1)continue;
  const result=runScenario(MAPS[mi],DIFFICULTIES[di],mi,di);
  results.push(result);
  if(!options.includes('--json'))console.log(
    [result.map.padEnd(8),result.difficulty.padEnd(8),
     result.playerFaction.slice(0,4)+'/'+result.enemyFaction.slice(0,4),
     String(result.seconds).padStart(4)+'s',
     'ore '+result.harvest.join('/'),
     'damage '+result.damage.join('/'),
     'units '+result.units.join('/'),
     result.outcome].join(' | '));
}
const report={
  schema:'chrono-dominion-balance-lab-v1',version:'2.42.0',
  mode:progression?'natural-ai-progression':'standard-matrix',
  simulationSeconds:seconds,simulationStep:frame,
  disclaimer:'Scripted-player scenario coverage, not real human win rates or a verified fair multiplayer balance benchmark.',
  scenarios:results.length,results,
  summary:{
    totalOre:results.reduce((n,r)=>n+r.harvest[0]+r.harvest[1],0),
    totalDamage:results.reduce((n,r)=>n+r.damage[0]+r.damage[1],0),
    casesWithIncome:results.filter(r=>r.harvest[0]+r.harvest[1]>0).length,
    casesWithCombat:results.filter(r=>r.damage[0]+r.damage[1]>0).length,
    casesWithPlatoons:results.filter(r=>r.platoonSeen).length,
    casesWithAssaultLaunches:results.filter(r=>r.assaultLaunched).length,
    totalAssaultReroutes:results.reduce((n,r)=>n+r.assaultReroutes,0),
    totalRallyResumes:results.reduce((n,r)=>n+r.rallyResumes,0),
    casesWithSiegeFocus:results.filter(r=>r.siegeFocusOrders>0).length,
    totalSiegeFocusOrders:results.reduce((n,r)=>n+r.siegeFocusOrders,0),
    totalAIStructureHits:results.reduce((n,r)=>n+r.aiStructureHits,0),
    casesWithObjectivesFound:results.filter(r=>r.firstObjectiveDiscovery!==null).length,
    casesWithRecon:results.filter(r=>r.reconBuilt>0).length,
    totalReconLost:results.reduce((n,r)=>n+r.reconLost,0),
    casesWithAirfields:results.filter(r=>r.airfieldSeen).length,
    casesWithAIFactories:results.filter(r=>r.aiMilestones.factory.operationalAt!==null).length,
    casesWithAIRadars:results.filter(r=>r.aiMilestones.radar.operationalAt!==null).length,
    casesWithAITechLabs:results.filter(r=>r.aiMilestones.tech.operationalAt!==null).length,
    casesWithAIAirfields:results.filter(r=>r.aiMilestones.airfield.operationalAt!==null).length,
    casesWithAIQueuedAircraft:results.filter(r=>r.firstAircraftQueuedAt!==null).length,
    casesWithAircraft:results.filter(r=>r.aircraftBuilt>0).length,
    totalAircraftLost:results.reduce((n,r)=>n+r.aircraftLost,0),
    meanAISurveyPercent:Number((results.reduce((n,r)=>n+r.aiSurveyPercent,0)/results.length).toFixed(1)),
    peakEntities:Math.max(...results.map(r=>r.peakEntities)),
    mapEconomy:Object.fromEntries(MAPS.map(map=>{
      const cases=results.filter(r=>r.map===map);
      return [map,{
        playerOre:cases.reduce((n,r)=>n+r.harvest[0],0),
        enemyOre:cases.reduce((n,r)=>n+r.harvest[1],0),
        enemyToPlayerOreRatio:Number((
          cases.reduce((n,r)=>n+r.harvest[1],0)/
          Math.max(1,cases.reduce((n,r)=>n+r.harvest[0],0))
        ).toFixed(3))
      }];
    }))
  }
};
if(out)writeFileSync(out,JSON.stringify(report,null,2)+'\n');
if(options.includes('--json'))console.log(JSON.stringify(report,null,2));
else console.log('BALANCE LAB SUMMARY:',JSON.stringify(report.summary));
assert.equal(results.length,progression?3:9,
  'complete '+(progression?'three-faction natural progression':'three-map/three-difficulty')+' matrix');
if(progression){
  assert.equal(new Set(results.map(r=>r.enemyFaction)).size,3,
    'natural progression must cover all three AI factions');
  assert.ok(report.summary.casesWithAIFactories>=1,
    'extended progression must reach an operational AI factory in at least one scenario');
}
for(const r of results){
  for(const milestone of Object.values(r.aiMilestones)){
    assert.ok(milestone.operationalAt===null||milestone.startedAt!==null&&
      milestone.operationalAt>=milestone.startedAt,
      'AI technology must not become operational before construction is observed');
  }
  assert.ok(r.firstAircraftDeployedAt===null||r.firstAircraftQueuedAt!==null&&
    r.firstAircraftDeployedAt>=r.firstAircraftQueuedAt,
    'AI aircraft must be purchased through a production queue before deployment');
}
assert.ok(results.every(r=>r.seconds>0&&r.samples>0));
assert.ok(report.summary.peakEntities>=16,'actual units and structures were created');
assert.ok(results.every(r=>r.aiSurveyPercent>=0&&r.aiSurveyPercent<=100&&
  r.reconLost>=0&&r.reconLost<=r.reconBuilt&&
  r.aircraftLost>=0&&r.aircraftLost<=r.aircraftBuilt&&
  Number.isInteger(r.assaultReroutes)&&r.assaultReroutes>=0&&
  Number.isInteger(r.siegeFocusOrders)&&r.siegeFocusOrders>=0&&
  Number.isInteger(r.aiStructureHits)&&r.aiStructureHits>=0&&
  (r.firstObjectiveDiscovery===null||r.firstObjectiveDiscovery>=0&&
    r.firstObjectiveDiscovery<=r.seconds+1)),
  'recon survival and objective-discovery telemetry must be internally consistent');
assert.equal(report.summary.casesWithIncome,results.length,
  'all scripted scenarios must generate some delivered income');
assert.ok(report.summary.casesWithCombat>=Math.ceil(results.length*2/3),
  'the battlefield simulator must exercise actual projectile combat on most maps');
if(seconds>=220){
  for(const match of results.filter(r=>r.map==='desert'))
    assert.ok(match.harvest[1]>=3000,
      'Ashen Basin AI economic regression: inaccessible ore or failed deliveries');
}
console.log('PASS: '+results.length+' deterministic headless skirmish scenarios, AI technology milestones, economy integrity, fog, recon telemetry and production safety');
