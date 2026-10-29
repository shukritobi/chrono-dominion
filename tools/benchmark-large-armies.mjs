#!/usr/bin/env node
/**
 * Headless 120-unit movement/combat stress fixture using the production game.
 * Wall-clock measurements are CI-machine telemetry, NOT browser/mobile FPS.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {performance} from 'node:perf_hooks';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const noop=()=>{};
const drawing=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const dom=new Map(),storage=new Map();
const document={getElementById(id){
  if(!dom.has(id))dom.set(id,{
    id,value:'',disabled:false,style:{},dataset:{},
    classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
    setAttribute:noop,addEventListener:noop,querySelectorAll:()=>[],
    getContext:()=>drawing,setPointerCapture:noop,
    getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
    set innerHTML(v){this._html=v;},get innerHTML(){return this._html||'';},
    set textContent(v){this._text=v;},get textContent(){return this._text||'';}
  });return dom.get(id);
}};
const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
const window={addEventListener:noop};
runInNewContext(read('maps/catalog.js'),{window,console},{timeout:1000});
runInNewContext(read('game.js').replace('  new Game();','  window.__game=new Game();'),{
  window,document,localStorage,console,performance:{now:()=>0},
  devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop
},{timeout:10000});
const g=window.__game;g.updateUI=noop;g.notify=noop;g.draw=noop;
g.newMatch({map:'expanse',difficulty:'standard',playerFaction:'coalition',
  enemyFaction:'federation',startingCredits:5000});
g.nextAI=1e9; // isolate engine movement/combat from changing strategic orders
const units=[];
for(const side of [0,1]){
  const desired=60;
  for(let y=5;y<=43&&units.filter(u=>u.owner===side).length<desired;y+=2)
    for(let x=side===0?4:28;x<=(side===0?20:44)&&
      units.filter(u=>u.owner===side).length<desired;x+=2){
      const kind=units.filter(u=>u.owner===side).length%3===0?'tank':'soldier';
      const sample={id:-1,kind,owner:side};
      if(!g.canOccupyUnit(sample,x,y))continue;
      const u=g.add(side,kind,x,y);
      u.order={type:'move',x:side===0?36:12,
        y:7+(units.filter(v=>v.owner===side).length%17)*2};
      units.push(u);
    }
  assert.equal(units.filter(u=>u.owner===side).length,desired,
    'fixture must spawn exactly 60 legal units for side '+side);
}
const initial=new Map(units.map(u=>[u.id,{x:u.x,y:u.y}]));
let pathQueries=0,occupancyChecks=0,pathTimeMs=0;
let directRouteAttempts=0,directRouteHits=0;
const directOctilePath=g.directOctilePath.bind(g);
g.directOctilePath=(...args)=>{
  directRouteAttempts++;
  const route=directOctilePath(...args);
  if(route)directRouteHits++;
  return route;
};
const findPath=g.findPath.bind(g),occupy=g.canOccupyUnit.bind(g);
// Attribute expensive simulation ticks to the actual production A* calls.
// This is headless diagnostic instrumentation, not an engine modification.
g.findPath=(...args)=>{
  pathQueries++;
  const started=performance.now();
  try{return findPath(...args);}
  finally{pathTimeMs+=performance.now()-started;}
};
g.canOccupyUnit=(...args)=>{occupancyChecks++;return occupy(...args);};
const ticks=40,dt=.2,start=performance.now(),tickMetrics=[];
for(let i=0;i<ticks;i++){
  const beforePaths=pathQueries,beforeOccupancy=occupancyChecks,beforePathMs=pathTimeMs;
  const tickStart=performance.now();
  g.step(dt);
  tickMetrics.push({
    tick:i+1,simulatedSeconds:Math.round((i+1)*dt*100)/100,
    wallMs:performance.now()-tickStart,
    pathQueries:pathQueries-beforePaths,
    occupancyChecks:occupancyChecks-beforeOccupancy,
    pathMs:pathTimeMs-beforePathMs
  });
}
const wallMs=performance.now()-start;
const sortedTicks=tickMetrics.map(t=>t.wallMs).sort((a,b)=>a-b);
const p95TickMs=sortedTicks[Math.ceil(ticks*.95)-1];
const maxTickMs=sortedTicks.at(-1);
const round=n=>Math.round(n*100)/100;
const slowestTicks=[...tickMetrics].sort((a,b)=>b.wallMs-a.wallMs||a.tick-b.tick)
  .slice(0,5).map(t=>({...t,wallMs:round(t.wallMs),pathMs:round(t.pathMs)}));
const tickProfile=tickMetrics.map(t=>({...t,wallMs:round(t.wallMs),pathMs:round(t.pathMs)}));
const moved=units.filter(u=>Math.hypot(u.x-initial.get(u.id).x,
  u.y-initial.get(u.id).y)>.25).length;
const finitePositions=units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y));
const liveUnits=g.entities.filter(u=>u.type==='unit'&&u.hp>0).length;
const beforeSave=g.entities.length;
const saved=g.saveGame(),restored=saved&&g.loadGame();
const restoredPositionsMatch=!!restored&&units.every(unit=>{
  const loaded=g.entities.find(e=>e.id===unit.id);
  return loaded&&loaded.kind===unit.kind&&loaded.owner===unit.owner&&
    Math.abs(loaded.x-unit.x)<1e-6&&Math.abs(loaded.y-unit.y)<1e-6;
});
const report={
  fixture:'xl-120-unit-movement',map:'expanse',worldSize:g.worldSize,
  initialStressUnits:units.length,simulatedSeconds:ticks*dt,ticks,
  movedStressUnits:moved,liveUnits,entitiesBeforeSave:beforeSave,
  pathQueries,occupancyChecks,directRouteAttempts,directRouteHits,
  wallMs:round(wallMs),
  meanMsPerTick:round(wallMs/ticks),
  p95TickMs:round(p95TickMs),
  maxTickMs:round(maxTickMs),
  pathTimeMs:round(pathTimeMs),
  pathTimeSharePercent:round(pathTimeMs/Math.max(wallMs,Number.EPSILON)*100),
  ticksWithPathQueries:tickMetrics.filter(t=>t.pathQueries>0).length,
  maxPathQueriesPerTick:Math.max(...tickMetrics.map(t=>t.pathQueries)),
  maxOccupancyChecksPerTick:Math.max(...tickMetrics.map(t=>t.occupancyChecks)),
  slowestTicks,tickProfile,
  finitePositions,saveRestored:!!restored,restoredPositionsMatch,
  entitiesAfterLoad:g.entities.length,node:process.version
};
assert.ok(finitePositions,'all positions must remain finite');
assert.ok(restored&&g.entities.length===beforeSave&&restoredPositionsMatch,
  'XL battle must preserve unit positions and identities through v1 save/load');
assert.ok(moved>=60,'at least half the 120 stress units must move');
assert.ok(pathQueries>0&&occupancyChecks>0,'real navigation and collision must execute');
assert.ok(Number.isFinite(wallMs)&&wallMs>0,'wall-clock measurement must be finite');
assert.equal(tickMetrics.reduce((sum,t)=>sum+t.pathQueries,0),pathQueries,
  'tick path-query totals must account for every simulation query');
assert.equal(tickMetrics.reduce((sum,t)=>sum+t.occupancyChecks,0),occupancyChecks,
  'tick collision totals must account for every simulation occupancy check');
assert.ok(tickMetrics.every(t=>t.pathMs>=0&&t.pathMs<=t.wallMs+1),
  'A* time must be finite and bounded by its enclosing simulation tick');
const out=process.argv.find(a=>a.startsWith('--out='));
if(out)writeFileSync(out.slice(6),JSON.stringify(report,null,2)+'\n');
console.log('LARGE ARMY SUMMARY:',JSON.stringify(report));
