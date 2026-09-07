from pathlib import Path
import re, sys
src=Path('index.html')
out=Path('index.html')
s=src.read_text(encoding='utf-8')

# Bring local v5.5 source in sync with current user-facing Marorong naming already on GitHub.
s=s.replace('alt="MAWANG mascot" class="creator-mascot"','alt="Marorong / 마로롱" class="creator-mascot"')
s=s.replace("mascot.alt='MAWANG mascot'","mascot.alt='Marorong / 마로롱'")
s=s.replace("creatorBtnV55.title='클릭하면 MAWANG 마스코트가 쏟아집니다'","creatorBtnV55.title='클릭하면 마로롱이 쏟아집니다'")

# Extend recent-collab visual tiers from 5 to 10.
repls={
"      const tier=Math.min(5,count);":"      const tier=Math.min(10,count);",
"  const tierCounts={0:0,1:0,2:0,3:0,4:0,5:0};":"  const tierCounts={0:0,1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0,10:0};",
"    tierCounts[Math.min(5,n)]++;":"    tierCounts[Math.min(10,n)]++;",
"      ['5','5회+',tierCounts[5]]":"      ['5','5회',tierCounts[5]],\n      ['6','6회',tierCounts[6]],\n      ['7','7회',tierCounts[7]],\n      ['8','8회',tierCounts[8]],\n      ['9','9회',tierCounts[9]],\n      ['10','10회+',tierCounts[10]]",
"    const tier=Math.min(5,count30);":"    const tier=Math.min(10,count30);",
"data-count=\"${count30>=5?'5+':count30}\"":"data-count=\"${count30>=10?'10+':count30}\"",
}
for old,new in repls.items():
    c=s.count(old)
    if c!=1:
        raise SystemExit(f'Expected exactly 1 occurrence for {old[:80]!r}, got {c}')
    s=s.replace(old,new)

