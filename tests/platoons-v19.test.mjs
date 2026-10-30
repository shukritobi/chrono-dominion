import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__testGame = new Game();');
const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',style:{},disabled:false,classList:{add(){},remove(){},toggle(){}},
    setAttribute(){},addEventListener(){},querySelectorAll(){return[];},
    querySelector(){return {disabled:true,textContent:''};},
    getContext(){return ctx},
    getBoundingClientRect(){return{left:0,top:0,width:id==='world'?1024:272,height:id==='world'?700:144}},
    set innerHTML(v){this._html=v;},get innerHTML(){return this._html||''},
    set textContent(v){this._text=v;},get textContent(){return this._text||''}
  });return nodes.get(id);
}};
const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
const window={addEventListener(){}};
runInNewContext(source,{window,document,localStorage,console,performance:{now:()=>0},
  requestAnimationFrame(){},setTimeout(){return 1;},clearTimeout(){},devicePixelRatio:1},{timeout:4000});
const game=window.__testGame;
const settings={playerFaction:'coalition',enemyFaction:'federation',map:'verdant',difficulty:'standard',startingCredits:5000};
game.newMatch(settings);
game.time=105;
const base=game.entities.find(e=>e.owner===1&&e.kind==='hq');
const playerHQ=game.entities.find(e=>e.owner===0&&e.kind==='hq');
const fighters=game.entities.filter(e=>e.owner===1&&e.type==='unit'&&e.kind!=='harvester');
const oldContact={id:playerHQ.id,x:playerHQ.x,y:playerHQ.y,time:103,type:'building',kind:'hq'};
assert.equal(game.sideCanSee(1,playerHQ),false,'AI cannot see player HQ through fog');
assert.equal(fighters.length,3);
assert.equal(game.coordinateAIPlatoon(fighters,[],base,false).size,0,
  'no unscouted target means no offensive platoon');
assert.equal(game.aiPlatoon,null);
const ids=game.coordinateAIPlatoon(fighters,[oldContact],base,false);
assert.equal(ids.size,3,'all three eligible fighters rally together');
assert.equal(game.aiPlatoon.phase,'rally');
assert.equal(game.aiPlatoon.target.x,oldContact.x,'platoon uses last-known intelligence');
assert.ok(fighters.every(e=>e.order?.type==='move'),'group has staging movement orders');
assert.equal(new Set(fighters.map(e=>e.order.x+','+e.order.y)).size,3,
  'rally members receive distinct formation destinations');
const firstOrders=fighters.map(e=>({...e.order}));
game.time+=4;
game.coordinateAIPlatoon(fighters,[oldContact],base,false);
assert.ok(fighters.every((e,i)=>e.order.x===firstOrders[i].x&&e.order.y===firstOrders[i].y),
  'rally assignments remain stable across repeated AI ticks');
// Assemble physically at rally points without changing the scouted target.
fighters.forEach((e,i)=>{e.x=game.aiPlatoon.slots[i].x;e.y=game.aiPlatoon.slots[i].y;});
game.coordinateAIPlatoon(fighters,[oldContact],base,false);
assert.equal(game.aiPlatoon.phase,'assault');
assert.ok(fighters.every(e=>e.order?.type==='attackMove'),
  'assault begins as a group after rally threshold');
const assaultOrders=fighters.map(e=>({...e.order}));
game.time+=8;
game.coordinateAIPlatoon(fighters,[oldContact],base,false);
assert.deepEqual(fighters.map(e=>({...e.order})),assaultOrders,
  'assault orders are not reset every strategy tick');
// Existing opponent positions must remain hidden: change current HQ position,
// then verify stored objective does not magically track it.
playerHQ.x=2;playerHQ.y=17;
assert.equal(game.sideCanSee(1,playerHQ),false);
assert.equal(game.aiPlatoon.target.x,oldContact.x);
assert.equal(game.aiPlatoon.target.y,oldContact.y);
assert.ok(game.saveGame());
const saved=JSON.parse(localStorage.getItem('chrono-dominion-skirmish-v1'));
assert.equal(saved.aiPlatoon.phase,'assault');
assert.ok(game.loadGame(),'current saved platoon resumes');
assert.equal(game.aiPlatoon.phase,'assault');
assert.equal(game.aiPlatoon.ids.length,3);
// Invalid platoons fail closed while preserving an otherwise valid save.
const broken={...saved,aiPlatoon:{...saved.aiPlatoon,ids:[999,999,999]}};
localStorage.setItem('chrono-dominion-skirmish-v1',JSON.stringify(broken));
assert.ok(game.loadGame());
assert.equal(game.aiPlatoon,null,'malformed historical squad reference discarded');
// Old snapshots never contained this optional strategy state.
delete broken.aiPlatoon;
localStorage.setItem('chrono-dominion-skirmish-v1',JSON.stringify(broken));
assert.ok(game.loadGame());
assert.equal(game.aiPlatoon,null);

