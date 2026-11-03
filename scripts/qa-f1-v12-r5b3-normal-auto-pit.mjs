// R5-b3: genuine FULL NORMAL race and autonomous-pit economics audit.
// The real app/Chromium controls the production unified solver and V205 pit lifecycle.
// NO manual pit requests, forced wear, forced finish or rank changes.
// Starting compounds are explicitly set as grid fixtures: 6 SOFT, 3 MEDIUM, 3 HARD.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createF1PreviewServer} from './serve-f1-unified-v11-preview.mjs';
let chromium;
try {({chromium}=await import('playwright'));}
catch(error){
 if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw error;
 ({chromium}=createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'_resolve.cjs'))('playwright'));
}
const port=Number(process.env.MWS_R5B3_PORT)||8783;
const trackId=String(process.env.MWS_R5B3_TRACK||'castle-street-circuit-v1');
const maxTicks=Math.max(30000,Math.min(85000,Number(process.env.MWS_R5B3_MAX_TICKS)||70000));
const seedId=String(process.env.MWS_R5B3_SEED||'');
const output=String(process.env.MWS_R5B3_OUTPUT||'artifacts/f1-v12-r5b3-normal-auto-pit.json');
// R5-b50/R5-b51: explicit browser-only matched pace experiment. Never
// override live application code, standings, rank, collision or pit logic.
const profileScenario=String(process.env.MWS_R5B3_PROFILE_SCENARIO||'NATURAL');
const probeReal20ms=process.env.MWS_R5B3_REAL_20MS_PROBE==='1';
if(probeReal20ms)assert(trackId==='majoku-ring-v1'&&profileScenario==='NATURAL',
 'R5-b76 20ms real-grid probe must be natural Majoku Ring only');
assert(['NATURAL','EQUAL_PACE_75','EQUAL_STRATEGY_BALANCED'].includes(profileScenario));
assert(profileScenario==='NATURAL'||trackId==='majoku-ring-v1',
 'Profile comparisons are strictly Majoku Ring only');
