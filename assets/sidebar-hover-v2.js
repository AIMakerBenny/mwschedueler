/* Desktop rail: stable coordinate-based expansion, never geometry-driven CSS hover. */
(()=>{
 const side=document.querySelector('.app>.sidebar');if(!side)return;
 const cls='mws-sidebar-expanded-v2',media=matchMedia('(min-width:761px)');
 let timer=0,inside=false,last=null,geometry=null;
 const measure=()=>{const r=side.getBoundingClientRect(),scale=side.offsetWidth?r.width/side.offsetWidth:1,style=getComputedStyle(side);return {left:r.left,closed:(parseFloat(style.getPropertyValue('--mws-sidebar-rail-width-v2'))||72)*scale,open:(parseFloat(style.getPropertyValue('--mws-sidebar-expanded-width-v2'))||220)*scale,slop:6*scale}};
 const enabled=()=>media.matches&&document.body.dataset.resolution!=='mobile'&&document.body.dataset.deviceMode!=='mobile'&&!document.body.classList.contains('sidebar-pinned');
 function set(open){clearTimeout(timer);timer=0;if(side.classList.contains(cls)!==open)side.classList.toggle(cls,open)}
 function track(e){
  if(e.pointerType&&e.pointerType!=='mouse'&&e.pointerType!=='pen')return;
  last={x:e.clientX,y:e.clientY};
  if(!enabled()){inside=false;set(false);return}
  const expanded=side.classList.contains(cls);
  // Animated width is never the entry boundary. Cache measurements between
  // environment changes instead of forcing layout on every pointer move.
  if(!geometry)geometry=measure();
  const right=geometry.left+(expanded?geometry.open+geometry.slop:geometry.closed);
  inside=e.clientX>=geometry.left&&e.clientX<=right&&e.clientY>=0&&e.clientY<innerHeight;
  if(inside){set(true)}
  else if(expanded&&!timer)timer=setTimeout(()=>{timer=0;if(!inside)set(false)},120);
 }
 function reset(){inside=false;last=null;set(false)}
 document.addEventListener('pointermove',track,{passive:true,capture:true});
 document.documentElement.addEventListener('pointerleave',reset);
 window.addEventListener('blur',reset);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')reset()});
 side.addEventListener('focusin',()=>{if(enabled()&&!side.classList.contains(cls)){set(true);inside=true}});
 side.addEventListener('focusout',e=>{if(!enabled()||side.contains(e.relatedTarget))return;if(last)track({clientX:last.x,clientY:last.y});else reset()});
 const invalidate=()=>{geometry=null;};
 window.addEventListener('resize',invalidate,{passive:true});
 media.addEventListener('change',()=>{invalidate();reset()});
 let signature='';
 new MutationObserver(()=>{const next=[enabled(),document.body.dataset.resolution,document.body.dataset.deviceMode,document.body.style.zoom].join('|');if(next!==signature){signature=next;invalidate()}if(!enabled())reset()}).observe(document.body,{attributes:true,attributeFilter:['class','data-resolution','data-device-mode','style']});
})();
