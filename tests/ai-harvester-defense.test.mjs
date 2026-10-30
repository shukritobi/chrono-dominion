import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {traceHarvesterLethalImpacts} from '../tools/harvester-impact-telemetry.mjs';

// Exercise the production AI engagement planner, sensors, orders and legacy saves.
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const noop=()=>{},drawing=new Proxy({},{get:(o,k)=>o[k]??noop,
  set:(o,k,v)=>{o[k]=v;return true;}});
const catalog={addEventListener:noop};
runInNewContext(read('maps/catalog.js'),{window:catalog,console},{timeout:1000});
function game(faction){
  const nodes=new Map(),storage=new Map();
  const document={getElementById(id){
    if(!nodes.has(id))nodes.set(id,{
      id,value:'',disabled:false,style:{},dataset:{},
      classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
      addEventListener:noop,setAttribute:noop,querySelectorAll:()=>[],
      querySelector:()=>({disabled:true,textContent:''}),
      getContext:()=>drawing,setPointerCapture:noop,
      getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
      set innerHTML(v){this._html=v;},get innerHTML(){return this._html||'';},
      set textContent(v){this._text=v;},get textContent(){return this._text||'';}
    });return nodes.get(id);
  }};
  const window={...catalog};
  const localStorage={getItem:k=>storage.get(k)??null,
    setItem:(k,v)=>storage.set(k,String(v))};
  runInNewContext(read('game.js').replace('  new Game();','  window.__game=new Game();'),{
    window,document,localStorage,console,performance:{now:()=>0},
    devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop
  },{timeout:10000});
  const g=window.__game;
  g.updateUI=noop;g.notify=noop;g.draw=noop;
  g.newMatch({map:'verdant',difficulty:'standard',
    playerFaction:'coalition',enemyFaction:faction,startingCredits:5000});
  // Isolate the real planner from opening skirmish traffic, not from visibility.
  g.entities=[];g.nextId=1;g.time=100;
  const hq=g.add(1,'hq',26,26);
  g.add(1,'refinery',24,26);
  const worker=g.add(1,'harvester',14,14);
  const guard=g.add(1,'tank',9,14);
  const enemy=g.add(0,'soldier',17,14);
  return {g,hq,worker,guard,enemy};
}
for(const faction of ['coalition','federation','psionic']){
  {
    const {g,hq,worker,guard,enemy}=game(faction);
    assert.ok(g.sideCanSee(1,enemy),faction+': worker sensor sees local threat');
    assert.ok(Math.hypot(guard.x-enemy.x,guard.y-enemy.y)>6.5,
      'guard is beyond ordinary opportunistic target acquisition');
    const assignments=g.assignAIEngagements([guard],[],hq);
    assert.equal(assignments.get(guard.id),enemy.id,
      faction+': remote visible worker threat receives one local escort');
    assert.equal(guard.order?.type,'attack');
    assert.equal(guard.order?.id,enemy.id);
    assert.ok(g.saveGame()&&g.loadGame(),
      faction+': v1 save/load remains compatible with ordinary attack orders');
    assert.equal(g.entityById(guard.id)?.order?.id,enemy.id);
    assert.equal(g.entityById(worker.id)?.kind,'harvester');
  }
  {
    // The scout provides legitimate sight, but is not an available escort.
    // A heavy tank can fire from five tiles away; intercept before it reaches
    // the old fixed 4.5-tile harvester-defense trigger.
    const {g,hq,worker,guard,enemy}=game(faction);
    enemy.hp=0;guard.x=12;
    const scout=g.add(1,'recon',18,14);
    const siege=g.add(0,'heavy',20,14);
    assert.ok(g.sideCanSee(1,siege),faction+': scout spots approaching siege tank');
    assert.ok(Math.hypot(guard.x-siege.x,guard.y-siege.y)>6.5,
      faction+': defender cannot acquire this target through ordinary local combat');
    assert.equal(g.assignAIEngagements([guard],[],hq).get(guard.id),siege.id,
      faction+': ranged siege threat receives a preemptive worker escort');
    siege.x=20.7;guard.x=12.3;
    assert.equal(g.assignAIEngagements([guard],[],hq).has(guard.id),false,
      faction+': do not intercept a distant tank outside its firing approach');
    siege.hp=0;
    const rifle=g.add(0,'soldier',19,14);
    guard.x=12;
    assert.equal(g.assignAIEngagements([guard],[],hq).has(guard.id),false,
      faction+': short-range infantry must not inherit the siege interception radius');
    rifle.hp=0;siege.hp=100;siege.x=20;scout.hp=0;
    assert.equal(g.sideCanSee(1,siege),false,
      faction+': worker and remote defender cannot see the tank without scout');
    assert.equal(g.assignAIEngagements([guard],[],hq).has(guard.id),false,
      faction+': preemptive escorts cannot pursue hidden ranged threats');
    assert.equal(worker.kind,'harvester');
  }
  {
    const {g,hq,guard,enemy}=game(faction);
    enemy.x=19.5;
    assert.equal(g.sideCanSee(1,enemy),false,
      faction+': no sensor may reveal the remote attacker');
    assert.equal(g.assignAIEngagements([guard],[],hq).has(guard.id),false,
      faction+': cannot pursue a hidden enemy from omniscient positions');
  }
  {
    const {g,hq,worker,guard,enemy}=game(faction);
    worker.hp=0;
    g.add(1,'recon',18,14);
    assert.equal(g.sideCanSee(1,enemy),true);
    assert.equal(g.assignAIEngagements([guard],[],hq).has(guard.id),false,
      faction+': dead workers cannot trigger remote escort assignments');
  }
  {
    const {g,hq,guard,enemy}=game(faction);
    guard.order={type:'attackMove',x:5,y:5};
    assert.equal(g.assignAIEngagements([guard],[],hq).has(guard.id),false,
      faction+': do not recall a distant committed assault formation');
    assert.equal(guard.order.type,'attackMove');
  }
  {
    const {g,hq,guard,enemy}=game(faction);
    const baseGuard=g.add(1,'tank',25,24);
    const invader=g.add(0,'soldier',26,24);
    const assignments=g.assignAIEngagements([baseGuard,guard],[invader],hq);
    assert.equal(assignments.get(baseGuard.id),invader.id,
      faction+': immediate base defense gets first claim');
    assert.equal(assignments.get(guard.id),enemy.id,
      faction+': a second defender may still protect the worker');
  }
  {
    const {g,hq,worker,guard,enemy}=game(faction);
    worker.y=16;
    const second=g.add(0,'soldier',17,16),third=g.add(0,'soldier',17,18);
    const guard2=g.add(1,'tank',9,16),guard3=g.add(1,'tank',9,18);
    const assignments=g.assignAIEngagements([guard,guard2,guard3],[],hq);
    assert.equal(assignments.size,2,
      faction+': at most two ground escorts may be diverted in one AI decision');
    assert.ok([enemy.id,second.id,third.id].includes(assignments.get(guard.id))||
      !assignments.has(guard.id));
  }
}
// A rifle squad closer to a visible siege threat should not always crowd
// out a nearby tank that can return meaningful ranged fire.
for(const faction of ['coalition','federation','psionic']){
  const {g,hq,worker,guard,enemy}=game(faction);
  enemy.hp=0;
  guard.x=13;guard.y=16;
  const infantry=g.add(1,'soldier',15,14);
  const scout=g.add(1,'recon',18,14);
  const siege=g.add(0,'heavy',20,14);
  assert.ok(g.sideCanSee(1,siege),faction+': scout genuinely spots siege tank');
  assert.ok(Math.hypot(guard.x-siege.x,guard.y-siege.y)>6.5,
    faction+': tank cannot acquire siege through ordinary local combat');
  const result=g.assignAIEngagements([guard,infantry],[],hq);
  assert.equal(result.get(guard.id),siege.id,
    faction+': prioritise available armour against an outranging siege threat');
  assert.equal(guard.order?.type,'attack');
  assert.ok(g.saveGame()&&g.loadGame(),
    faction+': armour response uses existing serializable attack order');
  assert.equal(g.entityById(guard.id)?.order?.id,siege.id);
  assert.equal(g.entityById(worker.id)?.kind,'harvester');
  // For short-range enemies, retain the established nearest-first ranking.
  g.entityById(siege.id).hp=0;
  const rifle=g.add(0,'soldier',20,14);
  assert.ok(g.sideCanSee(1,rifle));
  const currentGuard=g.entityById(guard.id),currentInfantry=g.entityById(infantry.id);
  currentGuard.order=null;currentInfantry.order=null;
  const shortRange=g.assignAIEngagements([currentGuard,currentInfantry],[],g.entityById(hq.id));
  assert.equal(shortRange.get(infantry.id),rifle.id,
    faction+': short-range threat remains a nearest-defender engagement');
  assert.equal(shortRange.has(guard.id),false,
    faction+': distant armour is not needlessly recalled for rifle threats');
  assert.equal(scout.hp>0,true);
}
// A single long-range threat can require concentrated defensive fire. The
// global two-escort cap still applies even if three nearby tanks are free.
for(const faction of ['coalition','federation','psionic']){
  const {g,hq,worker,guard,enemy}=game(faction);
  enemy.hp=0;
  guard.x=12;guard.y=14;
  const second=g.add(1,'tank',13,16);
  const third=g.add(1,'tank',12,16);
  const scout=g.add(1,'recon',18,14);
  const siege=g.add(0,'heavy',20,14);
  assert.ok(g.sideCanSee(1,siege),faction+': scout spots long-range threat');
  const assignments=g.assignAIEngagements([guard,second,third],[],hq);
  assert.equal(assignments.size,2,faction+': one siege threat gets two nearby escorts, not three');
  assert.equal(assignments.get(guard.id),siege.id,
    faction+': armoured lead escort targets the siege tank');
  assert.ok([...assignments.values()].every(id=>id===siege.id),
    faction+': both escorts focus the same observed siege threat');
  assert.ok(g.saveGame()&&g.loadGame(),faction+': focused attack orders remain serializable');
  assert.equal(g.entities.filter(u=>u.owner===1&&[guard.id,second.id,third.id].includes(u.id)&&
    u.order?.id===siege.id).length,2);
  assert.equal(g.entityById(worker.id)?.kind,'harvester');
  assert.equal(g.entityById(scout.id)?.kind,'recon');
}

