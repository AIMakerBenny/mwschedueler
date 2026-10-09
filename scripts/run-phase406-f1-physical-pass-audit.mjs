import {readFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import path from 'node:path';
export function runPhase406F1PhysicalPassStateAudit(){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const src=readFileSync(path.join(root,'assets/f1-racing-v1.js'),'utf8');
 const qa=readFileSync(path.join(root,'scripts/diagnose-recovery-h-f1-live.mjs'),'utf8');
 const issues=[];const check=(x,msg)=>{if(!x)issues.push(msg)};
 const state=src.split('function nextPassStateV208(current,ctx={}){')[1]?.split('function battleBiasKphV208')[0]||'';
 const driver=src.split('function updatePassStateMachineV208(stepMs){')[1]?.split('function getPassStatesV208(){')[0]||'';
 check(state.includes('!ctx.specialLaneV406')&&state.includes('PASS_CONFIG_V208.failGapMeters'),'boosted passing cannot retain state past legacy 32m fail gap');
 check(driver.includes('specialLaneV406:Boolean(signedGapMeters>0')&&driver.includes('projectedSafeGapMetersV378()*2.25'),'safe boosted approach window absent');
 check(driver.includes('boostedLanePreparationV405')&&driver.includes('battlePairBlockedV319'),'physical lane/battle guarding absent');
 check(qa.includes('peakCurrentZoomPairs')&&qa.includes('const liveFrame=window.mwsF1GetFinalLiveQualityV386'),'LIVE-only marker overlap metric absent');
 check(!/\b(?:raceProgress|progress|travel|visualLateralOffsetMeters)\s*=/.test(state),'state machine warps position');
 return {phase:406,issues,warnings:[],pass:!issues.length};
}
if(import.meta.url==='file://'+process.argv[1]){const r=runPhase406F1PhysicalPassStateAudit();console.log(JSON.stringify(r));if(!r.pass)process.exitCode=1}
