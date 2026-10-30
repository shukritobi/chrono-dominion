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

// A real opening tank must not abandon the ore economy with both riflemen
// just because the AI discovered a distant objective. Keep the existing
// combat planner and save format; reserve selection never creates a unit.
game.newMatch(settings);game.time=105;
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

// A larger force can still mount its normal paid offensive platoon while
// the original tank stays available to defend the operational refinery.
game.add(1,'soldier',homeRefinery.x-2,homeRefinery.y-2);
game.intel[1]=[intelReport()];
game.runAI();
assert.ok(game.aiPlatoon?.ids.length===3,
  'three unreserved infantry can still assemble an offensive platoon');
assert.equal(game.aiPlatoon.ids.includes(tankId),false,
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
game.newMatch(settings);game.time=105;
homeRefinery=game.entities.find(e=>e.owner===1&&e.kind==='refinery');
homeTank=game.entities.find(e=>e.owner===1&&e.kind==='tank');
distantHQ=game.entities.find(e=>e.owner===0&&e.kind==='hq');
homeRefinery.hp=0;
game.intel[1]=[intelReport()];
game.runAI();
assert.ok(game.aiPlatoon?.ids.includes(homeTank.id),
  'do not immobilize armour to protect a destroyed refinery');

game.draw();
console.log('PASS: fog-safe AI platoon rally, coordinated assault, stable orders, save recovery and prioritized defense');