style=r'''
<style id="v560-ui-style">
/* =========================================================
   v5.6 - contact tag dock, profile card, 10-tier collab FX
   ========================================================= */

/* Contact tag panel: switch from normal flow to a true viewport dock after it reaches the top. */
@media (min-width:761px){
  body:not([data-resolution="mobile"]) #contacts.active .contact-board-main{grid-column:2!important;min-width:0!important}
  body:not([data-resolution="mobile"]) #contacts .contact-tag-placeholder-v56{grid-column:1;display:none;visibility:hidden;pointer-events:none}
  body:not([data-resolution="mobile"]) #contacts .contact-tag-panel.v56-fixed{
    position:fixed!important;
    margin:0!important;
    z-index:470!important;
    max-height:calc(100vh - 24px)!important;
    overflow:auto!important;
    box-shadow:0 20px 50px rgba(0,0,0,.34),0 0 0 1px color-mix(in srgb,var(--accent) 20%,transparent)!important;
  }
}

/* Contact header profile image is now an interactive Profile Card launcher. */
#contactModal #ctHeaderAvatar.v56-profile-launcher{
  cursor:pointer!important;
  position:relative;
  transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease,filter .16s ease;
}
#contactModal #ctHeaderAvatar.v56-profile-launcher::after{
  content:"PROFILE";
  position:absolute;
  left:50%;bottom:-10px;transform:translateX(-50%);
  padding:3px 7px;border-radius:999px;
  background:#161c30;border:1px solid rgba(153,125,255,.48);
  color:#d7cbff;font-size:7px;font-weight:1000;letter-spacing:.12em;
  opacity:0;pointer-events:none;transition:opacity .14s ease,bottom .14s ease;
}
#contactModal #ctHeaderAvatar.v56-profile-launcher:hover,
#contactModal #ctHeaderAvatar.v56-profile-launcher:focus-visible{
  transform:translateY(-2px) scale(1.035);
  border-color:#987cff!important;
  box-shadow:0 0 0 2px rgba(143,105,255,.18),0 0 28px rgba(127,88,255,.36)!important;
  filter:brightness(1.08);
  outline:none;
}
#contactModal #ctHeaderAvatar.v56-profile-launcher:hover::after,
#contactModal #ctHeaderAvatar.v56-profile-launcher:focus-visible::after{opacity:1;bottom:-15px}

#contactProfileCardModalV56{z-index:1160!important}
#contactProfileCardModalV56 .contact-profile-card-box-v56{
  width:min(650px,94vw)!important;
  padding:18px!important;
  background:radial-gradient(circle at 50% 4%,rgba(112,82,255,.20),transparent 38%),linear-gradient(180deg,#11162a,#090d17)!important;
  border-color:rgba(151,123,255,.52)!important;
  box-shadow:0 30px 92px rgba(0,0,0,.62),0 0 46px rgba(105,78,255,.22)!important;
}
.contact-profile-card-v56{
  display:grid;grid-template-rows:minmax(330px,56vh) auto;
  border:1px solid rgba(170,144,255,.52);border-radius:24px;overflow:hidden;
  background:linear-gradient(180deg,rgba(40,35,88,.76),rgba(8,12,22,.99));
  box-shadow:0 0 0 2px rgba(137,105,255,.11),0 0 44px rgba(126,87,255,.23);
}
.contact-profile-card-image-v56{background:#090e19;display:grid;place-items:center;overflow:hidden;position:relative}
.contact-profile-card-image-v56 img{width:100%;height:100%;object-fit:cover}
.contact-profile-card-initials-v56{font-size:82px;font-weight:1000;color:#d7caff}
.contact-profile-card-meta-v56{padding:22px 24px 24px;text-align:center}
.contact-profile-card-kicker-v56{font-size:10px;letter-spacing:.25em;color:#bca8ff;font-weight:1000}
.contact-profile-card-name-v56{font-size:36px;line-height:1.15;font-weight:1000;margin-top:8px}
.contact-profile-card-tags-v56{display:flex;gap:7px;flex-wrap:wrap;justify-content:center;margin-top:12px}
.contact-profile-card-tags-v56 .chip{font-size:10px;padding:6px 10px}
.contact-profile-card-url-v56{margin-top:15px;padding:11px 12px;border:1px solid var(--border);border-radius:11px;background:rgba(7,11,20,.72);font-size:11px;color:#b7c7e1;word-break:break-all;text-align:left}
.contact-profile-card-actions-v56{display:flex;justify-content:center;margin-top:12px}

/* Recent-collab filter colors 6-10. */
.sniper-tier-filter[data-tier="6"]{--rank:#ff35d4;--rank2:#6d7cff}
.sniper-tier-filter[data-tier="7"]{--rank:#9a5cff;--rank2:#62d8ff}
.sniper-tier-filter[data-tier="8"]{--rank:#4ef5ff;--rank2:#ff5df0}
.sniper-tier-filter[data-tier="9"]{--rank:#8b5cff;--rank2:#ffcc5c}
.sniper-tier-filter[data-tier="10"]{--rank:#fff0a8;--rank2:#b76dff}
.sniper-tier-filter[data-tier="6"],.sniper-tier-filter[data-tier="7"],.sniper-tier-filter[data-tier="8"],.sniper-tier-filter[data-tier="9"],.sniper-tier-filter[data-tier="10"]{
  border-color:color-mix(in srgb,var(--rank) 70%,var(--border));
  color:color-mix(in srgb,var(--rank) 90%,#fff);
  background:color-mix(in srgb,var(--rank) 11%,var(--input));
}
.sniper-tier-filter[data-tier="6"].active,.sniper-tier-filter[data-tier="7"].active,.sniper-tier-filter[data-tier="8"].active,.sniper-tier-filter[data-tier="9"].active,.sniper-tier-filter[data-tier="10"].active{
  background:linear-gradient(135deg,color-mix(in srgb,var(--rank) 74%,#090b15),color-mix(in srgb,var(--rank2) 55%,#090b15));
  border-color:var(--rank2);color:#fff;
  box-shadow:0 0 17px color-mix(in srgb,var(--rank) 56%,transparent),inset 0 0 14px color-mix(in srgb,var(--rank2) 26%,transparent);
}

/* Card envelope intensity rises with the history tier. */
#sniper .collab-6{border-color:#f43bd7;box-shadow:0 0 22px rgba(244,59,215,.25)}
#sniper .collab-7{border-color:#9b63ff;box-shadow:0 0 26px rgba(132,95,255,.30)}
#sniper .collab-8{border-color:#5cf3ff;box-shadow:0 0 30px rgba(83,230,255,.32),0 0 20px rgba(255,77,226,.18)}
#sniper .collab-9{border-color:#bb82ff;box-shadow:0 0 35px rgba(126,86,255,.38),0 0 24px rgba(255,196,80,.20)}
#sniper .collab-10{border-color:#ffe98a;box-shadow:0 0 42px rgba(255,219,98,.42),0 0 32px rgba(153,92,255,.34),0 0 58px rgba(55,214,255,.18)}

@keyframes fx6PlasmaSweep{0%{transform:translateX(-125%) skewX(-18deg)}100%{transform:translateX(420%) skewX(-18deg)}}
@keyframes fx6Pulse{0%,100%{opacity:.58;filter:brightness(1)}50%{opacity:1;filter:brightness(1.5)}}
.fx-tier-6{border-color:#ff3bd7;background:radial-gradient(circle at 25% 50%,rgba(255,45,208,.25),transparent 34%),radial-gradient(circle at 76% 50%,rgba(92,87,255,.24),transparent 35%),#100815;box-shadow:inset 0 0 36px rgba(255,40,211,.19),0 0 17px rgba(255,45,213,.20)}
.fx-tier-6 .fx-core::before,.fx-tier-6 .fx-core::after{content:"";position:absolute;top:-25%;bottom:-25%;left:0;width:22%;background:linear-gradient(90deg,transparent,#fff,#ff4cda,#7771ff,transparent);filter:blur(1px) drop-shadow(0 0 10px #ff4cda);animation:fx6PlasmaSweep 1.85s linear infinite}
.fx-tier-6 .fx-core::after{animation-delay:-.92s;width:13%;opacity:.65}
.fx-tier-6 .fx-particles{background:radial-gradient(circle at 8% 25%,#fff 0 1px,#ff65e3 1.5px 3px,transparent 3.8px),radial-gradient(circle at 28% 72%,#8f85ff 0 2px,transparent 3.5px),radial-gradient(circle at 54% 18%,#fff 0 1px,#ff46d8 1.5px 3px,transparent 3.8px),radial-gradient(circle at 77% 78%,#8d86ff 0 2px,transparent 3.6px),radial-gradient(circle at 96% 30%,#fff 0 1px,#ff5ae0 1.5px 3px,transparent 3.8px);animation:fx6Pulse 1.05s ease-in-out infinite;filter:drop-shadow(0 0 7px #ff46d8)}

@keyframes fx7Storm{0%,100%{opacity:.48;filter:brightness(1)}22%{opacity:1;filter:brightness(2)}26%{opacity:.35}55%{opacity:.9}60%{opacity:.42}82%{opacity:1;filter:brightness(1.8)}}
.fx-tier-7{border-color:#9a67ff;background:linear-gradient(180deg,#10091d,#080b18),radial-gradient(circle at center,rgba(103,97,255,.28),transparent 60%);box-shadow:inset 0 0 40px rgba(106,87,255,.24),0 0 22px rgba(108,84,255,.28)}
.fx-tier-7 .fx-core{background:linear-gradient(112deg,transparent 0 18%,#dfffff 19% 19.7%,#8e7cff 20% 21%,transparent 22% 42%,#fff 43% 43.5%,#63dfff 44% 45%,transparent 46% 71%,#d9ccff 72% 72.6%,#9c6cff 73% 74%,transparent 75%);filter:drop-shadow(0 0 9px #8b79ff);animation:fx7Storm .9s steps(2,end) infinite}
.fx-tier-7 .fx-particles{background:repeating-linear-gradient(180deg,transparent 0 8px,rgba(125,106,255,.12) 9px,transparent 10px),radial-gradient(circle at 12% 30%,#fff 0 1px,#79ddff 1.5px 3px,transparent 3.8px),radial-gradient(circle at 64% 70%,#fff 0 1px,#ab78ff 1.5px 3px,transparent 3.8px),radial-gradient(circle at 89% 24%,#fff 0 1px,#78dbff 1.5px 3px,transparent 3.8px);animation:fx7Storm 1.25s ease-in-out infinite}

@keyframes fx8Prism{0%{filter:hue-rotate(0deg) brightness(1);transform:scaleX(.95)}50%{filter:hue-rotate(55deg) brightness(1.55);transform:scaleX(1.04)}100%{filter:hue-rotate(0deg) brightness(1);transform:scaleX(.95)}}
@keyframes fx8Beam{0%{transform:translateX(-140%)}100%{transform:translateX(430%)}}
.fx-tier-8{border-color:#5cf7ff;background:radial-gradient(circle at center,rgba(255,255,255,.12),transparent 32%),linear-gradient(90deg,#07131b,#170a22,#07131b);box-shadow:inset 0 0 44px rgba(68,239,255,.22),0 0 28px rgba(63,229,255,.30),0 0 22px rgba(255,70,224,.18)}
.fx-tier-8 .fx-core{inset:9px 4%;background:linear-gradient(90deg,transparent,#67f7ff,#fff,#ff6ee8,#b374ff,#fff,#5ef4ff,transparent);height:4px;top:50%;bottom:auto;box-shadow:0 0 12px #65efff,0 0 25px rgba(255,78,226,.55);animation:fx8Prism .8s ease-in-out infinite}
.fx-tier-8 .fx-core::after{content:"";position:absolute;top:-30px;bottom:-30px;width:18%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.95),transparent);filter:blur(2px);animation:fx8Beam 1.55s linear infinite}
.fx-tier-8 .fx-particles{background:radial-gradient(circle at 5% 18%,#fff 0 1px,#4ef4ff 1.5px 3.2px,transparent 4px),radial-gradient(circle at 21% 76%,#fff 0 1px,#ff57e5 1.5px 3.2px,transparent 4px),radial-gradient(circle at 42% 15%,#fff 0 1px,#a76cff 1.5px 3.2px,transparent 4px),radial-gradient(circle at 63% 78%,#fff 0 1px,#5cf5ff 1.5px 3.2px,transparent 4px),radial-gradient(circle at 83% 20%,#fff 0 1px,#ff65e9 1.5px 3.2px,transparent 4px),radial-gradient(circle at 97% 70%,#fff 0 1px,#9b75ff 1.5px 3.2px,transparent 4px);filter:drop-shadow(0 0 8px #fff);animation:fx8Prism 1.2s ease-in-out infinite}

@keyframes fx9VoidPulse{0%,100%{transform:scale(.78);opacity:.65}50%{transform:scale(1.18);opacity:1}}
@keyframes fx9Orbit{to{transform:rotate(360deg)}}
.fx-tier-9{border-color:#b67cff;background:radial-gradient(circle at 50% 50%,#010108 0 13%,rgba(72,33,126,.92) 15% 22%,rgba(151,79,255,.38) 25% 39%,transparent 52%),linear-gradient(90deg,#07070f,#12051b,#07070f);box-shadow:inset 0 0 50px rgba(108,57,203,.34),0 0 35px rgba(135,83,255,.38),0 0 24px rgba(255,190,80,.20)}
.fx-tier-9 .fx-core{inset:5px 12%;border-radius:50%;border:2px solid rgba(190,145,255,.65);box-shadow:0 0 12px #a768ff,inset 0 0 16px rgba(255,204,93,.25);animation:fx9VoidPulse 1s ease-in-out infinite}
.fx-tier-9 .fx-core::after{content:"";position:absolute;inset:-9px;border-radius:50%;border:2px dashed rgba(255,216,111,.65);animation:fx9Orbit 2.2s linear infinite}
.fx-tier-9 .fx-particles{background:radial-gradient(circle at 8% 22%,#fff 0 1px,#c497ff 1.5px 3px,transparent 3.8px),radial-gradient(circle at 18% 72%,#ffd66d 0 1.5px,transparent 3px),radial-gradient(circle at 81% 18%,#fff 0 1px,#ba84ff 1.5px 3px,transparent 3.8px),radial-gradient(circle at 94% 72%,#ffd46e 0 1.5px,transparent 3px);filter:drop-shadow(0 0 9px #a26cff);animation:fx9VoidPulse .82s ease-in-out infinite}

@keyframes fx10MythicPulse{0%,100%{filter:brightness(1) saturate(1);transform:scale(.97)}50%{filter:brightness(1.7) saturate(1.35);transform:scale(1.035)}}
@keyframes fx10Sweep{0%{transform:translateX(-150%) skewX(-14deg)}100%{transform:translateX(460%) skewX(-14deg)}}
.fx-tier-10{border-color:#fff0a2;background:radial-gradient(circle at center,rgba(255,244,180,.28),transparent 32%),linear-gradient(90deg,#150c21,#091525,#1b0b25);box-shadow:inset 0 0 55px rgba(255,223,111,.30),0 0 43px rgba(255,219,98,.46),0 0 34px rgba(160,92,255,.40),0 0 60px rgba(70,224,255,.20)}
.fx-tier-10 .fx-core{background:linear-gradient(90deg,transparent 0 7%,#69f5ff 8% 9%,transparent 10% 22%,#fff6bd 23% 24%,transparent 25% 44%,#c28bff 45% 46.5%,transparent 48% 64%,#fff 65% 66.5%,transparent 68% 82%,#ff86eb 83% 84.5%,transparent 86%),radial-gradient(ellipse at center,rgba(255,245,190,.38),transparent 64%);filter:drop-shadow(0 0 10px #fff0a2);animation:fx10MythicPulse .7s ease-in-out infinite}
.fx-tier-10 .fx-core::before,.fx-tier-10 .fx-core::after{content:"";position:absolute;top:-35%;bottom:-35%;left:0;width:16%;background:linear-gradient(90deg,transparent,#fff,#ffe379,#ae7aff,#64efff,transparent);filter:blur(1px) drop-shadow(0 0 13px #fff);animation:fx10Sweep 1.25s linear infinite}
.fx-tier-10 .fx-core::after{animation-delay:-.62s;width:10%;opacity:.75}
.fx-tier-10 .fx-particles{background:radial-gradient(circle at 4% 18%,#fff 0 1.3px,#ffdf68 1.8px 3.5px,transparent 4.3px),radial-gradient(circle at 14% 78%,#fff 0 1.3px,#6ff4ff 1.8px 3.5px,transparent 4.3px),radial-gradient(circle at 31% 15%,#fff 0 1.3px,#c685ff 1.8px 3.5px,transparent 4.3px),radial-gradient(circle at 48% 82%,#fff 0 1.3px,#ffd970 1.8px 3.5px,transparent 4.3px),radial-gradient(circle at 65% 18%,#fff 0 1.3px,#64efff 1.8px 3.5px,transparent 4.3px),radial-gradient(circle at 82% 76%,#fff 0 1.3px,#dc8cff 1.8px 3.5px,transparent 4.3px),radial-gradient(circle at 96% 24%,#fff 0 1.3px,#ffe379 1.8px 3.5px,transparent 4.3px);filter:drop-shadow(0 0 10px #fff);animation:fx10MythicPulse .58s ease-in-out infinite}
.fx-tier-10 .fx-overlay{background:linear-gradient(180deg,rgba(255,255,255,.12),transparent 26% 72%,rgba(255,221,100,.13)),repeating-linear-gradient(90deg,transparent 0 42px,rgba(255,255,255,.05) 43px,transparent 45px)}

@media(prefers-reduced-motion:reduce){.fx-tier-6 *, .fx-tier-7 *, .fx-tier-8 *, .fx-tier-9 *, .fx-tier-10 *{animation:none!important}}
</style>
'''