// When a rifleman and siege tank threaten the same ore truck, the two
// available escorts must not both chase the nearer rifleman or focus siege
// while leaving the second visible threat entirely unchallenged.
for(const faction of ['coalition','federation','psionic']){
  const {g,hq,worker,guard,enemy:rifle}=game(faction);
  guard.x=14;guard.y=14;
  const infantry=g.add(1,'soldier',14,16);
  const scout=g.add(1,'recon',18,14);
  const siege=g.add(0,'heavy',20,14);
  assert.ok(g.sideCanSee(1,rifle)&&g.sideCanSee(1,siege),
    faction+': both competing ore threats must be visible to AI sensors');
  assert.ok(Math.hypot(siege.x-worker.x,siege.y-worker.y)>5,
    faction+': siege is approaching, not already firing at the worker');
  const assignments=g.assignAIEngagements([guard,infantry],[],hq);
  assert.equal(assignments.size,2,faction+': two escorts cover two threats');
  assert.equal(assignments.get(guard.id),siege.id,
    faction+': anti-siege armour gets the higher-danger approaching tank');
  assert.equal(assignments.get(infantry.id),rifle.id,
    faction+': the second escort still handles the nearby rifleman');
  assert.ok(g.saveGame()&&g.loadGame(),faction+': triaged orders survive legacy saves');
  assert.equal(g.entityById(guard.id)?.order?.id,siege.id);
  assert.equal(g.entityById(infantry.id)?.order?.id,rifle.id);
  assert.equal(g.entityById(scout.id)?.kind,'recon');
}
// A second visible threat on a different ore route must not consume an
// escort slot when none of the available defenders can reach that route.
// Otherwise one nearby siege tank gets only one guard, leaving a second
// eligible tank idle even though the distant worker cannot be protected.
for(const faction of ['coalition','federation','psionic']){
  const {g,hq,worker,guard,enemy}=game(faction);
  enemy.hp=0;
  guard.x=12;guard.y=14;
  const second=g.add(1,'tank',13,16);
  const scout=g.add(1,'recon',18,14);
  const siege=g.add(0,'heavy',20,14);
  const remoteWorker=g.add(1,'harvester',27,16);
  const remoteRifle=g.add(0,'soldier',27,17);
  assert.ok(g.sideCanSee(1,siege)&&g.sideCanSee(1,remoteRifle),
    faction+': both local siege and distant ore threats are genuinely visible');
  assert.ok(Math.hypot(second.x-remoteRifle.x,second.y-remoteRifle.y)>8.5,
    faction+': no available escort can reach the distant threat');
  const assignments=g.assignAIEngagements([guard,second],[],hq);
  assert.equal(assignments.size,2,
    faction+': unreachable second threat must not leave a local escort idle');
  assert.equal(assignments.get(guard.id),siege.id,
    faction+': lead escort must engage the local siege tank');
  assert.equal(assignments.get(second.id),siege.id,
    faction+': spare escort should reinforce the reachable siege engagement');
  assert.ok(g.saveGame()&&g.loadGame(),
    faction+': focused orders and both workers survive the legacy save format');
  assert.equal(g.entityById(guard.id)?.order?.id,siege.id);
  assert.equal(g.entityById(second.id)?.order?.id,siege.id);
  assert.equal(g.entityById(worker.id)?.kind,'harvester');
  assert.equal(g.entityById(remoteWorker.id)?.kind,'harvester');
  assert.equal(g.entityById(scout.id)?.kind,'recon');
}

