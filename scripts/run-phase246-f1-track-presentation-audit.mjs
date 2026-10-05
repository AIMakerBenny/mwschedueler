import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase246F1TrackPresentationAudit(){
 const issues=[],warnings=[];const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<246)issues.push('Phase 246 asset cache missing');
 for(const token of ["const VERSION246='phase246-clean-track-indicators';",'function addTrackIndicatorV246(','data-kind\':\'sector-indicator\'','function qaTrackPresentationV246(){','window.mwsF1QaTrackPresentationV246=qaTrackPresentationV246;','window.__mwsF1RacingV246=VERSION246;'])if(!racing.includes(token))issues.push('Phase 246 runtime missing: '+token);
 if(racing.includes("addTrackAnnotationV183(layer,path,'trap'"))issues.push('Phase 246 speed trap dots still rendered');
 if(racing.includes("addTrackAnnotationV183(layer,path,'overtake'"))issues.push('Phase 246 overtake detection dots still rendered');
 if(!css.includes('.f1-racing-track-indicator-v246 line{'))issues.push('Phase 246 indicator CSS missing');
 if(index.includes('<span><i class="trap"></i>스피드 트랩</span>'))issues.push('Phase 246 speed trap legend still visible');
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed');
 const result={phase:246,name:'f1-clean-track-indicators',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase246F1TrackPresentationAudit();
