import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase277F1CharacterDialogueEngineAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const phases=[...index.matchAll(/recovery=N1&phase=(\d+)/g)].map(m=>Number(m[1]));if(!phases.some(v=>v>=277))issues.push('Phase 277 asset cache missing');
 for(const token of ["const VERSION277='phase277-character-dialogue-engine';",'const CHARACTER_DIALOGUE_EVENT_ROLES_V277=Object.freeze({','const CHARACTER_DIALOGUE_POOL_V277=Object.freeze({','function emitCharacterDialogueEventV277(','function handlePassDialogueV277(','function raceInfoTextV277(','function appendRaceInfoV277(','function qaCharacterDialogueEngineV277(){',"handlePassDialogueV277(vehicle,dialogueTarget,current,next);","emitCharacterDialogueEventV277('MISTAKE',vehicle,dialogueFollowerV277(vehicle)","emitCharacterDialogueEventV277('BURST',vehicle,target","if(typeof appendRaceInfoV277==='function')return appendRaceInfoV277(event,vehicle,target,options);",'window.mwsF1QaCharacterDialogueEngineV277=qaCharacterDialogueEngineV277;','window.__mwsF1RacingV277=VERSION277;'])if(!racing.includes(token))issues.push('Phase 277 runtime missing: '+token);
 for(const token of ['ATTACKER','DEFENDER','MISTAKE_DRIVER','OPPORTUNIST','WINNER','PASSED','ATTACKER_FAIL','DEFENDER_SUCCESS','REATTACKER'])if(!racing.includes(token))issues.push('Phase 277 role missing: '+token);
 for(const token of ['Phase 277 character dialogue QA failed','Phase 277 event-role mapping incomplete','Phase 277 commentary bracket format failed'])if(!live.includes(token))issues.push('Phase 277 Recovery H missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:277,name:'f1-character-dialogue-engine',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase277F1CharacterDialogueEngineAudit();
