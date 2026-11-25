(() => {
  'use strict';
  if(window.__mwsAnnouncementCarouselV1)return;
  window.__mwsAnnouncementCarouselV1=true;
  const announcements=[
    {src:'assets/announcements/20261126-bis.webp',title:'마 왕 검은 남작의 단망토 획득 및 BiS 전체 수집 완료',width:1401,height:1123},
    {src:'assets/announcements/20261121-mount.webp',title:'마 왕 첫 스트리머 천골마 획득 성공'},
    {src:'assets/announcements/20261121-expedition.webp',title:'성검 원정대 달렌드의 성검 획득 성공'},
    {src:'assets/announcements/20261121-warrior.webp',title:'같이와포하자 길드 최초 만렙 분노 전사 마 왕'},
  ];
  const storageKey='mws.announcements.hiddenDay.v1';
  const dayKST=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const hiddenToday=()=>{try{return localStorage.getItem(storageKey)===dayKST()}catch(_){return false}};
  const svg=path=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
  let shown=false,gateObserver=null;

  function openAnnouncements(){
    if(shown||hiddenToday()||!announcements.length){gateObserver?.disconnect();return}
    if(document.body.classList.contains('mws-gated')||document.body.classList.contains('mws-app-loading')||!document.body.dataset.mwsMode)return;
    gateObserver?.disconnect();
    shown=true;
    const dialog=document.createElement('dialog');
    dialog.id='mwsAnnouncementDialog';
    dialog.setAttribute('aria-labelledby','mwsNoticeHeadingV1');
    dialog.innerHTML=`
      <h2 id="mwsNoticeHeadingV1" class="mws-notice-sr">마왕 스케줄러 공지사항</h2>
      <div class="mws-notice-stage">
        <div class="mws-notice-viewport" aria-label="공지 이미지, 좌우로 드래그하여 이동" tabindex="0">
          <div class="mws-notice-track"></div>
        </div>
        <button type="button" class="mws-notice-x" data-notice-close aria-label="공지 닫기">${svg('M6 6l12 12M18 6 6 18')}</button>
        <button type="button" class="mws-notice-arrow mws-notice-prev" aria-label="이전 공지">${svg('m15 6-6 6 6 6')}</button>
        <button type="button" class="mws-notice-arrow mws-notice-next" aria-label="다음 공지">${svg('m9 6 6 6-6 6')}</button>
      </div>
      <div class="mws-notice-footer">
        <button type="button" class="mws-notice-today">오늘 하루 보지 않기</button>
        <div class="mws-notice-pagination" role="group" aria-label="공지 선택"></div>
        <button type="button" class="mws-notice-close" data-notice-close autofocus>닫기</button>
      </div>
      <span class="mws-notice-sr" role="status" aria-live="polite"></span>`;
    const $=selector=>dialog.querySelector(selector);
    const viewport=$('.mws-notice-viewport'),track=$('.mws-notice-track'),pagination=$('.mws-notice-pagination'),prev=$('.mws-notice-prev'),next=$('.mws-notice-next');
    const slides=[],dots=[];
    let index=0,drag=null;
    for(const [i,notice] of announcements.entries()){
      const slide=document.createElement('figure');slide.className='mws-notice-slide';
      const img=document.createElement('img');img.src=notice.src;img.alt=notice.title;img.width=notice.width||1448;img.height=notice.height||1086;
      img.draggable=false;img.decoding='async';img.fetchPriority=i===0?'high':'low';slide.append(img);track.append(slide);slides.push(slide);
      const dot=document.createElement('button');dot.type='button';dot.className='mws-notice-dot';dot.setAttribute('aria-label',`${i+1}번 공지: ${notice.title}`);
      dot.addEventListener('click',()=>go(i));pagination.append(dot);dots.push(dot);
    }
    function paint(offset=0){track.style.transform=`translate3d(calc(-${index*100}% + ${offset}px),0,0)`}
    function go(to){
      index=Math.max(0,Math.min(slides.length-1,to));paint();
      prev.disabled=index===0;next.disabled=index===slides.length-1;
      slides.forEach((slide,i)=>slide.setAttribute('aria-hidden',String(i!==index)));
      dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===index)));
      $('[role="status"]').textContent=`${index+1} / ${slides.length} · ${announcements[index].title}`;
      dialog.dataset.noticeIndex=String(index);
    }
    function finishDrag(event,commit){
      if(!drag||event.pointerId!==drag.id)return;
      const delta=drag.dx,width=viewport.clientWidth,elapsed=performance.now()-drag.start;
      const distance=Math.min(96,width*.14),quick=Math.abs(delta)>24&&elapsed<240;
      drag=null;delete viewport.dataset.dragging;
      if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);
      go(commit&&(Math.abs(delta)>distance||quick)?index+(delta<0?1:-1):index);
    }
    viewport.addEventListener('pointerdown',event=>{
      if(!event.isPrimary||event.button!==0||drag)return;
      drag={id:event.pointerId,x:event.clientX,dx:0,start:performance.now()};
      viewport.dataset.dragging='true';viewport.setPointerCapture(event.pointerId);
    });
    viewport.addEventListener('pointermove',event=>{
      if(!drag||drag.id!==event.pointerId)return;
      const delta=event.clientX-drag.x,max=viewport.clientWidth;
      drag.dx=Math.max(-max,Math.min(max,delta));
      const atEdge=(index===0&&delta>0)||(index===slides.length-1&&delta<0);
      paint(drag.dx*(atEdge ? .22 : 1));
    });
    viewport.addEventListener('pointerup',event=>finishDrag(event,true));
    viewport.addEventListener('pointercancel',event=>finishDrag(event,false));
    viewport.addEventListener('lostpointercapture',event=>finishDrag(event,false));
    viewport.addEventListener('dragstart',event=>event.preventDefault());
    prev.addEventListener('click',()=>go(index-1));next.addEventListener('click',()=>go(index+1));
    dialog.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dialog.close()}
      else if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();event.stopPropagation();go(index+(event.key==='ArrowRight'?1:-1))}
    });
    dialog.querySelectorAll('[data-notice-close]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
    $('.mws-notice-today').addEventListener('click',()=>{
      try{localStorage.setItem(storageKey,dayKST())}catch(_){}
      dialog.close();
    });
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});
    document.body.append(dialog);go(0);dialog.showModal();
  }
  // The deployed Worker may dispatch app-ready before releasing the gate.
  // Observe only the gate attributes until the first successful display.
  if(!hiddenToday()){
    gateObserver=new MutationObserver(openAnnouncements);
    gateObserver.observe(document.body,{attributes:true,attributeFilter:['class','data-mws-mode']});
  }
  window.addEventListener('mws:app-ready',openAnnouncements,{once:true});
  openAnnouncements();
})();
