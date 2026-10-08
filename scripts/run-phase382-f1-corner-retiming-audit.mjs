import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase382F1CornerRetimingAudit(){
 const issues=[],warnings=[],src=fs.readFileSync('assets/f1-racing-v1.js','utf8'),
 diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),
 cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8'),
 wf=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
 for(const t of ["const VERSION382='phase382-angle-braking-midcorner-acceleration';",'function cornerRetimingV382(','const plan=cornerRetimingV382(cornerDrivingPlanV375(', 'window.mwsF1QaCornerRetimingV382=qaCornerRetimingV382;','!neighborSafetyV381.active&&!incidentState.active'])if(!src.includes(t))issues.push('missing '+t);
 const x=src.indexOf('const CORNER_RETIMING_V382='),y=src.indexOf('function cornerTargetAtDistanceV351(',x);
 if(x<0||y<x||/\b(?:raceProgress|progress)\s*=/.test(src.slice(x,y)))issues.push('corner helper changes position');
 if(!diag.includes('Phase 382 corner retiming QA failed')||!diag.includes('cornerRetimingV382:cornerRetiming382||null'))issues.push('browser qa missing');
 if(!cum.includes('runPhase382FullIntegrationAudit')||!wf.includes("echo '[phase382]"))issues.push('cumulative/workflow missing');
 for(const p of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase382-f1-corner-retiming-audit.mjs']){const o=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(o.status!==0)issues.push('syntax '+p+' '+String(o.stderr).slice(0,600))}
 const result={phase:382,name:'f1-corner-retiming',issues,warnings,pass:!issues.length};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase382F1CornerRetimingAudit();
