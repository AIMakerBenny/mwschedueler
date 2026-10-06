import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase309F1ViewportMarkerOvertakeFlowAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8');
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const fit=fs.readFileSync('assets/f1-racing-r288-r290.js','utf8');
 const marker=fs.readFileSync('assets/f1-racing-r306.js','utf8');
 const js=fs.readFileSync('assets/f1-racing-r309.js','utf8');
 const css=fs.readFileSync('assets/f1-racing-r309.css','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');

 for(const token of [
  "const VERSION309='phase309-viewport-marker-overtake-flow';",
  'const OVERTAKE_FLOW_CONFIG_V309=Object.freeze({variabilityHoldMs:920',
  'function variabilityBiasV309(',
  'function combinedBattleBiasV309(',
  'function resolveBattleTargetV309(',
  'function qaOvertakeFlowV309(){',
  "passTargetHistoryV309:[]",
  'follower.variabilityBiasUntilV309=now+OVERTAKE_FLOW_CONFIG_V309.variabilityHoldMs',
  'recordRaceOrderFlowV309();',
  'uniquePassPairs',
  'driversMovedFromGrid',
  'averageUniquePassPairs',
  'averageOrderChanges',
  'averageDriversMovedFromGrid',
  'window.mwsF1QaOvertakeFlowV309=qaOvertakeFlowV309;',
  'window.__mwsF1RacingV309=VERSION309;'
 ])if(!core.includes(token))issues.push('Phase 309 core missing: '+token);

 const labelStart=core.indexOf('function layoutRaceVehicleLabelsV228(');
 const labelEnd=core.indexOf('function countLabelOverlapsV228(',labelStart);
 const positionStart=core.indexOf('function syncRaceMarkerPositionV254(');
 const positionEnd=core.indexOf('function qaRaceMarkerPositionV254(',positionStart);
 const labelSource=labelStart>=0&&labelEnd>labelStart?core.slice(labelStart,labelEnd):'';
 const positionSource=positionStart>=0&&positionEnd>positionStart?core.slice(positionStart,positionEnd):'';
 for(const token of ["label.dataset.labelSlotV228='fixed-below-v309'","label.setAttribute('x','0')","label.setAttribute('y',String(y))","label.setAttribute('text-anchor','middle')"]){
  if(!labelSource.includes(token))issues.push('Phase 309 marker label structure missing: '+token);
 }
 const labelY=Number(labelSource.match(/const y=([0-9.]+)/)?.[1]);
 const ringRadius=Number(core.match(/class:'car-ring'[^}]*r:([0-9.]+)/)?.[1]);
 const positionBoxY=Number(positionSource.match(/class:'car-position-box-v254'[^}]*,y:([0-9.]+)/)?.[1]);
 const positionTextY=Number(positionSource.match(/class:'car-position-text-v254'[^}]*,y:([0-9.]+)/)?.[1]);
 if(![labelY,ringRadius,positionBoxY,positionTextY].every(Number.isFinite)||!(labelY>ringRadius&&positionBoxY>labelY&&positionTextY>positionBoxY)){
  issues.push('Phase 309 marker label/order geometry relation invalid: '+JSON.stringify({ringRadius,labelY,positionBoxY,positionTextY}));
 }

 for(const token of [
  'defaultMaxHeightPx:640',
  'targetViewports:Object.freeze([720,768,900,1080,1440])',
  'fitsViewport:height<=available+1',
  "workspace.style.setProperty('grid-auto-rows',rowPx,'important')"
 ])if(!fit.includes(token))issues.push('Phase 309 viewport fit missing: '+token);

 for(const token of [
  'window.__mwsF1FixedMarkerLabelsV309===true',
  "node.dataset.v306Shift='0,0'",
  'report.fixedMarkerModeV309='
 ])if(!marker.includes(token))issues.push('Phase 309 Phase 306 future-safe marker behavior missing: '+token);

 for(const token of [
  "const VERSION309='phase309-viewport-marker-overtake-flow-ui';",
  'function syncFixedMarkerLabelsV309(){',
  'function syncViewportV309(){',
  'function qaV309(){',
  'window.mwsF1QaViewportMarkerOvertakeV309=qaV309;',
  'window.__mwsF1RacingUiV309=VERSION309;'
 ])if(!js.includes(token))issues.push('Phase 309 UI runtime missing: '+token);

 for(const token of [
  '.f1-racing-race-vehicle-v189 .car-label',
  '.car-position-tag-v254',
  'transform:none!important',
  'max-height:calc(100dvh - 8px)!important'
 ])if(!css.includes(token))issues.push('Phase 309 CSS missing: '+token);

 for(const token of [
  'assets/f1-racing-r309.css?phase=309',
  'assets/f1-racing-r309.js?phase=309',
  'phase309=1',
  'fit=309',
  'fixed=309'
 ])if(!index.includes(token))issues.push('Phase 309 asset/cache link missing: '+token);

 for(const token of [
  'Phase 309 runtime readiness',
  'Phase 309 viewport/marker/overtake QA failed',
  'Phase 309 marker labels are not fixed under the orb',
  'Phase 309 reset workspace extends below viewport',
  'Phase 309 unique pass opponents too low',
  'Phase 309 actual order changes too low',
  'Phase 309 finish-order movement too low'
 ])if(!diag.includes(token))issues.push('Phase 309 Recovery H QA missing: '+token);

 for(const file of ['assets/f1-racing-v1.js','assets/f1-racing-r288-r290.js','assets/f1-racing-r306.js','assets/f1-racing-r309.js','scripts/diagnose-recovery-h-f1-live.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:309,name:'f1-viewport-marker-overtake-flow',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase309F1ViewportMarkerOvertakeFlowAudit();
