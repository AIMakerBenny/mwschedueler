import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
export function runPhase227F1CommentaryCadenceAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const phase=Number(index.match(/recovery=N1&phase=(\d+)/)?.[1]||0);
  if(phase<227)issues.push('Phase 227 asset cache missing');
  for(const token of [
    "const VERSION227='phase227-commentary-cadence-quality';",
    'const COMMENTARY_CADENCE_V227=Object.freeze({flowGapMs:5500,strategyGapMs:3000,battleGapMs:1600,windowMs:60000,maxNarrativePerWindow:18});',
    'function commentaryCadenceAllowsV227(type=\'flow\',bypass=false){',
    'if(!commentaryCadenceAllowsV227(type,bypassCadence))return false;',
    'function qaCommentaryCadenceV227(){',
    'window.mwsF1QaCommentaryCadenceV227=qaCommentaryCadenceV227;',
    'window.__mwsF1RacingV227=VERSION227;'
  ])if(!racing.includes(token))issues.push('Phase 227 commentary cadence missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('F1 JS syntax failed');
  const result={phase:227,name:'f1-commentary-cadence-quality',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runPhase227F1CommentaryCadenceAudit();
