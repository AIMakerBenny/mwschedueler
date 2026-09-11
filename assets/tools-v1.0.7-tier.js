/* CF MWS V 1.0.7 - Tier visual layout polish */
(()=>{
'use strict';
if(window.__mwsTierVisualV107)return;window.__mwsTierVisualV107=1;
const BUILD='CF MWS V 1.0.7';
const style=document.createElement('style');
style.id='mwsTierVisualV107Style';
style.textContent=`
#toolTier .mws-tier-row{
  grid-template-columns:180px minmax(0,1fr)!important;
  min-height:146px!important;
  align-items:stretch!important;
}
#toolTier .mws-tier-meta{
  position:relative!important;
  min-height:146px!important;
  box-sizing:border-box!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:stretch!important;
  justify-content:center!important;
  gap:9px!important;
  padding:16px 42px 16px 14px!important;
}
#toolTier .mws-tier-meta>input[type="text"]:first-child{
  width:58px!important;
  min-width:58px!important;
  height:42px!important;
  align-self:center!important;
  box-sizing:border-box!important;
  font-size:24px!important;
  line-height:1!important;
  text-align:center!important;
}
#toolTier .mws-tier-title-v106{
  width:100%!important;
  min-width:0!important;
  height:38px!important;
  box-sizing:border-box!important;
  font-size:15px!important;
  text-align:center!important;
}
#toolTier .mws-tier-delete-v106{
  position:absolute!important;
  top:10px!important;
  right:9px!important;
  width:30px!important;
  height:30px!important;
  border-radius:8px!important;
}
#toolTier .mws-tier-drop{
  min-height:146px!important;
  padding:12px!important;
  gap:10px!important;
  align-items:center!important;
  align-content:center!important;
  overflow:visible!important;
}
#toolTier .mws-tier-drop .mws-placed{
  position:relative!important;
  flex:0 0 112px!important;
  width:112px!important;
  min-width:112px!important;
  max-width:112px!important;
  height:112px!important;
  padding:0!important;
  gap:0!important;
  border-radius:14px!important;
  overflow:visible!important;
  background:transparent!important;
  border:1px solid color-mix(in srgb,var(--border) 88%,transparent)!important;
  box-shadow:0 4px 12px rgba(0,0,0,.18)!important;
}
#toolTier .mws-tier-drop .mws-placed>img,
#toolTier .mws-tier-drop .mws-placed>.mws-avatar{
  display:block!important;
  width:112px!important;
  height:112px!important;
  min-width:112px!important;
  min-height:112px!important;
  max-width:112px!important;
  max-height:112px!important;
  border-radius:13px!important;
  object-fit:cover!important;
  margin:0!important;
}
#toolTier .mws-tier-drop .mws-placed>b{
  position:absolute!important;
  left:6px!important;
  right:6px!important;
  bottom:6px!important;
  z-index:6!important;
  display:block!important;
  padding:6px 7px!important;
  border-radius:8px!important;
  background:rgba(5,8,18,.88)!important;
  color:#fff!important;
  font-size:12px!important;
  font-weight:900!important;
  line-height:1.2!important;
  text-align:center!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  opacity:0!important;
  transform:translateY(4px)!important;
  pointer-events:none!important;
  transition:opacity .12s ease,transform .12s ease!important;
}
#toolTier .mws-tier-drop .mws-placed:hover>b{
  opacity:1!important;
  transform:translateY(0)!important;
}
#toolTier .mws-tier-drop .mws-placed>.mws-x{
  top:-8px!important;
  right:-8px!important;
  z-index:8!important;
  width:25px!important;
  height:25px!important;
  border-radius:50%!important;
  background:#8b1d2c!important;
  color:#fff!important;
  border:2px solid var(--panel)!important;
  font-size:16px!important;
  line-height:21px!important;
  box-shadow:0 2px 8px rgba(0,0,0,.25)!important;
}
#toolTier .mws-contact-drawer{
  position:static!important;
  bottom:auto!important;
  max-height:none!important;
  overflow:visible!important;
}
#toolTier .mws-contact-track{
  max-height:none!important;
  overflow:visible!important;
}
@media(max-width:760px){
  #toolTier .mws-tier-row{grid-template-columns:150px minmax(0,1fr)!important}
  #toolTier .mws-tier-meta{padding:12px 38px 12px 10px!important}
  #toolTier .mws-tier-drop .mws-placed,
  #toolTier .mws-tier-drop .mws-placed>img,
  #toolTier .mws-tier-drop .mws-placed>.mws-avatar{width:96px!important;height:96px!important;min-width:96px!important;min-height:96px!important;max-width:96px!important;max-height:96px!important}
  #toolTier .mws-tier-drop .mws-placed{flex-basis:96px!important}
}
`;
document.head.appendChild(style);
function forceVersion(){try{document.body?.setAttribute('data-build-version',BUILD);document.querySelectorAll('[id^="mwsBuildVersionV5"],#mwsBuildVersion,.sidebar-build-version-v52,.sidebar-build-version-v53,[class*="sidebar-build-version"]').forEach(x=>{if(x.textContent!==BUILD)x.textContent=BUILD})}catch(_){}}
function decorate(){
  try{
    document.querySelectorAll('#toolTier .mws-tier-drop .mws-placed').forEach(card=>{
      const name=card.querySelector('b')?.textContent?.trim()||'';
      if(name)card.setAttribute('title',name);
    });
    forceVersion();
  }catch(_){ }
}
let busy=false;const observer=new MutationObserver(()=>{if(busy)return;busy=true;queueMicrotask(()=>{decorate();busy=false})});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',decorate,{once:true});
window.addEventListener('load',decorate,{once:true});
window.addEventListener('mawang:datachange',()=>setTimeout(decorate,0));
[50,200,600,1400,3000,6000].forEach(ms=>setTimeout(decorate,ms));
if(document.readyState!=='loading')decorate();
})();
