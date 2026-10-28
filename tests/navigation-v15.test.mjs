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

// Existing saves contain ordinary path/position state, not transient queue
// nodes; the next frame can rebuild the pathfinder after loading.
setup();
assert.ok(game.saveGame());
assert.equal(game.loadGame(),true);
assert.ok(game.findPath(8,12,11,12).length>=1);
game.draw();
console.log('PASS: heap shortest routes, corner restrictions, traffic detours, safe motion and saved games');
