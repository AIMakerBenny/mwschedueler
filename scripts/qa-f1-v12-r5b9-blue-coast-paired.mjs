// R5-b9: controlled same-seed normal-race pit/no-pit comparison.
// The baseline uses unmodified real app source and natural automatic pits.
// Only the comparison browser intercepts one driver's automatic request;
// genuine vehicle physics/position/tyre wear are never overridden.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createF1PreviewServer} from './serve-f1-unified-v11-preview.mjs';
let chromium;
try{({chromium}=await import('playwright'))}
catch(e){
 if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw e;
 ({chromium}=createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'_resolve.cjs'))('playwright'));
}
const trackId='blue-coast-speedway-v1',target='r5b3-driver-3',seed=Number(process.env.MWS_R5B9_SEED||1);
assert([1,2].includes(seed),'Seed must be 1 or 2');
const iso=new Date(Date.UTC(2026,9,18,0,0,0,seed*1000)).toISOString();
const output='artifacts/f1-v12-r5b9-blue-coast-seed'+seed+'.json';
const anchor='  const plan=unifiedPitPlanV11(row,track);';
const patch=[
 "  if(String(v.id)===window.__r5b9Target&&plan.wear>.60&&plan.remainingLaps>=1.1&&window.__r5b9Eligibility===null){",
 "    const p={id:String(v.id),t:now,lap:row.s/unifiedStateV11.path.len,wear:plan.wear,",
 "     remainingLaps:plan.remainingLaps,decision:plan.decision,pitLossSeconds:plan.pitLossSeconds,",
 "     candidates:plan.candidates.map(c=>({...c}))};",
 "    window.__r5b9Eligibility=p;",
 "    if(window.__r5b9Compound){",
 "      const c=plan.candidates.find(c=>c.compound===window.__r5b9Compound);",
 "      window.__r5b9Forces.push({...p,compound:window.__r5b9Compound,modelBenefitSeconds:c?.benefit??null});",
 "      if(!requestPitStopV205(v.id,window.__r5b9Compound,'QA_ONLY_PAIRED_PIT'))",
 "       throw Error('Actual pit lifecycle declined browser-only intervention');",
 "    }",
 "  }",
 "  // Only QA: avoid the REAL autonomous request overriding MEDIUM/HARD",
 "  // with the planner default SOFT in the SAME accepted physics step.",
 "  // Null compound is the intentionally no-pit control.",
 "  if(String(v.id)===window.__r5b9Target)return;"
].join('\n')+'\n';
// R5-b17: QA-only probes of the final accepted unified solver command.
const r5b17BeforeAnchor='if(cmd.v>next){';
const r5b17AfterAnchor="cmd.reason='PREDICTED_TRAFFIC';changed=true;";
const r5b17AcceptedAnchor='  unifiedCompetitionRecordV12(simClockV192.simTimeMs,rows,cmds);';
const r5b17BeforePatch='\n        const __r5b17Before=cmd.v;';
const r5b17AfterPatch=[
 'if(window.__r5b17Capture&&String(me.id)===window.__r5b9Target){',
 ' cmd.__r5b17Limiter={peer:String(peer.id),peerState:String(peer.pit),ownState:String(me.pit),',
 '  gapMeters:gap,lateralGapMeters:deltaY,corridorMeters:physicalCorridor,',
 '  footprintMeters:footprint,responseReserveMeters:responseReserve,budgetMeters:budget,',
 '  safeNextKph:safeNext*3.6,physicalFloorKph:physicallyReachable*3.6,',
 '  beforeLimitKph:__r5b17Before*3.6,afterLimitKph:cmd.v*3.6,',
 '  peerCandidateKph:peerCmd.v*3.6,solveIteration:solve};',
 '}'
].join('\n');
const r5b17AcceptedPatch=[
 '  if(window.__r5b17Capture&&window.__r5b9Record){',
 '   const idx=rows.findIndex(r=>String(r.id)===window.__r5b9Target);',
 '   const observed=rows[idx],accepted=cmds[idx],progress=observed?.s/len;',
 '   if(accepted&&progress>=5.88&&progress<=6.14){',
 '    window.__r5b9Record.acceptedCauses.push({',
 '     t:simClockV192.simTimeMs/1000,progress,',
 '     speedKph:accepted.v*3.6,priorKph:observed.v*3.6,targetKph:accepted.target*3.6,',
 "     reason:accepted.reason,brake:accepted.brake,throttle:accepted.throttle,",
 "     pit:String(accepted.pit?.state||'TRACK'),limiter:accepted.__r5b17Limiter||null",
 '    });',
 '   }',
 '  }'
].join('\n')+'\n';
const server=createF1PreviewServer();
await new Promise(resolve=>server.listen(8868,'127.0.0.1',resolve));
let browser,result={phase:'R5-b9',status:'DIAGNOSTIC'};
async function oneRace(compound){
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 let routeCount=0;
 try{
  await page.addInitScript(({target,compound})=>{
   window.__r5b9Target=target;window.__r5b9Compound=compound;
   window.__r5b9Eligibility=null;window.__r5b9Forces=[];
   window.__r5b17Capture=compound===null;
  },{target,compound});
  await page.route('**/assets/f1-racing-v1.js*',async route=>{
   const upstream=await route.fetch(),js=await upstream.text();
   if(js.split(anchor).length!==2)throw Error('Pit model anchor missing or duplicated');
   for(const [name,probe] of [['before',r5b17BeforeAnchor],['after',r5b17AfterAnchor],
     ['accepted',r5b17AcceptedAnchor]])
    if(js.split(probe).length!==2)throw Error('R5-b17 '+name+' engine anchor missing or duplicated');
   routeCount++;
   const instrumented=js.replace(anchor,anchor+'\n'+patch)
    .replace(r5b17BeforeAnchor,r5b17BeforeAnchor+r5b17BeforePatch)
    .replace(r5b17AfterAnchor,r5b17AfterAnchor+'\n'+r5b17AfterPatch)
    .replace(r5b17AcceptedAnchor,r5b17AcceptedPatch+r5b17AcceptedAnchor);
   await route.fulfill({response:upstream,body:instrumented});
  });
  await page.goto('http://127.0.0.1:8868/',{waitUntil:'load'});
  await page.waitForFunction(()=>typeof window.mwsF1UnifiedV11Report==='function');
  assert.equal(routeCount,1,'Browser-only telemetry route absent');
  await page.waitForFunction(()=>document.getElementById('mwsLoginForm')?.dataset.mode==='admin');
  await page.locator('#mwsModePublic').click();await page.locator('#mwsLoginSubmit').click();
  await page.waitForFunction(()=>document.getElementById('mwsAccessGate').classList.contains('hidden'));
  const setup=await page.evaluate(({trackId,iso})=>{
   const contacts=Array.from({length:12},(_,i)=>({id:'r5b3-driver-'+i,name:'NORMAL Driver '+i,image:'',labels:['R5B3 NORMAL QA']}));
   window.mwsGetF1ContactsV181=()=>contacts;
   const section=document.getElementById('gameF1Racing');
   document.querySelectorAll('.section').forEach(n=>n.classList.toggle('active',n===section));
   window.mwsRenderF1RacingV180();window.mwsF1SelectTrackV186(trackId);
   for(const c of contacts)window.mwsF1ToggleDriverV181(c.id);
   window.mwsF1SetLapCountV260(10);
   const Original=window.Date;
   class FixedDate extends Original{
    constructor(...args){super(...(args.length?args:[iso]));}
    static now(){return Original.parse(iso);}
   }
   window.Date=FixedDate;
   let started;
   try{started=window.mwsF1StartRaceFromSetupV187('NORMAL')}
   finally{window.Date=Original;}
   const s=window.mwsF1GetActiveRaceSnapshotV187();
   return {started,createdAt:s?.createdAt,track:s?.trackId,laps:s?.totalLaps,mode:s?.raceMode};
  },{trackId,iso});
  assert.deepEqual(setup,{started:true,createdAt:iso,track:trackId,laps:10,mode:'NORMAL'});
  await page.waitForFunction(()=>window.mwsF1GetScreenStateV185()==='GRID');
  assert.equal(await page.evaluate(()=>window.mwsF1WaitGridRevealV273(20000)),true);
  const initial=await page.evaluate(()=>{
   const button=document.getElementById('f1RacingGridStartRecoveryM');
   if(!button)throw Error('Missing genuine GRID start');
   button.click();window.mwsF1PauseRaceMotionV189(false);
   const cars=window.mwsF1ComputeRaceStandingsV191().map(r=>r.vehicle),tyres={};
   for(const v of cars){
    const i=Number(String(v.id).split('-').at(-1)),c=i<6?'SOFT':i<9?'MEDIUM':'HARD';
    if(!window.mwsF1SetVehicleTyreCompoundV203(v.id,c))throw Error('Starting tyre fixture failed');
    tyres[String(v.id)]=c;
   }
   window.__r5b9Record={ticks:0,requested:new Set(),requests:[],samples:[],
    targetProgressTimes:[],targetPitEvents:[],targetLastState:'TRACK',trafficWaveFrames:[],acceptedCauses:[]};
   return {state:window.mwsF1GetScreenStateV185(),
    ms:window.mwsF1GetSimulationClockV192().simTimeMs,
    grid:cars.map(v=>String(v.id)),tyres};
  });
  assert.equal(initial.state,'RACE');assert.equal(initial.ms,0);
  assert.equal(initial.grid.length,12);
  let status='RACE',ticks=0;
  while(status==='RACE'&&ticks<70000){
   const step=await page.evaluate(size=>{
    const q=window.__r5b9Record;
    for(let i=0;i<size;i++){
     const ok=window.mwsF1SimulateRaceStepV192(20);q.ticks++;
     const vehicles=window.mwsF1ComputeRaceStandingsV191().map(r=>r.vehicle);
     const observed=vehicles.find(v=>String(v.id)==='r5b3-driver-3');
     if(!observed)throw Error('Missing experiment vehicle');
     const t=window.mwsF1GetSimulationClockV192().simTimeMs/1000;
     const p=Number(observed.raceProgress),phase=String(observed.pitState||'TRACK');
     if(q.ticks===1||q.ticks%10===0||phase!==q.targetLastState)
      q.targetProgressTimes.push([p,t]);
     if(phase!==q.targetLastState){
      q.targetPitEvents.push({from:q.targetLastState,to:phase,seconds:t,
       raceProgress:p,compound:observed.tyreCompound});
      q.targetLastState=phase;
     }
     // R5-b16 diagnostic: the no-pit target stopped on the MAIN track
     // in Blue Coast seed 2 while a many-car pit wave crossed 5.97-6.08.
     // Sample the existing accepted vehicle state at 0.2s intervals.
     // No AI decisions, lane coordinates or vehicle speeds are changed.
     if(window.__r5b9Compound===null&&q.ticks%10===0&&p>=5.88&&p<=6.14){
      const near=vehicles.filter(v=>
       Math.abs(Number(v.raceProgress)-p)<=.03).map(v=>({
       id:String(v.id),deltaLaps:Number(v.raceProgress)-p,
       speedKph:Number(v.speedKph),state:String(v.pitState||'TRACK'),
       lateralMeters:Number.isFinite(Number(v.unifiedYV11))?
        Number(v.unifiedYV11):null,
       headingRadians:Number.isFinite(Number(v.unifiedHeadingV11))?
        Number(v.unifiedHeadingV11):null
      })).sort((a,b)=>a.deltaLaps-b.deltaLaps);
      q.trafficWaveFrames.push({t,progress:p,speedKph:Number(observed.speedKph),
       targetState:phase,lateralMeters:Number(observed.unifiedYV11)||0,
       nearby:near,nearPitCount:near.filter(x=>x.state!=='TRACK').length,
       nearbyTrackSlowCount:near.filter(x=>x.state==='TRACK'&&x.speedKph<95).length,
       nearestTrackAhead:near.filter(x=>x.id!==String(observed.id)&&x.state==='TRACK'&&
        x.deltaLaps>=0).sort((a,b)=>a.deltaLaps-b.deltaLaps)[0]||null,
       nearestPitAhead:near.filter(x=>x.state!=='TRACK'&&
        x.deltaLaps>=0).sort((a,b)=>a.deltaLaps-b.deltaLaps)[0]||null});
     }
     for(const v of vehicles)if(v.pitRequested&&!q.requested.has(String(v.id))){
      q.requested.add(String(v.id));
      const p=window.mwsF1UnifiedV11Report().pit.find(p=>p.id===String(v.id))||null;
      q.requests.push({id:String(v.id),t:window.mwsF1GetSimulationClockV192().simTimeMs/1000,
       targetCompound:v.pitTargetCompound,requestReason:v.pitRequestReason,plan:p});
     }
     if(q.ticks%250===0)q.samples.push({tick:q.ticks,
      simSeconds:window.mwsF1GetSimulationClockV192().simTimeMs/1000,
      cars:vehicles.map(v=>({id:String(v.id),lap:v.raceProgress,wear:v.tyreWear,speedKph:v.speedKph,
       compound:v.tyreCompound,pitState:v.pitState,pitTargetCompound:v.pitTargetCompound}))
       .sort((a,b)=>a.id.localeCompare(b.id))});
     if(!ok||window.mwsF1GetScreenStateV185()!=='RACE')break;
    }
    return {ticks:q.ticks,status:window.mwsF1GetScreenStateV185()};
   },250);
   ticks=step.ticks;status=step.status;
  }
  const actual=await page.evaluate(()=>{
   const q=window.__r5b9Record,r=window.mwsF1GetRaceResultRecoveryG(),
    physics=window.mwsF1UnifiedV11Report(),
    tyres=new Map(window.mwsF1GetPitStatesV205().map(t=>[String(t.id),t]));
   const incidentTotals=window.mwsF1ComputeRaceStandingsV191().map(row=>row.vehicle).map(v=>({
    id:String(v.id),lockupCount:Number(v.lockupCount)||0,
    understeerCount:Number(v.understeerCount)||0,
    oversteerCount:Number(v.oversteerCount)||0,
    damage:Number(v.unifiedDamageV11)||0
   }));
   return {screen:window.mwsF1GetScreenStateV185(),incidentTotals,
    requests:q.requests,samples:q.samples,eligibility:window.__r5b9Eligibility,forces:window.__r5b9Forces||[],
    targetProgressTimes:q.targetProgressTimes,targetPitEvents:q.targetPitEvents,
     trafficWaveFrames:q.trafficWaveFrames,acceptedCauses:q.acceptedCauses,
    rows:(r?.rows||[]).map(v=>({id:v.contactId,rank:v.position,pits:v.pitStopCount,
     installedCompound:tyres.get(String(v.contactId))?.compound,
     finalPitTarget:tyres.get(String(v.contactId))?.targetCompound,
     finishMs:v.finishedAtSimMs,lapTimesMs:v.lapTimesMs})),
    invalid:physics.invalid,collisionStops:physics.collisionStops};
  });
  assert.deepEqual(errors,[]);
  assert.equal(actual.screen,'FINISHING');
  assert.equal(actual.rows.length,12);
  assert.equal(actual.collisionStops,0);
  assert.deepEqual(actual.invalid,[]);
  assert(actual.rows.every(r=>r.finishMs>0&&r.lapTimesMs?.length===10));
  return {mode:compound||'QA_ONLY_NO_PIT_CONTROL',initial,...actual};
 }finally{await page.close();}
}
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.MWS_CHROME_PATH||undefined,args:['--no-sandbox']});
 const baseline=await oneRace(null);
 const interventions=[];
 for(const compound of ['SOFT','MEDIUM','HARD'])interventions.push(await oneRace(compound));
 const b=baseline.rows.find(v=>v.id===target);
 assert.equal(b?.pits,0,'Browser-only no-pit control unexpectedly stopped');
 assert(baseline.eligibility?.wear>.60&&baseline.eligibility?.remainingLaps>=1.1,
  'No-pit control did not reach a real eligible high-wear decision');
 const interpolate=(samples,progress)=>{
  if(!Number.isFinite(progress))return null;
  for(let i=1;i<samples.length;i++){
   const [a,t0]=samples[i-1],[b,t1]=samples[i];
   if(b>a&&a<=progress&&progress<=b)
    return t0+(progress-a)*(t1-t0)/(b-a);
  }
  return null;
 };
 const traffic=baseline.trafficWaveFrames;
 const slowTraffic=traffic.filter(x=>x.targetState==='TRACK'&&x.speedKph<95);
 const stationary=traffic.filter(x=>x.targetState==='TRACK'&&x.speedKph<5);
 const pitWaveFrames=traffic.filter(x=>x.nearPitCount>=3&&x.nearbyTrackSlowCount>=2);
 const busiestPit=traffic.reduce((best,x)=>
  !best||x.nearPitCount>best.nearPitCount?x:best,null);
 const slowest=traffic.reduce((best,x)=>!best||x.speedKph<best.speedKph?x:best,null);
 const trafficWave={sampleCount:traffic.length,
  trackUnder95Seconds:slowTraffic.length*.2,
  trackUnder5Seconds:stationary.length*.2,
  pitWaveConcurrentSeconds:pitWaveFrames.length*.2,
  maxNearbyPitVehicles:busiestPit?.nearPitCount??0,
  minTargetSpeedKph:slowest?.speedKph??null,
  slowestSnapshot:slowest,pitWaveSnapshot:busiestPit,
  keyCaveat:'Observed proximity and speeds do not establish which AI/physical constraint caused braking; diagnostic for pit-lane/main-track interaction.',
  samplingSeconds:.2};
 assert(traffic.length>20&&traffic.every(x=>Number.isFinite(x.speedKph)&&
  x.nearby.some(y=>y.id===target)),
  'Missing matched-accepted-step Blue Coast traffic wave telemetry');
 // R5-b17: attributed, ACCEPTED unified-solver commands at 20ms resolution.
 // This records the actual binding peer when PREDICTED_TRAFFIC reduces speed,
 // not merely vehicles that happen to be nearby in the separate 0.2s snapshot.
 const acceptedCauses=baseline.acceptedCauses||[];
 const slowAccepted=acceptedCauses.filter(x=>x.pit==='TRACK'&&x.speedKph<95);
 const limitedSlow=slowAccepted.filter(x=>x.reason==='PREDICTED_TRAFFIC'&&x.limiter);
 const peerCounts=new Map();
 for(const frame of limitedSlow){
  const key=frame.limiter.peer+' ['+frame.limiter.peerState+']';
  peerCounts.set(key,(peerCounts.get(key)||0)+1);
 }
 const rootCauseTelemetry={
  sampleSeconds:.02,acceptedSteps:acceptedCauses.length,slowTrackSeconds:slowAccepted.length*.02,
  predictedTrafficLimitedSlowSeconds:limitedSlow.length*.02,
  lowTargetSlowSeconds:slowAccepted.filter(x=>x.targetKph<95).length*.02,
  unboundSlowSeconds:slowAccepted.filter(x=>x.reason!=='PREDICTED_TRAFFIC').length*.02,
  limitingPeers:[...peerCounts].sort((a,b)=>b[1]-a[1]).map(([peer,steps])=>({peer,steps,seconds:steps*.02})),
  firstConstrainedSlow:limitedSlow[0]||null,
  slowestAccepted:slowAccepted.reduce((best,x)=>!best||x.speedKph<best.speedKph?x:best,null),
  caveat:'Accepted solver command and last binding peer only; cause of that peer slowdown, tyre wear and other simultaneous limits remain separate questions.'
 };
 assert(acceptedCauses.length>20&&acceptedCauses.every(x=>
  Number.isFinite(x.speedKph)&&Number.isFinite(x.priorKph)&&Number.isFinite(x.targetKph)),
  'R5-b17 accepted 20ms solver-command evidence missing or invalid');
 const comparisons=interventions.map(run=>{
  const v=run.rows.find(v=>v.id===target),event=run.forces[0];
  const cutoff=Math.min(baseline.eligibility.t,run.eligibility?.t||0);
  const prior=baseline.samples.filter(z=>z.simSeconds<cutoff),lookup=new Map(run.samples.map(z=>[z.tick,z]));
  const mismatch=prior.find(z=>JSON.stringify(z.cars)!==JSON.stringify(lookup.get(z.tick)?.cars));
  const lapDeltaSeconds=b.lapTimesMs.map((ms,i)=>(ms-v.lapTimesMs[i])/1000);
  const incidentKeys=['lockupCount','understeerCount','oversteerCount'];
  const noPitIncidents=baseline.incidentTotals.find(x=>x.id===target);
  const pitIncidents=run.incidentTotals.find(x=>x.id===target);
  const entered=run.targetPitEvents.find(e=>e.from==='TRACK'&&
   (e.to==='PIT_ENTRY'||e.to==='PIT_LANE'));
  const rejoined=run.targetPitEvents.find(e=>e.from==='PIT_EXIT'&&e.to==='TRACK');
  const atRequest=interpolate(baseline.targetProgressTimes,run.eligibility?.lap);
  const atRejoin=interpolate(baseline.targetProgressTimes,rejoined?.raceProgress);
  const driverElapsed=rejoined?rejoined.seconds-run.eligibility.t:null;
  const baselineElapsed=Number.isFinite(atRequest)&&Number.isFinite(atRejoin)?
   atRejoin-atRequest:null;
  const intervalOverhead=Number.isFinite(driverElapsed)&&Number.isFinite(baselineElapsed)?
   driverElapsed-baselineElapsed:null;
  // R5-b15: compare the SAME driver, track segment and initial tyre in
  // earlier accepted laps before this driver's high-wear decision. This
  // measures a late-stint main-track slowdown, NOT its pure traffic cause.
  // On a circuit the pit exit crosses the next lap, so keep phase relative
  // to the specific pit-entry and rejoin progress and shift both together.
  const referenceSegmentSeconds=[];
  if(entered&&rejoined){
   const beginFraction=entered.raceProgress-Math.floor(entered.raceProgress);
   const endRelative=rejoined.raceProgress-Math.floor(entered.raceProgress);
   for(const priorLap of [1,2,3]){
    const begin=priorLap+beginFraction,end=priorLap+endRelative;
    if(end>=run.eligibility.lap)continue;
    const first=interpolate(baseline.targetProgressTimes,begin);
    const last=interpolate(baseline.targetProgressTimes,end);
    if(Number.isFinite(first)&&Number.isFinite(last)&&last>first)
     referenceSegmentSeconds.push(last-first);
   }
  }
  const sortedReference=[...referenceSegmentSeconds].sort((a,b)=>a-b);
  const medianReference=sortedReference.length?
   sortedReference[Math.floor(sortedReference.length/2)]:null;
  const baselinePitLaneDistanceSeconds=entered&&rejoined?
   interpolate(baseline.targetProgressTimes,rejoined.raceProgress)-
   interpolate(baseline.targetProgressTimes,entered.raceProgress):null;
  const pitDriverPitLaneDistanceSeconds=entered&&rejoined?
   rejoined.seconds-entered.seconds:null;
  const baselineSlowdownVsEarlier=Number.isFinite(medianReference)&&
   Number.isFinite(baselinePitLaneDistanceSeconds)?
   baselinePitLaneDistanceSeconds-medianReference:null;
  const approachNoPit=entered?interpolate(baseline.targetProgressTimes,entered.raceProgress)-
   atRequest:null;
  const approachPit=entered?entered.seconds-run.eligibility.t:null;
  return {compound:run.mode,gridMatch:JSON.stringify(baseline.initial.grid)===JSON.stringify(run.initial.grid),
   tyreMatch:JSON.stringify(baseline.initial.tyres)===JSON.stringify(run.initial.tyres),
   beforeDecisionSamples:prior.length,firstMismatchTick:mismatch?.tick??null,
   decisionDeltaSeconds:Math.abs(baseline.eligibility.t-run.eligibility.t),
   interventionCount:run.forces.length,completedPitStops:v?.pits,
   actualRequestedCompound:run.requests.find(x=>x.id===target)?.targetCompound??null,
   finalInstalledCompound:v?.installedCompound??null,finalPitTarget:v?.finalPitTarget??null,
   modelBenefitSeconds:event?.modelBenefitSeconds??null,
   pairedFinishBenefitSeconds:(b.finishMs-v?.finishMs)/1000,
   baselineRank:b.rank,interventionRank:v?.rank,
   baselineFinishSeconds:b.finishMs/1000,interventionFinishSeconds:v?.finishMs/1000,
   interventionLapTimesMs:v?.lapTimesMs,
   noPitLapTimesMs:b.lapTimesMs,
   perLapBenefitSeconds:lapDeltaSeconds,
   grossRecoveryLapSeconds:lapDeltaSeconds.reduce((sum,delta)=>sum+Math.max(0,delta),0),
   grossPitCostLapSeconds:lapDeltaSeconds.reduce((sum,delta)=>sum+Math.min(0,delta),0),
   perLapSumSeconds:lapDeltaSeconds.reduce((sum,delta)=>sum+delta,0),
   signedModelResidualSeconds:(b.finishMs-v.finishMs)/1000-(event?.modelBenefitSeconds??0),
   incidentTotals:{noPit:noPitIncidents,pit:pitIncidents,
    noPitMinusPit:Object.fromEntries(incidentKeys.map(key=>
     [key,(noPitIncidents?.[key]??0)-(pitIncidents?.[key]??0)]))},
   pitInterval:{entered:entered||null,rejoined:rejoined||null,
    pitDriverElapsedSeconds:driverElapsed,
    noPitSameDistanceSeconds:baselineElapsed,
    matchedDistanceOverheadSeconds:intervalOverhead,
    modelPitCostSeconds:baseline.eligibility?.pitLossSeconds??null,
    observedMinusModelCostSeconds:Number.isFinite(intervalOverhead)?
     intervalOverhead-baseline.eligibility.pitLossSeconds:null,
    requestToPitEntry:{noPitSameProgressSeconds:approachNoPit,
     pitCarElapsedSeconds:approachPit,
     deltaSeconds:Number.isFinite(approachNoPit)&&Number.isFinite(approachPit)?
      approachPit-approachNoPit:null},
    pitEntryToRejoin:{noPitSameProgressSeconds:baselinePitLaneDistanceSeconds,
     pitCarElapsedSeconds:pitDriverPitLaneDistanceSeconds,
     deltaSeconds:Number.isFinite(baselinePitLaneDistanceSeconds)&&
      Number.isFinite(pitDriverPitLaneDistanceSeconds)?
      pitDriverPitLaneDistanceSeconds-baselinePitLaneDistanceSeconds:null},
    noPitEarlierSameSegmentSeconds:referenceSegmentSeconds,
    noPitEarlierSegmentMedianSeconds:medianReference,
    noPitCurrentSegmentExtraSeconds:baselineSlowdownVsEarlier,
    modelResidualSeconds:(b.finishMs-v.finishMs)/1000-(event?.modelBenefitSeconds??0),
    caveat:'All gaps include wear, traffic, incidents and tyre recovery. Prior laps establish a within-driver pace reference, NOT a causal estimate of traffic delay or mechanical pit cost'}};
 });
 result={phase:'R5-b9',status:'DIAGNOSTIC',trackId,seed,target,
  firstEligibleModel:baseline.eligibility,trafficWave,rootCauseTelemetry,comparisons,baseline,interventions,
  interpretation:'Browser-only no-pit control vs forced real SOFT/MEDIUM/HARD pit lifecycle. Traffic feedback remains; real engine physics unchanged. Separately calibrated real-game autonomous forecast is measured by its independent full-race QA.'};
 for(const q of comparisons){
  assert(q.gridMatch&&q.tyreMatch&&q.beforeDecisionSamples>=10&&q.firstMismatchTick===null,
   'Pre-intervention mismatch '+q.compound);
  assert(q.decisionDeltaSeconds<=.04&&q.interventionCount===1&&q.completedPitStops===1,
   'Full real pit lifecycle or decision timing mismatch '+q.compound);
  assert(q.actualRequestedCompound===q.compound&&q.finalPitTarget===q.compound&&
   q.finalInstalledCompound===q.compound,
   'TEST INVALID: pit selection was overwritten or wrong compound fitted '+JSON.stringify(q));
  assert(Number.isFinite(q.modelBenefitSeconds)&&Number.isFinite(q.pairedFinishBenefitSeconds),
   'Missing paired cost/forecast '+q.compound);
  assert(q.perLapBenefitSeconds.length===10&&q.perLapBenefitSeconds.every(Number.isFinite),
   'Missing per-lap actual finish evidence '+q.compound);
  assert(Math.abs(q.perLapSumSeconds-q.pairedFinishBenefitSeconds)<.05,
   'Per-lap and full-race finish benefits do not reconcile '+q.compound);
  assert(q.grossPitCostLapSeconds<0&&q.grossRecoveryLapSeconds>0,
   'Actual pit-cost and post-pit recovery evidence incomplete '+q.compound);
  assert(q.incidentTotals.noPit&&q.incidentTotals.pit&&
   Object.values(q.incidentTotals.noPitMinusPit).every(Number.isFinite),
   'Missing actual on-vehicle incident evidence '+q.compound);
  assert(q.pitInterval.entered&&q.pitInterval.rejoined&&
   Number.isFinite(q.pitInterval.matchedDistanceOverheadSeconds)&&
   Number.isFinite(q.pitInterval.modelPitCostSeconds),
   'Missing observed matched-distance pit time '+q.compound);
  assert(q.pitInterval.noPitEarlierSameSegmentSeconds.length>=2&&
   Number.isFinite(q.pitInterval.noPitEarlierSegmentMedianSeconds)&&
   Number.isFinite(q.pitInterval.noPitCurrentSegmentExtraSeconds),
   'Missing early-lap same-distance pace reference '+q.compound);
  const approach=q.pitInterval.requestToPitEntry.deltaSeconds;
  const pitLane=q.pitInterval.pitEntryToRejoin.deltaSeconds;
  assert(Number.isFinite(approach)&&Number.isFinite(pitLane)&&
   Math.abs(approach+pitLane-q.pitInterval.matchedDistanceOverheadSeconds)<.1,
   'Matched-distance pit loss must reconcile approach and pit-lane segments '+q.compound);
 }
 // Compare actual completed races, never nominal requested compound labels.
 assert(new Set(comparisons.map(x=>x.interventionFinishSeconds.toFixed(4))).size>=2,
  'TEST INVALID: three compounds gave identical finish times');
 result.status='PASS';
}catch(error){result.status='FAIL';result.error=String(error?.stack||error)}
finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
 fs.mkdirSync('artifacts',{recursive:true});
 fs.writeFileSync(output,JSON.stringify(result,null,2));
 console.log(JSON.stringify({phase:'R5-b9',seed,status:result.status,
  comparisons:result.comparisons?.map(x=>({compound:x.compound,
   fitted:x.finalInstalledCompound,forecast:x.modelBenefitSeconds,
   observed:x.pairedFinishBenefitSeconds,rank:x.interventionRank})),
  trafficWave:result.trafficWave&&{
   under95Seconds:result.trafficWave.trackUnder95Seconds,
   stoppedSeconds:result.trafficWave.trackUnder5Seconds,
   pitWaveConcurrentSeconds:result.trafficWave.pitWaveConcurrentSeconds,
   maxNearbyPitVehicles:result.trafficWave.maxNearbyPitVehicles,
   minTargetSpeedKph:result.trafficWave.minTargetSpeedKph},
  acceptedSolver:result.rootCauseTelemetry&&{
   acceptedSteps:result.rootCauseTelemetry.acceptedSteps,
   slowTrackSeconds:result.rootCauseTelemetry.slowTrackSeconds,
   predictedTrafficLimitedSlowSeconds:result.rootCauseTelemetry.predictedTrafficLimitedSlowSeconds,
   lowTargetSlowSeconds:result.rootCauseTelemetry.lowTargetSlowSeconds,
   limitingPeers:result.rootCauseTelemetry.limitingPeers.slice(0,6),
   slowestAccepted:result.rootCauseTelemetry.slowestAccepted},
  pairedResiduals:result.comparisons?.map(x=>({compound:x.compound,
   residual:x.signedModelResidualSeconds,
   grossRecovery:x.grossRecoveryLapSeconds,
   pitCost:x.grossPitCostLapSeconds,
   incidents:x.incidentTotals.noPitMinusPit,
   pitSegment:x.pitInterval.matchedDistanceOverheadSeconds,
   predictedPitCost:x.pitInterval.modelPitCostSeconds,
   noPitCurrentSegmentExtraVsEarlier:x.pitInterval.noPitCurrentSegmentExtraSeconds,
   approachSegment:x.pitInterval.requestToPitEntry.deltaSeconds,
   pitLaneSegment:x.pitInterval.pitEntryToRejoin.deltaSeconds})),
  error:result.error||null,artifact:output}));
}
assert.equal(result.status,'PASS',result.error||'Paired Chromium comparison failed');
