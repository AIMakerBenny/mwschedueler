import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase213F1TopThreePresentationAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<213)issues.push('Phase 213 asset cache missing');
  for(const token of [
    "const VERSION213='phase213-top-three-presentation';",
    'function ensureTopThreeStylesV213(){',
    'function applyTopThreePresentationV213(standings){',
    "row.dataset.topThree='p'+standing.position;",
    "applyTopThreePresentationV213(standings);",
    'window.mwsF1QaTopThreePresentationV213=qaTopThreePresentationV213;',
    'window.__mwsF1RacingV213=VERSION213;'
  ])if(!racing.includes(token))issues.push('Phase 213 runtime missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
  const result={phase:213,name:'f1-top-three-presentation',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase213F1TopThreePresentationAudit();
