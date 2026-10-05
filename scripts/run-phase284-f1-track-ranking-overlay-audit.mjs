import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase284F1TrackRankingOverlayAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),patch=fs.readFileSync('assets/f1-racing-r283-r287.js','utf8'),css=fs.readFileSync('assets/f1-racing-r283-r287.css','utf8');
 for(const token of ["const VERSION284='phase284-f1-r09-track-ranking-overlay';",'function ensureTrackRankingV284(){','function syncTrackRankingV284(force=false){','function qaTrackRankingOverlayV284(){','window.__mwsF1RacingV284=VERSION284;'])if(!patch.includes(token))issues.push('Phase 284 patch missing: '+token);
 for(const token of ['.f1-racing-track-ranking-v284{','.f1-racing-track-ranking-row-v284{'])if(!css.includes(token))issues.push('Phase 284 CSS missing: '+token);
 if(!index.includes('assets/f1-racing-r283-r287.js?phase=284')||!index.includes('assets/f1-racing-r283-r287.css?phase=284'))issues.push('Phase 284 asset links missing');
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-r283-r287.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('Phase 284 patch syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:284,name:'f1-r09-track-ranking-overlay',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase284F1TrackRankingOverlayAudit();
