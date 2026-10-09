import {readFileSync} from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
export function runPhase405F1BoostedPassAudit(){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const source=readFileSync(path.join(root,'assets/f1-racing-v1.js'),'utf8');
 const qa=readFileSync(path.join(root,'scripts/diagnose-recovery-h-f1-live.mjs'),'utf8');
 const issues=[];const check=(cond,message)=>{if(!cond)issues.push(message)};
 const fn=source.split('function updatePassStateMachineV208(stepMs){')[1]?.split('function getPassStatesV208(){')[0]||'';
 check(fn.includes('boostedLanePreparationV405')&&fn.includes("next='PULLING_OUT'"),'boosted physical passing lane intent absent');
 check(fn.includes("boundaryOvertakeEligibleV271(vehicle)")&&fn.includes('projectedSafeGapMetersV378()*.55'),'physical boundary/headway conditions missing');
 check(fn.includes('battlePairBlockedV319(')&&fn.includes('validateThirdLaneV383('),'existing battle collision protection missing');
 check(!/\b(?:raceProgress|progress|travel|visualLateralOffsetMeters)\s*=/.test(fn),'position warp detected in pass controller');
 check(qa.includes('physicalOnTrackPasses')&&qa.includes('latestOverlap:overlap.latest'),'12-driver live diagnostics absent');
 return {phase:405,issues,warnings:[],pass:issues.length===0};
}
if(import.meta.url==='file://'+process.argv[1]){const r=runPhase405F1BoostedPassAudit();console.log(JSON.stringify(r));if(!r.pass)process.exitCode=1}
