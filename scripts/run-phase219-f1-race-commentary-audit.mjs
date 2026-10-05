import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase219F1RaceCommentaryAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<219)issues.push('Phase 219 asset cache missing');
  for(const token of [
    "const VERSION219='phase219-race-commentary-engine';",
    'function appendRaceCommentaryV219(message,type=\'info\'){',
    'function updateRaceCommentaryV219(force=false){',
    "경기가 시작됐습니다.",
    "appendRaceCommentaryV219(",
    "current.passCompleted>previous.passCompleted",
    "appendRaceCommentaryV219(name+'가 피트로 들어갑니다.','pit');",
    "appendRaceCommentaryV219(name+'에게 블루 플래그가 제시됐습니다. 선두권 차량에 길을 내줘야 합니다.','flag');",
    'updateRaceCommentaryV219(false);',
    'window.mwsF1QaRaceCommentaryV219=qaRaceCommentaryV219;',
    'window.__mwsF1RacingV219=VERSION219;'
  ])if(!racing.includes(token))issues.push('Phase 219 commentary runtime missing: '+token);
  for(const token of ['/* Phase 219: live race commentary event feed */','.f1-racing-commentary-entry-v219{'])
    if(!css.includes(token))issues.push('Phase 219 commentary CSS missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:219,name:'f1-race-commentary-engine',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase219F1RaceCommentaryAudit();
