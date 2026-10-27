/**
 * Observation-only inspection of a loaded harvester that has stopped moving.
 * Called only at the six-second stall threshold, never by production gameplay.
 * Distinguishes an inaccessible refinery unloading perimeter from a blocked
 * immediate movement step; no orders, entities, or saved state are changed.
 */
export function inspectHarvesterReturnStall(game,truck,refineries=[],dt=.2){
  const waypoint=truck.path?.[0]??null;
  const refinery=refineries.filter(r=>Number.isFinite(r.x)&&Number.isFinite(r.y))
    .sort((a,b)=>Math.hypot(a.x-truck.x,a.y-truck.y)-
      Math.hypot(b.x-truck.x,b.y-truck.y))[0];
  const goal=truck.pathGoal;
  const result={
    waypointDistance:waypoint?
      Number(Math.hypot(waypoint.x-truck.x,waypoint.y-truck.y).toFixed(2)):null,
    pathGoalInsideUnloadRange:refinery&&goal?
      Math.hypot(goal.x-refinery.x,goal.y-refinery.y)<=3.6:null,
    nextStepClear:null,
    reachableUnloadTile:null,
    unloadCandidatesChecked:0
  };
  if(waypoint){
    const dx=waypoint.x-truck.x,dy=waypoint.y-truck.y;
    const len=Math.hypot(dx,dy);
    if(len>.001){
      const step=Math.min(game.stat(truck,'speed')*dt,len);
      const vx=dx/len*step,vy=dy/len*step;
      const probe=(x,y)=>({
        static:!!game.canOccupyUnit(truck,x,y,true),
        withTraffic:!!game.canOccupyUnit(truck,x,y,false)
      });
      const sign=truck.id%2===0?1:-1;
      result.nextStepClear={
        direct:probe(truck.x+vx,truck.y+vy),
        xOnly:probe(truck.x+vx,truck.y),
        yOnly:probe(truck.x,truck.y+vy),
        sidestepA:probe(truck.x-vy*sign,truck.y+vx*sign),
        sidestepB:probe(truck.x+vy*sign,truck.y-vx*sign)
      };
    }
  }
  if(!refinery)return result;
  // Search only legal *tile centers* in the actual 3.6-tile unloading radius.
  // findPath may return a partial path: accept only a path that ends on the
  // candidate tile, never a merely close-looking unreachable destination.
  let best=null;
  for(let x=Math.floor(refinery.x-3.6);x<=Math.ceil(refinery.x+3.6);x++)
    for(let y=Math.floor(refinery.y-3.6);y<=Math.ceil(refinery.y+3.6);y++){
      if(Math.hypot(x-refinery.x,y-refinery.y)>3.6||
         !game.canOccupyUnit(truck,x,y,true))continue;
      result.unloadCandidatesChecked++;
      const path=game.findPath(truck.x,truck.y,x,y);
      const end=path.at(-1)??{x:Math.round(truck.x),y:Math.round(truck.y)};
      if(Math.hypot(end.x-x,end.y-y)>.01)continue;
      const score=path.length+Math.hypot(truck.x-x,truck.y-y)*.01;
      if(!best||score<best.score)best={x,y,score};
    }
  if(best)result.reachableUnloadTile={x:best.x,y:best.y};
  return result;
}
