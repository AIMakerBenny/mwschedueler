/* Mawang Scheduler v1.3.0 - contact station link reliability fix */
(()=>{
'use strict';
if(window.__mwsV130LiveContactFix)return;
window.__mwsV130LiveContactFix=1;

function normalizeHttp(raw){
  const text=String(raw||'').trim();if(!text)return'';
  const candidate=/^https?:\/\//i.test(text)?text:`https://${text}`;
  try{const u=new URL(candidate);if(u.protocol!=='http:'&&u.protocol!=='https:')return'';return u.href}catch(_){return''}
}
/* Contact detail "방문": keep the navigation in the user's click stack and use a real anchor. */
function visitStation(){
  const input=document.getElementById('ctStationUrl');const url=normalizeHttp(input?.value);
  if(!url){try{window.toast?.('방송국 주소','올바른 http/https 방송국 주소를 입력해 주세요')}catch(_){};return false}
  const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.style.display='none';document.body.appendChild(a);
  try{a.click()}finally{a.remove()}
  return false;
}
function installVisitFix(){window.visitContactStationV55=visitStation;const btn=document.getElementById('ctStationVisitBtn');if(btn)btn.onclick=visitStation}
installVisitFix();
window.addEventListener('mws:post-login-ui-ready',installVisitFix,{once:true});
})();
