import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase292F1IntegratedDesktopQaAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),patch=fs.readFileSync('assets/f1-racing-r291-r295.js','utf8');
 for(const token of ["const VERSION292='phase292-f1-r17-integrated-desktop-qa';",'function installFinalDesktopQaV292(){','function qaFinalDesktopV292(){','liveConversation:typeof window.mwsF1QaLiveConversationStackV276','dialogueCadence:typeof window.mwsF1QaDialogueCadenceV281','layoutReset:typeof window.mwsF1QaWorkspaceViewportFitV288','finishOverlay:typeof window.mwsF1QaFinishOverlayV291','window.mwsF1QaFinalDesktopV292=qaFinalDesktopV292;','window.__mwsF1RacingV292=VERSION292;'])if(!patch.includes(token))issues.push('Phase 292 patch missing: '+token);
 if(!index.includes('assets/f1-racing-r291-r295.js?phase=292')||!index.includes('assets/f1-racing-r291-r295.css?phase=292'))issues.push('Phase 292 asset cache links missing');
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-r291-r295.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('Phase 292 patch syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:292,name:'f1-r17-integrated-desktop-qa',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase292F1IntegratedDesktopQaAudit();