// Two threats may both be reachable, yet only one escort can reach the
// second threat. Preserve that uniquely eligible escort instead of assigning
// the nearest tank to siege and leaving its partner unable to defend worker #2.
for(const faction of ['coalition','federation','psionic']){
  const {g,hq,worker,guard,enemy}=game(faction);
  enemy.hp=0;
  guard.x=14;guard.y=16;
  const siegeOnly=g.add(1,'tank',12,14);
  const scout=g.add(1,'recon',18,14);
  const siege=g.add(0,'heavy',20,14);
  const otherWorker=g.add(1,'harvester',18,22);
  const rifle=g.add(0,'soldier',18,23);
  assert.ok(g.sideCanSee(1,siege)&&g.sideCanSee(1,rifle),
    faction+': both attackers are genuinely visible to AI sensors');
  assert.ok(Math.hypot(guard.x-rifle.x,guard.y-rifle.y)<=8.5,
    faction+': the versatile escort can reach the second attacker');
  assert.ok(Math.hypot(siegeOnly.x-rifle.x,siegeOnly.y-rifle.y)>8.5,
    faction+': the other tank cannot reach the second attacker');
  assert.ok(Math.hypot(siegeOnly.x-siege.x,siegeOnly.y-siege.y)<=8.5,
    faction+': the second tank can instead engage siege');
  const assignments=g.assignAIEngagements([guard,siegeOnly],[],hq);
  assert.equal(assignments.size,2,
    faction+': use both escorts to cover both serviceable threats');
  assert.equal(assignments.get(siegeOnly.id),siege.id,
    faction+': siege-only tank must be assigned to the siege threat');
  assert.equal(assignments.get(guard.id),rifle.id,
    faction+': unique versatile escort must protect the second worker');
  assert.ok(g.saveGame()&&g.loadGame(),
    faction+': both distinct attack orders survive legacy saves');
  assert.equal(g.entityById(siegeOnly.id)?.order?.id,siege.id);
  assert.equal(g.entityById(guard.id)?.order?.id,rifle.id);
  assert.equal(g.entityById(worker.id)?.kind,'harvester');
  assert.equal(g.entityById(otherWorker.id)?.kind,'harvester');
  assert.equal(g.entityById(scout.id)?.kind,'recon');
}

