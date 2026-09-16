/* Mawang Scheduler v1.1 Cloudflare auth bootstrap */
(()=>{
  'use strict';
  if(window.__mwsCloudV110Bootstrap)return;
  window.__mwsCloudV110Bootstrap=true;

  const loadSteamPicker=()=>{
    if(window.__mwsSteamGameV111)return;
    if(document.querySelector('script[data-mws-steam-v111]'))return;
    const s=document.createElement('script');
    s.src='/assets/steam-game-v111.js?v=1.1.1';
    s.async=false;
    s.dataset.mwsSteamV111='1';
    s.onerror=()=>console.error('Steam game picker loading failed');
    document.body.appendChild(s);
  };

  fetch('/assets/cloud-v1.1.js?v=1.1.1',{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.text()})
    .then(code=>{
      code=code.replace("Math.max(0,Math.min(100,Math.round(Number(percent)||0));","Math.max(0,Math.min(100,Math.round(Number(percent)||0)));");
      const s=document.createElement('script');
      s.textContent=code;
      document.body.appendChild(s);
      loadSteamPicker();
    })
    .catch(error=>{
      console.error('Cloudflare auth bootstrap failed',error);
      const el=document.getElementById('mwsLoginError');
      if(el)el.textContent='Cloudflare 로그인 모듈 로딩 실패: '+(error?.message||String(error));
      loadSteamPicker();
    });
})();
