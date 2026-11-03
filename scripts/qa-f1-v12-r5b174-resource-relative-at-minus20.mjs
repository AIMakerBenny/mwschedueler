// R5-b174 - actual 20ms pre-termination relative resource standing
// for the same identified pair and each engine outcome.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='artifacts/r5-b77-majoku/';
const read=n=>JSON.parse(fs.readFileSync(dir+n,'utf8'));
const replay=read('replay.json'),end=read('b167-terminal-physical-context.json');
const resource=read('b173-disengage-resource-deltas.json');
const prior=read('b169-terminal-cause-contrast.json');
for(const r of [replay,end,resource,prior])assert.equal(r.status,'PASS');
assert.equal(replay.authenticPhysicsUnchanged,true);
const reasons=['DISENGAGED_UNCONFIRMED','TARGET_CHANGED','SUCCESS','PIT_INTERRUPTED'];
const num=x=>typeof x==='number'&&Number.isFinite(x);
const create=()=>({attempts:0,exactLast20ms:0,missingLast20ms:0,
 closingNegativeOrZero:0,closingPositive:0,closingUnknown:0,
 driverEnergyLessThanTarget:0,driverEnergyGreaterThanTarget:0,energyEqual:0,
 energyComparisonUnknown:0,batteryLessThanTarget:0,batteryGreaterThanTarget:0,
 batteryEqual:0,batteryComparisonUnknown:0,
 tyresMoreWornThanTarget:0,tyresLessWornThanTarget:0,tyreWearEqual:0,
 tyreComparisonUnknown:0,
 negativeClosingWithLowerDriverEnergy:0,
 negativeClosingWithHigherDriverTyreWear:0,
 negativeClosingWithBothDisadvantages:0,
 negativeClosingWithNeitherDisadvantage:0,
 sourceSpeedAndEnergyAndTyresAvailable:0});
