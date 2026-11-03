// R5-b177: compare genuine current 10-lap browser races against frozen seed 1/2 races.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {evaluateMatchedRaceGate} from './lib/f1-r5b197-performance-gate.mjs';
const load=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const attemptStats=d=>{
 const events=d.real20ms?.attackLedger?.events||[];
 const ended=new Map();let quickRetries=0;
 for(const e of events){
  const key=String(e.driver)+'|'+String(e.target);
  if(e.type==='START'){
   if(ended.has(key)&&e.ms-ended.get(key)>=0&&e.ms-ended.get(key)<=1000)quickRetries++;
  }else if(['DISENGAGED_UNCONFIRMED','TARGET_CHANGED','PIT_INTERRUPTED','SUCCESS'].includes(e.type)){
   ended.set(key,e.ms);
  }
 }
 return {starts:events.filter(e=>e.type==='START').length,
  disengaged:events.filter(e=>e.type==='DISENGAGED_UNCONFIRMED').length,
  targetChanged:events.filter(e=>e.type==='TARGET_CHANGED').length,quickRetries};
};
const rows=[];
for(const seed of [1,2]){
 const before=load('artifacts/r5-b177-baseline/seed'+seed+'-observed10.json');
 const after=load('artifacts/r5-b177-current/seed'+seed+'-observed10.json');
 // R5-b193: the pinned pre-engine baseline alone cannot tell whether the
 // latest AI work regressed from the last verified real-engine release.
 // Compare all three fully observed same-seed Chromium 10-lap races.
 const previous=load('artifacts/r5-b189-reference/seed'+seed+'-observed10.json');
 for(const d of [before,previous,after]){
  assert.equal(d.track,'majoku-ring-v1');assert.equal(d.mode,'NORMAL');assert.equal(d.laps,10);
 }
 assert.equal(after.status,'PASS','real browser must pass');
 assert.equal(after.state,'FINISHING','ten laps must finish');
 assert.equal(after.physics?.collisionStops,0,'collision stops forbidden');
 assert.equal(after.rejectedStep,null,'rejected swept-physics step forbidden');
 assert.equal(after.pageErrors?.length,0,'browser JS runtime errors forbidden');
 assert.equal(after.continuityErrors?.length,0,'physical position continuity forbidden');
 assert.equal(after.pitPlanViolations?.length,0,'autonomous pit-plan violations forbidden');
 assert.equal(after.finishedRows?.length,12,'all twelve cars must finish');
 const metrics=d=>({passes:d.physics?.passes,leaderChanges:d.acceptedCompetition?.leaderChanges,
  rankReorders:d.acceptedCompetition?.rankReorders,collisionStops:d.physics?.collisionStops,...attemptStats(d)});
 const b=metrics(before),p=metrics(previous),a=metrics(after);
 // Validate the latest physics and the comparator inputs independently;
 // never invent missing race metrics or claim causal improvement from two seeds.
 for(const [kind,m] of [['original',b],['R5-b189',p],['current',a]]){
  for(const key of ['passes','leaderChanges','rankReorders','collisionStops','starts','disengaged','targetChanged','quickRetries'])
   assert.ok(Number.isInteger(m[key])&&m[key]>=0,kind+' '+key+' must be a valid observed count');
 }
 const diff=(x,y)=>Object.fromEntries(Object.keys(x).map(k=>[k,x[k]-y[k]]));
 rows.push({seed,baseline:b,previousR5b189:p,modified:a,delta:diff(a,b),deltaVsR5b189:diff(a,p)});
}
fs.mkdirSync('artifacts/r5-b177-current',{recursive:true});
// R5-b197: do not label the real race regression SUCCESS merely because
// both Chromium runs finished safely. Preserve full evidence before failing.
const performanceGate=evaluateMatchedRaceGate(rows);
fs.writeFileSync('artifacts/r5-b177-current/comparison.json',JSON.stringify({phase:'R5-b197',basis:'genuine same-seed Chromium 12-car ten-lap races: pinned original, verified R5-b189, current',referenceRunId:41584183003,rows,performanceGate,improvementNotAssumed:true},null,2));
process.stdout.write(JSON.stringify({rows,performanceGate},null,2)+'\\n');
assert.ok(performanceGate.accepted,'genuine physical passing or ranking regressed versus R5-b189; see uploaded comparison.json');
