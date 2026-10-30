/**
 * Observation-only, headless attribution of actual AI refinery losses.
 * Observe the precise impact callback rather than guessing from nearby units.
 * This module never changes combat, orders, AI sensors, credits or save data.
 */
const round=value=>Number.isFinite(value)?Number(value.toFixed(2)):null;
export function traceAIRefineryLosses(game,{limit=12}={}){
  const report={losses:[],lossesOmitted:0,sales:0,unattributed:0};
  const originalRespond=game.respondToAIRefineryAttack;
  const originalRecordLoss=game.recordLoss;
  const originalUpdateProjectiles=game.updateProjectiles;
  const shotObservations=new WeakMap();
  let resolving=false,currentImpact=null;

  game.respondToAIRefineryAttack=function(shot,target){
    const result=originalRespond.call(this,shot,target);
    if(shot&&target?.owner===1&&target.kind==='refinery'&&shot.owner===0){
      const observed=shotObservations.get(shot)||{};
      if(resolving){
        observed.impactResponded=!!result;
        currentImpact={shot,targetId:target.id};
      }else{
        observed.launchResponded=!!result;
      }
      shotObservations.set(shot,observed);
    }
    return result;
  };

  game.recordLoss=function(entity,attackerOwner=null,sold=false){
    if(entity?.owner===1&&entity.kind==='refinery'&&!entity.lossRecorded){
      if(sold){
        report.sales++;
      }else{
        const shot=resolving&&currentImpact?.targetId===entity.id&&
          currentImpact.shot.targetId===entity.id&&
          currentImpact.shot.owner===attackerOwner&&
          currentImpact.shot.expired?currentImpact.shot:null;
        if(!shot)report.unattributed++;
        const attacker=shot?this.entityById(shot.sourceId):null;
        const source=attacker&&attacker.owner===shot?.owner?attacker:null;
        const visible=source?!!this.sideCanSee(1,source):false;
        const distance=(a,b)=>round(Math.hypot(a.x-b.x,a.y-b.y));
        const defenders=this.entities.filter(e=>e.owner===1&&e.type==='unit'&&
          e.hp>0&&e.built&&!['harvester','aircraft','recon'].includes(e.kind))
          .map(e=>{
            const refineryDistance=distance(e,entity);
            const attackerDistance=source?distance(e,source):null;
            const eligible=!!source&&visible&&refineryDistance<=9&&
              attackerDistance<=9&&(e.retreatUntil||0)<=this.time;
            return {id:e.id,kind:e.kind,refineryDistance,attackerDistance,
              eligible,orderTargetId:e.order?.type==='attack'?e.order.id??null:null};
          }).sort((a,b)=>a.refineryDistance-b.refineryDistance||a.id-b.id);
        const eligible=defenders.filter(e=>e.eligible);
        const assigned=defenders.filter(e=>e.orderTargetId===shot?.sourceId);
        const observed=shot?shotObservations.get(shot)||{}:{};
        const cause=shot?'projectile':'unattributed';
        const diagnostic=!shot?'non-projectile-or-unobserved-impact':
          !source?'shooter-no-longer-present':
          !visible?'shooter-not-visible-to-ai':
          !eligible.length?'no-eligible-local-defenders':
          !assigned.length?'eligible-but-not-targeting-shooter':
          'local-defenders-targeting-shooter';
        const snapshot={
          time:round(this.time),id:entity.id,cause,diagnostic,
          built:!!entity.built,x:round(entity.x),y:round(entity.y),
          hpBeforeImpact:shot?round(entity.hp+shot.damage):null,
          damage:shot?round(shot.damage):null,
          sourceId:shot?.sourceId??null,sourceKind:shot?.sourceKind??null,
          sourceVisibleToAI:visible,
          sourceDistance:source?distance(source,entity):null,
          launchResponded:observed.launchResponded??null,
          impactResponded:observed.impactResponded??null,
          eligibleDefenders:eligible.length,assignedDefenders:assigned.length,
          nearestDefenders:defenders.slice(0,8)
        };
        if(report.losses.length<limit)report.losses.push(snapshot);
        else report.lossesOmitted++;
      }
    }
    return originalRecordLoss.call(this,entity,attackerOwner,sold);
  };

  game.updateProjectiles=function(dt){
    resolving=true;
    try{return originalUpdateProjectiles.call(this,dt);}
    finally{resolving=false;currentImpact=null;}
  };
  return report;
}
