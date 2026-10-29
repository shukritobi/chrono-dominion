import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const output=join(tmpdir(),'chrono-large-army-'+process.pid+'.json');
try{
  execFileSync(process.execPath,['tools/benchmark-large-armies.mjs','--out='+output],{
    cwd:new URL('..',import.meta.url),encoding:'utf8',timeout:90000,stdio:'pipe'
  });
  const result=JSON.parse(readFileSync(output,'utf8'));
  assert.equal(result.initialStressUnits,120);
  assert.equal(result.worldSize,48);
  assert.equal(result.simulatedSeconds,8);
  assert.ok(result.movedStressUnits>=60,'at least half the stress units must move');
  assert.ok(result.pathQueries>0&&result.occupancyChecks>0,'real navigation exercised');
  assert.ok(Number.isInteger(result.directRouteAttempts)&&
    Number.isInteger(result.directRouteHits)&&
    result.directRouteAttempts>0&&result.directRouteHits>=0&&
    result.directRouteHits<=result.directRouteAttempts&&
    result.directRouteAttempts<=result.pathQueries,
    'clear-route shortcut accounting must match real path queries');
  assert.ok(result.finitePositions&&result.saveRestored&&result.restoredPositionsMatch,
    'finite positions, unit identities and v1 save compatibility');
  assert.ok(Number.isFinite(result.meanMsPerTick)&&result.meanMsPerTick>=0);
  assert.ok(Number.isFinite(result.p95TickMs)&&result.p95TickMs>=0);
  assert.ok(Number.isFinite(result.maxTickMs)&&result.maxTickMs>=result.p95TickMs,
    'worst tick must be no faster than the 95th percentile');
  assert.equal(result.tickProfile.length,result.ticks,
    'every simulation tick must have a diagnostic profile');
  assert.equal(result.slowestTicks.length,5,'retain five worst ticks for investigation');
  assert.equal(result.tickProfile.reduce((sum,t)=>sum+t.pathQueries,0),result.pathQueries,
    'per-tick A* query counts must reconcile with total');
  assert.equal(result.tickProfile.reduce((sum,t)=>sum+t.occupancyChecks,0),result.occupancyChecks,
    'per-tick occupancy checks must reconcile with total');
  assert.equal(result.ticksWithPathQueries,
    result.tickProfile.filter(t=>t.pathQueries>0).length);
  assert.equal(result.maxPathQueriesPerTick,
    Math.max(...result.tickProfile.map(t=>t.pathQueries)));
  assert.equal(result.maxOccupancyChecksPerTick,
    Math.max(...result.tickProfile.map(t=>t.occupancyChecks)));
  assert.ok(result.tickProfile.every((t,i)=>
    t.tick===i+1&&Math.abs(t.simulatedSeconds-(i+1)*.2)<1e-8&&
    Number.isFinite(t.wallMs)&&t.wallMs>=0&&
    Number.isFinite(t.pathMs)&&t.pathMs>=0&&t.pathMs<=t.wallMs+1),
    'per-tick timings, tick IDs and simulation times must be valid');
  assert.ok(result.slowestTicks.every((t,i)=>
    result.tickProfile.some(p=>p.tick===t.tick&&p.wallMs===t.wallMs&&
      p.pathQueries===t.pathQueries&&p.occupancyChecks===t.occupancyChecks)&&
    (!i||result.slowestTicks[i-1].wallMs>=t.wallMs)),
    'worst-tick entries must be real ticks sorted by descending work');
  assert.ok(Math.abs(result.slowestTicks[0].wallMs-result.maxTickMs)<.011,
    'worst-tick profile must identify the measured maximum');
  assert.ok(Number.isFinite(result.pathTimeMs)&&result.pathTimeMs>=0&&
    result.pathTimeMs<=result.wallMs+1,'A* wall time must fit within simulation time');
  assert.ok(Number.isFinite(result.pathTimeSharePercent)&&
    result.pathTimeSharePercent>=0&&result.pathTimeSharePercent<=100,
    'pathfinding time share must be a valid percentage');
  console.log('PASS: 120-unit XL movement, pathfinding, collisions, saves and tick-level attribution');
}finally{
  try{unlinkSync(output);}catch{}
}
