/* Mawang Scheduler v1.3.0 - mobile access tools belong to the drawer, never above page content. */
(()=>{
'use strict';
if(window.__mwsMobileAccessToolsV130)return;
window.__mwsMobileAccessToolsV130=true;

const tools=document.getElementById('mwsAccessTools');
const sidebar=document.querySelector('.sidebar');
const version=document.getElementById('mwsBuildVersion');
if(!tools||!sidebar||!version)return;

const marker=document.createComment('mws-access-tools-desktop-anchor-v130');
tools.parentNode?.insertBefore(marker,tools);

const style=document.createElement('style');
style.id='mwsMobileAccessToolsStyleV130';
style.textContent=`
.mws-access-tools.mws-mobile-sidebar-tools-v130{
  position:static!important;inset:auto!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;
  width:100%!important;max-width:none!important;margin:10px 0 8px!important;padding:10px 0 0!important;
  display:grid!important;grid-template-columns:auto minmax(0,1fr) minmax(0,1fr)!important;gap:7px!important;align-items:center!important;
  border-top:1px solid color-mix(in srgb,var(--border) 78%,transparent)!important;z-index:auto!important;
}
.mws-access-tools.mws-mobile-sidebar-tools-v130[hidden]{display:none!important}
.mws-access-tools.mws-mobile-sidebar-tools-v130 .mws-access-pill,
.mws-access-tools.mws-mobile-sidebar-tools-v130 .mws-access-btn{
  position:static!important;min-width:0!important;min-height:40px!important;margin:0!important;padding:8px 10px!important;
  display:flex!important;align-items:center!important;justify-content:center!important;border-radius:11px!important;
  font-size:11px!important;line-height:1.15!important;white-space:nowrap!important;box-shadow:none!important;
}
.mws-access-tools.mws-mobile-sidebar-tools-v130 .mws-access-pill{font-weight:900!important;letter-spacing:.06em!important}
.mws-access-tools.mws-mobile-sidebar-tools-v130 .mws-access-btn{width:100%!important}
`;
document.head.appendChild(style);

function isMobile(){
  return document.body.dataset.deviceMode==='mobile'||document.body.dataset.resolution==='mobile';
}
function move(){
  if(isMobile()){
    if(tools.parentElement!==sidebar)sidebar.insertBefore(tools,version);
    tools.classList.add('mws-mobile-sidebar-tools-v130');
  }else{
    tools.classList.remove('mws-mobile-sidebar-tools-v130');
    if(marker.parentNode&&tools.previousSibling!==marker)marker.parentNode.insertBefore(tools,marker.nextSibling);
  }
}

move();
new MutationObserver(move).observe(document.body,{attributes:true,attributeFilter:['data-device-mode','data-resolution']});
window.addEventListener('mws:post-login-ui-ready',move);
})();
