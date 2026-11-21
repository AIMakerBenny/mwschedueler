(() => {
  const section = document.getElementById('careerTimeline');
  const source = section?.querySelector('.career-tree');
  if (!source) return;
  const observer = new MutationObserver(start);
  observer.observe(section, {attributes:true, attributeFilter:['class']});
  start();

  function start() {
    if (!section.classList.contains('active')) return;
    observer.disconnect();
    mount();
  }

  function mount() {
    const aliases = [
      [/릴동파/, '릴파 버츄얼 동계 스포츠 대회'],
      [/WBD/, '왁야대 VR챗 왁타버스 야구 대회'],
      [/왁타버스 체육대회/, '왁체대'],
      [/버츄얼 육상/, '버육대'],
      [/버츄얼 파이터/, '버복대'],
      [/릴파 버추얼 복싱/, '릴복대'],
      [/상황극 콘테스트/, '상컨'],
      [/와우 포에버/, 'WOW 월드 오브 워크래프트'],
      [/배그/, 'PUBG 배틀그라운드'],
      [/배틀크러쉬/, '배틀크러시'],
      [/파블로프/, 'Pavlov'],
      [/레귤러원/, 'Regular One'],
      [/재활센터|브산동/, '센터장']
    ];
    const evidence = {
      '제1회 버츄페 어워드':'https://pick.sooplive.com/daily/view/161255',
      '제6회 처니랜드 소대전투':'https://pick.sooplive.com/daily/view/173654'
    };
    const captions = {
      '그란투리스모 7':'데이토나 개인 1위','신호등':'신호등 총감독','제8회 상황극 콘테스트':'낙화 몸연기',
      '그냥 살아!':'그냥 살아! 감독','제9회 상황극 콘테스트':'실종 · PUNK 몸연기',
      '왁타버스 체육대회':'왁체대 종합 우승','제1회 릴동파':'릴동파 종합 우승','지육대':'지육대 코치',
      '릴파 버추얼 복싱 대회':'릴복대 우승팀 코치','WBD 왁타버스 야구 대회':'WBD 4강',
      '제2회 릴동파':'릴동파 2 봅슬레이 은메달','레귤러원 F1 시즌 2':'레귤러원 팀 우승'
    };
    const rows = [];
    const normalize = s => s.normalize('NFKC').toLowerCase().replace(/\s+/g,'');
    for (const group of source.querySelectorAll('.career-year')) {
      const year = group.querySelector('summary').textContent.replace('년','');
      for (const month of group.querySelectorAll('.career-month')) {
        for (const li of month.querySelectorAll('li')) {
          const name = li.querySelector('strong').textContent;
          const info = li.querySelector('p').textContent;
          const tags = Array.from(li.querySelectorAll('.career-tags span'), el => el.textContent);
          const date = month.querySelector('h3').textContent;
          const caption = captions[name] || name;
          const synonyms = aliases.filter(([re]) => re.test(name)).map(([,alias]) => alias);
          const terms = normalize([year,date,name,caption,info,...synonyms].join(' '));
          rows.push({year,date,name,caption,info,tags,terms});
        }
      }
    }
    const years = [...new Set(rows.map(r => r.year))];
    let year = years.filter(y => /^\d{4}$/.test(y)).at(-1);
    let selected = null;
    const positions = new Map();
    let searching = false;
    const node = (tag, cls, value) => {
      const el = document.createElement(tag);
      if (cls) el.className = cls;
      if (value != null) el.textContent = value;
      return el;
    };
    const panel = node('div','cv-panel');
    const bar = node('div','cv-bar');
    const nav = node('nav','cv-years');
    nav.setAttribute('aria-label','타임라인 연도');
    const query = node('input','cv-search');
    query.type='search'; query.placeholder='기록 검색'; query.setAttribute('aria-label','전체 타임라인 검색');
    const viewport = node('div','cv-viewport'); viewport.tabIndex=0;
    viewport.setAttribute('role','region'); viewport.setAttribute('aria-label','월별 활동');
    const detail = node('div','cv-detail');
    detail.id='career-record-detail'; detail.hidden=true;
    const status = node('small','cv-status'); status.setAttribute('role','status');
    bar.append(nav,query); panel.append(bar,status,viewport,detail);
    section.append(panel); source.hidden=true;
    const buttons = new Map();
    for (const y of years) {
      const b=node('button','',y); b.type='button'; nav.append(b); buttons.set(y,b);
      b.onclick=()=>{
        if (!searching) positions.set(year,viewport.scrollLeft);
        query.value=''; searching=false; year=y; draw(); viewport.scrollLeft=positions.get(year)||0;
      };
    }
    function show(row,b) {
      const toggle=selected===b;
      selected?.setAttribute('aria-expanded','false'); selected=null;
      detail.replaceChildren(); detail.hidden=toggle;
      if (toggle) return;
      selected=b; b.setAttribute('aria-expanded','true');
      const date = row.year==='레거시'?'레거시':row.year+'년 '+row.date;
      detail.append(node('small','',date),node('h3','',row.name),node('p','',row.info),node('small','',row.tags.join(' · ')));
      if (evidence[row.name]) {
        const link=node('a','cv-source','분류 근거');
        link.href=evidence[row.name]; link.target='_blank'; link.rel='noopener noreferrer';
        detail.append(link);
      }
      if (b.closest('.cv-result') || matchMedia('(max-width: 700px)').matches) b.after(detail);
      else panel.append(detail);
    }
    function record(row) {
      const b=node('button','cv-record',row.caption);
      b.type='button'; b.dataset.vr=String(row.tags[1]==='VR');
      b.setAttribute('aria-expanded','false'); b.setAttribute('aria-controls',detail.id);
      b.onclick=()=>show(row,b);
      return b;
    }
    function draw() {
      panel.append(detail); detail.hidden=true; selected=null;
      const tokens=query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const filtered=rows.filter(r=>tokens.every(token=>{
        const tag={vr:1,'비vr':1,'게임':0,'비게임':0}[token];
        if (typeof tag==='number') return r.tags[tag].toLowerCase()===token;
        if(token==='우승') return !r.terms.includes('준우승') && r.terms.includes(token);
        return r.terms.includes(normalize(token));
      }));
      for (const [y,b] of buttons) {
        b.setAttribute('aria-pressed',String(!searching&&year===y));
        b.classList.toggle('cv-hit',searching&&filtered.some(r=>r.year===y));
      }
      viewport.replaceChildren();
      status.textContent=searching?'검색 결과 '+filtered.length+'건':'';
      if (searching||year==='레거시') {
        const list=node('div','cv-results');
        for (const y of years) {
          const matches=filtered.filter(r=>r.year===y&&(searching||y===year));
          if (!matches.length) continue;
          list.append(node('h3','',y==='레거시'?y:y+'년'));
          for (const r of matches) {
            const item=node('div','cv-result'); item.append(node('small','',r.date),record(r)); list.append(item);
          }
        }
        if(!filtered.length) list.append(node('p','','일치하는 기록이 없습니다.'));
        viewport.append(list); return;
      }
      const axis=node('div','cv-axis');
      for (let m=1;m<=12;m++) {
        const events=rows.filter(r=>r.year===year&&r.date===m+'월');
        const col=node('div','cv-month'+(events.length?'':' cv-empty'));
        const top=node('div','cv-upper'), bottom=node('div','cv-lower');
        const tick=node('div','cv-tick'); tick.append(node('span','',m+'월'));
        events.forEach((r,i)=>(i%2?bottom:top).append(record(r)));
        col.append(top,tick,bottom); axis.append(col);
      }
      viewport.append(axis);
    }
    query.oninput=()=>{
      const next=Boolean(query.value.trim());
      if(next&&!searching) positions.set(year,viewport.scrollLeft);
      searching=next; draw(); viewport.scrollLeft=next?0:positions.get(year)||0;
    };
    let drag=null;
    viewport.onpointerdown=e=>{
      if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('button')||viewport.scrollWidth<=viewport.clientWidth)return;
      drag={x:e.clientX,offset:viewport.scrollLeft}; viewport.setPointerCapture(e.pointerId);
    };
    viewport.onpointermove=e=>{if(drag)viewport.scrollLeft=drag.offset+drag.x-e.clientX};
    viewport.onlostpointercapture=()=>{drag=null};
    draw();
  }
})();
