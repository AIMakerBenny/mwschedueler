import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase291F1FinishPodiumResultOverlayAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),patch=fs.readFileSync('assets/f1-racing-r291-r295.js','utf8'),css=fs.readFileSync('assets/f1-racing-r291-r295.css','utf8');
 for(const token of ["const VERSION291='phase291-f1-r16-finish-podium-result-overlay';",'function ensureFinishOverlayV291(){','function renderFinishOverlayV291(','function syncFinishOverlayV291(){','window.mwsF1SetScreenStateV185?.(\'RACE\',{force:true})','window.mwsF1GetRaceResultRecoveryG?.()','window.__mwsF1RacingV291=VERSION291;'])if(!patch.includes(token))issues.push('Phase 291 patch missing: '+token);
 for(const token of ['.f1-racing-finish-overlay-v291{','.f1-racing-finish-podium-v291{','.f1-racing-finish-results-v291{','#f1RacingViewRaceV185{position:relative}'])if(!css.includes(token))issues.push('Phase 291 CSS missing: '+token);
 if(!index.includes('assets/f1-racing-r291-r295.js?phase=')||!index.includes('assets/f1-racing-r291-r295.css?phase='))issues.push('Phase 291 asset links missing');
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-r291-r295.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('Phase 291 patch syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:291,name:'f1-r16-finish-podium-result-overlay',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase291F1FinishPodiumResultOverlayAudit();
