/** Observation-only radar recovery diagnostics for the natural-match laboratory.
 * Classify the real AI planner's pre/post state; never change game decisions. */
export function classifyRadarRecovery(before,after){
  if(after.radarBuilt)return 'radar-operational';
  if(!before.radarOwned&&after.radarOwned)return 'radar-construction-started';
  if(after.radarOwned)return 'radar-under-construction';
  if(!before.hqAlive)return 'hq-lost';
  if(!before.generatorOwned||before.powerLow)return 'power-recovery-priority';
  if(!before.refineryOwned)return 'refinery-recovery-priority';
  // The AI buys an emergency turret ahead of radar only when affordable.
  if(before.threatened&&before.turretsBuilt<2&&before.credits>=900)
    return 'base-defense-priority';
  if(before.refineryBuilt&&!before.harvesters){
    if(before.harvesterQueued)return 'harvester-replacement-queued';
    if(before.credits<900)return 'harvester-replacement-unaffordable';
    return 'harvester-recovery-priority';
  }
  if(before.criticalHarvester)return 'critical-harvester-priority';
  // The current AI purchases a missing factory before a missing radar.
  if(!before.factoryOwned)return 'factory-recovery-priority';
  if(before.credits<1550)return 'funding-shortfall';
  if(!before.radarPrereq)return 'prerequisite-blocked';
  if(before.legalRadarSite===false)return 'no-legal-placement';
  return 'affordable-but-not-started';
}
export function newRadarLifecycle(){
  return {activeIds:new Set(),everOperational:false,losses:[],restorations:[]};
}
export function observeRadarLifecycle(tracker,radars,time){
  const next=new Set(radars.filter(r=>r.hp>0&&r.built).map(r=>r.id));
  const at=Number(time.toFixed(1));
  for(const id of tracker.activeIds)if(!next.has(id))tracker.losses.push({time:at,id});
  if(tracker.everOperational&&tracker.activeIds.size===0&&next.size>0)
    tracker.restorations.push(at);
  tracker.everOperational ||= next.size>0;
  tracker.activeIds=next;
  return tracker;
}
