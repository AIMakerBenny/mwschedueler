import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase289F1PreraceScreenCompressionAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),patch=fs.readFileSync('assets/f1-racing-r288-r290.js','utf8'),css=fs.readFileSync('assets/f1-racing-r288-r290.css','utf8');
 for(const token of ["const VERSION289='phase289-f1-r14-prerace-screen-compression';",'function syncPreraceCompactV289(','function installPreraceCompactV289(){','function qaPreraceCompactV289(){',"states:Object.freeze(['TRANSITION','GRID'])",'window.__mwsF1RacingV289=VERSION289;'])if(!patch.includes(token))issues.push('Phase 289 patch missing: '+token);
 for(const token of ['body.f1-racing-r14-prerace-compact-v289 #f1RacingViewGridV185','.f1-racing-grid-brief-v244>p{display:none!important}','body.f1-racing-r14-prerace-compact-v289 #f1RacingViewTransitionV185'])if(!css.includes(token))issues.push('Phase 289 CSS missing: '+token);
 const jsMatch=index.match(/assets\/f1-racing-r288-r290\.js\?phase=(\d+)/),cssMatch=index.match(/assets\/f1-racing-r288-r290\.css\?phase=(\d+)/);if(!jsMatch||!cssMatch||Number(jsMatch[1])<289||Number(cssMatch[1])<289)issues.push('Phase 289 asset cache links missing or stale');
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-r288-r290.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('Phase 289 patch syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:289,name:'f1-r14-prerace-screen-compression',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase289F1PreraceScreenCompressionAudit();
