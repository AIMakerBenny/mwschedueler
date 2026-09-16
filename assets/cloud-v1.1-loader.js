/* Mawang Scheduler v1.1.7 Cloudflare auth bootstrap */
(()=>{
  'use strict';
  if(window.__mwsCloudV110Bootstrap)return;
  window.__mwsCloudV110Bootstrap=true;

  const loadCalendarDragFix=()=>{
    if(document.querySelector('link[data-mws-calendar-drag-fix]'))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href='/assets/calendar-drag-layout-fix.css?v=1.1.3';link.dataset.mwsCalendarDragFix='1';document.head.appendChild(link);
  };
  const loadTodayPeopleWheel=()=>{
    if(window.__mwsTodayPeopleWheelV117)return;
    if(document.querySelector('script[data-mws-today-people-wheel-v117]'))return;
    const s=document.createElement('script');s.src='/assets/today-people-wheel-v117.js?v=1.1.7';s.async=false;s.dataset.mwsTodayPeopleWheelV117='1';s.onerror=()=>console.error('Today People wheel fix loading failed');document.body.appendChild(s);
  };
  const loadBossManager=()=>{
    if(window.__mwsBossManagerV116)return;
    if(document.querySelector('script[data-mws-boss-manager-v116]'))return;
    const s=document.createElement('script');s.src='/assets/boss-manager-v116.js?v=1.1.6';s.async=false;s.dataset.mwsBossManagerV116='1';s.onerror=()=>console.error('Boss Raid manager loading failed');document.body.appendChild(s);
  };
  const loadMajokuHostFix=()=>{
    if(window.__mwsMajokuHostFixV114)return;
    if(document.querySelector('script[data-mws-majoku-host-fix-v114]'))return;
    const s=document.createElement('script');s.src='/assets/majoku-host-fix-v114.js?v=1.1.6';s.async=false;s.dataset.mwsMajokuHostFixV114='1';s.onerror=()=>console.error('Majoku Castle host fix loading failed');document.body.appendChild(s);
  };
  const loadUiFixes=()=>{
    if(window.__mwsUiFixesV113){loadTodayPeopleWheel();loadMajokuHostFix();return;}
    if(document.querySelector('script[data-mws-ui-fixes-v113]')){setTimeout(()=>{loadTodayPeopleWheel();loadMajokuHostFix();},800);return;}
    const s=document.createElement('script');s.src='/assets/ui-fixes-v113.js?v=1.1.5';s.async=false;s.dataset.mwsUiFixesV113='1';s.onload=()=>{loadTodayPeopleWheel();loadMajokuHostFix();};s.onerror=()=>{console.error('MWS UI fixes loading failed');loadTodayPeopleWheel();loadMajokuHostFix();};document.body.appendChild(s);
  };
  const loadSteamPicker=()=>{
    if(window.__mwsSteamGameV111){loadUiFixes();return;}
    const existing=document.querySelector('script[data-mws-steam-v111]');
    if(existing){existing.addEventListener('load',loadUiFixes,{once:true});setTimeout(loadUiFixes,1200);return;}
    const s=document.createElement('script');s.src='/assets/steam-game-v111.js?v=1.1.3';s.async=false;s.dataset.mwsSteamV111='1';s.onload=loadUiFixes;s.onerror=()=>{console.error('Steam game picker loading failed');loadUiFixes();};document.body.appendChild(s);
  };

  loadCalendarDragFix();
  loadTodayPeopleWheel();
  loadMajokuHostFix();

  fetch('/assets/cloud-v1.1.js?v=1.1.1',{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.text()})
    .then(code=>{
      code=code.replace("Math.max(0,Math.min(100,Math.round(Number(percent)||0));","Math.max(0,Math.min(100,Math.round(Number(percent)||0)));");
      const s=document.createElement('script');s.textContent=code;document.body.appendChild(s);
      loadBossManager();
      loadSteamPicker();
    })
    .catch(error=>{
      console.error('Cloudflare auth bootstrap failed',error);
      const el=document.getElementById('mwsLoginError');if(el)el.textContent='Cloudflare 로그인 모듈 로딩 실패: '+(error?.message||String(error));
      loadBossManager();loadSteamPicker();
    });
})();
