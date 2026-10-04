import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase226F1CommentaryReadabilityAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<226)issues.push('Phase 226 asset cache missing');
  for(const token of [
    "const VERSION226='phase226-commentary-readability';",
    'const commentaryReadV226={followTail:true,unread:0,lastTextAt:new Map(),bound:false};',
    'function commentaryPriorityV226(type){',
    'function bindCommentaryReadabilityV226(){',
    'if(Number.isFinite(duplicateAt)&&now-duplicateAt<1800)return false;',
    "if(commentaryReadV226.followTail||priority==='critical'){",
    "badge.textContent='새 해설 '+commentaryReadV226.unread+'개';",
    'window.mwsF1QaCommentaryReadabilityV226=qaCommentaryReadabilityV226;',
    'window.__mwsF1RacingV226=VERSION226;'
  ])if(!racing.includes(token))issues.push('Phase 226 commentary readability missing: '+token);
  for(const token of ['/* Phase 226: commentary readability */','.f1-racing-commentary-unread-v226{','data-commentary-priority="critical"'])
    if(!css.includes(token))issues.push('Phase 226 CSS missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
  const result={phase:226,name:'f1-commentary-readability',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase226F1CommentaryReadabilityAudit();
