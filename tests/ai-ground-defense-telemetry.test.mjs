import assert from 'node:assert/strict';
import {newGroundDefenseTelemetry,snapshotAIGroundDefense,
  observeAIGroundDefenseStep} from '../tools/ai-ground-defense-telemetry.mjs';

const refinery={id:10,owner:1,type:'building',kind:'refinery',
  built:true,hp:300,x:10,y:10};
const guard={id:20,owner:1,type:'unit',kind:'tank',
  built:true,hp:100,x:12,y:10,order:{type:'attackMove',x:20,y:20}};
const hidden={id:30,owner:0,type:'unit',kind:'tank',
  built:true,hp:100,x:13,y:10};
const game={time:10,entities:[refinery,guard,hidden],
  players:[{credits:500},{credits:900}],queues:[],
  sideCanSee:(side,e)=>side===1&&e.id!==30};
const initial=snapshotAIGroundDefense(game);
assert.equal(initial.defenders.length,1);
assert.equal(initial.visibleHostiles.length,0,'never expose hidden opponents');
assert.equal(initial.defenders[0].orderType,'attackMove');
const m=newGroundDefenseTelemetry({limit:2});
game.time=10.2;game.entities=[refinery,hidden];
const dead=snapshotAIGroundDefense(game);
observeAIGroundDefenseStep(m,initial,dead);
assert.equal(m.losses,1);
assert.equal(m.localLosses,1);
assert.equal(m.lossCases[0].cause,'unattributed-removal');
assert.deepEqual(m.lossCases[0].visibleNearbyEnemies,[]);
assert.equal(m.lossCases[0].orderType,'attackMove');
assert.equal(m.coverageGaps.length,1);
assert.equal(m.coverageGaps[0].startedAt,10.2);
assert.equal(m.coverageGaps[0].queueAtStart,null);
game.time=11.2;game.queues=[{side:1,key:'tank'}];
const still=snapshotAIGroundDefense(game);
observeAIGroundDefenseStep(m,dead,still);
assert.equal(m.unguardedRefinerySeconds,1);
assert.equal(m.coverageGaps.length,1,'same gap must not repeat each frame');
game.time=12.2;game.entities=[refinery,hidden,
  {...guard,id:21,order:null}];
game.queues=[];
const replaced=snapshotAIGroundDefense(game);
observeAIGroundDefenseStep(m,still,replaced);
assert.equal(m.reinforcements,1);
assert.equal(m.deploymentCases[0].queueKey,'tank');
assert.equal(m.deploymentCases[0].localToRefinery,true);
assert.equal(m.coverageGaps[0].reason,'defender-returned');
assert.equal(m.coverageGaps[0].endedAt,12.2);
assert.equal(m.maxUnguardedSeconds,2);
assert.equal(m.unguardedRefinerySeconds,1);
game.time=13.2;game.entities=[refinery,hidden];
const goneAgain=snapshotAIGroundDefense(game);
observeAIGroundDefenseStep(m,replaced,goneAgain);
assert.equal(m.losses,2);
assert.equal(m.coverageGaps.length,2);
game.time=14.2;game.entities=[hidden];
const refineryGone=snapshotAIGroundDefense(game);
observeAIGroundDefenseStep(m,goneAgain,refineryGone);
assert.equal(m.coverageGaps[1].reason,'refinery-lost');
assert.equal(m.coverageGaps[1].endedAt,14.2);
assert.equal(m.losses,2,'refinery destruction is not a ground-unit loss');
assert.ok(!JSON.stringify(m).includes('_internal'),
  'transient tracker must not leak into reports or saves');
assert.equal(game.players[1].credits,900,'telemetry never charges AI credits');
assert.equal(game.entities[0].id,30,'telemetry never mutates entities');
assert.throws(()=>observeAIGroundDefenseStep(m,replaced,initial),
  /Invalid ground defense telemetry step/);
assert.throws(()=>newGroundDefenseTelemetry({limit:-1}),
  /Invalid defense telemetry limit/);
const capped=newGroundDefenseTelemetry({limit:0});
observeAIGroundDefenseStep(capped,initial,dead);
assert.equal(capped.lossCases.length,0);
assert.equal(capped.lossCasesOmitted,1);
assert.equal(capped.coverageGapsOmitted,1);
console.log('PASS: sensor-safe ground defender attrition, reinforcement and refinery coverage telemetry');
