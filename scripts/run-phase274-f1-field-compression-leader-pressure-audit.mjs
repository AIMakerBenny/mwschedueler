import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase274F1FieldCompressionLeaderPressureAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const phases=[...index.matchAll(/recovery=N1&phase=(\d+)/g)].map(m=>Number(m[1]));if(!phases.some(v=>v>=274))issues.push('Phase 274 asset cache missing');
  for(const token of [
    "const VERSION274='phase274-field-compression-leader-pressure';",
    'const LEADER_PRESSURE_CONFIG_V274=Object.freeze({',
    'const LEADER_PRESSURE_EVENTS_V274=Object.freeze({',
    'function leaderPressureScoreV274(',
    'function leaderPressureContextV274(',
    'function triggerLeaderPressureEventV274(',
    'function leaderPressureEffectV274(',
    'function updateFieldCompressionLeaderPressureV274(',
    'function getLeaderPressureStatesV274(){',
    'function qaLeaderPressureV274(){',
    'updateFieldCompressionLeaderPressureV274(stepMs);',
    'maxTarget*=leaderPressureEffect.speedFactor;',
    'leaderPressureLateralMetersV274',
    'window.mwsF1QaLeaderPressureV274=qaLeaderPressureV274;',
    'window.__mwsF1RacingV274=VERSION274;'
  ])if(!racing.includes(token))issues.push('Phase 274 runtime missing: '+token);
  for(const token of ['EARLY_BRAKING','LATE_TURN_IN','MISSED_APEX','STEERING_CORRECTION','SHORT_THROTTLE_LIFT'])if(!racing.includes(token))issues.push('Phase 274 pressure event missing: '+token);
  for(const token of ['Phase 274 leader pressure QA failed','Phase 274 pressure state invalid','Phase 274 tight-fight suppression missing'])if(!live.includes(token))issues.push('Phase 274 Recovery H missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:274,name:'f1-field-compression-leader-pressure',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase274F1FieldCompressionLeaderPressureAudit();
