import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=read('index.html'),core=read('assets/app-core.js'),wizard=read('assets/ladder-wizard-v1.js');
const markup=index.slice(index.indexOf('<section id="gameLadder"'),index.indexOf('<section id="gameRps"'));
const header=index.slice(index.indexOf('<div class="topbar">'),index.indexOf('<section id="dashboard"')).replace('>캘린더</h1>','>사다리타기</h1>').replace('id="todayText"></div>','id="todayText">2026년 11월 21일 토요일</div>').replace('id="clockText"></span>','id="clockText">오전 11:38:23</span>');
assert(index.includes('assets/ladder-wizard-v1.js?v=8')&&index.includes('assets/ladder-wizard-v1.css?v=8'));
assert.equal((markup.match(/data-ladder-page=/g)||[]).length,3);
function part(start,end,last=false){const a=last?core.lastIndexOf(start):core.indexOf(start),b=core.indexOf(end,a+start.length);assert(a>=0&&b>a,start);return core.slice(a,b)}
// Use the actual legacy renderer and CSPRNG game implementation, with just
// the storage and unrelated mini games stubbed for an isolated browser test.
const bootstrap=`
const data={contacts:Array.from({length:217},(_,i)=>({id:'c'+i,name:'참가자 '+i,labels:['테스트']})),miniGames:{ladder:{players:[],prizes:[]}}};
const miniGameRuntime={ladder:{rungs:[],generated:false,animating:false,activePlayer:-1,autoRunning:false,autoResultEntries:[],autoResultNames:[]}};
const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const initials=x=>String(x||'?').slice(0,2),contact=id=>data.contacts.find(c=>c.id===id),contactMatches=(c,q)=>c.name.includes(q)||c.labels.join(' ').includes(q);
let persisted=0,otherPaletteCalls=0;const persist=()=>{persisted++;return true};function miniPersist(){normalizeMiniGameData();persist()}
${part('function defaultMiniGames()','const THEME_META')}
const miniGameArray=()=>data.miniGames.ladder.players,resetGameRuntimeOnRosterChange=()=>{Object.assign(miniGameRuntime.ladder,{generated:false,rungs:[],activePlayer:-1,autoResultEntries:[],autoResultNames:[]})};
const toast=()=>{};function renderMiniGame(){renderLadder()}function renderMiniContactPalette(){otherPaletteCalls++}
function ladderSleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
${part('function cryptoUint32()','window.__miniRandomTest')}
${part('function miniContactEntry(','function resetGameRuntimeOnRosterChange')}
${part('window.miniContactDragStart=','window.miniAddContact=')}
${part('window.miniRemoveEntry=','window.miniRenameEntry=')}
${part('window.miniAddContact=','function renderMiniGame(game)',true)}
${part('function ensureLadderPrizeCount()','function renderLadder()')}
${part('function renderLadder(){','function resetPachinkoState',true)}
${part('window.updateLadderPrize=','window.shuffleLadderOrders=')}
${part('function renderLadderPlayerButtons()','window.generateLadder=')}
${part('function ladderGeometry()','function renderLadder()',true)}
${part('function ladderPath(index)','window.runLadderPath=')}
${part('function makeRandomLadderRungs(n)','function renderLadderAutoResultSlots()')}
${part('const renderLadderV40=','const generateLadderV40=')}
${part('function ladderResultAvatarHTML(player)','/* Clear new result objects')}
${part('function ladderAllResults()','const _shuffleLadderOrdersV413=')}
`;
new Function(bootstrap);
const css=['assets/app-core.css','assets/mawang-premium-v1621.css','assets/device-ui.css','assets/ui-frame-presets.css','assets/workspace-clean-v1.css','assets/ladder-wizard-v1.css'].map(read).join('\n');
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-ladder-wizard-')),file=path.join(dir,'fixture.html');
writeFileSync(file,`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}\nbody{margin:0}#fixture-app{padding-bottom:12px}#fixture-main{width:auto!important;min-height:0!important;margin-left:200px;padding:22px;padding-inline:22px!important;padding-bottom:32px!important;border-bottom:1px solid transparent} @media(max-width:850px){#fixture-main{margin:0;padding:12px;padding-inline:12px!important;padding-bottom:12px!important}}</style><body class="mws-premium"><div id="fixture-app"><main class="main" id="fixture-main">${header}${markup.replace('class="section mini-game-section"','class="section mini-game-section active"')}</main></div><script>${bootstrap}</script><script>${wizard}</script><script>renderLadder()</script>`);
let browser;
try{
  browser=await launchCalendarBrowser(dir);
  for(const [w,h] of [[1366,768],[1920,900],[1920,1080],[2560,1440],[2844,1578],[390,844]]){
    await browser.navigate(pathToFileURL(file).href+'?size='+w,w,h);
    const state=await browser.evaluate(`(()=>{
      const $=id=>document.getElementById(id),click=sel=>document.querySelector(sel).click(),visible=()=>[...document.querySelectorAll('[data-ladder-page]')].filter(p=>getComputedStyle(p).display!=='none').map(p=>Number(p.dataset.ladderPage)),labels=()=>data.miniGames.ladder.prizes.map(p=>p.label),n=()=>data.miniGames.ladder.players.length;
      const aboveCards=()=>{const page=document.querySelector('[data-ladder-page]:not([hidden])');return page.querySelector('.ladder-wizard-heading').contains($('ladderWizardNext'))&&$('ladderWizardNext').getBoundingClientRect().bottom<=page.lastElementChild.getBoundingClientRect().top+1};
      const nav=$('ladderWizardSteps'),root=$('gameLadder'),nr=nav.getBoundingClientRect(),tr=$('pageTitle').getBoundingClientRect(),stepsHeight=nr.height,inline=nr.left>=tr.right&&Math.abs((nr.top+nr.bottom-tr.top-tr.bottom)/2)<=3&&nr.width<=350&&nav.parentElement===$('pageTitle').parentElement&&!root.contains(nav)&&nav.querySelectorAll('.ladder-step-arrow').length===2;
      root.classList.remove('active');const navHidden=getComputedStyle(nav).display==='none';root.classList.add('active');renderLadder();
      const initial=visible(),initialBlocked=$('ladderWizardNext').disabled,contactCards=$('ladderContactPalette').children.length,initialFooterFits=$('ladderWizardNext').getBoundingClientRect().bottom<=innerHeight,firstNavAbove=aboveCards();
      $('ladderContactSearch').value='참가자 1';$('ladderContactSearch').dispatchEvent(new Event('input'));click('[data-contact-id="c1"]');
      const searchKept=$('ladderContactSearch').value==='참가자 1'&&document.querySelector('[data-contact-id="c1"]').getAttribute('aria-pressed')==='true';
      click('[data-contact-id="c1"]');const toggled=n()===0;
      $('ladderContactSearch').value='';$('ladderContactSearch').dispatchEvent(new Event('input'));
      for(let i=0;i<12;i++)click('[data-contact-id="c'+i+'"]');
      const cap=n()===12&&document.querySelector('[data-contact-id="c12"]').disabled; $('ladderManualName').value='초과';miniManualAdd('ladder','ladderManualName');const manualCap=n()===12,fullFooterFits=$('ladderWizardNext').getBoundingClientRect().bottom<=innerHeight;
      for(let i=3;i<12;i++)click('[data-contact-id="c'+i+'"]');
      $('ladderManualName').value='직접 추가';$('ladderManualName').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));const manual=n()===4;
      $('ladderWizardNext').click();const second=visible(),initialPrizes=labels(),presetSelected=document.querySelector('[data-ladder-preset="winner"]').getAttribute('aria-pressed')==='true',secondFooterFits=$('ladderWizardNext').getBoundingClientRect().bottom<=innerHeight,secondNavAbove=aboveCards();$('ladderWinnerCount').value='2';click('[data-ladder-preset="winner"]');const winner=labels();click('[data-ladder-preset="rank"]');const rank=labels();click('[data-ladder-preset="team"]');const teams=labels();click('[data-ladder-preset="default"]');const defaults=labels();
      const input=$('ladderPrizeList').querySelector('input');input.value='';input.dispatchEvent(new Event('input'));const blankBlocked=$('ladderWizardNext').disabled;input.value='직접 입력';input.dispatchEvent(new Event('input'));
      $('ladderWizardBack').click();const back=visible();$('ladderWizardNext').click();const customKept=labels()[0]==='직접 입력';$('ladderWizardNext').click();const third=visible();
      renderMiniContactPalette('rps','');const otherUnchanged=otherPaletteCalls===1;
      const board=$('ladderCanvas').getBoundingClientRect(),thirdFooterFits=$('ladderWizardBack').getBoundingClientRect().bottom<=innerHeight,stageBottom=document.querySelector('.ladder-stage-card').getBoundingClientRect().bottom,summaryBottom=document.querySelector('.ladder-summary-shell').getBoundingClientRect().bottom;
      const navCurrent=nav.querySelector('[aria-current="step"]')?.dataset.ladderStep==='3',navReachable=![...nav.querySelectorAll('button')].some(b=>b.disabled);
      click('[data-ladder-step="1"]');const navReturn=visible()[0]===1;click('[data-ladder-step="3"]');const navForward=visible()[0]===3;
      return {initial,initialBlocked,contactCards,initialFooterFits,fullFooterFits,searchKept,toggled,cap,manualCap,manual,second,initialPrizes,presetSelected,secondFooterFits,winner,rank,teams,defaults,blankBlocked,back,customKept,third,thirdFooterFits,firstNavAbove,secondNavAbove,stepsHeight,inline,navHidden,navCurrent,navReachable,navReturn,navForward,canvasBottom:board.bottom,canvasHeight:board.height,stageBottom,summaryBottom,otherUnchanged,overflow:document.documentElement.scrollWidth>innerWidth+3};
    })()`);
    assert.deepEqual(state.initial,[1]);assert.equal(state.contactCards,217);assert.deepEqual(state.second,[2]);assert.deepEqual(state.back,[1]);assert.deepEqual(state.third,[3]);
    assert(state.firstNavAbove&&state.secondNavAbove&&state.stepsHeight<=34&&state.inline&&state.navHidden&&state.navCurrent&&state.navReachable&&state.navReturn&&state.navForward,'Compact header or navigation: '+JSON.stringify(state));
    assert(await browser.evaluate("!document.querySelector('[data-ladder-page=\"3\"] .ladder-wizard-heading')"),'Duplicate game heading must be removed');
    if(w>850)assert(state.initialFooterFits&&state.fullFooterFits&&state.secondFooterFits&&state.thirdFooterFits&&state.canvasBottom<=h&&state.stageBottom<=h&&state.summaryBottom<=h,'Controls or board below viewport: '+JSON.stringify(state));
    assert.deepEqual(state.initialPrizes,['당첨','꽝','꽝','꽝']);assert(state.presetSelected);
    for(const k of ['initialBlocked','searchKept','toggled','cap','manualCap','manual','blankBlocked','customKept','otherUnchanged'])assert(state[k],k+': '+JSON.stringify(state));
    assert.deepEqual(state.winner,['당첨','당첨','꽝','꽝']);assert.deepEqual(state.rank,['1등','2등','3등','4등']);assert.deepEqual(state.teams,['A팀','B팀','A팀','B팀']);assert.deepEqual(state.defaults,['결과 1','결과 2','결과 3','결과 4']);assert(!state.overflow,JSON.stringify(state));
    const fit=await browser.evaluate(`(async()=>{await new Promise(r=>setTimeout(r,360));const root=document.getElementById('gameLadder'),canvas=document.getElementById('ladderCanvas'),stage=root.querySelector('.ladder-stage-card'),column=root.querySelector('.ladder-board-column'),rect=e=>e.getBoundingClientRect();return {root:rect(root).width,available:document.getElementById('fixture-main').clientWidth-44,stage:rect(stage).width,bottom:rect(stage).bottom,top:rect(stage).top,canvas:rect(canvas).width,canvasHeight:rect(canvas).height,column:rect(column).width,backingWidth:canvas.width,backingHeight:canvas.height,clientWidth:canvas.clientWidth,clientHeight:canvas.clientHeight,compact:root.dataset.ladderCompact}})()`);
    assert(Math.abs(fit.backingWidth-fit.clientWidth)<=1&&Math.abs(fit.backingHeight-fit.clientHeight)<=1,'Canvas backing store: '+JSON.stringify(fit));
    if(w>850){assert(fit.root>=fit.available*.98&&fit.stage>=fit.root*.98&&fit.canvas>=fit.column*.97&&fit.canvas>=fit.root*.68&&fit.canvasHeight>=(fit.bottom-fit.top)*.65&&fit.bottom>=h-48&&fit.bottom<=h-43,'Workspace coverage: '+JSON.stringify(fit));assert.equal(fit.compact,'false');assert(await browser.evaluate(`document.documentElement.scrollHeight<=innerHeight+2&&scrollY===0`),'Page shell must not introduce desktop scrolling')}
    else assert.equal(fit.compact,'true');
    console.log('LADDER_WORKSPACE_FIT_OK',w,h,JSON.stringify(fit));
    if([1366,1920,390].includes(w)){
      const result=await browser.evaluate(`(async()=>{const $=id=>document.getElementById(id),rt=miniGameRuntime.ladder,game=data.miniGames.ladder,rows=()=>[...$('ladderFullResultList').querySelectorAll('.ladder-full-result-row')],rects=()=>[$('ladderCanvas'),document.querySelector('.ladder-stage-card'),$('ladderPlayerButtons'),$('ladderResult')].flatMap(el=>{const r=el.getBoundingClientRect();return [r.x,r.y,r.width,r.height]});game.prizes.forEach((p,i)=>p.label=i===0?'당첨':i===1?'긴 사용자 지정 결과 항목 테스트':'꽝');renderLadder();await new Promise(requestAnimationFrame);const baseline=rects();
      const playerIds=()=>[...$('ladderPlayerButtons').children].map(b=>b.dataset.playerId),prizeIds=()=>rows().map(r=>r.dataset.prizeId),expected=()=>{const occupants=playerIds();for(const rung of [...rt.rungs].sort((a,b)=>a.row-b.row)){const i=rung.left;[occupants[i],occupants[i+1]]=[occupants[i+1],occupants[i]]}return occupants};
      const savedOrder=()=>JSON.stringify([game.players.map(p=>p.id),game.prizes.map(p=>p.id)]),originalOrder=savedOrder(),originalSaves=persisted,prizeLabels=new Map(game.prizes.map(p=>[p.id,p.label]));
      const start=$('ladderAutoStartBtn'),initialCaption=start.textContent==='섞기 시작';const pending=autoStartLadder();const locked=$('ladderWizardBack').disabled&&$('ladderResetBtn').disabled&&$('ladderPlayerButtons').inert;const before=game.players.length;miniRemoveEntry('ladder',game.players[0].id);const guarded=before===game.players.length;
      let maxShift=0,frames=0,labelsMatch=true,revealsMatch=true,partial=false,spacing=true,isolated=true,replacements=0;
      const sample=()=>{maxShift=Math.max(maxShift,...rects().map((v,i)=>Math.abs(v-baseline[i])));frames++;labelsMatch&&=rows().every(row=>row.querySelector('.ladder-full-result-label').textContent===prizeLabels.get(row.dataset.prizeId));const entries=rt.autoResultEntries,ids=expected();revealsMatch&&=rows().every((row,i)=>!entries[i]?!row.classList.contains('revealed'):row.classList.contains('revealed')&&entries[i].id===ids[i]&&row.querySelector('.ladder-full-result-name').textContent===entries[i].name);const count=entries.filter(Boolean).length;if(count>0&&count<game.players.length)partial=true;spacing&&=rt.rungs.every((r,i)=>rt.rungs.slice(i+1).every(s=>Math.abs(r.row-s.row)>1||Math.abs(r.left-s.left)>1))};
      const signature=()=>JSON.stringify([playerIds(),prizeIds(),rt.rungs]),previews=new Set(),t=performance.now(),duration=innerWidth===1366?6500:1200;let waiting=true,nextSync=t+200;
      while(performance.now()-t<duration){await new Promise(requestAnimationFrame);if(performance.now()>=nextSync){const old=game.players;normalizeMiniGameData();renderLadder();if(game.players!==old)replacements++;nextSync+=200}sample();previews.add(signature());waiting&&=rt.autoRunning&&start.textContent==='시작'&&!start.disabled&&getComputedStyle(start).pointerEvents!=='none'&&rt.autoResultEntries.filter(Boolean).length===0;isolated&&=savedOrder()===originalOrder&&persisted===originalSaves}
      const frozen=signature();start.click();const accepted=start.disabled&&start.textContent==='진행 중';if(!accepted)throw Error('Second click did not start');let frozenThroughout=true;
      while(rt.autoRunning){await new Promise(requestAnimationFrame);if(performance.now()>=nextSync){normalizeMiniGameData();renderLadder();nextSync+=200}sample();frozenThroughout&&=signature()===frozen}await pending;await new Promise(requestAnimationFrame);sample();frozenThroughout&&=signature()===frozen;const captionRestored=start.textContent==='섞기 시작'&&!start.disabled;
      const entries=rt.autoResultEntries.filter(Boolean),unique=new Set(entries.map(p=>p.id)).size,results=rows().filter(r=>r.classList.contains('revealed')).length,unlocked=!$('ladderWizardBack').disabled&&!$('ladderResetBtn').disabled;const winnerSlot=game.prizes.findIndex(p=>p.label==='당첨'),winner=entries[winnerSlot],finalWinnerMatches=winner.id===expected()[winnerSlot]&&game.players[rt.activePlayer]?.id===winner.id&&$('ladderResult').textContent==='당첨 · '+winner.name&&rows()[winnerSlot].classList.contains('winner');
      // Replay a route after completion. No geometry movement, correct text.
      const index=0,slot=expected().indexOf(game.players[index].id),replay=runLadderPath(index);while(rt.animating){await new Promise(requestAnimationFrame);sample()}await replay;sample();const replayMatches=$('ladderResult').textContent===game.players[index].name+' → '+game.prizes[slot].label;
      resetLadderBoard();await new Promise(requestAnimationFrame);sample();const cleared=!rt.generated&&!rt.autoResultEntries.length;let cancelled=true,repeated=true,newerEditPreserved=true;
      if(innerWidth===1366){const original=signature(),saves=persisted,root=$('gameLadder'),abandoned=autoStartLadder();root.classList.remove('active');await abandoned;root.classList.add('active');renderLadder();cancelled=signature()===original&&persisted===saves&&!rt.autoRunning&&!rt.generated&&start.textContent==='섞기 시작'}
      if(innerWidth===1366){const again=autoStartLadder();await ladderSleep(450);const originalLabel=game.prizes[0].label,editedId=game.prizes[0].id,saves=persisted;game.prizes[0].label='동기화된 새 결과';normalizeMiniGameData();renderLadder();newerEditPreserved=rows().find(r=>r.dataset.prizeId===editedId).querySelector('.ladder-full-result-label').textContent===originalLabel;start.click();await again;repeated=rt.autoResultEntries.filter(Boolean).length===4&&!start.disabled&&start.textContent==='섞기 시작';newerEditPreserved&&=game.prizes.find(p=>p.id===editedId).label==='동기화된 새 결과'&&persisted===saves;resetLadderBoard()}
      return {locked,guarded,unique,results,unlocked,cleared,maxShift,frames,labelsMatch,revealsMatch,partial,replayMatches,finalWinnerMatches,initialCaption,waiting,accepted,frozenThroughout,captionRestored,previews:previews.size,cancelled,spacing,isolated,replacements,repeated,newerEditPreserved,previewsPerSecond:previews.size/(duration/1000)}})()`);
      for(const k of ['locked','guarded','unlocked','cleared','labelsMatch','revealsMatch','partial','replayMatches','finalWinnerMatches','initialCaption','waiting','accepted','frozenThroughout','captionRestored','cancelled','spacing','isolated','repeated','newerEditPreserved'])assert(result[k],k+': '+JSON.stringify(result));assert.equal(result.unique,4);assert.equal(result.results,4);assert(result.replacements>=3&&result.previewsPerSecond>=10&&result.maxShift<=1&&result.frames>40,'Shuffle or board geometry failure: '+JSON.stringify(result));console.log('LADDER_GAME_ENGINE_OK',w,h,JSON.stringify(result));
    }
    if(w===1366){
      const sample=await browser.evaluate(`(async()=>{const $=id=>document.getElementById(id);$('ladderWizardBack').click();data.miniGames.ladder.prizes.forEach((p,i)=>p.label=['결과 수정은','아랫쪽에서','할 수 있습니다','[SAMPLE]'][i]);renderLadder();const migrated=data.miniGames.ladder.prizes.map(p=>p.label);$('ladderWizardBack').click();for(let i=3;i<11;i++)document.querySelector('[data-contact-id="c'+i+'"]').click();$('ladderWizardNext').click();const setupFits=$('ladderWizardNext').getBoundingClientRect().bottom<=innerHeight;await new Promise(requestAnimationFrame);$('ladderWizardNext').click();const page=document.querySelector('[data-ladder-page="3"]'),frames=[];for(let i=0;i<30;i++){await new Promise(requestAnimationFrame);frames.push(Number(getComputedStyle(page).opacity));if(frames.at(-1)===1)break}const canvas=$('ladderCanvas').getBoundingClientRect();return {migrated,setupFits,n:data.miniGames.ladder.players.length,canvasBottom:canvas.bottom,footer:$('ladderWizardBack').getBoundingClientRect().bottom,intermediate:frames.filter(x=>x>0&&x<1).length}})()`);
      assert.deepEqual(sample.migrated,['당첨','꽝','꽝','꽝']);assert.equal(sample.n,12);assert(sample.setupFits&&sample.canvasBottom<=h&&sample.footer<=h&&sample.intermediate>=3,JSON.stringify(sample));console.log('LADDER_12_PLAYER_LAYOUT_OK',JSON.stringify(sample));
      const dense=await browser.evaluate(`(async()=>{const rt=miniGameRuntime.ladder,root=document.getElementById('gameLadder'),pending=autoStartLadder(),end=performance.now()+1000;let spaced=true,allLanes=true,max=0;while(performance.now()<end){await new Promise(requestAnimationFrame);const r=rt.rungs;spaced&&=r.every((a,i)=>r.slice(i+1).every(b=>Math.abs(a.row-b.row)>1||Math.abs(a.left-b.left)>1));allLanes&&=new Set(r.map(x=>x.left)).size===11;max=Math.max(max,r.length)}root.classList.remove('active');await pending;root.classList.add('active');return {spaced,allLanes,max,rows:ladderGeometry().rows}})()`);
      assert(dense.spaced&&dense.allLanes&&dense.rows===16&&dense.max<=45,JSON.stringify(dense));console.log('LADDER_12_PLAYER_SPACING_OK',JSON.stringify(dense));
    }
    console.log('LADDER_WIZARD_OK',w,h,JSON.stringify(state));
  }
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
