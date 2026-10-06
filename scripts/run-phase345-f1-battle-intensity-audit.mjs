import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase345F1BattleIntensityAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of ["const VERSION345='phase345-f1-battle-intensity';",'const RACE_BATTLE_CONFIG_V345=Object.freeze({','normal:Object.freeze({gapFactor:1.18','fast:Object.freeze({gapFactor:1.58','function raceBattleTuningV345(','const battleGapFactorV345=raceBattleGapFactorV345();','const effectiveGapMetersV345=gapMeters/','const battleTuneV345=raceBattleTuningV345(),battleRangeV345=','activationChanceV345','function qaBattleIntensityV345(){','window.mwsF1QaBattleIntensityV345=qaBattleIntensityV345;','window.__mwsF1RacingV345=VERSION345;'])if(!core.includes(token))issues.push('Phase 345 core missing: '+token);
 for(const token of ['Phase 345 runtime did not propagate to Recovery H browser','Phase 345 battle intensity QA failed','Phase 345 normal race remains too static'])if(!diag.includes(token))issues.push('Phase 345 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/run-phase345-f1-battle-intensity-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:345,name:'f1-battle-intensity',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase345F1BattleIntensityAudit();