// Observe the actual projectile that kills an AI ore truck. A nearby enemy
// is not automatically the killer, and non-projectile losses stay unattributed.
for(const faction of ['coalition','federation','psionic']){
  const {g,worker}=game(faction);
  const attacker=g.add(0,'tank',worker.x+.5,worker.y);
  const bystander=g.add(0,'soldier',worker.x+.7,worker.y);
  worker.hp=1;
  const impacts=traceHarvesterLethalImpacts(g);
  g.shoot(attacker,worker);
  g.updateProjectiles(.2);
  assert.ok(worker.hp<=0,faction+': real projectile killed the worker');
  assert.deepEqual(impacts.get(worker.id),{
    sourceId:attacker.id,sourceKind:'tank',attackerOwner:0,
    damage:Number(g.stat(attacker,'damage').toFixed(2))
  },faction+': record actual lethal shot, not closer bystander');
  assert.equal(impacts.has(bystander.id),false);
  const unrelated=g.add(1,'harvester',worker.x+2,worker.y);
  unrelated.hp=0;
  g.recordLoss(unrelated,0,false);
  assert.equal(impacts.has(unrelated.id),false,
    faction+': unrelated non-projectile death has no invented shooter');
}

// An actual tank hit should trigger only the nearby tactical escort planner.
// Running the entire strategic AI early was rejected after the 720-second
// economy gate detected a severe Desert income regression.
for(const faction of ['coalition','federation','psionic']){
  {
    const {g,worker,guard,enemy}=game(faction);
    enemy.hp=0;
    guard.x=12;guard.y=14;
    const tank=g.add(0,'tank',18,14);
    assert.ok(g.sideCanSee(1,tank),faction+': ore truck genuinely sees attacking tank');
    g.nextAI=g.time+8;
    g.shoot(tank,worker);
    g.updateProjectiles(1);
    assert.ok(worker.hp>0&&worker.hp<worker.maxHp,
      faction+': real tank projectile damaged but did not kill worker');
    assert.equal(g.nextAI,g.time+8,
      faction+': urgent tactical reaction must not accelerate strategic AI spending');
    assert.equal(g.nextHarvesterResponseAt,g.time+4,
      faction+': tactical response is rate-limited');
    assert.equal(guard.order?.id,tank.id,
      faction+': existing base-first escort planner reacts to actual tank impact');
    let strategicCalls=0;
    g.runAI=()=>{strategicCalls++;};
    g.step(.05);
    assert.equal(strategicCalls,0,
      faction+': ordinary production and strategy remain on original schedule');
    assert.equal(g.entityById(guard.id)?.order?.id,tank.id,
      faction+': escort attack order persists into real simulation movement');
  }
  {
    const {g,worker,guard,enemy}=game(faction);
    enemy.hp=0;guard.x=13;guard.y=14;
    const heavy=g.add(0,'heavy',19,14);
    assert.equal(g.sideCanSee(1,heavy),false,
      faction+': siege at five tiles is outside worker and escort sight');
    g.nextAI=g.time+8;
    g.shoot(heavy,worker);
    g.updateProjectiles(1.1);
    assert.equal(g.nextHarvesterResponseAt,0,
      faction+': hidden shooter cannot trigger tactical orders from projectile metadata');
    assert.equal(guard.order?.id,undefined,
      faction+': no omniscient attack order on hidden siege');
    const scout=g.add(1,'recon',18,14);
    assert.ok(g.sideCanSee(1,heavy),
      faction+': scout now legitimately exposes attacker');
    g.shoot(heavy,worker);
    g.updateProjectiles(1.1);
    assert.equal(guard.order?.id,heavy.id,
      faction+': observed siege hit receives immediate local escort');
    assert.equal(g.nextAI,g.time+8,
      faction+': local defense leaves strategic planning unchanged');
    guard.order=null;
    g.time+=1;g.nextAI=g.time+8;
    g.shoot(heavy,worker);
    g.updateProjectiles(1.1);
    assert.equal(guard.order,null,
      faction+': repeated impacts inside cooldown do not replan tactical orders');
    g.time+=4;g.nextAI=g.time+8;
    g.shoot(heavy,worker);
    g.updateProjectiles(1.1);
    assert.equal(guard.order?.id,heavy.id,
      faction+': later observed hit may reassign a local escort');
    assert.ok(g.saveGame()&&g.loadGame(),
      faction+': tactical orders preserve legacy save/load');
    assert.equal(g.nextHarvesterResponseAt,0,
      faction+': transient cooldown resets after loading');
    assert.equal(g.entityById(guard.id)?.order?.id,heavy.id,
      faction+': saved attack order remains intact');
    assert.equal(g.entityById(scout.id)?.kind,'recon');
  }
}

