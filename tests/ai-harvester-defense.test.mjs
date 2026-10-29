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

console.log('PASS: lethal-impact attribution, bounded, fog-honest AI harvester escorts and base-first defense across three factions');
