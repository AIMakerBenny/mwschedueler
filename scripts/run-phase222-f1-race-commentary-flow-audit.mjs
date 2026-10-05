import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase222F1RaceCommentaryFlowAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<222)issues.push('Phase 222 asset cache missing');
  for(const token of [
    "const VERSION222='phase222-race-commentary-flow';",
    'function commentaryCanEmitV222(signature,cooldownMs=8000){',
    'function updateRaceNarrativeV222(force=false){',
    "current.pitRequested&&!previous.pitRequested",
    "current.tyreWear>=0.72&&previous.tyreWear<0.72",
    "current.battleState!==previous.battleState",
    "now-Number(commentaryFlowV222.lastAmbientSimMs)>=12000",
    'updateRaceNarrativeV222(false);',
    'window.mwsF1QaRaceNarrativeV222=qaRaceNarrativeV222;',
    'window.__mwsF1RacingV222=VERSION222;'
  ])if(!racing.includes(token))issues.push('Phase 222 runtime missing: '+token);
  for(const token of ['/* Phase 222: commentary flow hierarchy */','.f1-racing-commentary-entry-v219.battle .message{'])
    if(!css.includes(token))issues.push('Phase 222 CSS missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:222,name:'f1-race-commentary-flow',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase222F1RaceCommentaryFlowAudit();
