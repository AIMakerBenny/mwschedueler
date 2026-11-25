import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'), core=read('assets/app-core.js');
const section=html.match(/<section id="bsandong" class="section">[\s\S]*?<\/section>/)?.[0];
assert(section);
const aside=html.slice(html.indexOf('<aside class="sidebar">'),html.indexOf('</aside>')+8);
const start=core.indexOf('const legacyFeatureTabsV1='),end=core.indexOf('function syncSidebarPinUI(){',start);
assert(start>=0&&end>start);
const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser'].map(name=>spawnSync('which',[name],{encoding:'utf8'})).find(r=>r.status===0)?.stdout.trim();
assert(chrome,'Chromium required');
const data={categories:[{id:'club',name:'브산동'},{id:'game',name:'게임'}],selfContactId:'host',contacts:[{id:'host',name:'마왕'},{id:'a',name:'가나다'},{id:'b',name:'라마바'}],events:[
{id:'1',categoryId:'club',date:'2026-10-01',start:'10:00',title:'첫 산책',participants:['host','a','a']},
{id:'2',categoryId:'club',date:'2026-10-01',start:'13:00',title:'두 번째 산책',participants:['b','a'],participantStatuses:{a:'planned'}},
{id:'3',categoryId:'club',date:'2026-10-08',title:'기록 없음',participants:['host']},
{id:'4',categoryId:'club',date:'2026-10-15',title:'함께 산책',participants:['a','b']},
{id:'5',categoryId:'club',date:'2026-10-22',title:'가을 산책',participants:['b']},
{id:'6',categoryId:'club',date:'2026-11-26',title:'미래 산책',participants:['a']},
{id:'7',categoryId:'game',date:'2026-10-30',title:'다른 분류',participants:['a']}]};
const runTest=()=>{
 const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)],check=(v,m)=>{if(!v)throw Error(m)};
 try{
 const nav=id=>q('.nav button[data-tab="'+id+'"]');
 const group=q('[data-mws-nav-group="mawangContent"]');
 check(group.getAttribute('aria-expanded')==='false','default collapse');
 group.click();check(group.getAttribute('aria-expanded')==='true','expand');
 nav('bsandong').click();check(q('#bsandong').classList.contains('active'),'route');
 check(q('#pageTitle').textContent==='브산동','title');
 check(qa('.bs-session').length===6&&qa('.bs-day').length===5,'history grouping');
 check(!q('[data-bs-body]').textContent.includes('다른 분류'),'category filter');
 check(qa('.bs-planned').length===1,'planned participant');
 q('[data-bs-event="1"]').click();check(window.eventOpened==='1','event detail route');
 q('[data-bs-tab="stats"]').click();check(qa('.bs-chart-item').length===1,'monthly graph');
 const person=q('[data-bs-field=person]');person.value='a';person.dispatchEvent(new Event('change',{bubbles:true}));
 check(q('.bs-big').textContent==='50%','individual rate');
 const unit=q('[data-bs-field=unit]');unit.value='day';unit.dispatchEvent(new Event('change',{bubbles:true}));
 check(qa('.bs-chart-item').length===3,'daily graph');
 q('[data-bs-tab=members]').click();check(qa('.bs-member').length===2,'member count');
 const card=qa('.bs-member').find(e=>e.textContent.includes('가나다'));
 check(card.textContent.includes('2026-10-01')&&card.textContent.includes('2026-10-15')&&card.textContent.includes('1회'),'first last and missed');
 check(qa('.bs-ring').every(x=>x.style.getPropertyValue('--bs-progress')),'profile rings');
 const search=q('[data-bs-field=search]');search.value='라마';search.dispatchEvent(new Event('input',{bubbles:true}));check(qa('.bs-member').length===1,'member search');
 search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
 nav('wardogs').click();check(q('#wardogs').classList.contains('active')&&nav('wardogs').classList.contains('active'),'wardogs direct route');
 check(q('#mwsLegacyBackV1').hidden,'legacy back hidden');
 nav('bsandong').click();data.events.push({id:'8',categoryId:'club',date:'2026-11-20',title:'새 기록',participants:['a']});window.mwsBsandongV1.render(data,todayKST());
 check(qa('.bs-member').find(e=>e.textContent.includes('가나다')).textContent.includes('2026-11-20'),'source update');
 check(window.netCalls===0,'no fetch calls');
 check(q('.bs-shell').scrollWidth<=q('.bs-shell').clientWidth+1,'layout overflow');
 q('#qa-result').textContent='PASS';
 }catch(e){q('#qa-result').textContent='FAIL: '+e.message}
};
const setup='const data='+JSON.stringify(data)+';function todayKST(){return "2026-11-25"};function safeRenderView(n,fn){fn()};window.netCalls=0;window.fetch=()=>{window.netCalls++;throw Error("unexpected fetch")};function openCalendarEventDetailsV1(id){window.eventOpened=id};';
const css=['assets/app-core.css','assets/bsandong-v1.css'].map(read).join('\n');
const body='<!doctype html><meta charset="utf-8"><style>'+css+'</style><body class="sidebar-pinned" data-theme="neon"><div class="app">'+aside+'<main class="main"><h1 id="pageTitle"></h1><button id="mwsLegacyBackV1" hidden></button>'+section+'<section id="wardogs" class="section"></section></main></div><pre id="qa-result">pending</pre><script>'+setup+'</script><script>'+read('assets/bsandong-v1.js')+'</script><script>'+core.slice(start,end)+'</script><script>('+runTest.toString()+')();</script></body>';
const dir=mkdtempSync(path.join(os.tmpdir(),'bsandong-qa-'));
try{const file=path.join(dir,'fixture.html');writeFileSync(file,body);
for(const viewport of ['1366,768','390,844']){
 const run=spawnSync(chrome,['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--user-data-dir='+path.join(dir,'profile-'+viewport),'--window-size='+viewport,'--virtual-time-budget=1500','--dump-dom','file://'+file],{encoding:'utf8',timeout:60000,maxBuffer:12*1024*1024});
 assert.equal(run.status,0,run.stderr);
 const result=run.stdout.match(/<pre id="qa-result">([^<]*)<\/pre>/)?.[1];
 assert.equal(result,'PASS',viewport+': '+(result||'Missing QA result'));console.log('PASS Bsandong browser '+viewport);
}}finally{rmSync(dir,{recursive:true,force:true})}
