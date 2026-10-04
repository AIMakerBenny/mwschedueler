import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase214F1RaceControlFlagAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  if(!index.includes('recovery=N1&phase=214'))issues.push('Phase 214 asset cache missing');
  for(const token of [
    "const VERSION214='phase214-race-control-flags';",
    "const RACE_FLAGS_V214=Object.freeze(['GREEN','YELLOW','VSC','SAFETY_CAR','RED']);",
    'function setRaceControlFlagV214(flag=\'GREEN\',reason=\'\'){',
    "maxTarget*=raceFlagSpeedFactorV214();",
    "if(raceFlagStateV214.flag==='GREEN'){",
    'window.mwsF1QaRaceControlFlagsV214=qaRaceControlFlagsV214;',
    'window.__mwsF1RacingV214=VERSION214;'
  ])if(!racing.includes(token))issues.push('Phase 214 runtime missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
  const result={phase:214,name:'f1-race-control-flags',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase214F1RaceControlFlagAudit();
