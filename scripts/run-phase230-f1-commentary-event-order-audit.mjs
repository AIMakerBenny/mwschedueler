import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase230F1CommentaryEventOrderAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<230)issues.push('Phase 230 asset cache missing');
  for(const token of [
    "const VERSION230='phase230-commentary-event-order-integrity';",
    'function pitCommentaryEventV230(previousState,currentState){',
    'function commentaryPassTargetV230(vehicle,previous,byId){',
    "const pitEvent=pitCommentaryEventV230(previous.pitState,current.pitState);",
    'const target=commentaryPassTargetV230(vehicle,previous,byId);',
    'window.mwsF1QaCommentaryEventOrderV230=qaCommentaryEventOrderV230;',
    'window.__mwsF1RacingV230=VERSION230;'
  ])if(!racing.includes(token))issues.push('Phase 230 commentary order runtime missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed');
  const result={phase:230,name:'f1-commentary-event-order-integrity',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase230F1CommentaryEventOrderAudit();
