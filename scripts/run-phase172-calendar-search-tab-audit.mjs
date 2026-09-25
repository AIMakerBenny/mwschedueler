import fs from 'node:fs';

export function runPhase172CalendarSearchTabAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const css=fs.readFileSync('assets/app-core.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    "assets/app-core.js?v=1.3.0-search115-wardogs116-backup126-datetime149-calendarsearch171-searchtab172",
    "assets/app-core.css?v=1.6.21-profileimgfix1-calendarsearch171-searchtab172",
    'data-calendar-view-tab="month"',
    'data-calendar-view-tab="search"',
    'id="calendarMonthPanelV172"',
    'id="calendarSearchPanelV172"',
    'id="calendarSearchRangeV172"',
    'id="calendarSearchSortV172"',
    'id="calendarSearchResultsV172"',
    'data-calendar-search-type="contact"',
    'data-calendar-search-type="game"',
    'data-calendar-search-type="title"'
  ])if(!index.includes(token))issues.push('Phase 172 tab/search UI token missing: '+token);

  for(const token of [
    "function renderCalendarSearchResultsV172(){",
    "function setCalendarViewModeV172(mode){",
    "function initCalendarViewTabsV172(){",
    "function calendarSearchDateBoundsV172(){",
    "function calendarSearchResultCardV172(event,query){",
    "calendarEventMatchesSearchV171(event,query,type)",
    "calendarEventInSearchRangeV172(event)",
    "data-calendar-search-event-id",
    "if(id)openEvent(id);",
    "window.__mwsCalendarSearchTabV172='second-tab-date-grouped-list';"
  ])if(!app.includes(token))issues.push('Phase 172 runtime token missing: '+token);

  for(const token of [
    '/* Phase 171/172: calendar search moved to a dedicated second tab with date-grouped results. */',
    '.calendar-view-tabs-v172{',
    '.calendar-view-tab-v172.active{',
    '.calendar-search-date-group-v172{',
    '.calendar-search-result-v172{',
    '.calendar-search-empty-v172{'
  ])if(!css.includes(token))issues.push('Phase 172 CSS token missing: '+token);

  if(index.includes('calendar-search-hit-v171'))issues.push('retired Phase 171 date-glow markup remains');
  if(app.includes('calendar-search-hit-v171'))issues.push('retired Phase 171 date-glow runtime remains');
  if(css.includes('calendar-search-hit-v171'))issues.push('retired Phase 171 date-glow CSS remains');

  for(const token of [
    'run-phase172-calendar-search-tab-audit.mjs',
    "assets/app-core.js?v=1.3.0-search115-wardogs116-backup126-datetime149-calendarsearch171-searchtab172",
    "assets/app-core.css?v=1.6.21-profileimgfix1-calendarsearch171-searchtab172",
    "__mwsCalendarSearchTabV172='second-tab-date-grouped-list'",
    'calendar-search-date-group-v172'
  ])if(!workflow.includes(token))issues.push('Phase 172 workflow verification missing: '+token);

  const summary={phase:172,name:'calendar-search-second-tab-date-grouped-list',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase172CalendarSearchTabAudit();
