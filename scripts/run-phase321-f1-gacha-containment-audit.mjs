import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase321F1GachaContainmentAudit(){
 const issues=[],warnings=[];
 const app=fs.readFileSync('assets/app-core.js','utf8'),css=fs.readFileSync('assets/f1-racing-r319.css','utf8'),index=fs.readFileSync('index.html','utf8'),diag=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 for(const token of ['window.multiDrawCardHTML=multiDrawCardHTML;','function multiDrawCardHTML(player){'])if(!app.includes(token))issues.push('Phase 321 Gacha export missing: '+token);
 for(const token of ['>.f1-grid-gacha-fallback-card-v313{','object-fit:contain!important','max-height:100%!important'])if(!css.includes(token))issues.push('Phase 321 Gacha CSS missing: '+token);
 if(!index.includes('f1persistD&f1grid321=1'))issues.push('Phase 321 app-core cache bust missing');
 for(const token of ['Phase 321 Gacha card overflows reveal viewport','Phase 321 Gacha portrait must use contain fit','Phase 321 F1 grid did not reuse the real Gacha card renderer'])if(!diag.includes(token))issues.push('Phase 321 Recovery H missing: '+token);
 for(const file of ['scripts/diagnose-recovery-h-f1-live.mjs','scripts/run-phase321-f1-gacha-containment-audit.mjs']){
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim());
 }
 if(!app.includes('window.multiDrawCardHTML=multiDrawCardHTML;'))issues.push('Phase 321 browser renderer export missing after static validation');
 const result={phase:321,name:'f1-gacha-containment',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase321F1GachaContainmentAudit();
