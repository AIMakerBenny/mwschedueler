/* Mawang Scheduler v1.3.0 - isolated mobile calendar quick-add bar */
(()=>{
'use strict';
if(window.__mwsMobileCalendarQuickAddV130)return;
window.__mwsMobileCalendarQuickAddV130=true;

const calendar=document.getElementById('calendar');
const button=document.getElementById('newEventBtn');
if(!calendar||!button)return;

const originalParent=button.parentNode;
const originalNext=button.nextSibling;
const bar=document.createElement('div');
bar.className='mws-mobile-calendar-quick-add-v130';
bar.setAttribute('aria-label','빠른 컨텐츠 추가');
bar.hidden=true;
document.body.appendChild(bar);

const style=document.createElement('style');
style.id='mwsMobileCalendarQuickAddStyleV130';
style.textContent=`
.mws-mobile-calendar-quick-add-v130{display:none}
body[data-device-mode="mobile"] .mws-mobile-calendar-quick-add-v130{
  position:fixed;
  left:50%;
  bottom:calc(var(--mws-mobile-nav-offset-v130,68px) + 14px);
  z-index:4850;
  width:min(72vw,420px);
  pointer-events:none;
  transform:translateX(-50%);
}
body[data-device-mode="mobile"] .mws-mobile-calendar-quick-add-v130.is-visible{
  display:block;
}
body[data-device-mode="mobile"].mws-mobile-day-detail-open-v130 .mws-mobile-calendar-quick-add-v130{
  display:none!important;
  pointer-events:none!important;
}
body[data-device-mode="mobile"] .mws-mobile-calendar-quick-add-v130 #newEventBtn{
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  width:100%!important;
  min-width:0!important;
  height:58px!important;
  min-height:58px!important;
  margin:0!important;
  padding:0 18px 0 22px!important;
  border:1px solid color-mix(in srgb,var(--text) 18%,var(--border))!important;
  border-radius:999px!important;
  background:color-mix(in srgb,var(--panel) 94%,#000)!important;
  color:var(--text)!important;
  font-size:14px!important;
  font-weight:850!important;
  letter-spacing:-.02em!important;
  box-shadow:0 16px 42px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.04)!important;
  pointer-events:auto!important;
  backdrop-filter:blur(16px);
  -webkit-backdrop-filter:blur(16px);
}
body[data-device-mode="mobile"] .mws-mobile-calendar-quick-add-v130 #newEventBtn::after{
  content:'+';
  display:grid;
  place-items:center;
  width:34px;
  height:34px;
  margin-left:14px;
  color:var(--text);
  font-size:32px;
  font-weight:300;
  line-height:1;
}
body[data-device-mode="mobile"] .mws-mobile-calendar-quick-add-v130 #newEventBtn:active{
  transform:scale(.985)!important;
  background:color-mix(in srgb,var(--panel2) 88%,#000)!important;
}
body[data-device-mode="mobile"] #calendar[data-mobile-calendar-view="month"]{
  padding-bottom:78px!important;
}
@media(max-width:420px){
  body[data-device-mode="mobile"] .mws-mobile-calendar-quick-add-v130{width:min(78vw,360px)}
  body[data-device-mode="mobile"] .mws-mobile-calendar-quick-add-v130 #newEventBtn{height:54px!important;min-height:54px!important;padding-left:18px!important}
}
`;
document.head.appendChild(style);

function isMobileMonth(){
  return document.body.dataset.deviceMode==='mobile'
    && calendar.classList.contains('active')
    && calendar.dataset.mobileCalendarView==='month';
}

function restoreButton(){
  if(button.parentNode===originalParent)return;
  if(originalNext&&originalNext.parentNode===originalParent)originalParent.insertBefore(button,originalNext);
  else originalParent.appendChild(button);
}

function syncNavOffset(){
  const nav=document.querySelector('.mws-mobile-tabs');
  const rect=nav?.getBoundingClientRect?.();
  const height=rect&&rect.height>0?Math.ceil(rect.height):68;
  bar.style.setProperty('--mws-mobile-nav-offset-v130',height+'px');
}
function sync(){
  syncNavOffset();
  const show=isMobileMonth()&&!document.body.classList.contains('mws-mobile-day-detail-open-v130');
  if(show){
    if(button.parentNode!==bar)bar.appendChild(button);
    bar.hidden=false;
    bar.classList.add('is-visible');
  }else{
    bar.classList.remove('is-visible');
    bar.hidden=true;
    restoreButton();
  }
}

let queued=false;
function queueSync(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;sync()});
}

new MutationObserver(queueSync).observe(calendar,{attributes:true,attributeFilter:['class','data-mobile-calendar-view']});
new MutationObserver(queueSync).observe(document.body,{attributes:true,attributeFilter:['data-device-mode','data-resolution','class']});
document.addEventListener('click',event=>{
  if(event.target.closest('[data-tab], [data-calendar-view]'))queueSync();
},true);
window.addEventListener('mws:post-login-ui-ready',queueSync);
window.addEventListener('mawang:datachange',queueSync);
window.addEventListener('resize',queueSync,{passive:true});
window.addEventListener('orientationchange',queueSync,{passive:true});
queueSync();
})();
