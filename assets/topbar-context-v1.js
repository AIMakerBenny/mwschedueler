/* Keep the shared header contextual while preserving the underlying sync and editor mechanisms. */
(() => {
  'use strict';
  function install(){
    const label=document.getElementById('syncStatusText');
    const status=label?.closest('.sync-status');
    if(label&&status){
      const syncState=()=>{
        const message=String(label.textContent||'').trim();
        const state=label.dataset.mwsSaveState||'';
        const important=state==='failed'||/오프라인|실패|오류|저장 보류|연결 끊|연결 실패|불러오지 못|저장할 수 없|동기화 불가|unauthorized|network error|failed/i.test(message);
        status.classList.toggle('mws-sync-needs-attention',important);
        if(important)status.setAttribute('title',message);
        else status.removeAttribute('title');
      };
      syncState();
      new MutationObserver(syncState).observe(label,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-mws-save-state']});
    }
    // Long instructions are useful when needed, but shouldn't dominate the workspace.
    const selectors=[
      '#gameRps .mini-game-head > div > p',
      '#gamePachinko .mini-game-head > div > p',
      '#gameMultiDraw .mini-game-head > div > p',
      '#gameF1Racing .f1-racing-head-v180 > div > p'
    ];
    for(const paragraph of document.querySelectorAll(selectors.join(','))){
      if(paragraph.closest('.mws-section-help'))continue;
      const help=document.createElement('details');
      help.className='mws-section-help';
      const summary=document.createElement('summary');
      summary.setAttribute('title','사용 방법');
      summary.setAttribute('aria-label','사용 방법 보기');
      summary.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.4 9a2.6 2.6 0 0 1 5.2 0c0 2-2.6 2.1-2.6 4.2M12 17.3v.4"/></svg><span class="mws-help-screenreader">사용 방법</span>';
      paragraph.parentElement.insertBefore(help,paragraph);
      help.append(summary,paragraph);
      help.addEventListener('keydown',event=>{if(event.key==='Escape'){help.open=false;summary.focus()}});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
