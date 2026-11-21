import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

// Identical local browser workloads for the production baseline and candidate.
// Synthetic notebook data, no cloud writes and no personal information.
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-shell-performance-'));
const baseline=process.env.MWS_PERF_BASE_REF;
const read=(p,ref)=>ref?execFileSync('git',['show',ref+':'+p],{encoding:'utf8',maxBuffer:16*1024*1024}):readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sizes=[[1366,768],[1920,1080],[2560,1440]];
const fixture=(ref,label)=>{
  const html=read('index.html',ref),aside=html.slice(html.indexOf('<aside class="sidebar">'),html.indexOf('</aside>')+8);
  const css=[...html.matchAll(/<link rel="stylesheet" href="(assets\/[^"?]+)[^"]*">|<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)].map(m=>m[1]?read(m[1],ref):m[2]).join('\n');
  const source=read('assets/workspace-ui-v176.js',ref);
  const init=`
    window.data={patchNotes:Array.from({length:30},(_,i)=>({id:'p'+i,author:'QA',createdAt:new Date(i*1000).toISOString(),content:'Test note '+i})),suggestions:[]};
    window.setTab=tab=>{document.querySelectorAll('.section').forEach(s=>s.classList.toggle('active',s.id===tab));document.querySelectorAll('.nav button[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.getElementById('pageTitle').textContent=tab};
    document.querySelectorAll('.nav button[data-tab]').forEach(b=>b.onclick=()=>window.setTab(b.dataset.tab));
  `;
  const sections=['dashboard','calendar','contacts','posts','sniper','friendFinder','targets','memos','achievements','gameLadder','gameF1Racing','gameMultiDraw','gameMajoku','legacy','export','settings'].map(id=>'<section id="'+id+'" class="section'+(id==='calendar'?' active':'')+'">'+(id==='memos'?'<div class="memo-section-tabs"><button id="memoLibraryTab">Library</button><button id="memoFavoritesTab">Favorites</button></div>':'')+'</section>').join('');
  const file=path.join(dir,label+'.html');
  writeFileSync(file,'<!doctype html><meta charset="utf-8"><style>'+css+'</style><body class="mws-premium sidebar-pinned" data-theme="neon" data-resolution="fhd" data-ui-frame="classic"><div class="app">'+aside+'<main class="main"><h1 id="pageTitle">Calendar</h1>'+sections+'</main></div><script>'+init+'</script><script>'+source+'</script></body>');
  return file;
};
let browser;
try{
  browser=await launchCalendarBrowser(dir);
  await browser.enablePerformance();
  for(const [label,ref] of [...(baseline?[['before',baseline]]:[]),['after',null]]){
    const file=fixture(ref,label);
    for(const [width,height] of sizes){
      await browser.navigate(pathToFileURL(file).href+'?size='+width,width,height);
      const idleBefore=await browser.performanceMetrics();
      const idle=await browser.evaluate(`(async()=>{
        const note=document.getElementById('patchNoteCardsV176');if(!note)throw Error('Notebook unavailable');
        let changes=0;const observer=new MutationObserver(r=>changes+=r.length);observer.observe(note,{childList:true,subtree:true});
        const first=note.firstElementChild,frames=[],end=performance.now()+1200;let last=performance.now();
        while(performance.now()<end){const t=await new Promise(requestAnimationFrame);frames.push(t-last);last=t}
        observer.disconnect();return {changes,stableNode:first===note.firstElementChild,frames:frames.length,over33ms:frames.filter(t=>t>33.4).length,maxFrameMs:Math.max(...frames)}
      })()`);
      const idleAfter=await browser.performanceMetrics();
      const points=await browser.evaluate(`[...document.querySelectorAll('.nav-scroll>button[data-tab]')].filter(b=>!b.classList.contains('active')&&b.getBoundingClientRect().height>0).slice(0,6).map(b=>{const r=b.getBoundingClientRect();return {tab:b.dataset.tab,x:r.x+r.width/2,y:r.y+r.height/2}}).filter(p=>p.y>0&&p.y<innerHeight)`);
      assert(points.length>=4,'Too few visible categories');
      const readColor=tab=>browser.evaluate(`(()=>{const b=document.querySelector('[data-tab="'+${JSON.stringify(tab)}+'"]');const s=getComputedStyle(b);return {hover:b.matches(':hover'),background:s.backgroundColor,color:s.color,border:s.borderColor}})()`);
      const settled=new Map();
      for(const p of points){await browser.movePoint(p.x,p.y);await new Promise(r=>setTimeout(r,220));settled.set(p.tab,await readColor(p.tab))}
      let hits=0,samples=0;
      const hoverBefore=await browser.performanceMetrics();
      for(let k=0;k<5;k++)for(const p of points){await browser.movePoint(p.x,p.y);const now=await readColor(p.tab),target=settled.get(p.tab);samples++;if(now.hover&&now.background===target.background&&now.color===target.color&&now.border===target.border)hits++}
      const hoverAfter=await browser.performanceMetrics();
      const data=await browser.evaluate(`(async()=>{
        const card=document.getElementById('patchNoteCardsV176'),old=card.firstElementChild;
        data.patchNotes.push({id:'added',author:'QA',createdAt:new Date().toISOString(),content:'New note'});
        window.dispatchEvent(new CustomEvent('mws:parts-loaded',{detail:{parts:['notebook']}}));
        await new Promise(requestAnimationFrame);
        const updated=card.textContent.includes('New note')&&card.children.length===31;
        for(const id of ['contacts','posts','memos','calendar'])document.querySelector('[data-tab="'+id+'"]').click();
        return {updated,routed:document.querySelector('.section.active')?.id==='calendar',oldReplaced:old!==card.firstElementChild}
      })()`);
      const delta=(a,b,key)=>Math.round(((b[key]||0)-(a[key]||0))*1000)/1000;
      console.log('MWS_SHELL_PROFILE',JSON.stringify({label,width,height,idle,hover:{hits,samples},idleTaskSeconds:delta(idleBefore,idleAfter,'TaskDuration'),idleScriptSeconds:delta(idleBefore,idleAfter,'ScriptDuration'),idleLayouts:delta(idleBefore,idleAfter,'LayoutCount'),hoverTaskSeconds:delta(hoverBefore,hoverAfter,'TaskDuration'),data}));
      if(label==='after'){assert.equal(idle.changes,0,'Background notebook continues to mutate');assert(idle.stableNode);assert.equal(hits,samples,'Hover entrance was not immediate');assert(data.updated&&data.routed)}
    }
    const castle=path.join(dir,'castle-'+label+'.html');
    // Real markup and styles; scripts are deliberately omitted in this static
    // heading/card test so no SOOP API or external game controller is invoked.
    writeFileSync(castle,read('majoku-castle.html',ref).replace(/<script\b[\s\S]*?<\/script>/gi,''));
    await browser.navigate(pathToFileURL(castle).href,1366,768);
    const titles=await browser.evaluate(`({count:[...document.querySelectorAll('.logo,#navCastle,#castleHome h1,#castleHome .hero-title')].filter(e=>e.childNodes[0]?.textContent.trim().toUpperCase()==='MAJOKU CASTLE').length,games:document.querySelectorAll('#gameGrid .game-card.live').length})`);
    console.log('MWS_CASTLE_HEADINGS',label,JSON.stringify(titles));
    if(label==='after'){assert.equal(titles.count,1);assert.equal(titles.games,9)}
  }
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