// Base defense supersedes a previous offensive plan. Detected hostiles
// receive local response, rather than allowing the force to march away.
game.newMatch(settings);game.time=106;
const enemyBase=game.entities.find(e=>e.owner===1&&e.kind==='hq');
const raid=game.add(0,'soldier',enemyBase.x-2.3,enemyBase.y);
assert.ok(game.sideCanSee(1,raid));
game.aiPlatoon={phase:'rally',ids:[1,2],slots:[{x:26,y:25},{x:26,y:26}],
  targetId:4,targetTime:100,target:{x:5,y:6},startedAt:100};
game.runAI();
assert.equal(game.aiPlatoon,null,'base threat suspends assault grouping');
const defender=game.entities.filter(e=>e.owner===1&&e.type==='unit'&&e.kind!=='harvester')
  .filter(e=>e.order?.type==='attack'&&e.order.id===raid.id);
assert.ok(defender.length>=1,'AI assigns nearby defenders to observed intruder');

// Psionic Vipers are fast but have reduced hull and damage. A real opening
// Viper must not abandon the refinery with both riflemen; stronger factions
// keep their original offensive strategy and income baseline.
const reserveSettings={...settings,enemyFaction:'psionic'};
game.newMatch(reserveSettings);game.time=105;
let homeRefinery=game.entities.find(e=>e.owner===1&&e.kind==='refinery');
let homeTank=game.entities.find(e=>e.owner===1&&e.kind==='tank');
let distantHQ=game.entities.find(e=>e.owner===0&&e.kind==='hq');
const intelReport=()=>({id:distantHQ.id,x:distantHQ.x,y:distantHQ.y,
  time:game.time-1,type:'building',kind:'hq'});
assert.ok(homeRefinery?.built&&homeTank?.hp>0);
assert.ok(Math.hypot(homeTank.x-homeRefinery.x,homeTank.y-homeRefinery.y)<7);
assert.equal(game.sideCanSee(1,distantHQ),false,'refinery reserve uses no hidden enemy positions');
homeTank.order={type:'attackMove',x:distantHQ.x,y:distantHQ.y};
game.intel[1]=[intelReport()];
const creditsBeforeReserve=game.players[1].credits;
const tankId=homeTank.id;
game.runAI();
assert.equal(homeTank.order,null,'nearby armoured defender must abandon an offensive order');
assert.equal(homeTank.stance,'guard','reserved tank remains a normal responsive guard');
assert.equal(game.aiPlatoon,null,'two riflemen alone cannot drain the last base tank');
assert.ok(game.players[1].credits<=creditsBeforeReserve,
  'reserve selection cannot award credits or create units');
assert.equal(game.entities.filter(e=>e.owner===1&&e.kind==='tank'&&e.hp>0).length,1);

// Two unreserved infantry may still form a small support detachment, but
// that squad must not steal the refinery's armoured reserve.
assert.ok(!game.aiSupportPlatoon?.ids.includes(tankId),
  'support detachment cannot recruit the reserved tank');
// In a fresh match with three infantry available at once, the normal
// offensive platoon can still assemble without that tank.
game.newMatch(reserveSettings);game.time=105;
homeRefinery=game.entities.find(e=>e.owner===1&&e.kind==='refinery');
homeTank=game.entities.find(e=>e.owner===1&&e.kind==='tank');
distantHQ=game.entities.find(e=>e.owner===0&&e.kind==='hq');
game.add(1,'soldier',homeRefinery.x-2,homeRefinery.y-2);
game.intel[1]=[intelReport()];
game.runAI();
assert.ok(game.aiPlatoon?.ids.length===3,
  'three unreserved infantry can still assemble an offensive platoon');
assert.equal(game.aiPlatoon.ids.includes(homeTank.id),false,
  'refinery tank is never enlisted in the offensive platoon');
assert.equal(homeTank.order,null,'offensive rally cannot overwrite the reserve');

// Local sensor-confirmed attacks must still mobilize the reserve. It is
// excluded only from assault formation, not from tactical engagements.
const localRaider=game.add(0,'soldier',homeTank.x-1,homeTank.y);
assert.ok(game.sideCanSee(1,localRaider));
game.runAI();
assert.equal(homeTank.order?.type,'attack');
assert.equal(homeTank.order?.id,localRaider.id,
  'reserved tank intercepts a visible local threat');
