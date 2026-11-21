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
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const node = (tag, cls, value) => {
      const el=document.createElement(tag);
      if(cls)el.className=cls;
      if(value!=null)el.textContent=value;
      return el;
    };
    const button = (cls,label,action) => {
      const b=node('button',cls,label); b.type='button'; b.addEventListener('click',action); return b;
    };
    const panel=node('div','cv-panel');
    const bar=node('div','cv-bar');
    const barHost=node('div','cv-bar-host');barHost.append(bar);
    const toolbar=node('div','cv-toolbar');
    const info=node('div','cv-summary');
    info.append(node('strong','',dated.length+'개 기록'),node('span','','2022 – 2026'));
    const searchBox=node('div','cv-searchbox');
    const query=node('input','cv-search');
    query.type='search'; query.placeholder='전체 기록 검색'; query.setAttribute('aria-label','전체 타임라인 검색');
    const toggle=button('cv-result-toggle','검색 결과',()=>{results.hidden=!results.hidden;toggle.setAttribute('aria-expanded',String(!results.hidden));});
    toggle.hidden=true; toggle.setAttribute('aria-expanded','false');
    const clear=button('cv-clear','검색 지우기',()=>clearSearch(true)); clear.hidden=true;
    searchBox.append(query,toggle,clear);
    toolbar.append(info,searchBox);
    const nav=node('nav','cv-overview'); nav.setAttribute('aria-label','전체 연도 위치');
    const results=node('div','cv-results'); results.hidden=true;
    results.setAttribute('aria-label','검색 결과');
    bar.append(toolbar,nav,results);
    const axis=node('div','cv-axis'); axis.setAttribute('role','region');axis.setAttribute('aria-label','연속 업적 타임라인');
    const legacy=node('section','cv-legacy'); legacy.setAttribute('aria-label','시기 미확인 기록');
    panel.append(barHost,axis,legacy);section.append(panel);source.hidden=true;

    const entries=new Map(), markers=new Map(), yearButtons=new Map(), anim=[], months=[];
    let raf=0, attached=false, searchOrigin=null, selected=null, scrollRoot=null;
    const clamp=(v)=>Math.max(0,Math.min(1,v));
    const getRoot=()=>{
      for(let el=panel.parentElement;el&&el!==document.body;el=el.parentElement){
        if(/auto|scroll/.test(getComputedStyle(el).overflowY)&&el.scrollHeight>el.clientHeight+2)return el;
      }
      return document.scrollingElement;
    };
    const scrollTop=()=>scrollRoot?.scrollTop||0;
    const setScroll=(top)=>{if(scrollRoot)scrollRoot.scrollTo({top,behavior:'instant'});};
    function tone(r){
      const s=r.headline+' '+(r.extra||'');
      if(/준우승|2위|은메달/.test(s)&&!/우승팀|종합 우승|팀 우승|공동 1위/.test(s))return 'silver';
      if(/우승|1위|금메달|대상|MVP|올해의|수상/.test(s))return 'gold';
      if(/3위|동메달/.test(s))return 'bronze';
      if(/감독|코치|교관/.test(s))return 'role';
      if(/제작|몸연기|주최|운영|개장|시작/.test(s))return 'creative';
      return 'neutral';
    }
    function makeCard(r,isLegacy=false){
      const entry=node('div','cv-entry'); entry.dataset.record=String(r.id);entry.dataset.tone=tone(r);
      const card=node('details','cv-card');
      const summary=node('summary','cv-record');
      summary.append(node('span','cv-headline',r.headline),node('span','cv-context',[r.name===r.headline?'':r.name,r.context].filter(Boolean).join(' · ')||r.info));
      if(r.extra&&r.extra!==r.info)summary.append(node('span','cv-extra',r.extra));
      const detail=node('div','cv-detail');
      detail.append(node('p','',r.info),node('small','',r.tags.join(' · ')));
      if(evidence[r.name]){
        const link=node('a','cv-source','분류 근거');link.href=evidence[r.name];link.target='_blank';link.rel='noopener noreferrer';detail.append(link);
      }
      card.append(summary,detail);entry.append(card);entries.set(r.id,entry);
      if(!isLegacy)anim.push(entry);
      card.addEventListener('toggle',schedule);
      return entry;
    }
    function gapLabel(a,b){
      const start=Number(a.year)*12+a.month-1, end=Number(b.year)*12+b.month-1;
      if(end-start<2)return null;
      const label=n=>Math.floor(n/12)+'년 '+(n%12+1)+'월';
      const from=start+1,to=end-1;
      const text=from===to?label(from):Math.floor(from/12)===Math.floor(to/12)?Math.floor(from/12)+'년 '+(from%12+1)+'–'+(to%12+1)+'월':label(from)+' – '+label(to);
      const gap=node('div','cv-gap');gap.append(node('span','',text+' · 기록 없음'));return gap;
    }
    let previous=null;
    for(const y of years.filter(y=>y!=='레거시')){
      const list=byYear(y);
      if(previous){const gap=gapLabel(previous,list[0]);if(gap)axis.append(gap);}
      const year=node('section','cv-year');year.dataset.year=y;
      const heading=node('h2','cv-year-heading');heading.append(node('span','',y),node('small','',list.length+'건'));
      year.append(heading);axis.append(year);markers.set(y,heading);
      const mapButton=button('cv-map-year','',()=>jump(heading));mapButton.setAttribute('aria-label',y+'년 '+list.length+'건 위치로 이동');
      const mapLabel=node('span','cv-map-label');mapLabel.append(node('strong','',y),node('small','',list.length+'건'));
      const dots=node('span','cv-map-dots');
      for(const r of list){const dot=node('i','');dot.dataset.tone=tone(r);dot.dataset.record=String(r.id);dots.append(dot);}
      mapButton.append(mapLabel,dots);nav.append(mapButton);yearButtons.set(y,mapButton);
      for(const m of [...new Set(list.map(r=>r.month))]){
        const records=list.filter(r=>r.month===m);
        if(previous&&previous.year===y){const gap=gapLabel(previous,records[0]);if(gap)year.append(gap);}
        const month=node('section','cv-month');month.dataset.month=String(m);month.dataset.year=y;
        const title=node('h3','cv-month-title',m+'월');month.append(title);months.push(month);
        for(let i=0;i<records.length;i+=2){
          const pair=node('div','cv-pair');pair.dataset.single=String(records.length-i===1);
          const left=makeCard(records[i]);left.classList.add(i%4===0?'cv-left':'cv-right');
          pair.append(left);
          if(records[i+1]){const right=makeCard(records[i+1]);right.classList.add(i%4===0?'cv-right':'cv-left');pair.append(right);}
          // Alternate single-record months without changing chronological DOM order.
          if(records.length===1){left.classList.toggle('cv-left',m%2===0);left.classList.toggle('cv-right',m%2!==0);}
          pair.append(node('i','cv-junction'));
          month.append(pair);
        }
        year.append(month);previous=records.at(-1);
      }
    }
    const legacyHead=node('h2','cv-legacy-heading','레거시 · 시기 미확인');legacy.append(legacyHead);
    const legacyGrid=node('div','cv-legacy-grid'); legacy.append(legacyGrid);
    for(const r of byYear('레거시'))legacyGrid.append(makeCard(r,true));
    const legacyButton=button('cv-legacy-link','레거시 '+byYear('레거시').length+'건',()=>jump(legacyHead)); nav.append(legacyButton);
    const viewport=()=>{
      if(scrollRoot&&scrollRoot!==document.scrollingElement){const r=scrollRoot.getBoundingClientRect();return {top:Math.max(0,r.top),bottom:Math.min(innerHeight,r.bottom)};}
      return {top:0,bottom:innerHeight};
    };
    function update(){
      raf=0;
      if(!attached||document.hidden||!section.classList.contains('active'))return;
      const {top,bottom}=viewport(), h=bottom-top;
      const hostRect=barHost.getBoundingClientRect();
      const pin=Math.max(0,top-hostRect.top);
      const barBottom=hostRect.bottom+pin;
      const activeTop=Math.max(top,Math.min(barBottom,bottom-80));
      const usable=bottom-activeTop;
      // Read all untransformed slot geometry first. Writes never affect layout.
      const states=anim.map(entry=>{
        const r=entry.getBoundingClientRect();
        const p=reduced.matches?1:clamp((bottom+Math.min(40,h*.055)-r.top)/(Math.max(120,usable*.60)));
        return [entry,p];
      });
      let current=null;
      for(const [y,marker] of markers){if(marker.getBoundingClientRect().top<=activeTop+Math.max(70,usable*.35))current=y;}
      if(!current)current=markers.keys().next().value;
      bar.style.setProperty('--cv-pin',pin+'px');
      for(const [entry,p] of states){
        const value=p.toFixed(3);
        if(entry.style.getPropertyValue('--cv-p')!==value)entry.style.setProperty('--cv-p',value);
      }
      const legacyActive=legacyHead.getBoundingClientRect().top<=activeTop+usable*.35;
      for(const [y,b] of yearButtons)b.setAttribute('aria-current',String(!legacyActive&&current===y));
      legacyButton.setAttribute('aria-current',String(legacyActive));
    }
    function schedule(){if(attached&&!raf&&!document.hidden)raf=requestAnimationFrame(update);}
    function jump(target,focus=false){
      scrollRoot=getRoot();
      const r=target.getBoundingClientRect(), v=viewport();
      // Header remains visible, and selected card lands in its fully attached region.
      const reserved=Math.max(110,bar.offsetHeight+22);
      setScroll(scrollTop()+r.top-v.top-reserved);
      if(focus)target.querySelector('summary')?.focus({preventScroll:true});
      schedule();
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
    function choose(r){
      results.hidden=true;toggle.setAttribute('aria-expanded','false');
      if(selected)entries.get(selected.id)?.removeAttribute('data-selected');
      selected=r;
      const entry=entries.get(r.id);entry.dataset.selected='true';jump(entry,true);
    }
    function renderSearch(){
      const list=matches(), ids=new Set(list.map(r=>r.id));
      panel.classList.add('cv-searching');
      for(const [id,entry] of entries)entry.dataset.match=String(ids.has(id));
      for(const dot of nav.querySelectorAll('i[data-record]'))dot.dataset.match=String(ids.has(Number(dot.dataset.record)));
      toggle.hidden=false;clear.hidden=false;toggle.textContent='검색 결과 '+list.length+'건';toggle.setAttribute('aria-expanded','true');
      results.replaceChildren(node('div','cv-result-count','검색 결과 '+list.length+'건'));
      for(const y of years){
        const found=list.filter(r=>r.year===y);if(!found.length)continue;
        const group=node('div','cv-result-group');group.append(node('h3','',y==='레거시'?y:y+'년'));
        for(const r of found){
          const b=button('cv-result','',()=>choose(r));
          b.append(node('span','cv-result-date',r.date),node('strong','',r.caption),node('span','cv-result-info',r.info));group.append(b);
        }
        results.append(group);
      }
      if(!list.length)results.append(node('p','','일치하는 기록이 없습니다.'));
      results.hidden=false;
    }
    function clearSearch(restore){
      query.value='';results.hidden=true;toggle.hidden=true;clear.hidden=true;panel.classList.remove('cv-searching');
      toggle.setAttribute('aria-expanded','false');
      if(selected)entries.get(selected.id)?.removeAttribute('data-selected');selected=null;
      for(const entry of entries.values())entry.removeAttribute('data-match');
      for(const dot of nav.querySelectorAll('[data-match]'))dot.removeAttribute('data-match');
      if(restore&&searchOrigin!==null){scrollRoot=getRoot();setScroll(searchOrigin);}
      searchOrigin=null;schedule();
    }
    query.addEventListener('input',()=>{
      if(!query.value.trim()){clearSearch(true);return;}
      if(searchOrigin===null){scrollRoot=getRoot();searchOrigin=scrollTop();}
      renderSearch();
    });
    query.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();clearSearch(true);}});
    const outside=e=>{if(!bar.contains(e.target)&&!results.hidden){results.hidden=true;toggle.setAttribute('aria-expanded','false');}};
    const observer=new ResizeObserver(schedule);
    const resize=()=>{
      if(!attached){
        attached=true;window.addEventListener('scroll',schedule,{passive:true,capture:true});
        window.addEventListener('resize',schedule,{passive:true});
        document.addEventListener('pointerdown',outside);
        reduced.addEventListener('change',schedule);observer.observe(panel);
      }
      scrollRoot=getRoot();schedule();
    };
    const suspend=()=>{
      if(!attached)return;attached=false;if(raf)cancelAnimationFrame(raf);raf=0;
      window.removeEventListener('scroll',schedule,true);window.removeEventListener('resize',schedule);
      document.removeEventListener('pointerdown',outside);reduced.removeEventListener('change',schedule);observer.disconnect();
    };
    document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}else schedule();});
    resize();
    return {resize,suspend};
  }
})();
