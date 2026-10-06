import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase324F1UiVisibilityTrainSpacingAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),css=fs.readFileSync('assets/f1-racing-r324.css','utf8'),index=fs.readFileSync('index.html','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of ["const VERSION324='phase324-f1-ui-visibility-train-spacing';","normalDisplayGapMeters:68","blockedDisplayGapMeters:95","battleDisplayGapMeters:18","physicalFollowGapMeters:20","reason:'TRAIN_HEADWAY'","r:28","r:18","width:28.4,height:28.4","data-gacha-renderer-v324=\"deterministic\"","f1-grid-gacha-card-v324","function qaUiVisibilitySpacingV324(){","window.__mwsF1RacingV324=VERSION324;"])if(!core.includes(token))issues.push('Phase 324 core missing: '+token);
 for(const token of ['height:420px!important','width:230px!important;height:320px!important','.f1-grid-gacha-card-v324','object-fit:contain!important','.car-label{font-size:8.5px!important'])if(!css.includes(token))issues.push('Phase 324 CSS missing: '+token);
 for(const token of ['assets/f1-racing-r324.css?phase=324','phase319=1&phase324=1'])if(!index.includes(token))issues.push('Phase 324 link missing: '+token);
 for(const token of ['Phase 324 runtime readiness','Phase 324 deterministic Gacha card shell missing','Phase 324 Gacha card geometry mismatch','Phase 324 marker visibility/train spacing QA failed','Phase 324 racer orb did not enlarge','Phase 324 train spacing/headway too small'])if(!diag.includes(token))issues.push('Phase 324 Recovery H missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase324-f1-ui-visibility-train-spacing-audit.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:324,name:'f1-ui-visibility-train-spacing',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase324F1UiVisibilityTrainSpacingAudit();
