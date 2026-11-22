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
  // Presets are templates, not game rules. Only the final, editable labels
  // enter the existing unbiased shuffle and saved-data contract.
  const presetDefs={
    winner:{name:'당첨 / 꽝',description:'당첨 인원을 정하고 나머지는 꽝으로 채웁니다.',fields:[{key:'wins',id:'ladderWinnerCount',label:'당첨 인원',type:'number',min:1,max:n=>n,initial:1}]},
    rank:{name:'순위 정하기',description:'모든 참가자에게 중복 없이 순위를 배정합니다.',fields:[{key:'start',label:'시작 번호',type:'number',min:1,max:999,initial:1},{key:'suffix',label:'표기 방식',choices:[['등','1등, 2등'],['번','1번, 2번'],['위','1위, 2위']],initial:'등'}]},
    team:{name:'팀 나누기',description:'팀별 인원 차이가 최대 1명인 균등 배분입니다.',fields:[{key:'teams',label:'팀 수',type:'number',min:2,max:n=>Math.min(n,6),initial:2},{key:'style',label:'팀 이름',choices:[['letters','A팀, B팀'],['numbers','1팀, 2팀'],['colors','색상 팀']],initial:'letters'}]},
    role:{name:'역할 추첨',description:'특별 역할과 일반 참가자를 무작위로 배정합니다.',fields:[{key:'pack',label:'역할 구성',choices:[['host','진행자 / 참가자'],['leader','팀장 / 팀원'],['game','공격 / 수비 / 지원']],initial:'host'},{key:'special',id:'ladderRoleCount',label:'특별 역할 인원',type:'number',min:1,max:n=>n,initial:1}]},
    mission:{name:'미션 추첨',description:'각 참가자에게 방송 또는 게임 미션을 부여합니다.',fields:[{key:'pack',label:'미션 테마',choices:[['stream','방송 미션'],['game','게임 미션'],['talk','토크 미션']],initial:'stream'},{key:'pass',label:'미션 면제 인원',type:'number',min:0,max:n=>n,initial:0}]},
    loot:{name:'보상 상자',description:'전설, 희귀, 일반 보상의 수량을 직접 구성합니다.',fields:[{key:'legend',label:'전설 상자',type:'number',min:0,max:n=>n,initial:1},{key:'rare',label:'희귀 상자',type:'number',min:0,max:(n,s)=>n-s.legend,initial:1}]},
    default:{name:'기본 항목',description:'번호가 붙은 항목을 생성해 원하는 이름으로 편집합니다.',fields:[{key:'prefix',label:'항목 이름',type:'text',initial:'결과'}]},
    custom:{name:'커스텀',description:'기존 결과를 유지한 채 각 카드에 원하는 내용을 입력합니다.',fields:[]}
  };
  const missionPacks={stream:['노래 한 소절','랜덤 포즈','캐릭터 성대모사','웃음 참기','10초 자기소개','칭찬 릴레이'],game:['무기 랜덤 선택','다음 판 팀장','아이템 하나 제한','첫 라운드 도전','장비 랜덤 선택','다음 맵 선택'],talk:['밸런스 게임','오늘의 TMI','추천 게임 소개','추억 이야기','칭찬 한마디','랜덤 질문 답변']};
  const teamColors=['레드팀','블루팀','그린팀','옐로팀','퍼플팀','오렌지팀'];
  const settings=Object.fromEntries(Object.entries(presetDefs).map(([kind,def])=>[kind,Object.fromEntries(def.fields.map(f=>[f.key,f.initial]))]));
  let presetFingerprint=null,optionsKey='';
  const fingerprint=()=>JSON.stringify(savedPrizes().map(p=>[p.id,p.label]).sort());
  function normalizeOptions(kind,n){
    const s=settings[kind];
    for(const f of presetDefs[kind].fields){
      if(f.type==='number'){const max=typeof f.max==='function'?f.max(n,s):f.max;s[f.key]=Math.max(f.min,Math.min(max,Math.floor(Number(s[f.key])||0)))}
      else if(f.type==='text')s[f.key]=String(s[f.key]||f.initial).trim().slice(0,24)||f.initial;
      else if(!f.choices.some(([v])=>v===s[f.key]))s[f.key]=f.initial;
    }
    return s;
  }
  function templateLabels(kind,n,s){
    const labels=Array.from({length:n},(_,i)=>{
      switch(kind){
        case 'winner':return i<s.wins?'당첨':'꽝';
        case 'rank':return `${s.start+i}${s.suffix}`;
        case 'team':return s.style==='colors'?teamColors[i%s.teams]:`${s.style==='numbers'?i%s.teams+1:String.fromCharCode(65+i%s.teams)}팀`;
        case 'role':return s.pack==='game'?['공격','수비','지원'][i%Math.min(n,3)]:i<s.special?(s.pack==='leader'?'팀장':'진행자'):(s.pack==='leader'?'팀원':'참가자');
        case 'mission':return i<n-s.pass?missionPacks[s.pack][i%missionPacks[s.pack].length]:'미션 면제';
        case 'loot':return i<s.legend?'전설 상자':i<s.legend+s.rare?'희귀 상자':'일반 상자';
        default:return `${s.prefix} ${i+1}`;
      }
    });
    return labels;
  }
  function inferPreset(){
    const labels=savedPrizes().map(p=>p.label),n=labels.length;
    if(!n)return;
    const same=(kind,s)=>JSON.stringify(templateLabels(kind,n,s).sort())===JSON.stringify([...labels].sort());
    if(labels.includes('당첨')&&labels.every(x=>x==='당첨'||x==='꽝')){preset='winner';settings.winner.wins=labels.filter(x=>x==='당첨').length;return}
    const rank=labels[0]?.match(/^(\d+)(등|번|위)$/);
    if(rank){const s={start:Math.min(...labels.map(x=>parseInt(x,10))),suffix:rank[2]};if(same('rank',s)){preset='rank';Object.assign(settings.rank,s);return}}
    for(const style of ['letters','numbers','colors'])for(let teams=2;teams<=Math.min(n,6);teams++){const s={style,teams};if(same('team',s)){preset='team';Object.assign(settings.team,s);return}}
    for(const pack of ['host','leader','game']){const s={pack,special:labels.filter(x=>x===(pack==='leader'?'팀장':'진행자')).length};if((s.special||pack==='game')&&same('role',s)){preset='role';Object.assign(settings.role,s);return}}
    for(const pack of Object.keys(missionPacks)){const s={pack,pass:labels.filter(x=>x==='미션 면제').length};if(same('mission',s)){preset='mission';Object.assign(settings.mission,s);return}}
    const loot={legend:labels.filter(x=>x==='전설 상자').length,rare:labels.filter(x=>x==='희귀 상자').length};if(same('loot',loot)){preset='loot';Object.assign(settings.loot,loot);return}
    const numbered=labels[0]?.match(/^(.+) \d+$/);if(numbered&&same('default',{prefix:numbered[1]})){preset='default';settings.default.prefix=numbered[1];return}
    preset='custom';
  }
  function renderPresetOptions(){
    const def=presetDefs[preset],n=players().length,box=$('ladderPresetOptions'),s=normalizeOptions(preset,n);
    const activeFields=def.fields.filter(f=>!(preset==='role'&&s.pack==='game'&&f.key==='special'));
    const signature=JSON.stringify([preset,n,activeFields.map(f=>[f.key,s[f.key],typeof f.max==='function'?f.max(n,s):f.max])]);
    $('ladderPresetTitle').textContent=def.name;
    $('ladderPresetDescription').textContent=def.description+(activeFields.length?' 설정 변경 시 카드를 다시 생성합니다.':'');
    const counts=new Map();for(const p of prizes())counts.set(p.label,(counts.get(p.label)||0)+1);
    const countsText=['winner','team','role','loot'].includes(preset)?[...counts].map(([label,count])=>`${label||'미입력'} ${count}명`).join(' · '):`${n}개 결과`;
    $('ladderPresetSummary').textContent=countsText;
    if(optionsKey===signature)return;
    optionsKey=signature;box.replaceChildren();box.hidden=!activeFields.length;
    for(const f of activeFields){
      const label=document.createElement('label');label.className='ladder-preset-field';
      const title=document.createElement('span');title.textContent=f.label;
      const input=document.createElement(f.choices?'select':'input');if(f.id)input.id=f.id;input.dataset.presetField=f.key;
      if(f.choices){for(const [v,t] of f.choices){const option=document.createElement('option');option.value=v;option.textContent=t;input.append(option)}}
      else{input.type=f.type;if(f.type==='number'){input.min=f.min;input.max=typeof f.max==='function'?f.max(n,s):f.max;input.step=1}else input.maxLength=24}
      input.value=String(s[f.key]);label.append(title,input);box.append(label);
      input.addEventListener('change',()=>{s[f.key]=input.value;normalizeOptions(preset,n);optionsKey='';applyPreset(preset,true)});
    }
    if(activeFields.length){
      const regenerate=document.createElement('button');regenerate.type='button';regenerate.className='secondary ladder-preset-regenerate';regenerate.textContent='카드 다시 생성';regenerate.title='현재 설정값으로 결과 카드를 다시 생성합니다.';regenerate.addEventListener('click',()=>applyPreset(preset,true));box.append(regenerate);
    }
  }
  const shuffleTempo={fast:60,brake:1100,slow:340,hold:220,blind:580};
  let shuffleStartedAt=0,shuffleStoppedAt=0,blindProgress=0;
  const smoothstep=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x)};
  function shuffleInterval(now){
    const {fast,brake,slow}=shuffleTempo;
    if(shufflePhase==='settle')return fast+(slow-fast)*smoothstep((now-shuffleStoppedAt)/brake);
    return fast;
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
    const lane=g.n>1?(w-2*padX)/(g.n-1):w,style=getComputedStyle(root);
    const ink=style.getPropertyValue('--text').trim()||'#f5f7ff',panel=style.getPropertyValue('--panel').trim()||'#181b22',input=style.getPropertyValue('--input').trim()||'#11151c';
    const line=(x1,y1,x2,y2)=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()};
    // Recessed board with a restrained lane grid and metallic two-tone rails.
    const bed=ctx.createLinearGradient(0,padY,0,h-padY);bed.addColorStop(0,panel);bed.addColorStop(1,input);ctx.fillStyle=bed;ctx.fillRect(0,padY-8,w,h-2*padY+16);
    ctx.save();ctx.strokeStyle='#8191b412';ctx.lineWidth=1;for(let i=1;i<=g.rows;i++){const y=mapY(g.top+(g.bottom-g.top)*i/(g.rows+1));line(0,y,w,y)}ctx.restore();
    ctx.lineCap='round';const rail=ctx.createLinearGradient(0,padY,0,h-padY);rail.addColorStop(0,'#8393b1');rail.addColorStop(.5,'#53617d');rail.addColorStop(1,'#8090ab');
    const rails=[];g.xs.forEach(x=>rails.push([mapX(x),padY,mapX(x),h-padY]));
    if(miniGameRuntime.ladder.generated)for(const r of miniGameRuntime.ladder.rungs){const y=mapY(g.top+(g.bottom-g.top)*(r.row+1)/(g.rows+1));rails.push([mapX(g.xs[r.left]),y,mapX(g.xs[r.left+1]),y])}
    ctx.strokeStyle='#090b1490';ctx.lineWidth=5;rails.forEach(r=>line(...r));ctx.strokeStyle=rail;ctx.lineWidth=Math.max(2,Math.min(3,w/420));rails.forEach(r=>line(...r));
    // The blind is painted over rails only. Names and prize labels are not
    // part of the covered region; revealed paths are composited above it.
    canvas.dataset.blindProgress=blindProgress.toFixed(3);
    if(blindProgress>0){
      const top=padY-8,height=(h-2*padY+16)*blindProgress,bottom=top+height;
      ctx.save();ctx.beginPath();ctx.rect(0,top,w,height);ctx.clip();
      const shade=ctx.createLinearGradient(0,top,0,h-padY);shade.addColorStop(0,panel);shade.addColorStop(1,input);ctx.fillStyle=shade;ctx.fillRect(0,top,w,height);
      ctx.fillStyle='#8795bc0b';for(let y=top;y<bottom;y+=24)ctx.fillRect(0,y,w,12);
      ctx.strokeStyle='#899bb320';ctx.lineWidth=1;for(let y=top+24;y<bottom;y+=24)line(0,y,w,y);
      ctx.fillStyle='#899bb33b';ctx.fillRect(0,bottom-4,w,4);
      if(blindProgress>.96&&!lastPoints?.length){ctx.font=`650 ${Math.min(16,Math.max(12,w/55))}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=style.getPropertyValue('--muted').trim()||'#91a1bc';ctx.fillText('BLIND',w/2,(top+bottom)/2-10);ctx.font='11px sans-serif';ctx.fillText('경로 비공개',w/2,(top+bottom)/2+12)}
      ctx.restore();
    }
    const font=Math.max(12,Math.min(26,w/58,lane/5.5,padY*.57));
    const labelWidth=Math.max(18,Math.min(lane-12,padX*2-10));
    const label=(value,x,y)=>{let s=String(value||'');if(ctx.measureText(s).width>labelWidth){while(s.length>1&&ctx.measureText(s+'…').width>labelWidth)s=s.slice(0,-1);s+='…'}ctx.fillText(s,x,y)};
    ctx.font=`750 ${font}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    const pill=(x,y,text,active,winner=false)=>{const pw=Math.min(lane-6,padX*2-8,Math.max(34,ctx.measureText(text).width+18)),ph=Math.min(padY-10,font+15);ctx.fillStyle=active?(winner?'#8b702c55':'#8b5cf644'):panel;ctx.beginPath();ctx.roundRect(x-pw/2,y-ph/2,pw,ph,Math.min(10,ph/2));ctx.fill();ctx.strokeStyle=active?(winner?'#f0ca68':'#9c79fe'):'#899bb32a';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle=winner?'#e5b64b':ink;label(text,x,y)};
    const entries=miniGameRuntime.ladder.autoResultEntries||[],active=miniGameRuntime.ladder.activePlayer;
    players().forEach((p,i)=>pill(mapX(g.xs[i]),padY/2,p.name,active===i||entries.some(e=>e?.id===p.id)));
    prizes().slice(0,g.n).forEach((p,i)=>pill(mapX(g.xs[i]),h-padY/2,p.label||`결과 ${i+1}`,Boolean(entries[i]),p.label==='당첨'));
    const mapped=pts=>pts.map(p=>({x:mapX(p.x),y:mapY(p.y)}));
    if(blindProgress>0&&miniGameRuntime.ladder.generated)players().forEach((p,i)=>{if(i!==active&&entries.some(e=>e?.id===p.id))drawRoute(ctx,mapped(ladderPath(i).points),1,'#baa6fc',true)});
    if(lastPoints?.length&&miniGameRuntime.ladder.generated){const revealed=entries.find(e=>e?.id===players()[active]?.id),win=revealed&&prizes()[entries.indexOf(revealed)]?.label==='당첨';drawRoute(ctx,mapped(lastPoints),lastProgress,win?'#ffdc66':'#ac8cff')}
  };
  function drawRoute(ctx,points,progress,color='#ac8cff',muted=false){
    const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y));
    let remaining=lengths.reduce((sum,n)=>sum+n,0)*progress,marker=points[0];
    ctx.save();ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=muted?0:13;ctx.globalAlpha=muted?.38:1;ctx.lineWidth=muted?2.5:5;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(marker.x,marker.y);
    for(let i=0;i<lengths.length;i++){const a=points[i],b=points[i+1],len=lengths[i],t=len?Math.min(1,remaining/len):1;marker={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};ctx.lineTo(marker.x,marker.y);remaining-=len;if(t<1)break}
    ctx.stroke();if(!muted){ctx.shadowBlur=0;ctx.strokeStyle='#fff';ctx.globalAlpha=.48;ctx.lineWidth=1.5;ctx.stroke();ctx.globalAlpha=.18;ctx.fillStyle=color;ctx.beginPath();ctx.arc(marker.x,marker.y,12,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.shadowColor=color;ctx.shadowBlur=12;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(marker.x,marker.y,5,0,Math.PI*2);ctx.fill()}ctx.restore();
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
      const newlyRevealed=Boolean(person)&&!row.classList.contains('revealed');
      row.dataset.prizeId=p.id;row.classList.toggle('revealed',Boolean(person));row.classList.toggle('winner',Boolean(person)&&p.label==='당첨');
      if(newlyRevealed)window.mwsUiInteractionsV1?.status(row);
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
    list.forEach((p,i)=>{const b=box.children[i],revealed=(rt.autoResultEntries||[]).some(e=>e?.id===p.id);b.dataset.playerId=p.id;b.dataset.revealed=String(revealed);b.textContent=p.name;b.title=p.name+(revealed?' · 공개 완료':' · 개별 공개');b.disabled=!rt.generated||Boolean(round?.ready&&revealed);b.classList.toggle('path-active',rt.activePlayer===i)});
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
  function decoratePrizeCards(){
    const box=$('ladderPrizeList');
    box.dataset.prizeCount=String(prizes().length);
    const icons={winner:'<path d="M7 3h10v5a5 5 0 0 1-10 0zm5 10v5m-4 1h8M7 5H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4"/>',miss:'<circle cx="12" cy="12" r="8"/><path d="m9 9 6 6m0-6-6 6"/>',rank:'<path d="M4 20V11h5v9m0 0V4h6v16m0-9h5v9M3 20h18"/>',team:'<circle cx="8" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M2 20v-3a6 6 0 0 1 12 0v3m2-7a5 5 0 0 1 6 5v2"/>',role:'<path d="M4 4h16v16H4zM8 15h8M9 18h6"/><circle cx="12" cy="9" r="2.5"/>',mission:'<path d="M8 4h8v4H8zM8 6H5v15h14V6h-3M8 13l2 2 5-5M8 18h7"/>',custom:'<path d="M3 8h18v12H3zM3 8V5h18v3M12 5v15M8 5a3 3 0 1 1 4-3 3 3 0 1 1 4 3"/>'};
    [...box.querySelectorAll('.mini-entry-row')].forEach((row,i)=>{
      const input=row.querySelector('input'),avatar=row.querySelector('.mini-entry-avatar');if(!input||!avatar)return;
      const value=input.value.trim(),kind=value==='당첨'?'winner':value==='꽝'?'miss':/^\d+[등번위]$/.test(value)?'rank':/^[A-F1-6]팀$/.test(value)||teamColors.includes(value)?'team':preset==='role'?'role':preset==='mission'?'mission':'custom';
      row.dataset.prizeTier=value==='전설 상자'?'legend':value==='희귀 상자'?'rare':value==='일반 상자'?'common':value==='미션 면제'?'pass':'';
      if(!row.querySelector('.ladder-prize-slot')){const label=document.createElement('span');label.className='ladder-prize-slot';label.textContent=`RESULT ${String(i+1).padStart(2,'0')}`;row.prepend(label)}
      if(row.dataset.prizeKind!==kind){row.dataset.prizeKind=kind;avatar.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[kind]}</svg>`}
      input.setAttribute('aria-label',`${i+1}번 결과`);input.placeholder='결과 직접 입력';
    });
  }
  $('ladderPrizeList').addEventListener('click',e=>{const card=e.target.closest('.mini-entry-row');if(card&&e.target.tagName!=='INPUT')card.querySelector('input')?.focus({preventScroll:true})});
  function reflectPreset(){
    if(!round&&presetFingerprint!==fingerprint()){inferPreset();presetFingerprint=fingerprint()}
    root.querySelectorAll('[data-ladder-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ladderPreset===preset)));
    if(step===2)renderPresetOptions();
    decoratePrizeCards();
  }
  function sync(){
    syncHeader();
    const n=players().length,m=prizes().length,locked=busy();
    $('ladderWizardRosterCount').textContent=`${n} / 12명`;
    root.style.setProperty('--ladder-lanes',String(Math.max(2,n)));
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
    start.textContent=shufflePhase==='shuffle'?'시작':shufflePhase==='settle'?'멈추는 중':locked?'공개 중':round?.ready?'전체 공개':'섞기 시작';
    start.disabled=!validPrizes()||(locked&&shufflePhase!=='shuffle');
    const stage=root.querySelector('.ladder-stage-card');stage.dataset.ladderPhase=shufflePhase||(locked?'play':round?.ready?'ready':'idle');stage.classList.toggle('auto-running',locked);
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
    round=null;blindProgress=0;
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
      if(busy()||round?.ready&&root.classList.contains('active'))return;
      if((name==='miniAddContact'||name==='miniManualAdd')&&players().length>=12)return toast('사다리타기','최대 12명까지 선택할 수 있습니다.');
      const before=JSON.stringify(players().map(p=>[p.id,p.name]));const out=original.apply(this,arguments);
      if(before!==JSON.stringify(players().map(p=>[p.id,p.name]))){clearBoard();furthest=1;sync()}
      return out;
    };
  }
  const baseUpdate=window.updateLadderPrize;
  window.updateLadderPrize=function(id,value){if(busy())return;const p=prizes().find(x=>x.id===id);if(!p||p.label===String(value??''))return;const out=baseUpdate.apply(this,arguments);presetFingerprint=fingerprint();clearBoard();sync();return out};
  function applyPreset(kind,regenerate=false){
    if(busy()||step!==2||!validRoster())return;
    if(kind==='custom'){preset='custom';presetFingerprint=fingerprint();sync();const input=$('ladderPrizeList').querySelector('input');input?.focus({preventScroll:true});input?.select();return}
    if(kind===preset&&!regenerate)return;
    const n=players().length,labels=templateLabels(kind,n,normalizeOptions(kind,n));
    prizes().forEach((p,i)=>{p.label=labels[i]});
    // An explicitly chosen numbered preset is intentional, not a legacy
    // placeholder. Do not let the default migration undo that choice.
    preset=kind;presetFingerprint=fingerprint();miniPersist();clearBoard();renderLadder();
  }
  const baseRender=window.renderLadder;
  window.renderLadder=function(){
    // Background renderAll may be called while the active game is displayed.
    // Render the isolated round instead of copying cloud state into its UI.
    if(round&&round.runtime!==miniGameRuntime.ladder&&!busy()){round=null;blindProgress=0;drawLadder(null)}
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
        if(miniGameRuntime.ladder!==rt||!root.classList.contains('active')){resolve(false);return}
        const t=Math.min(1,(now-start)/duration);
        drawLadder(path.points,smoothstep(t));
        if(t<1){requestAnimationFrame(frame);return}
        if(!Array.isArray(rt.autoResultEntries))rt.autoResultEntries=[];
        rt.autoResultEntries[path.resultIndex]={id:person.id,name:person.name,image:person.image||'',contactId:person.contactId||''};
        renderLadderFullResultList();renderLadderPlayerButtons();drawLadder(path.points,1);resolve(true);
      };requestAnimationFrame(frame);
    });
  }
  const revealedCount=rt=>(rt.autoResultEntries||[]).filter(Boolean).length;
  const hasRevealed=(rt,person)=>(rt.autoResultEntries||[]).some(p=>p?.id===person.id);
  function showReady(rt){
    $('ladderStatus').textContent=`${revealedCount(rt)} / ${players().length}명 공개 · 참가자 또는 전체 공개 선택`;
    if(!revealedCount(rt))resultText('개별 공개 또는 전체 공개');
  }
  async function finishRound(session){
    const rt=session.runtime;
    // Expose the complete board only after every result is already revealed.
    const start=performance.now();
    while(miniGameRuntime.ladder===rt&&root.classList.contains('active')){
      blindProgress=1-smoothstep((performance.now()-start)/560);drawLadder();
      if(blindProgress<=0)break;await new Promise(requestAnimationFrame);
    }
    if(miniGameRuntime.ladder!==rt)return;
    blindProgress=0;session.ready=false;rt.activePlayer=-1;
    if(sourceKey()===session.source){
      const livePlayers=new Map(savedPlayers().map(p=>[p.id,p])),livePrizes=new Map(savedPrizes().map(p=>[p.id,p]));
      data.miniGames.ladder.players=session.players.map(p=>livePlayers.get(p.id));
      data.miniGames.ladder.prizes=session.prizes.map(p=>livePrizes.get(p.id));miniPersist();
    }
    $('ladderStatus').textContent=`전체 공개 완료 · ${session.players.length}명`;renderLadder();finalResult();
  }
  async function revealAll(){
    const session=round,rt=session?.runtime;if(!session?.ready||busy()||rt!==miniGameRuntime.ladder)return;
    rt.autoRunning=true;sync();$('ladderStatus').textContent='전체 공개 중';resultText('결과 공개 중');
    try{
      for(let i=0;i<session.players.length;i++){
        if(hasRevealed(rt,session.players[i]))continue;
        if(miniGameRuntime.ladder!==rt||!await animateRoundPath(i,Math.max(800,1160-session.players.length*20),rt))return;
        await ladderSleep(170);
      }
      if(revealedCount(rt)===session.players.length)await finishRound(session);
    }finally{rt.autoRunning=false;if(session.ready&&miniGameRuntime.ladder===rt){showReady(rt);if(!hasRevealed(rt,session.players[rt.activePlayer]||{})){rt.activePlayer=-1;drawLadder(null)}}sync()}
  }
  window.autoStartLadder=async function(){
    // Start freezes the shuffle after braking; a separate action reveals paths.
    if(shufflePhase==='shuffle'){
      shuffleStoppedAt=performance.now();
      shufflePhase='settle';sync();$('ladderStatus').textContent='사다리 확정 중';resultText('멈추는 중');return;
    }
    if(step!==3||busy()||!root.classList.contains('active'))return;
    if(round?.ready)return revealAll();
    round=null;blindProgress=0;
    ensureLadderPrizeCount();
    if(!validPrizes()){clearBoard();renderLadder();return}
    const rt=miniGameRuntime.ladder,session={runtime:rt,source:sourceKey(),players:savedPlayers().map(p=>({...p})),prizes:savedPrizes().map(p=>({...p})),ready:false};
    round=session;
    const roster=session.players,outcomes=session.prizes;
    rt.autoRunning=true;rt.autoResultNames=[];rt.autoResultEntries=[];rt.generated=false;rt.rungs=[];rt.activePlayer=-1;shuffleStartedAt=performance.now();shufflePhase='shuffle';
    drawLadder(null);renderLadder();resultText('섞는 중');
    const status=$('ladderStatus');status.textContent='참가자 · 결과 · 사다리 섞는 중';
    let ready=false;
    try{
      let lastPreview=-Infinity;
      while(root.classList.contains('active')&&miniGameRuntime.ladder===rt){
        const now=performance.now(),braking=shufflePhase==='settle',nextBlind=smoothstep((now-shuffleStartedAt)/shuffleTempo.blind),changed=nextBlind!==blindProgress;blindProgress=nextBlind;
        if(braking&&now-shuffleStoppedAt>=shuffleTempo.brake){
          // Give the final, visible board a short beat before tracing a path.
          if(now-lastPreview>=shuffleTempo.hold)break;
        }else if(now-lastPreview>=shuffleInterval(now)){
          cryptoShuffleInPlace(roster);cryptoShuffleInPlace(outcomes);
          rt.rungs=spacedRungs(roster.length);rt.generated=true;paintRound();lastPreview=now;
        }
        else if(changed)drawLadder();
        // At most one preview per paint; never catch up with burst updates.
        await new Promise(requestAnimationFrame);
      }
      // Leaving the game during acceleration or braking cancels the preview.
      if(!root.classList.contains('active')||miniGameRuntime.ladder!==rt||shufflePhase!=='settle')return;
      session.ready=true;ready=true;blindProgress=1;rt.activePlayer=-1;drawLadder(null);showReady(rt);
    }finally{
      shufflePhase=null;rt.autoRunning=false;
      if(ready){paintRound()}else{round=null;blindProgress=0;if(miniGameRuntime.ladder===rt)clearBoard();renderLadder()}
      sync();
    }
  };
  // Replay uses the same path and reveal operation as automatic play. The old
  // manual wrapper published its destination before the marker arrived.
  window.runLadderPath=async function(index){
    if(step!==3||busy()||!miniGameRuntime.ladder.generated||!players()[index])return;
    const session=round,person=players()[index],path=ladderPath(index);if(session?.ready&&hasRevealed(miniGameRuntime.ladder,person))return;
    miniGameRuntime.ladder.animating=true;resultText(`${person.name} · 경로 확인 중`);sync();
    const rt=miniGameRuntime.ladder;
    try{if(await animateRoundPath(index,1150,rt)){resultText(`${person.name} → ${prizes()[path.resultIndex]?.label||`결과 ${path.resultIndex+1}`}`,true);if(session?.ready&&revealedCount(rt)===players().length)await finishRound(session)}}finally{rt.animating=false;if(session?.ready){showReady(rt);if(!hasRevealed(rt,person)){rt.activePlayer=-1;drawLadder(null)}}sync()}
  };
  const reset=window.resetLadderBoard;window.resetLadderBoard=function(){if(busy())return;round=null;blindProgress=0;const out=reset.apply(this,arguments);resultText('결과 대기');renderLadder();return out};
  steps.forEach(b=>b.addEventListener('click',()=>go(Number(b.dataset.ladderStep))));
  $('ladderWizardBack').addEventListener('click',()=>go(step-1));$('ladderWizardNext').addEventListener('click',()=>go(step+1));
  root.querySelectorAll('[data-ladder-preset]').forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.ladderPreset)));
  $('ladderManualName').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();miniManualAdd('ladder','ladderManualName')}});
  renderLadder();
})();
