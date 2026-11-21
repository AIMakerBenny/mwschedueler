(() => {
  const section = document.getElementById('careerTimeline');
  const source = section?.querySelector('.career-tree');
  if (!source) return;
  let controller;
  const activation = () => {
    if (section.classList.contains('active')) {
      if (!controller) controller = mount();
      else controller.resize();
    } else controller?.suspend();
  };
  new MutationObserver(activation).observe(section,{attributes:true,attributeFilter:['class']});
  activation();

  function mount() {
    const aliases = [
      [/릴동파/, '릴파 버츄얼 동계 스포츠 대회'],
      [/WBD/, '왁야대 VR챗 왁타버스 야구 대회 왁타버스야구'],
      [/왁타버스 체육대회/, '왁체대'], [/버츄얼 육상/, '버육대'],
      [/버츄얼 파이터|버복대/, '버복대 버츄얼 파이터'],
      [/릴파 버추얼 복싱/, '릴복대'], [/상황극 콘테스트/, '상컨'],
      [/와우 포에버/, 'WOW 월드 오브 워크래프트 와포'],
      [/배그/, 'PUBG 배틀그라운드'], [/배틀크러쉬/, '배틀크러시'],
      [/파블로프/, 'Pavlov'], [/레귤러원/, 'Regular One'],
      [/재활센터|브산동/, '센터장']
    ];
    // Display-only editorial labels. The source dates, facts and tags stay in index.html.
    const presentation = {
      '그란투리스모 7':['데이토나 개인 1위','와크-무런 · 4강 데이토나 코스','그란투리스모 7 개인 1위'],
      '신호등':['총감독 · 몸연기','아이네 뮤직비디오','신호등 총감독'],
      '제8회 상황극 콘테스트':['현수 역 몸연기','낙화','낙화 몸연기'],
      '에고시의 검':['몸연기','단편영화 콘테스트','에고시의 검 몸연기'],
      '그냥 살아!':['팀 감독','고멤가요제 · 김피탕&짬뽕','그냥 살아! 감독'],
      '제9회 상황극 콘테스트':['두 작품 몸연기','실종 · 신형식 역 / PUNK: Shutdown · 레브 역','실종 · PUNK 몸연기'],
      '버츄얼 파이터':['대표 출전','한일 이벤트 매치','버츄얼 파이터 대표 출전'],
      '왁타버스 배그 대잔치':['듀오 라운드 우승','마다옴과 듀오','배그 대잔치 라운드 우승'],
      'VR챗 축구 대전':['팀 준우승','별 부수는 마단 · 팀장','VR챗 축구 준우승'],
      '왁타버스 래프팅 대회':['대회 참가','마피아지 팀','래프팅 대회 참가'],
      '왁타버스 사이클 대회':['선수 참가','VR 멀미 극복 투어 진행','사이클 대회 참가'],
      '왁타버스 배그 삼국지':['개인 종합 3위','','배그 삼국지 개인 3위'],
      '나만 아니면 돼':['암벽등반 대결 1위','','나만 아니면 돼 1위'],
      '왁타버스 배틀크러쉬':['팀 종합 우승','현지인즈','배틀크러쉬 팀 종합 우승','최초 하드캐리 상 · 최다 하드캐리 상'],
      'VRChat 촉각슈트 동아리':['교관','주르르 주최 모임','촉각슈트 동아리 교관'],
      '왁타버스 체육대회':['팀 종합 우승','버스터콜','왁체대 종합 우승','개인 공동 1위 · 권총 사격·조정 금메달'],
      '2024 마왕 재활센터':['정기 VR 운동 콘텐츠 시작','','마왕 재활센터 운영 시작'],
      '왁타버스 배그 티어게임':['한 라운드 우승','제2회 대회','배그 티어게임 라운드 우승'],
      '왁이큐':['대회 참가','사형선고 팀','왁이큐 참가'],
      '제1회 버츄페 어워드':['올해의 섹시상 공동 수상','VRChat 버추얼 연말 페스티벌','버츄페 섹시상 공동 수상'],
      '2024 SOOP 스트리머 대상':['수상자 인터뷰','','SOOP 대상 수상자 인터뷰','세부 상명 미확인'],
      '제1회 릴동파':['팀 종합 우승','죠뗌므','릴동파 종합 우승','개인 공동 1위 · 금 2·은 1 · 본선 최다 진출상·개인 메달 1위상'],
      'WBD 왁타버스 야구 대회':['4강','로얄 버팔로즈 · 선발투수','WBD 4강'],
      '제6회 처니랜드 소대전투':['HONOR 진영 승리','배틀그라운드 · 저격병 참가','처니랜드 HONOR 승리'],
      '마인크래프트 지독서버':['다이아몬드 채집 3위','','지독서버 채집 3위'],
      'VR 비키니 비치발리볼 대회':['팀 우승','마다옴·예다·양도끼','VR 비치발리볼 팀 우승'],
      '2025 마왕 재활센터':['VRChat 전용 맵 개장','','재활센터 전용 맵 개장'],
      '버츄얼 육상 선수권 대회':['은메달 2 · 동메달 1','악성코드 팀','버육대 메달 3개'],
      '지육대':['팀 코치','털즈란','지육대 코치'],
      '아르마 3 랜덤 가챠 고지전':['퍼스트 킬 상 수상','한결을 잡아 수상','아르마 3 퍼스트 킬 상'],
      '릴파 버추얼 복싱 대회':['우승팀 코치','천양 팀','릴복대 우승팀 코치'],
      '2025 SOOP 스트리머 대상':['올해의 스트리머 수상','','SOOP 올해의 스트리머'],
      '천타버스 대 털즈란 VR 야구전':['팀 코치','털즈란','VR 야구전 털즈란 코치'],
      '레귤러원 F1 시즌 2':['팀 종합 우승','킥자우버','레귤러원 팀 우승','개인 4위'],
      '제2회 릴동파':['봅슬레이 은메달','꼭따라이 팀 · 2월 - 3월','릴동파 2 봅슬레이 은메달'],
      '파블로프 VR 대전쟁':['대회 주최','','파블로프 VR 대전쟁 주최'],
      '릴동파 배그 대회':['스쿼드 1라운드 우승','','릴동파 배그 라운드 우승'],
      '제3회 버종리 VR 겟투워크':['대회 1위','','버종리 VR 겟투워크 1위'],
      '브산동':['VR산책 동아리 운영','재활센터 개편','브산동 운영'],
      '이터널 리턴 「이리야 어서와」':['MVP','코렛트 선정','이터널 리턴 MVP'],
      'STALZONE 크루대전':['팀 준우승','환승센터','STALZONE 팀 준우승'],
      '제2회 파블로프 VR 대전쟁':['대회 주최','','파블로프 VR 대전쟁 2 주최'],
      'SBO 야구 대회':['대회 참가','무파 자이언츠','SBO 야구 대회 참가'],
      '와우 포에버':['전사 1위','','와우 포에버 전사 1위','방송 제목에 기록 · 집계 기준 미확인']
    };
    const evidence = {
      '제1회 버츄페 어워드':'https://pick.sooplive.com/daily/view/161255',
      '제6회 처니랜드 소대전투':'https://pick.sooplive.com/daily/view/173654'
    };
    const norm = s => s.normalize('NFKC').toLowerCase().replace(/\s+/g,'');
    const rows = [];
    for (const group of source.querySelectorAll('.career-year')) {
      const year = group.querySelector('summary').textContent.replace('년','');
      for (const month of group.querySelectorAll('.career-month')) {
        for (const li of month.querySelectorAll('li')) {
          const name = li.querySelector('strong').textContent;
          const info = li.querySelector('p').textContent;
          const tags = [...li.querySelectorAll('.career-tags span')].map(el=>el.textContent);
          const date = month.querySelector('h3').textContent;
          const [headline, context, caption, extra] = presentation[year+' '+name] || presentation[name] || [name,'',name,info];
          const synonyms = aliases.filter(([re])=>re.test(name)).map(([,alias])=>alias);
          rows.push({id:rows.length,year,date,month:parseInt(date),name,info,tags,headline,context,caption,extra,
            terms:norm([year,date,name,info,headline,caption,...synonyms].join(' '))});
        }
      }
    }
    const years = [...new Set(rows.map(r=>r.year))];
    const dated = rows.filter(r=>Number.isFinite(r.month));
    const byYear = y=>rows.filter(r=>r.year===y);
    let selected = dated.at(-1), shown = selected, searchOrigin = null, resultsOpen = false;
    let playing = false, paused = false, remaining = 0, lastTime = 0, raf = 0, motion = null, offset = 0;
    let builtYear = '', drag = null, introUntil = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 700px)');
    const node = (tag, cls, value) => {
      const el = document.createElement(tag);
      if (cls) el.className = cls;
      if (value != null) el.textContent = value;
      return el;
    };
    const button = (cls,label,action) => {
      const b=node('button',cls,label); b.type='button'; b.onclick=action; return b;
    };
    const panel=node('div','cv-panel');
    const bar=node('div','cv-bar'), nav=node('nav','cv-years');
    nav.setAttribute('aria-label','타임라인 연도');
    const searchBox=node('div','cv-searchbox'), query=node('input','cv-search');
    query.type='search'; query.placeholder='전체 기록 검색'; query.setAttribute('aria-label','전체 타임라인 검색');
    const resultsButton=button('cv-result-toggle','검색 결과',()=>{ stop(); resultsOpen=true; renderResults(); });
    resultsButton.hidden=true;
    searchBox.append(query,resultsButton);
    const controls=node('div','cv-controls');
    const prev=button('cv-control','이전',()=>step(-1));
    const play=button('cv-control cv-play','재생',togglePlay);
    const next=button('cv-control','다음',()=>step(1));
    const count=node('span','cv-count');
    controls.append(prev,play,next,count);
    bar.append(nav,searchBox,controls);
    const stage=node('div','cv-stage');
    const hero=node('article','cv-hero');
    hero.setAttribute('aria-live','polite');
    const heroDate=node('div','cv-hero-date'), heroTitle=node('h2','cv-hero-title');
    const heroContext=node('p','cv-hero-context'), heroExtra=node('p','cv-hero-extra');
    const facts=node('div','cv-facts'), detail=node('details','cv-details');
    detail.append(node('summary','','기록 상세'));
    const detailBody=node('div','cv-detail-body'); detail.append(detailBody);
    facts.append(detail);
    hero.append(heroDate,heroTitle,heroContext,heroExtra,facts);
    const viewport=node('div','cv-viewport'); viewport.tabIndex=0;
    viewport.setAttribute('role','region'); viewport.setAttribute('aria-label','월별 기록 탐색');
    const axis=node('div','cv-axis'); viewport.append(axis);
    const annual=node('div','cv-annual');
    const annualLabel=node('span','cv-annual-label');
    const months=node('div','cv-minimap');
    const progress=node('div','cv-progress'); progress.append(node('i'));
    annual.append(annualLabel,months,progress);
    stage.append(hero,viewport,annual);
    const results=node('div','cv-results'); results.hidden=true;
    panel.append(bar,stage,results); section.append(panel); source.hidden=true;

    const yearButtons = new Map(), monthElements = new Map(), miniButtons = new Map(), recordButtons = new Map();
    for (const y of years) {
      const b=button('',y,()=>{ clearSearch(false); choose(byYear(y)[0]); });
      nav.append(b); yearButtons.set(y,b);
    }
    function dateLabel(r){return r.year==='레거시'?'레거시 · 시기 미확인':r.year+'년 '+r.date;}
    function heroRender(r) {
      shown=r;
      heroDate.textContent=dateLabel(r);
      heroTitle.textContent=r.headline;
      heroContext.textContent=[r.name,r.context].filter(Boolean).join(' · ');
      heroExtra.textContent=r.extra||'';
      heroExtra.hidden=!r.extra;
      detail.open=false;
      detailBody.replaceChildren(node('p','',r.info),node('small','',r.tags.join(' · ')));
      if(evidence[r.name]){
        const a=node('a','cv-source','분류 근거'); a.href=evidence[r.name]; a.target='_blank'; a.rel='noopener noreferrer'; detailBody.append(a);
      }
      hero.dataset.record=String(r.id);
      for(const [id,b] of recordButtons) b.setAttribute('aria-current',String(id===r.id));
    }
    function updateControls(){
      const list=byYear(selected.year), index=list.indexOf(selected);
      prev.disabled=index===0; next.disabled=index===list.length-1;
      play.disabled=selected.year==='레거시'||resultsOpen;
      play.textContent=playing?'일시정지':'재생';
      play.setAttribute('aria-pressed',String(playing));
      count.textContent=(index+1)+' / '+list.length;
      panel.classList.toggle('cv-playing',playing);
      for(const [y,b] of yearButtons) b.setAttribute('aria-pressed',String(selected.year===y));
    }
    function record(r,action=()=>choose(r)){
      const b=button('cv-record',r.caption,action);
      b.dataset.record=String(r.id);
      b.setAttribute('aria-current',String(r===shown));
      return b;
    }
    function build(y){
      builtYear=y; axis.replaceChildren(); months.replaceChildren();
      monthElements.clear(); miniButtons.clear(); recordButtons.clear();
      const legacy=y==='레거시';
      viewport.classList.toggle('cv-legacy',legacy); annual.hidden=legacy;
      if(legacy){
        const col=node('div','cv-month cv-legacy-month');
        col.append(node('div','cv-tick','시기 미확인'));
        const branch=node('div','cv-branch');
        for(const r of byYear(y)){const b=record(r); recordButtons.set(r.id,b); branch.append(b);}
        col.append(branch); axis.append(col); return;
      }
      annualLabel.textContent=y+'년';
      for(let m=1;m<=12;m++){
        const list=byYear(y).filter(r=>r.month===m);
        const col=node('div','cv-month'+(list.length?'':' cv-empty'));
        col.dataset.month=String(m);
        const tick=button('cv-tick',m+'월',()=>{if(list.length) choose(list[0]);});
        tick.disabled=!list.length; col.append(tick);
        if(list.length){
          const branch=node('div','cv-branch');
          list.forEach((r,i)=>{
            const b=record(r); b.style.setProperty('--order',i); recordButtons.set(r.id,b); branch.append(b);
          });
          col.append(branch);
        }
        axis.append(col); monthElements.set(m,col);
        const mini=button('cv-mini',String(m),()=>{if(list.length) choose(list[0]);});
        mini.disabled=!list.length; mini.setAttribute('aria-label',y+'년 '+m+'월'+(list.length?' '+list.length+'건':' 기록 없음'));
        months.append(mini); miniButtons.set(m,mini);
      }
    }
    function focusMonth(r){
      const activeMonths=[...monthElements.keys()].filter(m=>!monthElements.get(m).classList.contains('cv-empty'));
      const idx=activeMonths.indexOf(r.month);
      for(const [m,col] of monthElements){
        col.classList.toggle('cv-active-month',m===r.month);
        col.classList.toggle('cv-near',Math.abs(activeMonths.indexOf(m)-idx)<=1&&!col.classList.contains('cv-empty'));
      }
      for(const [m,b] of miniButtons) b.setAttribute('aria-current',String(m===r.month));
    }
    function targetOffset(r){
      const col=monthElements.get(r.month);
      return mobile.matches||!col?0:viewport.clientWidth/2-col.offsetLeft-col.offsetWidth/2;
    }
    function setOffset(x){offset=x;axis.style.transform=mobile.matches||builtYear==='레거시'?'none':'translate3d('+x+'px,0,0)';}
    function clearBranch(){
      for(const col of monthElements.values()){
        col.style.removeProperty('--branch'); col.style.removeProperty('--reveal'); col.classList.remove('cv-arriving');
      }
    }
    function drawMotion(t){
      const m=motion; if(!m)return;
      const travel=m.travel, branch=m.branch;
      const fraction=travel?Math.min(1,t/travel):1;
      setOffset(m.from+(m.to-m.from)*(1-Math.pow(1-fraction,3)));
      if(t<travel)return;
      if(!m.arrived){
        m.arrived=true; focusMonth(selected); heroRender(selected);
        hero.classList.add('cv-hero-enter');
      }
      const col=monthElements.get(selected.month);
      if(col&&m.reveal){
        col.classList.add('cv-arriving');
        col.style.setProperty('--branch',Math.min(1,(t-travel)/260));
        col.style.setProperty('--reveal',Math.max(0,(t-travel-200)/80));
      }
      hero.style.setProperty('--hero-in',Math.min(1,(t-travel)/240));
      if(t>=travel+branch){
        motion=null; clearBranch(); hero.classList.remove('cv-hero-enter'); hero.style.removeProperty('--hero-in');
        remaining=dwell(selected);
      }
    }
    function dwell(r){return Math.min(6800,Math.max(3100,2600+(r.info.length+r.name.length)*42));}
    function schedule(){if(!raf&&!document.hidden&&section.classList.contains('active'))raf=requestAnimationFrame(tick);}
    function tick(now){
      raf=0;
      const delta=lastTime?Math.min(80,now-lastTime):0; lastTime=now;
      if(introUntil){
        if(now>=introUntil){introUntil=0; panel.classList.remove('cv-intro'); move(selected,true);}
        else schedule();
        return;
      }
      if(paused)return;
      if(motion){
        motion.elapsed+=delta; drawMotion(motion.elapsed);
      }else if(playing){
        remaining-=delta;
        const p=progress.firstElementChild; p.style.transform='scaleX('+Math.min(1,Math.max(0,1-remaining/dwell(selected)))+')';
        if(remaining<=0){
          const list=byYear(selected.year), index=list.indexOf(selected);
          if(index===list.length-1){playing=false;updateControls();}
          else move(list[index+1],true);
        }
      }
      if(motion||playing)schedule(); else lastTime=0;
    }
    function settle(){
      if(raf)cancelAnimationFrame(raf); raf=0; lastTime=0; introUntil=0;
      panel.classList.remove('cv-intro'); motion=null; clearBranch(); hero.classList.remove('cv-hero-enter'); hero.style.removeProperty('--hero-in');
      focusMonth(selected); heroRender(selected); setOffset(targetOffset(selected));
      remaining=dwell(selected); progress.firstElementChild.style.transform='scaleX(0)';
    }
    function stop(){
      playing=false;paused=false;settle();updateControls();
    }
    function move(r,animate){
      const same=builtYear===r.year&&shown.month===r.month;
      const changed=builtYear!==r.year;
      selected=r; clearBranch();
      if(changed){build(r.year);setOffset(mobile.matches?0:viewport.clientWidth/2-(monthElements.get(1)?.offsetWidth||0)/2);}
      if(!animate||reduced.matches||r.year==='레거시'){
        settle();updateControls(); if(playing)schedule(); return;
      }
      const from=offset, to=targetOffset(r);
      const travel=(same&&Math.abs(to-from)<1)||mobile.matches?0:650;
      const branch=same?240:Math.max(410,260+80*byYear(r.year).filter(x=>x.month===r.month).length);
      motion={from,to,elapsed:0,travel,branch,arrived:false,reveal:!same};
      if(!same) {
        const col=monthElements.get(r.month);
        if(col){col.classList.add('cv-arriving');col.style.setProperty('--branch',0);col.style.setProperty('--reveal',0);}
      }
      if(mobile.matches)focusMonth(r);
      progress.firstElementChild.style.transform='scaleX(0)';
      paused=false;lastTime=0;updateControls();drawMotion(0);schedule();
    }
    function choose(r){
      if(!r)return;
      playing=false;paused=false;
      if(raf)cancelAnimationFrame(raf);raf=0;introUntil=0;panel.classList.remove('cv-intro');motion=null;
      resultsOpen=false;stage.hidden=false;results.hidden=true;
      move(r,true);
    }
    function step(direction){
      const list=byYear(selected.year), index=list.indexOf(selected);
      if(list[index+direction]) choose(list[index+direction]);
    }
    function togglePlay(){
      if(playing){
        playing=false;paused=true;if(raf)cancelAnimationFrame(raf);raf=0;lastTime=0;updateControls();return;
      }
      if(selected.year==='레거시'||resultsOpen)return;
      playing=true;
      if(paused){paused=false;lastTime=0;updateControls();schedule();return;}
      const list=byYear(selected.year);
      if(introUntil){introUntil=0;panel.classList.remove('cv-intro');}
      if(selected===list.at(-1))move(list[0],true);
      else { if(!motion)remaining=dwell(selected); updateControls();schedule(); }
    }
    function matches(){
      const tokens=query.value.trim().normalize('NFKC').toLowerCase().split(/\s+/).filter(Boolean);
      return rows.filter(r=>tokens.every(token=>{
        const t=norm(token), index={vr:1,'비vr':1,'게임':0,'비게임':0}[t];
        if(typeof index==='number')return norm(r.tags[index])===t;
        if(t==='우승')return r.terms.replaceAll('준우승','').includes(t);
        if(t==='코치')return r.terms.includes('코치')||r.terms.includes('코칭');
        return r.terms.includes(t);
      }));
    }
    function renderResults(){
      const list=matches(); resultsOpen=true; stage.hidden=true;results.hidden=false;
      results.replaceChildren(node('div','cv-result-count','검색 결과 '+list.length+'건'));
      resultsButton.hidden=false;resultsButton.textContent='검색 결과 '+list.length+'건';
      for(const y of years){
        const found=list.filter(r=>r.year===y); if(!found.length)continue;
        const group=node('div','cv-result-group'); group.append(node('h3','',y==='레거시'?y:y+'년'));
        for(const r of found){
          const b=button('cv-result','',()=>choose(r));
          b.append(node('span','cv-result-date',r.date),node('span','cv-result-title',r.caption),node('span','cv-result-info',r.info));
          group.append(b);
        }
        results.append(group);
      }
      if(!list.length)results.append(node('p','','일치하는 기록이 없습니다.'));
      updateControls();
    }
    function clearSearch(restore){
      const origin=searchOrigin; query.value=''; searchOrigin=null;resultsOpen=false;results.hidden=true;stage.hidden=false;resultsButton.hidden=true;
      if(restore&&origin)choose(origin); else updateControls();
    }
    query.addEventListener('focus',()=>{if(playing||motion)stop();});
    query.addEventListener('input',()=>{
      if(!query.value.trim()){clearSearch(true);return;}
      if(!searchOrigin)searchOrigin=selected;
      stop();renderResults();
    });
    query.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();clearSearch(true);}});
    viewport.addEventListener('keydown',e=>{
      if(['ArrowLeft','ArrowUp','ArrowRight','ArrowDown','Home','End'].includes(e.key)){
        e.preventDefault();
        if(e.key==='Home'||e.key==='End')choose(byYear(selected.year)[e.key==='Home'?0:byYear(selected.year).length-1]);
        else step(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1);
      }
    });
    viewport.addEventListener('pointerdown',e=>{
      if(mobile.matches||builtYear==='레거시'||e.pointerType!=='mouse'||e.button!==0||e.target.closest('button'))return;
      stop();drag={x:e.clientX,offset};viewport.setPointerCapture(e.pointerId);viewport.classList.add('cv-dragging');
    });
    viewport.addEventListener('pointermove',e=>{
      if(!drag)return;
      const cols=[...monthElements.values()].filter(col=>!col.classList.contains('cv-empty'));
      const first=cols[0],last=cols.at(-1);
      const max=viewport.clientWidth/2-first.offsetLeft-first.offsetWidth/2;
      const min=viewport.clientWidth/2-last.offsetLeft-last.offsetWidth/2;
      setOffset(Math.max(min,Math.min(max,drag.offset+e.clientX-drag.x)));
    });
    viewport.addEventListener('lostpointercapture',()=>{
      if(!drag)return;drag=null;viewport.classList.remove('cv-dragging');
      const closest=byYear(selected.year).reduce((a,b)=>Math.abs(targetOffset(a)-offset)<=Math.abs(targetOffset(b)-offset)?a:b);
      choose(closest.month===selected.month?selected:closest);
    });
    const resize=()=>{if(section.classList.contains('active')&&!resultsOpen){stop();}};
    const suspend=()=>{if(builtYear)stop();};
    new ResizeObserver(()=>{if(!motion&&!introUntil&&!drag&&!resultsOpen&&section.classList.contains('active'))setOffset(targetOffset(selected));}).observe(viewport);
    reduced.addEventListener('change',resize); mobile.addEventListener('change',resize);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});
    build(selected.year); heroRender(selected); focusMonth(selected);updateControls();remaining=dwell(selected);
    if(!reduced.matches&&!mobile.matches){
      setOffset(targetOffset(byYear(selected.year)[0]));panel.classList.add('cv-intro');
      introUntil=performance.now()+480; schedule();
    }else settle();
    return {resize,suspend};
  }
})();
