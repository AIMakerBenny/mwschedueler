import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase376F1MulticarCorridorAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  const cumulative=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
  for(const token of ["const VERSION376='phase376-f1-multicar-corridor-proximity';",'const MULTICAR_CORRIDOR_V376=Object.freeze({','function availableParallelCapacityV376(','function thirdCarOpportunityV376(','function rapidPassStateV376(','function physicalProximityControlV376(','const thirdWindowV376=thirdCarOpportunityV376(vehicle,target,isolationV319.locks,phase,gapMeters);','vehicle.proximityV376=proximityV376;','function qaMulticarCorridorV376(){','window.mwsF1QaMulticarCorridorV376=qaMulticarCorridorV376;','window.__mwsF1RacingV376=VERSION376;'])if(!core.includes(token))issues.push('Missing Phase376 '+token);
  const a=core.slice(core.indexOf('function lateralOpportunityV376('),core.indexOf('function updatePassStateMachineV208('));
  if(/\b(?:raceProgress|progress)\s*=/.test(a))issues.push('Phase 376 forcibly alters progress');
  if(!diag.includes('Phase 376 three-wide bypass and physical proximity QA failed')||!diag.includes('multicarV376:multicar376||null'))issues.push('Live verification Phase376 missing');
  if(!workflow.includes("echo '[phase376] F1 3-wide pass and physical proximity'")||!workflow.includes('node --check scripts/run-phase376-f1-multicar-corridor-audit.mjs'))issues.push('Workflow Phase376 missing');
  if(!cumulative.includes('runPhase376F1MulticarCorridorAudit')||!cumulative.includes('export function runPhase376FullIntegrationAudit()'))issues.push('Cumulative Phase376 missing');
  for(const path of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase376-f1-multicar-corridor-audit.mjs']){
    const check=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});if(check.status!==0)issues.push('Syntax '+path+': '+String(check.stderr||check.stdout).slice(0,850));
  }
  const result={phase:376,name:'f1-multicar-corridor-proximity',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase376F1MulticarCorridorAudit();
