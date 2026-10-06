import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase279F1ExpandedDialoguePoolAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<279)issues.push('Phase 279 asset cache missing');
 for(const token of ["const VERSION279='phase279-expanded-dialogue-pool';",'const DIALOGUE_POOL_CATEGORIES_V279=Object.freeze({','function buildDialogueVariantsV279(','function characterDialoguePoolV279(','function emitMicroBattleDialogueV279(','function qaExpandedDialoguePoolV279(){','DIALOGUE_RECENT_TEXT_LIMIT_V279=','window.mwsF1QaExpandedDialoguePoolV279=qaExpandedDialoguePoolV279;','window.__mwsF1RacingV279=VERSION279;'])if(!racing.includes(token))issues.push('Phase 279 runtime missing: '+token);
 for(const token of ['ATTACKER','DEFENDER','CHASER','MISTAKE_DRIVER','WINNER','ATTACKER_FAIL','REATTACKER','BURST_DRIVER','BURST_FAIL','FINAL_LAP','THREE_WAY','PODIUM','SPECIAL'])if(!racing.includes(token+':buildDialogueVariantsV279'))issues.push('Phase 279 dialogue category missing: '+token);
 for(const token of ['Phase 279 expanded dialogue pool QA failed','Phase 279 dialogue pool below 300','Phase 279 micro dialogue coverage incomplete'])if(!live.includes(token))issues.push('Phase 279 Recovery H missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:279,name:'f1-expanded-dialogue-pool',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase279F1ExpandedDialoguePoolAudit();
