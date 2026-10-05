import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase278F1MicroBattleEventsAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<278)issues.push('Phase 278 asset cache missing');
 for(const token of ["const VERSION278='phase278-micro-battle-events';",'const MICRO_BATTLE_EVENTS_V278=Object.freeze([','function updateMicroBattleEventsV278(','function recordMicroBattleEventV278(','function qaMicroBattleEventsV278(){','updateMicroBattleEventsV278(stepMs);','window.mwsF1QaMicroBattleEventsV278=qaMicroBattleEventsV278;','window.__mwsF1RacingV278=VERSION278;'])if(!racing.includes(token))issues.push('Phase 278 runtime missing: '+token);
 for(const token of ['GAP_1_5','GAP_1_0','GAP_0_6','SLIPSTREAM','ATTACK_LINE','DEFENCE_LINE','FAKE','BRAKING_DUEL','CORNER_ENTRY_DUEL','SIDE_BY_SIDE','EDGES_AHEAD','RE_ATTACK','PASS_SUCCESS','PASS_FAIL','COUNTER_ATTACK','FRONT_CAR_MISTAKE','REAR_CAR_MISTAKE','CORNER_EXIT_ADVANTAGE','LEADER_PRESSURE_MISTAKE','BURST_ACTIVATION','BURST_SUCCESS','BURST_FAIL','BURST_END','PODIUM_BATTLE','LAST_PLACE_BATTLE','FINAL_LAP','THREE_CAR_BATTLE'])if(!racing.includes("'"+token+"'"))issues.push('Phase 278 event missing: '+token);
 for(const token of ['Phase 278 micro battle QA failed','Phase 278 event catalog incomplete','Phase 278 threshold detection failed'])if(!live.includes(token))issues.push('Phase 278 Recovery H missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:278,name:'f1-micro-battle-events',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase278F1MicroBattleEventsAudit();
