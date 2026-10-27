#!/usr/bin/env node
/**
 * Guard against large, unintended AI-economy regressions in the deterministic
 * 720-second natural-progression matrix. Baseline: main 077f0d1841356a53,
 * GitHub Actions 40534935886 (27 Oct 2026).
 *
 * A guard failure requests gameplay review, not an automatic balance change.
 * Update baseline values only after a documented intentional rebalance.
 */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const BASELINE=Object.freeze({
  enemyOre:Object.freeze({verdant:3960,desert:15120,snow:9000}),
  aiOreDeliveryTicks:78,
  casesWithAIAirfields:1,
  aiHarvesterLosses:4
});

export function checkAIEconomyRegression(report){
  if(report?.schema!=='chrono-dominion-balance-lab-v1'||
     report.mode!=='natural-ai-progression'||report.scenarios!==3||
     report.simulationSeconds!==720){
    throw new Error('Expected a complete 720-second natural AI progression report');
  }
  const summary=report.summary;
  if(!summary||!summary.mapEconomy)throw new Error('Missing AI economy summary');
  const failures=[];
  const actual={};
  for(const [map,baseline] of Object.entries(BASELINE.enemyOre)){
    const ore=summary.mapEconomy[map]?.enemyOre;
    if(!Number.isFinite(ore)||ore<0)throw new Error('Missing valid AI ore for '+map);
    actual[map]=ore;
    if(ore<baseline*.80)failures.push(
      map+': AI ore '+ore+' is below 80% of baseline '+baseline);
  }
  for(const key of ['aiOreDeliveryTicks','casesWithAIAirfields','aiHarvesterLosses']){
    if(!Number.isInteger(summary[key])||summary[key]<0)
      throw new Error('Missing valid AI metric '+key);
    actual[key]=summary[key];
  }
  if(summary.aiOreDeliveryTicks<BASELINE.aiOreDeliveryTicks*.75)
    failures.push('AI ore deliveries fell below 75% of baseline ('+
      summary.aiOreDeliveryTicks+' vs '+BASELINE.aiOreDeliveryTicks+')');
  if(summary.casesWithAIAirfields<BASELINE.casesWithAIAirfields)
    failures.push('AI Air Commands regressed ('+
      summary.casesWithAIAirfields+' vs '+BASELINE.casesWithAIAirfields+')');
  if(summary.aiHarvesterLosses>BASELINE.aiHarvesterLosses+2)
    failures.push('AI harvester losses increased by more than two ('+
      summary.aiHarvesterLosses+' vs '+BASELINE.aiHarvesterLosses+')');
  return {ok:failures.length===0,failures,actual,baseline:BASELINE};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const file=process.argv[2];
  if(!file)throw new Error('Usage: node tools/check-ai-economy-regression.mjs progression-report.json');
  const result=checkAIEconomyRegression(JSON.parse(readFileSync(file,'utf8')));
  console.log('AI ECONOMY REGRESSION GATE:',JSON.stringify(result));
  if(!result.ok)process.exitCode=1;
}