// A tank firing at a visible AI worker is confirmed hostile intent before
// its moving projectile arrives. The existing tactical planner should act at
// launch, without waiting for damage or advancing the economic AI schedule.
for(const faction of ['coalition','federation','psionic']){
  {
    const {g,worker,guard,enemy}=game(faction);
    enemy.hp=0;guard.x=12;guard.y=14;
    const tank=g.add(0,'tank',18,14);
    g.nextAI=g.time+8;
    const hp=worker.hp;
    g.shoot(tank,worker);
    assert.equal(worker.hp,hp,faction+': no damage occurs at launch');
    assert.equal(g.projectiles.length,1,faction+': real projectile is in flight');
    assert.equal(g.projectiles[0].age,0,faction+': threat was observed before impact');
    assert.equal(guard.order?.id,tank.id,
      faction+': nearby escort reacts to visible tank launch before first hit');
    assert.equal(g.nextHarvesterResponseAt,g.time+4,
      faction+': early interception shares existing four-second cooldown');
    assert.equal(g.nextAI,g.time+8,
      faction+': launching a shot cannot accelerate economic decisions');
    g.updateProjectiles(.1);
    assert.equal(worker.hp,hp,faction+': early interception does not fabricate damage');
    assert.equal(guard.order?.id,tank.id);
    guard.order=null;
    g.updateProjectiles(1);
    assert.ok(worker.hp<hp,faction+': projectile eventually resolves normal damage');
    assert.equal(guard.order,null,
      faction+': impact inside cooldown cannot issue duplicate escort orders');
    assert.ok(g.saveGame()&&g.loadGame(),
      faction+': unchanged v1 save format accepts early-response combat state');
    assert.equal(g.nextHarvesterResponseAt,0,
      faction+': early-response cooldown is transient across reload');
  }
  {
    const {g,worker,guard,enemy}=game(faction);
    enemy.hp=0;guard.x=12;guard.y=14;
    const heavy=g.add(0,'heavy',19,14);
    g.nextAI=g.time+8;
    assert.equal(g.sideCanSee(1,heavy),false,
      faction+': ranged shooter is initially outside AI sensors');
    g.shoot(heavy,worker);
    assert.equal(guard.order?.id,undefined,
      faction+': projectile launch cannot reveal a hidden attacker');
    assert.equal(g.nextHarvesterResponseAt,0,
      faction+': hidden launch must not consume tactical cooldown');
    g.add(1,'recon',18,14);
    assert.ok(g.sideCanSee(1,heavy));
    g.updateProjectiles(1.1);
    assert.equal(guard.order?.id,heavy.id,
      faction+': later visible impact still activates fallback response');
  }
  {
    const {g,worker,guard,enemy}=game(faction);
    enemy.hp=0;guard.x=12;guard.y=14;g.nextAI=g.time+8;
    const rifle=g.add(0,'soldier',17,14);
    g.shoot(rifle,worker);
    assert.equal(guard.order?.id,rifle.id,
      faction+': observed infantry launch now triggers harvester defense');
    assert.equal(g.nextHarvesterResponseAt,g.time+4);
    // Isolate the non-harvester shot from the previous legitimate response.
    guard.order=null;g.nextHarvesterResponseAt=0;
    const tank=g.add(0,'tank',18,16);
    const defender=g.add(1,'tank',14,16);
    g.shoot(tank,defender);
    assert.equal(guard.order?.id,undefined,
      faction+': ordinary combat against defenders is not a harvester emergency');
    assert.equal(g.nextHarvesterResponseAt,0);
  }
}

// A verified visible tank shot can summon an otherwise idle reserve escort
// slightly beyond the ordinary strategic engagement radius. This addresses
// the archived Verdant worker loss with an idle defender 8.47 tiles away,
// without broadening every normal AI tick or using hidden enemy coordinates.
for(const faction of ['coalition','federation','psionic']){
  {
    const {g,hq,worker,guard,enemy}=game(faction);
    enemy.hp=0;guard.x=8;guard.y=14;
    const tank=g.add(0,'tank',18,14);
    g.nextAI=g.time+8;
    assert.ok(g.sideCanSee(1,tank),faction+': worker observes real shooter');
    assert.equal(g.assignAIEngagements([guard],[],hq).has(guard.id),false,
      faction+': ordinary AI tick retains its original local escort radius');
    g.shoot(tank,worker);
    assert.equal(guard.order?.id,tank.id,
      faction+': actual observed shot recruits the slightly farther idle escort');
    assert.equal(g.nextAI,g.time+8,
      faction+': urgent response must not accelerate economic AI decisions');
    assert.equal(g.nextHarvesterResponseAt,g.time+4);
    assert.ok(g.saveGame()&&g.loadGame(),faction+': reserve escort order survives v1 saves');
    assert.equal(g.entityById(guard.id)?.order?.id,tank.id);
  }
  {
    const {g,worker,guard,enemy}=game(faction);
    enemy.hp=0;guard.x=5;guard.y=14;
    const tank=g.add(0,'tank',18,14);
    g.nextAI=g.time+8;
    g.shoot(tank,worker);
    assert.equal(guard.order?.id,undefined,
      faction+': a genuinely distant reserve guard must not be recalled');
    assert.equal(g.nextHarvesterResponseAt,0,
      faction+': no eligible escort means no wasted tactical cooldown');
  }
}

