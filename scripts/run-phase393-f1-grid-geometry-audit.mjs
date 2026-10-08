import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase393F1GridGeometryAudit(){
 const issues=[],warnings=[];
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 for(const t of ['function gridStartGeometryV393(', 'function qaGridStartGeometryV393(){', 'window.mwsF1QaGridStartGeometryV393=qaGridStartGeometryV393;', 'raceLinePointV197(path,-index*stepMeters/length,0)', 'MARKER_OVERLAP_MONITOR_V377.ringRadiusSvg'])
  if(!core.includes(t))issues.push('missing projection '+t);
 if(!diag.includes('Phase 393 actual start grid SVG projection QA failed')||!diag.includes('gridGeometryV393:gridGeometry393||null'))issues.push('missing browser QA');
 if(!cum.includes('runPhase393FullIntegrationAudit()')||!cum.includes('runPhase393F1GridGeometryAudit()'))issues.push('missing cumulative audit');
 for(const p of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-current-full-integration-audit.mjs']){
  const x=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});
  if(x.status!==0)issues.push('syntax '+p+' '+String(x.stderr).slice(0,400));
 }
 const result={phase:393,name:'f1-actual-start-grid-geometry-diagnostic',issues,warnings,pass:!issues.length};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase393F1GridGeometryAudit();
