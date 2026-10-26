import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',style:{},disabled:false,classList:{add(){},remove(){},toggle(){}},
    setAttribute(){},addEventListener(){},querySelectorAll(){return[];},
    querySelector(){return{disabled:true,textContent:''}},
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
const game=window.__game;
const settings={playerFaction:'coalition',enemyFaction:'federation',map:'verdant',difficulty:'recruit',startingCredits:5000};
const reset=()=>{
  game.newMatch(settings);
  game.entities=[];
  game.unitBuckets=null;
  game.laneReservations=new Map();
  // Corridor x=11..17 is blocked along its northern/southern shoulders,
  // with open staging space on both ends.
  game.water=(x,y)=>x>=11&&x<=17&&(y<11.5||y>12.5);
};
reset();
const lane=game.narrowLaneAt(14,12);
assert.equal(lane?.id,'h:12:11:17','detect seven-tile one-width corridor');
assert.equal(game.narrowLaneAt(8,12),null,'open staging area is not a reserved lane');
assert.equal(game.narrowLaneAt(14,11),null,'water remains impassable');

const lead=game.add(0,'soldier',10,12);
const right=game.add(0,'soldier',18,12);
assert.equal(game.checkLaneEntry(lead,11,12),true,'first mover acquires lane');
game.setUnitPosition(lead,11,12);
assert.equal(game.checkLaneEntry(right,17,12),false,'opposing mover waits outside occupied lane');
assert.equal(right.laneWaiting,lane.id,'waiter identified by stable unit id');
const state=game.laneReservations.get(lane.id);
assert.equal(state.dir,1);
assert.equal(state.waiting.length,1);

const second=game.add(0,'soldier',10,12);
assert.ok(game.checkLaneEntry(second,11,12),'same direction can convoy');
game.setUnitPosition(second,11,12);
const third=game.add(0,'soldier',10,12);
assert.ok(game.checkLaneEntry(third,11,12));
game.setUnitPosition(third,11,12);
const fourth=game.add(0,'soldier',10,12);
assert.equal(game.checkLaneEntry(fourth,11,12),false,
  'bounded batch denies more same-direction entrants while opposite is queued');
assert.equal(state.waiting.length,2);
// Physically vacate the bottleneck, then serve the oldest waiting direction.
for(const u of [lead,second,third])game.setUnitPosition(u,18.5,12);
game.advanceLaneReservations();
assert.equal(state.dir,-1,'oldest opposite-direction waiter gets next passage');
assert.equal(game.checkLaneEntry(fourth,11,12),false,'new phase prevents queue-jumping');
assert.equal(game.checkLaneEntry(right,17,12),true);
game.setUnitPosition(right,17,12);
assert.equal(right.lanePass.dir,-1);
game.setUnitPosition(right,10,12);
game.advanceLaneReservations();
assert.equal(state.dir,1,'phase returns to queued waiting traffic after lane clears');
assert.equal(game.checkLaneEntry(fourth,11,12),true);
assert.equal(fourth.laneWaiting,null);

// Crossing restrictions are integrated with ordinary movement, rather than
// only callable from the reservation API.
reset();
const left=game.add(0,'soldier',10.8,12);
const opposed=game.add(0,'soldier',17.8,12);
assert.equal(game.move(left,17,12,.05),false);
assert.equal(left.lanePass?.dir,1);
// Approaching the threshold is legal. Only crossing into the reserved
// corridor is forbidden; wait until the opponent actually reaches its mouth.
for(let i=0;i<45;i++)game.move(opposed,10,12,.05);
assert.ok(opposed.x>=17.49,'opponent remains outside while first direction owns passage');
assert.equal(opposed.laneWaiting,lane.id);

// No reservations on open maps or in corridors too short to manage.
game.water=()=>false;
assert.equal(game.narrowLaneAt(14,12),null);
reset();game.water=(x,y)=>x===14&&(y<11.5||y>12.5);
assert.equal(game.narrowLaneAt(14,12),null,'single-cell gap does not form a corridor');

// Save/load remains valid; transient lane leases do not lock an old match.
reset();
const player=game.add(0,'soldier',10.8,12);
game.checkLaneEntry(player,11,12);
assert.ok(game.saveGame());
const save=JSON.parse(localStorage.getItem('chrono-dominion-skirmish-v1'));
assert.ok(!('laneReservations' in save),'live lane queues are not stored as brittle state');
assert.ok(game.loadGame());
assert.equal(game.laneReservations.size,0);
assert.equal(game.entityById(player.id).lanePass,null);
console.log('PASS: corridor detection, opposite-direction queues, bounded batches, lane handoff, integrated movement and save recovery');
