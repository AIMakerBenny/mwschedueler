// Development-only contract test for legacy Recovery H diagnostics in unified mode.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('./diagnose-recovery-h-f1-live.mjs',import.meta.url),'utf8');
const start=source.indexOf('    const inactiveLegacyQasV11=new Set();');
const end=source.indexOf('    const variabilityQa303=',start);
assert(start>=0&&end>start,'Legacy QA classification helper is missing');
const helper=source.slice(start,end);
const run=report=>new Function('report',helper+
  '\nconst accepted=isInactiveLegacyQaV11(report);return {accepted,reasons:[...inactiveLegacyQasV11]};')(report);
const retired={status:'Not available',activeModel:'unified-v1.1',integrated:false,allPass:null,reason:'LEGACY_TEST_INACTIVE'};
const disabled=run(retired);
assert.equal(disabled.accepted,true);
assert.deepEqual(disabled.reasons,['LEGACY_TEST_INACTIVE']);
for(const notRetired of [
  {status:'Not available',activeModel:'unified-v1.1',integrated:false,allPass:false},
  {status:'Not available',activeModel:'unified-v1.1',integrated:true,allPass:null},
  {status:'Not available',activeModel:'unknown',integrated:false,allPass:null},
  {status:'FAIL',activeModel:'unified-v1.1',integrated:false,allPass:null},
  {status:'PASS',activeModel:'unified-v1.1',integrated:true,allPass:false},
  null
])assert.equal(run(notRetired).accepted,false,'Bad QA state was incorrectly ignored');
const vars=["variabilityQa303","microQa278","burstQa275","pressureQa274","trafficQa","lateralSmoothingQa258","lateralDomQa258","preemptivePass379","projectedSafe378","physicalContinuity386","physicalClosure386","emergencyAvoidance386","paceRelease385","safeThirdPit384","passLine383","cornerRetiming382","neighborBraking381","lateStint393","tacticalPit391","multicar376","cornerPhysics375","finalPit374","rearPace372","physicalPass371"];
let checked=0;
for(const line of source.split('\n')){
  if(!line.includes('assert('))continue;
  const target=vars.find(name=>new RegExp('\\b'+name+'\\b').test(line));
  if(!target)continue;
  assert(line.includes('isInactiveLegacyQaV11('+target+')'),
    'Unqualified old QA assertion '+target+': '+line.trim());
  checked++;
}
assert.equal(checked,34,'Some existing legacy QA checks were removed or left unguarded');
assert(source.includes('unavailableLegacyQAsV11:[...inactiveLegacyQasV11]'),'Missing explicit unavailable QA report');
console.log(JSON.stringify({result:'PASS',guardedAsserts:checked,legacyQAReportVariables:vars.length,
  note:'Only explicitly unavailable legacy-model QA is excluded; active test failures remain errors.'}));
