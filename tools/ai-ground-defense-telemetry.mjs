/**
 * Observation-only AI ground-defense attrition and refinery coverage.
 * Uses the real simulation's before/after entity states. Nearby visible
 * enemies are context, never claimed to be the killing attacker.
 * No gameplay state, AI orders, save data or economy is modified.
 */
const round=n=>Number(n.toFixed(2));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const combat=e=>e.owner===1&&e.type==='unit'&&e.hp>0&&e.built&&
  !['harvester','recon','aircraft'].includes(e.kind);

export function snapshotAIGroundDefense(game){
  const refinery=game.entities.find(e=>e.owner===1&&e.kind==='refinery'&&
    e.hp>0&&e.built);
  const defenders=game.entities.filter(combat).map(e=>({
    id:e.id,kind:e.kind,hp:round(e.hp),x:e.x,y:e.y,
    orderType:e.order?.type??null,
    orderTargetId:e.order?.type==='attack'?e.order.id??null:null,
    retreating:(e.retreatUntil||0)>game.time
  }));
  const visibleHostiles=game.entities.filter(e=>e.owner===0&&
    e.type==='unit'&&e.hp>0&&e.kind!=='harvester'&&
    game.sideCanSee(1,e)).map(e=>({id:e.id,kind:e.kind,x:e.x,y:e.y}));
  return {
    time:game.time,credits:game.players[1].credits,
    queueKey:game.queues.find(q=>q.side===1)?.key??null,
    refinery:refinery?{id:refinery.id,x:refinery.x,y:refinery.y,
      hp:round(refinery.hp)}:null,
    defenders,visibleHostiles
  };
}

export function newGroundDefenseTelemetry({limit=20}={}){
  if(!Number.isInteger(limit)||limit<0)throw Error('Invalid defense telemetry limit');
  const metrics={
    losses:0,localLosses:0,reinforcements:0,
    lossCases:[],lossCasesOmitted:0,
    deploymentCases:[],deploymentCasesOmitted:0,
    coverageGaps:[],coverageGapsOmitted:0,
    unguardedRefinerySeconds:0,
    maxUnguardedSeconds:0,
    recentCoverage:[]
  };
  Object.defineProperty(metrics,'_internal',{enumerable:false,value:{
    limit,openGap:null,lastSampleAt:-Infinity
  }});
  return metrics;
}

export function observeAIGroundDefenseStep(metrics,before,after){
  if(![before?.time,after?.time,before?.credits,after?.credits]
    .every(Number.isFinite)||after.time<before.time||
    !Array.isArray(before.defenders)||!Array.isArray(after.defenders))
    throw Error('Invalid ground defense telemetry step');
  const internal=metrics._internal,limit=internal.limit;
  const near=(snapshot,e)=>snapshot.refinery&&
    distance(snapshot.refinery,e)<=9;
  const beforeIds=new Set(before.defenders.map(e=>e.id));
  const afterIds=new Set(after.defenders.map(e=>e.id));
  for(const e of before.defenders){
    if(afterIds.has(e.id))continue;
    metrics.losses++;
    if(near(before,e))metrics.localLosses++;
    const threats=before.visibleHostiles.filter(h=>distance(h,e)<=8)
      .sort((a,b)=>distance(a,e)-distance(b,e)||a.id-b.id);
    const record={
      time:round(after.time),id:e.id,kind:e.kind,
      lastSeenHp:e.hp,
      refineryId:before.refinery?.id??null,
      refineryDistance:before.refinery?round(distance(before.refinery,e)):null,
      wasLocal:!!near(before,e),
      orderType:e.orderType,orderTargetId:e.orderTargetId,
      retreating:!!e.retreating,
      visibleNearbyEnemies:threats.slice(0,4).map(h=>({
        id:h.id,kind:h.kind,distance:round(distance(h,e))
      })),
      visibleEnemiesOmitted:Math.max(0,threats.length-4),
      // No projectile source is captured here: do not infer a killer.
      cause:'unattributed-removal'
    };
    if(metrics.lossCases.length<limit)metrics.lossCases.push(record);
    else metrics.lossCasesOmitted++;
  }
  for(const e of after.defenders){
    if(beforeIds.has(e.id))continue;
    metrics.reinforcements++;
    const record={time:round(after.time),id:e.id,kind:e.kind,
      localToRefinery:!!near(after,e),queueKey:before.queueKey,
      creditsAfter:Math.floor(after.credits)};
    if(metrics.deploymentCases.length<limit)metrics.deploymentCases.push(record);
    else metrics.deploymentCasesOmitted++;
  }
  const beforeLocal=before.refinery?
    before.defenders.filter(e=>near(before,e)).length:0;
  const afterLocal=after.refinery?
    after.defenders.filter(e=>near(after,e)).length:0;
  const dt=after.time-before.time;
  if(before.refinery&&after.refinery&&
    before.refinery.id===after.refinery.id&&beforeLocal===0&&afterLocal===0)
    metrics.unguardedRefinerySeconds+=dt;
  if(after.refinery&&afterLocal===0&&!internal.openGap){
    const gap={startedAt:round(after.time),refineryId:after.refinery.id,
      endedAt:null,reason:null,creditsAtStart:Math.floor(after.credits),
      queueAtStart:after.queueKey};
    internal.openGap=gap;
    if(metrics.coverageGaps.length<limit)metrics.coverageGaps.push(gap);
    else metrics.coverageGapsOmitted++;
  }else if(internal.openGap&&(!after.refinery||afterLocal>0||
    internal.openGap.refineryId!==after.refinery.id)){
    const gap=internal.openGap;
    gap.endedAt=round(after.time);
    gap.reason=!after.refinery?'refinery-lost':
      afterLocal>0?'defender-returned':'refinery-replaced';
    metrics.maxUnguardedSeconds=Math.max(metrics.maxUnguardedSeconds,
      Math.max(0,after.time-gap.startedAt));
    internal.openGap=null;
  }
  if(after.time-internal.lastSampleAt>=8){
    internal.lastSampleAt=after.time;
    const local=after.refinery?after.defenders.filter(e=>near(after,e)):[];
    metrics.recentCoverage.push({
      time:round(after.time),refineryId:after.refinery?.id??null,
      refineryHp:after.refinery?.hp??null,
      groundDefenders:after.defenders.length,
      localDefenders:local.length,
      localArmour:local.filter(e=>['tank','heavy'].includes(e.kind)).length,
      visibleLocalHostiles:after.refinery?
        after.visibleHostiles.filter(e=>distance(e,after.refinery)<=9).length:0,
      credits:Math.floor(after.credits),queueKey:after.queueKey
    });
    if(metrics.recentCoverage.length>16)metrics.recentCoverage.shift();
  }
  return metrics;
}
