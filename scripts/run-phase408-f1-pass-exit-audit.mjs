import {readFileSync} from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
export function runPhase408F1PassExitAudit(){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),js=readFileSync(path.join(root,'assets/f1-racing-v1.js'),'utf8'),issues=[];
 const check=(ok,msg)=>{if(!ok)issues.push(msg)};
 const guard=js.split('function postPassLaneHoldV408(')[1]?.split('function validateThirdLaneV383(')[0]||'';
 check(guard.includes('liveCameraClearanceMetersV386(track)+15')&&guard.includes('raceProgress'),'real clearance not guarded');
 check(guard.includes('if(engineQaV240.active)return false'),'headless benchmark is affected by LIVE-only lane hold');
 check(guard.includes('vehicle.safePassExitUntilV386')&&guard.includes('vehicle.safePassExitLineV408'),'pass hold not bounded');
 check(js.includes('vehicle.safePassExitLineV408=')&&js.includes('vehicle.safePassExitTargetIdV408='),'pass state exit line not captured');
 check(js.includes('!committedPassLineV383(vehicle)&&!postPassLaneHoldV408(vehicle)'),'traffic resets safe exit lane');
 check(js.includes("postPassLaneHoldV408(vehicle)?String(vehicle.safePassExitLineV408):'IDEAL'"),'pass resets lane before clearance');
 check(!/\b(?:raceProgress|progress|travel|visualLateralOffsetMeters)\s*=/.test(guard),'guard alters physical position');
 return {phase:408,issues,warnings:[],pass:issues.length===0};
}
if(import.meta.url==='file://'+process.argv[1]){const r=runPhase408F1PassExitAudit();console.log(JSON.stringify(r));if(!r.pass)process.exitCode=1}