// A fixed setup timestamp seeds the app's existing random grid, driver profiles,
// unified solver, pressure and special RNG. Restore Date immediately after setup.
const seededIso=seedId?/^[1-9][0-9]*$/.test(seedId)?new Date(Date.UTC(2026,9,18,0,0,0,Number(seedId)*1000)).toISOString():(()=>{throw Error('MWS_R5B3_SEED must be a positive integer')})():null;
const server=createF1PreviewServer();
await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
let browser,observation=null;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.MWS_CHROME_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
 await page.addInitScript(()=>{window.__MWS_F1_INTERNAL_QA_V348=true});
 // R5-b138: inject pure read-only QA snapshot functions. None can
 // replace the production physics engine, AI decisions or input commands.
 if(probeReal20ms){
  const source=fs.readFileSync('scripts/lib/f1-r5b137-attempt-context.mjs','utf8');
  await page.addInitScript({content:source.replace(/^export /gm,'')+
   '\nwindow.__mwsR5b137={snapshotAttemptContextFrame,deriveExactAttackStartWitness};'});
 }
 await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'load'});
 await page.waitForFunction(()=>typeof window.mwsF1UnifiedV11Report==='function');
 await page.waitForFunction(()=>document.getElementById('mwsLoginForm')?.dataset.mode==='admin');
 await page.locator('#mwsModePublic').click();
 await page.locator('#mwsLoginSubmit').click();
 await page.waitForFunction(()=>document.getElementById('mwsAccessGate').classList.contains('hidden'));
 const initial=await page.evaluate(({trackId,seededIso})=>{
  const contacts=Array.from({length:12},(_,i)=>({id:'r5b3-driver-'+i,name:'NORMAL Driver '+i,image:'',labels:['R5B3 NORMAL QA']}));
  window.mwsGetF1ContactsV181=()=>contacts;
  const section=document.getElementById('gameF1Racing');
  document.querySelectorAll('.section').forEach(node=>node.classList.toggle('active',node===section));
  window.mwsRenderF1RacingV180();
  window.mwsF1SelectTrackV186(trackId);
  for(const c of contacts)window.mwsF1ToggleDriverV181(c.id);
  window.mwsF1SetLapCountV260(10);
  const OriginalDate=window.Date;
  let started=false;
  if(seededIso){
   class SeededSetupDate extends OriginalDate{
    constructor(...args){super(...(args.length?args:[seededIso]))}
    static now(){return OriginalDate.parse(seededIso)}
   }
   window.Date=SeededSetupDate;
  }
  try{started=window.mwsF1StartRaceFromSetupV187('NORMAL')}
  finally{window.Date=OriginalDate}
  return {started,createdAt:window.mwsF1GetActiveRaceSnapshotV187()?.createdAt,
   tracks:window.mwsF1GetTrackCatalogV186().length,
   drivers:window.mwsF1GetSelectedContactIdsV181().length,
   laps:window.mwsF1GetActiveRaceSnapshotV187()?.totalLaps,
   mode:window.mwsF1GetActiveRaceSnapshotV187()?.raceMode,
   track:window.mwsF1GetActiveRaceSnapshotV187()?.trackId};
 },{trackId,seededIso});
 assert(initial.started&&initial.drivers===12&&initial.tracks===7,JSON.stringify(initial));
 if(seededIso)assert.equal(initial.createdAt,seededIso,'QA fixed setup seed was not applied');
 assert.deepEqual({track:initial.track,laps:initial.laps,mode:initial.mode},{track:trackId,laps:10,mode:'NORMAL'});
 await page.waitForFunction(()=>window.mwsF1GetScreenStateV185()==='GRID');
 assert.equal(await page.evaluate(()=>window.mwsF1WaitGridRevealV273(20000)),true);
 // Begin the genuine GRID race in one JS task and disable only RAF before
 // its first callback. A separate Playwright click/wait previously allowed
 // 300-400ms of scheduler-dependent pre-roll despite a fixed setup seed.
 const startClock=await page.evaluate(()=>{
  const button=document.getElementById('f1RacingGridStartRecoveryM');
  if(!button)throw Error('Missing official start button');
  button.click();
  window.mwsF1PauseRaceMotionV189(false);
  return {state:window.mwsF1GetScreenStateV185(),ms:window.mwsF1GetSimulationClockV192().simTimeMs};
 });
 assert.equal(startClock.state,'RACE');
 assert.equal(startClock.ms,0,'Race advanced before 20ms QA stepping');
 const start=await page.evaluate(({scenario,probe})=>{
  window.mwsF1PauseRaceMotionV189(false); // disables only RAF; public 20ms integrator is unchanged
  const vehicles=window.mwsF1ComputeRaceStandingsV191().map(r=>r.vehicle);
  const startingCompounds={};
  const originalProfiles=Object.fromEntries(vehicles.map(v=>[String(v.id),{...v.driverProfile}]));
  if(scenario==='EQUAL_PACE_75')for(const v of vehicles){
   // Browser-only, controlled intervention before the first accepted 20ms step.
   // All other driver ratings, seeded grid, tyre physics and AI remain unchanged.
   v.driverProfile=Object.freeze({...v.driverProfile,pace:75});
  }
  const appliedProfiles=Object.fromEntries(vehicles.map(v=>[String(v.id),{...v.driverProfile}]));
  for(const v of vehicles){
   const i=Number(String(v.id).split('-').at(-1));
   const compound=i<6?'SOFT':i<9?'MEDIUM':'HARD';
   if(!window.mwsF1SetVehicleTyreCompoundV203(v.id,compound))throw Error('Initial compound failed');
   startingCompounds[String(v.id)]=compound;
  }
  window.__mwsR5b3={
   ticks:0,startingCompounds,originalProfiles,appliedProfiles,profileScenario:scenario,
   originalStrategies:{},appliedStrategies:{},strategyInterventionAtMs:null,
   events:[],requests:[],strategySamples:[],pitTransitions:[],
   lastPit:new Map(vehicles.map(v=>[String(v.id),String(v.pitState||'TRACK')])),
   real20ms:probe?{acceptedFrames:0,frontFrames:0,closeFasterFrames:0,
    followCloseFaster:0,planAttackCloseFaster:0,corridorCandidateFrames:0,
    blockedFrames:0,streak400ms:0,maxStreakFrames:0,
    followCandidateUnblockedFrames:0,followCandidateBlockedFrames:0,
    followWithoutCandidateFrames:0,attackPlannedUnblockedFrames:0,
    candidateUnblocked400msEpisodes:0,candidateUnblockedLongestFrames:0,
    candidateUnblocked400msSamples:[],candidateFrameWindow:[],lastManualSampleMs:0,clockGapEvents:0,
    candidateLastPair:'',candidateLastTick:-2,candidateStreak:0,
    corridorCandidatesNotClearance:true,
    lastPair:'',lastTick:-2,streak:0,examples:[],firstGridGap:null,
    first90EndGap:null,trafficWindows:[],lastTrafficByDriver:{},
    lastTrafficTotal:0}:null,
   // R5-b121: QA-only ledger. Never edits the live AI/physics state.
   attemptQa:probe?{events:[],lastEventKey:null,totalStarts:0,
    missingOverlap:false,probes:0,frameHistory:[],
    startWitnesses:[],missingWitnesses:[]}:null,
   everRequested:new Set(),finishEvents:[],finished:new Set(),continuityErrors:[],
   initialOrder:vehicles.map(v=>String(v.id)),finishBoundary:null,rejectedStep:null,plannedPitViolations:[]};
  // R5-b121: sample the engine's existing bounded event ledger every 250
  // manual accepted physics calls, retaining earlier entries even if the
  // engine's 2,048-event ring eventually rolls over.
  window.__mwsR5b121CopyAttemptLedger=probe?function(){
   const q=window.__mwsR5b3,c=q.attemptQa;
   const report=window.mwsF1UnifiedV11Report().attackLedger;
   if(!report||!Array.isArray(report.events))throw Error('ATTACK_LEDGER_UNAVAILABLE');
   const events=report.events;
   let start=0;
   if(c.lastEventKey!==null){
    const i=events.findLastIndex(e=>JSON.stringify(e)===c.lastEventKey);
    if(i<0){c.missingOverlap=true;throw Error('ATTACK_LEDGER_TRUNCATED_BETWEEN_SAMPLES')}
    start=i+1;
   }
   const newlySeen=events.slice(start);
   c.events.push(...newlySeen);
   for(const event of newlySeen){
    if(event.type!=='START')continue;
    const frame=c.frameHistory.find(x=>x.ms===event.ms);
    if(!frame){
     c.missingWitnesses.push({attemptId:event.attemptId,ms:event.ms,
      reason:'EXACT_ACCEPTED_20MS_FRAME_NOT_FOUND'});
     continue;
    }
    c.startWitnesses.push(window.__mwsR5b137.deriveExactAttackStartWitness(event,frame));
   }
   if(events.length)c.lastEventKey=JSON.stringify(events.at(-1));
   c.totalStarts=report.totalStarts;
   c.probes++;
  }:null;
  return {drivers:vehicles.length,compounds:startingCompounds,screen:window.mwsF1GetScreenStateV185(),
    profile:window.mwsF1QaDriverProfileMarkersV250().allPass};
 },{scenario:profileScenario,probe:probeReal20ms});
 assert(start.profile&&start.drivers===12&&start.screen==='RACE');
 let state='RACE',ticks=0;
 while(state==='RACE'&&ticks<maxTicks){
  const batch=await page.evaluate((batchSize)=>{
   const q=window.__mwsR5b3,standings=()=>window.mwsF1ComputeRaceStandingsV191(),
    seconds=()=>window.mwsF1GetSimulationClockV192().simTimeMs/1000;
   for(let n=0;n<batchSize;n++){
    const cars=standings().map(r=>r.vehicle);
    const old=new Map(cars.map(v=>[String(v.id),{progress:Number(v.raceProgress)||0,
      path:Number(v.unifiedPathDistanceV11)||0,speed:Number(v.speedKph)||0,finished:!!v.finished}]));
    const accepted=window.mwsF1SimulateRaceStepV192(20);q.ticks++;
    const active=standings().map(r=>r.vehicle),time=seconds(),totalLaps=window.mwsF1GetActiveRaceSnapshotV187().totalLaps;
    // R5-b138: record each genuine committed 20ms frame, not a delayed
    // five-second strategy sample. Keep only the latest 270 frames in memory.
    if(accepted&&q.attemptQa){
     const c=q.attemptQa,clockMs=window.mwsF1GetSimulationClockV192().simTimeMs;
     const lengthMeters=window.mwsF1GetActiveRaceSnapshotV187().track.lengthMeters;
     c.frameHistory.push(window.__mwsR5b137.snapshotAttemptContextFrame(
      clockMs,lengthMeters,active));
     if(c.frameHistory.length>270)c.frameHistory.shift();
    }
    // R5-b52: only after the first genuine 20ms solver acceptance, record
    // assigned strategies for every scenario. Optional experimental balancing
    // changes only style names in the browser harness, never game source.
    if(accepted&&q.ticks===1){
     for(const v of active){
      const id=String(v.id),original=String(v.unifiedStrategyV12||'');
      if(!['FRONTRUNNER','BALANCED','CHASER','CLOSER'].includes(original))
       throw Error('No actual strategy assigned after first accepted step: '+id);
      q.originalStrategies[id]=original;
      if(q.profileScenario==='EQUAL_STRATEGY_BALANCED')
       v.unifiedStrategyV12='BALANCED';
      q.appliedStrategies[id]=String(v.unifiedStrategyV12);
     }
     if(q.profileScenario==='EQUAL_STRATEGY_BALANCED')
      q.strategyInterventionAtMs=window.mwsF1GetSimulationClockV192().simTimeMs;
    }
    // R5-b76: read-only top-pair telemetry after an accepted genuine 20ms
    // physical step, with the original seeded start, driver profiles and pit.
    if(q.real20ms&&accepted&&time<=90.001){
     const p=q.real20ms,a=active[0],b=active[1];
     const acceptedSimMs=Math.round(time*1000);
     if(p.lastManualSampleMs&&acceptedSimMs-p.lastManualSampleMs>21){
      p.clockGapEvents++;
      p.streak=0;p.lastTick=-2;p.lastPair='';
      p.candidateStreak=0;p.candidateLastTick=-2;p.candidateLastPair='';
      p.candidateFrameWindow=[];
     }
     p.lastManualSampleMs=acceptedSimMs;
     p.acceptedFrames++;
     const gap=(Number(a.raceProgress)-Number(b.raceProgress))*
      window.mwsF1GetActiveRaceSnapshotV187().track.lengthMeters;
     if(p.firstGridGap===null)p.firstGridGap=gap;
     p.first90EndGap=gap;
     if(!a.finished&&!b.finished&&
      String(a.pitState||'TRACK')==='TRACK'&&String(b.pitState||'TRACK')){
      p.frontFrames++;
      const fast=(Number(b.speedKph)-Number(a.speedKph))/3.6>2;
      if(gap>0&&gap<=70&&fast){
       p.closeFasterFrames++;
       const mode=String(b.unifiedAiStateV11||''),pair=String(a.id)+'|'+String(b.id);
       const attemptedCandidates=(Number(b.unifiedCorridorCountV12)||0)>0;
       const blocked=(b.unifiedMergeBlockedV11?.length||0)>0;
       if(attemptedCandidates)p.corridorCandidateFrames++;
       if(blocked)p.blockedFrames++;
       if(mode==='PLAN_ATTACK'){
        p.planAttackCloseFaster++;
        if(!blocked)p.attackPlannedUnblockedFrames++;
       }
       if(mode==='FOLLOW'){
        if(!attemptedCandidates)p.followWithoutCandidateFrames++;
        else if(blocked)p.followCandidateBlockedFrames++;
        else p.followCandidateUnblockedFrames++;
        if(attemptedCandidates&&!blocked){
         p.candidateStreak=p.candidateLastPair===pair&&p.candidateLastTick===q.ticks-1?
          p.candidateStreak+1:1;
         p.candidateLastPair=pair;p.candidateLastTick=q.ticks;
         // R5-b86: record the last 20 genuine accepted steps, not only
         // the final step of an alleged uninterrupted 400ms FOLLOW span.
         p.candidateFrameWindow.push({
          tick:q.ticks,leaderId:String(a.id),followerId:String(b.id),
          aiState:mode,candidateCount:Number(b.unifiedCorridorCountV12)||0,
          mergeBlockers:b.unifiedMergeBlockedV11?.length||0,
          gapMeters:gap,relativeSpeedMps:(Number(b.speedKph)-Number(a.speedKph))/3.6,
          simTimeMs:acceptedSimMs
         });
         if(p.candidateFrameWindow.length>20)p.candidateFrameWindow.shift();
         p.candidateUnblockedLongestFrames=Math.max(p.candidateUnblockedLongestFrames,p.candidateStreak);
         if(p.candidateStreak===20){
          p.candidateUnblocked400msEpisodes++;
          // R5-b85: witness only. No reported merge blocker is not physical clearance.
          p.candidateUnblocked400msSamples.push({
           firstFrameTick:q.ticks-19,lastFrameTick:q.ticks,
           physicsStepMs:20,consecutiveFrames:20,
           leaderId:String(a.id),followerId:String(b.id),
           endSimMs:Math.round(time*1000),gapMeters:gap,
           relativeSpeedMps:(Number(b.speedKph)-Number(a.speedKph))/3.6,
           aiState:mode,candidateCount:Number(b.unifiedCorridorCountV12)||0,
           reportedMergeBlockers:b.unifiedMergeBlockedV11?.length||0,
           sweptClearanceProven:false,mergeReservationClearanceProven:false,
           consecutive20msFrames:p.candidateFrameWindow.map(frame=>({...frame}))
          });
         }
        }else{p.candidateStreak=0;p.candidateLastTick=-2;p.candidateLastPair='';p.candidateFrameWindow=[];}
        p.followCloseFaster++;
        p.streak=(p.lastPair===pair&&p.lastTick===q.ticks-1)?p.streak+1:1;
        p.lastPair=pair;p.lastTick=q.ticks;
        p.maxStreakFrames=Math.max(p.maxStreakFrames,p.streak);
        if(p.streak===20)p.streak400ms++;
       }else{p.streak=0;p.lastTick=-2;
        p.candidateStreak=0;p.candidateLastTick=-2;p.candidateLastPair='';p.candidateFrameWindow=[];}
       if(p.examples.length<80&&(q.ticks%150===0||p.streak===20))
        p.examples.push({ms:time*1000,leader:String(a.id),follower:String(b.id),
         gapMeters:gap,relativeMps:(b.speedKph-a.speedKph)/3.6,
         mode,candidates:Number(b.unifiedCorridorCountV12)||0,
         mergeBlockers:b.unifiedMergeBlockedV11?.length||0,
         nextDecisionInMs:Math.max(0,(Number(b.unifiedAiAtV11)||0)*1000-time*1000)});
      }else{p.streak=0;p.lastTick=-2;p.lastPair='';
       p.candidateStreak=0;p.candidateLastTick=-2;p.candidateLastPair='';p.candidateFrameWindow=[];}
     }else{p.streak=0;p.lastTick=-2;p.lastPair='';
      p.candidateStreak=0;p.candidateLastTick=-2;p.candidateLastPair='';p.candidateFrameWindow=[];}
    }
    for(const v of active){
     const id=String(v.id),previous=q.lastPit.get(id)||'TRACK',current=String(v.pitState||'TRACK');
     if(v.pitRequested&&!q.everRequested.has(id)){
      q.everRequested.add(id);
      const read=window.mwsF1GetPitStrategyStatesV206().find(x=>String(x.id)===id);
      const item={id,time,lap:Number(v.raceProgress)||0,remainingLaps:totalLaps-v.raceProgress,
       wear:Number(v.tyreWear)||0,from:v.tyreCompound,to:v.pitTargetCompound,
       reason:String(v.pitRequestReason||''),readReason:read?.reason||'',benefit:read?.context?.benefit??null,
       pitLossSeconds:read?.context?.pitLossSeconds??null,
       recordedPlan:window.mwsF1UnifiedV11Report().pit.find(x=>String(x.id)===id)||null};
      q.requests.push(item);
      if(item.wear<=.6||item.remainingLaps<1.1||item.reason!=='UNIFIED_V11_TIME_ADVANTAGE'
        ||!item.recordedPlan||!(item.recordedPlan.benefit>1.5))q.plannedPitViolations.push(item);
     }
     if(current!==previous){
      q.pitTransitions.push({id,from:previous,to:current,time,lap:v.raceProgress,
       compound:v.tyreCompound,stopCount:v.pitStopCount,wear:v.tyreWear,speedKph:v.speedKph,
        pitEntryRaceProgress:Number.isFinite(v.pitEntryRaceProgress)?v.pitEntryRaceProgress:null,
        pitSpeedLimitKph:Number(window.mwsF1GetActiveRaceSnapshotV187()?.track?.pit?.speedLimitKph)||80});
      q.lastPit.set(id,current);
     }
     if(v.finished&&!q.finished.has(id)){
      q.finished.add(id);q.finishEvents.push({id,time,rank:v.finishPosition,
       atMs:v.finishedAtSimMs,pits:v.pitStopCount,compound:v.tyreCompound});
     }
     if(q.ticks%50===0&&!v.finished&&!old.get(id).finished){
      const before=old.get(id),travel=(Number(v.unifiedPathDistanceV11)||0)-before.path,
       speed=Math.max(before.speed,Number(v.speedKph)||0)/3.6,
       bound=speed*.02+.25;
      if(!Number.isFinite(travel)||travel< -1e-6||travel>bound+1e-6||v.raceProgress<before.progress-1e-8)
       q.continuityErrors.push({id,tick:q.ticks,travel,bound,old:before.progress,newProgress:v.raceProgress});
     }
    }
    // A rejected physical step must stop this test, rather than repeatedly
    // invoking a paused engine until the six-minute subprocess timeout.
    // A real physics rejection leaves the RACE screen active; normal finish
    // transitions to FINISHING and may also return false from the integrator.
    if(!accepted&&window.mwsF1GetScreenStateV185()!=='FINISHING'){
     const p=window.mwsF1UnifiedV11Report();
     q.rejectedStep={tick:q.ticks,simSeconds:time,clockPaused:window.mwsF1GetSimulationClockV192().paused,
      collisions:p.collisionStops,invalid:p.invalid?.slice(-2)||[],
      cars:active.map(v=>({id:String(v.id),progress:v.raceProgress,lane:v.unifiedYV11,
       speedKph:v.speedKph,pitState:v.pitState,wear:v.tyreWear}))};
    }
    if(q.real20ms&&accepted&&q.ticks%250===0&&time<=90.001){
     const p=q.real20ms,competition=window.mwsF1CompetitionBaselineV12();
     const total=Number(competition.trafficConstrainedSteps)||0;
     const trafficByDriver=competition.trafficByDriver||{};
     const current=Object.entries(trafficByDriver).map(([id,v])=>[id,Number(v)||0]);
     const count=Object.fromEntries(current.map(([id,v])=>
      [id,v-(Number(p.lastTrafficByDriver[id])||0)]));
     const sum=Object.values(count).reduce((a,b)=>a+b,0);
     const delta=total-p.lastTrafficTotal;
     if(sum!==delta||delta<0||Object.values(count).some(v=>v<0))
      throw Error('R5-b79 real-grid traffic attribution mismatch at '+time+' seconds');
     const leader=active[0],second=active[1],lid=String(leader.id),sid=String(second.id);
     p.trafficWindows.push({endSeconds:time,
      leaderAtEnd:lid,secondAtEnd:sid,trafficStepsAll12:delta,
      trafficStepsOfCurrentLeader:Number(count[lid])||0,
      trafficStepsOfCurrentSecond:Number(count[sid])||0,
      trafficStepsOfOthers:delta-(Number(count[lid])||0)-(Number(count[sid])||0),
      leadGapMeters:(Number(leader.raceProgress)-Number(second.raceProgress))*
       window.mwsF1GetActiveRaceSnapshotV187().track.lengthMeters,
      leaderMode:String(leader.unifiedAiStateV11||''),
      secondMode:String(second.unifiedAiStateV11||'')});
     p.lastTrafficByDriver={...trafficByDriver};
     p.lastTrafficTotal=total;
    }
    if(q.ticks%250===0){
     window.__mwsR5b121CopyAttemptLedger?.();
     const strategies=window.mwsF1GetPitStrategyStatesV206();
     const leader=active[0],second=active[1],len=window.mwsF1GetActiveRaceSnapshotV187().track.lengthMeters;
     q.strategySamples.push({simSeconds:time,leader:String(leader.id),
      leaderProgress:leader.raceProgress,leaderGapMeters:(leader.raceProgress-second.raceProgress)*len,
      confirmedPasses:window.mwsF1UnifiedV11Report().passes.length,
      requests:q.requests.length,
      drivers:active.map(v=>{
       const st=strategies.find(x=>String(x.id)===String(v.id));
       return {id:String(v.id),lap:v.raceProgress,gridPosition:v.gridPosition,
        speedKph:Number(v.speedKph)||0,
        pace:Number(v.driverProfile?.pace)||75,
        strategy:String(v.unifiedStrategyV12||''),
        strategyEffort:Number(v.unifiedStrategyEffortV12)||1,
        ersRequestKW:Number(v.unifiedStrategyErsKWV12)||0,
        actualErsKW:Number(v.energyDeployKW)||0,
        batteryMJ:Number(v.batteryMJ)||0,
        aiState:String(v.unifiedAiStateV11||''),
        wear:v.tyreWear,compound:v.tyreCompound,
        state:v.pitState,requested:!!v.pitRequested,reason:st?.reason||'',
        decision:st?.decision||'',remainingLaps:st?.context?.remainingLaps??null,
        bestBenefit:st?.context?.candidates?.[0]?.benefit??null,
        predictedPitLoss:st?.context?.pitLossSeconds??null,
        target:st?.targetCompound||'',pits:v.pitStopCount};
      })});
    }
    if(!accepted||window.mwsF1GetScreenStateV185()!=='RACE'){
     q.finishBoundary={state:window.mwsF1GetScreenStateV185(),simSeconds:time,
      officialRows:window.mwsF1GetRaceResultRecoveryG()?.rows?.length||0};
     break;
    }
   }
   return {tick:q.ticks,state:window.mwsF1GetScreenStateV185(),seconds:seconds(),rejected:q.rejectedStep};
  },250);
  state=batch.state;ticks=batch.tick;
  if(batch.rejected){
   console.error(JSON.stringify({stage:'R5-b3-PHYSICAL_REJECTION',track:trackId,seedId,...batch.rejected}));
   break;
  }
  if(ticks%5000===0)console.log(JSON.stringify({stage:'R5-b3-progress',simSeconds:batch.seconds,ticks,state}));
 }
 await page.waitForTimeout(120);
 observation=await page.evaluate(()=>{
  window.__mwsR5b121CopyAttemptLedger?.();
  const q=window.__mwsR5b3,report=window.mwsF1UnifiedV11Report(),
   competition=window.mwsF1CompetitionBaselineV12(),
   snapshot=window.mwsF1GetActiveRaceSnapshotV187(),result=window.mwsF1GetRaceResultRecoveryG(),
   statuses=window.mwsF1GetPitStatesV205(),
   transitions=window.mwsF1ScreenTransitionsV12();
  return {version:'v1.2-R5-b3',scope:'12 LIVE drivers on one real SVG circuit, NORMAL 10 laps, mixed initial tyre compounds, zero manual pit requests',
   mode:snapshot.raceMode,track:snapshot.trackId,laps:snapshot.totalLaps,
   simulatedSeconds:window.mwsF1GetSimulationClockV192().simTimeMs/1000,
   state:window.mwsF1GetScreenStateV185(),domScreen:document.getElementById('gameF1Racing')?.dataset.f1Screen,
   profileScenario:q.profileScenario,
   real20ms:q.real20ms?{...q.real20ms,
    attackLedger:{events:q.attemptQa.events,totalStarts:q.attemptQa.totalStarts,
     missingOverlap:q.attemptQa.missingOverlap,probes:q.attemptQa.probes,
     activeAtFinish:report.attackLedger.active,
     startWitnesses:q.attemptQa.startWitnesses,
     missingStartWitnesses:q.attemptQa.missingWitnesses,
     exactWitnessSource:'genuine accepted 20ms simulation frame at engine START ms',
     safeLaneClaim:false}}:null,
   originalProfiles:q.originalProfiles,appliedProfiles:q.appliedProfiles,
   originalStrategies:q.originalStrategies,appliedStrategies:q.appliedStrategies,
   strategyInterventionAtMs:q.strategyInterventionAtMs,
   initialOrder:q.initialOrder,startingCompounds:q.startingCompounds,
   pitRequests:q.requests,pitTransitions:q.pitTransitions,pitPlanViolations:q.plannedPitViolations,
   finishBoundary:q.finishBoundary,rejectedStep:q.rejectedStep,finishEvents:q.finishEvents,continuityErrors:q.continuityErrors,
   samples:q.strategySamples,screenTransitions:transitions,
   finishedRows:result?.rows?.map(r=>({id:r.contactId,position:r.position,gridPosition:r.gridPosition,
    pits:r.pitStopCount,compound:r.tyreCompound,finishMs:r.finishedAtSimMs,lapTimesMs:r.lapTimesMs,bestLapMs:r.bestLapMs})),
   pitStates:statuses,physics:{collisionStops:report.collisionStops,invalid:report.invalid,
    passes:report.passes?.length,rawCrossings:report.rawCrossings?.length,autoPitPlans:report.pit,
    // R5-b55: confirmed post-500ms physical passes, never rank-swap estimates.
    passEvents:(report.passes||[]).map(pass=>({t:pass.t,front:String(pass.front),passed:String(pass.passed)})),
    rawCrossingEvents:(report.rawCrossings||[]).map(event=>({
     t:event.t,pair:String(event.pair||''),front:String(event.front||'')}))},
   acceptedCompetition:{
    source:'real-committed-unified-v1.1',sampleIntervalMs:competition.sampleIntervalMs,
    leaderChanges:competition.leaderChanges,rankReorders:competition.rankReorders,
    trafficConstrainedSteps:competition.trafficConstrainedSteps,
    trafficByDriver:competition.trafficByDriver,
    aiModeSteps:competition.aiModeSteps,
    samples:competition.samples,
    confirmedPasses:competition.confirmedPasses,rawCrossings:competition.rawCrossings,
    collisionStops:competition.collisionStops,invalidSteps:competition.invalidSteps},
   strategySummary:{sampleCount:q.strategySamples.length,
    reasonCounts:Object.fromEntries([...new Set(q.strategySamples.flatMap(x=>x.drivers.map(d=>d.reason)))].map(reason=>
     [reason,q.strategySamples.flatMap(x=>x.drivers).filter(d=>d.reason===reason).length])),
    peakWearByCompound:Object.fromEntries(['SOFT','MEDIUM','HARD'].map(c=>[c,Math.max(0,...q.strategySamples.flatMap(x=>x.drivers.filter(d=>q.startingCompounds[d.id]===c).map(d=>Number(d.wear)||0)))])),
    highWearNoPitSamples:q.strategySamples.flatMap(x=>x.drivers).filter(d=>d.wear>.60&&d.state==='TRACK'&&!d.requested).length},
   view:{finishingVisible:document.getElementById('f1RacingViewFinishingV185')?.hidden===false,
    overlayVisible:document.getElementById('f1RacingFinishOverlayV291')?.hidden===false},
   tickCount:q.ticks};
 });
 fs.mkdirSync('artifacts',{recursive:true});
 fs.writeFileSync(output,JSON.stringify({status:'DIAGNOSTIC',seedId,seededIso,setupCreatedAt:initial.createdAt,...observation,pageErrors},null,2));
 console.log(JSON.stringify({phase:'R5-b3',state:observation.state,seconds:observation.simulatedSeconds,
  officialFinishers:observation.finishedRows?.length,autoRequests:observation.pitRequests.length,
  actualStops:observation.finishedRows?.reduce((n,r)=>n+r.pits,0),softPeakWear:observation.strategySummary.peakWearByCompound.SOFT,
  warning:observation.pitRequests.length?'':'NO_AUTOMATIC_PIT_ON_NORMAL_TEN_LAPS',
  phys:observation.physics.collisionStops,invalid:observation.physics.invalid?.length}));
 assert.deepEqual(pageErrors,[],'LIVE browser JS exceptions');
 assert.equal(observation.rejectedStep,null,'REAL_PHYSICAL_REJECTION: '+JSON.stringify(observation.rejectedStep));
 assert.equal(observation.state,'FINISHING','Natural NORMAL finish missing or screen reverted');
 assert.equal(observation.domScreen,'FINISHING');
 assert(observation.view.finishingVisible&&observation.view.overlayVisible,'Official finishing view / result overlay must persist');
 assert.equal(observation.mode,'NORMAL');assert.equal(observation.laps,10);
 assert.equal(observation.profileScenario,profileScenario);
 assert.equal(Boolean(observation.real20ms),probeReal20ms);
 if(probeReal20ms){
  const p=observation.real20ms;
  assert(p.acceptedFrames>=4400&&p.acceptedFrames<=4500,'Genuine 20ms manual observations cover 90s with observed browser scheduling gaps');
  assert(p.frontFrames<=p.acceptedFrames);
  assert(p.closeFasterFrames<=p.frontFrames);
  assert(p.followCloseFaster<=p.closeFasterFrames);
  assert(p.planAttackCloseFaster<=p.closeFasterFrames);
  assert(p.corridorCandidateFrames<=p.closeFasterFrames);
  assert(p.blockedFrames<=p.closeFasterFrames);
  assert(p.streak400ms<=p.followCloseFaster&&p.maxStreakFrames<=p.followCloseFaster);
  assert.equal(p.followCloseFaster,p.followCandidateUnblockedFrames+
   p.followCandidateBlockedFrames+p.followWithoutCandidateFrames);
  assert(p.followCandidateUnblockedFrames<=p.corridorCandidateFrames);
  assert(p.followCandidateBlockedFrames<=p.blockedFrames);
  assert(p.attackPlannedUnblockedFrames<=p.planAttackCloseFaster);
  assert(p.candidateUnblocked400msEpisodes<=p.streak400ms);
  assert(p.candidateUnblockedLongestFrames<=p.followCandidateUnblockedFrames);
  assert(p.candidateUnblocked400msEpisodes<=p.followCandidateUnblockedFrames);
  assert.equal(p.candidateUnblocked400msSamples.length,p.candidateUnblocked400msEpisodes);
  assert(p.candidateUnblocked400msSamples.every(e=>Array.isArray(e.consecutive20msFrames)&&
   e.consecutive20msFrames.length===20&&e.consecutive20msFrames.every((f,i)=>
    f.tick===e.firstFrameTick+i&&f.leaderId===e.leaderId&&
    f.followerId===e.followerId&&f.aiState==='FOLLOW'&&
    f.candidateCount>0&&f.mergeBlockers===0&&
    f.gapMeters>0&&f.gapMeters<=70&&f.relativeSpeedMps>2)));
  assert(p.candidateUnblocked400msSamples.every(x=>x.consecutiveFrames===20&&
   x.physicsStepMs===20&&x.lastFrameTick-x.firstFrameTick===19&&
   x.aiState==='FOLLOW'&&x.candidateCount>0&&x.reportedMergeBlockers===0&&
   x.sweptClearanceProven===false&&x.mergeReservationClearanceProven===false));
  assert.equal(p.corridorCandidatesNotClearance,true);
  assert(p.examples.every(e=>e.ms>0&&e.ms<=90001&&e.leader!==e.follower));
  assert(p.trafficWindows.length>=17&&p.trafficWindows.length<=18,'Real 250-tick windows are not always 5.00s apart');
  assert(p.trafficWindows.every((w,i)=>{
   const prev=i?p.trafficWindows[i-1].endSeconds:0;
   return w.endSeconds>prev&&w.endSeconds<=90.001&&
    w.trafficStepsAll12>=0&&w.trafficStepsOfOthers>=0&&
    w.trafficStepsAll12===w.trafficStepsOfCurrentLeader+
     w.trafficStepsOfCurrentSecond+w.trafficStepsOfOthers;
  }));
  assert.equal(p.trafficWindows.reduce((n,w)=>n+w.trafficStepsAll12,0),
   p.lastTrafficTotal);
 }
 assert.equal(Object.keys(observation.originalProfiles).length,12);
 assert.equal(Object.keys(observation.appliedProfiles).length,12);
 assert.equal(Object.keys(observation.originalStrategies).length,12);
 assert.equal(Object.keys(observation.appliedStrategies).length,12);
 if(profileScenario==='EQUAL_STRATEGY_BALANCED'){
  assert.equal(observation.strategyInterventionAtMs,20);
  assert(Object.values(observation.appliedStrategies).every(v=>v==='BALANCED'));
  assert.deepEqual(observation.originalProfiles,observation.appliedProfiles,
   'Strategy-only experiment mutated driver abilities');
 }else{
  assert.equal(observation.strategyInterventionAtMs,null);
  assert.deepEqual(observation.originalStrategies,observation.appliedStrategies);
 }
 assert.equal(observation.finishedRows?.length,12);assert.equal(observation.finishEvents.length,12);
 assert.deepEqual(observation.finishedRows.map(r=>r.position),Array.from({length:12},(_,i)=>i+1));
 assert(observation.finishedRows.every(r=>r.finishMs>0&&r.lapTimesMs.length===10),
  'Official 10-lap finish and timing absent');
 assert.equal(observation.finishBoundary?.state,'FINISHING');
 assert.equal(observation.finishBoundary?.officialRows,12);
 assert.equal(observation.physics.collisionStops,0);
 assert.equal(observation.physics.passEvents.length,observation.physics.passes,
  'Confirmed physical pass ledger does not reconcile');
 assert.equal(observation.physics.rawCrossingEvents.length,observation.physics.rawCrossings,
  'Raw crossing provenance does not reconcile');
 assert.equal(observation.acceptedCompetition.confirmedPasses,observation.physics.passes,
  'Committed sample pass count differs from physics ledger');
 assert.equal(observation.acceptedCompetition.collisionStops,0);
 assert.equal(observation.acceptedCompetition.invalidSteps,0);
 assert(observation.acceptedCompetition.samples.length>20,
  'Genuine 5-second competition samples are missing');
 const trace=observation.physics.passEvents;
 assert(trace.every(e=>Number.isFinite(e.t)&&e.t>=0&&e.front&&e.passed&&e.front!==e.passed),
  'Invalid confirmed passing identities');
 assert(trace.every((e,i)=>i===0||e.t>=trace[i-1].t),
  'Confirmed physical passing ledger is not chronological');
 assert.deepEqual(observation.physics.invalid,[]);
 assert.deepEqual(observation.continuityErrors,[]);
 assert.deepEqual(observation.pitPlanViolations,[],'Incorrect voluntary pit decision');
 assert(!observation.screenTransitions.some(t=>t.from==='FINISHING'&&t.to==='RACE'));
 assert(observation.physics.passes<=observation.physics.rawCrossings);
 assert.equal(observation.physics.autoPitPlans?.length,observation.pitRequests.length,
  'Autonomous pit telemetry / actual requests disagree');
 const byId=new Map(observation.finishedRows.map(x=>[x.id,x]));
 for(const request of observation.pitRequests){
  const transitions=observation.pitTransitions.filter(x=>x.id===request.id);
  const sequence=transitions.map(x=>x.to);
  const full=['PIT_ENTRY','PIT_LANE','PIT_BOX','PIT_LANE','PIT_EXIT','TRACK'];
  // An entry already below the pit speed limit can advance through PIT_ENTRY
  // between two sampled 20ms boundaries. The state machine records entry in
  // pitEntryRaceProgress even if the QA never observes that transient state.
  const immediate=['PIT_LANE','PIT_BOX','PIT_LANE','PIT_EXIT','TRACK'];
  if(sequence.join('|')===immediate.join('|')){
   const first=transitions[0];
   assert.equal(first.from,'TRACK','Missing pit-entry origin '+request.id);
   assert(Number.isFinite(first.pitEntryRaceProgress)&&
    first.lap>=first.pitEntryRaceProgress&&first.lap-first.pitEntryRaceProgress<=.01,
    'PIT_ENTRY skipped without a real entry boundary '+request.id);
   assert(Number.isFinite(first.speedKph)&&first.speedKph<=first.pitSpeedLimitKph+2+1e-6,
    'PIT_ENTRY skipped above pit-lane speed limit '+request.id);
  }else{
   assert.deepEqual(sequence,full,'Unfinished autonomous pit sequence '+request.id);
  }
  assert.equal(byId.get(request.id)?.pits,1,'Auto pit must service exactly once');
  // Audit the same plan that triggered the autonomous request, not a post-request read.
  const audit=request.recordedPlan;
  assert.equal(audit?.benefitKind,'MODEL_ESTIMATE_NOT_OBSERVED_GAIN','Expected benefit mislabeled as observed gain');
  assert.equal(audit?.fromCompound,request.from,'Compound does not match decision snapshot');
  assert.equal(audit?.compound,request.to,'Selected target does not match recorded decision');
  assert(Number.isFinite(audit?.remainingLaps)&&Number.isFinite(audit?.pitLossSeconds));
  assert(Number.isFinite(audit?.forecast?.lapSeconds)&&Number.isFinite(audit?.forecast?.observedWearPerLap));
  assert(Number.isFinite(audit?.forecast?.stayLossSeconds));
  assert.equal(audit?.candidates?.length,3,'Missing decision-time SOFT/MEDIUM/HARD forecasts');
  assert.deepEqual([...audit.candidates.map(c=>c.compound)].sort(),['HARD','MEDIUM','SOFT']);
  assert(audit.candidates.every(c=>Number.isFinite(c.benefit)&&
    Number.isFinite(c.projectedFinishWear)&&c.projectedFinishWear>=0&&c.projectedFinishWear<=1),
    'Nonphysical candidate forecast');
  assert(audit.candidates.every((c,i)=>i===0||audit.candidates[i-1].benefit>=c.benefit),
    'Candidate alternatives are not sorted by projected time advantage');
  assert.equal(audit.candidates[0].compound,request.to,'Chosen tyre was not the forecast leader');
  assert(Math.abs(audit.candidates[0].benefit-audit.benefit)<1e-8,'Chosen benefit differs from top candidate');
  const service=transitions.find(x=>x.from==='PIT_BOX'&&x.to==='PIT_LANE');
  assert.equal(service?.compound,request.to,'Tyre change did not match autonomous pit selection');
 }
 assert(observation.strategySummary.sampleCount>=100,'Long-run samples missing');
 const warnings=[];
 if(observation.pitRequests.length===0)warnings.push('NO_AUTOMATIC_PIT_REQUEST_IN_TEN_LAPS: economics or wear threshold may make pit unattractive; do not claim tested automatic pit service');
 if(observation.strategySummary.peakWearByCompound.SOFT<=.60)warnings.push('SOFT_DID_NOT_REACH_STRATEGY_WEAR_THRESHOLD');
 fs.writeFileSync(output,JSON.stringify({status:'PASS',seedId,seededIso,setupCreatedAt:initial.createdAt,warnings,...observation,pageErrors},null,2));
 console.log(JSON.stringify({status:'PASS',stage:'R5-b3',track:trackId,mode:'NORMAL',
  finishers:observation.finishedRows.length,simulatedSeconds:observation.simulatedSeconds,
  autonomousRequests:observation.pitRequests.length,realPitStops:observation.finishedRows.reduce((n,r)=>n+r.pits,0),
  confirmedPasses:observation.physics.passes,softPeakWear:observation.strategySummary.peakWearByCompound.SOFT,
  warnings,artifact:output}));
}catch(error){
 fs.mkdirSync('artifacts',{recursive:true});
 fs.writeFileSync(output,JSON.stringify({status:'FAIL',seedId,seededIso,error:String(error?.stack||error),observation},null,2));
 throw error;
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}