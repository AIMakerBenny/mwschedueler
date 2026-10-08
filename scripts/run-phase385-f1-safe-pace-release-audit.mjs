import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase385F1SafePaceReleaseAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),
 diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),wf=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8'),
 cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 for(const s of ["const VERSION385='phase385-safe-acceleration-release';",'function safePaceReleaseV385(','const paceReleaseV385=safePaceReleaseV385(vehicle,','*paceReleaseV385.multiplier;','window.mwsF1QaSafePaceReleaseV385=qaSafePaceReleaseV385;'])if(!core.includes(s))issues.push('missing '+s);
 const a=core.indexOf('const PACE_RELEASE_V385='),b=core.indexOf('function longitudinalResponseV375(',a);
 if(a<0||b<a||/\b(?:raceProgress|progress)\s*=/.test(core.slice(a,b)))issues.push('forced progress');
 if(!diag.includes('Phase 385 safe pace release QA failed')||!diag.includes('paceReleaseV385:paceRelease385||null'))issues.push('Chromium QA missing');
 if(!wf.includes("echo '[phase385]")||!cum.includes('runPhase385FullIntegrationAudit'))issues.push('workflow/cumulative missing');
 for(const p of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase385-f1-safe-pace-release-audit.mjs']){const c=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(c.status!==0)issues.push('syntax '+p+' '+String(c.stderr).slice(0,500))}
 const result={phase:385,name:'f1-safe-pace-release',issues,warnings,pass:!issues.length};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase385F1SafePaceReleaseAudit();
