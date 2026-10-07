import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase374F1FinalStintPitEconomicsAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  const cumulative=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
  for(const token of ["const VERSION374='phase374-f1-final-stint-pit-economics';",'const FINAL_STINT_PIT_ECONOMICS_V374=Object.freeze({','function finalStintPitEconomicsV374(','const finalStintEconomicsV374=finalStintPitEconomicsV374(vehicle,context);',"'FINAL_STINT_PIT_COST_HIGH_V374'",'function qaFinalStintPitEconomicsV374(){','window.mwsF1QaFinalStintPitEconomicsV374=qaFinalStintPitEconomicsV374;','window.__mwsF1RacingV374=VERSION374;'])if(!core.includes(token))issues.push('Phase 374 core token missing: '+token);
  const source=core.slice(core.indexOf('function finalStintPitEconomicsV374('),core.indexOf('function evaluatePitStrategyV206('));
  if(/\b(?:raceProgress|progress)\s*=/.test(source))issues.push('Phase 374 directly edits progress');
  if(!source.includes('secondStop&&remaining<=cfg.maxEvaluationLaps&&!severeDamage&&projectedBenefitSeconds<pitLossSeconds'))issues.push('Phase 374 economic/safety gate missing');
  if(!core.includes("else if(finalStintEconomicsV374.avoid)")&&!core.includes("}else if(finalStintEconomicsV374.avoid)"))issues.push('Phase 374 strategy integration missing');
  if(!diag.includes('Phase 374 final stint pit economics QA failed')||!diag.includes('finalPitV374:finalPit374||null'))issues.push('Recovery H Phase 374 verification missing');
  if(!workflow.includes("echo '[phase374] F1 final stint pit economy and tyre safety'")||!workflow.includes('node --check scripts/run-phase374-f1-final-stint-pit-economics-audit.mjs'))issues.push('Phase 374 workflow integration missing');
  if(!cumulative.includes('runPhase374F1FinalStintPitEconomicsAudit')||!cumulative.includes('export function runPhase374FullIntegrationAudit()'))issues.push('Phase 374 cumulative audit missing');
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase374-f1-final-stint-pit-economics-audit.mjs']){
    const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status!==0)issues.push('Syntax error: '+file+' '+String(result.stderr||result.stdout||'').slice(0,800));
  }
  const result={phase:374,name:'f1-final-stint-pit-economics',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase374F1FinalStintPitEconomicsAudit();
