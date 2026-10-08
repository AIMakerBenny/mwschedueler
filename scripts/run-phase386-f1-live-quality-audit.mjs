import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase386F1LiveQualityAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),
 diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),
 wf=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8'),
 cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 for(const x of ["const VERSION386='phase386-live-only-overlap-gate';",'function recordQualityDynamicsV386(','function recordQualityFrameV386(','function localCurveClearanceMetersV386(','window.mwsF1QaFinalLiveQualityV386=qaFinalLiveQualityV386;','recordQualityFrameV386(atMax,atCurrent,rendered);','const curveMeters=localCurveClearanceMetersV386(track,path,ringDiameterSvg);'])if(!core.includes(x))issues.push('missing '+x);
 if(!diag.includes('Phase 386 actual LIVE maximum-zoom marker overlap remains')||!diag.includes('finalLiveQualityV386:finalLive386||null'))issues.push('strict Chromium LIVE quality gate missing');
 if(!wf.includes("echo '[phase386]")||!cum.includes('runPhase386FullIntegrationAudit'))issues.push('audit integration missing');
 if(!core.includes('report.peakMaxZoomPairs===0'))issues.push('zero-overlap criterion absent');
 if(!core.includes('function emergencyLaneChoiceV386(')||!core.includes('applyEmergencyAvoidanceV386();'))issues.push('emergency slow-obstacle avoidance missing');
 if(!diag.includes('Phase 386 emergency obstacle bypass QA failed'))issues.push('slow-obstacle browser QA missing');
 for(const p of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase386-f1-live-quality-audit.mjs']){const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(r.status!==0)issues.push('syntax '+p+' '+String(r.stderr).slice(0,500))}
 const result={phase:386,name:'f1-live-only-zero-overlap-quality-gate',issues,warnings,pass:!issues.length};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase386F1LiveQualityAudit();
