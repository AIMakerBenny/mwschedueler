import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase175QuickEndTimeAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const core=fs.readFileSync('assets/app-core.js','utf8');

  if(!index.includes('placeholder="예: 2026-10-03, 12:12:51, 14:30:00"'))issues.push('quick-input UI does not advertise end time');
  if(!index.includes('날짜와 시작/종료 시간을 한 번에 입력할 수 있습니다. 종료시간은 생략할 수 있습니다.'))issues.push('quick-input help text is stale');
  for(const token of [
    "const endInput=document.getElementById('evEnd');",
    "if(endInput&&parsed.endTime)endInput.value=parsed.endTime;",
    "const endText=document.querySelector('#evEndDisplay span');",
    "if(endText&&parsed.endTime)endText.textContent=formatTimeKorean(parsed.endTime);",
    "window.__mwsEventDateTimeQuickV149='date-start-end-time-paste-v175';"
  ])if(!core.includes(token))issues.push('Phase 175 runtime missing: '+token);

  const fnStart=core.indexOf('function parseQuickEventDateTimeV149(raw){');
  const fnEnd=core.indexOf('\n}\nfunction applyQuickEventDateTimeV149',fnStart);
  if(fnStart<0||fnEnd<0){
    issues.push('quick-input parser source could not be isolated');
  }else{
    try{
      const parse=Function(`${core.slice(fnStart,fnEnd+2)};return parseQuickEventDateTimeV149;`)();
      const cases=[
        ['2026-10-03, 12:12:51, 14:30:00',{date:'2026-10-03',time:'12:12',second:51,endTime:'14:30',endSecond:0}],
        ['2026-10-03 12:12 ~ 14:30',{date:'2026-10-03',time:'12:12',second:null,endTime:'14:30',endSecond:null}],
        ['2026-10-03T12:12:51',{date:'2026-10-03',time:'12:12',second:51}]
      ];
      for(const [input,expected] of cases){
        const actual=parse(input);
        if(JSON.stringify(actual)!==JSON.stringify(expected))issues.push('quick-input parser mismatch for '+input+': '+JSON.stringify(actual));
      }
      for(const invalid of ['2026-10-03, 12:12, 24:00','2026-02-30, 12:12, 14:30'])if(parse(invalid)!==null)issues.push('quick-input parser accepted invalid value: '+invalid);
    }catch(error){
      issues.push('quick-input parser execution failed: '+String(error?.message||error));
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
