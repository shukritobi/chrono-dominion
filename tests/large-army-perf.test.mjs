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
  assert.ok(result.finitePositions&&result.saveRestored,'finite positions and v1 save compatibility');
  assert.ok(Number.isFinite(result.meanMsPerTick)&&result.meanMsPerTick>=0);
  console.log('PASS: 120-unit XL movement, pathfinding, collisions, saves and wall-time telemetry');
}finally{
  try{unlinkSync(output);}catch{}
}
