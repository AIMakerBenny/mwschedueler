import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase351F1PhysicsCornerBrakeReleaseAudit(){
  const issues=[],warnings=[];
  const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  for(const token of [
    "const VERSION351='phase351-f1-physics-corner-brake-release';",
    "const CORNER_DRIVING_V351=Object.freeze({",
    "function cornerApexTargetV351(",
    "function cornerDrivingPlanV351(",
    "function cornerTargetAtDistanceV351(",
    "vehicle.cornerRecoveryActiveV351=here>=plan.recoveryStart&&here<=plan.exit;",
    "const cornerRecoveryV351=Boolean(vehicle.cornerRecoveryActiveV351);",
    "cornerMinSpeedByClassV351",
    "cornerRecoveryThrottleCountV351",
    "function qaPhysicsCornerBrakeReleaseV351(){",
    "window.mwsF1QaPhysicsCornerBrakeReleaseV351=qaPhysicsCornerBrakeReleaseV351;",
    "window.__mwsF1RacingV351=VERSION351;"
  ])if(!core.includes(token))issues.push('Phase 351 core missing: '+token);
  const legacyEnvelope=core.includes("hairpin:Object.freeze({min:62,max:115,entryRetention:.27");
  const revisedEnvelope=core.includes("hairpin:Object.freeze({min:75,max:120,entryRetention:.30");
  if(!legacyEnvelope&&!revisedEnvelope)issues.push('Phase 351 corner speed envelope missing or unsupported');
  const targetStart=core.indexOf('function phaseSpeedTargetV343(');
  const targetEnd=core.indexOf('function trackLateralLimitV271(',targetStart);
  const targetBody=targetStart>=0&&targetEnd>targetStart?core.slice(targetStart,targetEnd):'';
  if(targetBody.includes("if(phase==='APEX')return apexTarget"))issues.push('Phase 351 legacy apex hold still blocks mid-corner recovery');
  if(!targetBody.includes('cornerTargetAtDistanceV351(plan,here,raw,exitTarget)'))issues.push('Phase 351 physics target curve not connected');
  for(const token of [
    "Phase 351 runtime did not propagate to Recovery H browser",
    "Phase 351 physics corner brake/release QA failed",
    "cornerDrivingV351:cornerDriving351||null"
  ])if(!diag.includes(token))issues.push('Phase 351 Recovery H missing: '+token);
  if(!diag.includes("Phase 350 field spread remains excessive")&&!diag.includes("Phase 352 field spread remains excessive"))issues.push("Phase 351/352 field spread Recovery H gate missing");
  for(const token of [
    "node --check scripts/run-phase351-f1-physics-corner-brake-release-audit.mjs",
    "[phase351] F1 physics corner braking, apex release, and exit acceleration",
    "window.__mwsF1RacingV351=VERSION351;"
  ])if(!workflow.includes(token))issues.push('Phase 351 workflow missing: '+token);
  for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase351-f1-physics-corner-brake-release-audit.mjs']){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }
  const result={phase:351,name:'f1-physics-corner-brake-release',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase351F1PhysicsCornerBrakeReleaseAudit();
