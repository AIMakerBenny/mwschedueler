import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase319F1UiSpacingBattleAudit(){
 const issues=[],warnings=[];
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const patch=fs.readFileSync('assets/f1-racing-r283-r287.js','utf8');
 const css=fs.readFileSync('assets/f1-racing-r319.css','utf8');
 const index=fs.readFileSync('index.html','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of [
  "const VERSION319='phase319-f1-ui-spacing-battle-isolation';",
  "const BATTLE_ACTIVE_STATES_V319=Object.freeze([",
  "const RACE_SPACING_CONFIG_V319=Object.freeze({",
  "function buildBattleLocksV319(","function battlePairBlockedV319(",
  "vehicle.battleBlockedV319=blocked","function battleQueueSpeedControlV319(",
  "function buildVisualSpacingPlanV319(","spacingPlanV319=buildVisualSpacingPlanV319()",
  "marker.dataset.visualSpacingGapMetersV319",
  "function qaUiSpacingBattleV319(){","window.mwsF1QaUiSpacingBattleV319=qaUiSpacingBattleV319;",
  "return Math.max(.22,Math.min(1,1/z));"
 ])if(!core.includes(token))issues.push('Phase 319 core missing: '+token);
 const spacingStart=core.indexOf('const RACE_SPACING_CONFIG_V319=Object.freeze({');
 const spacingEnd=core.indexOf('});',spacingStart);
 const spacingSource=spacingStart>=0&&spacingEnd>spacingStart?core.slice(spacingStart,spacingEnd+3):'';
 const readSpacing=key=>Number(spacingSource.match(new RegExp(key+':([0-9.]+)'))?.[1]);
 const spacing={normal:readSpacing('normalDisplayGapMeters'),blocked:readSpacing('blockedDisplayGapMeters'),battle:readSpacing('battleDisplayGapMeters'),physical:readSpacing('physicalFollowGapMeters')};
 if(!Object.values(spacing).every(Number.isFinite)||spacing.normal<65||spacing.blocked<90||spacing.battle<14||spacing.physical<18||spacing.blocked<=spacing.normal||spacing.battle>=spacing.normal){
  issues.push('Phase 319 spacing thresholds regressed: '+JSON.stringify(spacing));
 }
 const haloRadius=Number(core.match(/class:'car-halo'[^}]*r:([0-9.]+)/)?.[1]);
 const ringRadius=Number(core.match(/class:'car-ring'[^}]*r:([0-9.]+)/)?.[1]);
 const profileWidth=Number(core.match(/class:'car-profile-image-v257'[^}]*width:([0-9.]+)/)?.[1]);
 if(![haloRadius,ringRadius,profileWidth].every(Number.isFinite)||haloRadius<26||ringRadius<17||profileWidth<28){
  issues.push('Phase 319 marker readability geometry regressed: '+JSON.stringify({haloRadius,ringRadius,profileWidth}));
 }
 for(const token of [
  "const ZOOM_MARKER_CONFIG_V285=Object.freeze({exponent:1,minScale:.22,maxScale:1});",
  "spread<.03","window.__mwsF1RacingMarkerV319='phase319-marker-screen-size-lock';"
 ])if(!patch.includes(token))issues.push('Phase 319 marker patch missing: '+token);
 for(const token of [
  '#f1RacingGridGachaStageV313 .f1-grid-gacha-reveal-v313>.gacha-card',
  'object-fit:contain!important','height:min(286px,calc(100% - 58px))',
  '#f1RacingViewRaceV185 .f1-racing-race-vehicle-v189 .car-label'
 ])if(!css.includes(token))issues.push('Phase 319 CSS missing: '+token);
 for(const token of [
  'assets/f1-racing-r319.css?phase=319','phase309=1&phase319=1',
  'assets/f1-racing-r283-r287.js?phase=302&phase319=1'
 ])if(!index.includes(token))issues.push('Phase 319 index/cache missing: '+token);
 for(const token of [
  'Phase 319 runtime readiness','Phase 319 marker screen-size lock unavailable or invalid',
  'Phase 319 UI spacing and battle isolation QA failed','Phase 319 third-car battle isolation failed'
 ])if(!diag.includes(token))issues.push('Phase 319 Recovery H missing: '+token);
 const gachaOverflowCheck=diag.includes('Phase 319 Gacha card overflows reveal viewport')||diag.includes('Phase 321 Gacha card overflows reveal viewport');
 const gachaContainCheck=diag.includes('Phase 319 Gacha portrait must use contain fit')||diag.includes('Phase 321 Gacha portrait must use contain fit');
 if(!gachaOverflowCheck)issues.push('Phase 319/321 Gacha overflow Recovery H check missing');
 if(!gachaContainCheck)issues.push('Phase 319/321 Gacha contain Recovery H check missing');
 for(const file of ['assets/f1-racing-v1.js','assets/f1-racing-r283-r287.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase319-f1-ui-spacing-battle-audit.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:319,name:'f1-ui-spacing-battle-isolation',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase319F1UiSpacingBattleAudit();
