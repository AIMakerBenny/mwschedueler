import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase178CircularTimeWheelAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'assets/app-core.js?v=1.3.0-search115-wardogs116-backup126-datetime149-calendarsearch171-searchtab172-drag174-endquick175-workspace176-splitquick177-circular178',
    'data-time-target="evStart"',
    'data-time-target="evEnd"',
    "onclick=\"openTimePicker('worldBaseTime')\""
  ])if(!index.includes(token))issues.push('Phase 178 time-picker entry/cache missing: '+token);

  for(const token of [
    'const circularWheelCopiesV178=7;',
    "function isCircularTimeWheelV178(kind){return kind==='hour'||kind==='minute'}",
    'function circularWheelStepValueV178(kind,value,direction){',
    'data-wheel-copy=',
    'data-circular=',
    'function rebaseCircularWheelV178(col,item){',
    "window.__mwsCircularTimeWheelV178='hour-minute-loop-all-shared-time-pickers';",
    "const start=e?(e.start||'TBD'):'TBD',end=e?(e.end||'TBD'):'TBD';",
    "textContent=start==='TBD'?'미지정':formatTimeKorean(start);",
    "textContent=end==='TBD'?'미지정':formatTimeKorean(end);",
    "onclick=\"setTimeTBD()\">미지정</button>",
    "document.querySelector('#'+target+'Display span').textContent='미지정';"
  ])if(!core.includes(token))issues.push('Phase 178 runtime/default missing: '+token);

  const helperStart=core.indexOf('function isCircularTimeWheelV178(kind){');
  const helperEnd=core.indexOf('\nfunction openTimePicker(target){',helperStart);
  if(helperStart<0||helperEnd<0){
    issues.push('Phase 178 circular helper source could not be isolated');
  }else{
    try{
      const prefix="const circularWheelCopiesV178=7;\nconst circularWheelMiddleCopyV178=Math.floor(circularWheelCopiesV178/2);\n";
      const source=prefix+core.slice(helperStart,helperEnd);
      const step=Function(`${source};return circularWheelStepValueV178;`)();
      const circular=Function(`${source};return isCircularTimeWheelV178;`)();
      const cases=[
        ['hour',12,1,1],
        ['hour',1,-1,12],
        ['minute',55,1,0],
        ['minute',0,-1,55],
        ['minute',25,1,30]
      ];
      for(const [kind,value,direction,expected] of cases){
        const actual=step(kind,value,direction);
        if(actual!==expected)issues.push(`Phase 178 wrap mismatch ${kind} ${value} ${direction}: ${actual}`);
      }
      if(!circular('hour')||!circular('minute')||circular('ampm'))issues.push('Phase 178 circular kinds are incorrect');
    }catch(error){
      issues.push('Phase 178 circular helper execution failed: '+String(error?.message||error));
    }
  }

  const pickerTargets=[...index.matchAll(/data-time-target="([^"]+)"/g)].map(m=>m[1]).sort();
  if(JSON.stringify(pickerTargets)!==JSON.stringify(['evEnd','evStart']))issues.push('Unexpected .time-trigger target set: '+JSON.stringify(pickerTargets));
  if(!index.includes("openTimePicker('worldBaseTime')"))issues.push('worldBaseTime is not using shared time picker');
  if((core.match(/function openTimePicker\(target\)\{/g)||[]).length!==1)issues.push('shared openTimePicker ownership is not singular');

  for(const token of [
    'node --check scripts/run-phase178-circular-time-wheel-audit.mjs',
    "echo '[phase178] circular hour/minute time wheels and new-event TBD defaults'",
    "window.__mwsCircularTimeWheelV178='hour-minute-loop-all-shared-time-pickers';"
  ])if(!workflow.includes(token))issues.push('Phase 178 production verification missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','--input-type=commonjs'],{input:core,encoding:'utf8'});
  if(syntax.status!==0)issues.push('assets/app-core.js syntax check failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:178,name:'circular-time-wheel-and-new-event-tbd',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase178CircularTimeWheelAudit();
