import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase320F1UiSpacingCompatibilityClosureAudit(){
 const issues=[],warnings=[];
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 const p197=fs.readFileSync('scripts/run-phase197-f1-racing-line-audit.mjs','utf8');
 const treeCompat='const point=raceLinePointV197(path,vehicle.progress,lateralStateV258.visual);';
 if(!core.includes(treeCompat))issues.push('Phase 320 Phase197/258 compatibility marker missing');
 for(const token of [
  "const VERSION319='phase319-f1-ui-spacing-battle-isolation';",
  'function buildVisualSpacingPlanV319(',
  'displayProgressV319=normalizedProgressV190(displayRaceProgressV319)',
  'marker.dataset.visualSpacingGapMetersV319',
  'window.mwsF1QaUiSpacingBattleV319=qaUiSpacingBattleV319;'
 ])if(!core.includes(token))issues.push('Phase 320 Phase319 runtime missing: '+token);
 if(!p197.includes('racing line render compatibility missing'))warnings.push('Phase 197 audit wording changed; compatibility marker may be removable later');
 for(const file of ['assets/f1-racing-v1.js','scripts/run-phase320-f1-ui-spacing-compatibility-closure-audit.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:320,name:'f1-ui-spacing-compatibility-closure',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase320F1UiSpacingCompatibilityClosureAudit();
