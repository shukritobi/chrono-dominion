/** Pure post-planner diagnostics; does not modify AI or save state. */
export function classifyAviationBlocker(s){
  if(s.aircraft>=2)return 'wing-complete';
  if(!s.hasFactory)return s.hadFactory?'factory-lost':'factory-missing';
  if(!s.hasRadar)return s.hadRadar?'radar-lost':'radar-missing';
  if(!s.airfieldOwned){
    if(s.time<=130)return 'airfield-not-yet-eligible';
    if(s.credits<2400){
      // Preserve the legacy label for an intact, safely saving economy;
      // distinguish states where credit shortage is only a symptom.
      if(s.powerLow)return 'airfield-funding-brownout';
      if(!s.harvesters)return 'airfield-funding-no-harvester';
      if(!s.armor)return 'airfield-funding-no-screen';
      if(s.threatened)return 'airfield-funding-under-attack';
      return 'airfield-funding';
    }
    return 'airfield-affordable-not-started';
  }
  if(!s.airfieldBuilt)return 'airfield-under-construction';
  if(s.powerLow)return 'power-shortage';
  if(!s.harvesters)return 'harvester-lost';
  if(s.threatened)return 'base-under-attack';
  if(!s.armor)return 'ground-screen-lost';
  if(s.queueKey)return s.queueKey==='aircraft'?'aircraft-in-production':'other-unit-in-production';
  if(s.credits<2250)return 'aircraft-funding';
  return 'aircraft-affordable-not-queued';
}
