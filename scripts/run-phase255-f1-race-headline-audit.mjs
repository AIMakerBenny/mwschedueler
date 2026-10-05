import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase255F1RaceHeadlineAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<255)issues.push('Phase 255 asset cache missing');

  for(const token of [
    'id="f1RacingRaceHeadlineV255"',
    'data-f1-headline-leader',
    'data-f1-headline-remaining',
    'data-f1-headline-fastest',
    'data-f1-headline-fastest-driver',
    'data-f1-headline-battles'
  ])if(!index.includes(token))issues.push('Phase 255 markup missing: '+token);

  for(const token of [
    "const VERSION255='phase255-race-headline-summary';",
    'function raceHeadlineStateV255(){',
    'function syncRaceHeadlineV255(){',
    'syncRaceHeadlineV255();',
    'function qaRaceHeadlineV255(){',
    'window.mwsF1QaRaceHeadlineV255=qaRaceHeadlineV255;',
    'window.__mwsF1RacingV255=VERSION255;'
  ])if(!racing.includes(token))issues.push('Phase 255 runtime missing: '+token);

  for(const token of [
    '/* Phase 255: compact race headline summary */',
    '.f1-racing-race-headline-v255',
    '[data-f1-headline-fastest]',
    '[data-f1-headline-battles]'
  ])if(!css.includes(token))issues.push('Phase 255 CSS missing: '+token);

  for(const token of [
    'mwsF1QaRaceHeadlineV255',
    'Phase 255 race headline QA failed',
    'Phase 255 race headline geometry invalid'
  ])if(!live.includes(token))issues.push('Phase 255 Recovery H browser QA missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:255,name:'f1-race-headline-summary',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase255F1RaceHeadlineAudit();
