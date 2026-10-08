import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase380F1BehaviorTelemetryAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),wf=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8'),cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 for(const x of ["const VERSION380='phase380-seven-behavior-baseline-telemetry';",'function recordBehaviorPhysicsV380(','function recordBehaviorFrameV380(','window.mwsF1QaBehaviorTelemetryV380=qaBehaviorTelemetryV380;','recordBehaviorPhysicsV380(vehicle,phase,proximityV376,spacingControlV319)','recordBehaviorFrameV380(rendered,atMax)'])if(!core.includes(x))issues.push('missing '+x);
 const a=core.indexOf('const behaviorTelemetryV380='),b=core.indexOf('function recordScreenCrowdingV363(',a);
 if(a<0||b<a||/\b(?:raceProgress|progress)\s*=/.test(core.slice(a,b)))issues.push('telemetry mutates progress');
 if(!diag.includes('Phase 380 telemetry QA failed')||!diag.includes('behaviorTelemetryV380:behaviorTelemetry380||null'))issues.push('Chromium telemetry QA missing');
 if(!wf.includes("echo '[phase380]")||!cum.includes('runPhase380FullIntegrationAudit'))issues.push('cumulative/workflow missing');
 for(const p of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase380-f1-behavior-telemetry-audit.mjs']){const t=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(t.status!==0)issues.push('syntax '+p+' '+String(t.stderr).slice(0,500))}
 const out={phase:380,name:'f1-7-behavior-telemetry',issues,warnings,pass:!issues.length};console.log(JSON.stringify(out));if(issues.length)process.exitCode=1;return out;
}
if(import.meta.url==='file://'+process.argv[1])runPhase380F1BehaviorTelemetryAudit();
