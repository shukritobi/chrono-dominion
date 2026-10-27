/**
 * Observation-only instrumentation for AI harvesters returning full ore loads.
 * Wraps the real movement routine only in headless balance simulations.
 * Delegates every occupancy/lane decision exactly once and never changes it.
 * History is bounded, private, and excluded from JSON and save files.
 */
const round=n=>Number(n.toFixed(3));
const position=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?
  {x:round(p.x),y:round(p.y)}:null;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function newHarvesterMoveTelemetry(){
  const metrics={loadedMoveCalls:0,loadedMoveNoProgressCalls:0,
    noMoveCallFrames:0,stunnedNoCallFrames:0,
    emptyPathNoProgressCalls:0,noWaypointNoProgressCalls:0,
    staticBlockedProbes:0,trafficBlockedProbes:0,laneRejectedProbes:0,
    acceptedLaneProbes:0};
  Object.defineProperty(metrics,'_pending',{value:new Map()});
  Object.defineProperty(metrics,'_history',{value:new Map()});
  return metrics;
}

export function traceHarvesterMoves(game,metrics){
  const originalMove=game.move;
  game.move=function(unit,tx,ty,dt){
    if(unit.owner!==1||unit.kind!=='harvester'||unit.load<360)
      return originalMove.call(this,unit,tx,ty,dt);
    const before={x:unit.x,y:unit.y};
    const pathBefore=unit.path?.length??0;
    const baseOccupy=this.canOccupyUnit;
    const baseLane=this.checkLaneEntry;
    let staticBlocked=0,trafficBlocked=0,laneRejected=0,laneAccepted=0;
    // The same live engine makes every decision. Extra static probes are
    // read-only and run only after an occupancy rejection.
    this.canOccupyUnit=function(e,x,y,ignoreUnits=false){
      const allowed=baseOccupy.call(this,e,x,y,ignoreUnits);
      if(e===unit&&!ignoreUnits&&!allowed){
        if(baseOccupy.call(this,e,x,y,true))trafficBlocked++;
        else staticBlocked++;
      }
      return allowed;
    };
    this.checkLaneEntry=function(e,x,y){
      const allowed=baseLane.call(this,e,x,y);
      if(e===unit){if(allowed)laneAccepted++;else laneRejected++;}
      return allowed;
    };
    let result;
    try{result=originalMove.call(this,unit,tx,ty,dt);}
    finally{
      this.canOccupyUnit=baseOccupy;
      this.checkLaneEntry=baseLane;
      const moved=distance(before,unit);
      const sample={
        time:this.time,moved:round(moved),destination:{x:round(tx),y:round(ty)},
        pathBefore,pathAfter:unit.path?.length??0,
        waypointAfter:position(unit.path?.[0]),
        pathGoalAfter:position(unit.pathGoal),
        pathRecheckAfter:round(Number(unit.pathRecheck)||0),
        trafficWaitAfter:round(Number(unit.trafficWait)||0),
        stuckAfter:round(Number(unit.stuck)||0),
        staticBlocked,trafficBlocked,laneRejected,laneAccepted
      };
      metrics.loadedMoveCalls++;
      metrics.staticBlockedProbes+=staticBlocked;
      metrics.trafficBlockedProbes+=trafficBlocked;
      metrics.laneRejectedProbes+=laneRejected;
      metrics.acceptedLaneProbes+=laneAccepted;
      if(moved<=.01){
        metrics.loadedMoveNoProgressCalls++;
        if(!sample.pathAfter)metrics.emptyPathNoProgressCalls++;
        if(!sample.waypointAfter)metrics.noWaypointNoProgressCalls++;
      }
      const pending=metrics._pending.get(unit.id)||[];
      pending.push(sample);
      metrics._pending.set(unit.id,pending);
    }
    return result;
  };
  return ()=>{game.move=originalMove;};
}

export function observeHarvesterMoveTick(metrics,before,after,time){
  if(!Number.isFinite(time)||time<0)throw Error('Invalid movement observation time');
  const surviving=new Map(after.map(h=>[h.id,h]));
  for(const prior of before){
    const current=surviving.get(prior.id);
    if(!current||prior.load<360||current.load<360){
      metrics._history.delete(prior.id);
      continue;
    }
    if(!Number.isFinite(prior.x)||!Number.isFinite(prior.y)||
       !Number.isFinite(current.x)||!Number.isFinite(current.y))
      throw Error('Invalid movement position snapshot');
    const calls=metrics._pending.get(prior.id)||[];
    const noCall=calls.length===0;
    const stunned=noCall&&Number(prior.stunnedUntil)>time;
    if(noCall)metrics.noMoveCallFrames++;
    if(stunned)metrics.stunnedNoCallFrames++;
    const recent=metrics._history.get(prior.id)||[];
    recent.push({time,noCall,stunned,calls,
      netMovement:round(distance(prior,current))});
    while(recent.length>64||recent[0]?.time<time-6)recent.shift();
    metrics._history.set(prior.id,recent);
  }
  metrics._pending.clear();
  for(const id of metrics._history.keys())
    if(!surviving.has(id))metrics._history.delete(id);
}

export function summarizeHarvesterMove(metrics,id,time){
  if(!Number.isFinite(time))throw Error('Invalid movement summary time');
  const frames=(metrics._history.get(id)||[]).filter(s=>
    s.time>=time-6&&s.time<=time);
  const calls=frames.flatMap(f=>f.calls);
  const sum=key=>calls.reduce((n,c)=>n+c[key],0);
  const last=calls.at(-1);
  return {
    frames:frames.length,moveCalls:calls.length,
    noMoveCallFrames:frames.filter(f=>f.noCall).length,
    stunnedNoCallFrames:frames.filter(f=>f.stunned).length,
    noProgressMoveCalls:calls.filter(c=>c.moved<=.01).length,
    emptyPathNoProgressCalls:calls.filter(c=>c.moved<=.01&&!c.pathAfter).length,
    staticBlockedProbes:sum('staticBlocked'),
    trafficBlockedProbes:sum('trafficBlocked'),
    laneRejectedProbes:sum('laneRejected'),
    acceptedLaneProbes:sum('laneAccepted'),
    netMovementTiles:round(frames.reduce((n,f)=>n+f.netMovement,0)),
    lastMove:last?{
      time:round(last.time),destination:last.destination,
      pathBefore:last.pathBefore,pathAfter:last.pathAfter,
      waypointAfter:last.waypointAfter,pathGoalAfter:last.pathGoalAfter,
      pathRecheckAfter:last.pathRecheckAfter,
      trafficWaitAfter:last.trafficWaitAfter,stuckAfter:last.stuckAfter
    }:null
  };
}
