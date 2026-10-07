import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase359F1NaturalRacePacePolishAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8'),workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
 for(const token of [
  "const VERSION359='phase359-f1-natural-race-pace-polish';",
  "const NATURAL_RACE_PACE_V359=Object.freeze({rankedBoostScale:.80,catchupBoostScale:.08,fastModeScale:.35,cornerRecoveryCoastDecelMps2:.08,maxNormalFinishSpreadSeconds:43.5});",
  "function naturalRacePaceMultiplierV359(vehicle,mode=activeRaceModeV345()){",
  "naturalRacePaceMultiplierV359Value",
  "vehicle.naturalRacePaceMultiplierV359=naturalRacePaceMultiplierV359Value;",
  "accelMps2=-NATURAL_RACE_PACE_V359.cornerRecoveryCoastDecelMps2;",
  "function qaNaturalRacePacePolishV359(){",
  "window.mwsF1QaNaturalRacePacePolishV359=qaNaturalRacePacePolishV359;",
  "window.__mwsF1RacingV359=VERSION359;"
 ])if(!core.includes(token))issues.push('Phase 359 core missing: '+token);
 const start=core.indexOf('function naturalRacePaceMultiplierV359('),end=core.indexOf('function fieldPaceRetentionMultiplierV356(',start),source=start>=0&&end>start?core.slice(start,end):'';
 if(/\b(?:raceProgress|progress)\s*=/.test(source))issues.push('Phase 359 natural pace helper directly mutates vehicle position');
 for(const token of ['Phase 359 runtime did not propagate to Recovery H browser','Phase 359 natural race pace polish QA failed','Phase 359 normal field spread still excessive','naturalPaceV359:naturalPace359||null'])if(!diag.includes(token))issues.push('Phase 359 Recovery H missing: '+token);
 for(const token of ['node --check scripts/run-phase359-f1-natural-race-pace-polish-audit.mjs','[phase359] F1 natural rear pace retention and corner recovery coast polish','window.__mwsF1RacingV359=VERSION359;'])if(!workflow.includes(token))issues.push('Phase 359 workflow missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase359-f1-natural-race-pace-polish-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:359,name:'f1-natural-race-pace-polish',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase359F1NaturalRacePacePolishAudit();
