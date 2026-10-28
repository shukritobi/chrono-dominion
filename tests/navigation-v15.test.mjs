import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game = new Game();');
const ctx=new Proxy({}, {get:(obj,key)=>obj[key]??(()=>{}),set:(obj,key,value)=>{obj[key]=value;return true;}});
const elements=new Map();
const document={getElementById(id){
  if(!elements.has(id))elements.set(id,{
    value:'',disabled:false,style:{},classList:{add(){},remove(){},toggle(){}},
    setAttribute(){},addEventListener(){},querySelectorAll(){return[];},
    querySelector(){return{disabled:true,textContent:''};},
    getContext(){return ctx;},getBoundingClientRect(){return{width:id==='world'?1024:272,height:id==='world'?700:144,left:0,top:0};},
    set innerHTML(v){this._html=v;},get innerHTML(){return this._html||'';},
    set textContent(v){this._text=v;},get textContent(){return this._text||'';}
  });
  return elements.get(id);
}};
const memory=new Map();
const localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v))};
const window={addEventListener(){}};
runInNewContext(source,{window,document,console,localStorage,performance:{now:()=>0},
  requestAnimationFrame(){},setTimeout(){return 1;},clearTimeout(){},devicePixelRatio:1},{timeout:4000});
const game=window.__game;
const setup=()=>game.newMatch({playerFaction:'coalition',enemyFaction:'federation',map:'verdant',difficulty:'recruit',startingCredits:5000});

// Priority queue produces stable direct shortest paths without traffic.
setup();
game.entities=[];
game.water=()=>false;
const open=game.findPath(8,12,23,12);
assert.equal(open.length,15);
assert.ok(open.every(p=>p.y===12),'unobstructed path stays straight');
assert.equal(open.at(-1).x,23);
// No diagonal corner clipping on geometric obstacles.
game.water=(x,y)=>x>=12&&x<13&&y>=12&&y<13;
const skirt=game.findPath(9,11,16,14);
assert.ok(skirt.length>0&&skirt.every(p=>!game.water(p.x,p.y)));
for(let i=1;i<skirt.length;i++){
  const a=skirt[i-1],b=skirt[i];
  if(Math.abs(a.x-b.x)===1&&Math.abs(a.y-b.y)===1)
    assert.ok(game.walkable(a.x,b.y)&&game.walkable(b.x,a.y),'corner-cutting remains forbidden');
}

// Congestion replanning sees a unit as costly but does not treat it as
// permanent terrain: it should choose a different route around a blocker.
game.water=()=>false;
const mover=game.add(0,'soldier',8,15);
const blocker=game.add(0,'heavy',12,15);
const direct=game.findPath(mover.x,mover.y,16,15);
assert.ok(direct.some(p=>p.x===12&&p.y===15),'baseline route passes the friendly blocker');
const detour=game.findPath(mover.x,mover.y,16,15,mover);
assert.ok(detour.length>0);
assert.ok(detour.some(p=>p.y!==15),'traffic-priced route bends around the blocker');
assert.ok(!detour.some(p=>p.x===12&&p.y===15),'route avoids occupying the blocker cell');
assert.equal(detour.at(-1).x,16,'avoids traffic without abandoning the destination');

// Air units occupy a separate altitude layer. A parked aircraft must not
// distort ground A* traffic costs or cause unnecessary harvester detours.
game.entities=[];
game.water=()=>false;
const ground=game.add(0,'harvester',8,15);
const air=game.add(0,'aircraft',12,15);
const airHeat=game.trafficCosts(ground);
assert.equal(airHeat.size,0,
  'aircraft do not generate ground-level congestion penalties');
const clearAirRoute=game.findPath(8,15,16,15,ground);
assert.ok(clearAirRoute.every(p=>p.y===15),
  'ground route stays direct below an aircraft');
const landBlocker=game.add(0,'soldier',12,15);
const groundHeat=game.trafficCosts(ground);
assert.ok(groundHeat.size>0,'real ground infantry still generates traffic costs');
assert.ok(game.findPath(8,15,16,15,ground).some(p=>p.y!==15),
  'ground traffic still causes collision-aware detours');

