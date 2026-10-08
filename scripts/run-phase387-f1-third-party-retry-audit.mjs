import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase387F1ThirdPartyRetryAudit(){
 const issues=[],warnings=[];
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 const required=["const attemptWindowV387=Math.floor(","'|third-v387'","function qaThirdPartyRetryV387(){","window.mwsF1QaThirdPartyRetryV387=qaThirdPartyRetryV387;"];
 for(const part of required)if(!core.includes(part))issues.push('missing runtime '+part);
 if(!diag.includes('Phase 387 third-party retry Chromium QA failed')||!diag.includes('thirdPartyRetryV387:thirdRetry387||null'))issues.push('missing real Chromium verification');
 if(!cum.includes('runPhase387FullIntegrationAudit()')||!cum.includes('runPhase387F1ThirdPartyRetryAudit()'))issues.push('missing cumulative integration');
 const fn=/function thirdCarOpportunityV376\([\s\S]*?\n\}/.exec(core)?.[0]||'';
 if(/\b(?:raceProgress|progress|travel|finishPosition)\s*=/.test(fn))issues.push('forbidden race coordinate mutation');
 for(const p of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-current-full-integration-audit.mjs']){
  const v=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});
  if(v.status!==0)issues.push('syntax '+p+' '+String(v.stderr).slice(0,500));
 }
 const result={phase:387,name:'f1-third-party-attempt-renewal',issues,warnings,pass:!issues.length};
 console.log(JSON.stringify(result));
 if(issues.length)process.exitCode=1;
 return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase387F1ThirdPartyRetryAudit();