const cases=[];
for(const seed of [1,2]){
 const race=read('seed'+seed+'-observed10.json');
 assert.equal(race.status,'PASS');assert.equal(race.track,'majoku-ring-v1');
 assert.equal(race.mode,'NORMAL');assert.equal(race.laps,10);
 assert.equal(race.finishedRows.length,12);assert.equal(race.physics.collisionStops,0);
 const ledger=race.real20ms?.attackLedger;assert(ledger&&!ledger.missingOverlap);
 const byWitness=new Map(ledger.terminalEventWitnesses.map(w=>
  [w.attemptId+'|'+w.terminalType+'|'+w.terminalMs,w]));
 assert.equal(byWitness.size,ledger.terminalEventWitnesses.length);
 const previous=end.cases.find(x=>x.seed===seed);
 const r=resource.cases.find(x=>x.seed===seed);
 const old=prior.cases.find(x=>x.seed===seed);
 assert(previous&&r&&old);
 const groups=Object.fromEntries(reasons.map(x=>[x,create()]));
 const rows=[];
 for(const terminal of previous.rows){
  const g=groups[terminal.actualTerminalType];assert(g);
  g.attempts++;
  const w=byWitness.get(
   terminal.attemptId+'|'+terminal.actualTerminalType+'|'+terminal.actualTerminalMs);
  assert(w&&w.driver===terminal.driver&&w.target===terminal.target);
  const s=w.offsetSamples['-20'];
  assert(s&&s.ms===w.terminalMs-20);
  const available=s.available&&s.ms>=w.attackStartMs;
  assert.equal(available,terminal.last20msSourceAvailable);
  g.exactLast20ms+=Number(available);
  g.missingLast20ms+=Number(!available);
  const compare=(a,b,lower,higher,equal,unknown)=>{
   if(!num(a)||!num(b)){g[unknown]++;return null}
   if(a<b)g[lower]++;
   else if(a>b)g[higher]++;
   else g[equal]++;
   return a-b;
  };
  const speed=available&&num(s.relativeClosingSpeedMps)?
   s.relativeClosingSpeedMps:null;
  g.closingNegativeOrZero+=Number(speed!==null&&speed<=0);
  g.closingPositive+=Number(speed!==null&&speed>0);
  g.closingUnknown+=Number(speed===null);
  const energy=available?compare(s.driverEnergyDeployKW,s.targetEnergyDeployKW,
   'driverEnergyLessThanTarget','driverEnergyGreaterThanTarget','energyEqual',
   'energyComparisonUnknown'):null;
  const battery=available?compare(s.driverBatteryMJ,s.targetBatteryMJ,
   'batteryLessThanTarget','batteryGreaterThanTarget','batteryEqual',
   'batteryComparisonUnknown'):null;
  const tyre=available?compare(s.driverTyreWearFraction,s.targetTyreWearFraction,
   'tyresLessWornThanTarget','tyresMoreWornThanTarget','tyreWearEqual',
   'tyreComparisonUnknown'):null;
  if(!available){
   g.energyComparisonUnknown++;g.batteryComparisonUnknown++;g.tyreComparisonUnknown++;
  }
  const joint=speed!==null&&energy!==null&&tyre!==null;
  if(joint){
   g.sourceSpeedAndEnergyAndTyresAvailable++;
   if(speed<=0){
    g.negativeClosingWithLowerDriverEnergy+=Number(energy<0);
    g.negativeClosingWithHigherDriverTyreWear+=Number(tyre>0);
    g.negativeClosingWithBothDisadvantages+=Number(energy<0&&tyre>0);
    g.negativeClosingWithNeitherDisadvantage+=Number(!(energy<0)&&!(tyre>0));
   }
  }
  rows.push({seed,attemptId:w.attemptId,terminalReason:w.terminalType,
   exactMinus20MsFrameAvailable:available,closingSpeedMps:speed,
   driverMinusTargetActualEnergyOutputKW:energy,
   driverMinusTargetBatteryMJ:battery,
   driverMinusTargetTyreWearFraction:tyre,
   safeMergeProven:false,anyResourceCausalityProven:false});
 }
 for(const [reason,g]of Object.entries(groups)){
  assert.equal(g.attempts,old.byTerminalReason[reason].attempts);
  assert.equal(g.attempts,r.byEndReason[reason].attempts);
  assert.equal(g.exactLast20ms+g.missingLast20ms,g.attempts);
  assert.equal(g.closingNegativeOrZero+g.closingPositive+g.closingUnknown,g.attempts);
  assert.equal(g.driverEnergyLessThanTarget+g.driverEnergyGreaterThanTarget+
   g.energyEqual+g.energyComparisonUnknown,g.attempts);
  assert.equal(g.tyresMoreWornThanTarget+g.tyresLessWornThanTarget+
   g.tyreWearEqual+g.tyreComparisonUnknown,g.attempts);
  assert.equal(g.batteryLessThanTarget+g.batteryGreaterThanTarget+
   g.batteryEqual+g.batteryComparisonUnknown,g.attempts);
  assert(g.negativeClosingWithBothDisadvantages<=
   g.negativeClosingWithLowerDriverEnergy);
  assert(g.negativeClosingWithBothDisadvantages<=
   g.negativeClosingWithHigherDriverTyreWear);
 }
 assert.equal(rows.length,previous.quickRetries);
 cases.push({seed,rapidStarts:rows.length,byOutcome:groups,
  rows,collisionStops:0,physicalPasses:race.physics.passes});
 console.log(JSON.stringify({phase:'R5-b174',status:'CASE_PASS',seed,
  disengage:groups.DISENGAGED_UNCONFIRMED.attempts,
  known:groups.DISENGAGED_UNCONFIRMED.exactLast20ms,
  lowerEnergy:groups.DISENGAGED_UNCONFIRMED.driverEnergyLessThanTarget,
  higherTyreWear:groups.DISENGAGED_UNCONFIRMED.tyresMoreWornThanTarget,
  neitherDisadvantage:groups.DISENGAGED_UNCONFIRMED.negativeClosingWithNeitherDisadvantage}));
}
const out={phase:'R5-b174',status:'PASS',track:'majoku-ring-v1',
 genuineChromiumRun:process.env.MWS_F1_RACE_ARTIFACT_RUN_ID?
 Number(process.env.MWS_F1_RACE_ARTIFACT_RUN_ID):null,
 readOnly:true,physicsModified:false,causalAiResourceFaultProven:false,
 anySafeCorridorProven:false,cases,
 note:'Resource advantage at exactly -20ms is an observed instantaneous comparison and is not proof that tyre or ERS triggered the terminal event.'};
fs.writeFileSync(dir+'b174-resource-relative-at-minus20.json',JSON.stringify(out,null,2));
