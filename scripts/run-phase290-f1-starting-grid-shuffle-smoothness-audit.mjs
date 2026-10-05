import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase290F1StartingGridShuffleSmoothnessAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),patch=fs.readFileSync('assets/f1-racing-r288-r290.js','utf8'),css=fs.readFileSync('assets/f1-racing-r288-r290.css','utf8');
 for(const token of ["const VERSION290='phase290-f1-r15-starting-grid-shuffle-smoothness';",'const SHUFFLE_VISUAL_CONFIG_V290=Object.freeze({shuffleCycles:3','function syncGridShuffleSmoothnessV290(){','function installGridShuffleSmoothnessV290(){','function qaGridShuffleSmoothnessV290(){','window.__mwsF1RacingV290=VERSION290;'])if(!patch.includes(token))issues.push('Phase 290 patch missing: '+token);
 for(const token of ['@keyframes f1GridShuffleSmoothV290','animation:f1GridShuffleSmoothV290 .18s','3 both','@keyframes f1GridCardLandSmoothV290','translate3d(var(--grid-fly-x-v273,0),var(--grid-fly-y-v273,-80px),0)'])if(!css.includes(token))issues.push('Phase 290 CSS missing: '+token);
 if(/@keyframes f1GridShuffleSmoothV290[\s\S]*?\b(?:left|top)\s*:/.test(css))issues.push('Phase 290 shuffle keyframes must remain transform-only');
 if(!index.includes('assets/f1-racing-r288-r290.js?phase=290')||!index.includes('assets/f1-racing-r288-r290.css?phase=290'))issues.push('Phase 290 asset cache links missing');
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-r288-r290.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('Phase 290 patch syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:290,name:'f1-r15-starting-grid-shuffle-smoothness',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase290F1StartingGridShuffleSmoothnessAudit();
