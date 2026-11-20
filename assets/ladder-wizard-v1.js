/* Ladder-only presentation layer. The existing roster, prize and CSPRNG game
   APIs remain authoritative; no new saved-data schema is required. */
(()=>{
  'use strict';
  const root=document.getElementById('gameLadder');
  if(!root||typeof window.renderLadder!=='function')return;
  const $=id=>document.getElementById(id),players=()=>data.miniGames.ladder.players,prizes=()=>data.miniGames.ladder.prizes;
  const busy=()=>Boolean(miniGameRuntime.ladder.autoRunning||miniGameRuntime.ladder.animating);
  const validRoster=()=>players().length>=2&&players().length<=12;
  const validPrizes=()=>validRoster()&&prizes().length===players().length&&prizes().every(p=>String(p.label||'').trim());
  const rosterKey=()=>JSON.stringify(players().map(p=>p.id).sort());
  let step=1,furthest=1,key=null,paletteKey=null,preset='winner';
  const pages=[...root.querySelectorAll('[data-ladder-page]')],steps=[...root.querySelectorAll('[data-ladder-step]')];
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
    const n=players().length,m=prizes().length,locked=busy();
    $('ladderWizardRosterCount').textContent=`${n} / 12명`;
    $('ladderWizardGameCount').textContent=`${n}명 · ${m}개`;
    root.style.setProperty('--ladder-lanes',String(Math.max(2,n)));
    const winners=$('ladderWinnerCount');winners.max=String(Math.max(1,n));
    if(Number(winners.value)>n&&n>0)winners.value=String(n);
    pages.forEach(p=>{p.hidden=Number(p.dataset.ladderPage)!==step});
    steps.forEach(b=>{const i=Number(b.dataset.ladderStep);b.classList.toggle('current',i===step);b.classList.toggle('complete',i<step);b.disabled=locked||i>furthest||(i>=2&&!validRoster())||(i===3&&!validPrizes());if(i===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
    const previous=$('ladderWizardBack'),next=$('ladderWizardNext');
    const footer=root.querySelector('.ladder-wizard-footer'),actions=root.querySelector('.ladder-action-row');
    // During play, navigation belongs beside the game controls rather than
    // below a potentially long results list.
    if(step===3){if(previous.parentElement!==actions)actions.prepend(previous)}
    else if(previous.parentElement!==footer)footer.prepend(previous);
    footer.hidden=step===3;
    previous.hidden=step===1;previous.disabled=locked;
    next.hidden=step===3;next.disabled=locked||(step===1?!validRoster():!validPrizes());
    next.textContent=step===1?'결과 설정':'게임 화면으로';
    $('ladderWizardHint').textContent=locked?'게임 진행 중에는 설정을 변경할 수 없습니다.':step===1?(validRoster()?`${n}명 선택 완료`:'참가자를 2~12명 선택하세요.'):step===2?(validPrizes()?`${m}개 결과 준비 완료`:'모든 결과 항목을 입력하세요.'): '이전 단계에서 참가자와 결과를 수정할 수 있습니다.';
    $('ladderResetBtn').disabled=locked;
    $('ladderAutoStartBtn').disabled=locked||!validPrizes();
    // The core rebuilds player buttons during every automatic path; inert is
    // inherited by newly created buttons and does not interrupt the drawing.
    $('ladderPlayerButtons').inert=locked;
    $('ladderPlayerButtons').hidden=!miniGameRuntime.ladder.generated||locked;
    reflectPreset();
  }
  function clearBoard(){
    const r=miniGameRuntime.ladder;r.generated=false;r.rungs=[];r.activePlayer=-1;r.autoResultNames=[];r.autoResultEntries=[];
    const result=$('ladderResult');result.classList.remove('done');result.textContent='자동 시작을 누르면 참가자별 결과가 공개됩니다.';
    $('ladderStatus').textContent='참가자와 결과 항목이 준비되었습니다.';
    renderLadderPlayerButtons();renderLadderAutoResultSlots();renderLadderFullResultList();drawLadder();
  }
  function go(target){
    if(busy()||target<1||target>3||target>step+1&&target>furthest)return;
    if(target>=2&&!validRoster()||target===3&&!validPrizes())return;
    if(target===step)return;
    step=target;furthest=Math.max(furthest,step);sync();
    if(step===1){paletteKey=null;renderMiniContactPalette('ladder',$('ladderContactSearch').value)}
    if(step===2||step===3)renderLadder();
    // Keep the outer header visible on small desktop screens. Only scroll
    // when the user was actually below the wizard header.
    if(root.getBoundingClientRect().top<0)root.scrollIntoView({block:'start',behavior:'instant'});
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
    const nextKey=rosterKey();
    if(key!==null&&key!==nextKey&&!busy()){step=1;furthest=1;paletteKey=null;clearBoard()}
    key=nextKey;
    const out=baseRender.apply(this,arguments);sync();return out;
  };
  const auto=window.autoStartLadder;
  window.autoStartLadder=async function(){if(step!==3||busy()||!validPrizes())return;try{const task=auto.apply(this,arguments);sync();await task}finally{sync()}};
  const single=window.runLadderPath;
  window.runLadderPath=function(){if(step!==3||busy())return;const out=single.apply(this,arguments);sync();const refresh=()=>{if(busy())requestAnimationFrame(refresh);else sync()};requestAnimationFrame(refresh);return out};
  const reset=window.resetLadderBoard;window.resetLadderBoard=function(){if(busy())return;const out=reset.apply(this,arguments);sync();return out};
  steps.forEach(b=>b.addEventListener('click',()=>go(Number(b.dataset.ladderStep))));
  $('ladderWizardBack').addEventListener('click',()=>go(step-1));$('ladderWizardNext').addEventListener('click',()=>go(step+1));
  root.querySelectorAll('[data-ladder-preset]').forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.ladderPreset)));
  $('ladderWinnerCount').addEventListener('change',()=>applyPreset('winner'));
  $('ladderManualName').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();miniManualAdd('ladder','ladderManualName')}});
  renderLadder();
})();
