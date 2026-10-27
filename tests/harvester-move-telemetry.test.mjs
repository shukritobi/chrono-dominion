import assert from 'node:assert/strict';
import {newHarvesterMoveTelemetry,traceHarvesterMoves,
  observeHarvesterMoveTick,summarizeHarvesterMove}
  from '../tools/harvester-move-telemetry.mjs';

const metrics=newHarvesterMoveTelemetry();
const truck={id:18,owner:1,kind:'harvester',load:360,x:2,y:2,
  path:[{x:5,y:2}],pathGoal:{x:5,y:2},pathRecheck:1,trafficWait:0};
let occupyCalls=0,laneCalls=0;
const blocker={id:24,owner:1,kind:'soldier',type:'unit',hp:100,
  x:6,y:2,stance:'hold'};
const game={time:1,entities:[truck,blocker],
  unitRadius(){return .4;},
  canOccupyUnit(e,x,y,ignoreUnits=false){
    occupyCalls++;
    return x!==5&&(ignoreUnits||x!==6);
  },
  checkLaneEntry(e,x,y){laneCalls++;return x!==7;},
  move(e,x,y){
    if(this.canOccupyUnit(e,x,y)&&this.checkLaneEntry(e,x,y))
      e.x=x;
    return true;
  }};
const original=game.move,occupy=game.canOccupyUnit,lane=game.checkLaneEntry;
const restore=traceHarvesterMoves(game,metrics);
const before=()=>[{id:truck.id,x:truck.x,y:truck.y,load:truck.load}];
const after=()=>[{...truck}];
for(const [time,x] of [[1,5],[2,6],[3,7],[4,8]]){
  game.time=time;
  const start=before();
  assert.equal(game.move(truck,x,2),true,'the wrapper returns the engine result');
  assert.equal(game.canOccupyUnit,occupy,'occupancy wrapper must be restored');
  assert.equal(game.checkLaneEntry,lane,'lane wrapper must be restored');
  observeHarvesterMoveTick(metrics,start,after(),time);
}
assert.equal(metrics.loadedMoveCalls,4);
assert.equal(metrics.loadedMoveNoProgressCalls,3);
assert.equal(metrics.staticBlockedProbes,1);
assert.equal(metrics.trafficBlockedProbes,1);
assert.equal(metrics.laneRejectedProbes,1);
assert.equal(metrics.acceptedLaneProbes,1);
assert.equal(laneCalls,2,'instrumentation must not replay lane admission');
assert.equal(truck.x,8,'real movement is preserved');
const summary=summarizeHarvesterMove(metrics,18,4);
assert.equal(summary.frames,4);
assert.equal(summary.moveCalls,4);
assert.equal(summary.noProgressMoveCalls,3);
assert.equal(summary.staticBlockedProbes,1);
assert.equal(summary.trafficBlockedProbes,1);
assert.deepEqual(summary.trafficBlockers,[{
  id:24,owner:1,kind:'soldier',stance:'hold',yielding:false,probes:1
}], 'actual colliding Hold soldier is identified without changing occupancy');
assert.equal(summary.laneRejectedProbes,1);
assert.deepEqual(summary.lastMove.destination,{x:8,y:2});
assert.equal(JSON.stringify(metrics).includes('_history'),false);
assert.equal(JSON.stringify(metrics).includes('_pending'),false);

game.time=5;
const start=before();
truck.stunnedUntil=10;
start[0].stunnedUntil=10;
observeHarvesterMoveTick(metrics,start,after(),5);
assert.equal(metrics.noMoveCallFrames,1);
assert.equal(metrics.stunnedNoCallFrames,1);
assert.equal(summarizeHarvesterMove(metrics,18,5).stunnedNoCallFrames,1);
game.time=12;
observeHarvesterMoveTick(metrics,before(),after(),12);
assert.deepEqual(summarizeHarvesterMove(metrics,18,12).trafficBlockers,[],
  'stale blocker identities are removed with the bounded six-second history');
assert.equal(summarizeHarvesterMove(metrics,18,12).moveCalls,0,
  'history older than six seconds is discarded');
restore();
assert.equal(game.move,original);
const other={...truck,id:19,owner:0};
game.time=13;
const startOther=other.x;
game.move(other,9,2);
assert.equal(other.x,9,'untraced movement remains functional');
assert.throws(()=>observeHarvesterMoveTick(metrics,[],[],NaN),
  /Invalid movement observation time/);
console.log('PASS: loaded harvester movement-call rejection diagnostics and bounded history');
