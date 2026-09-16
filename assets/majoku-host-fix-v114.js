/* Mawang Scheduler v1.1.4 - inject Majoku Castle sidebar into same-origin iframe */
(()=>{
'use strict';
if(window.__mwsMajokuHostFixV114)return;
window.__mwsMajokuHostFixV114=1;

const SCRIPT_SRC='/assets/majoku-sidebar-v113.js?v=1.1.4';

function inject(frame){
  if(!frame)return;
  try{
    const doc=frame.contentDocument;
    if(!doc||!doc.documentElement)return;
    if(doc.querySelector('script[data-mws-majoku-sidebar-host-v114]'))return;
    doc.querySelectorAll('script[src*="majoku-sidebar-v11"]').forEach(node=>node.remove());
    const script=doc.createElement('script');
    script.src=SCRIPT_SRC;
    script.dataset.mwsMajokuSidebarHostV114='1';
    script.async=false;
    script.onerror=()=>console.error('Majoku Castle sidebar injection failed');
    (doc.body||doc.documentElement).appendChild(script);
  }catch(error){
    console.error('Majoku Castle iframe access failed',error);
  }
}

function bind(frame){
  if(!frame||frame.__mwsMajokuHostFixV114)return;
  frame.__mwsMajokuHostFixV114=1;
  frame.addEventListener('load',()=>setTimeout(()=>inject(frame),0));
  inject(frame);
}

function scan(){
  document.querySelectorAll('iframe.majoku-castle-frame, iframe[src*="majoku-castle.html"]').forEach(bind);
}

function boot(){
  scan();
  const root=document.body||document.documentElement;
  if(root)new MutationObserver(scan).observe(root,{childList:true,subtree:true});
  setInterval(scan,1500);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
