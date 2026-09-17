/* Mawang Scheduler v1.2.0 - inject Majoku Castle sidebar and Boss Raid scripts */
(()=>{
'use strict';
if(window.__mwsMajokuHostFixV122)return;
window.__mwsMajokuHostFixV122=1;

const SIDEBAR_SRC='/assets/majoku-sidebar-v113.js?v=1.2.0';
const BOSS_SRC='/assets/boss-raid-v116.js?v=1.2.2';
const BOSS_FIX_SRC='/assets/boss-raid-fix-v119.js?v=1.2.2';

function ensureScript(doc,selector,src,dataKey,errorLabel){
  const existing=doc.querySelector(selector);
  if(existing&&existing.getAttribute('src')===src)return;
  doc.querySelectorAll(selector).forEach(node=>node.remove());
  const script=doc.createElement('script');script.src=src;script.async=false;script.dataset[dataKey]='1';script.onerror=()=>console.error(errorLabel);(doc.body||doc.documentElement).appendChild(script);
}
function inject(frame){
  if(!frame)return;
  try{
    const doc=frame.contentDocument;if(!doc||!doc.documentElement)return;
    ensureScript(doc,'script[src*="majoku-sidebar-v11"],script[data-mws-majoku-sidebar-host-v114]',SIDEBAR_SRC,'mwsMajokuSidebarHostV114','Majoku Castle sidebar injection failed');
    ensureScript(doc,'script[src*="boss-raid-v116"],script[data-mws-boss-raid-host-v116]',BOSS_SRC,'mwsBossRaidHostV116','Majoku Castle Boss Raid injection failed');
    ensureScript(doc,'script[src*="boss-raid-fix-v119"],script[data-mws-boss-raid-fix-host-v120]',BOSS_FIX_SRC,'mwsBossRaidFixHostV120','Majoku Castle Boss HP fix injection failed');
  }catch(error){console.error('Majoku Castle iframe access failed',error)}
}
function bind(frame){
  if(!frame||frame.__mwsMajokuHostFixV122)return;
  frame.__mwsMajokuHostFixV122=1;
  frame.addEventListener('load',()=>queueMicrotask(()=>inject(frame)));
  inject(frame);
}
function bindIn(root){
  if(root instanceof HTMLIFrameElement&&(root.matches('.majoku-castle-frame')||String(root.src||'').includes('majoku-castle.html')))bind(root);
  root.querySelectorAll?.('iframe.majoku-castle-frame, iframe[src*="majoku-castle.html"]').forEach(bind);
}
function boot(){
  bindIn(document);
  const root=document.body||document.documentElement;
  if(root)new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node instanceof Element)bindIn(node)}).observe(root,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
