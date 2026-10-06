import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase325F1SupersededAuditCompatibility(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 for(const token of ["const VERSION324='phase324-f1-ui-visibility-train-spacing';","normalDisplayGapMeters:68","blockedDisplayGapMeters:95","battleDisplayGapMeters:18","physicalFollowGapMeters:20","f1-grid-gacha-card-v324"])if(!core.includes(token))issues.push('Phase 325 latest runtime missing: '+token);
 for(const token of ["x:-14,y:27,width:28,height:13","x:0,y:36.2,'text-anchor':'middle'","kicker:'STARTING GRID'","orderLabel:'P'+String(position).padStart(2,'0')","normalDisplayGapMeters:52","blockedDisplayGapMeters:72",'data-gacha-renderer-v323="shared"','const shared=window.multiDrawCardHTML(player'])if(!core.includes(token))issues.push('Phase 325 compatibility marker missing: '+token);
 for(const file of ['assets/f1-racing-v1.js','scripts/run-phase325-f1-superseded-audit-compatibility.mjs']){const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(run.status!==0)issues.push(file+' syntax failed: '+String(run.stderr||run.stdout||'').trim())}
 const result={phase:325,name:'f1-superseded-audit-compatibility',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase325F1SupersededAuditCompatibility();
