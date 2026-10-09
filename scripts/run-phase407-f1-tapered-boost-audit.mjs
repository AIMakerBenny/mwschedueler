import {readFileSync} from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
export function runPhase407F1TaperedBoostAudit(){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),js=readFileSync(path.join(root,'assets/f1-racing-v1.js'),'utf8'),qa=readFileSync(path.join(root,'scripts/diagnose-recovery-h-f1-live.mjs'),'utf8');
 const issues=[];const check=(yes,msg)=>{if(!yes)issues.push(msg)};
 const effect=js.split('function specialEffectV401(vehicle){')[1]?.split('function resetSpecialV401(){')[0]||'';
 const apply=js.split('function applySpecialV401(entry){')[1]?.split('function playSpecialV401(token){')[0]||'';
 check(effect.includes('physicalOnTrackPassesV386')&&effect.includes('gainedScale'),'real passes do not taper special effect');
 check(effect.includes('cornerFactor')&&effect.includes('specialChainPowerV407'),'terrain-aware varied chain acceleration absent');
 check(apply.includes('specialPassBaselineV407')&&apply.includes('specialChainPowerV407'),'pass baseline and chain initialization absent');
 check(js.includes("['STRAIGHT','APPROACH','BRAKING','EXIT'].includes(phase)")&&js.includes('boostMaxMs:12200'),'real lane/skill duration not tuned');
 check(qa.includes('boostDiagnostics.push(')&&qa.includes('liveOnlyCurrentOverlaps'),'12-driver live field diagnostics absent');
 check(!/\b(?:raceProgress|progress|travel|visualLateralOffsetMeters)\s*=/.test(effect+apply),'special skill directly changes physical position');
 return {phase:407,issues,warnings:[],pass:!issues.length};
}
if(import.meta.url==='file://'+process.argv[1]){const r=runPhase407F1TaperedBoostAudit();console.log(JSON.stringify(r));if(!r.pass)process.exitCode=1}
