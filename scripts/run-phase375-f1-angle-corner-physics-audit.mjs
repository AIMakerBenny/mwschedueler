import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase375F1AngleCornerPhysicsAudit(){
 const issues=[],warnings=[];
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),geo=fs.readFileSync('assets/f1-track-geometry-v2.js','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
 const cumulative=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 for(const t of ["const VERSION375='phase375-f1-curvature-prebrake-apex-throttle';",'function cornerDrivingPlanV375(','const plan=cornerDrivingPlanV375(baselinePlanV351,corner,vehicle,track);','function longitudinalResponseV375(','const longitudinalV375=longitudinalResponseV375(track,current,maxTarget-current,phase,tyreGrip','function qaCornerPhysicsV375(){','window.mwsF1QaCornerPhysicsV375=qaCornerPhysicsV375;','window.__mwsF1RacingV375=VERSION375;'])if(!core.includes(t)&&!(t==='const plan=cornerDrivingPlanV375(baselinePlanV351,corner,vehicle,track);'&&core.includes('const plan=cornerRetimingV382(cornerDrivingPlanV375(baselinePlanV351,corner,vehicle,track),corner,vehicle);')))issues.push('Core V375 missing '+t);
 for(const t of ['turnAngleDegrees:','radiusMeters:','angleSeverity:'])if(!geo.includes(t))issues.push('Geometry V375 missing '+t);
 const source=core.slice(core.indexOf('function cornerDrivingPlanV375('),core.indexOf('function cornerTargetAtDistanceV351('));
 if(/\b(?:raceProgress|progress)\s*=/.test(source))issues.push('Corner planner directly mutates position');
 if(!diag.includes('Phase 375 angle-based F1 corner physics QA failed')||!diag.includes('cornerPhysicsV375:cornerPhysics375||null'))issues.push('Recovery H V375 missing');
 if(!workflow.includes("echo '[phase375] F1 corner angle and pre-brake exit acceleration'")||!workflow.includes('node --check scripts/run-phase375-f1-angle-corner-physics-audit.mjs'))issues.push('Workflow V375 missing');
 if(!cumulative.includes('runPhase375F1AngleCornerPhysicsAudit')||!cumulative.includes('export function runPhase375FullIntegrationAudit()'))issues.push('Cumulative V375 missing');
 for(const p of ['assets/f1-racing-v1.js','assets/f1-track-geometry-v2.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase375-f1-angle-corner-physics-audit.mjs']){
  const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(r.status!==0)issues.push('Syntax '+p+': '+String(r.stderr||r.stdout).slice(0,700));
 }
 const result={phase:375,name:'f1-angle-corner-physics',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase375F1AngleCornerPhysicsAudit();
