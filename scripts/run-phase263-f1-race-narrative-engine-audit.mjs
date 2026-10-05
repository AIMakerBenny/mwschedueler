import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase263F1RaceNarrativeEngineAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<263)issues.push('Phase 263 asset cache missing');
  for(const token of ["const VERSION263='phase263-race-narrative-engine';",'const NARRATIVE_EVENTS_V263=Object.freeze([','const NARRATIVE_TEMPLATES_V263=Object.freeze(','recentLimit:15','function narrativeTemplateV263(','function formatNarrativeV263(','function emitRaceNarrativeV263(','function narrativeEventFromBattleStateV263(','function qaRaceNarrativeEngineV263(){',"emitRaceNarrativeV263('PASS_SUCCESS'","emitRaceNarrativeV263('FINAL_LAP'","emitRaceNarrativeV263('PIT_TACTIC'",'recordTechnicalCommentaryV263(','window.mwsF1QaRaceNarrativeEngineV263=qaRaceNarrativeEngineV263;','window.__mwsF1RacingV263=VERSION263;'])if(!racing.includes(token))issues.push('Phase 263 runtime missing: '+token);
  const eventDecl=racing.slice(racing.indexOf('const NARRATIVE_EVENTS_V263='),racing.indexOf('const NARRATIVE_BASES_V263='));
  for(const event of ['APPROACH','PRESSURE','OPENING','ATTACK','SIDE_BY_SIDE','BRAKING','CORNER_BATTLE','DEFENCE','PASS_SUCCESS','PASS_FAILED','COUNTER_ATTACK','MISTAKE','RECOVERY','FAST_LAP','FINAL_LAP','LEADER_BATTLE','PIT_TACTIC'])if(!eventDecl.includes("'"+event+"'"))issues.push('Phase 263 event missing: '+event);
  const picker=racing.slice(racing.indexOf('function narrativeTemplateV263('),racing.indexOf('function formatNarrativeV263('));
  if(picker.includes('Math.random'))issues.push('Phase 263 narrative picker must be deterministic');if(!picker.includes('hashDriverV189('))issues.push('Phase 263 seeded picker missing');
  for(const token of ['Phase 263 narrative engine QA failed','templateCount','eventCount','recentLimit'])if(!live.includes(token))issues.push('Phase 263 Recovery H QA missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:263,name:'f1-race-narrative-engine',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase263F1RaceNarrativeEngineAudit();
