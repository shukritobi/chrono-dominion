/**
 * Observation-only movement/separation diagnostics for loaded AI harvesters.
 * Snapshots are taken at tick start, immediately before separateUnits(), and
 * immediately afterward. No game entities or saved state are modified.
 */
const rounded=value=>Number(value.toFixed(3));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const byId=units=>new Map(units.map(unit=>[unit.id,unit]));

export function newHarvesterSeparationTelemetry(){
  const metrics={
    loadedFrames:0,movementBeforeSeparationTiles:0,separationTiles:0,
    netMovementTiles:0,opposingSeparationFrames:0,
    nearCancelledFrames:0,noMovementFrames:0
  };
  Object.defineProperty(metrics,'_history',{enumerable:false,
    value:new Map()});
  return metrics;
}

export function observeHarvesterSeparationStep(metrics,before,pre,post,time){
  if(!Number.isFinite(time)||time<0)
    throw Error('Invalid separation observation time');
  if([...before,...pre,...post].some(h=>!Number.isFinite(h.x)||
     !Number.isFinite(h.y)||!Number.isInteger(h.id)))
    throw Error('Invalid separation position snapshot');
  const starting=byId(before),moving=byId(pre),ending=byId(post);
  for(const [id,after] of ending){
    const start=starting.get(id),during=moving.get(id);
    // Only a continuously full cargo hold can explain a loaded return stall.
    if(!start||!during||start.load<360||during.load<360||after.load<360)
      continue;
    const movement=distance(start,during);
    const separation=distance(during,after);
    const net=distance(start,after);
    const opposing=movement>.015&&
      ((during.x-start.x)*(after.x-during.x)+
       (during.y-start.y)*(after.y-during.y))<-.015*movement;
    const cancelled=movement>.02&&net<=Math.max(.01,movement*.25);
    const noMovement=movement<=.01&&net<=.01;
    metrics.loadedFrames++;
    metrics.movementBeforeSeparationTiles+=movement;
    metrics.separationTiles+=separation;
    metrics.netMovementTiles+=net;
    if(opposing)metrics.opposingSeparationFrames++;
    if(cancelled)metrics.nearCancelledFrames++;
    if(noMovement)metrics.noMovementFrames++;
    const recent=metrics._history.get(id)||[];
    recent.push({time,movement,separation,net,opposing,cancelled,noMovement});
    // Retain only the last six seconds and at most 64 samples per truck.
    // The cap also bounds memory if the caller uses an unusually small dt.
    while(recent.length>64||recent[0]?.time<time-6)recent.shift();
    metrics._history.set(id,recent);
  }
  for(const id of metrics._history.keys())
    if(!ending.has(id))metrics._history.delete(id);
}

export function summarizeHarvesterSeparation(metrics,id,time){
  if(!Number.isFinite(time))throw Error('Invalid separation summary time');
  const recent=(metrics._history.get(id)||[]).filter(s=>
    s.time<=time&&s.time>=time-6);
  const sum=key=>rounded(recent.reduce((total,s)=>total+s[key],0));
  return {
    frames:recent.length,
    movementBeforeSeparationTiles:sum('movement'),
    separationTiles:sum('separation'),
    netMovementTiles:sum('net'),
    opposingSeparationFrames:recent.filter(s=>s.opposing).length,
    nearCancelledFrames:recent.filter(s=>s.cancelled).length,
    noMovementFrames:recent.filter(s=>s.noMovement).length
  };
}
