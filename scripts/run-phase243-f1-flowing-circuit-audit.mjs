import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase243F1FlowingCircuitAudit(){
 const issues=[],warnings=[];
 const index=fs.readFileSync('index.html','utf8'),racing=fs.readFileSync('assets/f1-racing-v1.js','utf8'),track=fs.readFileSync('assets/f1-track-v1.js','utf8'),css=fs.readFileSync('assets/f1-racing-v1.css','utf8');
 const runtimePhase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
 const trackPhase=Number(index.match(/f1-track-v1\.js[^"']*&phase=(\d+)/)?.[1]||0);
 if(runtimePhase<243||trackPhase<243)issues.push('Phase 243 asset cache missing');
 for(const token of ["const VERSION243='phase243-flowing-circuit-redesign';",'function qaTrackFlowDesignV243(){','window.mwsF1QaTrackFlowDesignV243=qaTrackFlowDesignV243;','window.__mwsF1RacingV243=VERSION243;'])if(!racing.includes(token))issues.push('Phase 243 runtime missing: '+token);
 if(!track.includes("root.__mwsF1TrackDesignV243='flowing-circuit-redesign-v1';"))issues.push('Phase 243 track design marker missing');
 const pathRows=[...track.matchAll(/path:'([^']+)'/g)].map(match=>match[1]);
 if(pathRows.length<7)issues.push('Phase 243 track paths missing');
 for(const path of pathRows.slice(0,7)){
   const curves=(path.match(/[CQ]/g)||[]).length,lines=(path.match(/L/g)||[]).length;
   if(curves<6||lines>1)issues.push('Phase 243 path remains too angular');
 }
 if(!css.includes('stroke-width:9;stroke-linecap:round'))issues.push('Phase 243 thin mini track stroke missing');
 const syntax1=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
 const syntax2=spawnSync(process.execPath,['--check','assets/f1-track-v1.js'],{encoding:'utf8'});
 if(syntax1.status!==0||syntax2.status!==0)issues.push('F1 JS syntax failed');
 const result={phase:243,name:'f1-flowing-circuit-redesign',issues,warnings,pass:issues.length===0};
 console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase243F1FlowingCircuitAudit();
