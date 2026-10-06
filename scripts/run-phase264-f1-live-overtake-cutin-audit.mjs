import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase264F1LiveOvertakeCutinAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),css=fs.readFileSync('assets/f1-racing-v1.css','utf8'),live=fs.readFileSync('scripts/diagnose-recovery-h-f1-live.mjs','utf8');
 const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);if(phase<264)issues.push('Phase 264 asset cache missing');
 for(const token of ["const VERSION264='phase264-live-overtake-comic-cutin';",'const LIVE_CUTIN_CONFIG_V264=Object.freeze({','function liveCutinEventV264(','function enqueueLiveCutinV264(','function drainLiveCutinQueueV264(','function resetLiveCutinsV264(','function qaLiveCutinV264(){','enqueueLiveCutinV264(vehicle,next,targetId);','window.mwsF1QaLiveCutinV264=qaLiveCutinV264;','window.__mwsF1RacingV264=VERSION264;'])if(!racing.includes(token))issues.push('Phase 264 runtime missing: '+token);
 for(const token of ['id="f1RacingLiveCutinLayerV264"','class="f1-racing-live-cutin-layer-v264"'])if(!index.includes(token))issues.push('Phase 264 layer missing: '+token);
 for(const token of ['/* Phase 264: LIVE comic overtake cut-ins */','.f1-racing-live-cutin-v264.is-visible','@keyframes f1LiveCutinSpeedV264','@keyframes f1LiveCutinBurstV264','prefers-reduced-motion'])if(!css.includes(token))issues.push('Phase 264 CSS missing: '+token);
 const triggerBlock=racing.slice(racing.indexOf('function liveCutinEventV264('),racing.indexOf('function liveCutinMessageV264('));
 for(const state of ['PULLING_OUT','SIDE_BY_SIDE','COUNTER_ATTACK','PASS_COMPLETED'])if(!triggerBlock.includes(state))issues.push('Phase 264 trigger missing: '+state);
 for(const token of ['Phase 264 LIVE cut-in QA failed','maxActive','dedupeMs'])if(!live.includes(token))issues.push('Phase 264 Recovery H QA missing: '+token);
 const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});if(syntax.status!==0)issues.push('F1 JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
 const result={phase:264,name:'f1-live-overtake-cutin',issues,warnings,pass:issues.length===0};console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase264F1LiveOvertakeCutinAudit();
