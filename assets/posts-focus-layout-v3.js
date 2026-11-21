/* Native disclosures: one open at a time, keyboard accessible, no per-card listeners. */
(function(){
  const section=document.getElementById('posts');
  if(!section||section.dataset.focusMenusV3)return;
  section.dataset.focusMenusV3='1';
  const menus=()=>section.querySelectorAll('details.post-menu[open]');
  function closeOthers(except){for(const menu of menus())if(menu!==except)menu.open=false;}
  function fit(menu){
    const panel=menu.querySelector(':scope > .post-menu-panel');
    if(!panel)return;
    panel.style.left='';panel.style.right='';
    const box=panel.getBoundingClientRect(),width=document.documentElement.clientWidth;
    const dx=box.left<8?8-box.left:box.right>width-8?width-8-box.right:0;
    // Keep the panel in the visible page width, including narrow mobile columns.
    if(dx&&panel.offsetParent){const parent=panel.offsetParent;panel.style.left=`${Math.round(box.left-parent.getBoundingClientRect().left-parent.clientLeft+parent.scrollLeft+dx)}px`;panel.style.right='auto';}
  }
  section.addEventListener('toggle',event=>{
    const menu=event.target;
    if(!menu.matches?.('details.post-menu')||!menu.open)return;
    closeOthers(menu);fit(menu);
  },true);
  document.addEventListener('click',event=>{
    const menu=event.target.closest?.('#posts details.post-menu');
    closeOthers(menu);
    const button=event.target.closest?.('#posts .post-action-panel button');
    if(button&&menu&&!button.disabled){menu.open=false;menu.querySelector('summary')?.focus({preventScroll:true});}
  });
  // Run before the workspace's legacy Escape handlers when this menu is open.
  window.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||!section.classList.contains('active'))return;
    const menu=section.querySelector('details.post-menu[open]');
    if(!menu)return;
    menu.open=false;menu.querySelector('summary')?.focus({preventScroll:true});
    event.preventDefault();event.stopPropagation();
  },true);
  window.addEventListener('resize',()=>{for(const menu of menus())fit(menu)},{passive:true});
})();
