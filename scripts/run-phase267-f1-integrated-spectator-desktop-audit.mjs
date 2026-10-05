import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase267F1IntegratedSpectatorDesktopAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<267)issues.push('Phase 267 asset cache missing');

  for(const token of [
    "const VERSION267='phase267-integrated-spectator-desktop-qa';",
    'const SPECTATOR_QA_CASES_V267=Object.freeze([',
    "Object.freeze({id:'3x5'",
    "Object.freeze({id:'6x10'",
    "Object.freeze({id:'12x20'",
    'function spectatorQaCaseV267(',
    'function qaIntegratedSpectatorDesktopV267(){',
    'embeddedProfiles:typeof syncEmbeddedDriverMarkerV257',
    'positionBadges:typeof syncRaceMarkerPositionV254',
    'battleLinks:typeof syncBattleLinksV256',
    'lateralSmoothing:typeof updateVisualLateralOffsetV258',
    'workspacePersistence:typeof restoreWorkspaceUserDefaultV259',
    'customLaps:typeof setLapCountV260',
    'fullscreen:typeof enterF1ImmersiveV261',
    'liveCutin:typeof enqueueLiveCutinV264',
    'autoCamera:typeof setRaceCameraModeV216',
    'commentary:typeof appendRaceCommentaryV222',
    'podium:typeof renderPodiumRecoveryG',
    'pit:typeof updatePitStateV205',
    'overtake:typeof nextPassStateV208',
    'raceCompletion:typeof finishRaceRecoveryG',
    'window.mwsF1QaIntegratedSpectatorDesktopV267=qaIntegratedSpectatorDesktopV267;',
    'window.__mwsF1RacingV267=VERSION267;'
  ])if(!racing.includes(token))issues.push('Phase 267 runtime missing: '+token);

  if(!racing.includes('const totalLaps=Math.max(1,Math.min(20,Math.floor(Number(laps)||1)));'))
    issues.push('Phase 267 accelerated engine does not support 20-lap QA');

  for(const token of [
    "window.__mwsF1RacingV267==='phase267-integrated-spectator-desktop-qa'",
    'Phase 267 integrated spectator desktop QA failed',
    'Phase 267 3-driver 5-lap case failed',
    'Phase 267 6-driver 10-lap case failed',
    'Phase 267 10+-driver 20-lap case failed',
    "Emulation.setDeviceMetricsOverride',{width:2560,height:1440",
    'Phase 267 QHD panel overlap',
    'Phase 267 QHD race markers missing'
  ])if(!live.includes(token))issues.push('Phase 267 Recovery H QA missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const liveSyntax=spawnSync(process.execPath,['--check','scripts/diagnose-recovery-h-f1-live.mjs'],{encoding:'utf8'});
  if(liveSyntax.status!==0)issues.push('Recovery H syntax failed: '+String(liveSyntax.stderr||liveSyntax.stdout||'').trim());

  const result={phase:267,name:'f1-integrated-spectator-desktop-qa',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase267F1IntegratedSpectatorDesktopAudit();
