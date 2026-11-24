/* One-shot feedback when displayed dashboard values actually change.
 * No polling, no mutation of source data and no timers that keep running.
 */
(()=>{
  'use strict';
  const init=()=>{
    const values=document.querySelectorAll('#dashboard .dashboard-kpi-grid-local .kpi strong');
    if(!values.length||typeof MutationObserver==='undefined')return;
    for(const node of values){
      let previous=node.textContent.trim();
      let pending=false;
      const observer=new MutationObserver(()=>{
        const current=node.textContent.trim();
        if(current===previous)return;
        previous=current;
        if(!current||document.documentElement.dataset.mwsMotion==='reduced')return;
        if(matchMedia('(prefers-reduced-motion: reduce)').matches&&document.documentElement.dataset.mwsMotion!=='full')return;
        if(!node.closest('.section.active')||pending)return;
        pending=true;
        requestAnimationFrame(()=>{
          pending=false;
          if(!node.isConnected||!node.closest('.section.active'))return;
          node.classList.remove('mws-vx-updated');
          // Restart only on genuine data changes, not on tab switches or rerenders.
          void node.offsetWidth;
          node.classList.add('mws-vx-updated');
        });
      });
      observer.observe(node,{subtree:true,characterData:true,childList:true});
      node.addEventListener('animationend',event=>{
        if(event.animationName==='mws-vx-numeric-update')node.classList.remove('mws-vx-updated');
      });
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
