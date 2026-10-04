import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase210F1MultiTrackAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const track=fs.readFileSync('assets/f1-track-v1.js','utf8');
  const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<210)issues.push('Phase 210+ racing asset cache missing');
  for(const token of [
    "id:'majoku-ring-v1'","id:'castle-street-circuit-v1'","id:'blue-coast-speedway-v1'",
    'geometry:Object.freeze({...track.geometry})','pit:Object.freeze({...track.pit})',
    'speedTraps:Object.freeze((track.speedTraps||[]).map','overtakeZones:Object.freeze((track.overtakeZones||[]).map',
    'zones:Object.freeze((track.zones||[]).map'
  ])if(!racing.includes(token)&&!track.includes(token))issues.push('Phase 210 track/snapshot contract missing: '+token);

  for(const token of [
    "const VERSION210='phase210-multi-track-integration';",'function qaMultiTrackIntegrationV210(){',
    "window.mwsBuildF1TrackGeometryV193?.(track,path)","window.mwsBuildF1CornerPhasesV194?.(track,geometry)",
    "window.mwsBuildF1SpeedProfileV195?.(track,cornered)",'const snapshot=buildRaceSnapshotV187();',
    "typeof updateTrafficAndDefenceV207==='function'&&typeof updatePassStateMachineV208==='function'",
    'window.mwsF1QaMultiTrackIntegrationV210=qaMultiTrackIntegrationV210;','window.__mwsF1RacingV210=VERSION210;'
  ])if(!racing.includes(token))issues.push('Phase 210 runtime missing: '+token);

  for(const token of ['mwsF1QaMultiTrackIntegrationV210?.()',"trackCount>=3","multiTrackQa?.allPass===true","snapshotReady&&row.geometryReady&&row.pitReady&&row.overtakeReady&&row.renderingReady&&row.dynamicsReady&&row.trafficPassReady"])if(!diag.includes(token))issues.push('Phase 210 live QA missing: '+token);
  for(const token of ['node --check scripts/run-phase210-f1-multi-track-audit.mjs',"echo '[phase210] F1 multi-track integration'"])if(!workflow.includes(token))issues.push('Phase 210 workflow missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const trackSyntax=spawnSync(process.execPath,['--check','assets/f1-track-v1.js'],{encoding:'utf8'});if(trackSyntax.status!==0)issues.push('F1 track JS syntax failed: '+String(trackSyntax.stderr||trackSyntax.stdout||'').trim());

  const result={phase:210,name:'f1-multi-track-integration',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase210F1MultiTrackAudit();