assert.ok(game.saveGame()&&game.loadGame(),
  'refinery reserve uses the existing v1 save schema');
assert.equal(game.entityById(tankId)?.order?.id,localRaider.id);

// Without an operational refinery there is no reserve: the existing
// three-fighter assault formation remains available.
game.newMatch(reserveSettings);game.time=105;
homeRefinery=game.entities.find(e=>e.owner===1&&e.kind==='refinery');
homeTank=game.entities.find(e=>e.owner===1&&e.kind==='tank');
distantHQ=game.entities.find(e=>e.owner===0&&e.kind==='hq');
homeRefinery.hp=0;
game.intel[1]=[intelReport()];
game.runAI();
assert.ok(game.aiPlatoon?.ids.includes(homeTank.id),
  'do not immobilize armour to protect a destroyed refinery');

// Federation and Coalition have different opening tank statistics and keep
// their established three-fighter assault policy. The broader experiment
// harmed Frostline income, so no reserve applies to those factions.
for(const faction of ['federation','coalition']){
  game.newMatch({...settings,enemyFaction:faction});game.time=105;
  homeTank=game.entities.find(e=>e.owner===1&&e.kind==='tank');
  distantHQ=game.entities.find(e=>e.owner===0&&e.kind==='hq');
  game.intel[1]=[intelReport()];
  game.runAI();
  assert.ok(game.aiPlatoon?.ids.includes(homeTank.id),
    faction+': preserve existing tank offensive participation');
}



// Production recovery after the last Psionic ground defender is lost.
// The 720-second Verdant trace showed a 91.6s unguarded refinery gap;
// no ground unit deployed after 120.8s despite later credits. Rebuilding
// the infantry producer must outrank optional factory/radar spending.
function collapsedDefense(faction='psionic',credits=1550){
  game.newMatch({...settings,enemyFaction:faction});
  game.time=178;game.queues=[];game.intel[1]=[];
  for(const e of game.entities){
    if(e.owner===1&&e.type==='unit'&&e.kind!=='harvester')e.hp=0;
  }
  game.add(1,'generator',22,27);
  game.add(1,'factory',22,21);
  game.players[1].credits=credits;
  assert.equal(game.power(1).low,false,'defense fixture must be powered');
}
const aiOwned=kind=>game.entities.filter(e=>e.owner===1&&e.kind===kind&&e.hp>0);
collapsedDefense();
const noDefenseCredits=game.players[1].credits;
game.runAI();
assert.equal(aiOwned('radar').length,0,
  'an empty Psionic ground screen must defer optional radar construction');
assert.equal(game.queues.filter(q=>q.side===1&&q.key==='soldier').length,1,
  'an intact barracks must fund a real replacement infantry unit');
assert.equal(game.players[1].credits,noDefenseCredits-200,
  'emergency ground recruitment must debit the ordinary soldier cost');
game.advanceProduction(3);
assert.equal(aiOwned('soldier').length,1,
  'the replacement must deploy from the real barracks');
assert.ok(game.saveGame()&&game.loadGame(),
  'emergency recruitment must retain the original save format');

// A paid factory order cannot ever finish if its sole factory has been
// destroyed. Previously that stale queue blocked the Psionic emergency
// barracks order indefinitely, even when credits and a barracks survived.
collapsedDefense('psionic',1550);
aiOwned('factory')[0].hp=0;
const strandedCredits=game.players[1].credits;
const strandedSpent=game.stats[1].creditsSpent;
game.players[1].credits-=850;
game.stats[1].creditsSpent+=850;
game.queues.push({side:1,key:'tank',elapsed:1,total:3.4});
game.runAI();
assert.equal(game.queues.some(q=>q.side===1&&q.key==='tank'),false,
  'a destroyed factory cannot hold a paid AI tank order forever');
assert.equal(game.queues.filter(q=>q.side===1&&q.key==='soldier').length,1,
  'refunded stranded production must unlock a paid emergency soldier');
assert.equal(game.players[1].credits,strandedCredits-200,
  'cancelled tank must refund exactly 850, then pay exactly 200 for infantry');
assert.equal(game.stats[1].creditsSpent,strandedSpent+200,
  'net production spending must equal only the replacement soldier');
game.advanceProduction(3);
assert.equal(aiOwned('soldier').length,1,
  'recovered queue must actually deploy the ground defender');
assert.ok(game.saveGame()&&game.loadGame(),
  'queue recovery must preserve legacy saved matches');

