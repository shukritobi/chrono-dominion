import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const gameSource=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__testGame = new Game();');
const elements=new Map();
const ctx=new Proxy({},{
  get(target,key){return target[key]??(()=>{});},
  set(target,key,value){target[key]=value;return true;}
});
const dom={
  getElementById(id){
    if(!elements.has(id))elements.set(id,{
      id,style:{},width:256,height:190,
      classList:{toggle(){},add(){},remove(){}},addEventListener(){},querySelectorAll(){return [];},
      getContext(){return ctx;},getBoundingClientRect(){return {width:id==='world'?1150:256,height:id==='world'?750:190,left:0,top:0};},
      set innerHTML(v){this._html=v;},get innerHTML(){return this._html||'';},
      set textContent(v){this._text=v;},get textContent(){return this._text||'';}
    });
    return elements.get(id);
  }
};
const window={addEventListener(){}};
runInNewContext(gameSource,{window,document:dom,console,
  performance:{now:()=>0},requestAnimationFrame(){},devicePixelRatio:1,
  setTimeout:()=>1,clearTimeout(){}},{timeout:3000});
const g=window.__testGame;
const setup=()=>g.newMatch({playerFaction:'coalition',enemyFaction:'federation',map:'verdant',difficulty:'standard'});

// Projectiles travel and only damage an enemy when they actually hit.
setup();
const friendly=g.entities.find(e=>e.owner===0&&e.kind==='tank');
const hostile=g.entities.find(e=>e.owner===1&&e.kind==='tank');
friendly.x=16;friendly.y=16;hostile.x=20;hostile.y=16;
const hp=hostile.hp;
g.shoot(friendly,hostile);
assert.equal(hostile.hp,hp,'shooting does not apply immediate damage');
assert.equal(g.projectiles.length,1);
g.updateProjectiles(.12);
assert.equal(hostile.hp,hp,'projectile has not yet reached the target');
for(let i=0;i<30&&hostile.hp===hp;i++)g.updateProjectiles(.05);
assert.ok(hostile.hp<hp,'the impact applies damage');
assert.equal(g.projectiles.length,0,'impact removes projectile');

// Shortest-arc rotation is speed-limited rather than a heading snap.
setup();
const testTank=g.entities.find(e=>e.owner===0&&e.kind==='tank');
const heading=testTank.worldHeading;
testTank.desiredHeading=Math.PI;
testTank.desiredTurretHeading=-Math.PI/2;
testTank.order=null;
g.step(.02);
assert.ok(Math.abs(testTank.worldHeading-heading)>0&&Math.abs(testTank.worldHeading-heading)<.15,'hull turn is limited per tick');
assert.ok(Math.abs(testTank.turretHeading-heading)>0&&Math.abs(testTank.turretHeading-heading)<.20,'turret turn is also limited per tick');

// Repair toggling consumes funds, while selling refunds part of construction cost.
setup();
const structure=g.entities.find(e=>e.owner===0&&e.kind==='generator');
structure.hp-=150;
g.selected=[structure.id];
assert.ok(g.buildingAction('repair'));
assert.ok(structure.repairing);
const before=g.players[0].credits,damaged=structure.hp;
g.repairBuildings(1);
assert.ok(structure.hp>damaged,'repair restored hit points');
assert.ok(g.players[0].credits<before,'repair spent credits');
assert.ok(g.buildingAction('repair'),'repair toggle can stop maintenance');
assert.equal(structure.repairing,false);
assert.equal(g.buildingAction('sell'),true,'selling a power plant succeeds');
assert.equal(structure.hp,0,'selling removes the structure');
assert.ok(g.players[0].credits>before-100,'selling pays a partial refund');
const hq=g.entities.find(e=>e.owner===0&&e.kind==='hq');
g.selected=[hq.id];
assert.equal(g.buildingAction('sell'),false,'command HQ cannot be sold');
assert.ok(hq.hp>0);

// AI credits are never minted by the decision loop.
setup();
const ai=g.players[1];
for(const u of g.entities.filter(e=>e.owner===1&&e.kind==='harvester'))u.hp=0;
g.queues.length=0;ai.credits=0;
g.runAI();
assert.equal(ai.credits,0,'AI has no free periodic income');
ai.credits=1600;g.runAI();
assert.ok(g.queues.some(q=>q.side===1&&q.key==='harvester'),'AI replaces a destroyed harvester');
// Two legitimate attackers can land lethal projectiles in the same engine
// update, before step() removes the victim. Only the first impact may award
// veterancy, damage credit or destruction effects.
for(const faction of ['coalition','federation','psionic']){
  g.newMatch({playerFaction:faction,enemyFaction:'federation',
    map:'verdant',difficulty:'standard'});
  const lead=g.entities.find(e=>e.owner===0&&e.kind==='tank');
  const victim=g.entities.find(e=>e.owner===1&&e.kind==='tank');
  const wingman=g.add(0,'soldier',18.1,16);
  assert.ok(lead&&victim&&wingman,faction+': actual combat units exist');
  lead.x=18;lead.y=16;victim.x=18.4;victim.y=16;victim.hp=1;
  const before={kills:g.stats[0].enemyUnitsDestroyed,
    losses:g.stats[1].unitsLost,damage:g.stats[0].damageDealt,
    lead:lead.kills||0,wingman:wingman.kills||0};
  g.shoot(lead,victim);
  g.shoot(wingman,victim);
  assert.equal(g.projectiles.length,2,faction+': both shots are in flight');
  g.updateProjectiles(.2);
  assert.equal(g.projectiles.length,0,
    faction+': all same-frame shots are consumed, including corpse impacts');
  assert.equal(g.stats[0].enemyUnitsDestroyed,before.kills+1,
    faction+': destroyed target counts once');
  assert.equal(g.stats[1].unitsLost,before.losses+1,
    faction+': the victim is lost once');
  assert.equal(g.stats[0].damageDealt,before.damage+1,
    faction+': damage credit cannot include overkill on a corpse');
  assert.equal(lead.kills,before.lead+1,
    faction+': the actual first killer earns veterancy');
  assert.equal(wingman.kills||0,before.wingman,
    faction+': follow-up shot must not award phantom veterancy');

  // A distant projectile that was already flying when the target died must
  // expire on its next update rather than keep tracking a destroyed entity.
  g.newMatch({playerFaction:faction,enemyFaction:'federation',
    map:'verdant',difficulty:'standard'});
  const finisher=g.entities.find(e=>e.owner===0&&e.kind==='tank');
  const target=g.entities.find(e=>e.owner===1&&e.kind==='tank');
  const distant=g.add(0,'soldier',5,16);
  finisher.x=18;finisher.y=16;target.x=18.4;target.y=16;target.hp=1;
  g.shoot(distant,target); // slow-arriving shot is first in the array.
  g.shoot(finisher,target);
  g.updateProjectiles(.2);
  assert.equal(g.projectiles.length,1,
    faction+': long-range shot is still in flight after the lethal impact');
  const credited=g.stats[0].damageDealt;
  g.updateProjectiles(.2);
  assert.equal(g.projectiles.length,0,
    faction+': in-flight shot to a dead target is discarded next tick');
  assert.equal(g.stats[0].damageDealt,credited,
    faction+': discarded projectile cannot add damage');
  assert.equal(distant.kills||0,0,
    faction+': distant attacker receives no phantom kill');
}

console.log('PASS: corpse-safe projectiles, projectile flight, delayed hits, smooth turning, repairs, selling, AI ore economy and harvester recovery');