// Regression from the 720-second Frostline telemetry: loaded harvesters at
// (23, 20.81) with a waypoint due north repeatedly accepted an X-only step
// of *zero distance* while friendly Guard infantry blocked the real Y step.
// The axis fallback must skip zero components and try a legal sidestep.
game.entities=[];
game.water=()=>false;
const verticalTruck=game.add(0,'harvester',23,20.81);
verticalTruck.load=360;
const northGuard=game.add(0,'soldier',23,20);
northGuard.stance='guard';
verticalTruck.path=[{x:23,y:20}];
verticalTruck.pathGoal={x:23,y:20};
verticalTruck.pathTarget={x:23,y:19};
verticalTruck.pathRecheck=1.5;
const verticalBefore={x:verticalTruck.x,y:verticalTruck.y};
assert.ok(game.canOccupyUnit(verticalTruck,verticalTruck.x,verticalTruck.y),
  'initial truck position is valid before testing blocked progress');
game.move(verticalTruck,23,19,.2);
assert.ok(Math.abs(verticalTruck.x-verticalBefore.x)>.1,
  'a northbound truck must sidestep instead of accepting a zero-length X-only step');
assert.ok(game.canOccupyUnit(verticalTruck,verticalTruck.x,verticalTruck.y),
  'sidestep remains collision-safe around the guard');

// Mirror the same defect for a horizontal waypoint: Y-only fallback is zero.
game.entities=[];
const horizontalTruck=game.add(0,'harvester',20.81,23);
horizontalTruck.load=360;
const westGuard=game.add(0,'soldier',20,23);
westGuard.stance='guard';
horizontalTruck.path=[{x:20,y:23}];
horizontalTruck.pathGoal={x:20,y:23};
horizontalTruck.pathTarget={x:19,y:23};
horizontalTruck.pathRecheck=1.5;
const horizontalBefore={x:horizontalTruck.x,y:horizontalTruck.y};
game.move(horizontalTruck,19,23,.2);
assert.ok(Math.abs(horizontalTruck.y-horizontalBefore.y)>.1,
  'a westbound truck must sidestep instead of accepting a zero-length Y-only step');
assert.ok(game.canOccupyUnit(horizontalTruck,horizontalTruck.x,horizontalTruck.y),
  'horizontal sidestep remains collision-safe');

// In a blocked approach, the watchdog must request traffic-aware replanning
// after a sustained stall. No unit can teleport through a solid water wall.
game.entities=[];
game.water=(x,y)=>x>10.8&&x<11.8&&y>=13&&y<=17;
const soldier=game.add(0,'soldier',9,15);
let weighted=0;
const native=game.trafficCosts.bind(game);
game.trafficCosts=(e)=>{weighted++;return native(e);};
for(let i=0;i<90;i++)game.move(soldier,14,15,.05);
assert.ok(soldier.x<14&&Number.isFinite(soldier.x));
assert.ok(!game.water(soldier.x,soldier.y));
assert.ok(game.move(soldier,soldier.x,soldier.y,.05),'already reached coordinates complete immediately');

// A parked heavy vehicle forces progress-based replanning. The moving soldier
// must eventually ask for a traffic-costed route, not repeatedly reuse the
// original straight path forever.
game.entities=[];
game.water=()=>false;
const walker=game.add(0,'soldier',8,15);
game.add(0,'heavy',9,15);
let replans=0;
const originalCosts=game.trafficCosts.bind(game);
game.trafficCosts=(unit)=>{replans++;return originalCosts(unit);};
for(let i=0;i<90;i++)game.move(walker,15,15,.05);
assert.ok(replans>0,'a persistent traffic stall triggers a penalized replan');
assert.ok(walker.x>=8&&walker.x<=15,'the blocked unit moves without teleporting');
assert.ok(!game.water(walker.x,walker.y));
game.trafficCosts=originalCosts;

