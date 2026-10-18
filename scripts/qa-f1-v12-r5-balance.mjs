// R5 real-SVG 7-track, FAST/NORMAL, dual-seed 90s competition observability.
// These are NOT completed-race results; pit UI transitions are stubbed.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import {engine,setup,src} from './f1-unified-v11-fixture.mjs';
let chromium;
try{({chromium}=await import('playwright'));}catch(err){
 if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw err;
 chromium=createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'_resolve.cjs'))('playwright').chromium;
}
const seconds=Math.max(30,Math.min(240,Number(process.env.MWS_R5_WINDOW_SECONDS)||90));
const nTicks=Math.round(seconds*50);
const seedCount=Math.max(2,Math.min(4,Number(process.env.MWS_R5_SEEDS)||2));
const modes=[{name:'FAST',laps:3},{name:'NORMAL',laps:10}];
const fixture=setup
 .replace(/const track=\{[^\n]+/,"const track=fixtureTrack,activeRaceSnapshotV187={track,createdAt:'R5',totalLaps:10};")
 .replace(/const path=\{[^\n]+/,"const path=fixturePath;")
 .replaceAll('-i*9/5280','-i*9/track.lengthMeters')
 .replace("const getCornerPhaseAtProgressV194=()=>({phase:'STRAIGHT',corner:null});",
          'const getCornerPhaseAtProgressV194=p=>fixturePhase(p);')
 .replace("const specialStateV401={cinematic:false,lastMs:-Infinity},specialStageV401=()=>null,specialPhraseV401=()=>({}),playSpecialV401=()=>{};",
  "const stage={dataset:{},innerHTML:'',removed:false,remove(){this.removed=true;this.innerHTML='';}},"+
  "specialStateV401={cinematic:false,lastMs:-Infinity,queue:[],index:0,visualClockV12:0,events:0,chains:0,boosts:0,history:[]},"+
  "specialStageV401=()=>{stage.removed=false;return stage;},"+
  "specialPhraseV401=()=>({title:'R5 BOOST',line:'TEST'}),playSpecialV401=()=>{},"+
  "escapeHtml=x=>String(x),initials=x=>String(x).slice(0,1);");
assert.notEqual(fixture,setup);
assert(fixture.includes('fixturePhase(p)'));
const special=src.slice(src.indexOf('function applySpecialV401(entry){'),src.indexOf('function playSpecialV401(token){'));
assert(special.startsWith('function applySpecialV401('));
const code=[
 "const lookup=document.getElementById;",
 "document.getElementById=k=>k==='f1SkillStageV401'&&!stage.removed?stage:lookup(k);",
 "activeRaceSnapshotV187.createdAt='R5-'+track.id+'-'+config.name+'-'+config.seed;",
 "activeRaceSnapshotV187.totalLaps=config.laps;",
 "for(const v of raceMotionV189.vehicles){const i=Number(v.id);",
 " v.driverProfile.pace=config.seed===0?75:i===0?95:i===11?75:75+(i*7%9)-4;}",
 "unifiedInitV11();",
 "const grid=[...raceMotionV189.vehicles].sort((a,b)=>b.raceProgress-a.raceProgress);",
 "let ticks=0,checks=0,overlaps=[],continuity=[],firstPhysicalLapLimitCrossing=null;",
 "for(let i=0;i<config.maxTicks;i++){",
 " const prior=new Map(raceMotionV189.vehicles.map(v=>[String(v.id),{p:v.raceProgress,d:v.unifiedPathDistanceV11||0,v:v.speedKph||0}]));",
 " if(!simulateUnifiedRaceStepV11(20))break;",
 " ticks++;unifiedSpecialPresentationTickV12(2);",
 " if(!firstPhysicalLapLimitCrossing){const crossed=raceMotionV189.vehicles.filter(v=>v.raceProgress>=config.laps);",
 "  if(crossed.length){const orderAtCrossing=[...raceMotionV189.vehicles].sort((a,b)=>b.raceProgress-a.raceProgress||String(a.id).localeCompare(String(b.id)));",
 "   firstPhysicalLapLimitCrossing={simMs:simClockV192.simTimeMs,firstId:String(crossed.sort((a,b)=>b.raceProgress-a.raceProgress)[0].id),order:orderAtCrossing.map(v=>String(v.id)),gapMeters:(orderAtCrossing[0].raceProgress-orderAtCrossing[1].raceProgress)*track.lengthMeters};}}",
 " if(i%25!==0&&!(config.stopAtLapLimit&&firstPhysicalLapLimitCrossing))continue;",
 " for(const v of raceMotionV189.vehicles){",
 "  const before=prior.get(String(v.id)),d=(v.unifiedPathDistanceV11||0)-before.d;",
 "  const bound=Math.max(before.v,v.speedKph||0)/3.6*.02+.25;",
 "  if(!Number.isFinite(d)||d < -1e-6||d>bound+1e-6||v.raceProgress<before.p-1e-8)",
 "   continuity.push({id:String(v.id),tick:i,d,bound});",
 " }",
 " for(let a=0;a<raceMotionV189.vehicles.length;a++)for(let b=a+1;b<raceMotionV189.vehicles.length;b++){",
 "  const x=raceMotionV189.vehicles[a],y=raceMotionV189.vehicles[b];",
 "  if(x.finished||y.finished||x.pitState!=='TRACK'||y.pitState!=='TRACK')continue;",
 "  checks++;if(unifiedBoxesOverlapV11(x.unifiedWorldPoseV11,y.unifiedWorldPoseV11))",
 "   overlaps.push({tick:i,a:String(x.id),b:String(y.id)});",
 " }",
 " if(overlaps.length||continuity.length||(config.stopAtLapLimit&&firstPhysicalLapLimitCrossing))break;",
 "}",
 "const c=unifiedStateV11.competition,first=c.samples[0],last=c.samples.at(-1),",
 " order=[...raceMotionV189.vehicles].sort((a,b)=>b.raceProgress-a.raceProgress||String(a.id).localeCompare(String(b.id)));",
 "return {track:track.id,mode:config.name,laps:config.laps,seed:config.seed,profile:config.seed===0?'equal':'strong-pole',",
 " seconds:simClockV192.simTimeMs/1000,ticks,openingLeader:String(grid[0].id),endingLeader:String(order[0].id),",
 " leaderChanges:c.leaderChanges,rankReorders:c.rankReorders,confirmedPasses:unifiedStateV11.telemetry.passes.length,",
 " rawCrossings:unifiedStateV11.telemetry.rawCrossings.length,attackEvents:c.attemptEventCounts,",
 " trafficConstrainedSteps:c.trafficConstrainedSteps,",
 " initialGapMeters:first?.leaderToP2Meters??null,lastSampleGapMeters:last?.leaderToP2Meters??null,",
 " lastSampleFinalGapMeters:last?.leaderToLastMeters??null,",
 " specialEvents:specialStateV401.events,boosts:specialStateV401.boosts,",
 " boostHistory:specialStateV401.history.map(e=>({rank:e.rank,chain:e.chain,id:e.id})),",
 " incidents:c.incidentEvents.length,maximumProgress:order[0].raceProgress,",
 " roleCounts:Object.fromEntries(['FRONTRUNNER','BALANCED','CHASER','CLOSER'].map(style=>[style,order.filter(v=>v.unifiedStrategyV12===style).length])),",
 " firstPhysicalLapLimitCrossing,",
 " sampleTrace:c.samples.map(t=>({simMs:t.simMs,leader:t.leader,second:t.second,gapMeters:t.leaderToP2Meters,lastGapMeters:t.leaderToLastMeters,confirmedPasses:t.confirmedPasses,trafficConstrainedSteps:t.trafficConstrainedSteps,",
 "  vehicles:t.vehicles.map(v=>({id:v.id,rank:v.rank,progress:v.raceProgress,speedKph:v.speedKph,tyreWear:v.tyreWear,batteryMJ:v.batteryMJ,pace:v.pace,form:v.form,style:v.style,effort:v.effort,ersRequestKW:v.ersRequestKW,corridorCandidates:v.corridorCandidates,stress:v.stress,pressure:v.pressure,mode:v.mode,pit:v.pit}))})),",
 " physical:{overlaps,continuity,checks,stops:unifiedStateV11.telemetry.collisionStops,invalid:unifiedStateV11.telemetry.invalid},",
 " order:order.map(v=>String(v.id))};"
].join('\n');
const results=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.MWS_CHROME_PATH||undefined,args:['--no-sandbox']});
try{
 const page=await browser.newPage();
 await page.setContent('<svg xmlns="http://www.w3.org/2000/svg"><path id="fixture"/></svg>');
 await page.addScriptTag({content:fs.readFileSync(new URL('../assets/f1-track-v1.js',import.meta.url),'utf8')});
 await page.addScriptTag({content:fs.readFileSync(new URL('../assets/f1-track-geometry-v2.js',import.meta.url),'utf8')});
 const tracks=await page.evaluate(()=>Object.values(window.MWS_F1_TRACKS_V182));
 assert.equal(tracks.length,7);
 for(const track of tracks.filter(t=>!process.env.MWS_R5_TRACK_FILTER||t.id===process.env.MWS_R5_TRACK_FILTER)){
  for(const mode of modes.filter(m=>!process.env.MWS_R5_MODE_FILTER||m.name===process.env.MWS_R5_MODE_FILTER)){
   for(let seed=0;seed<seedCount;seed++){
    const config={...mode,seed,maxTicks:nTicks,stopAtLapLimit:process.env.MWS_R5_STOP_AT_LAP_LIMIT==='1'};
    const value=await page.evaluate(({track,config,fixture,engine,special,code})=>{
     const svgPath=document.getElementById('fixture');svgPath.setAttribute('d',track.path);
     const geometry=window.mwsBuildF1CornerPhasesV194(track,window.mwsBuildF1TrackGeometryV193(track,svgPath));
     const phase=p=>window.mwsF1CornerPhaseAtProgressV194(geometry,p);
     return new Function('fixtureTrack','fixturePath','fixturePhase','config',fixture+engine+special+code)(track,svgPath,phase,config);
    },{track,config,fixture,engine,special,code});
    if(config.stopAtLapLimit){
     assert(value.firstPhysicalLapLimitCrossing,'Target progress not reached within allotted window');
     assert(value.ticks>0&&value.ticks<=nTicks,'Invalid bounded target-progress crossing');
    }else assert.equal(value.ticks,nTicks,track.id+' '+mode.name+' '+seed+' physics stopped');
    assert.equal(value.physical.stops,0);
    assert.deepEqual(value.physical.invalid,[]);
    assert.deepEqual(value.physical.overlaps,[]);
    assert.deepEqual(value.physical.continuity,[]);
    assert(value.physical.checks>0);
    assert(value.confirmedPasses<=value.rawCrossings);
    assert.equal(Object.values(value.roleCounts).reduce((a,b)=>a+b,0),12);
    assert(Number.isFinite(value.lastSampleGapMeters));
    assert(value.sampleTrace.length>=2&&value.sampleTrace.every((s,i,a)=>s.vehicles.length===12&&(i===0||s.simMs>a[i-1].simMs)));
    results.push(value);
    console.log(JSON.stringify({track:value.track,mode:value.mode,seed,
     physicalPasses:value.confirmedPasses,leaderChanges:value.leaderChanges,
     gapMeters:+value.lastSampleGapMeters.toFixed(1),boosts:value.boosts}));
   }
  }
 }
}finally{await browser.close();}
assert(results.length>0,'R5 filters selected no tracks or modes');
const sum={
 scenarios:results.length,modeSeedCount:seedCount,secondsPerScenario:seconds,stopOnPhysicalLapLimit:process.env.MWS_R5_STOP_AT_LAP_LIMIT==='1',
 totalPasses:results.reduce((a,b)=>a+b.confirmedPasses,0),
 totalLeaderChanges:results.reduce((a,b)=>a+b.leaderChanges,0),
 zeroPassScenarios:results.filter(x=>x.confirmedPasses===0).length,
 leadChangeScenarios:results.filter(x=>x.leaderChanges>0).length,
 originalLeaderStillFirst:results.filter(x=>x.openingLeader===x.endingLeader).length,
 largeLeadScenarios:results.filter(x=>x.lastSampleGapMeters>100).length,
 specialEvents:results.reduce((a,b)=>a+b.specialEvents,0),
 appliedBoosts:results.reduce((a,b)=>a+b.boosts,0),
 observationOnly:true,
 sampleCadenceSeconds:5,
 knownLimits:[`${seconds}-second isolated windows are not finished races`,'Pit requests/stops are fixture stubs'],
 imbalanceWarnings:[]
};
if(sum.zeroPassScenarios>results.length*.4)sum.imbalanceWarnings.push('More than 40% of scenarios have zero confirmed passes');
if(sum.leadChangeScenarios===0)sum.imbalanceWarnings.push('No early-window leader changes');
if(sum.largeLeadScenarios>results.length*.5)sum.imbalanceWarnings.push('More than half of leader gaps exceed 100m');
const report={version:'v1.2-R5',sum,results};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/f1-v12-r5-balance.json',JSON.stringify(report,null,2));
if(process.env.GITHUB_STEP_SUMMARY){
 const lines=['## R5 real-SVG 7-track × FAST/NORMAL × multi-seed','Bounded windows only; pit stop fixture is stubbed.',
 '|Metric|Value|','|---|---:|',
 '|Scenarios|'+sum.scenarios+'|','|Physical passes|'+sum.totalPasses+'|',
 '|Leader changes|'+sum.totalLeaderChanges+'|','|No-pass scenarios|'+sum.zeroPassScenarios+'|',
 '|Initial leader held|'+sum.originalLeaderStillFirst+'|',
 '|Applied boosts|'+sum.appliedBoosts+'|',
 ...sum.imbalanceWarnings.map(x=>'- Warning: '+x)];
 fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n');
}
console.log(JSON.stringify({status:'PASS',sum}));
