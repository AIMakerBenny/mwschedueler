import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('assets/app-core.js','utf8');
const ids=['gameRps','gamePachinko'];
const titles=['가위바위보','경마'];
const sidebar=html.match(/<aside class="sidebar">[\s\S]*?<\/aside>/)[0];
const hub=html.match(/<section id="legacy" class="section">[\s\S]*?<\/section>/)[0];
test('legacy follows active minigames and directly precedes import/export',()=>{
  const tabs=[...sidebar.matchAll(/<button(?: type="button")? data-tab="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(tabs.indexOf('legacy')+1,tabs.indexOf('export'));
  for(const id of ids)assert.ok(!tabs.includes(id));
  for(const id of ['gameMajoku','gameLadder','gameF1Racing','gameMultiDraw'])assert.ok(tabs.includes(id));
  assert.ok(!sidebar.includes('wardogs-content-divider-v116'));
  const contentStart=tabs.indexOf('bsandong');assert.ok(contentStart>=0);assert.deepEqual(tabs.slice(contentStart,contentStart+3),['bsandong','operationM','wardogs']);assert.ok(tabs.indexOf('wardogs')<tabs.indexOf('gameLadder'));
  assert.match(sidebar,/data-mws-nav-group="mawangContent"/);
});
test('two legacy buttons resolve to original sections, back button and stylesheet are installed',()=>{
  assert.deepEqual([...hub.matchAll(/data-tab="([^"]+)" data-legacy-link-v1/g)].map(m=>m[1]),ids);
  for(const id of ids)assert.equal([...html.matchAll(new RegExp('<section id="'+id+'"','g'))].length,1);
  assert.match(html,/id="mwsLegacyBackV1"[^>]+data-tab="legacy" data-legacy-link-v1 hidden/);
  assert.match(html,/assets\/legacy-hub-v1.css\?v=1/);
  assert.match(html,/legacyhubv1=1/);
});
test('real setTab implementation routes legacy buttons and returns without breaking regular tabs',()=>{
  const makeEl=(tab)=>({id:tab,dataset:{tab},active:false,hidden:true,classList:{toggle(_name,active){this.owner.active=active}}});
  const setup=tab=>{const el=makeEl(tab);el.classList.owner=el;return el};
  const nav=['calendar','legacy','export','wardogs','bsandong'].map(setup);
  const sections=['calendar','legacy',...ids,'export','wardogs','bsandong'].map(setup);
  const back=setup('legacy'), links=[...ids.map(setup),back], title={textContent:''};
  const renders=[],tabEvents=[];
  const doc={
    querySelectorAll(s){return s==='.nav button'?nav:s==='.section'?sections:s==='[data-legacy-link-v1]'?links:[]},
    getElementById(id){return id==='pageTitle'?title:id==='mwsLegacyBackV1'?back:null}
  };
  const scope={document:doc,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail}},window:{dispatchEvent(event){assert.equal(event.type,'mws:workspace-tab-v1');tabEvents.push(event.detail.tab)}},safeRenderView:(title,fn)=>{renders.push(title);fn()},renderCalendar(){},renderRps(){},renderPachinko(){},updateFullBackupAssetStatus(){}};
  const start=app.indexOf('const legacyFeatureTabsV1='),end=app.indexOf('function syncSidebarPinUI(){',start);
  assert.ok(start>=0&&end>start);
  vm.runInNewContext(app.slice(start,end),scope);
  const assertActive=(navTab,sectionTab,label,backHidden)=>{
    assert.deepEqual(nav.filter(x=>x.active).map(x=>x.id),[navTab]);
    assert.deepEqual(sections.filter(x=>x.active).map(x=>x.id),[sectionTab]);
    assert.equal(title.textContent,label);
    assert.equal(back.hidden,backHidden);
  };
  nav[1].onclick();
  assertActive('legacy','legacy','레거시',true);
  ids.forEach((id,i)=>{
    links[i].onclick();
    assertActive('legacy',id,titles[i],false);
    back.onclick();
    assertActive('legacy','legacy','레거시',true);
  });
  assert.deepEqual(renders,['가위바위보','경마']);
  nav[0].onclick();
  assertActive('calendar','calendar','캘린더',true);
  nav[2].onclick();
  assertActive('export','export','가져오기 / 내보내기',true);
  assert.equal(renders.at(-1),'백업 이미지 상태');
  nav[3].onclick();assertActive('wardogs','wardogs','워독스 전쟁견들',true);
  nav[4].onclick();assertActive('bsandong','bsandong','브산동',true);
  assert.deepEqual(tabEvents,['legacy','gameRps','legacy','gamePachinko','legacy','calendar','export','wardogs','bsandong']);
});
