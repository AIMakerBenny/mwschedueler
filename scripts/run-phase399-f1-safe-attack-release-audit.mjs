import fs from 'node:fs';import {spawnSync} from 'node:child_process';
export function runPhase399F1SafeAttackReleaseAudit(){
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),
 cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8'),issues=[],warnings=[];
 for(const s of ['const LIVE_PASS_RELEASE_V399=','function qaSafeAttackReleaseV399(){','window.mwsF1QaSafeAttackReleaseV399=qaSafeAttackReleaseV399;'])
 if(!core.includes(s))issues.push('missing safe attack release '+s);
 if(!live.includes('Phase 399 bounded attack release Chromium QA failed')||!live.includes('attackReleaseV399:attackRelease399||null'))issues.push('missing browser QA');
 if(!cum.includes('runPhase399F1SafeAttackReleaseAudit()')||!cum.includes('runPhase399FullIntegrationAudit()'))issues.push('missing cumulative audit');
 for(const p of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-current-full-integration-audit.mjs']){
 const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(r.status!==0)issues.push('syntax '+p+' '+String(r.stderr).slice(0,320));}
 const result={phase:399,name:'f1-safe-attack-release',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;}
if(import.meta.url==='file://'+process.argv[1])runPhase399F1SafeAttackReleaseAudit();