// Large move formations all need their first route immediately, but the
// periodic 1.6s refresh must not make all 120 soldiers repath on one tick.
setup();
game.entities=[];
game.water=()=>false;
const formation=Array.from({length:4},(_,i)=>{
  const u=game.add(0,'soldier',5+i*3,5+i*5);
  u.order={type:'move',x:29,y:u.y};
  return u;
});
let pathCalls=0;
const originalPath=game.findPath.bind(game);
game.findPath=(...args)=>{pathCalls++;return originalPath(...args);};
const refreshes=[];
for(let tick=0;tick<16;tick++){
  const before=pathCalls;
  for(const u of formation)game.move(u,u.order.x,u.order.y,.2);
  refreshes.push(pathCalls-before);
}
assert.equal(refreshes[0],4,'new move orders compute every first path immediately');
assert.ok(refreshes.slice(1).filter(n=>n>0).length>=3,
  'periodic formation refreshes must be spread across multiple ticks');
assert.ok(refreshes.slice(1).every(n=>n<4),
  'routine refreshes must not recreate the four-unit synchronous A* burst');
assert.ok(refreshes.slice(1).reduce((sum,n)=>sum+n,0)>=4,
  'staggering may delay routine refreshes, not permanently suppress them');
// Changing an active destination must still repath immediately.
const changing=formation[0],beforeChange=pathCalls;
changing.order={type:'move',x:29,y:changing.y+3};
game.move(changing,changing.order.x,changing.order.y,.2);
assert.equal(pathCalls,beforeChange+1,'new destinations bypass the refresh timer');
assert.ok(changing.pathRecheck<1.6,'changed destination uses the original timer');
// Harvesting, reconnaissance, combat and traffic recovery remain urgent.
game.entities=[];
for(const kind of ['harvester','recon','tank']){
  const u=game.add(0,kind,6,7+game.entities.length*5);
  u.order={type:kind==='tank'?'attackMove':'move',x:28,y:u.y};
  game.move(u,u.order.x,u.order.y,.2);
  assert.ok(Math.abs(u.pathRecheck-1.4)<1e-6,
    kind+' retains the original non-staggered refresh');
}
const blocked=game.add(0,'soldier',8,27);
blocked.order={type:'move',x:28,y:27};
blocked.trafficRepath=true;
game.move(blocked,28,27,.2);
assert.ok(Math.abs(blocked.pathRecheck-1.4)<1e-6,
  'traffic-recovery A* is never delayed by routine staggering');
const enemyMover=game.add(1,'soldier',12,25);
enemyMover.order={type:'move',x:27,y:25};
game.move(enemyMover,27,25,.2);
assert.ok(Math.abs(enemyMover.pathRecheck-1.4)<1e-6,
  'AI move orders retain the original refresh cadence and economy');
game.findPath=originalPath;

// The faster heuristic must be opt-in: AI routes, harvesters, and combat
// continue using the established Euclidean route selection and economy.
game.entities=[];
game.water=()=>false;
const optIn=[];
game.findPath=(...args)=>{optIn.push(args[6]===true);return originalPath(...args);};
const routeCases=[
  {owner:0,kind:'soldier',order:'move',expected:true},
  {owner:1,kind:'soldier',order:'move',expected:false},
  {owner:0,kind:'harvester',order:'move',expected:false},
  {owner:0,kind:'tank',order:'attackMove',expected:false}
];
for(let i=0;i<routeCases.length;i++){
  const c=routeCases[i],u=game.add(c.owner,c.kind,5,6+i*5);
  u.order={type:c.order,x:25,y:u.y};
  game.move(u,25,u.y,.2);
  assert.equal(optIn.at(-1),c.expected,
    c.kind+' '+c.order+' '+c.owner+' heuristic eligibility');
}
game.findPath=originalPath;

// Existing saves contain ordinary path/position state, not transient queue
// nodes; the next frame can rebuild the pathfinder after loading.
setup();
assert.ok(game.saveGame());
assert.equal(game.loadGame(),true);
assert.ok(game.findPath(8,12,11,12).length>=1);
game.draw();
console.log('PASS: heap shortest routes, corner restrictions, traffic detours, safe motion and saved games');
