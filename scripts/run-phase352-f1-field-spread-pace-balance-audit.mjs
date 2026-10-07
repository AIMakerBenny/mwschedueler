import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase352F1FieldSpreadPaceBalanceAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
 for(const token of [
  "const VERSION352='phase352-f1-field-spread-pace-balance';",
  "const FIELD_SPREAD_BALANCE_V352=Object.freeze({normalFormAmplitude:.012,fastFormAmplitude:.028,maxFinishSpreadSeconds:48});",
  "activeBattleDirtyAirScale:.44,blockedBattleDirtyAirScale:.52",
  "blockedCatchupRetention:1.00",
  "const amplitude=mode==='FAST'?FIELD_SPREAD_BALANCE_V352.fastFormAmplitude:FIELD_SPREAD_BALANCE_V352.normalFormAmplitude;",
  "function qaFieldSpreadPaceBalanceV352(){",
  "window.mwsF1QaFieldSpreadPaceBalanceV352=qaFieldSpreadPaceBalanceV352;",
  "window.__mwsF1RacingV352=VERSION352;"
 ])if(!core.includes(token))issues.push('Phase 352 core missing: '+token);
 const v350Start=core.indexOf('function battleQueueSpeedControlV350('),v350End=core.indexOf('function simulateVehicleDynamicsV196(',v350Start);
 const v350Body=v350Start>=0&&v350End>v350Start?core.slice(v350Start,v350End):'';
 if(/\b(?:raceProgress|progress)\s*=/.test(v350Body))issues.push('Phase 352 balance regressed into direct position forcing');
 for(const token of ['Phase 352 runtime did not propagate to Recovery H browser','Phase 352 field spread pace balance QA failed','Phase 352 field spread remains excessive','Phase 351 real corner speed/recovery telemetry failed','fieldBalanceV352:fieldBalance352||null'])if(!diag.includes(token))issues.push('Phase 352 Recovery H missing: '+token);
 for(const token of ['node --check scripts/run-phase352-f1-field-spread-pace-balance-audit.mjs','[phase352] F1 field spread pace balance without forced position compression','window.__mwsF1RacingV352=VERSION352;'])if(!workflow.includes(token))issues.push('Phase 352 workflow missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase352-f1-field-spread-pace-balance-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:352,name:'f1-field-spread-pace-balance',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase352F1FieldSpreadPaceBalanceAudit();
