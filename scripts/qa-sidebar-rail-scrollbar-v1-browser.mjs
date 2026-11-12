/* Browser geometry regression for the exact production sidebar markup and CSS.
   No logged-in application data or production environment is touched. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const file=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=file('index.html'),core=file('assets/app-core.css');
const rail=file('assets/sidebar-rail-scrollbar-v1.css');
const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser']
  .map(name=>spawnSync('which',[name],{encoding:'utf8'}))
  .find(result=>result.status===0)?.stdout.trim();
assert(chrome,'Chromium required for desktop sidebar rail test');
assert(html.includes('assets/sidebar-rail-scrollbar-v1.css?v=1'));
const begin=html.indexOf('<aside class="sidebar">');
const end=html.indexOf('</aside>',begin);
assert(begin>=0&&end>begin,'Actual production sidebar markup must exist');
const aside=html.slice(begin,end+'</aside>'.length);
assert(aside.includes('class="nav-scroll"'));
assert(aside.includes('data-tab="dashboard"'));
const readCheck=`
(()=>{
  const $=s=>document.querySelector(s),r=el=>el.getBoundingClientRect();
  const pinned=document.body.classList.contains('sidebar-pinned');
  const side=$('.sidebar'),scroll=$('.nav-scroll'),main=$('.main'),nav=$('.nav');
  const buttons=[...scroll.querySelectorAll(':scope > button')];
  const sideRect=r(side),scrollRect=r(scroll),mainRect=r(main);
  const css=getComputedStyle(scroll);
  const scale=scrollRect.width/scroll.offsetWidth;
  const rightEdge=scrollRect.left+(scroll.clientWidth-(parseFloat(css.paddingRight)||0))*scale;
  const leftEdge=scrollRect.left+(parseFloat(css.paddingLeft)||0)*scale;
  const bad=buttons.map(b=>({id:b.dataset.tab,right:r(b).right,left:r(b).left}))
    .filter(b=>b.right>rightEdge+1||b.left<leftEdge-1);
  const iconOffsets=buttons.map(b=>{
    const icon=b.querySelector('.nav-icon');if(!icon)return 0;
    return Math.abs((r(icon).left+r(icon).right)/2-(r(b).left+r(b).right)/2);
  });
  const active=scroll.querySelector('button.active');
  const railWidthOk=Math.abs(sideRect.width-(pinned?220:72)*parseFloat(document.body.style.zoom||1))<3;
  const gridMatch=Math.abs(mainRect.left-(pinned?220:72)*parseFloat(document.body.style.zoom||1))<3;
  const scrollFunctional=scroll.scrollHeight>scroll.clientHeight+2;
  scroll.scrollTop=100;
  const scrollMoves=!scrollFunctional||scroll.scrollTop>0;
  const labels=pinned?getComputedStyle(active.querySelector('.nav-label')).visibility!=='hidden':
    getComputedStyle(active.querySelector('.nav-label')).visibility==='hidden';
  const iconCentered=pinned||Math.max(...iconOffsets)<1.25*parseFloat(document.body.style.zoom||1);
  const tileWidth=pinned||Math.abs(r(active).width-44*parseFloat(document.body.style.zoom||1))<2;
  const noRootOverflow=document.documentElement.scrollWidth<=window.innerWidth+3;
  const scrollGutter=css.scrollbarGutter.includes('stable');
  const allInScroll=bad.length===0;
  const mainNotCovered=pinned?mainRect.left>=sideRect.right-2:mainRect.left>=sideRect.right-2;
  const ok=railWidthOk&&gridMatch&&scrollMoves&&labels&&iconCentered&&
    tileWidth&&noRootOverflow&&scrollGutter&&allInScroll&&mainNotCovered&&buttons.length>=10;
  $('#qa-result').textContent=JSON.stringify({ok,pinned,viewport:innerWidth,zoom:document.body.style.zoom||'1',
    railWidth:Math.round(sideRect.width),scrollClientWidth:scroll.clientWidth,scrollWidth:scrollRect.width,
    scrollGutter,visibleRight:Math.round(rightEdge),badButtons:bad,buttons:buttons.length,
    maxIconOffset:Math.round(Math.max(...iconOffsets)*100)/100,railWidthOk,gridMatch,scrollFunctional,
    scrollMoves,labels,iconCentered,tileWidth,noRootOverflow,allInScroll,mainNotCovered});
})()
`;
const temp=mkdtempSync(path.join(os.tmpdir(),'mws-sidebar-rail-qa-'));
try{
 const page=path.join(temp,'sidebar.html');
 for(const [width,height,pinned,zoom,dpr] of [
   [2560,1440,false,1,1],[1898,902,false,1,1],[1920,1080,false,1,1],
   [1366,768,false,1,1],[1100,800,false,1,1],[850,768,false,1,1],
   [1898,902,true,1,1],[1366,768,true,1,1],
   [1366,768,false,1.25,1],[1898,902,false,1,1.25],
   [1366,768,true,1.25,1]
 ]){
   writeFileSync(page,`<!doctype html><html lang="ko"><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>${core}\n${rail}</style></head>
      <body data-resolution="fhd" data-mws-mode="admin"
        class="${pinned?'sidebar-pinned':''}" style="zoom:${zoom}">
        <div class="app">${aside}<main class="main"><div class="topbar">대시보드</div>
        <section style="height:100vh">정상 동작 확인</section></main></div>
        <pre id="qa-result">pending</pre><script>${readCheck}</script>
      </body></html>`,'utf8');
   const run=spawnSync(chrome,['--headless=new','--no-sandbox','--disable-gpu',
     '--disable-dev-shm-usage','--no-first-run','--disable-background-networking',
     '--virtual-time-budget=1400','--force-device-scale-factor='+dpr,
     '--window-size='+width+','+height,'--dump-dom','file://'+page],
     {encoding:'utf8',timeout:20000,maxBuffer:14*1024*1024});
   assert.equal(run.status,0,'Chromium process failed '+width+': '+run.stderr.slice(-900));
   const m=run.stdout.match(/<pre id="qa-result">([^<]+)<\/pre>/);
   assert(m,'Sidebar browser QA result missing '+width+' '+run.stdout.slice(-650));
   const result=JSON.parse(m[1]);
   assert(result.ok,'Sidebar rail clipped at '+width+' zoom '+zoom+' pin '+pinned+': '+JSON.stringify(result));
   console.log('SIDEBAR_RAIL_V1_OK',width,height,'zoom',zoom,'pin',pinned,'dpr',dpr,JSON.stringify(result));
 }
}finally{rmSync(temp,{recursive:true,force:true})}
