import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase282F1DialogueLongRunDesktopAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<282)issues.push('Phase 282 asset cache missing');
 for(const token of ["const VERSION282='phase282-dialogue-long-run-desktop-qa';",'function qaDialogueLongRunDesktopV282(','microHistory:micro.history.length<=120','characterHistory:characterDialogueStateV277.history.length<=60','conversationEntries:conversation.entries.length<=LIVE_CONVERSATION_CONFIG_V276.maxVisible','trackCount:Number(benchmark?.trackCount)||0','window.mwsF1QaDialogueLongRunDesktopV282=qaDialogueLongRunDesktopV282;','window.__mwsF1RacingV282=VERSION282;'])if(!racing.includes(token))issues.push('Phase 282 runtime missing: '+token);
 for(const token of ['Phase 282 integrated long-run QA failed','Phase 282 seven-track benchmark failed','Phase 282 dialogue memory bounds failed','Phase 282 desktop dialogue integration failed'])if(!live.includes(token))issues.push('Phase 282 Recovery H missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:282,name:'f1-dialogue-long-run-desktop-qa',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase282F1DialogueLongRunDesktopAudit();

// Phase 282 production retrigger after GitHub runner queue stall.
