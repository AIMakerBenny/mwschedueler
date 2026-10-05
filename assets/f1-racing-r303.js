(()=>{
'use strict';
const VERSION303='phase303-f1-feedback-ui-stabilization';
const thoughtStateV303={observer:null,lastKey:'',timers:new Map(),shown:0};
function standingsV303(){try{return window.mwsF1ComputeRaceStandingsV191?.()||[]}catch(_){return []}}
function normalizeSpeakerV303(value=''){return String(value||'').replace(/^\[|\]$/g,'').trim()}
function shortThoughtV303(text=''){const clean=String(text||'').replace(/\s+/g,' ').trim();return clean.length>18?clean.slice(0,18)+'…':clean}
function svgV303(tag,attrs={}){const node=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));return node}
function markerForSpeakerV303(speaker=''){
 const key=normalizeSpeakerV303(speaker).toLowerCase();
 const row=standingsV303().find(item=>{
   const d=item?.vehicle?.driver||{};return [d.name,d.displayName,d.code].some(value=>String(value||'').trim().toLowerCase()===key)
 });
 return row?.vehicle?.marker||null;
}
function showDriverThoughtV303(speaker,text){
 const marker=markerForSpeakerV303(speaker),clean=shortThoughtV303(text);if(!marker||!clean)return false;
 const id=String(marker.dataset.driverId||speaker);const old=marker.querySelector('.f1-racing-driver-thought-v303');if(old)old.remove();
 const prior=thoughtStateV303.timers.get(id);if(prior)clearTimeout(prior);
 const group=svgV303('g',{class:'f1-racing-driver-thought-v303','aria-hidden':'true'});
 const box=svgV303('rect',{x:-58,y:-62,width:116,height:31,rx:8,ry:8,class:'thought-box-v303'});
 const tail=svgV303('path',{d:'M -7 -31 L 0 -23 L 8 -31 Z',class:'thought-tail-v303'});
 const label=svgV303('text',{x:0,y:-43,'text-anchor':'middle',class:'thought-text-v303'});label.textContent='“'+clean+'”';
 group.append(box,tail,label);marker.appendChild(group);requestAnimationFrame(()=>group.classList.add('show-v303'));
 const timer=setTimeout(()=>{group.classList.remove('show-v303');setTimeout(()=>group.remove(),220);thoughtStateV303.timers.delete(id)},3300);
 thoughtStateV303.timers.set(id,timer);thoughtStateV303.shown+=1;return true;
}
function installThoughtBridgeV303(){
 const root=document.getElementById('f1RacingConversationStackV276');if(!root)return false;
 root.setAttribute('aria-hidden','true');
 if(thoughtStateV303.observer)return true;
 const sync=()=>{const bubbles=[...root.querySelectorAll('.f1-racing-conversation-bubble-v276')],last=bubbles.at(-1);if(!last)return;const speaker=normalizeSpeakerV303(last.querySelector('.speaker')?.textContent),text=String(last.querySelector('.text')?.textContent||'').trim(),key=speaker+'|'+text;if(!text||key===thoughtStateV303.lastKey)return;thoughtStateV303.lastKey=key;showDriverThoughtV303(speaker,text)};
 thoughtStateV303.observer=new MutationObserver(()=>queueMicrotask(sync));thoughtStateV303.observer.observe(root,{childList:true,subtree:true,characterData:true});sync();return true;
}
function dockLiveCutinV303(){
 const layer=document.getElementById('f1RacingLiveCutinLayerV264'),commentary=document.querySelector('#f1RacingViewRaceV185 .f1-racing-commentary-v188'),log=document.getElementById('f1RacingCommentaryLogV188');
 if(!layer||!commentary||!log)return false;
 if(layer.parentElement!==commentary)commentary.insertBefore(layer,log);
 layer.classList.add('docked-v303');layer.setAttribute('aria-label','LIVE 경기 컷인');return true;
}
function suppressDuplicateTrackRankV303(){const root=document.getElementById('f1RacingTrackRankingV284');if(root){root.hidden=true;root.setAttribute('aria-hidden','true')}return true}
function qaFeedbackUiV303(){
 const conversation=document.getElementById('f1RacingConversationStackV276'),cutin=document.getElementById('f1RacingLiveCutinLayerV264'),commentary=document.querySelector('#f1RacingViewRaceV185 .f1-racing-commentary-v188'),rank=document.getElementById('f1RacingTrackRankingV284');
 const cards=[...document.querySelectorAll('#f1RacingGridShuffleStageV273 .f1-racing-shuffle-card-v273')];
 const ratios=cards.map(card=>{const r=card.getBoundingClientRect();return r.width>0?r.height/r.width:0});
 return {version:VERSION303,conversationHidden:Boolean(conversation)&&getComputedStyle(conversation).display==='none',cutinDocked:Boolean(cutin&&commentary&&cutin.parentElement===commentary),duplicateRankHidden:!rank||getComputedStyle(rank).display==='none',thoughtObserver:Boolean(thoughtStateV303.observer),thoughtShown:thoughtStateV303.shown,cardRatios:ratios,verticalCards:!ratios.length||ratios.every(r=>r>=1.3),allPass:Boolean(conversation&&cutin&&commentary)&&getComputedStyle(conversation).display==='none'&&cutin.parentElement===commentary&&(!rank||getComputedStyle(rank).display==='none')&&Boolean(thoughtStateV303.observer)&&(!ratios.length||ratios.every(r=>r>=1.3))};
}
function syncV303(){installThoughtBridgeV303();dockLiveCutinV303();suppressDuplicateTrackRankV303()}
function bootV303(){syncV303();const root=document.getElementById('gameF1Racing');if(root)new MutationObserver(syncV303).observe(root,{childList:true,subtree:true});}
window.mwsF1ShowDriverThoughtV303=showDriverThoughtV303;window.mwsF1DockLiveCutinV303=dockLiveCutinV303;window.mwsF1QaFeedbackUiV303=qaFeedbackUiV303;window.__mwsF1FeedbackUiV303=VERSION303;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootV303,{once:true});else bootV303();
})();