// A producer that is merely unfinished may resume its paid queue.
// Never refund a potentially deployable order or touch a human queue.
collapsedDefense('psionic',1550);
aiOwned('factory')[0].built=false;
game.queues.push({side:1,key:'tank',elapsed:1,total:3.4});
const pausedCredits=game.players[1].credits;
game.runAI();
assert.equal(game.queues.filter(q=>q.side===1&&q.key==='tank').length,1,
  'unfinished producer is not a destroyed producer');
assert.equal(game.players[1].credits,pausedCredits,
  'unfinished producer must not generate a refund');
collapsedDefense('psionic',1550);
aiOwned('factory')[0].hp=0;
game.queues.push({side:0,key:'tank',elapsed:1,total:3.4});
game.runAI();
assert.equal(game.queues.filter(q=>q.side===0&&q.key==='tank').length,1,
  'Psionic AI recovery must not cancel human production');
assert.equal(game.queues.filter(q=>q.side===1&&q.key==='soldier').length,1,
  'a human queue must not prevent AI emergency recruitment');
collapsedDefense('federation',1550);
aiOwned('factory')[0].hp=0;
game.queues.push({side:1,key:'tank',elapsed:1,total:3.4});
game.runAI();
assert.equal(game.queues.filter(q=>q.side===1&&q.key==='tank').length,1,
  'other factions retain their existing queue policy');

// A destroyed refinery is NOT a reason to refund an ore-truck order as
// part of Psionic ground defense. Ore recovery owns that decision.
collapsedDefense('psionic',1550);
game.queues.push({side:1,key:'harvester',elapsed:1,total:3.6});
game.runAI();
assert.equal(game.queues.filter(q=>q.side===1&&q.key==='harvester').length,1,
  'emergency defense cannot cancel an existing ore recovery order');

// A destroyed barracks is more urgent than a new factory, radar or turret
// when no ground combat unit remains. Construction and recruitment both pay.
collapsedDefense();
const ruinedBarracks=aiOwned('barracks')[0];
ruinedBarracks.hp=0;
game.runAI();
const replacementBarracks=aiOwned('barracks');
assert.equal(replacementBarracks.length,1,
  'Psionic AI must rebuild its lost ground-unit producer');
assert.equal(replacementBarracks[0].built,false,
  'barracks recovery uses ordinary paid construction');
assert.equal(game.players[1].credits,1050,
  'barracks reconstruction must cost 500 credits');
assert.equal(game.queues.length,0,
  'infantry cannot be queued before the replacement barracks is completed');
replacementBarracks[0].built=true;
game.runAI();
assert.equal(game.queues.filter(q=>q.side===1&&q.key==='soldier').length,1,
  'a recovered barracks must unlock the next paid defensive soldier');

// Never sacrifice ore recovery, brownout recovery, or the emergency power
// reserve just to manufacture a new guard.
collapsedDefense();
aiOwned('harvester')[0].hp=aiOwned('harvester')[0].maxHp*.4;
game.runAI();
assert.equal(game.queues.filter(q=>q.side===1&&q.key==='harvester').length,1,
  'a critically wounded last harvester takes priority over infantry');
collapsedDefense('psionic',849);
game.runAI();
assert.equal(game.queues.length,0,
  'without an immediate attack, preserve the generator reserve');
collapsedDefense();
aiOwned('generator').forEach(g=>{g.hp=0;});
game.runAI();
assert.ok(aiOwned('generator').some(e=>!e.built),
  'brownout recovery still purchases an ordinary replacement generator');

// Preserve the previous stronger-faction production choices. The earlier
// all-faction defensive reserve failed the Frostline economy regression.
for(const faction of ['coalition','federation']){
  collapsedDefense(faction);
  game.runAI();
  assert.equal(aiOwned('radar').length,1,
    faction+': ordinary optional construction must remain available');
}

// A visible immediate attack may use the emergency reserve for a paid
// rifleman, but hidden attackers never influence the collapsed-screen flag.
collapsedDefense('psionic',300);
const psionicHQ=aiOwned('hq')[0];
const nearbyEnemy=game.add(0,'soldier',psionicHQ.x-2,psionicHQ.y);
assert.ok(game.sideCanSee(1,nearbyEnemy));
game.runAI();
assert.equal(game.queues.filter(q=>q.side===1&&q.key==='soldier').length,1,
  'an observed base raid can trigger affordable emergency infantry');
assert.equal(game.players[1].credits,100);

