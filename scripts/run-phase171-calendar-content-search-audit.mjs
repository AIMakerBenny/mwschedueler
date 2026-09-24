import fs from 'node:fs';

export function runPhase171CalendarContentSearchAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const css=fs.readFileSync('assets/app-core.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    "assets/app-core.js?v=1.3.0-search115-wardogs116-backup126-datetime149-calendarsearch171",
    "assets/app-core.css?v=1.6.21-profileimgfix1-calendarsearch171",
    'id="calendarSearchV171"',
    'id="calendarSearchClearV171"',
    'id="calendarSearchStatusV171"',
    '연락처, 게임, 컨텐츠 제목 또는 초성 검색'
  ])if(!index.includes(token))issues.push('Phase 171 calendar search UI/cache token missing: '+token);

  for(const token of [
    "function calendarEventSearchFieldsV171(event){",
    "String(event?.title||'')",
    "String(event?.steamGame?.name||'')",
    "Array.isArray(event?.participants)?event.participants:[]",
    "const person=contact(id);",
    "mwsTextMatches(value,q)",
    "function applyCalendarSearchHighlightsV171(){",
    "day.classList.toggle('calendar-search-hit-v171',count>0);",
    "input.addEventListener('input',scheduleCalendarSearchHighlightsV171);",
    "input.addEventListener('compositionend',()=>{",
    "window.__mwsCalendarSearchV171='title-participant-game-choseong-date-glow';",
    "initCalendarSearchV171();"
  ])if(!app.includes(token))issues.push('Phase 171 calendar search runtime missing: '+token);

  if(!app.includes("if(!q||!event||event.restDay)return false;"))
    issues.push('Phase 171 calendar search must ignore rest-day placeholders');
  if(!app.includes("setTimeout(applyCalendarSearchHighlightsV171,70)"))
    issues.push('Phase 171 calendar search input debounce missing');
  if((app.match(/applyCalendarSearchHighlightsV171\(\);/g)||[]).length<3)
    issues.push('Phase 171 calendar search does not reapply after render/input/clear');

  for(const token of [
    '/* Phase 171: calendar content search and matching-date glow. */',
    '.calendar-searchbar-v171{',
    '#calendarGrid .day.calendar-search-hit-v171{',
    'box-shadow:',
    'body[data-device-mode="mobile"] #calendar.section #calendarGrid.calendar .day.calendar-search-hit-v171'
  ])if(!css.includes(token))issues.push('Phase 171 calendar search CSS missing: '+token);

  for(const token of [
    'run-phase171-calendar-content-search-audit.mjs',
    "assets/app-core.js?v=1.3.0-search115-wardogs116-backup126-datetime149-calendarsearch171",
    "assets/app-core.css?v=1.6.21-profileimgfix1-calendarsearch171",
    "__mwsCalendarSearchV171='title-participant-game-choseong-date-glow'",
    'calendar-search-hit-v171'
  ])if(!workflow.includes(token))issues.push('Phase 171 workflow verification missing: '+token);

  const summary={phase:171,name:'calendar-title-participant-game-choseong-search',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase171CalendarContentSearchAudit();
