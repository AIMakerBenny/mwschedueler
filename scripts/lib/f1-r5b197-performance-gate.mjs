// R5-b197: compare full actual Chromium 10-lap results from the same
// Majoku 12-car seeds. No synthetic passes, speed offsets or AI score bonus.
// The reference is the physically verified R5-b189 GitHub run 41584183003.
const METRICS=['passes','leaderChanges','rankReorders','collisionStops','starts','disengaged','targetChanged','quickRetries'];
export function evaluateMatchedRaceGate(rows){
 if(!Array.isArray(rows)||rows.length!==2||rows[0]?.seed!==1||rows[1]?.seed!==2)
  throw new Error('real race gate requires exactly matching seeds 1 and 2');
 for(const r of rows){
  for(const kind of ['baseline','previousR5b189','modified']){
   if(!r[kind])throw new Error('missing '+kind+' seed '+r.seed);
   for(const key of METRICS){
    const n=r[kind][key];
    if(!Number.isSafeInteger(n)||n<0)throw new Error('invalid '+kind+' '+key+' seed '+r.seed);
   }
  }
 }
 const sum=(kind,key)=>rows.reduce((total,r)=>total+r[kind][key],0);
 const before={passes:sum('previousR5b189','passes'),rankReorders:sum('previousR5b189','rankReorders')};
 const after={passes:sum('modified','passes'),rankReorders:sum('modified','rankReorders')};
 const checks={
  noCollisionStops:rows.every(r=>r.modified.collisionStops===0),
  eachSeedAtLeastOriginalPasses:rows.every(r=>r.modified.passes>=r.baseline.passes),
  passesAtLeastR5b189:after.passes>=before.passes,
  rankReordersAtLeastR5b189:after.rankReorders>=before.rankReorders,
 };
 return {reference:'R5-b189 run 41584183003',seeds:[1,2],before,after,
  checks,accepted:Object.values(checks).every(Boolean)};
}
