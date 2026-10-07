import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase373F1FinishSpreadDiagnosticsAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  const cumulative=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
  for(const token of ["const VERSION373='phase373-f1-finish-spread-diagnostics';",'function finishSpreadBreakdownV373(','breakdownV373:finishSpreadBreakdownV373(normal)','breakdownV373:finishSpreadBreakdownV373(fast)','function qaFieldSpreadDiagnosticsV373(){','window.mwsF1QaFieldSpreadDiagnosticsV373=qaFieldSpreadDiagnosticsV373;','window.__mwsF1RacingV373=VERSION373;'])if(!core.includes(token))issues.push('Phase 373 runtime missing: '+token);
  const source=core.slice(core.indexOf('function finishSpreadBreakdownV373('),core.indexOf('function qaDynamicsPlaytestV348('));
  if(/\b(?:raceProgress|progress)\s*=/.test(source))issues.push('Phase 373 mutates race physics');
  if(!diag.includes('Phase 373 field spread diagnostics QA failed')||!diag.includes('fieldSpreadDiagnosticsV373:spreadDiagnostics373||null'))issues.push('Recovery H diagnostics integration missing');
  if(!workflow.includes("echo '[phase373] F1 finish spread pit and incident diagnostics'")||!workflow.includes('node --check scripts/run-phase373-f1-finish-spread-diagnostics-audit.mjs'))issues.push('Production workflow Phase 373 missing');
  if(!cumulative.includes('runPhase373F1FinishSpreadDiagnosticsAudit')||!cumulative.includes('export function runPhase373FullIntegrationAudit()'))issues.push('Cumulative Phase 373 audit missing');
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase373-f1-finish-spread-diagnostics-audit.mjs']){
    const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(check.status!==0)issues.push('Syntax error: '+file+' '+String(check.stderr||check.stdout||'').slice(0,800));
  }
  const result={phase:373,name:'f1-finish-spread-diagnostics',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase373F1FinishSpreadDiagnosticsAudit();
