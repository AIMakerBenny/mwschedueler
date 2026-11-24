import assert from 'node:assert/strict';

export async function auditSession({browser,nav,calls,summary,until,mode}){
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const routes=['calendar','dashboard','contacts','sniper','contactFrequency','friendFinder','targets','posts','contentApplications','memos','careerTimeline','mawangArchive','achievements','gameLadder','gameMultiDraw','gameMajoku','gameF1Racing','gameRps','gamePachinko','worldtime','contentPlanner','toolTier','toolMatrix','toolRelations','settings'];
 const capture=()=>browser.evaluate(`Object.fromEntries(Object.entries(data).map(([key,value])=>[key,typeof value==='object'&&value&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,JSON.stringify(v)])):JSON.stringify(value)]))`);
 let snapshot=await capture();
 for(let round=1;round<=3;round++){
  for(const route of routes){
   const start=calls.length,began=performance.now();
   await nav([route]);
   const interactions=await browser.evaluate(`(()=>{
    const root=document.querySelector('.section.active'),done=[];
    const search=root.querySelector('input[type=search],input.search');
    if(search&&search.offsetWidth){for(const value of ['QA','']){search.value=value;search.dispatchEvent(new Event('input',{bubbles:true}))}done.push('search')}
    const filter=root.querySelector('#contactFrequencyRange,#postApplicantSort,#mwsFriendCategorySelect');
    if(filter?.options.length>1){const initial=filter.selectedIndex;filter.selectedIndex=(initial+1)%filter.options.length;filter.dispatchEvent(new Event('change',{bubbles:true}));filter.selectedIndex=initial;filter.dispatchEvent(new Event('change',{bubbles:true}));done.push('filter')}
    const scroller=[root,...root.querySelectorAll('div')].find(e=>e.clientHeight>0&&e.scrollHeight>e.clientHeight+20&&['auto','scroll'].includes(getComputedStyle(e).overflowY));
    if(scroller){scroller.scrollTop=150;scroller.scrollTop=0;done.push('scroll')}
    return done;
   })()`);
   if(route==='contacts'){
    await browser.evaluate("document.querySelector('#contacts .contact-card[data-contact-id]')?.click()");
    await until(()=>browser.evaluate("document.querySelector('#contactModal')?.classList.contains('open')"),'Open fixture contact');
    await browser.evaluate("document.querySelector('[data-close=contactModal]').click()");
    interactions.push('detail');
   }
   await pause(350);
   const rows=calls.slice(start);
   if(mode==='admin'&&round===1){
    const current=await capture(),changed=[];
    for(const key of Object.keys(current)){
     if(JSON.stringify(current[key])===JSON.stringify(snapshot[key]))continue;
     if(current[key]&&typeof current[key]==='object'){
      for(const k of Object.keys(current[key]))if(current[key][k]!==snapshot[key]?.[k])changed.push(key+'.'+k);
     }else changed.push(key);
    }
    if(changed.length)console.log('VIEW_DATA_CHANGE '+JSON.stringify({route,changed}));
    snapshot=current;
   }
   console.log('ROUTE_AUDIT '+JSON.stringify({mode,round,route,interactions,elapsedIncludingWaitMs:Math.round(performance.now()-began),worker:summary(rows)}));
   assert(!rows.some(r=>r.path==='/api/save'),'Navigation saved data: '+route);
   if(route==='posts')assert(!rows.some(r=>r.path.startsWith('/api/soop/')),'Post view contacted SOOP');
  }
 }
 if(mode==='admin'){
  await nav(['calendar']);
  const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf2sAAAAASUVORK5CYII=';
  const edits=[
   ['event','events',"data.events[0].title='Edited fixture event'"],
   ['contact','contacts',"data.contacts[0].name='Edited fixture contact'"],
   ['portrait','contacts','data.contacts[0].image='+JSON.stringify(image)],
   ['post','posts',"data.posts.push({id:'qa-post',title:'Test post',comments:[]})"],
   ['game','miniGames',"data.miniGames.ladder.prizes=[{id:'qa',label:'Fixture'}]"],
   ['note','notebook',"data.memos.push({id:'qa-note',title:'Fixture note',content:'updated'})"]
  ];
  for(const [label,part,edit] of edits){
   const offset=calls.length;
   await browser.evaluate('(async()=>{'+edit+";window.saveData('fixture edit');return await window.mwsV55SaveNow()})()");
   const writes=calls.slice(offset).filter(row=>row.path==='/api/save');
   console.log('EDIT_AUDIT '+JSON.stringify({label,worker:summary(calls.slice(offset)),parts:writes.map(row=>row.parts)}));
   assert.equal(writes.length,1,'Single save for '+label);assert.equal(writes[0].status,200);
   assert.deepEqual(writes[0].parts,[part],label+' wrote unrelated parts');
   assert(!calls.slice(offset).some(row=>row.path.startsWith('/media/contact/')&&row.path!=='/media/contact/qa0'));
  }
  for(const path of ['/api/mawang-profile/mi','/api/achievement-media/qa-audit']){
   const offset=calls.length;
   const status=await browser.evaluate(`(async()=>{const bytes=Uint8Array.from(atob(${JSON.stringify(image.split(',')[1])}),c=>c.charCodeAt(0));return (await fetch(${JSON.stringify(path)},{method:'PUT',headers:{'content-type':'image/png'},body:bytes})).status})()`);
   assert.equal(status,200,path);
   console.log('UPLOAD_AUDIT '+JSON.stringify({path,worker:summary(calls.slice(offset))}));
  }
  await nav(['settings']);
  await browser.evaluate("document.querySelector('#mwsRequestBudgetDetails').open=true");
  const before=calls.length;
  await browser.evaluate("Array.from(document.querySelectorAll('#mwsTraceControls button')).find(b=>b.textContent==='측정 시작').click()");
  await pause(500);
  await browser.evaluate("Array.from(document.querySelectorAll('#mwsTraceControls button')).find(b=>b.textContent==='측정 종료').click()");
  assert.equal(calls.length,before,'Starting or stopping diagnostics emitted a request');
 }
}
