import assert from 'node:assert/strict';
import {classifyAviationBlocker as classify} from '../tools/ai-aviation-diagnostics.mjs';
const ready={time:260,credits:2500,hasFactory:true,hasRadar:true,
  airfieldOwned:true,airfieldBuilt:true,harvesters:2,armor:1,aircraft:0,
  threatened:false,powerLow:false,queueKey:null};
const cases=[
  [{aircraft:2},'wing-complete'],
  [{hasFactory:false},'factory-missing'],
  [{hasFactory:false,hadFactory:true},'factory-lost'],
  [{hasRadar:false},'radar-missing'],
  [{hasRadar:false,hadRadar:true},'radar-lost'],
  [{airfieldOwned:false,time:100},'airfield-not-yet-eligible'],
  [{airfieldOwned:false,credits:2399},'airfield-funding'],
  [{airfieldOwned:false,credits:2399,powerLow:true},'airfield-funding-brownout'],
  [{airfieldOwned:false,credits:2399,harvesters:0},'airfield-funding-no-harvester'],
  [{airfieldOwned:false,credits:2399,armor:0},'airfield-funding-no-screen'],
  [{airfieldOwned:false,credits:2399,threatened:true},'airfield-funding-under-attack'],
  [{airfieldOwned:false,credits:2400},'airfield-affordable-not-started'],
  [{airfieldBuilt:false},'airfield-under-construction'],
  [{powerLow:true},'power-shortage'],
  [{harvesters:0},'harvester-lost'],
  [{threatened:true},'base-under-attack'],
  [{armor:0},'ground-screen-lost'],
  [{queueKey:'aircraft'},'aircraft-in-production'],
  [{queueKey:'tank'},'other-unit-in-production'],
  [{credits:2249},'aircraft-funding'],
  [{credits:2250},'aircraft-affordable-not-queued']
];
for(const [patch,expected] of cases)
  assert.equal(classify({...ready,...patch}),expected,JSON.stringify(patch));
assert.equal(classify({...ready,aircraft:1,credits:2250}),'aircraft-affordable-not-queued');
assert.equal(classify({...ready,aircraft:1,credits:650}),'aircraft-funding');
console.log('PASS: aviation loss and funding diagnostics, legacy labels and reserve boundaries');
