import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase212F1LiveTimingFlipAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  if(!index.includes('recovery=N1&phase=212'))issues.push('Phase 212 asset cache missing');
  for(const token of [
    "const VERSION212='phase212-live-timing-flip';",
    'function applyLiveTimingFlipV212(standings){',
    "list.appendChild(row);",
    "row.animate(",
    "duration:320",
    "applyLiveTimingFlipV212(standings);",
    'window.mwsF1QaLiveTimingFlipV212=qaLiveTimingFlipV212;',
    'window.__mwsF1RacingV212=VERSION212;'
  ])if(!racing.includes(token))issues.push('Phase 212 runtime missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
  const result={phase:212,name:'f1-live-timing-flip',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase212F1LiveTimingFlipAudit();
