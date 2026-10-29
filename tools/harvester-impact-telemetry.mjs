/**
 * Headless-only exact lethal-projectile attribution for AI ore trucks.
 *
 * recordLoss() runs inside updateProjectiles() after the current shot is
 * marked expired. The most recently processed expired projectile for that
 * victim/owner is the lethal impact. This observes production decisions
 * without modifying damage, projectiles, orders or saved entities.
 */
export function traceHarvesterLethalImpacts(game){
  const impacts=new Map();
  const originalRecordLoss=game.recordLoss;
  const originalUpdateProjectiles=game.updateProjectiles;
  let resolvingProjectiles=false;

  game.recordLoss=function(entity,attackerOwner,sold){
    if(resolvingProjectiles&&!sold&&!entity?.lossRecorded&&
       entity?.owner===1&&entity.kind==='harvester'&&entity.hp<=0){
      // A projectile that timed out or hit another target cannot be blamed
      // for this death. The current impact has already been marked expired.
      const shots=this.projectiles||[];
      for(let i=shots.length-1;i>=0;i--){
        const shot=shots[i];
        if(!shot.expired||shot.targetId!==entity.id||
           shot.owner!==attackerOwner)continue;
        impacts.set(entity.id,{
          sourceId:shot.sourceId??null,
          sourceKind:shot.sourceKind??null,
          attackerOwner:shot.owner,
          damage:Number.isFinite(shot.damage)?
            Number(shot.damage.toFixed(2)):null
        });
        break;
      }
    }
    return originalRecordLoss.call(this,entity,attackerOwner,sold);
  };

  game.updateProjectiles=function(dt){
    resolvingProjectiles=true;
    try{return originalUpdateProjectiles.call(this,dt);}
    finally{resolvingProjectiles=false;}
  };
  return impacts;
}
