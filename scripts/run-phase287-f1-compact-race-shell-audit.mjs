import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase287F1CompactRaceShellAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),patch=fs.readFileSync('assets/f1-racing-r283-r287.js','utf8'),css=fs.readFileSync('assets/f1-racing-r283-r287.css','utf8');
 for(const token of ["const VERSION287='phase287-f1-r12-compact-race-shell-sidebar-hide';",'const COMPACT_RACE_CONFIG_V287=Object.freeze({','function syncRaceCompactShellV287(forcedState=null){','function qaRaceCompactShellV287(){','window.__mwsF1RacingV287=VERSION287;'])if(!patch.includes(token))issues.push('Phase 287 patch missing: '+token);
 for(const token of ['body.f1-racing-r12-compact-v287 .sidebar','body.f1-racing-r12-compact-v287 .main>.topbar','body.f1-racing-r12-compact-v287 #f1RacingViewRaceV185','body.f1-racing-r12-compact-v287 #f1RacingWorkspaceToolbarRecoveryE'])if(!css.includes(token))issues.push('Phase 287 CSS missing: '+token);
 if(!index.includes('assets/f1-racing-r283-r287.js?phase=287')||!index.includes('assets/f1-racing-r283-r287.css?phase=287'))issues.push('Phase 287 asset links missing');
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-r283-r287.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('Phase 287 patch syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:287,name:'f1-r12-compact-race-shell-sidebar-hide',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase287F1CompactRaceShellAudit();
