import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase306F1MarkerOverlayCollisionAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8');
 const js=fs.readFileSync('assets/f1-racing-r306.js','utf8');
 const css=fs.readFileSync('assets/f1-racing-r306.css','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of [
  "const VERSION306='phase306-f1-marker-overlay-collision-avoidance';",
  'function layoutThoughtsV306(bounds){',
  "const candidates=[[0,0],[-76,-16],[76,-16]",
  'function layoutPositionTagsV306(bounds){',
  "const candidates=[[0,0],[-36,0],[36,0],[0,36]",
  'function chooseOffsetV306(',
  'function overlapCountV306(',
  'window.mwsF1LayoutMarkerOverlaysV306=layoutV306;',
  'window.mwsF1QaMarkerOverlayCollisionV306=qaV306;',
  'window.__mwsF1RacingV306=VERSION306;'
 ])if(!js.includes(token))issues.push('Phase 306 runtime missing: '+token);
 for(const token of [
  '--v306-thought-x',
  '--v306-thought-y',
  '--v306-tag-x',
  '--v306-tag-y',
  '.car-position-tag-v254{',
  'transition:none!important'
 ])if(!css.includes(token))issues.push('Phase 306 CSS missing: '+token);
 for(const token of [
  'assets/f1-racing-r306.css?phase=306',
  'assets/f1-racing-r306.js?phase=306'
 ])if(!index.includes(token))issues.push('Phase 306 asset link missing: '+token);
 for(const token of [
  'Phase 306 runtime readiness',
  'Phase 306 marker overlay collision QA failed',
  'Phase 306 two-racer thought collision scenario was not exercised',
  'Phase 306 racer thought bubbles still overlap',
  'Phase 306 race position badges still overlap'
 ])if(!diag.includes(token))issues.push('Phase 306 Recovery H QA missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-r306.js'],{encoding:'utf8'});
 if(syntax.status!==0)issues.push('Phase 306 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:306,name:'f1-marker-overlay-collision-avoidance',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase306F1MarkerOverlayCollisionAudit();
