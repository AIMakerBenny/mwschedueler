/* MWS event editor V5 - Series/Memo sidebar tabs.
 * The existing group and memo controls are reparented in index.html, not cloned.
 * Switching tabs never clears editor values and never calls saveData.
 */
(function(root){
  'use strict';
  const $=id=>document.getElementById(id);
  const names=['series','memo'];
  let current='series';
  function select(mode,focus=false){
    current=mode==='memo'?'memo':'series';
    for(const name of names){
      const button=$(name==='series'?'eventSeriesTabV5':'eventMemoTabV5');
      const pane=$(name==='series'?'eventSeriesPaneV5':'eventMemoPaneV5');
      const active=name===current;
      if(button){
        button.classList.toggle('active',active);
        button.setAttribute('aria-selected',String(active));
        button.tabIndex=active?0:-1;
      }
      if(pane){
        pane.hidden=!active;
        pane.classList.toggle('active',active);
      }
    }
    if(focus)$(current==='series'?'eventSeriesTabV5':'eventMemoTabV5')?.focus();
  }
  function reset(){select('series',false)}
  function init(){
    const series=$('eventSeriesTabV5'),memo=$('eventMemoTabV5');
    if(!series||!memo||series.dataset.tabsInitializedV5)return;
    series.dataset.tabsInitializedV5='true';
    for(const button of [series,memo]){
      button.addEventListener('click',()=>select(button.dataset.eventSidebarTab,false));
      button.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();
        if(event.key==='Home')return select('series',true);
        if(event.key==='End')return select('memo',true);
        const next=button.dataset.eventSidebarTab==='series'?'memo':'series';
        select(next,true);
      });
    }
    reset();
  }
  root.mwsEventSidebarTabsV5=Object.freeze({
    init,select,reset,current:()=>current
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})(window);
