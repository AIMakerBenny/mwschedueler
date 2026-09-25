import fs from 'node:fs';

export function runPhase171CalendarContentSearchAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const css=fs.readFileSync('assets/app-core.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    "assets/app-core.js?v=1.3.0-search115-wardogs116-backup126-datetime149-calendarsearch171-searchtab172",
    "assets/app-core.css?v=1.6.21-profileimgfix1-calendarsearch171-searchtab172",
    'id="calendarSearchV171"',
    'id="calendarSearchClearV171"',
    'id="calendarSearchStatusV171"',
    '연락처, 게임, 컨텐츠 제목 또는 초성 검색'
  ])if(!index.includes(token))issues.push('Phase 171 shared search UI/cache token missing: '+token);

  for(const token of [
    "function calendarEventSearchFieldsV171(event){",
    "function calendarEventSearchFieldGroupsV172(event){",
    "String(event?.title||'')",
    "String(event?.steamGame?.name||'')",
    "Array.isArray(event?.participants)?event.participants:[]",
    "const person=contact(id);",
    "mwsTextMatches(value,q)",
    "window.__mwsCalendarSearchV171='title-participant-game-choseong-engine';"
  ])if(!app.includes(token))issues.push('Phase 171 shared search engine missing: '+token);

  if(app.includes('calendar-search-hit-v171'))issues.push('Phase 171 date-glow runtime should be retired by Phase 172');
  if(css.includes('calendar-search-hit-v171'))issues.push('Phase 171 date-glow CSS should be retired by Phase 172');

  for(const token of [
    'run-phase171-calendar-content-search-audit.mjs',
    "assets/app-core.js?v=1.3.0-search115-wardogs116-backup126-datetime149-calendarsearch171-searchtab172",
    "assets/app-core.css?v=1.6.21-profileimgfix1-calendarsearch171-searchtab172",
    "__mwsCalendarSearchV171='title-participant-game-choseong-engine'"
  ])if(!workflow.includes(token))issues.push('Phase 171 workflow verification missing: '+token);

  warnings.push('Phase 171 matching engine is retained; its calendar-cell glow presentation is superseded by the Phase 172 search tab.');
  const summary={phase:171,name:'calendar-title-participant-game-choseong-engine',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase171CalendarContentSearchAudit();
