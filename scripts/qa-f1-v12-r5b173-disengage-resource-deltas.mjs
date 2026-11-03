// R5-b173: preterminal physical resource source at -200ms vs -20ms.
// Categorization is observational. Never credit the terminal-state switch
// or energy changes as an experimentally proven AI failure cause.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root='artifacts/r5-b77-majoku/';
const read=n=>JSON.parse(fs.readFileSync(root+n,'utf8'));
const replay=read('replay.json'),ends=read('b167-terminal-physical-context.json');
const contrast=read('b169-terminal-cause-contrast.json');
const transition=read('b170-preterminal-ai-transition.json');
for(const r of [replay,ends,contrast,transition])assert.equal(r.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
const types=['DISENGAGED_UNCONFIRMED','TARGET_CHANGED','SUCCESS','PIT_INTERRUPTED'];
const fields=['driverEnergyDeployKW','targetEnergyDeployKW','driverBatteryMJ',
 'targetBatteryMJ','driverTyreWearFraction','targetTyreWearFraction',
 'relativeClosingSpeedMps','signedTrackProgressGapMeters'];
const isNumeric=x=>typeof x==='number'&&Number.isFinite(x);
const median=values=>{
 const v=[...values].sort((a,b)=>a-b);
 return v.length?(v.length%2?v[(v.length-1)/2]:(v[v.length/2-1]+v[v.length/2])/2):null;
};
const make=()=>({attempts:0,bothPreFramesAvailable:0,unknownPreFrameCount:0,
 originalTargetStillAttackedBeforeTerminal:0,
 driverEnergyRise:0,driverEnergyFall:0,driverEnergyNoChange:0,
 targetEnergyRise:0,targetEnergyFall:0,targetEnergyNoChange:0,
 driverBatteryRise:0,driverBatteryFall:0,driverBatteryNoChange:0,
 driverTyreWearRise:0,driverTyreWearFall:0,driverTyreWearNoChange:0,
 relativeClosingSpeedRise:0,relativeClosingSpeedFall:0,relativeClosingSpeedNoChange:0,
 longitudinalGapRise:0,longitudinalGapFall:0,longitudinalGapNoChange:0,
 driverEnergyUnknown:0,targetEnergyUnknown:0,
 driverTyreWearUnknown:0,closingSpeedUnknown:0,gapUnknown:0,
 observedClosingSpeedDeltasMps:[],observedGapDeltasMeters:[]});
const cases=[];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 assert.equal(race.status,'PASS');assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.mode,'NORMAL');assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);assert.equal(race.physics.collisionStops,0);
 const ledger=race.real20ms?.attackLedger;
 assert(ledger&&!ledger.missingOverlap);
 const initial=ends.cases.find(c=>c.seed===seed);
 const c1=contrast.cases.find(c=>c.seed===seed);
 const c2=transition.cases.find(c=>c.seed===seed);
 assert(initial&&c1&&c2);
 const byEvent=new Map(ledger.terminalEventWitnesses.map(w=>
  [w.attemptId+'|'+w.terminalType+'|'+w.terminalMs,w]));
 assert.equal(byEvent.size,ledger.terminalEventWitnesses.length);
 const summary=Object.fromEntries(types.map(t=>[t,make()]));
 const rows=[];
 for(const x of initial.rows){
  const group=summary[x.actualTerminalType];assert(group);
  group.attempts++;
  const w=byEvent.get(x.attemptId+'|'+x.actualTerminalType+'|'+x.actualTerminalMs);
  assert(w&&w.driver===x.driver&&w.target===x.target);
  const pre=w.offsetSamples['-200'],last=w.offsetSamples['-20'];
  assert(pre&&last&&pre.ms===w.terminalMs-200&&last.ms===w.terminalMs-20);
  assert.equal(pre.available, x.last200msSourceAvailable || (pre.ms<x.originalAttemptStartedMs&&pre.available));
  assert.equal(last.available&&last.ms>=w.attackStartMs,x.last20msSourceAvailable);
  const eligible=pre.available&&last.available&&pre.ms>=w.attackStartMs;
  const row={seed,attemptId:w.attemptId,driver:w.driver,target:w.target,
   type:w.terminalType,terminalMs:w.terminalMs,
   availableExactPre200AndPre20:eligible,
   knownDeltas:null,driverPre200Ai:eligible?pre.driverAiState:null,
   driverPre20Ai:eligible?last.driverAiState:null,
   verifiedSweptClearance:false};
  if(!eligible){group.unknownPreFrameCount++;rows.push(row);continue}
  group.bothPreFramesAvailable++;
  group.originalTargetStillAttackedBeforeTerminal+=
   Number(last.driverStillAttackingOriginalTarget);
  const diffs={};
  for(const f of fields){
   diffs[f]=isNumeric(pre[f])&&isNumeric(last[f])?last[f]-pre[f]:null;
  }
  const sign=(field,label,tol=1e-8)=>{
   const v=diffs[field];
   if(v===null){group[label+'Unknown']++;return}
   if(v>tol)group[label+'Rise']++;
   else if(v< -tol)group[label+'Fall']++;
   else group[label+'NoChange']++;
  };
  sign('driverEnergyDeployKW','driverEnergy');
  sign('targetEnergyDeployKW','targetEnergy');
  sign('driverBatteryMJ','driverBattery');
  sign('driverTyreWearFraction','driverTyreWear');
  sign('relativeClosingSpeedMps','relativeClosingSpeed');
  sign('signedTrackProgressGapMeters','longitudinalGap',1e-7);
  if(diffs.relativeClosingSpeedMps!==null)
   group.observedClosingSpeedDeltasMps.push(diffs.relativeClosingSpeedMps);
  if(diffs.signedTrackProgressGapMeters!==null)
   group.observedGapDeltasMeters.push(diffs.signedTrackProgressGapMeters);
  row.knownDeltas=diffs;
  rows.push(row);
 }
 assert.equal(rows.length,initial.quickRetries);
 for(const [type,g] of Object.entries(summary)){
  assert.equal(g.attempts,c1.byTerminalReason[type].attempts);
  assert.equal(g.attempts,c2.byReason[type].attempts);
  assert.equal(g.bothPreFramesAvailable+g.unknownPreFrameCount,g.attempts);
  for(const label of ['driverEnergy','targetEnergy','driverBattery','driverTyreWear',
   'relativeClosingSpeed','longitudinalGap']){
   assert.equal(g[label+'Rise']+g[label+'Fall']+g[label+'NoChange']+
    (g[label+'Unknown']||0),g.bothPreFramesAvailable);
  }
  assert.equal(g.relativeClosingSpeedFall,c2.byReason[type].speedDeclinedBeforeTerminal);
  assert.equal(g.relativeClosingSpeedRise,c2.byReason[type].speedIncreasedBeforeTerminal);
  assert.equal(g.longitudinalGapRise,c2.byReason[type].signedGapIncreaseBeforeMinus20);
  assert.equal(g.longitudinalGapFall,c2.byReason[type].signedGapDecreaseBeforeMinus20);
  g.medianPre200ToPre20ClosingSpeedDeltaMps=median(g.observedClosingSpeedDeltasMps);
  g.medianPre200ToPre20GapDeltaMeters=median(g.observedGapDeltasMeters);
  delete g.observedClosingSpeedDeltasMps;
  delete g.observedGapDeltasMeters;
 }
 cases.push({seed,rapidSameTargetRetryStarts:rows.length,byEndReason:summary,
  rows,actualPhysicalPasses:race.physics.passes,collisionStops:0});
 console.log(JSON.stringify({phase:'R5-b173',status:'CASE_PASS',seed,
  disengagements:summary.DISENGAGED_UNCONFIRMED.attempts,
  validPreFramesForDisengagement:summary.DISENGAGED_UNCONFIRMED.bothPreFramesAvailable,
  energyFell:summary.DISENGAGED_UNCONFIRMED.driverEnergyFall,
  tyresWore:summary.DISENGAGED_UNCONFIRMED.driverTyreWearRise,
  closingSpeedFell:summary.DISENGAGED_UNCONFIRMED.relativeClosingSpeedFall}));
}
const out={phase:'R5-b173',status:'PASS',track:'majoku-ring-v1',
 sourceGenuineChromiumRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
 Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 sourceFramesExact20ms:true,readOnly:true,gamePhysicsModified:false,
 aiBalancePatchAuthorized:false,causalResourceFaultProven:false,
 realSafetyClearanceProven:false,cases,
 limitations:['Resource movement is only a signed 180ms change in two actual frames',
 'No causal inference about why DISENGAGED_UNCONFIRMED occurred',
 'Missing source inputs are never substituted by a strategy summary']};
fs.writeFileSync(root+'b173-disengage-resource-deltas.json',JSON.stringify(out,null,2));
