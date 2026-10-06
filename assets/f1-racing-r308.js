(()=>{
'use strict';
const VERSION308='phase308-track-overlay-hud-frequency-diversity';
const VERSION315HUD='phase315-dialogue-semantic-diversity';
const HUD_CONFIG_V308=Object.freeze({globalGapMs:6800,speakerGapMs:12000,durationMs:4800,maxText:48,recentLimit:24,semanticWindow:2,semanticHistoryLimit:12,recentSpeakerLimit:6});
const stateV308={installed:false,observer:null,rootObserver:null,lastConversationId:'',lastGlobalSimMs:-Infinity,lastSpeakerAt:new Map(),recentTexts:[],recentSemantic:[],recentSpeakers:[],hudShown:0,hudSuppressed:0,liveDockCount:0,timer:0};

function escV308(value=''){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function stageV308(){return document.querySelector('#f1RacingViewRaceV185 .f1-racing-race-map-stage-v188')}
function normalizeSpeakerV308(value=''){return String(value||'').replace(/^\[|\]$/g,'').trim()}
function driverForSpeakerV308(speaker=''){
 const key=normalizeSpeakerV308(speaker).toLowerCase();
 const rows=window.mwsF1ComputeRaceStandingsV191?.()||[];
 const row=rows.find(item=>{const d=item?.vehicle?.driver||{};return [d.name,d.displayName,d.code].some(v=>String(v||'').trim().toLowerCase()===key)});
 return row?.vehicle?.driver||null;
}
function initialsV308(name=''){const parts=String(name||'').trim().split(/\s+/).filter(Boolean);return (parts.slice(0,2).map(v=>v[0]).join('')||'?').toUpperCase()}
function trimTextV308(text=''){const clean=String(text||'').replace(/\s+/g,' ').trim();return clean.length>HUD_CONFIG_V308.maxText?clean.slice(0,HUD_CONFIG_V308.maxText)+'…':clean}
function ensureHudV308(){
 const stage=stageV308();if(!stage)return null;
 let root=document.getElementById('f1RacingDialogueHudV308');
 if(!root){root=document.createElement('div');root.id='f1RacingDialogueHudV308';root.className='f1-racing-dialogue-hud-v308';root.setAttribute('aria-live','polite');root.setAttribute('aria-label','드라이버 반응');stage.appendChild(root)}
 else if(root.parentElement!==stage)stage.appendChild(root);
 return root;
}
function dockLiveV308(){
 const stage=stageV308(),layer=document.getElementById('f1RacingLiveCutinLayerV264');if(!stage||!layer)return false;
 window.__mwsF1LiveTrackDockV308=true;
 if(layer.parentElement!==stage){stage.appendChild(layer);stateV308.liveDockCount+=1}
 layer.classList.remove('docked-v303');layer.classList.add('track-docked-v308');layer.setAttribute('aria-label','트랙 LIVE 컷인');
 return true;
}
function dialogueSemanticKeyV315(text=''){
 const t=String(text||'');
 if(/추월|넘어|순위|앞에 섰/.test(t))return 'PASS';
 if(/브레이크|제동|코너 진입/.test(t))return 'BRAKING';
 if(/타이어|그립|마모/.test(t))return 'TYRE';
 if(/실수|흔들|미끄|수습/.test(t))return 'MISTAKE';
 if(/라인|빈틈|공간|안쪽|바깥/.test(t))return 'LINE';
 if(/거리|간격|붙|좁히/.test(t))return 'GAP';
 if(/압박|방어|수비/.test(t))return 'PRESSURE';
 if(/페이스|속도|가속|직선/.test(t))return 'PACE';
 return 'GENERIC';
}
function hudCanShowV308(speaker,text){
 const now=Number(window.mwsF1GetSimulationClockV192?.()?.simTimeMs)||0,clean=trimTextV308(text),name=normalizeSpeakerV308(speaker);
 if(!clean||!name)return false;
 if(stateV308.recentTexts.includes(clean)){stateV308.hudSuppressed+=1;return false}
 const semantic=dialogueSemanticKeyV315(clean);
 if(semantic!=='GENERIC'&&stateV308.recentSemantic.slice(-HUD_CONFIG_V308.semanticWindow).includes(semantic)){stateV308.hudSuppressed+=1;return false}
 if(stateV308.recentSpeakers.slice(-2).includes(name)){stateV308.hudSuppressed+=1;return false}
 if(Number.isFinite(stateV308.lastGlobalSimMs)&&now-stateV308.lastGlobalSimMs<HUD_CONFIG_V308.globalGapMs){stateV308.hudSuppressed+=1;return false}
 const last=Number(stateV308.lastSpeakerAt.get(name));
 if(Number.isFinite(last)&&now-last<HUD_CONFIG_V308.speakerGapMs){stateV308.hudSuppressed+=1;return false}
 return true;
}
function showHudV308(speaker,text){
 const root=ensureHudV308(),name=normalizeSpeakerV308(speaker),clean=trimTextV308(text);if(!root||!hudCanShowV308(name,clean))return false;
 const driver=driverForSpeakerV308(name),image=String(driver?.image||driver?.avatar||'').trim(),color=String(driver?.color||driver?.driverColor||'#6fb7ff');
 const avatar=image?'<img class="f1-racing-dialogue-avatar-v308" src="'+escV308(image)+'" alt="">':'<span class="f1-racing-dialogue-avatar-v308 fallback">'+escV308(initialsV308(name))+'</span>';
 root.innerHTML='<article class="f1-racing-dialogue-card-v308" style="--dialogue-driver-v308:'+escV308(color)+'"><div class="f1-racing-dialogue-profile-v308">'+avatar+'</div><div class="f1-racing-dialogue-copy-v308"><strong>'+escV308(name)+'</strong><p>“'+escV308(clean)+'”</p></div></article>';
 root.classList.remove('leaving-v308');requestAnimationFrame(()=>root.classList.add('visible-v308'));
 const now=Number(window.mwsF1GetSimulationClockV192?.()?.simTimeMs)||0;
 stateV308.lastGlobalSimMs=now;stateV308.lastSpeakerAt.set(name,now);stateV308.recentTexts.push(clean);
 if(stateV308.recentTexts.length>HUD_CONFIG_V308.recentLimit)stateV308.recentTexts.splice(0,stateV308.recentTexts.length-HUD_CONFIG_V308.recentLimit);
 stateV308.recentSemantic.push(dialogueSemanticKeyV315(clean));if(stateV308.recentSemantic.length>HUD_CONFIG_V308.semanticHistoryLimit)stateV308.recentSemantic.splice(0,stateV308.recentSemantic.length-HUD_CONFIG_V308.semanticHistoryLimit);
 stateV308.recentSpeakers.push(name);if(stateV308.recentSpeakers.length>HUD_CONFIG_V308.recentSpeakerLimit)stateV308.recentSpeakers.splice(0,stateV308.recentSpeakers.length-HUD_CONFIG_V308.recentSpeakerLimit);
 stateV308.hudShown+=1;return true;
}
function clearExpiredHudV308(){
 const root=document.getElementById('f1RacingDialogueHudV308');if(!root||!root.classList.contains('visible-v308'))return false;
 const now=Number(window.mwsF1GetSimulationClockV192?.()?.simTimeMs)||0;
 if(!Number.isFinite(stateV308.lastGlobalSimMs)||now-stateV308.lastGlobalSimMs<HUD_CONFIG_V308.durationMs)return false;
 root.classList.add('leaving-v308');root.classList.remove('visible-v308');setTimeout(()=>{if(!root.classList.contains('visible-v308'))root.replaceChildren();root.classList.remove('leaving-v308')},240);return true;
}
function syncConversationV308(){
 const root=document.getElementById('f1RacingConversationStackV276');if(!root)return false;
 const bubbles=[...root.querySelectorAll('.f1-racing-conversation-bubble-v276')];
 const latest=bubbles.at(-1);if(!latest)return false;
 const id=String(latest.dataset.conversationId||'');if(!id||id===stateV308.lastConversationId)return false;
 stateV308.lastConversationId=id;
 return showHudV308(latest.querySelector('.speaker')?.textContent||'',latest.querySelector('.text')?.textContent||'');
}
function syncV308(){dockLiveV308();ensureHudV308();syncConversationV308();clearExpiredHudV308();return true}
function installV308(){
 if(stateV308.installed)return true;stateV308.installed=true;window.__mwsF1LiveTrackDockV308=true;
 dockLiveV308();ensureHudV308();
 const conversation=document.getElementById('f1RacingConversationStackV276');
 if(conversation){stateV308.observer=new MutationObserver(()=>queueMicrotask(syncConversationV308));stateV308.observer.observe(conversation,{childList:true,subtree:true,characterData:true})}
 const game=document.getElementById('gameF1Racing');
 if(game){stateV308.rootObserver=new MutationObserver(()=>queueMicrotask(()=>{dockLiveV308();ensureHudV308()}));stateV308.rootObserver.observe(game,{childList:true,subtree:true})}
 stateV308.timer=window.setInterval(()=>{if(String(window.mwsF1GetScreenStateV185?.()||'')==='RACE'){dockLiveV308();clearExpiredHudV308()}},300);
 syncV308();return true;
}
function qaV308(){
 const stage=stageV308(),live=document.getElementById('f1RacingLiveCutinLayerV264'),hud=ensureHudV308();
 const lr=live?.getBoundingClientRect(),sr=stage?.getBoundingClientRect(),hr=hud?.getBoundingClientRect();
 const liveLeft=Boolean(lr&&sr)&&lr.left<=sr.left+Math.max(40,sr.width*.12);
 const liveBottom=Boolean(lr&&sr)&&lr.bottom>=sr.bottom-Math.max(50,sr.height*.18);
 const hudRight=!hud?.firstElementChild||Boolean(hr&&sr)&&hr.right>=sr.right-Math.max(50,sr.width*.12);
 const hudBottom=!hud?.firstElementChild||Boolean(hr&&sr)&&hr.bottom>=sr.bottom-Math.max(50,sr.height*.18);
 const visibleLegacyThought=[...document.querySelectorAll('.f1-racing-driver-thought-v303')].filter(node=>getComputedStyle(node).display!=='none').length;
 return {version:VERSION308,config:{...HUD_CONFIG_V308},liveDocked:Boolean(stage&&live&&live.parentElement===stage&&live.classList.contains('track-docked-v308')),liveLeft,liveBottom,hudReady:Boolean(hud&&stage&&hud.parentElement===stage),hudRight,hudBottom,visibleLegacyThought,hudShown:stateV308.hudShown,hudSuppressed:stateV308.hudSuppressed,liveDockCount:stateV308.liveDockCount,
  allPass:Boolean(stage&&live&&hud)&&live.parentElement===stage&&live.classList.contains('track-docked-v308')&&liveLeft&&liveBottom&&hud.parentElement===stage&&hudRight&&hudBottom&&visibleLegacyThought===0&&HUD_CONFIG_V308.globalGapMs>=6000&&HUD_CONFIG_V308.speakerGapMs>=10000};
}
window.mwsF1SyncTrackOverlaysV308=syncV308;
window.mwsF1ShowDialogueHudV308=showHudV308;
window.mwsF1QaTrackOverlayHudV308=qaV308;
window.mwsF1GetTrackOverlayStateV308=function(){return {config:{...HUD_CONFIG_V308},lastConversationId:stateV308.lastConversationId,lastGlobalSimMs:stateV308.lastGlobalSimMs,recentTexts:[...stateV308.recentTexts],recentSemantic:[...stateV308.recentSemantic],recentSpeakers:[...stateV308.recentSpeakers],hudShown:stateV308.hudShown,hudSuppressed:stateV308.hudSuppressed,liveDockCount:stateV308.liveDockCount}};
window.mwsF1QaDialogueSemanticV315=function(){const samples=['추월 기회가 열립니다','브레이크를 늦춥니다','타이어를 관리합니다','페이스를 올립니다'];const keys=samples.map(dialogueSemanticKeyV315);return {version:VERSION315HUD,keys,unique:new Set(keys).size,config:{...HUD_CONFIG_V308},allPass:new Set(keys).size===samples.length&&HUD_CONFIG_V308.semanticWindow>=2&&HUD_CONFIG_V308.recentSpeakerLimit>=5}};
window.__mwsF1RacingHudV315=VERSION315HUD;
window.__mwsF1RacingV308=VERSION308;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installV308,{once:true});else installV308();
})();