import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase302F1LiveRankingFlipStatusAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8');
 const patch=fs.readFileSync('assets/f1-racing-r283-r287.js','utf8');
 const css=fs.readFileSync('assets/f1-racing-r283-r287.css','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

 for(const token of [
  "const VERSION302='phase302-f1-live-ranking-flip-status';",
  'function rankingDriverKeyV302(',
  'function rankingStatusV302(',
  'function createRankingRowV302(',
  'function animateRankingFlipV302(',
  'transform 360ms cubic-bezier(.22,.78,.24,1)',
  'window.mwsF1QaTrackRankingFlipStatusV302=qaTrackRankingFlipStatusV302;',
  'window.__mwsF1RacingV302=VERSION302;'
 ])if(!patch.includes(token))issues.push('Phase 302 runtime missing: '+token);

 for(const token of [
  '.f1-racing-track-ranking-status-v302{',
  '[data-rank-status="PIT"]',
  '.rank-up-v302',
  '.rank-down-v302'
 ])if(!css.includes(token))issues.push('Phase 302 CSS missing: '+token);

 const jsMatch=index.match(/assets\/f1-racing-r283-r287\.js\?phase=(\d+)/);
 const cssMatch=index.match(/assets\/f1-racing-r283-r287\.css\?phase=(\d+)/);
 if(!jsMatch||!cssMatch||Number(jsMatch[1])<302||Number(cssMatch[1])<302)issues.push('Phase 302 asset cache links missing or stale');

 for(const token of [
  'Phase 302 live ranking FLIP/status QA failed',
  'Phase 302 live ranking keyed/status rows invalid',
  'Phase 302 live ranking row keys are not unique'
 ])if(!diag.includes(token))issues.push('Phase 302 Recovery H missing: '+token);

 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-r283-r287.js'],{encoding:'utf8'});
 if(syntax.status!==0)issues.push('Phase 302 patch syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());

 const result={phase:302,name:'f1-live-ranking-flip-status',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase302F1LiveRankingFlipStatusAudit();
