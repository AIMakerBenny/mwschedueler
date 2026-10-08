import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase384F1SafeThirdPartyPitAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),
 diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),
 wf=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8'),
 cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 for(const s of ["const VERSION384='phase384-safe-third-party-and-pit-rejoin';",'function pitRejoinSafetyV384(','const safeThirdV384=thirdWindowV376.active&&thirdCapacityV383.available;','if(safeThirdV384){vehicle.racingLineMode=','const pitRejoinV384=pitRejoinSafetyV384(vehicle,track);','window.mwsF1QaSafeThirdPartyPitV384=qaSafeThirdPartyPitV384;'])if(!core.includes(s))issues.push('missing '+s);
 if(!diag.includes('Phase 384 third-party and pit-merge QA failed')||!diag.includes('safeThirdPitV384:safeThirdPit384||null'))issues.push('Chromium QA missing');
 if(!cum.includes('runPhase384FullIntegrationAudit')||!wf.includes("echo '[phase384]"))issues.push('cumulative workflow missing');
 const a=core.indexOf('const PIT_REJOIN_SAFETY_V384='),b=core.indexOf('function updatePassStateMachineV208(',a);
 if(a<0||b<a||/\b(?:raceProgress|progress)\s*=/.test(core.slice(a,b)))issues.push('pit merge forcibly repositions car');
 for(const p of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase384-f1-safe-third-party-pit-audit.mjs']){const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(r.status!==0)issues.push('syntax '+p+' '+String(r.stderr).slice(0,600))}
 const result={phase:384,name:'f1-third-party-pit-rejoin',issues,warnings,pass:!issues.length};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase384F1SafeThirdPartyPitAudit();
