import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase308F1TrackOverlayHudFrequencyDiversityAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8');
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const patch=fs.readFileSync('assets/f1-racing-r303.js','utf8');
 const js=fs.readFileSync('assets/f1-racing-r308.js','utf8');
 const css=fs.readFileSync('assets/f1-racing-r308.css','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

 for(const token of [
  "const VERSION308='phase308-track-overlay-hud-frequency-diversity';",
  'const DIALOGUE_DIRECT_LINES_V308=Object.freeze({',
  'windowMs:12000,maxGroupsPerWindow:2,speakerGapMs:4800,pairGapMs:7000,criticalPairGapMs:1800',
  'liveCadenceMs:10000',
  'dedupeMs:7000,globalCadenceMs:9000,mergeWindowMs:10000',
  'minDurationMs:6000,maxDurationMs:8200,mergeDurationMs:7600',
  'const LIVE_CUTIN_EXTRA_V308=Object.freeze({'
 ])if(!core.includes(token))issues.push('Phase 308 core policy missing: '+token);

 const recentLimit308=Number(core.match(/const DIALOGUE_RECENT_TEXT_LIMIT_V279=(\d+);/)?.[1]||0);
 if(recentLimit308<96)issues.push('Phase 308 dialogue repetition guard regressed below 96: '+recentLimit308);

 for(const token of [
  "const VERSION308='phase308-track-overlay-hud-frequency-diversity';",
  'function dockLiveV308(){',
  "layer.classList.remove('docked-v303');layer.classList.add('track-docked-v308')",
  'function showHudV308(',
  "root.id='f1RacingDialogueHudV308'",
  'globalGapMs:6800,speakerGapMs:12000',
  'window.mwsF1QaTrackOverlayHudV308=qaV308;',
  'window.__mwsF1RacingV308=VERSION308;'
 ])if(!js.includes(token))issues.push('Phase 308 overlay runtime missing: '+token);

 for(const token of [
  '.f1-racing-driver-thought-v303{display:none!important}',
  '#f1RacingLiveCutinLayerV264.track-docked-v308{',
  'left:16px!important',
  'bottom:16px!important',
  '@keyframes f1LiveTrackEnterV308',
  '.f1-racing-dialogue-hud-v308{',
  'right:16px',
  '.f1-racing-dialogue-avatar-v308'
 ])if(!css.includes(token))issues.push('Phase 308 overlay CSS missing: '+token);

 if(!patch.includes("if(window.__mwsF1LiveTrackDockV308===true)return true;"))issues.push('Phase 303 forced commentary docking is not guarded for Phase 308');
 for(const token of ['assets/f1-racing-r308.css?phase=308','assets/f1-racing-r308.js?phase=308','live308=1','assets/f1-racing-r303.js?phase=303&fix=308'])if(!index.includes(token))issues.push('Phase 308 asset/cache link missing: '+token);
 for(const token of [
  'Phase 308 runtime readiness',
  'Phase 308 LIVE is not docked to track lower-left',
  'Phase 308 LIVE lower-left geometry failed',
  'Phase 308 LIVE entrance effect missing',
  'Phase 308 driver profile HUD missing from track lower-right',
  'Phase 308 driver profile avatar missing',
  'Phase 308 legacy track speech bubble still visible',
  'Phase 308 track overlay HUD QA failed',
  'Phase 308 dialogue HUD frequency guard too loose'
 ])if(!diag.includes(token))issues.push('Phase 308 Recovery H QA missing: '+token);

 for(const file of ['assets/f1-racing-v1.js','assets/f1-racing-r303.js','assets/f1-racing-r308.js','scripts/diagnose-recovery-h-f1-live.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:308,name:'f1-track-overlay-hud-frequency-diversity',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase308F1TrackOverlayHudFrequencyDiversityAudit();
