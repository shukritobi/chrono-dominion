import assert from 'node:assert/strict';
import {BASELINE,checkAIEconomyRegression} from '../tools/check-ai-economy-regression.mjs';

const fixture=()=>({
  schema:'chrono-dominion-balance-lab-v1',
  mode:'natural-ai-progression',scenarios:3,simulationSeconds:720,
  results:[{map:'verdant',aiRefineryLossTelemetry:{
    losses:[{time:BASELINE.verdantRefinerySurvivalSeconds,built:true}],lossesOmitted:0
  }}],
  summary:{
    mapEconomy:Object.fromEntries(Object.entries(BASELINE.enemyOre)
      .map(([map,enemyOre])=>[map,{enemyOre}])),
    aiOreDeliveryTicks:BASELINE.aiOreDeliveryTicks,
    casesWithAIAirfields:BASELINE.casesWithAIAirfields,
    aiHarvesterLosses:BASELINE.aiHarvesterLosses
  }
});
assert.equal(checkAIEconomyRegression(fixture()).ok,true,
  'verified main-branch baseline must pass');
let report=fixture();
report.summary.mapEconomy.snow.enemyOre=BASELINE.enemyOre.snow*.85;
assert.equal(checkAIEconomyRegression(report).ok,true,
  'the documented 15% per-map tolerance is inclusive');
report.summary.mapEconomy.snow.enemyOre=BASELINE.enemyOre.snow*.85-1;
assert.match(checkAIEconomyRegression(report).failures.join(' '),/snow.*below 85%/,
  'a large map-specific loss must fail even if aggregate ore looks healthy');
report=fixture();report.summary.aiOreDeliveryTicks=91;
assert.match(checkAIEconomyRegression(report).failures.join(' '),/deliveries/,
  'a substantial loss of delivery frequency must fail');
report=fixture();report.summary.casesWithAIAirfields=0;
assert.match(checkAIEconomyRegression(report).failures.join(' '),/Air Commands/,
  'losing the only natural airfield must fail');
report=fixture();report.summary.aiHarvesterLosses=7;
assert.match(checkAIEconomyRegression(report).failures.join(' '),/harvester losses/,
  'large worker attrition increases must fail');
report=fixture();report.summary.aiHarvesterLosses=6;
assert.equal(checkAIEconomyRegression(report).ok,true,
  'small attrition changes remain within documented tolerance');
// The 30 Oct PR #162 experiment passed the obsolete October 27 floors,
 // despite a 38% Verdant ore regression and refinery loss 66.6s earlier.
report=fixture();report.summary.mapEconomy.verdant.enemyOre=4680;
assert.match(checkAIEconomyRegression(report).failures.join(' '),/verdant.*below 85%/,
  'a previously green-but-regressive AI candidate must now fail');
report=fixture();report.results[0].aiRefineryLossTelemetry.losses[0].time=165.4;
assert.match(checkAIEconomyRegression(report).failures.join(' '),/refinery destroyed/,
  'early operational refinery destruction must fail independently of ore income');
report=fixture();report.results[0].aiRefineryLossTelemetry.losses[0].time=
  BASELINE.verdantRefinerySurvivalSeconds*.85;
assert.equal(checkAIEconomyRegression(report).ok,true,
  'refinery survival tolerance is inclusive');
report=fixture();report.results[0].aiRefineryLossTelemetry.losses=[];
assert.equal(checkAIEconomyRegression(report).ok,true,
  'a refinery that survives the entire match must not be penalized');
report=fixture();report.results[0].aiRefineryLossTelemetry.lossesOmitted=1;
assert.throws(()=>checkAIEconomyRegression(report),/complete Verdant refinery/,
  'truncated destruction telemetry must never bypass the survival gate');
report=fixture();delete report.results;
assert.throws(()=>checkAIEconomyRegression(report),/Verdant progression/,
  'missing per-match telemetry must never silently pass');
report=fixture();report.summary.mapEconomy.desert.enemyOre=NaN;
assert.throws(()=>checkAIEconomyRegression(report),/valid AI ore/,
  'missing or malformed telemetry must never silently pass');
report=fixture();report.simulationSeconds=240;
assert.throws(()=>checkAIEconomyRegression(report),/720-second/,
  'a quick matrix cannot substitute for the full progression benchmark');
console.log('PASS: latest-main AI economy guard checks income, refinery survival, deliveries, aviation, attrition and report validity');
