/* Reveal the real event list above the fixed month grid. No cloned events,
   calendar render, or changes to the row tracks or persisted data. */
(()=>{
  const grid=document.getElementById('calendarGrid'),section=document.getElementById('calendar');
  if(!grid||!section)return;
  const desktop=matchMedia('(min-width:901px) and (hover:hover) and (pointer:fine)');
  let open=null,press=null;
  const enabled=()=>desktop.matches&&section.classList.contains('active')&&document.body.dataset.deviceMode!=='mobile'&&document.body.dataset.resolution!=='mobile'&&(!section.dataset.calendarViewMode||section.dataset.calendarViewMode==='month')&&!document.body.matches('.mws-calendar-event-pointer-active-v174,.calendar-template-dragging,.calendar-pointer-template-dragging,.calendar-copy-source-dragging')&&!section.classList.contains('calendar-group-select-active-v2');
  const reduced=()=>window.mwsMotionReduced?.()??matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hit=target=>target instanceof Element?target.closest('.day[data-date]'):null;
  const clip=(amount,up)=>up?`inset(${amount}px 0 0 0)`:`inset(0 0 ${amount}px 0)`;
  function cleanup(state){
    state.motion?.cancel();state.day.classList.remove('mws-day-expand-v1');
    state.list.classList.remove('mws-day-list-expand-v1');
    for(const key of ['--mws-day-list-top','--mws-day-list-left','--mws-day-list-width','--mws-day-list-height','--mws-day-list-bg'])state.list.style.removeProperty(key);
    if(open===state)open=null;
  }
  function close(immediate=false){
    const s=open;if(!s)return;
    if(immediate||reduced()||!s.list.animate||!s.day.isConnected){cleanup(s);return}
    if(s.closing)return;s.closing=true;
    const from=getComputedStyle(s.list).clipPath;s.motion?.cancel();
    s.motion=s.list.animate([{clipPath:from==='none'?clip(0,s.up):from},{clipPath:clip(s.extra,s.up)}],{duration:110,easing:'ease-in',fill:'both'});
    s.motion.finished.then(()=>{if(open===s&&s.closing)cleanup(s)},()=>{});
  }
  function expand(day){
    if(!day||!grid.contains(day)||!enabled())return;
    if(open?.day===day&&!open.closing)return;
    if(open)close(true);
    const list=day.querySelector('.calendar-day-events-v2');if(!list||list.querySelectorAll('.mini-event[data-evid]').length<2)return;
    const base=list.getBoundingClientRect(),cell=day.getBoundingClientRect();
    const scrollExtra=list.scrollHeight-list.clientHeight;
    if(base.height<=0||scrollExtra<=2)return;
    // Normal days expand downward. At the viewport's bottom, reveal upward
    // if that is the only way to show more; extremely long lists remain scrollable.
    const below=Math.max(0,innerHeight-12-base.bottom),above=Math.max(0,base.top-12);
    const up=below<Math.min(scrollExtra,58)&&above>below;
    const extra=Math.min(scrollExtra+3,up?above:below);
    if(extra<=2)return;
    const state={day,list,extra,up,closing:false,motion:null};
    open=state;
    list.style.setProperty('--mws-day-list-top',(base.top-cell.top-day.clientTop-(up?extra:0))+'px');
    list.style.setProperty('--mws-day-list-left',(base.left-cell.left-day.clientLeft)+'px');
    list.style.setProperty('--mws-day-list-width',base.width+'px');
    list.style.setProperty('--mws-day-list-height',(base.height+extra)+'px');
    list.style.setProperty('--mws-day-list-bg',getComputedStyle(day).backgroundColor);
    day.classList.add('mws-day-expand-v1');list.classList.add('mws-day-list-expand-v1');
    if(!reduced()&&list.animate){
      state.motion=list.animate([{clipPath:clip(extra,up)},{clipPath:clip(0,up)}],{duration:160,easing:'cubic-bezier(.2,.75,.25,1)',fill:'both'});
      state.motion.finished.then(()=>{if(open===state&&!state.closing){state.motion?.cancel();state.motion=null}},()=>{});
    }
  }
  grid.addEventListener('pointerover',event=>{
    if(event.pointerType!=='mouse'||event.buttons)return;
    const day=hit(event.target);if(day&&!day.contains(event.relatedTarget))expand(day);
  });
  grid.addEventListener('pointerout',event=>{
    if(event.pointerType!=='mouse'||!open||!open.day.contains(event.target)||open.day.contains(event.relatedTarget))return;
    close(!!event.buttons);
  });
  grid.addEventListener('pointerdown',event=>{if(open&&event.button===0)press={x:event.clientX,y:event.clientY}});
  // Clear the overlay before the existing drag hit-test runs, so the date
  // underneath the expanded list is a normal drop target.
  grid.addEventListener('pointermove',event=>{if(open&&press&&event.buttons&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>5)close(true)},true);
  window.addEventListener('pointerup',()=>{press=null},{passive:true});
  window.addEventListener('pointercancel',()=>{press=null;close(true)},{passive:true});
  grid.addEventListener('dragstart',()=>close(true),true);
  grid.addEventListener('focusin',event=>{if(event.target.matches(':focus-visible'))expand(hit(event.target))});
  grid.addEventListener('focusout',event=>{if(open&&!open.day.contains(event.relatedTarget))close()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close(true)});
  window.addEventListener('resize',()=>close(true),{passive:true});
  window.addEventListener('blur',()=>close(true));
  desktop.addEventListener?.('change',()=>close(true));
  new MutationObserver(()=>{if(open&&!open.day.isConnected)cleanup(open)}).observe(grid,{childList:true});
  new MutationObserver(()=>{if(open&&!enabled())close(true)}).observe(section,{attributes:true,attributeFilter:['class','data-calendar-view-mode']});
})();
