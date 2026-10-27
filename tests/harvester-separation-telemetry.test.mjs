import assert from 'node:assert/strict';
import {newHarvesterSeparationTelemetry,observeHarvesterSeparationStep,
  summarizeHarvesterSeparation} from '../tools/harvester-separation-telemetry.mjs';

const truck=(id,x,y,load=360)=>({id,x,y,load});
const metrics=newHarvesterSeparationTelemetry();
const start=truck(8,10,10),forward=truck(8,10.2,10);
const blocked=truck(8,10,10);
observeHarvesterSeparationStep(metrics,[start],[forward],[blocked],1);
assert.equal(metrics.loadedFrames,1);
assert.ok(Math.abs(metrics.movementBeforeSeparationTiles-.2)<1e-9);
assert.ok(Math.abs(metrics.separationTiles-.2)<1e-9);
assert.equal(metrics.netMovementTiles,0);
assert.equal(metrics.opposingSeparationFrames,1,
  'separation directly reversed the actual forward movement');
assert.equal(metrics.nearCancelledFrames,1,
  'a post-separation return to the tick start is a near-cancellation');
assert.equal(metrics.noMovementFrames,0,
  'a reversed move is not the same as no movement attempt');

observeHarvesterSeparationStep(metrics,[start],[start],[start],2);
assert.equal(metrics.noMovementFrames,1,
  'no pre-separation progress must be diagnosed separately');
assert.equal(metrics.opposingSeparationFrames,1);
observeHarvesterSeparationStep(metrics,[start],[forward],
  [truck(8,10.25,10)],3);
assert.equal(metrics.opposingSeparationFrames,1,
  'separation pushing along the movement direction is not a reversal');
assert.equal(metrics.nearCancelledFrames,1);
const summary=summarizeHarvesterSeparation(metrics,8,3);
assert.equal(summary.frames,3);
assert.equal(summary.opposingSeparationFrames,1);
assert.equal(summary.nearCancelledFrames,1);
assert.equal(summary.noMovementFrames,1);
assert.ok(summary.netMovementTiles>.24);
assert.equal(JSON.stringify(metrics).includes('_history'),false,
  'per-harvester movement samples must not leak into JSON or saved data');

observeHarvesterSeparationStep(metrics,[truck(8,10,10,80)],
  [truck(8,10.2,10,80)],[truck(8,10,10,80)],4);
assert.equal(metrics.loadedFrames,3,'empty or partly loaded trucks are excluded');
observeHarvesterSeparationStep(metrics,[start],[forward],[],5);
assert.equal(summarizeHarvesterSeparation(metrics,8,5).frames,0,
  'destroyed trucks must not retain stale samples');
observeHarvesterSeparationStep(metrics,[start],[forward],[blocked],6);
observeHarvesterSeparationStep(metrics,[start],[forward],[blocked],13);
assert.equal(summarizeHarvesterSeparation(metrics,8,13).frames,1,
  'samples older than six seconds are excluded from stall context');
assert.throws(()=>observeHarvesterSeparationStep(metrics,
  [{id:8,x:10,load:360}],[forward],[blocked],14),
  /Invalid separation position snapshot/,
  'missing coordinates must never silently count as no movement');
assert.throws(()=>observeHarvesterSeparationStep(metrics,[],[],[],-1),
  /Invalid separation observation time/);
console.log('PASS: loaded harvester movement before/after separation, reversals, no-attempts and bounded stall windows');
