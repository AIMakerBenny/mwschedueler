import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase381F1NeighborBrakingAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),
 diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),
 wf=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8'),
 cum=fs.readFileSync('scripts/run-current-full-integration-audit.mjs','utf8');
 for(const t of ["const VERSION381='phase381-neighbor-braking-safety';",
 'function neighborBrakingPairV381(','function neighborBrakingSafetyV381(',
 'const neighborSafetyV381=neighborBrakingSafetyV381(vehicle,track);',
 'if(neighborSafetyV381.active)maxTarget=Math.min(maxTarget,neighborSafetyV381.capKph);',
 '!proximityV376.active&&!neighborSafetyV381.active',
 'window.mwsF1QaNeighborBrakingV381=qaNeighborBrakingV381;'])if(!core.includes(t))issues.push('missing '+t);
 const a=core.indexOf('const NEIGHBOR_BRAKING_V381='),b=core.indexOf('function earlyPassWindowV379(',a);
 if(a<0||b<a||/\b(?:raceProgress|progress)\s*=/.test(core.slice(a,b)))issues.push('progress mutation in neighbor guard');
 if(!diag.includes('Phase 381 neighbor braking QA failed')||!diag.includes('neighborBrakingV381:neighborBraking381||null'))issues.push('Chromium integration missing');
 if(!wf.includes("echo '[phase381]")||!cum.includes('runPhase381FullIntegrationAudit'))issues.push('audit integration missing');
 for(const p of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase381-f1-neighbor-braking-audit.mjs']){
 const k=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(k.status!==0)issues.push('syntax '+p+' '+String(k.stderr).slice(0,700))}
 const result={phase:381,name:'f1-neighbor-braking-safety',issues,warnings,pass:!issues.length};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase381F1NeighborBrakingAudit();
