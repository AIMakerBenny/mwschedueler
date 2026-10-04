import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase233F1TrackSilhouetteCardsAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<233)issues.push('Phase 233 asset cache missing');
  for(const token of [
    "const VERSION233='phase233-track-silhouette-cards';",
    "path:String(track.path||''),",
    'f1-racing-track-card-silhouette-v233',
    'function qaTrackSilhouetteCardsV233(){',
    'window.mwsF1QaTrackSilhouetteCardsV233=qaTrackSilhouetteCardsV233;',
    'window.__mwsF1RacingV233=VERSION233;'
  ])if(!racing.includes(token))issues.push('Phase 233 track silhouette runtime missing: '+token);
  for(const token of ['.f1-racing-track-card-silhouette-v233{','.f1-racing-track-card-silhouette-v233 path{'])if(!css.includes(token))issues.push('Phase 233 silhouette CSS missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed');
  const result={phase:233,name:'f1-track-silhouette-cards',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase233F1TrackSilhouetteCardsAudit();
