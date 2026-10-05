import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase293F1ProductionAuditGate(){
 const issues=[],warnings=[];
 const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
 const index=fs.readFileSync('index.html','utf8');
 for(const token of [
  'node --check scripts/run-phase283-f1-general-overtake-defence-audit.mjs',
  'node --check scripts/run-phase288-f1-layout-reset-viewport-fit-audit.mjs',
  'node --check scripts/run-phase291-f1-finish-podium-result-overlay-audit.mjs',
  'node --check scripts/run-phase292-f1-integrated-desktop-qa-audit.mjs',
  'node --check scripts/run-phase293-f1-production-audit-gate.mjs',
  'node --check assets/f1-racing-r283-r287.js',
  'node --check assets/f1-racing-r288-r290.js',
  'node --check assets/f1-racing-r291-r295.js',
  '- name: Recovery H F1 live browser QA'
 ])if(!workflow.includes(token))issues.push('Phase 293 production workflow missing: '+token);
 for(const token of ['assets/f1-racing-r291-r295.js?phase=','assets/f1-racing-r291-r295.css?phase='])if(!index.includes(token))issues.push('Phase 293 final F1 asset missing from index: '+token);
 for(const file of [
  'assets/f1-racing-r283-r287.js',
  'assets/f1-racing-r288-r290.js',
  'assets/f1-racing-r291-r295.js',
  'scripts/run-phase291-f1-finish-podium-result-overlay-audit.mjs',
  'scripts/run-phase292-f1-integrated-desktop-qa-audit.mjs'
 ]){
  const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(syntax.status!==0)issues.push(file+' syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 }
 const result={phase:293,name:'f1-production-audit-gate',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase293F1ProductionAuditGate();
