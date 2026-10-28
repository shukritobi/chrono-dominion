import assert from 'node:assert/strict';
import {newHarvesterTelemetry,observeHarvesterStep,
  observeHarvesterThreatSample} from '../tools/ai-harvester-telemetry.mjs';
import {inspectHarvesterReturnStall} from '../tools/harvester-stall-diagnostics.mjs';

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

const route=newHarvesterTelemetry();
const parked=h(7,300,360,12,12);
observeHarvesterStep(route,[parked],[parked],0,0,1);
for(let second=2;second<=7;second++)
  observeHarvesterStep(route,[parked],[parked],0,0,second,
    [{id:44,x:12,y:12}]);
assert.equal(route.fullCargoStallEvents,1,
  'six consecutive seconds of immobile full cargo must flag a stalled return');
assert.equal(route.fullCargoStallSeconds,6);
assert.equal(route.fullCargoStallCases.length,1);
assert.equal(route.fullCargoStallCases[0].id,7);
assert.equal(route.fullCargoStallCases[0].nearestRefineryId,44);
assert.equal(route.fullCargoStallCases[0].withinUnloadRange,true);
assert.equal(route.fullCargoStallCases[0].refineryDistance,0);
assert.equal(route.fullCargoStallCases[0].time,7);
observeHarvesterStep(route,[parked],[h(7,300,360,15,16)],0,0,8);
assert.equal(route.travelTiles,5,'measure the actual traversed route');
assert.equal(route.loadedTravelTiles,5,'distinguish loaded return trips');
const blocked={...h(7,300,360,15,16),
  pathTarget:{x:12,y:14},pathGoal:{x:13,y:14},
  path:[{x:14,y:15}],trafficWait:.8,laneWaiting:'narrow-1',
  yieldOrder:{x:16,y:17}};
for(let second=9;second<=14;second++)
  observeHarvesterStep(route,[blocked],[blocked],0,0,second,
    [{id:44,x:12,y:12}]);
assert.equal(route.fullCargoStallEvents,2,
  'movement must reset the streak before counting a second episode');
assert.equal(route.fullCargoStallCases.length,2);
assert.equal(route.fullCargoStallCases[1].withinUnloadRange,false);
assert.equal(route.fullCargoStallCases[1].nearestRefineryId,44);
assert.deepEqual(route.fullCargoStallCases[1].pathTarget,{x:12,y:14});
assert.deepEqual(route.fullCargoStallCases[1].nextWaypoint,{x:14,y:15});
assert.equal(route.fullCargoStallCases[1].laneWaiting,'narrow-1');
assert.equal(route.fullCargoStallCases[1].yielding,true);
assert.equal(route.fullCargoStallCasesOmitted,0);
observeHarvesterStep(route,[h(7,300,360,15,16)],[],0,0,15);
assert.equal(route.lost,1,'loss ends a stalled truck observation');
assert.equal(route.fullCargoStallEvents,2,'loss cannot invent a stall episode');

observeHarvesterThreatSample(route,
  [h(8,300,180,20,20),h(9,300,0,2,2)],
  [h(100,300,0,21,21),h(101,300,0,3,3)],
  [{x:1,y:1}]);
assert.equal(route.threatenedSamples,2);
assert.equal(route.threatenedLoadedSamples,1);
assert.equal(route.threatenedEmptySamples,1);
assert.equal(route.threatenedFarFromRefinerySamples,1,
  'only exposed ore-route contacts count away from the refinery');
observeHarvesterThreatSample(route,[h(8,300,180,20,20)],[],[{x:1,y:1}]);
assert.equal(route.threatenedSamples,2,
  'invisible hostiles must not be inferred from their true positions');
assert.equal(JSON.stringify(route).includes('_movement'),false,
  'internal streak tracking must not leak into reports or saved fields');

assert.throws(()=>observeHarvesterStep(route,
  [{id:17,hp:100,load:360}],[h(17,100,360,1,1)],0,0,16),
  /Invalid harvester position snapshot/,
  'a missing before-step position must fail rather than silently record zero travel');
const withoutRefinery=newHarvesterTelemetry();
observeHarvesterStep(withoutRefinery,[parked],[parked],0,0,1);
for(let second=2;second<=7;second++)
  observeHarvesterStep(withoutRefinery,[parked],[parked],0,0,second);
assert.equal(withoutRefinery.fullCargoStallCases[0].nearestRefineryId,null,
  'lost refinery must be reported explicitly, not guessed');
assert.equal(withoutRefinery.fullCargoStallCases[0].refineryDistance,null);
assert.equal(withoutRefinery.fullCargoStallCases[0].withinUnloadRange,false);
assert.ok(!JSON.stringify(withoutRefinery).includes('_movement'));
// The collision audit is observation-only and checks actual step occupancy,
// not merely whether the rounded A* destination looks close to the refinery.
const truck={...h(11,310,360,10,10),path:[{x:12,y:10}],
  pathGoal:{x:12,y:10}};
const refinery={id:88,x:13,y:10};
const game={
  stat:()=>1,
  canOccupyUnit:(_truck,x,y,ignoreUnits)=>
    ignoreUnits||!(x>10.1&&x<10.3&&Math.abs(y-10)<.2),
  findPath:(_sx,_sy,x,y)=>x===11&&y===10?
    [{x:11,y:10}]:[{x:8,y:8}]
};
const inspection=inspectHarvesterReturnStall(game,truck,[refinery],.2);
assert.equal(inspection.waypointDistance,2);
assert.equal(inspection.pathGoalInsideUnloadRange,true);
assert.equal(inspection.nextStepClear.direct.static,true);
assert.equal(inspection.nextStepClear.direct.withTraffic,false,
  'a dynamic blocker must be distinguishable from terrain');
assert.deepEqual(inspection.reachableUnloadTile,{x:11,y:10},
  'only a path reaching its exact unload tile may count as reachable');
assert.ok(inspection.unloadCandidatesChecked>0);
const unreachable=inspectHarvesterReturnStall(
  {...game,findPath:()=>[{x:8,y:8}]},truck,[refinery],.2);
assert.equal(unreachable.reachableUnloadTile,null,
  'partial A* paths must not be mistaken for a usable refinery approach');
const missing=inspectHarvesterReturnStall(game,truck,[],.2);
assert.equal(missing.reachableUnloadTile,null);
assert.equal(missing.pathGoalInsideUnloadRange,null);

const inspected=newHarvesterTelemetry();
let inspections=0;
observeHarvesterStep(inspected,[truck],[truck],0,0,1);
for(let second=2;second<=7;second++)
  observeHarvesterStep(inspected,[truck],[truck],0,0,second,[refinery],
    (current,refineries)=>{
      inspections++;
      assert.equal(current.id,11);
      assert.equal(refineries[0].id,88);
      return inspectHarvesterReturnStall(game,current,refineries,1);
    });
assert.equal(inspections,1,'expensive route inspection must run only at the six-second threshold');
assert.deepEqual(inspected.fullCargoStallCases[0].returnAccess.reachableUnloadTile,
  {x:11,y:10});
assert.equal(JSON.stringify(inspected).includes('_movement'),false);

console.log('PASS: ore telemetry records losses, deliveries, actual travel, bounded stalled-return context and visible route threats');
