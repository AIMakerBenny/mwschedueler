import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase288F1LayoutResetViewportFitAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),patch=fs.readFileSync('assets/f1-racing-r288-r290.js','utf8'),css=fs.readFileSync('assets/f1-racing-r288-r290.css','utf8');
 for(const token of ["const VERSION288='phase288-f1-r13-layout-reset-viewport-fit';",'function computeWorkspaceFitV288(','function applyWorkspaceViewportFitV288(){','function installWorkspaceViewportFitV288(){','function qaWorkspaceViewportFitV288(){','targetViewports:Object.freeze([','defaultMaxHeightPx:640','window.__mwsF1RacingV288=VERSION288;'])if(!patch.includes(token))issues.push('Phase 288 patch missing: '+token);
 for(const token of ['#f1RacingWorkspaceRecoveryE.f1-racing-workspace-fit-v288','margin-bottom:0!important','min-height:0!important'])if(!css.includes(token))issues.push('Phase 288 CSS missing: '+token);
 if(!index.includes('assets/f1-racing-r288-r290.js?phase=')||!index.includes('assets/f1-racing-r288-r290.css?phase='))issues.push('Phase 288 asset links missing');
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-r288-r290.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('Phase 288 patch syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:288,name:'f1-r13-layout-reset-viewport-fit',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase288F1LayoutResetViewportFitAudit();