// A lone, visible armoured raider within the Psionic refinery perimeter
// warrants a third *existing* ground defender. The third guard is deliberately
// outside the normal 6.5-tile opportunistic engagement radius but within the
// nine-tile local base-defense radius. No units or credits are granted.
function refineryFocusFixture(faction='psionic',enemyKind='tank'){
  game.newMatch({...settings,enemyFaction:faction});game.time=110;
  const refinery=game.entities.find(e=>e.owner===1&&e.kind==='refinery');
  const headquarters=game.entities.find(e=>e.owner===1&&e.kind==='hq');
  for(const e of game.entities){
    if(e.owner===1&&e.type==='unit'&&e.kind!=='harvester')e.hp=0;
  }
  refinery.x=17;refinery.y=17;
  const attacker=game.add(0,enemyKind,18.5,17);
  const guards=[game.add(1,'soldier',16,17),
    game.add(1,'soldier',18,19),game.add(1,'soldier',26,17)];
  assert.ok(game.sideCanSee(1,attacker),'the raider must be truly observed');
  assert.ok(Math.hypot(guards[2].x-attacker.x,guards[2].y-attacker.y)>6.5);
  return {refinery,headquarters,attacker,guards};
}
for(const faction of ['psionic','coalition','federation']){
  const {headquarters,attacker,guards}=refineryFocusFixture(faction);
  const credits=game.players[1].credits;
  const assignments=game.assignAIEngagements(guards,[attacker],headquarters);
  const expected=faction==='psionic'?3:2;
  assert.equal([...assignments.values()].filter(id=>id===attacker.id).length,expected,
    faction+': only Psionic may mobilize a third guard against lone armour');
  assert.equal(guards[2].order?.id===attacker.id,faction==='psionic',
    faction+': distant third guard must respect the faction-specific cap');
  assert.equal(game.players[1].credits,credits,'tactical defense must not spend credits');
}
{
  const {headquarters,attacker,guards}=refineryFocusFixture('psionic','soldier');
  const assignments=game.assignAIEngagements(guards,[attacker],headquarters);
  assert.equal([...assignments.values()].filter(id=>id===attacker.id).length,2,
    'ordinary infantry raids retain the two-guard base-defense cap');
}
{
  const {headquarters,attacker,guards}=refineryFocusFixture();
  attacker.x=2;attacker.y=30;
  assert.equal(game.sideCanSee(1,attacker),false,'remote attacker stays hidden');
  const assignments=game.assignAIEngagements(guards,[attacker],headquarters);
  assert.equal(assignments.size,0,'hidden attackers cannot cause defensive assignments');
}
{
  const {headquarters,attacker,guards}=refineryFocusFixture();
  const other=game.add(0,'soldier',17.5,19);
  assert.ok(game.sideCanSee(1,other));
  const assignments=game.assignAIEngagements(guards,[attacker,other],headquarters);
  assert.ok([...assignments.values()].filter(id=>id===attacker.id).length<=2,
    'multiple visible raiders retain the normal two-guard armour cap');
  assert.ok([...assignments.values()].includes(other.id),
    'another visible raider must still receive a defender');
  assert.ok(game.saveGame()&&game.loadGame(),
    'the focus-fire rule introduces no new save fields');
}

// A visible tank within the refinery perimeter should outrank a nearer
// rifleman in Psionic base defense. The remaining guard still answers the
// rifleman. Other factions preserve the existing nearest-threat policy.
for(const faction of ['psionic','coalition','federation']){
  const {refinery,headquarters,attacker,guards}=refineryFocusFixture(faction);
  attacker.x=21;attacker.y=17; // tank 4 tiles from refinery
  const rifle=game.add(0,'soldier',17.5,17); // rifle only .5 tiles away
  guards[0].x=18;guards[0].y=17;
  guards[1].x=19;guards[1].y=18;
  guards[2].x=24;guards[2].y=17;
  assert.ok(game.sideCanSee(1,attacker)&&game.sideCanSee(1,rifle));
  const credits=game.players[1].credits;
  const assigned=game.assignAIEngagements(guards,[rifle,attacker],headquarters);
  if(faction==='psionic'){
    assert.equal([...assigned.values()].filter(id=>id===attacker.id).length,2,
      'Psionic defenders must prioritize the visible armoured refinery threat');
    assert.ok([...assigned.values()].includes(rifle.id),
      'the remaining guard must still answer the rifleman');
  }else{
    assert.equal([...assigned.values()].filter(id=>id===rifle.id).length,2,
      faction+': ordinary nearest-invader allocation remains unchanged');
  }
  assert.equal(game.players[1].credits,credits,'focus fire spends no credits');
}

game.draw();
console.log('PASS: fog-safe AI platoon rally, coordinated assault, stable orders, save recovery and prioritized defense');
