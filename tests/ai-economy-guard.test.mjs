import assert from 'node:assert/strict';
import {BASELINE,checkAIEconomyRegression} from '../tools/check-ai-economy-regression.mjs';

const fixture=()=>({
  schema:'chrono-dominion-balance-lab-v1',
  mode:'natural-ai-progression',scenarios:3,simulationSeconds:720,
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
report.summary.mapEconomy.snow.enemyOre=7200;
assert.equal(checkAIEconomyRegression(report).ok,true,
  'the documented 20% per-map tolerance is inclusive');
report.summary.mapEconomy.snow.enemyOre=7199;
assert.match(checkAIEconomyRegression(report).failures.join(' '),/snow.*below 80%/,
  'a large map-specific loss must fail even if aggregate ore looks healthy');
report=fixture();report.summary.aiOreDeliveryTicks=58;
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
report=fixture();report.summary.mapEconomy.desert.enemyOre=NaN;
assert.throws(()=>checkAIEconomyRegression(report),/valid AI ore/,
  'missing or malformed telemetry must never silently pass');
report=fixture();report.simulationSeconds=240;
assert.throws(()=>checkAIEconomyRegression(report),/720-second/,
  'a quick matrix cannot substitute for the full progression benchmark');
console.log('PASS: AI economy guard checks per-map income, delivery cadence, aviation, attrition and report validity');
