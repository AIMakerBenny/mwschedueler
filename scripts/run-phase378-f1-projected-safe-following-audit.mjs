import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase378F1ProjectedSafeFollowingAudit(){
 const issues=[],warnings=[];
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
 const cumulative=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 for(const token of ["const VERSION378='phase378-f1-projected-safe-following';",'const PROJECTED_SAFE_GAP_V378=Object.freeze({','function projectedSafeGapMetersV378(','const safeGap=Math.max(MULTICAR_CORRIDOR_V376.sameLineMinGapMeters,projectedSafeGapMetersV378(track));','function qaProjectedSafeFollowingV378(){','window.mwsF1QaProjectedSafeFollowingV378=qaProjectedSafeFollowingV378;','window.__mwsF1RacingV378=VERSION378;'])if(!core.includes(token))issues.push('Phase378 core missing '+token);
 const start=core.indexOf('function projectedSafeGapMetersV378('),end=core.indexOf('function updatePassStateMachineV208(',start);
 if(start<0||end<0||/\b(?:raceProgress|progress)\s*=/.test(core.slice(start,end)))issues.push('Phase378 illegally mutates race position');
 if(!core.includes('relativeClosingMps*relativeClosingMps/(2*20)')||!core.includes('raceMarkerScaleV245(MARKER_OVERLAP_MONITOR_V377.maxZoom)'))issues.push('Braking anticipation or max zoom geometry missing');
 if(!diag.includes('Phase 378 projected safe following QA failed')||!diag.includes('projectedSafeFollowingV378:projectedSafe378||null'))issues.push('Phase378 browser QA missing');
 if(!workflow.includes("echo '[phase378] F1 projected marker footprint safe physical headway'")||!workflow.includes('node --check scripts/run-phase378-f1-projected-safe-following-audit.mjs'))issues.push('Phase378 workflow missing');
 if(!cumulative.includes('runPhase378F1ProjectedSafeFollowingAudit')||!cumulative.includes('export function runPhase378FullIntegrationAudit()'))issues.push('Phase378 cumulative audit missing');
 for(const path of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase378-f1-projected-safe-following-audit.mjs']){
  const x=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});if(x.status!==0)issues.push('Syntax '+path+': '+String(x.stderr||x.stdout).slice(0,850));
 }
 const result={phase:378,name:'f1-projected-safe-following',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase378F1ProjectedSafeFollowingAudit();
