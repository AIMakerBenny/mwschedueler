import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase303F1FeedbackStabilizationAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const base=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const patch=fs.readFileSync('assets/f1-racing-r303.js','utf8');
  const css=fs.readFileSync('assets/f1-racing-r303.css','utf8');
  const core=fs.readFileSync('assets/app-core.css','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

  for(const token of [
    "const VERSION303='phase303-f1-feedback-stabilization';",
    'const GAME_VARIABILITY_CONFIG_V303=Object.freeze({',
    'function applyGameVariabilityV303(stepMs){',
    'function emitGameLiveV303(',
    'applyGameVariabilityV303(stepMs);',
    'window.mwsF1QaGameVariabilityV303=qaGameVariabilityV303;'
  ])if(!base.includes(token))issues.push('Phase 303 race runtime missing: '+token);

  for(const token of [
    "const VERSION303='phase303-f1-feedback-ui-stabilization';",
    'function showDriverThoughtV303(',
    'function dockLiveCutinV303(){',
    'function layoutShuffleCardsV303(){',
    'function suppressDuplicateTrackRankV303(){',
    'window.mwsF1QaFeedbackUiV303=qaFeedbackUiV303;'
  ])if(!patch.includes(token))issues.push('Phase 303 UI runtime missing: '+token);

  for(const token of [
    '#f1RacingTrackRankingV284{display:none!important}',
    '#f1RacingConversationStackV276{display:none!important}',
    '.f1-racing-driver-thought-v303{',
    '.f1-racing-live-cutin-layer-v264.docked-v303{',
    'width:104px!important;height:146px!important',
    '@keyframes f1GridShuffleTradeV303'
  ])if(!css.includes(token))issues.push('Phase 303 CSS missing: '+token);

  if(!core.includes('Phase 303: clean compact category rail')||!core.includes('border-right-color:transparent!important'))issues.push('Phase 303 collapsed sidebar cleanup missing');

  for(const raw of [
    'assets/f1-racing-r283-r287.css?phase=302">\\n<link',
    'assets/f1-racing-r283-r287.js?phase=302"></script>\\n<script'
  ])if(index.includes(raw))issues.push('Phase 303 literal \\n artifact remains in index');
  for(const token of [
    'assets/f1-racing-r303.css?phase=303',
    'assets/f1-racing-r303.js?phase=303',
    'recovery=N1&phase=303'
  ])if(!index.includes(token))issues.push('Phase 303 asset cache/runtime link missing: '+token);

  for(const token of [
    'Phase 303 runtime readiness',
    'Phase 303 duplicate LIVE RANK still covers the track',
    'Phase 303 legacy conversation feed still visible',
    'Phase 303 LIVE cut-in still overlaps the track map',
    'Phase 303 race variability QA failed',
    'Phase 303 racer thought bubble did not attach to a track marker'
  ])if(!diag.includes(token))issues.push('Phase 303 Recovery H check missing: '+token);
  const gachaSupersedesShuffle=base.includes("const VERSION313='phase313-f1-gacha-starting-grid';");
  if(gachaSupersedesShuffle){
    for(const token of ['Phase 313 Gacha starting grid QA failed','Phase 313 P-grid dock is not on the right side'])if(!diag.includes(token))issues.push('Phase 303 future-safe Gacha replacement check missing: '+token);
  }else{
    for(const token of ['Phase 303 shuffle cards are not trade-card proportion','Phase 303 shuffle cards remain clumped'])if(!diag.includes(token))issues.push('Phase 303 shuffle Recovery H check missing: '+token);
  }

  for(const file of ['assets/f1-racing-v1.js','assets/f1-racing-r303.js','scripts/diagnose-recovery-h-f1-live.mjs']){
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
  }

  const result={phase:303,name:'f1-feedback-stabilization',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase303F1FeedbackStabilizationAudit();