// A shooter can be closer to a DIFFERENT ore truck than the one it actually
// fires on. The confirmed-shot reserve response must use the attacked worker
// for escort eligibility; nearest-worker triage is only for routine patrols.
for(const faction of ['coalition','federation','psionic']){
  {
    const {g,hq,worker,guard,enemy}=game(faction);
    enemy.hp=0;guard.x=9;guard.y=8;
    const tank=g.add(0,'tank',18,14);
    const otherWorker=g.add(1,'harvester',19,17);
    assert.ok(Math.hypot(tank.x-otherWorker.x,tank.y-otherWorker.y)<
      Math.hypot(tank.x-worker.x,tank.y-worker.y),
      faction+': the other worker is closer to the actual shooter');
    assert.ok(Math.hypot(guard.x-tank.x,guard.y-tank.y)<=11&&
      Math.hypot(guard.x-worker.x,guard.y-worker.y)<=11&&
      Math.hypot(guard.x-otherWorker.x,guard.y-otherWorker.y)>11,
      faction+': escort can reach shot target, not the nearer worker');
    assert.ok(g.sideCanSee(1,tank),faction+': actual shooter is visible');
    assert.equal(g.assignAIEngagements([guard],[],hq).has(guard.id),false,
      faction+': routine nearest-worker patrol retains the old limits');
    g.nextAI=g.time+8;
    g.shoot(tank,worker);
    assert.equal(guard.order?.id,tank.id,
      faction+': confirmed shot protects the actual attacked worker');
    assert.equal(g.nextAI,g.time+8,
      faction+': shot response does not accelerate strategic spending');
    assert.ok(g.saveGame()&&g.loadGame(),
      faction+': both workers and escort order survive legacy save/load');
    assert.equal(g.entityById(guard.id)?.order?.id,tank.id);
    assert.equal(g.entityById(otherWorker.id)?.kind,'harvester');
  }
  {
    const {g,worker,guard,enemy}=game(faction);
    enemy.hp=0;guard.x=9;guard.y=8;
    const tank=g.add(0,'tank',18,14);
    const otherWorker=g.add(1,'harvester',19,17);
    g.nextAI=g.time+8;
    g.shoot(tank,otherWorker);
    assert.equal(guard.order?.id,undefined,
      faction+': cannot claim an escort that is too far from shot target');
    assert.equal(g.nextHarvesterResponseAt,0,
      faction+': no eligible escort must not consume emergency cooldown');
    assert.equal(worker.hp,worker.maxHp);
  }
}

// An observed tank shot can be too far from an available assault-committed
// escort to justify an emergency order. It must not consume the global
// tactical cooldown and suppress a second, genuinely interceptable shooter.
for(const faction of ['coalition','federation','psionic']){
  const {g,worker,guard,enemy}=game(faction);
  enemy.hp=0;guard.x=10;guard.y=14;
  guard.order={type:'attackMove',x:5,y:5};
  const distant=g.add(0,'tank',18,14);
  g.nextAI=g.time+8;
  assert.ok(g.sideCanSee(1,distant),
    faction+': first tank is genuinely visible from the worker');
  g.shoot(distant,worker);
  assert.equal(guard.order?.type,'attackMove',
    faction+': distant shooter cannot steal an assault-committed guard');
  assert.equal(g.nextHarvesterResponseAt,g.time+4,
    faction+': first unserved shooter remains rate-limited');
  assert.equal(g.unservedHarvesterShooterId,distant.id,
    faction+': only a different shooter can trigger one fallback response');
  const close=g.add(0,'tank',15,14);
  assert.ok(g.sideCanSee(1,close),
    faction+': second tank is also genuinely visible');
  g.shoot(close,worker);
  assert.equal(guard.order?.id,close.id,
    faction+': follow-up shooter gets the available local response');
  assert.equal(g.nextHarvesterResponseAt,g.time+4,
    faction+': successful interception still activates rate limit');
  assert.equal(g.unservedHarvesterShooterId,0,
    faction+': fallback exception closes after successful interception');
  guard.order=null;
  g.shoot(distant,worker);
  assert.equal(guard.order,null,
    faction+': third shot cannot bypass cooldown after fallback is consumed');
  guard.order={type:'attack',id:close.id};
  assert.equal(g.nextAI,g.time+8,
    faction+': neither shot advances economic AI scheduling');
  assert.ok(g.saveGame()&&g.loadGame(),
    faction+': follow-up attack order remains compatible with v1 saves');
  assert.equal(g.entityById(guard.id)?.order?.id,close.id);
}



