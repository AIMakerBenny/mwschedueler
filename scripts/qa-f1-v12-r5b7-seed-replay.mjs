// R5-b7: reproduce the first 5 seconds of two historical divergent fixed-seed
// Chromium sessions. READ-ONLY telemetry. It never forces position, pit,
// acceleration, rank, tyre wear, or outcome. Differences are recorded, not hidden.
// A completed CI job does NOT imply deterministic race replay if discrepancies exist.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createF1PreviewServer} from './serve-f1-unified-v11-preview.mjs';
let chromium;
try {({chromium}=await import('playwright'));}
catch(error){
 if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw error;
 ({chromium}=createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'_resolve.cjs'))('playwright'));
}
const output='artifacts/f1-v12-r5b7-seed-replay.json';
const cases=[
 {track:'blue-coast-speedway-v1',seed:2},
 {track:'royal-street-circuit-v1',seed:1}
];
const captures=[0,1,5,10,25,50,100,150,200,250];
const server=createF1PreviewServer();
await new Promise(resolve=>server.listen(8857,'127.0.0.1',resolve));
let browser;
const scenarios=[],failures=[];
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.MWS_CHROME_PATH||undefined,args:['--no-sandbox']});
 for(const selected of cases){
  const repetitions=[];
  for(let repeat=1;repeat<=3;repeat++){
   const page=await browser.newPage({viewport:{width:1920,height:1080}});
   const pageErrors=[];
   page.on('pageerror',error=>pageErrors.push(error.message));
   try{
    await page.goto('http://127.0.0.1:8857/',{waitUntil:'load'});
    await page.waitForFunction(()=>typeof window.mwsF1UnifiedV11Report==='function');
    await page.waitForFunction(()=>document.getElementById('mwsLoginForm')?.dataset.mode==='admin');
    await page.locator('#mwsModePublic').click();
    await page.locator('#mwsLoginSubmit').click();
    await page.waitForFunction(()=>document.getElementById('mwsAccessGate').classList.contains('hidden'));
    const seededIso=new Date(Date.UTC(2026,9,18,0,0,0,selected.seed*1000)).toISOString();
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
     class SeededSetupDate extends OriginalDate{
      constructor(...args){super(...(args.length?args:[seededIso]));}
      static now(){return OriginalDate.parse(seededIso);}
     }
     let started=false;
     window.Date=SeededSetupDate;
     try{started=window.mwsF1StartRaceFromSetupV187('NORMAL');}
     finally{window.Date=OriginalDate;}
     return {started,createdAt:window.mwsF1GetActiveRaceSnapshotV187()?.createdAt,
      track:window.mwsF1GetActiveRaceSnapshotV187()?.trackId,
      drivers:window.mwsF1GetSelectedContactIdsV181().length};
    },{trackId:selected.track,seededIso});
    assert(initial.started&&initial.createdAt===seededIso&&initial.track===selected.track&&initial.drivers===12,
     'Seeded startup mismatch '+JSON.stringify(initial));
    await page.waitForFunction(()=>window.mwsF1GetScreenStateV185()==='GRID');
    assert.equal(await page.evaluate(()=>window.mwsF1WaitGridRevealV273(20000)),true);
    // Dispatch the real GRID button synchronously and stop the auto RAF in
    // the SAME browser task. Playwright locator.click awaited the next animation
    // frame and created a nondeterministic 300-400ms unseeded simulation preroll.
    const startClock=await page.evaluate(()=>{
     const button=document.getElementById('f1RacingGridStartRecoveryM');
     if(!button)throw Error('Missing official start button');
     button.click();
     window.mwsF1PauseRaceMotionV189(false);
     return {state:window.mwsF1GetScreenStateV185(),ms:window.mwsF1GetSimulationClockV192().simTimeMs};
    });
    assert.equal(startClock.state,'RACE');
    assert.equal(startClock.ms,0,'Race advanced before deterministic QA integrator');
    const trace=await page.evaluate((captures)=>{
     window.mwsF1PauseRaceMotionV189(false); // Same RAF pause as existing full race QA.
     const vehicles=window.mwsF1ComputeRaceStandingsV191().map(r=>r.vehicle);
     for(const v of vehicles){
      const index=Number(String(v.id).split('-').at(-1));
      if(!window.mwsF1SetVehicleTyreCompoundV203(v.id,index<6?'SOFT':index<9?'MEDIUM':'HARD'))
       throw Error('Starting compound setup failed');
     }
     const signature=tick=>({
      tick,simMs:window.mwsF1GetSimulationClockV192().simTimeMs,
      state:window.mwsF1GetScreenStateV185(),
      drivers:window.mwsF1ComputeRaceStandingsV191().map(r=>r.vehicle)
       .sort((a,b)=>String(a.id).localeCompare(String(b.id)))
       .map(v=>({id:String(v.id),lap:Number(v.raceProgress)||0,
        velocity:Number(v.speedKph)||0,lane:Number(v.unifiedYV11)||0,
        wear:Number(v.tyreWear)||0,random:Number(v.unifiedRngV11)||0,
        incident:String(v.unifiedErrorTypeV11||''),pit:String(v.pitState||'TRACK')}))
     });
     const records=[signature(0)];
     for(let tick=1;tick<=250;tick++){
      if(!window.mwsF1SimulateRaceStepV192(20))throw Error('Physical solver rejected replay tick '+tick);
      if(captures.includes(tick))records.push(signature(tick));
     }
     return records;
    },captures);
    assert.deepEqual(pageErrors,[]);
    assert.equal(trace.length,captures.length);
    assert(trace.every(s=>s.drivers.length===12&&s.state==='RACE'));
    repetitions.push({repeat,createdAt:initial.createdAt,trace});
   }finally{await page.close();}
  }
  const anchor=repetitions[0].trace;
  const differences=repetitions.slice(1).map(entry=>{
   let first=null;
   for(let i=0;i<anchor.length;i++){
    if(JSON.stringify(anchor[i])!==JSON.stringify(entry.trace[i])){
     const mismatches=anchor[i].drivers.map((v,j)=>v.id).filter((id,j)=>
      JSON.stringify(anchor[i].drivers[j])!==JSON.stringify(entry.trace[i].drivers[j]));
     first={tick:anchor[i].tick,simMs:anchor[i].simMs,ids:mismatches};break;
    }
   }
   return {repeat:entry.repeat,firstDivergence:first};
  });
  scenarios.push({...selected,repetitions,differences,
   reproducible:differences.every(d=>d.firstDivergence===null)});
 }
}catch(error){failures.push(String(error?.stack||error));}
finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
const summary={phase:'R5-b7',scope:'Two genuine SVG circuits, identical seeded NORMAL setup repeated 3 times, first 250 accepted 20ms ticks',
 status:failures.length?'FAIL':'PASS',scenarios,
 reproducible:scenarios.length===2&&scenarios.every(x=>x.reproducible),
 warnings:scenarios.filter(x=>!x.reproducible).map(x=>'REPLAY_DIVERGED: '+x.track+' seed '+x.seed),
 failures,
 interpretation:'First-divergence diagnostic; a PASS validates trace collection and legal steps, not deterministic replay. No physics or race outcome overrides.'};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync(output,JSON.stringify(summary,null,2));
console.log(JSON.stringify({phase:'R5-b7-replay',status:summary.status,reproducible:summary.reproducible,
 comparisons:scenarios.map(x=>({track:x.track,seed:x.seed,reproducible:x.reproducible,differences:x.differences})),
 warnings:summary.warnings,failures,output}));
assert.equal(failures.length,0,JSON.stringify(failures));
assert.equal(scenarios.length,2,'Missing replay scenarios');
