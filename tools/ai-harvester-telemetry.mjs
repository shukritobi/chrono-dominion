/**
 * Observation-only ore economy telemetry for deterministic headless matches.
 * Never changes production gameplay, saved entities or AI decisions.
 *
 * Full-cargo stalls are sampled at the simulation step frequency, not inferred
 * from a distant ore destination. Six continuous seconds without movement
 * count as one stall episode; short refinery unload waits do not.
 */
export function newHarvesterTelemetry(){
  const metrics={lost:0,cargoAtLoss:0,damageObservations:0,deliveryTicks:0,
    deliveredOre:0,longestDeliveryGapSeconds:0,lastDeliveryAt:0,
    threatenedSamples:0,harvesterSamples:0,
    travelTiles:0,loadedTravelTiles:0,fullCargoStallSeconds:0,
    fullCargoStallEvents:0,fullCargoStallCases:[],fullCargoStallCasesOmitted:0,
    threatenedLoadedSamples:0,
    threatenedEmptySamples:0,threatenedFarFromRefinerySamples:0};
  // Keep the per-truck streak state out of exported JSON reports and saves.
  Object.defineProperty(metrics,'_movement',{enumerable:false,value:{
    lastTime:null,streaks:new Map()
  }});
  return metrics;
}
export function observeHarvesterStep(metrics,before,after,oreBefore,oreAfter,time,refineries=[],inspectStall=null){
  if(!Number.isFinite(time)||time<0||!Number.isFinite(oreBefore)||
     !Number.isFinite(oreAfter)||oreAfter<oreBefore)
    throw Error('Invalid ore telemetry step');
  if([...before,...after].some(h=>!Number.isFinite(h.x)||!Number.isFinite(h.y)))
    throw Error('Invalid harvester position snapshot');
  const movement=metrics._movement;
  const dt=movement.lastTime===null?0:Math.max(0,time-movement.lastTime);
  movement.lastTime=time;
  const survivors=new Map(after.map(h=>[h.id,h]));
  for(const prior of before){
    const current=survivors.get(prior.id);
    if(!current){
      metrics.lost++;
      movement.streaks.delete(prior.id);
      // Cargo at the start of the final tick is an estimate, not a
      // reconstructed death event or a claim of exact ore lost.
      metrics.cargoAtLoss+=Math.max(0,prior.load||0);
    }else{
      if(current.hp<prior.hp)metrics.damageObservations++;
      const traveled=Math.hypot(current.x-prior.x,current.y-prior.y);
      if(Number.isFinite(traveled)){
        metrics.travelTiles+=traveled;
        if(prior.load>0)metrics.loadedTravelTiles+=traveled;
      }
      // Count continuous immobility only while *both* observations have a
      // full cargo hold. Ignore the normal brief unload / loading pauses.
      if(dt>0&&prior.load>=360&&current.load>=360&&
         Number.isFinite(traveled)&&traveled<Math.max(.01,dt*.03)){
        const previous=movement.streaks.get(prior.id)||0;
        const streak=previous+dt;
        if(previous<6&&streak>=6){
          metrics.fullCargoStallEvents++;
          // Capture bounded, observational context at the first six-second
          // threshold. This is not a diagnosis of why the unit is stationary.
          if(metrics.fullCargoStallCases.length<12){
            const nearest=refineries.filter(r=>Number.isFinite(r.x)&&
              Number.isFinite(r.y)).sort((a,b)=>
              Math.hypot(a.x-current.x,a.y-current.y)-
              Math.hypot(b.x-current.x,b.y-current.y))[0];
            const range=nearest?Math.hypot(nearest.x-current.x,
              nearest.y-current.y):null;
            const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?
              {x:Number(p.x.toFixed(2)),y:Number(p.y.toFixed(2))}:null;
            metrics.fullCargoStallCases.push({
              id:prior.id,time:Number(time.toFixed(1)),
              position:point(current),
              nearestRefineryId:nearest?.id??null,
              refineryDistance:range===null?null:Number(range.toFixed(2)),
              withinUnloadRange:range!==null&&range<=3.6,
              pathTarget:point(current.pathTarget),
              pathGoal:point(current.pathGoal),
              nextWaypoint:point(current.path?.[0]),
              trafficWait:Number.isFinite(current.trafficWait)?
                Number(current.trafficWait.toFixed(2)):null,
              laneWaiting:current.laneWaiting??null,
              yielding:!!current.yieldOrder,
              returnAccess:inspectStall?inspectStall(current,refineries):null
            });
          }else metrics.fullCargoStallCasesOmitted++;
        }
        metrics.fullCargoStallSeconds+=dt;
        movement.streaks.set(prior.id,streak);
      }else movement.streaks.delete(prior.id);
    }
  }
  const delta=oreAfter-oreBefore;
  if(delta>0){
    metrics.deliveryTicks++;
    metrics.deliveredOre+=delta;
  }
  metrics.longestDeliveryGapSeconds=Math.max(metrics.longestDeliveryGapSeconds,
    Math.round((time-metrics.lastDeliveryAt)*10)/10);
  if(delta>0)metrics.lastDeliveryAt=time;
}
export function observeHarvesterThreatSample(metrics,harvesters,visibleHostiles,refineries=[]){
  metrics.harvesterSamples+=harvesters.length;
  for(const h of harvesters){
    if(!visibleHostiles.some(e=>Math.hypot(e.x-h.x,e.y-h.y)<5))continue;
    metrics.threatenedSamples++;
    if(h.load>0)metrics.threatenedLoadedSamples++;
    else metrics.threatenedEmptySamples++;
    // A route exposed beyond the refinery perimeter is a distinct issue
    // from fighting immediately outside the AI's own base.
    if(refineries.length&&refineries.every(r=>Math.hypot(r.x-h.x,r.y-h.y)>=5))
      metrics.threatenedFarFromRefinerySamples++;
  }
}
