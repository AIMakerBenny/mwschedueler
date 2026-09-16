/* Mawang Scheduler v1.1.6 - inject Majoku Castle sidebar and Boss Raid catalog */
(()=>{
'use strict';
if(window.__mwsMajokuHostFixV114)return;
window.__mwsMajokuHostFixV114=1;

const SIDEBAR_SRC='/assets/majoku-sidebar-v113.js?v=1.1.5';
const BOSS_SRC='/assets/boss-raid-v116.js?v=1.1.6';

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
  }catch(error){console.error('Majoku Castle iframe access failed',error)}
}
function bind(frame){if(!frame||frame.__mwsMajokuHostFixV114)return;frame.__mwsMajokuHostFixV114=1;frame.addEventListener('load',()=>setTimeout(()=>inject(frame),0));inject(frame)}
function scan(){document.querySelectorAll('iframe.majoku-castle-frame, iframe[src*="majoku-castle.html"]').forEach(bind)}
function boot(){scan();const root=document.body||document.documentElement;if(root)new MutationObserver(scan).observe(root,{childList:true,subtree:true});setInterval(scan,1500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
