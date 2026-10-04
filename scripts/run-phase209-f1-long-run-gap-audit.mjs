import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase209F1LongRunGapAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!/recovery=N1&phase=(?:209|21[0-9]|22[0-9])/.test(index))issues.push('Phase 209+ racing asset cache missing');
  for(const token of [
    "const VERSION209='phase209-long-run-gap-balance';",
    'const LONG_RUN_GAP_CONFIG_V209=Object.freeze({settlingLaps:3.5,maxOpeningPaceBias:0.0045,maxSettledPaceBias:0.0018',
    'function fieldMeanPaceNormV209(vehicles=raceMotionV189.vehicles){',
    'function longRunPaceBiasV209(vehicle,lapAge=',
    'function longRunPaceCorrectionV209(vehicle,lapAge=',
    'const longRunPaceMultiplier=longRunPaceCorrectionV209(vehicle);',
    'vehicle.longRunPaceBias=longRunPaceBiasV209(vehicle);',
    'function qaLongRunGapBalanceV209(){',
    'paceOnlyThirtyLapSpreadSeconds',
    'gapDependency:false',
    'systemsConnected',
    'window.mwsF1QaLongRunGapBalanceV209=qaLongRunGapBalanceV209;',
    'window.__mwsF1RacingV209=VERSION209;'
  ])if(!racing.includes(token))issues.push('Phase 209 runtime missing: '+token);

  const fnStart=racing.indexOf('function longRunPaceBiasV209(');
  const fnEnd=racing.indexOf('function longRunPaceCorrectionV209(',fnStart);
  const biasBody=fnStart>=0&&fnEnd>fnStart?racing.slice(fnStart,fnEnd):'';
  if(/\bgap\b|gapMeters|gapSeconds|intervalSeconds|position/.test(biasBody))issues.push('Phase 209 pace bias depends on live gap/position rubber band input');

  const stepStart=racing.indexOf('function simulateRaceStepV192(');
  const stepEnd=racing.indexOf('function raceFrameV189(',stepStart);
  const stepBody=stepStart>=0&&stepEnd>stepStart?racing.slice(stepStart,stepEnd):'';
  for(const token of ['updateSlipstreamStatesV198();','updateDirtyAirStatesV199();','updateTrafficAndDefenceV207();','updatePassStateMachineV208(stepMs);','updatePitStrategiesV206(stepMs);','simulateVehicleDynamicsV196(vehicle,stepMs);']){
    if(!stepBody.includes(token))issues.push('Phase 209 existing race system disconnected: '+token);
  }

  for(const token of ["mwsF1QaLongRunGapBalanceV209?.()","paceOnlyThirtyLapSpreadSeconds)<=14","gapDependency===false","systemsConnected===true"])if(!diag.includes(token))issues.push('Phase 209 live QA missing: '+token);
  for(const token of ['node --check scripts/run-phase209-f1-long-run-gap-audit.mjs',"echo '[phase209] F1 long-run gap balance'"])if(!workflow.includes(token))issues.push('Phase 209 workflow missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:209,name:'f1-long-run-gap-balance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase209F1LongRunGapAudit();
