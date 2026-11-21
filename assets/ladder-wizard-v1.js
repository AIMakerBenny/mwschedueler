/* Ladder-only presentation layer. The existing roster, prize and CSPRNG game
   APIs remain authoritative; no new saved-data schema is required. */
(()=>{
  'use strict';
  const root=document.getElementById('gameLadder');
  if(!root||typeof window.renderLadder!=='function')return;
  let round=null;
  const $=id=>document.getElementById(id),savedPlayers=()=>data.miniGames.ladder.players,savedPrizes=()=>data.miniGames.ladder.prizes;
  const players=()=>round?.players||savedPlayers(),prizes=()=>round?.prizes||savedPrizes();
  // Cloud saves and normalization may replace arrays even when their contents
  // are unchanged. Never let those references control the life of a round.
  const sourceKey=()=>JSON.stringify([savedPlayers().map(p=>[p.id,p.name]).sort(),savedPrizes().map(p=>[p.id,p.label]).sort()]);
  const busy=()=>Boolean(miniGameRuntime.ladder.autoRunning||miniGameRuntime.ladder.animating||round?.runtime.autoRunning||round?.runtime.animating);
  const validRoster=()=>players().length>=2&&players().length<=12;
  const validPrizes=()=>validRoster()&&prizes().length===players().length&&prizes().every(p=>String(p.label||'').trim());
  const rosterKey=()=>JSON.stringify(players().map(p=>p.id).sort());
  let step=1,furthest=1,key=null,paletteKey=null,preset='winner',shufflePhase=null;
  const shuffleTempo={initial:240,fast:60,accelerate:900,brake:1100,slow:340,hold:220};
  let shuffleStartedAt=0,shuffleStoppedAt=0,shuffleStopInterval=0;
  const smoothstep=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x)};
  function shuffleInterval(now){
    const {initial,fast,accelerate,brake,slow}=shuffleTempo;
    if(shufflePhase==='settle')return shuffleStopInterval+(slow-shuffleStopInterval)*smoothstep((now-shuffleStoppedAt)/brake);
    return initial+(fast-initial)*smoothstep((now-shuffleStartedAt)/accelerate);
  }
  const nav=$('ladderWizardSteps'),header=$('pageTitle')?.parentElement;
  const pages=[...root.querySelectorAll('[data-ladder-page]')],steps=[...nav.querySelectorAll('[data-ladder-step]')];
  function syncHeader(){
    // Leave the shared calendar and other page headers entirely untouched.
    const target=root.classList.contains('active')&&header?header:root;
    if(nav.parentElement!==target)target.append(nav);
  }
  const canvas=$('ladderCanvas');
  let lastPoints=null,lastProgress=1,resizeFrame=0;
  function fitWorkspace(){
    const rect=root.getBoundingClientRect();if(!rect.width||!root.classList.contains('active'))return;
    // The app's per-page zoom changes CSS pixels independently of the viewport.
    const zoom=rect.width/Math.max(1,root.offsetWidth)||1;
    // Use the document position, not the currently scrolled position: clicking
    // a footer must never increase the board height and create more scrolling.
    // Include the app shell's real bottom padding (which differs by device).
    let bottomSpace=0;
    for(let parent=root.parentElement;parent;parent=parent.parentElement){
      const style=getComputedStyle(parent);
      bottomSpace+=(parseFloat(style.paddingBottom)||0)+(parseFloat(style.borderBottomWidth)||0)+(parseFloat(style.marginBottom)||0);
      if(parent===document.body)break;
    }
    const available=Math.floor((innerHeight-Math.max(0,rect.top+window.scrollY)-Math.max(24,bottomSpace))/zoom);
    const compact=root.clientWidth<850||available<420;
    root.dataset.ladderCompact=String(compact);
    root.style.setProperty('--ladder-workspace-height',`${Math.max(420,available)}px`);
  }
  // Game routes use a fixed logical coordinate system. Resizing either monitor
  // changes only how those positions are painted, never the route or outcome.
  const rowCount=n=>Math.max(8,Math.min(16,n+4));
  function spacedRungs(n){
    const rows=rowCount(n),rungs=[];
    // Rungs sharing a vertical rail need an empty row between them. Give each
    // gap at least one rung, then add a sparse independently randomized set.
    const free=(row,left)=>!rungs.some(r=>Math.abs(r.row-row)<=1&&Math.abs(r.left-left)<=1);
    for(let left=0;left<n-1;left++){
      const choices=Array.from({length:rows},(_,row)=>row).filter(row=>free(row,left));
      if(choices.length)rungs.push({row:choices[randomIntUnbiased(choices.length)],left});
    }
    const extra=[];
    for(let row=0;row<rows;row++)for(let left=0;left<n-1;left++)extra.push({row,left});
    cryptoShuffleInPlace(extra);
    for(const r of extra){if(rungs.length>=n*3)break;if(randomFloat53()<.18&&free(r.row,r.left))rungs.push(r)}
    return rungs.sort((a,b)=>a.row-b.row||a.left-b.left);
  }
  window.ladderGeometry=function(){
    const n=players().length,w=1360,h=480,top=54,bottom=426,left=72,right=1288;
    return {canvas,n,w,h,top,bottom,xs:Array.from({length:n},(_,i)=>n===1?w/2:left+(right-left)*i/(n-1)),rows:rowCount(n)};
  };
  window.drawLadder=function(highlightPoints,progress=1){
    // Core repaint calls (including requestAnimationFrame timestamps) must
    // not erase an active or completed path. A new board explicitly clears it.
    if(Array.isArray(highlightPoints)){lastPoints=highlightPoints;lastProgress=progress}
    else if(highlightPoints===null||!miniGameRuntime.ladder.generated){lastPoints=null;lastProgress=1}
    const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
    const g=ladderGeometry(),ctx=canvas.getContext('2d');
    const density=Math.min(3,(devicePixelRatio||1)*canvas.getBoundingClientRect().width/w);
    const bw=Math.max(1,Math.round(w*density)),bh=Math.max(1,Math.round(h*density));
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh}
    ctx.setTransform(bw/w,0,0,bh/h,0,0);ctx.clearRect(0,0,w,h);
    const padX=Math.min(w/Math.max(2,g.n*2),Math.max(42,w/13)),padY=Math.min(h/5,Math.max(36,h*.10));
    const mapX=x=>padX+(x-72)/(1288-72)*(w-2*padX),mapY=y=>padY+(y-g.top)/(g.bottom-g.top)*(h-2*padY);
    const lane=g.n>1?(w-2*padX)/(g.n-1):w;
    const line=(x1,y1,x2,y2)=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()};
    ctx.lineCap='round';ctx.strokeStyle='#54617a';ctx.lineWidth=Math.max(1.5,Math.min(2.5,w/520));
    g.xs.forEach(x=>line(mapX(x),padY,mapX(x),h-padY));
    if(miniGameRuntime.ladder.generated)for(const r of miniGameRuntime.ladder.rungs){const y=mapY(g.top+(g.bottom-g.top)*(r.row+1)/(g.rows+1));line(mapX(g.xs[r.left]),y,mapX(g.xs[r.left+1]),y)}
    const font=Math.max(12,Math.min(26,w/58,lane/5.5,padY*.57));
    const labelWidth=Math.max(18,Math.min(lane-12,padX*2-10));
    const label=(value,x,y)=>{let s=String(value||'');if(ctx.measureText(s).width>labelWidth){while(s.length>1&&ctx.measureText(s+'…').width>labelWidth)s=s.slice(0,-1);s+='…'}ctx.fillText(s,x,y)};
    ctx.font=`750 ${font}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=getComputedStyle(root).getPropertyValue('--text').trim()||'#f5f7ff';
    players().forEach((p,i)=>label(p.name,mapX(g.xs[i]),padY/2));
    ctx.fillStyle='#ffd96a';prizes().slice(0,g.n).forEach((p,i)=>label(p.label||`결과 ${i+1}`,mapX(g.xs[i]),h-padY/2));
    if(lastPoints?.length&&miniGameRuntime.ladder.generated)drawRoute(ctx,lastPoints.map(p=>({x:mapX(p.x),y:mapY(p.y)})),lastProgress);
  };
  function drawRoute(ctx,points,progress){
    const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y));
    let remaining=lengths.reduce((sum,n)=>sum+n,0)*progress,marker=points[0];
    ctx.save();ctx.strokeStyle='#ffe14a';ctx.shadowColor='#ffe14a';ctx.shadowBlur=6;ctx.lineWidth=4;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(marker.x,marker.y);
    for(let i=0;i<lengths.length;i++){const a=points[i],b=points[i+1],len=lengths[i],t=len?Math.min(1,remaining/len):1;marker={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};ctx.lineTo(marker.x,marker.y);remaining-=len;if(t<1)break}
    ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#fff6a1';ctx.beginPath();ctx.arc(marker.x,marker.y,5,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function scheduleFit(){if(resizeFrame)return;resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;fitWorkspace();if(canvas.clientWidth&&canvas.clientHeight)drawLadder(lastPoints,lastProgress)})}
  const observer=new ResizeObserver(scheduleFit);observer.observe(root);observer.observe(canvas);
  new MutationObserver(()=>{syncHeader();scheduleFit()}).observe(root,{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',scheduleFit,{passive:true});
  // The destination slot is the single source for both the board and summary.
  // Keep rows in place instead of replacing their avatars during every shuffle.
  window.renderLadderFullResultList=function(){
    const box=$('ladderFullResultList'),entries=miniGameRuntime.ladder.autoResultEntries||[],list=prizes();
    $('ladderSummaryCountChip').textContent=`${list.filter((_,i)=>entries[i]).length}건`;
    if(!list.length){box.innerHTML='<div class="ladder-summary-empty">참가자를 추가하면 결과 요약이 여기에 표시됩니다.</div>';return}
    if(box.children.length!==list.length||!box.firstElementChild?.querySelector('.ladder-result-slot-number')){
      box.replaceChildren(...list.map((_,i)=>{const row=document.createElement('div');row.className='ladder-full-result-row';row.dataset.resultIndex=String(i);row.innerHTML='<div class="ladder-full-result-left"><div class="ladder-result-avatar">?</div><div class="ladder-result-identity"><div class="ladder-full-result-name"></div><div class="ladder-result-slot-number"></div></div></div><div class="ladder-full-result-label"></div>';return row}));
    }
    list.forEach((p,i)=>{
      const row=box.children[i],person=entries[i],avatar=row.querySelector('.ladder-result-avatar'),name=row.querySelector('.ladder-full-result-name'),label=row.querySelector('.ladder-full-result-label');
      row.dataset.prizeId=p.id;row.classList.toggle('revealed',Boolean(person));row.classList.toggle('winner',Boolean(person)&&p.label==='당첨');
      name.textContent=person?.name||'결과 대기';name.title=name.textContent;
      row.querySelector('.ladder-result-slot-number').textContent=`${i+1}번 도착`;
      label.textContent=p.label||`결과 ${i+1}`;label.title=label.textContent;
      const avatarKey=JSON.stringify([person?.id,person?.name,person?.image]);
      if(avatar.dataset.key!==avatarKey){avatar.dataset.key=avatarKey;avatar.replaceChildren();if(person?.image){const img=document.createElement('img');img.src=person.image;img.alt='';avatar.append(img)}else avatar.textContent=person?initials(person.name):'?'}
    });
  };
  const baseOrderVisual=window.renderLadderOrderVisual;
  window.renderLadderOrderVisual=function(){const out=baseOrderVisual.apply(this,arguments);renderLadderFullResultList();return out};
  // Update existing visible buttons rather than rebuilding hidden form fields,
  // images and controls on every preview frame.
  window.renderLadderPlayerButtons=function(){
    const box=$('ladderPlayerButtons'),list=players(),rt=miniGameRuntime.ladder;
    if(box.children.length!==list.length){box.replaceChildren(...list.map((_,i)=>{const b=document.createElement('button');b.type='button';b.className='secondary';b.addEventListener('click',()=>runLadderPath(i));return b}))}
    list.forEach((p,i)=>{const b=box.children[i];b.dataset.playerId=p.id;b.textContent=p.name;b.title=p.name+'의 사다리만 타기';b.disabled=!rt.generated;b.classList.toggle('path-active',rt.activePlayer===i)});
  };
  function paintRound(){renderLadderPlayerButtons();renderLadderFullResultList();drawLadder()}
  // Old demonstrations persisted these four labels in the shared data. Only
  // replace the exact sample set or empty results, never
  // arbitrary custom results. Preserve custom prizes across navigation.
  const legacySample=['[SAMPLE]','결과 수정은','아랫쪽에서','할 수 있습니다'].sort().join('|');
  const originalEnsure=window.ensureLadderPrizeCount;
  window.ensureLadderPrizeCount=function(){
    const before=prizes().map(p=>String(p.label||'').trim()),n=players().length;
    const stock=before.length===0||before.slice().sort().join('|')===legacySample;
    const winnerOnly=before.length>0&&before.every(x=>x==='당첨'||x==='꽝');
    originalEnsure();
    if(stock){prizes().forEach((p,i)=>p.label=i===0?'당첨':'꽝');preset='winner'}
    else if(winnerOnly&&before.length!==n){const wins=Math.min(n,Math.max(1,before.filter(x=>x==='당첨').length));prizes().forEach((p,i)=>p.label=i<wins?'당첨':'꽝')}
  };
  function reflectPreset(){
    const labels=prizes().map(p=>p.label);
    if(labels.length&&labels.every(x=>x==='당첨'||x==='꽝')){preset='winner';$('ladderWinnerCount').value=String(Math.max(1,labels.filter(x=>x==='당첨').length))}
    else if(labels.length){preset=['rank','team','default'].find(k=>labels.every((x,i)=>x===(k==='rank'?`${i+1}등`:k==='team'?(i%2===0?'A팀':'B팀'):`결과 ${i+1}`)))||'custom'}
    root.querySelectorAll('[data-ladder-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ladderPreset===preset)));
  }
  function sync(){
    syncHeader();
    const n=players().length,m=prizes().length,locked=busy();
    $('ladderWizardRosterCount').textContent=`${n} / 12명`;
    root.style.setProperty('--ladder-lanes',String(Math.max(2,n)));
    const winners=$('ladderWinnerCount');winners.max=String(Math.max(1,n));
    if(Number(winners.value)>n&&n>0)winners.value=String(n);
    pages.forEach(p=>{p.hidden=Number(p.dataset.ladderPage)!==step});
    steps.forEach(b=>{const i=Number(b.dataset.ladderStep);b.classList.toggle('current',i===step);b.classList.toggle('complete',i<step);b.disabled=locked||i>furthest||(i>=2&&!validRoster())||(i===3&&!validPrizes());if(i===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
    const previous=$('ladderWizardBack'),next=$('ladderWizardNext');
    const navigation=root.querySelector('.ladder-wizard-navigation'),actions=root.querySelector('.ladder-action-row');
    // Setup controls stay in the active heading, leaving the full remaining
    // workspace to the roster or prize cards. In play, Back joins game controls.
    if(step===3){if(previous.parentElement!==actions)actions.prepend(previous)}
    else {
      const heading=pages[step-1].querySelector('.ladder-wizard-heading');
      if(navigation.parentElement!==heading)heading.append(navigation);
      if(previous.parentElement!==navigation)navigation.prepend(previous);
    }
    navigation.hidden=step===3;
    previous.hidden=step===1;previous.disabled=locked;
    next.hidden=step===3;next.disabled=locked||(step===1?!validRoster():!validPrizes());
    next.textContent=step===1?'결과 설정':'게임 화면으로';
    $('ladderWizardHint').textContent=locked?'게임 진행 중에는 설정을 변경할 수 없습니다.':step===1?(validRoster()?`${n}명 선택 완료`:'참가자를 2~12명 선택하세요.'):step===2?(validPrizes()?`${m}개 결과 준비 완료`:'모든 결과 항목을 입력하세요.'): '이전 단계에서 참가자와 결과를 수정할 수 있습니다.';
    $('ladderResetBtn').disabled=locked;
    const start=$('ladderAutoStartBtn');
    start.textContent=shufflePhase==='shuffle'?'시작':shufflePhase==='settle'?'멈추는 중':locked?'진행 중':'섞기 시작';
    start.disabled=!validPrizes()||(locked&&shufflePhase!=='shuffle');
    const stage=root.querySelector('.ladder-stage-card');stage.dataset.ladderPhase=shufflePhase||(locked?'play':'idle');stage.classList.toggle('auto-running',locked);
    // The core rebuilds player buttons during every automatic path; inert is
    // inherited by newly created buttons and does not interrupt the drawing.
    $('ladderPlayerButtons').inert=locked;
    // Keep the replay strip in the layout throughout the run; enabling its
    // controls must not change the canvas rectangle.
    $('ladderPlayerButtons').hidden=false;
    reflectPreset();
    fitWorkspace();scheduleFit();
  }
  function clearBoard(){
    round=null;
    const r=miniGameRuntime.ladder;r.generated=false;r.rungs=[];r.activePlayer=-1;r.autoResultNames=[];r.autoResultEntries=[];
    resultText('결과 대기');
    $('ladderStatus').textContent='참가자와 결과 항목이 준비되었습니다.';
    renderLadderPlayerButtons();renderLadderAutoResultSlots();renderLadderFullResultList();drawLadder(null);
  }
  function go(target){
    if(busy()||target<1||target>3||target>step+1&&target>furthest)return;
    if(target>=2&&!validRoster()||target===3&&!validPrizes())return;
    if(target===step)return;
    if(step===3&&round)clearBoard();
    step=target;furthest=Math.max(furthest,step);sync();
    if(step===1){paletteKey=null;renderMiniContactPalette('ladder',$('ladderContactSearch').value)}
    if(step===2||step===3)renderLadder();
    // Keep the outer header visible on small desktop screens. Only scroll
    // when the user was actually below the wizard header.
    if(root.dataset.ladderCompact==='false'&&window.scrollY>0)window.scrollTo({top:0,behavior:'instant'});
    else if(root.getBoundingClientRect().top<0)root.scrollIntoView({block:'start',behavior:'instant'});
  }
  const basePalette=window.renderMiniContactPalette;
  window.renderMiniContactPalette=function(game,q){
    if(game!=='ladder')return basePalette.apply(this,arguments);
    if(step!==1||!root.classList.contains('active'))return;
    const box=$('ladderContactPalette'),query=String(q??$('ladderContactSearch').value).trim().toLowerCase();
    const selected=new Set(players().map(p=>p.contactId).filter(Boolean));
    const list=(data.contacts||[]).filter(c=>!c.pendingSetup&&contactMatches(c,query));
    $('ladderContactCount').textContent=`${list.length}명`;
    const signature=JSON.stringify([query,players().length,[...selected].sort(),list.map(c=>[c.id,c.name,(c.labels||[]).join(' · ')])]);
    const images=list.map(c=>c.image);if(paletteKey?.signature===signature&&images.every((image,i)=>image===paletteKey.images[i]))return;
    paletteKey={signature,images};
    const focused=document.activeElement?.dataset.contactId;
    const fragment=document.createDocumentFragment();
    for(const c of list){
      const b=document.createElement('button');b.type='button';b.className='ladder-contact-choice';b.dataset.contactId=c.id;
      const picked=selected.has(c.id);b.setAttribute('aria-pressed',String(picked));b.disabled=!picked&&players().length>=12;
      b.draggable=true;b.addEventListener('dragstart',e=>miniContactDragStart(c.id,e));b.addEventListener('dragend',miniContactDragEnd);
      const avatar=document.createElement(c.image?'img':'span');avatar.className='ladder-choice-avatar';
      if(c.image){avatar.src=c.image;avatar.alt='';avatar.loading='lazy';avatar.decoding='async'}else avatar.textContent=initials(c.name);
      const info=document.createElement('span');info.className='ladder-choice-info';const name=document.createElement('strong');name.textContent=c.name;const tags=document.createElement('small');tags.textContent=(c.labels||[]).join(' · ')||'태그 없음';info.append(name,tags);
      const mark=document.createElement('span');mark.className='ladder-choice-mark';mark.textContent=picked?'✓':'+';mark.setAttribute('aria-hidden','true');
      b.append(avatar,info,mark);fragment.append(b);
    }
    if(!list.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='검색 결과가 없습니다.';fragment.append(empty)}
    box.replaceChildren(fragment);
    if(focused)[...box.querySelectorAll('[data-contact-id]')].find(b=>b.dataset.contactId===focused)?.focus({preventScroll:true});
  };
  $('ladderContactPalette').addEventListener('click',e=>{
    const b=e.target.closest('[data-contact-id]');if(!b||busy())return;
    const p=players().find(x=>x.contactId===b.dataset.contactId);
    if(p)miniRemoveEntry('ladder',p.id);else miniAddContact('ladder',b.dataset.contactId);
  });
  // Keep the old globals callable by existing drag/drop, post intake and cloud
  // refresh paths, but enforce the ladder cap and do not edit a running game.
  for(const name of ['miniAddContact','miniManualAdd','miniRemoveEntry','clearMiniEntries','miniRenameEntry']){
    const original=window[name];window[name]=function(game,...args){
      if(game!=='ladder')return original.apply(this,arguments);
      if(busy())return;
      if((name==='miniAddContact'||name==='miniManualAdd')&&players().length>=12)return toast('사다리타기','최대 12명까지 선택할 수 있습니다.');
      const before=JSON.stringify(players().map(p=>[p.id,p.name]));const out=original.apply(this,arguments);
      if(before!==JSON.stringify(players().map(p=>[p.id,p.name]))){clearBoard();furthest=1;sync()}
      return out;
    };
  }
  const baseUpdate=window.updateLadderPrize;
  window.updateLadderPrize=function(id,value){if(busy())return;const p=prizes().find(x=>x.id===id);if(!p||p.label===String(value??''))return;const out=baseUpdate.apply(this,arguments);clearBoard();sync();return out};
  function applyPreset(kind){
    if(busy()||step!==2||!validRoster())return;
    const n=players().length,w=Math.min(n,Math.max(1,Math.floor(Number($('ladderWinnerCount').value)||1)));
    $('ladderWinnerCount').value=String(w);
    prizes().forEach((p,i)=>{p.label=kind==='winner'?(i<w?'당첨':'꽝'):kind==='rank'?`${i+1}등`:kind==='team'?(i%2===0?'A팀':'B팀'):`결과 ${i+1}`});
    // An explicitly chosen numbered preset is intentional, not a legacy
    // placeholder. Do not let the default migration undo that choice.
    preset=kind;miniPersist();clearBoard();renderLadder();
  }
  const baseRender=window.renderLadder;
  window.renderLadder=function(){
    // Background renderAll may be called while the active game is displayed.
    // Render the isolated round instead of copying cloud state into its UI.
    if(round&&round.runtime!==miniGameRuntime.ladder&&!busy()){round=null;drawLadder(null)}
    if(round){paintRound();sync();return}
    const nextKey=rosterKey();
    if(key!==null&&key!==nextKey&&!busy()){step=1;furthest=1;paletteKey=null;clearBoard()}
    key=nextKey;
    const out=baseRender.apply(this,arguments);sync();return out;
  };
  function resultText(text,done=false){const el=$('ladderResult');el.textContent=text;el.title=text;el.classList.toggle('done',done)}
  function finalResult(){
    const entries=miniGameRuntime.ladder.autoResultEntries||[],wins=prizes().map((p,i)=>p.label==='당첨'?entries[i]:null).filter(Boolean);
    if(wins.length===1){const index=players().findIndex(p=>p.id===wins[0].id);if(index>=0){miniGameRuntime.ladder.activePlayer=index;drawLadder(ladderPath(index).points,1);renderLadderPlayerButtons();resultText(`당첨 · ${wins[0].name}`,true);return}}
    drawLadder(null);resultText(wins.length?`당첨 · ${wins.map(p=>p.name).join(', ')}`:'모든 참가자의 결과가 공개되었습니다.',true);
  }
  async function animateRoundPath(index,duration,rt){
    const person=players()[index],path=ladderPath(index);
    if(!person)return false;
    rt.activePlayer=index;renderLadderPlayerButtons();
    return new Promise(resolve=>{
      const start=performance.now(),frame=now=>{
        if(miniGameRuntime.ladder!==rt){resolve(false);return}
        const t=Math.min(1,(now-start)/duration);
        drawLadder(path.points,1-Math.pow(1-t,2.1));
        if(t<1){requestAnimationFrame(frame);return}
        if(!Array.isArray(rt.autoResultEntries))rt.autoResultEntries=[];
        rt.autoResultEntries[path.resultIndex]={id:person.id,name:person.name,image:person.image||'',contactId:person.contactId||''};
        renderLadderFullResultList();resolve(true);
      };requestAnimationFrame(frame);
    });
  }
  window.autoStartLadder=async function(){
    // Brake from the actual current tempo, even if Start is pressed early.
    // Only the final preview is locked; subsequent presses cannot restart it.
    if(shufflePhase==='shuffle'){
      shuffleStoppedAt=performance.now();shuffleStopInterval=shuffleInterval(shuffleStoppedAt);
      shufflePhase='settle';sync();$('ladderStatus').textContent='사다리 확정 중';resultText('멈추는 중');return;
    }
    if(step!==3||busy()||!root.classList.contains('active'))return;
    round=null;
    ensureLadderPrizeCount();
    if(!validPrizes()){clearBoard();renderLadder();return}
    const rt=miniGameRuntime.ladder,session={runtime:rt,source:sourceKey(),players:savedPlayers().map(p=>({...p})),prizes:savedPrizes().map(p=>({...p}))};
    round=session;
    const roster=session.players,outcomes=session.prizes;
    rt.autoRunning=true;rt.autoResultNames=[];rt.autoResultEntries=[];rt.generated=false;rt.rungs=[];rt.activePlayer=-1;shuffleStartedAt=performance.now();shufflePhase='shuffle';
    drawLadder(null);renderLadder();resultText('섞는 중');
    const status=$('ladderStatus');status.textContent='참가자 · 결과 · 사다리 섞는 중';
    let completed=false;
    try{
      let lastPreview=-Infinity;
      while(root.classList.contains('active')&&miniGameRuntime.ladder===rt){
        const now=performance.now(),braking=shufflePhase==='settle';
        if(braking&&now-shuffleStoppedAt>=shuffleTempo.brake){
          // Give the final, visible board a short beat before tracing a path.
          if(now-lastPreview>=shuffleTempo.hold)break;
        }else if(now-lastPreview>=shuffleInterval(now)){
          cryptoShuffleInPlace(roster);cryptoShuffleInPlace(outcomes);
          rt.rungs=spacedRungs(roster.length);rt.generated=true;paintRound();lastPreview=now;
        }
        // At most one preview per paint; never catch up with burst updates.
        await new Promise(requestAnimationFrame);
      }
      // Leaving the game during acceleration or braking cancels the preview.
      if(!root.classList.contains('active')||miniGameRuntime.ladder!==rt||shufflePhase!=='settle')return;
      shufflePhase=null;sync();
      status.textContent='사다리 진행 · 왼쪽부터 결과 확인';
      resultText('결과 공개 중');
      for(let i=0;i<roster.length;i++){if(miniGameRuntime.ladder!==rt||!await animateRoundPath(i,Math.max(430,720-roster.length*14),rt))return;await ladderSleep(120)}
      if(miniGameRuntime.ladder!==rt)return;
      completed=true;rt.activePlayer=-1;status.textContent=`자동 사다리 완료 · ${roster.length}명`;
    }finally{
      shufflePhase=null;rt.autoRunning=false;
      if(completed){
        // Commit the final order only if the shared roster and prizes still
        // match the setup. Preserve any genuinely newer cloud edits.
        if(sourceKey()===session.source){
          const livePlayers=new Map(savedPlayers().map(p=>[p.id,p])),livePrizes=new Map(savedPrizes().map(p=>[p.id,p]));
          data.miniGames.ladder.players=roster.map(p=>livePlayers.get(p.id));
          data.miniGames.ladder.prizes=outcomes.map(p=>livePrizes.get(p.id));
          miniPersist();
        }
        renderLadder();finalResult()
      }else{round=null;if(miniGameRuntime.ladder===rt)clearBoard();renderLadder()}
      sync();
    }
  };
  // Replay uses the same path and reveal operation as automatic play. The old
  // manual wrapper published its destination before the marker arrived.
  window.runLadderPath=async function(index){
    if(step!==3||busy()||!miniGameRuntime.ladder.generated||!players()[index])return;
    const person=players()[index],path=ladderPath(index);miniGameRuntime.ladder.animating=true;resultText(`${person.name} · 경로 확인 중`);sync();
    const rt=miniGameRuntime.ladder;
    try{if(await animateRoundPath(index,1000,rt))resultText(`${person.name} → ${prizes()[path.resultIndex]?.label||`결과 ${path.resultIndex+1}`}`,true)}finally{rt.animating=false;sync()}
  };
  const reset=window.resetLadderBoard;window.resetLadderBoard=function(){if(busy())return;round=null;const out=reset.apply(this,arguments);resultText('결과 대기');renderLadder();return out};
  steps.forEach(b=>b.addEventListener('click',()=>go(Number(b.dataset.ladderStep))));
  $('ladderWizardBack').addEventListener('click',()=>go(step-1));$('ladderWizardNext').addEventListener('click',()=>go(step+1));
  root.querySelectorAll('[data-ladder-preset]').forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.ladderPreset)));
  $('ladderWinnerCount').addEventListener('change',()=>applyPreset('winner'));
  $('ladderManualName').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();miniManualAdd('ladder','ladderManualName')}});
  renderLadder();
})();
