import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase371F1PhysicalPassClearanceAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  const cumulative=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
  for(const token of ["const VERSION371='phase371-f1-physical-pass-clearance';",'function overtakeSpacingClearanceV371(','const passClearanceV371=overtakeSpacingClearanceV371(vehicle,ahead,passSeparation);',"'PHYSICAL_PASS_CLEARANCE_V371'",'function qaPhysicalPassClearanceV371(){','window.mwsF1QaPhysicalPassClearanceV371=qaPhysicalPassClearanceV371;','window.__mwsF1RacingV371=VERSION371;'])if(!core.includes(token))issues.push('Phase 371 runtime token missing: '+token);
  const functionSource=core.slice(core.indexOf('function overtakeSpacingClearanceV371('),core.indexOf('function naturalRaceSpacingControlV370('));
  if(!functionSource.includes('samePair')||!functionSource.includes('!vehicle?.battleBlockedV319')||!functionSource.includes('passSeparation?.visualReady===true')||!functionSource.includes('passSeparation?.physicalIntentReady===true'))issues.push('Phase 371 physical separation gate invalid');
  if(/\b(?:raceProgress|progress)\s*=/.test(functionSource))issues.push('Phase 371 illegally changes race progress');
  if(!diag.includes('Phase 371 physical pass clearance QA failed')||!diag.includes('physicalPassV371:physicalPass371||null'))issues.push('Recovery H Phase 371 QA not wired');
  if(!workflow.includes("echo '[phase371] F1 real physical pass clearance'")||!workflow.includes('node --check scripts/run-phase371-f1-physical-pass-clearance-audit.mjs'))issues.push('Production workflow Phase 371 missing');
  if(!cumulative.includes('runPhase371F1PhysicalPassClearanceAudit')||!cumulative.includes('return runPhase371FullIntegrationAudit();'))issues.push('Cumulative Phase 371 audit missing');
  for(const path of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs', 'scripts/run-phase371-f1-physical-pass-clearance-audit.mjs']){
    const run=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
    if(run.status!==0)issues.push('Syntax error: '+path+' '+String(run.stderr||run.stdout).slice(0,800));
  }
  const result={phase:371,name:'f1-physical-pass-clearance',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase371F1PhysicalPassClearanceAudit();
