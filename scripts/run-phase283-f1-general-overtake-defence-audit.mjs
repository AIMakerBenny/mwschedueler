import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase283F1GeneralOvertakeDefenceAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),patch=fs.readFileSync('assets/f1-racing-r283-r287.js','utf8');
 for(const token of ["const VERSION283='phase283-f1-r08-general-overtake-defence';",'function patchGeneralBattleV283(){','function qaGeneralOvertakeDefenceV283(){','window.__mwsF1RacingV283=VERSION283;'])if(!patch.includes(token))issues.push('Phase 283 patch missing: '+token);
 if(!index.includes('assets/f1-racing-r283-r287.js?phase='))issues.push('Phase 283 patch script not loaded');
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-r283-r287.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('Phase 283 patch syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:283,name:'f1-r08-general-overtake-defence',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase283F1GeneralOvertakeDefenceAudit();
