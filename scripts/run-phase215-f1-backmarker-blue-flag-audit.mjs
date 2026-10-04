import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase215F1BackmarkerBlueFlagAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  if(!index.includes('recovery=N1&phase=215'))issues.push('Phase 215 asset cache missing');
  for(const token of [
    "const VERSION215='phase215-backmarker-blue-flag';",
    'function classifyBackmarkerV215(leader,vehicle){',
    'function updateBackmarkerBlueFlagsV215(){',
    "const backmarker=lapDeficit>=1;",
    "vehicle.racingLineMode='OUTSIDE';",
    "if(vehicle.blueFlag)maxTarget*=BLUE_FLAG_CONFIG_V215.paceFactor;",
    "updateBackmarkerBlueFlagsV215();",
    'window.mwsF1QaBackmarkerBlueFlagV215=qaBackmarkerBlueFlagV215;',
    'window.__mwsF1RacingV215=VERSION215;'
  ])if(!racing.includes(token))issues.push('Phase 215 runtime missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
  const result={phase:215,name:'f1-backmarker-blue-flag',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase215F1BackmarkerBlueFlagAudit();
