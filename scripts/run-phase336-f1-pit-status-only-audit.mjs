import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase336F1PitStatusOnlyAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of [
  "const VERSION336='phase336-f1-pit-status-only';",
  "if(['PIT_ENTRY','PIT_LANE','PIT_BOX','PIT_EXIT'].includes(state)||vehicle?.pitRequested)return '피트';",
  "recordTechnicalCommentaryV263(name+' pit state '+pitEvent,'PIT_STATUS');",
  "recordTechnicalCommentaryV263(name+' pit request '+target,'PIT_STATUS');",
  "function qaPitStatusOnlyV336(){",
  "window.mwsF1QaPitStatusOnlyV336=qaPitStatusOnlyV336;",
  "window.__mwsF1RacingV336=VERSION336;"
 ])if(!core.includes(token))issues.push('Phase 336 core missing: '+token);
 const commentaryStart=core.indexOf('function updateRaceCommentaryV219('),commentaryEnd=core.indexOf('function qaRaceCommentaryV219(',commentaryStart),commentary=commentaryStart>=0&&commentaryEnd>commentaryStart?core.slice(commentaryStart,commentaryEnd):'';
 const narrativeStart=core.indexOf('function updateRaceNarrativeV222('),narrativeEnd=core.indexOf('function qaCommentaryCadenceV227(',narrativeStart),narrative=narrativeStart>=0&&narrativeEnd>narrativeStart?core.slice(narrativeStart,narrativeEnd):'';
 for(const phrase of ['피트로 들어갑니다.','피트 스톱을 진행합니다.','피트에서 트랙으로 복귀했습니다.'])if(commentary.includes(phrase))issues.push('Phase 336 visible pit commentary remains: '+phrase);
 if(narrative.includes("emitRaceNarrativeV263('PIT_TACTIC'"))issues.push('Phase 336 pit tactic still emits into visible narrative');
 for(const token of ['Phase 336 runtime did not propagate to Recovery H browser','Phase 336 pit status-only QA failed','Phase 336 pit commentary leaked into visible event log'])if(!diag.includes(token))issues.push('Phase 336 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase336-f1-pit-status-only-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:336,name:'f1-pit-status-only',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase336F1PitStatusOnlyAudit();
