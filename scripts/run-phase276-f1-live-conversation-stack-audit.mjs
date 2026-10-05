import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase276F1LiveConversationStackAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),css=fs.readFileSync('assets/f1-racing-v1.css','utf8'),live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const phases=[...index.matchAll(/recovery=N1&phase=(\d+)/g)].map(m=>Number(m[1]));if(!phases.some(v=>v>=276))issues.push('Phase 276 asset cache missing');
 for(const token of ["const VERSION276='phase276-live-conversation-stack-ui';",'const LIVE_CONVERSATION_CONFIG_V276=Object.freeze({','function appendLiveConversationV276(','function scheduleLiveConversationExitV276(','function qaLiveConversationStackV276(){','resetLiveConversationV276();','window.mwsF1QaLiveConversationStackV276=qaLiveConversationStackV276;','window.__mwsF1RacingV276=VERSION276;'])if(!racing.includes(token))issues.push('Phase 276 runtime missing: '+token);
 for(const token of ['id="f1RacingConversationStackV276"','LIVE 캐릭터 대화'])if(!index.includes(token))issues.push('Phase 276 DOM missing: '+token);
 for(const token of ['/* Phase 276: LIVE conversation stack */','.f1-racing-conversation-stack-v276.group-exit-v276','.f1-racing-conversation-bubble-v276.left','.f1-racing-conversation-bubble-v276.right'])if(!css.includes(token))issues.push('Phase 276 CSS missing: '+token);
 for(const token of ['Phase 276 conversation stack QA failed','Phase 276 conversation side alternation failed','Phase 276 conversation duration bounds failed'])if(!live.includes(token))issues.push('Phase 276 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs']){const syntax=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(syntax.status!==0)issues.push(file+' syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim())}
 const result={phase:276,name:'f1-live-conversation-stack-ui',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase276F1LiveConversationStackAudit();
