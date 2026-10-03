import fs from 'node:fs';

export function runPhase149ContentDateTimeQuickInputAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const runtime=fs.readFileSync('assets/app-core.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'id="evDateTimeQuickStartV177"',
    'id="evDateTimeQuickStatusV149"',
    'placeholder="예: 2026-10-03, 12:12:51"'
  ])if(!index.includes(token))issues.push('Phase 149 start quick datetime UI missing: '+token);

  for(const token of [
    'function parseQuickEventDateTimeV149(raw){',
    'function applyQuickEventDateTimeV149(raw,{showError=false}={}){',
    "if(dateInput)dateInput.value=parsed.date;",
    "if(startInput)startInput.value=parsed.time;",
    "if(dateText)dateText.textContent=formatDate(parsed.date);",
    "if(startText)startText.textContent=formatTimeKorean(parsed.time);",
    "if(typeof updateRepeatEditorUI==='function')updateRepeatEditorUI();",
    "startInput.addEventListener('input',()=>{if(parseQuickEventDateTimeV149(startInput.value))applyQuickEventDateTimeV149(startInput.value)});",
    "window.__mwsEventDateTimeQuickV149='split-start-end-input-v177';",
    "if(quickStartInput)quickStartInput.value='';"
  ])if(!runtime.includes(token))issues.push('Phase 149 runtime missing: '+token);

  const fnStart=runtime.indexOf('function parseQuickEventDateTimeV149(raw){');
  const fnEnd=runtime.indexOf('\n}\nfunction parseQuickEventEndTimeV177',fnStart);
  if(fnStart<0||fnEnd<0){
    issues.push('Phase 149 parser source could not be isolated');
  }else{
    try{
      const fnSource=runtime.slice(fnStart,fnEnd+2);
      const parse=Function(`${fnSource};return parseQuickEventDateTimeV149;`)();
      const cases=[
        ['2026-10-03, 12:12:51',{date:'2026-10-03',time:'12:12',second:51}],
        ['2026-10-03 12:12',{date:'2026-10-03',time:'12:12',second:null}],
        ['2026-10-03T12:12:51',{date:'2026-10-03',time:'12:12',second:51}],
        ['2026/10/03 12:12',{date:'2026-10-03',time:'12:12',second:null}]
      ];
      for(const [input,expected] of cases){
        const actual=parse(input);
        if(JSON.stringify(actual)!==JSON.stringify(expected))issues.push('Phase 149 parser mismatch for '+input+': '+JSON.stringify(actual));
      }
      for(const invalid of ['2026-02-30, 12:12:51','2026-10-03, 24:00:00','2026-10-03','2026-10-03, 12:12:51, 14:30:00']){
        if(parse(invalid)!==null)issues.push('Phase 149 parser accepted invalid input: '+invalid);
      }
    }catch(error){
      issues.push('Phase 149 parser execution failed: '+String(error?.message||error));
    }
  }

  for(const token of [
    'run-phase149-content-datetime-quick-input-audit.mjs',
    'splitquick177',
    'id="evDateTimeQuickStartV177"'
  ])if(!workflow.includes(token))issues.push('production Phase 149 verification missing: '+token);

  const summary={phase:149,name:'content-datetime-quick-start-input',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase149ContentDateTimeQuickInputAudit();
