import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runPhase177SplitQuickDateTimeAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const css=fs.readFileSync('assets/app-core.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'class="event-datetime-quick-grid-v177"',
    'id="evDateTimeQuickStartV177"',
    'id="evDateTimeQuickEndV177"',
    '시작 빠른 입력',
    '종료 빠른 입력',
    '시작 입력은 날짜와 시작시간을, 종료 입력은 종료시간만 적용합니다. 초 단위는 저장하지 않습니다.',
    'app-core.js?v=1.3.0-search115-wardogs116-backup126-datetime149-calendarsearch171-searchtab172-drag174-endquick175-workspace176-splitquick177',
    'app-core.css?v=1.6.21-profileimgfix1-calendarsearch171-searchtab172-drag174-workspace176-splitquick177'
  ])if(!index.includes(token))issues.push('Phase 177 split quick UI/cache missing: '+token);
  if(index.includes('id="evDateTimeQuickV149"'))issues.push('legacy combined quick input still exists');

  for(const token of [
    '.event-datetime-quick-grid-v177{',
    'grid-template-columns:minmax(0,1fr) minmax(0,1fr);',
    '@media(max-width:700px)',
    '.event-datetime-quick-grid-v177{grid-template-columns:minmax(0,1fr)}'
  ])if(!css.includes(token))issues.push('Phase 177 responsive layout missing: '+token);

  for(const token of [
    'function parseQuickEventDateTimeV149(raw){',
    'function parseQuickEventEndTimeV177(raw){',
    'function applyQuickEventDateTimeV149(raw,{showError=false}={}){',
    'function applyQuickEventEndTimeV177(raw,{showError=false}={}){',
    "const startInput=document.getElementById('evDateTimeQuickStartV177');",
    "const endInput=document.getElementById('evDateTimeQuickEndV177');",
    "window.parseQuickEventEndTimeV177=parseQuickEventEndTimeV177;",
    "window.applyQuickEventEndTimeV177=applyQuickEventEndTimeV177;",
    "window.__mwsEventDateTimeQuickV149='split-start-end-input-v177';"
  ])if(!core.includes(token))issues.push('Phase 177 runtime missing: '+token);

  const startApplyStart=core.indexOf('function applyQuickEventDateTimeV149(raw,{showError=false}={}){');
  const startApplyEnd=core.indexOf('\n}\nfunction applyQuickEventEndTimeV177',startApplyStart);
  const endApplyStart=core.indexOf('function applyQuickEventEndTimeV177(raw,{showError=false}={}){');
  const endApplyEnd=core.indexOf('\n}\nwindow.parseQuickEventDateTimeV149',endApplyStart);
  if(startApplyStart<0||startApplyEnd<0)issues.push('Phase 177 start apply source could not be isolated');
  else{
    const body=core.slice(startApplyStart,startApplyEnd);
    if(body.includes("getElementById('evEnd')")||body.includes("#evEndDisplay"))issues.push('start quick apply must not mutate end time');
  }
  if(endApplyStart<0||endApplyEnd<0)issues.push('Phase 177 end apply source could not be isolated');
  else{
    const body=core.slice(endApplyStart,endApplyEnd);
    if(body.includes("getElementById('evDate')")||body.includes("getElementById('evStart')")||body.includes("#evDateDisplay")||body.includes("#evStartDisplay"))issues.push('end quick apply must not mutate date/start time');
  }

  const startParserStart=core.indexOf('function parseQuickEventDateTimeV149(raw){');
  const startParserEnd=core.indexOf('\n}\nfunction parseQuickEventEndTimeV177',startParserStart);
  const endParserStart=core.indexOf('function parseQuickEventEndTimeV177(raw){');
  const endParserEnd=core.indexOf('\n}\nfunction applyQuickEventDateTimeV149',endParserStart);
  if(startParserStart>=0&&startParserEnd>=0&&endParserStart>=0&&endParserEnd>=0){
    try{
      const parseStart=Function(`${core.slice(startParserStart,startParserEnd+2)};return parseQuickEventDateTimeV149;`)();
      const parseEnd=Function(`${core.slice(endParserStart,endParserEnd+2)};return parseQuickEventEndTimeV177;`)();
      if(JSON.stringify(parseStart('2026-10-03, 12:12:51'))!==JSON.stringify({date:'2026-10-03',time:'12:12',second:51}))issues.push('start parser did not discard seconds correctly');
      if(JSON.stringify(parseEnd('14:30:00'))!==JSON.stringify({time:'14:30',second:0,sourceDate:null}))issues.push('end parser did not discard seconds correctly');
      if(JSON.stringify(parseEnd('2026-10-03, 14:30:00'))!==JSON.stringify({time:'14:30',second:0,sourceDate:'2026-10-03'}))issues.push('full datetime end parser mismatch');
      if(parseStart('2026-10-03, 12:12:51, 14:30:00')!==null)issues.push('legacy combined start/end format is still accepted');
    }catch(error){
      issues.push('Phase 177 parser execution failed: '+String(error?.message||error));
    }
  }else issues.push('Phase 177 parser sources could not be isolated');

  for(const token of [
    'node --check scripts/run-phase177-split-quick-datetime-audit.mjs',
    "echo '[phase177] split quick datetime inputs'",
    'id="evDateTimeQuickStartV177"',
    'id="evDateTimeQuickEndV177"',
    "window.__mwsEventDateTimeQuickV149='split-start-end-input-v177';"
  ])if(!workflow.includes(token))issues.push('Phase 177 production verification missing: '+token);

  const syntax=spawnSync(process.execPath,['--check','--input-type=commonjs'],{input:core,encoding:'utf8'});
  if(syntax.status!==0)issues.push('assets/app-core.js syntax check failed: '+String(syntax.stderr||syntax.stdout||'').trim());

  const result={phase:177,name:'split-quick-datetime-inputs',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase177SplitQuickDateTimeAudit();
