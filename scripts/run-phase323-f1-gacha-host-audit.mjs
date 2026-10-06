import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase323F1GachaHostAudit(){
 const issues=[],warnings=[];
 const core=fs.readFileSync('assets/f1-racing-v1.js','utf8'),css=fs.readFileSync('assets/f1-racing-r319.css','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of ['f1-grid-gacha-card-host-v323','data-gacha-renderer-v323="shared"','const shared=window.multiDrawCardHTML(player'])if(!core.includes(token))issues.push('Phase 323 core host missing: '+token);
 for(const token of ['.f1-grid-gacha-card-host-v323{','>.gacha-card,','position:absolute!important;inset:0!important','object-fit:contain!important'])if(!css.includes(token))issues.push('Phase 323 CSS host missing: '+token);
 for(const token of ['Phase 323 Gacha host overflows reveal viewport',"gachaHost323?.dataset?.gachaRendererV323==='shared'"])if(!diag.includes(token))issues.push('Phase 323 Recovery H host check missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase323-f1-gacha-host-audit.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }
 const result={phase:323,name:'f1-gacha-host',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase323F1GachaHostAudit();
