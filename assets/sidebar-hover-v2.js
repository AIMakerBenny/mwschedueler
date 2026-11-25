/* Desktop rail: stable coordinate-based expansion, never geometry-driven CSS hover. */
(()=>{
 const side=document.querySelector('.app>.sidebar');if(!side)return;
 const cls='mws-sidebar-expanded-v2',media=matchMedia('(min-width:761px)');
 let timer=0,inside=false,last=null;
 const enabled=()=>media.matches&&document.body.dataset.resolution!=='mobile'&&document.body.dataset.deviceMode!=='mobile'&&!document.body.classList.contains('sidebar-pinned');
 function set(open){clearTimeout(timer);timer=0;if(side.classList.contains(cls)!==open)side.classList.toggle(cls,open)}
 function track(e){
  if(e.pointerType&&e.pointerType!=='mouse'&&e.pointerType!=='pen')return;
  last={x:e.clientX,y:e.clientY};
  if(!enabled()){inside=false;set(false);return}
  const rect=side.getBoundingClientRect(),scale=side.offsetWidth?rect.width/side.offsetWidth:1;
  const expanded=side.classList.contains(cls);
  const right=expanded?Math.max(rect.right,rect.left+Number(side.dataset.mwsExpandedWidthV2||220)*scale):rect.left+72*scale;
  inside=e.clientX>=0&&e.clientX<=right+(expanded?6:0)&&e.clientY>=0&&e.clientY<innerHeight;
  if(inside){if(!expanded){const width=getComputedStyle(side).getPropertyValue('--mws-sidebar-expanded-width-v2');side.dataset.mwsExpandedWidthV2=String(parseFloat(width)||220)}set(true)}
  else if(expanded&&!timer)timer=setTimeout(()=>{timer=0;if(!inside)set(false)},120);
 }
 function reset(){inside=false;last=null;set(false)}
 document.addEventListener('pointermove',track,{passive:true,capture:true});
 document.documentElement.addEventListener('pointerleave',reset);
 window.addEventListener('blur',reset);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')reset()});
 side.addEventListener('focusin',()=>{if(enabled()){set(true);inside=true}});
 side.addEventListener('focusout',()=>{if(enabled()&&!side.contains(document.activeElement)&&last)track({clientX:last.x,clientY:last.y})});
 media.addEventListener('change',reset);
 new MutationObserver(()=>{if(!enabled())reset()}).observe(document.body,{attributes:true,attributeFilter:['class','data-resolution','data-device-mode']});
})();
