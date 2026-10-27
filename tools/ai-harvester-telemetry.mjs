/**
 * Observation-only ore economy telemetry for deterministic headless matches.
 * Never changes the production game, saved entities or AI decisions.
 */
export function newHarvesterTelemetry(){
  return {lost:0,cargoAtLoss:0,damageObservations:0,deliveryTicks:0,
    deliveredOre:0,longestDeliveryGapSeconds:0,lastDeliveryAt:0,
    threatenedSamples:0,harvesterSamples:0};
}
export function observeHarvesterStep(metrics,before,after,oreBefore,oreAfter,time){
  if(!Number.isFinite(time)||time<0||!Number.isFinite(oreBefore)||
     !Number.isFinite(oreAfter)||oreAfter<oreBefore)
    throw Error('Invalid ore telemetry step');
  const survivors=new Map(after.map(h=>[h.id,h]));
  for(const prior of before){
    const current=survivors.get(prior.id);
    if(!current){
      metrics.lost++;
      // Cargo at the start of the final tick is an estimate, not a
      // reconstructed death event or a claim of exact ore lost.
      metrics.cargoAtLoss+=Math.max(0,prior.load||0);
    }else if(current.hp<prior.hp)metrics.damageObservations++;
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
export function observeHarvesterThreatSample(metrics,harvesters,visibleHostiles){
  metrics.harvesterSamples+=harvesters.length;
  for(const h of harvesters){
    if(visibleHostiles.some(e=>Math.hypot(e.x-h.x,e.y-h.y)<5))
      metrics.threatenedSamples++;
  }
}
