import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase175QuickEndTimeAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const core=fs.readFileSync('assets/app-core.js','utf8');

  for(const token of [
    'id="evDateTimeQuickEndV177"',
    'placeholder="예: 14:30:00"',
    '종료 빠른 입력'
  ])if(!index.includes(token))issues.push('quick end-time UI missing: '+token);

  for(const token of [
    'function parseQuickEventEndTimeV177(raw){',
    'function applyQuickEventEndTimeV177(raw,{showError=false}={}){',
    "const endInput=document.getElementById('evEnd');",
    "if(endInput)endInput.value=parsed.time;",
    "const endText=document.querySelector('#evEndDisplay span');",
    "if(endText)endText.textContent=formatTimeKorean(parsed.time);",
    "window.__mwsEventDateTimeQuickV149='split-start-end-input-v177';"
  ])if(!core.includes(token))issues.push('Phase 175 runtime missing: '+token);

  const fnStart=core.indexOf('function parseQuickEventEndTimeV177(raw){');
  const fnEnd=core.indexOf('\n}\nfunction applyQuickEventDateTimeV149',fnStart);
  if(fnStart<0||fnEnd<0){
    issues.push('quick end-time parser source could not be isolated');
  }else{
    try{
      const parse=Function(`${core.slice(fnStart,fnEnd+2)};return parseQuickEventEndTimeV177;`)();
      const cases=[
        ['14:30:00',{time:'14:30',second:0,sourceDate:null}],
        ['14:30',{time:'14:30',second:null,sourceDate:null}],
        ['2026-10-03, 14:30:00',{time:'14:30',second:0,sourceDate:'2026-10-03'}],
        ['2026-10-03T14:30',{time:'14:30',second:null,sourceDate:'2026-10-03'}]
      ];
      for(const [input,expected] of cases){
        const actual=parse(input);
        if(JSON.stringify(actual)!==JSON.stringify(expected))issues.push('quick end-time parser mismatch for '+input+': '+JSON.stringify(actual));
      }
      for(const invalid of ['24:00','14:60:00','2026-02-30, 14:30:00','2026-10-03']){
        if(parse(invalid)!==null)issues.push('quick end-time parser accepted invalid value: '+invalid);
      }
    }catch(error){
      issues.push('quick end-time parser execution failed: '+String(error?.message||error));
    }
  }

  const syntax=spawnSync(process.execPath,['--check','--input-type=commonjs'],{input:core,encoding:'utf8'});
  if(syntax.status!==0)issues.push('assets/app-core.js syntax check failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:175,name:'content-quick-end-time',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase175QuickEndTimeAudit();