script=r'''
<script id="v560-feature-script">
(function(){
  try{data.version=Math.max(56,Number(data.version)||0)}catch(_){ }

  /* ---------- Contact tag panel: viewport dock ---------- */
  function tagPanelV56(){return document.querySelector('#contacts .contact-tag-panel')}
  function tagBoardV56(){return document.querySelector('#contacts .contact-board-layout')}
  function resetTagDockV56(){
    const panel=tagPanelV56(),ph=document.querySelector('#contacts .contact-tag-placeholder-v56');if(!panel)return;
    panel.classList.remove('v56-fixed');
    for(const k of ['left','width','top'])panel.style.removeProperty(k);
    if(ph){ph.style.display='none';ph.style.height='0px';ph.style.width='0px'}
  }
  function ensureTagPlaceholderV56(){
    const panel=tagPanelV56(),board=tagBoardV56();if(!panel||!board)return null;
    let ph=board.querySelector('.contact-tag-placeholder-v56');
    if(!ph){ph=document.createElement('div');ph.className='contact-tag-placeholder-v56';ph.setAttribute('aria-hidden','true');board.insertBefore(ph,panel)}
    return ph;
  }
  function updateContactTagDockV56(){
    const contacts=document.getElementById('contacts'),panel=tagPanelV56(),board=tagBoardV56();
    const mobile=document.body.dataset.resolution==='mobile'||window.innerWidth<=760;
    if(!contacts?.classList.contains('active')||!panel||!board||mobile||panel.style.display==='none'){resetTagDockV56();return}
    const ph=ensureTagPlaceholderV56();
    const br=board.getBoundingClientRect();
    const shouldDock=br.top<12&&br.bottom>90;
    if(!shouldDock){resetTagDockV56();return}
    if(!panel.classList.contains('v56-fixed')){
      const pr=panel.getBoundingClientRect();
      panel.dataset.v56DockWidth=String(pr.width||220);
      if(ph){ph.style.display='block';ph.style.width=(pr.width||220)+'px';ph.style.height=Math.max(1,pr.height)+'px'}
      panel.classList.add('v56-fixed');
    }
    const width=Math.max(180,Number(panel.dataset.v56DockWidth)||220);
    if(ph){ph.style.display='block';ph.style.width=width+'px';ph.style.height=Math.max(1,panel.offsetHeight)+'px'}
    const panelH=Math.min(panel.offsetHeight,window.innerHeight-24);
    const bottomLimitedTop=br.bottom-panelH-12;
    const top=Math.min(12,bottomLimitedTop);
    panel.style.left=Math.round(br.left)+'px';panel.style.width=Math.round(width)+'px';panel.style.top=Math.round(top)+'px';
  }
  window.updateContactTagDockV56=updateContactTagDockV56;
  window.addEventListener('scroll',updateContactTagDockV56,{passive:true,capture:true});
  window.addEventListener('resize',()=>{resetTagDockV56();requestAnimationFrame(updateContactTagDockV56)},{passive:true});

  const baseSetTabV56=window.setTab;
  if(typeof baseSetTabV56==='function'){
    window.setTab=function(tab){const out=baseSetTabV56.apply(this,arguments);requestAnimationFrame(()=>{if(tab==='contacts')updateContactTagDockV56();else resetTagDockV56()});return out};
    try{setTab=window.setTab}catch(_){ }
  }
  const baseSetContactViewV56=window.setContactView||((typeof setContactView==='function')?setContactView:null);
  if(typeof baseSetContactViewV56==='function'){
    window.setContactView=function(view){const out=baseSetContactViewV56.apply(this,arguments);requestAnimationFrame(updateContactTagDockV56);return out};
    try{setContactView=window.setContactView}catch(_){ }
  }

  /* ---------- Contact Profile Card popup ---------- */
  function escV56(v){try{return typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}catch(_){return String(v??'')}}
  function profileSnapshotV56(){
    let c=null;try{if(typeof editingContactId!=='undefined'&&editingContactId&&typeof contact==='function')c=contact(editingContactId)}catch(_){ }
    const name=String(document.getElementById('ctName')?.value||c?.name||'연락처').trim()||'연락처';
    const tags=[...new Set(String(document.getElementById('ctLabels')?.value||'').split(',').map(x=>x.trim()).filter(Boolean))];
    const raw=String(document.getElementById('ctStationUrl')?.value||c?.stationUrl||'').trim();
    let url=raw;try{if(raw&&typeof normalizeExternalUrl==='function')url=normalizeExternalUrl(raw)}catch(_){ }
    let image='';const header=document.getElementById('ctHeaderAvatarImage');
    if(header&&header.style.display!=='none'&&header.getAttribute('src'))image=header.src;else image=String(c?.image||'');
    return{name,tags,url,image};
  }
  function ensureProfileModalV56(){
    let modal=document.getElementById('contactProfileCardModalV56');if(modal)return modal;
    modal=document.createElement('div');modal.id='contactProfileCardModalV56';modal.className='modal';modal.setAttribute('aria-hidden','true');
    modal.innerHTML=`<div class="modalbox contact-profile-card-box-v56"><div class="space" style="margin-bottom:12px"><div><h2 style="margin:0">Profile Card</h2><div class="muted small" style="margin-top:4px">연락처 프로필 카드를 크게 확인합니다.</div></div><button type="button" class="ghost" onclick="closeContactProfileCardV56()">닫기</button></div><div id="contactProfileCardContentV56"></div></div>`;
    modal.addEventListener('click',e=>{if(e.target===modal)window.closeContactProfileCardV56()});document.body.appendChild(modal);return modal;
  }
  window.openContactProfileCardV56=function(){
    const snap=profileSnapshotV56(),modal=ensureProfileModalV56(),box=document.getElementById('contactProfileCardContentV56');if(!box)return;
    const tagHtml=snap.tags.length?snap.tags.map(t=>`<span class="chip">${escV56(t)}</span>`).join(''):'<span class="muted small">태그 없음</span>';
    const imageHtml=snap.image?`<img src="${escV56(snap.image)}" alt="${escV56(snap.name)}">`:`<div class="contact-profile-card-initials-v56">${escV56(snap.name.slice(0,1))}</div>`;
    const urlHtml=snap.url?`<div class="contact-profile-card-url-v56">${escV56(snap.url)}</div><div class="contact-profile-card-actions-v56"><button type="button" class="secondary" onclick="visitContactStationV55()">URL 방문</button></div>`:`<div class="contact-profile-card-url-v56 muted">URL 없음</div>`;
    box.innerHTML=`<div class="contact-profile-card-v56"><div class="contact-profile-card-image-v56">${imageHtml}</div><div class="contact-profile-card-meta-v56"><div class="contact-profile-card-kicker-v56">PROFILE CARD</div><div class="contact-profile-card-name-v56">${escV56(snap.name)}</div><div class="contact-profile-card-tags-v56">${tagHtml}</div>${urlHtml}</div></div>`;
    modal.classList.add('open');modal.setAttribute('aria-hidden','false');try{syncModalInteractionState()}catch(_){ }
  };
  window.closeContactProfileCardV56=function(){const modal=document.getElementById('contactProfileCardModalV56');modal?.classList.remove('open');modal?.setAttribute('aria-hidden','true');try{syncModalInteractionState()}catch(_){ }};
  function bindProfileLauncherV56(){
    const avatar=document.getElementById('ctHeaderAvatar');if(!avatar||avatar.dataset.v56Bound==='1')return;
    avatar.dataset.v56Bound='1';avatar.classList.add('v56-profile-launcher');avatar.setAttribute('role','button');avatar.setAttribute('tabindex','0');avatar.title='클릭해서 Profile Card 크게 보기';
    avatar.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();window.openContactProfileCardV56()});
    avatar.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();window.openContactProfileCardV56()}});
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('contactProfileCardModalV56')?.classList.contains('open')){e.preventDefault();window.closeContactProfileCardV56()}},true);
  const baseOpenContactV56=window.openContact;
  if(typeof baseOpenContactV56==='function'){
    window.openContact=function(){const out=baseOpenContactV56.apply(this,arguments);requestAnimationFrame(bindProfileLauncherV56);return out};
    try{openContact=window.openContact}catch(_){ }
  }

  bindProfileLauncherV56();ensureProfileModalV56();requestAnimationFrame(updateContactTagDockV56);
  try{renderSniperList()}catch(_){ }
})();
</script>
'''

if 'id="v560-ui-style"' in s or 'id="v560-feature-script"' in s:
    raise SystemExit('v5.6 patch already present')
needle='</body>'
if s.count(needle)!=1: raise SystemExit('Expected one </body>')
s=s.replace(needle,style+'\n'+script+'\n'+needle)
out.write_text(s,encoding='utf-8')
print(out)
print('bytes',out.stat().st_size)