// An observed tank firing at an operational AI radar is a technology-critical
// base attack. Respond locally at launch, without accelerating the strategic
// planner or reading hidden shooter coordinates from projectile metadata.
for(const faction of ['coalition','federation','psionic']){
  {
    const {g,worker,guard,enemy}=game(faction);
    enemy.hp=0;worker.hp=0;
    guard.x=19;guard.y=24;
    const radar=g.add(1,'radar',24,24);
    const tank=g.add(0,'tank',24,28);
    assert.ok(g.sideCanSee(1,tank),faction+': radar attacker must be observed');
    g.nextAI=g.time+8;
    const hp=radar.hp,credits=g.players[1].credits;
    g.shoot(tank,radar);
    assert.equal(radar.hp,hp,faction+': launch does not deal premature damage');
    assert.equal(guard.order?.id,tank.id,
      faction+': local defender intercepts visible radar attacker at launch');
    assert.equal(g.nextRadarResponseAt,g.time+4,
      faction+': successful radar response uses a four-second cooldown');
    assert.equal(g.nextAI,g.time+8,
      faction+': radar response does not advance the economic AI scheduler');
    assert.equal(g.players[1].credits,credits,
      faction+': tactical response cannot spend production credits');
    guard.order=null;
    g.updateProjectiles(1);
    assert.ok(radar.hp<hp,faction+': actual projectile deals ordinary damage');
    assert.equal(guard.order,null,
      faction+': impact inside cooldown must not duplicate the assignment');
    assert.ok(g.saveGame()&&g.loadGame(),
      faction+': radar engagement preserves legacy save compatibility');
    assert.equal(g.nextRadarResponseAt,0,
      faction+': radar cooldown is transient after load');
  }
  {
    const {g,worker,guard,enemy}=game(faction);
    enemy.hp=0;worker.hp=0;guard.x=8;guard.y=10;
    const radar=g.add(1,'radar',10,10);
    const heavy=g.add(0,'heavy',16,10);
    g.nextAI=g.time+8;
    assert.equal(g.sideCanSee(1,heavy),false,
      faction+': distant siege shooter must initially be hidden');
    g.shoot(heavy,radar);
    assert.equal(guard.order?.id,undefined,
      faction+': hidden projectile launch cannot reveal a shooter');
    assert.equal(g.nextRadarResponseAt,0,
      faction+': hidden shooter must not consume radar response cooldown');
    g.add(1,'recon',13,10);
    assert.ok(g.sideCanSee(1,heavy),
      faction+': actual scout now reveals siege shooter');
    g.updateProjectiles(1.5);
    assert.equal(guard.order?.id,heavy.id,
      faction+': impact fallback intercepts a newly visible attacker');
  }
  {
    // An unseen infantry launch cannot reveal the shooter. An actual scout
    // contact at impact can still authorize a bounded radar interception.
    const {g,worker,guard,enemy}=game(faction);
    enemy.hp=0;worker.hp=0;guard.x=8;guard.y=10;
    const radar=g.add(1,'radar',10,10);
    const rifle=g.add(0,'soldier',16,10);
    g.nextAI=g.time+8;
    assert.equal(g.sideCanSee(1,rifle),false,
      faction+': distant infantry is not initially visible');
    g.shoot(rifle,radar);
    assert.equal(guard.order?.id,undefined,
      faction+': hidden infantry shot cannot leak enemy position');
    assert.equal(g.nextRadarResponseAt,0);
    g.add(1,'recon',13,10);
    assert.ok(g.sideCanSee(1,rifle));
    g.updateProjectiles(1.2);
    assert.equal(guard.order?.id,rifle.id,
      faction+': newly observed infantry can be intercepted on impact');
  }
  {
    const {g,worker,guard,enemy}=game(faction);
    enemy.hp=0;worker.hp=0;guard.x=19;guard.y=24;
    const radar=g.add(1,'radar',24,24);
    const rifle=g.add(0,'soldier',24,28);
    g.nextAI=g.time+8;
    const beforeCredits=g.players[1].credits;
    g.shoot(rifle,radar);
    assert.equal(guard.order?.id,rifle.id,
      faction+': visible infantry firing at radar must receive an immediate escort');
    assert.equal(g.nextRadarResponseAt,g.time+4,
      faction+': infantry interception uses the same bounded cooldown');
    assert.equal(g.players[1].credits,beforeCredits,
      faction+': infantry response must not spend AI credits');
    guard.order=null;
    g.nextRadarResponseAt=0;
    rifle.hp=0; // Isolate the second shooter from the prior visible threat.
    const specialist=g.add(0,'specialist',24,29);
    g.shoot(specialist,radar);
    assert.equal(guard.order?.id,specialist.id,
      faction+': visible specialist attacks must also defend radar');
    guard.order=null;
    g.nextRadarResponseAt=0;
    const tank=g.add(0,'tank',24,29);
    const factory=g.add(1,'factory',24,25);
    g.shoot(tank,factory);
    assert.equal(g.nextRadarResponseAt,0,
      faction+': non-radar infrastructure cannot trigger radar response');
    assert.equal(guard.order,null,
      faction+': non-radar shots cannot issue emergency radar orders');
  }
}


