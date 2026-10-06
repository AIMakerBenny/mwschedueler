import fs from 'node:fs';import {spawnSync} from 'node:child_process';
export function runPhase327F1LabelTagSeparationCompatibilityAudit(){
 const issues=[],warnings=[],core=fs.readFileSync('assets/f1-racing-v1.js','utf8');
 for(const token of ["const VERSION327='phase327-f1-label-tag-separation-compatibility';","const y=22;","y:35,width:32,height:14"])if(!core.includes(token))issues.push('Phase 327 core missing: '+token);
 const run=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(run.status!==0)issues.push('F1 JS syntax failed');
 const result={phase:327,name:'f1-label-tag-separation-compatibility',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase327F1LabelTagSeparationCompatibilityAudit();