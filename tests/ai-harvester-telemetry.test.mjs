import assert from 'node:assert/strict';
import {newHarvesterTelemetry,observeHarvesterStep,
  observeHarvesterThreatSample} from '../tools/ai-harvester-telemetry.mjs';

const m=newHarvesterTelemetry();
const h=(id,hp,load=0,x=0,y=0)=>({id,hp,load,x,y});
observeHarvesterStep(m,[h(1,310,80)],[h(1,280,80)],0,0,1);
assert.equal(m.damageObservations,1,'actual HP loss must be observed');
assert.equal(m.lost,0,'damage is not a death');
observeHarvesterThreatSample(m,[h(1,280,80,5,5)],
  [h(99,70,0,7,6),h(100,70,0,30,30)]);
assert.equal(m.harvesterSamples,1);
assert.equal(m.threatenedSamples,1,'visible combat threat near the truck');
observeHarvesterThreatSample(m,[h(1,280,80,5,5)],[]);
assert.equal(m.harvesterSamples,2);
assert.equal(m.threatenedSamples,1,'unobserved attackers must not be counted');
observeHarvesterStep(m,[h(1,280,80)],[],0,0,2);
assert.equal(m.lost,1,'disappeared living truck counts as a loss');
assert.equal(m.cargoAtLoss,80,'record last-seen cargo, not invented ore');
observeHarvesterStep(m,[],[h(2,310,0)],0,0,5);
assert.equal(m.lost,1,'newly deployed trucks are not losses');
observeHarvesterStep(m,[h(2,310,360)],[h(2,310,0)],0,360,9);
assert.equal(m.deliveryTicks,1);
assert.equal(m.deliveredOre,360);
assert.equal(m.longestDeliveryGapSeconds,9,'include the initial no-income gap');
observeHarvesterStep(m,[h(2,310,0)],[h(2,310,0)],360,360,12);
assert.equal(m.longestDeliveryGapSeconds,9,'shorter gap does not overwrite maximum');
observeHarvesterStep(m,[h(2,310,360)],[h(2,310,0)],360,720,20);
assert.equal(m.deliveryTicks,2);
assert.equal(m.deliveredOre,720);
assert.equal(m.longestDeliveryGapSeconds,11,'track gap between actual deliveries');
assert.throws(()=>observeHarvesterStep(m,[],[],720,700,21),
  /Invalid ore telemetry step/,'negative ore deliveries must fail loudly');
assert.equal(m.lost,1,'invalid samples must not change counters');
console.log('PASS: ore telemetry counts actual deaths, damage, delivery gaps, visible threats and cargo estimates');