// Visible infantry and specialists can also destroy ore trucks between
// strategic AI decisions. The existing urgent escort planner should react to
// their actual shots, with the same fog, range and cooldown restrictions.
for(const faction of ['coalition','federation','psionic']){
  for(const kind of ['soldier','specialist']){
    const {g,worker,guard,enemy}=game(faction);
    enemy.hp=0;
    const attacker=g.add(0,kind,17,14);
    assert.ok(g.sideCanSee(1,attacker),
      faction+': '+kind+' must be observed before emergency response');
    g.nextAI=g.time+8;
    const credits=g.players[1].credits,hp=worker.hp;
    g.shoot(attacker,worker);
    assert.equal(worker.hp,hp,
      faction+': '+kind+' shot launch must not deal premature damage');
    assert.equal(guard.order?.id,attacker.id,
      faction+': '+kind+' harvester shot must summon a local defender');
    assert.equal(g.nextHarvesterResponseAt,g.time+4,
      faction+': '+kind+' successful response uses bounded cooldown');
    assert.equal(g.nextAI,g.time+8,
      faction+': '+kind+' response must not accelerate economic decisions');
    assert.equal(g.players[1].credits,credits,
      faction+': tactical defense cannot spend credits');
    guard.order=null;
    g.shoot(attacker,worker);
    assert.equal(guard.order,null,
      faction+': repeated '+kind+' shots inside cooldown cannot spam orders');
    assert.ok(g.saveGame()&&g.loadGame(),
      faction+': '+kind+' interception preserves legacy save compatibility');
    assert.equal(g.nextHarvesterResponseAt,0,
      faction+': harvester tactical cooldown remains transient after load');
  }
  {
    const {g,worker,guard,enemy}=game(faction);
    enemy.hp=0;
    const hidden=g.add(0,'soldier',21,14);
    assert.equal(g.sideCanSee(1,hidden),false,
      faction+': distant infantry must not be visible');
    g.nextAI=g.time+8;
    g.shoot(hidden,worker);
    assert.equal(guard.order?.id,undefined,
      faction+': a hidden shooter cannot leak coordinates into escort orders');
    assert.equal(g.nextHarvesterResponseAt,0,
      faction+': unseen shots cannot consume tactical cooldown');
  }
  {
    const {g,worker,guard,enemy}=game(faction);
    enemy.hp=0;
    const attacker=g.add(0,'specialist',17,14);
    const refinery=g.add(1,'refinery',15,16);
    g.nextAI=g.time+8;
    g.shoot(attacker,refinery);
    assert.equal(guard.order?.id,undefined,
      faction+': attacks on other structures cannot trigger harvester escorts');
    assert.equal(g.nextHarvesterResponseAt,0);
    assert.equal(worker.hp,worker.maxHp);
  }
}



// A damaged, empty AI truck must not wait on the six-second ore cache after
// a visible hit. The existing safe-deposit planner, not a new retreat order,
// decides whether a reachable nearby alternative is safer.
for(const faction of ['coalition','federation','psionic']){
  {
    const {g,worker,enemy}=game(faction);
    worker.hp=worker.maxHp*.68;
    worker.oreIndex=0;worker.oreScanAt=g.time+5;
    g.ores=[{x:14,y:14,amount:800},{x:13,y:16,amount:800}];
    // Keep this test about deposit ranking rather than map terrain geometry.
    g.canOccupyUnit=()=>true;
    g.findPath=(x,y,tx,ty)=>[{x:tx,y:ty}];
    g.nextAI=g.time+8;
    const credits=g.players[1].credits;
    g.shoot(enemy,worker);
    assert.equal(worker.oreScanAt,g.time+5,
      faction+': projectile launch alone cannot force a deposit rescan');
    g.updateProjectiles(1);
    assert.equal(worker.oreScanAt,0,
      faction+': visible damaging impact expires the unsafe ore cache');
    g.processHarvester(worker,.2);
    assert.equal(worker.oreIndex,1,
      faction+': wounded worker selects a nearby ore site outside visible fire');
    assert.equal(g.players[1].credits,credits,
      faction+': a tactical rescan cannot grant or spend credits');
    assert.equal(g.nextAI,g.time+8,
      faction+': rescan cannot advance strategic AI scheduling');
    worker.oreScanAt=g.time+5;
    g.shoot(enemy,worker);g.updateProjectiles(1);
    assert.equal(worker.oreScanAt,g.time+5,
      faction+': repeated impacts cannot repeatedly force expensive A* scans');
    g.time+=6;worker.oreScanAt=g.time+5;
    g.shoot(enemy,worker);g.updateProjectiles(1);
    assert.equal(worker.oreScanAt,0,
      faction+': a fresh impact may rescan after the six-second throttle');
    assert.ok(g.saveGame()&&g.loadGame(),
      faction+': legacy save/load accepts the new transient rescan throttle');
  }
  for(const scenario of ['healthy','loaded','hidden','player']){
    const {g,worker,enemy}=game(faction);
    let target=worker,shooter=enemy;
    worker.hp=worker.maxHp*(scenario==='healthy'?1:.68);
    worker.oreScanAt=g.time+5;
    if(scenario==='loaded')worker.load=360;
    if(scenario==='hidden'){
      enemy.hp=0;
      shooter=g.add(0,'soldier',21,14);
      assert.equal(g.sideCanSee(1,shooter),false);
    }
    if(scenario==='player'){
      target=g.add(0,'harvester',14,14);
      target.hp=target.maxHp*.68;
      target.oreScanAt=g.time+5;
      shooter=g.add(1,'soldier',17,14);
    }
    g.shoot(shooter,target);g.updateProjectiles(1);
    assert.equal(target.oreScanAt,g.time+5,
      faction+': '+scenario+' truck must retain its normal ore route');
  }
}

console.log('PASS: lethal-impact attribution, bounded, fog-honest AI harvester escorts and base-first defense, and early visible tank-launch response, all-ground radar defense and impact fallback across three factions');
