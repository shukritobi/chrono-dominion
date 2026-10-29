import assert from 'node:assert/strict';
import {classifyRadarRecovery as classify,newRadarLifecycle,observeRadarLifecycle}
  from '../tools/ai-radar-recovery-diagnostics.mjs';
const ready={radarOwned:false,radarBuilt:false,hqAlive:true,
  generatorOwned:true,powerLow:false,refineryOwned:true,refineryBuilt:true,
  harvesters:1,criticalHarvester:false,threatened:false,turretsBuilt:0,
  factoryOwned:true,credits:1550,radarPrereq:true,legalRadarSite:true};
const cases=[
  [{radarBuilt:true},'radar-operational'],
  [{radarOwned:true},'radar-construction-started'],
  [{},'affordable-but-not-started'],
  [{hqAlive:false},'hq-lost'],
  [{generatorOwned:false},'power-recovery-priority'],
  [{powerLow:true},'power-recovery-priority'],
  [{refineryOwned:false},'refinery-recovery-priority'],
  [{threatened:true},'base-defense-priority'],
  [{threatened:true,credits:899},'funding-shortfall'],
  [{harvesters:0},'harvester-recovery-priority'],
  [{criticalHarvester:true},'critical-harvester-priority'],
  [{factoryOwned:false},'factory-recovery-priority'],
  [{credits:1549},'funding-shortfall'],
  [{radarPrereq:false},'prerequisite-blocked'],
  [{legalRadarSite:false},'no-legal-placement']
];
for(const [patch,expected] of cases){
  const before={...ready,...patch};
  const after=patch.radarBuilt?{...before,radarBuilt:true}:
    patch.radarOwned?{...before,radarOwned:true}:{...before};
  assert.equal(classify(before,after),expected,JSON.stringify(patch));
}
assert.equal(classify({...ready,radarOwned:true},{...ready,radarOwned:true}),
  'radar-under-construction');
const t=newRadarLifecycle();
const live=(id,built=true,hp=10)=>({id,built,hp});
observeRadarLifecycle(t,[],0);
observeRadarLifecycle(t,[live(1)],10);
observeRadarLifecycle(t,[live(1)],11);
assert.equal(t.losses.length,0,'initial construction is not a restoration');
observeRadarLifecycle(t,[live(1,false,0)],12);
observeRadarLifecycle(t,[],13);
assert.deepEqual(t.losses,[{time:12,id:1}]);
observeRadarLifecycle(t,[live(2,false)],14);
assert.equal(t.restorations.length,0,'unfinished radar is not restored');
observeRadarLifecycle(t,[live(2)],18);
observeRadarLifecycle(t,[live(2)],19);
assert.deepEqual(t.restorations,[18],'restoration occurs once when operational');
observeRadarLifecycle(t,[live(2),live(3)],20);
observeRadarLifecycle(t,[live(3)],21);
assert.deepEqual(t.losses,[{time:12,id:1},{time:21,id:2}],
  'track actual operational identities, not a boolean radar count');
assert.deepEqual(t.restorations,[18],'surviving radar prevents duplicate restoration');
console.log('PASS: radar planner blocker priorities and exact loss/restoration identities');
