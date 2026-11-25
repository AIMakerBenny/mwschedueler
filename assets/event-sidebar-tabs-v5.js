/* Single owner of editor tabs; all original controls remain mounted. */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
const names=['game','series','memo'];
const ids={game:['eventGameTabV7','eventGamePaneV7'],series:['eventSeriesTabV5','eventSeriesPaneV5'],memo:['eventMemoTabV5','eventMemoPaneV5']};
let current='game';
function select(mode,focus=false){
 current=names.includes(mode)?mode:'game';
 for(const name of names){
  const [btn,pane]=ids[name].map($),active=name===current;
  if(btn){btn.classList.toggle('active',active);btn.setAttribute('aria-selected',String(active));btn.tabIndex=active?0:-1}
  if(pane){pane.hidden=!active;pane.classList.toggle('active',active)}
 }
 if(focus)$(ids[current][0])?.focus();
}
function reset(){select('game');$('eventModal')?.querySelectorAll('details.event-fold-v7').forEach(el=>el.open=false)}
function init(){
 const modal=$('eventModal');
 if(!modal||modal.dataset.editorTabsReady)return;
 modal.dataset.editorTabsReady='1';
 for(const name of names){
  const btn=$(ids[name][0]);if(!btn)continue;
  btn.addEventListener('click',()=>select(name));
  btn.addEventListener('keydown',e=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
   e.preventDefault();const i=names.indexOf(name);
   select(e.key==='Home'?names[0]:e.key==='End'?names.at(-1):names[(i+(e.key==='ArrowRight'?1:-1)+names.length)%names.length],true);
  });
 }
 const prior=new Map();
 function lockBackground(){
  const open=modal.classList.contains('open');
  for(const el of document.querySelectorAll('.app,#mwsAccessTools')){
   if(open&&!prior.has(el)){prior.set(el,el.inert);el.inert=true}
   else if(!open&&prior.has(el)){el.inert=prior.get(el);prior.delete(el)}
  }
 }
 new MutationObserver(lockBackground).observe(modal,{attributes:true,attributeFilter:['class']});
 lockBackground();reset();
}
root.mwsEventSidebarTabsV5=Object.freeze({init,select,reset,current:()=>current});
root.mwsEventEditorLayoutV6=root.mwsEventSidebarTabsV5;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
