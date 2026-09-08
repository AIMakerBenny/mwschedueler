from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='<!-- mws-v5.7.3-gacha-stop-hotfix -->'
if marker in s:
    raise SystemExit('v5.7.3 hotfix already present')
required=[
    'window.toggleMultiDrawAutoV419=function()',
    'window.multiDrawAutoStateV419',
    'window.multiDrawRuntimeV418',
    '<!-- mws-v5.7.2-predeploy -->',
]
missing=[x for x in required if x not in s]
if missing:
    raise SystemExit('Missing expected production markers: '+repr(missing))

patch=r'''
<!-- mws-v5.7.3-gacha-stop-hotfix -->
<script id="mws-v573-gacha-stop-hotfix">
(function(){
  if(window.__mwsV573GachaStopFix)return;
  window.__mwsV573GachaStopFix=true;
  const originalToggle=window.toggleMultiDrawAutoV419;
  let stopWatchV573=0;
  let stopSafetyV573=0;

  function clearStopTimersV573(){
    if(stopWatchV573){clearInterval(stopWatchV573);stopWatchV573=0;}
    if(stopSafetyV573){clearTimeout(stopSafetyV573);stopSafetyV573=0;}
  }

  function refreshGachaUiV573(){
    try{if(typeof window.renderMultiDraw==='function')window.renderMultiDraw();}catch(e){console.warn('Gacha stop UI refresh failed',e);}
  }

  function releaseAutoStateV573(force){
    const auto=window.multiDrawAutoStateV419;
    const rt=window.multiDrawRuntimeV418;
    if(!auto)return true;
    const busy=!!(rt?.animating||rt?.preparing||rt?.charging||auto.charging);
    if(busy&&!force)return false;
    auto.running=false;
    auto.stopRequested=false;
    auto.charging=false;
    if(auto.raf){try{cancelAnimationFrame(auto.raf)}catch(_){}auto.raf=0;}
    clearStopTimersV573();
    refreshGachaUiV573();
    return true;
  }

  function requestStopV573(){
    const auto=window.multiDrawAutoStateV419;
    if(!auto||!auto.running)return false;
    auto.stopRequested=true;
    const btn=document.getElementById('multiDrawAutoBtnV419');
    if(btn)btn.textContent='중지 요청됨...';
    try{toast('자동 가챠','현재 진행 중인 회차가 끝나면 자동 진행을 중지합니다.')}catch(_){}

    if(releaseAutoStateV573(false))return true;
    clearStopTimersV573();
    stopWatchV573=window.setInterval(()=>{
      releaseAutoStateV573(false);
    },120);
    stopSafetyV573=window.setTimeout(()=>{
      const currentAuto=window.multiDrawAutoStateV419;
      if(!currentAuto?.running)return clearStopTimersV573();
      const rt=window.multiDrawRuntimeV418;
      if(rt){rt.animating=false;rt.preparing=false;rt.charging=false;}
      releaseAutoStateV573(true);
      try{toast('자동 가챠','자동 진행을 중지하고 조작을 다시 활성화했습니다.')}catch(_){}
    },15000);
    return true;
  }

  window.toggleMultiDrawAutoV419=function(){
    const auto=window.multiDrawAutoStateV419;
    if(auto?.running){requestStopV573();return;}
    clearStopTimersV573();
    return originalToggle.apply(this,arguments);
  };
})();
</script>
'''

needle='<!-- mws-v5.7.1-storage-title-hotfix -->'
if needle not in s:
    needle='</body>'
s=s.replace(needle,patch+'\n'+needle,1)
p.write_text(s,encoding='utf-8')
print('patched',p)
