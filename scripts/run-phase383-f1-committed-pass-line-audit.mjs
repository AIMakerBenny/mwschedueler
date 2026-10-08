import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase383F1CommittedPassLineAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),
 diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),wf=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8'),
 cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 for(const s of ["const VERSION383='phase383-committed-pass-line-capacity';",'function committedPassLineV383(','function validateThirdLaneV383(','!committedPassLineV383(vehicle)','thirdCapacityV383.available','window.mwsF1QaCommittedPassLineV383=qaCommittedPassLineV383;'])if(!core.includes(s))issues.push('missing '+s);
 const a=core.indexOf('const PASS_LINE_COMMIT_V383='),b=core.indexOf('function updateTrafficAndDefenceV207(',a);
 if(a<0||b<a||/\b(?:raceProgress|progress)\s*=/.test(core.slice(a,b)))issues.push('forced position');
 if(!diag.includes('Phase 383 committed pass-line QA failed')||!diag.includes('committedPassLineV383:passLine383||null'))issues.push('browser QA missing');
 if(!wf.includes("echo '[phase383]")||!cum.includes('runPhase383FullIntegrationAudit'))issues.push('cumulative/workflow missing');
 for(const p of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase383-f1-committed-pass-line-audit.mjs']){const c=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(c.status!==0)issues.push('syntax '+p+' '+String(c.stderr).slice(0,500))}
 const result={phase:383,name:'f1-committed-pass-line',issues,warnings,pass:!issues.length};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase383F1CommittedPassLineAudit();
