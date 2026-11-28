import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('assets/app-core.js'),index=read('index.html');
const part=(text,first,last)=>{const a=text.indexOf(first),b=text.indexOf(last,a);assert(a>=0&&b>a,first);return text.slice(a,b)};
const shared=part(app,'const MWS_KOREAN_INITIALS=','function contactMatches(c');
const match=part(app,'function calendarSearchNormalizeV173','function calendarSearchShiftDateV172');
const render=part(app,'function calendarSearchShiftDateV172','function setCalendarViewModeV172');
const init=part(app,'function initCalendarSearchV172','function initCalendarViewTabsV172');
const view=part(app,'function setCalendarViewModeV172','function initCalendarSearchV172');
const tabs=part(app,'function initCalendarViewTabsV172','window.setCalendarViewModeV172=');
const topbar='<div class="calendar-topbar-v4">'+part(index,'<div class="calendar-view-tabs-v172"','        <div class="calendar-group-toolbar-v2">')+'</div>';
const preview=part(app,'function calendarGamePreviewV3','window.mwsCalendarGamePreviewV3');
const markup=part(index,'<div id="calendarSearchPanelV172"','    </section>').replace('data-calendar-view-panel="search" hidden','data-calendar-view-panel="search"');
const styles=['app-core.css','mawang-premium-v1621.css','device-ui.css','ui-frame-presets.css','workspace-clean-v1.css','calendar-toolbar-v4.css','calendar-search-v173.css'].map(p=>read('assets/'+p)).join('\n');
const fixtures=`
const data={gameLibrary:[{id:'wow',name:'월드 오브 워크래프트: 포에버',image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jw1cAAAAASUVORK5CYII='},{id:'custom',name:'New registered title',aliases:['My alias']}]};
const people={p1:{name:'우왁굳'},p2:{name:'마왕0216'}};
const contact=id=>people[id];
const category=()=>({color:'#16a2a0'});
const eventParticipantRows=e=>(e.participants||[]).map(id=>({person:contact(id)}));
const activeEvents=()=>events;
const esc=v=>String(v??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
const todayKST=()=>'2026-11-20',ymd=d=>d.toISOString().slice(0,10),formatDateWeekday=d=>d,formatTimeKorean=t=>t;
const events=[{id:'false1',title:'어워드',participants:['p1'],date:'2025-12-31',start:'13:00'},{id:'false2',title:'에이스컴뱃 8',steamGame:{name:'에이스 컴뱃 8: 시브의 날개'},date:'2026-10-01',start:'13:00'},{id:'wow1',title:'와포 오픈',steamGame:{id:'wow'},participants:['p2'],date:'2026-11-05',start:'10:00',end:'21:00'},{id:'wow2',title:'와우 포에버',steamGame:{id:'wow',name:'월드 오브 워크래프트: 포에버'},date:'2026-11-05',start:'14:00'},{id:'title',title:'와우 디톡스 풀트',steamGame:{name:'VRChat'},date:'2026-11-05',start:'14:00'},{id:'custom',title:'Custom title',steamGame:{id:'custom',name:'Old snapshot'},date:'2026-11-06',start:'TBD'},{id:'rest',title:'와우',restDay:true,date:'2026-11-06'}];
const openCalendarEventDetailsV1=id=>window.opened=id;
let calendarSearchTimerV171=0;
`;
const cases=[['와우','all',['wow1','wow2','title']],['와우','game',['wow1','wow2']],['WoW','game',['wow1','wow2']],['와포','game',['wow1','wow2']],['월드 오브 워크래프트','game',['wow1','wow2']],['와우','contact',[]],['ㅇㅇ','contact',['false1']],['New registered title','game',['custom']],['My alias','game',['custom']],['와우','title',['wow2','title']],['와우','all',['wow1','wow2','title']]];
// Exercise the real search functions without any browser or production data.
const context=vm.createContext({});vm.runInContext(fixtures+shared+match,context);
for(const [q,type,expected] of cases){const actual=vm.runInContext(`JSON.stringify(events.filter(e=>calendarEventMatchesSearchV171(e,${JSON.stringify(q)},${JSON.stringify(type)})).map(e=>e.id))`,context);assert.deepEqual(JSON.parse(actual),expected,q+' '+type)}
assert.deepEqual(JSON.parse(vm.runInContext(`JSON.stringify(calendarSearchMatchKindsV172(events[2],'와우'))`,context)),['게임']);
if(process.argv.includes('--logic-only')){console.log('Calendar search logic PASS');process.exit(0)}
const fixture='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+styles+'\nbody{margin:0}.qa-shell{padding:20px;box-sizing:border-box;margin-left:180px}#calendarSearchPanelV172{display:block}@media(max-width:760px){.qa-shell{margin-left:0;padding:12px}}</style><body data-theme="midnight" class="mws-premium"><main class="qa-shell"><section id="calendar" class="section active">'+markup+'</section></main><script>'+fixtures+shared+match+preview+render+init+'\ninitCalendarSearchV172();</script></body></html>';
const temp=mkdtempSync(path.join(os.tmpdir(),'mws-search-v173-'));let browser;
try{
  const file=path.join(temp,'index.html');writeFileSync(file,fixture);
  browser=await launchCalendarBrowser(temp);
  for(const [width,height] of [[1366,768],[1920,1080],[2560,1440],[768,900],[390,844]]){
    await browser.navigate(pathToFileURL(file).href+'?w='+width,width,height);
    const result=await browser.evaluate(`(()=>{
      const ids=()=>[...document.querySelectorAll('[data-calendar-search-event-id]')].map(e=>e.dataset.calendarSearchEventId),input=document.getElementById('calendarSearchV171');
      const results=${JSON.stringify(cases)}.map(([q,type,expected])=>{document.querySelector('[data-calendar-search-type="'+type+'"]').click();input.value=q;renderCalendarSearchResultsV172();return JSON.stringify(ids())===JSON.stringify(expected)});
      const first=document.querySelector('[data-calendar-search-event-id=wow1]'),r=first.getBoundingClientRect(),root=document.getElementById('calendarSearchPanelV172');
      return {results,rootFits:root.scrollWidth<=root.clientWidth+2&&document.documentElement.scrollWidth<=innerWidth+2,thumb:!!first.querySelector('img'),status:document.getElementById('calendarSearchStatusV171').textContent,rounded:getComputedStyle(first).borderRadius!=='0px',dateLayout:getComputedStyle(document.querySelector('.calendar-search-date-group-v172')).gridTemplateColumns.split(' ').length,cardHeight:r.height,x:r.left+r.width/2,y:r.top+r.height/2};
    })()`);
    assert(result.results.every(Boolean)&&result.rootFits&&result.thumb&&result.rounded,JSON.stringify(result));
    assert.equal(result.dateLayout,width<=850?1:2);assert(result.cardHeight<=140,JSON.stringify(result));
    await browser.clickPoint(result.x,result.y);assert.equal(await browser.evaluate('window.opened'),'wow1');
    const options=await browser.evaluate(`(()=>{const sort=document.getElementById('calendarSearchSortV172');sort.value='desc';sort.dispatchEvent(new Event('change'));const order=[...document.querySelectorAll('[data-calendar-search-event-id]')].map(x=>x.dataset.calendarSearchEventId);document.getElementById('calendarSearchClearV171').click();return {order,empty:document.querySelector('.calendar-search-empty-v172 strong').textContent,input:document.getElementById('calendarSearchV171').value}})()`);
    assert.equal(options.order.at(-1),'wow1');assert.equal(options.input,'');assert.equal(options.empty,'찾고 싶은 일정을 검색하세요');
    console.log('CALENDAR_SEARCH_V173_OK',width,height,JSON.stringify(result));
  }
  const inlineFixture=fixture.replace('<section id="calendar" class="section active">','<section id="calendar" class="section active">'+topbar+'<div data-calendar-view-panel="month">월간 보기</div>').replace('data-calendar-view-panel="search">','data-calendar-view-panel="search" hidden>').replace('initCalendarSearchV172();</script>','let calendarViewModeV172="month";'+view+tabs+'initCalendarViewTabsV172();</script>').replace('#calendarSearchPanelV172{display:block}','');
  const inlineFile=path.join(temp,'inline.html');writeFileSync(inlineFile,inlineFixture);
  for(const [width,height] of [[1366,768],[1920,1080],[390,844]]){
    await browser.navigate(pathToFileURL(inlineFile).href+'?w='+width,width,height);
    const inline=await browser.evaluate(`(async()=>{
      const root=document.getElementById('calendar'),q=document.getElementById('calendarQuickSearchV174'),panel=document.getElementById('calendarSearchPanelV172'),inner=document.getElementById('calendarSearchV171'),tab=document.querySelector('[data-calendar-view-tab=search]');
      const ids=()=>[...document.querySelectorAll('[data-calendar-search-event-id]')].map(e=>e.dataset.calendarSearchEventId);
      const initial=root.dataset.calendarViewMode==='month'&&panel.hidden&&!q.hidden;
      q.focus();q.dispatchEvent(new CompositionEvent('compositionstart'));q.value='와';q.dispatchEvent(new InputEvent('input',{isComposing:true}));const composing=root.dataset.calendarViewMode==='month';
      q.value='와우';q.dispatchEvent(new CompositionEvent('compositionend'));const searched=!panel.hidden&&document.activeElement===q&&JSON.stringify(ids())==='["wow1","wow2","title"]';
      document.querySelector('[data-calendar-search-type=game]').click();const filter=ids().length===2;
      document.getElementById('calendarQuickSearchClearV174').click();const clear=!q.value&&!inner.value&&!ids().length&&document.activeElement===q;
      document.querySelector('[data-calendar-view-tab=month]').click();tab.click();const icon=document.activeElement===q&&!panel.hidden;
      const fit=document.documentElement.scrollWidth<=innerWidth+2&&q.getBoundingClientRect().width>=85;
      return {initial,composing,searched,filter,clear,icon,fit};
    })()`);
    assert(Object.values(inline).every(Boolean),JSON.stringify({width,height,inline}));console.log('CALENDAR_INLINE_SEARCH_OK',width,height,JSON.stringify(inline));
  }
}finally{await browser?.close();rmSync(temp,{recursive:true,force:true})}
