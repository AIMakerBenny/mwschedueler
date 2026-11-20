import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=read('index.html'),core=read('assets/app-core.js'),wizard=read('assets/ladder-wizard-v1.js');
const markup=index.slice(index.indexOf('<section id="gameLadder"'),index.indexOf('<section id="gameRps"'));
assert(index.includes('assets/ladder-wizard-v1.js?v=2')&&index.includes('assets/ladder-wizard-v1.css?v=3'));
assert.equal((markup.match(/data-ladder-page=/g)||[]).length,3);
function part(start,end,last=false){const a=last?core.lastIndexOf(start):core.indexOf(start),b=core.indexOf(end,a+start.length);assert(a>=0&&b>a,start);return core.slice(a,b)}
// Use the actual legacy renderer and CSPRNG game implementation, with just
// the storage and unrelated mini games stubbed for an isolated browser test.
const bootstrap=`
const data={contacts:Array.from({length:217},(_,i)=>({id:'c'+i,name:'참가자 '+i,labels:['테스트']})),miniGames:{ladder:{players:[],prizes:[]}}};
const miniGameRuntime={ladder:{rungs:[],generated:false,animating:false,activePlayer:-1,autoRunning:false,autoResultEntries:[],autoResultNames:[]}};
const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const initials=x=>String(x||'?').slice(0,2),contact=id=>data.contacts.find(c=>c.id===id),contactMatches=(c,q)=>c.name.includes(q)||c.labels.join(' ').includes(q);
let persisted=0,otherPaletteCalls=0;const persist=()=>{persisted++;return true};function miniPersist(){ensureLadderPrizeCount();persist()}
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
writeFileSync(file,`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}\nbody{margin:0}#gameLadder{padding:18px}</style><body class="mws-premium"><div style="height:78px"></div>${markup.replace('class="section mini-game-section"','class="section mini-game-section active"')}<script>${bootstrap}</script><script>${wizard}</script><script>renderLadder()</script>`);
let browser;
try{
  browser=await launchCalendarBrowser(dir);
  for(const [w,h] of [[1366,768],[1920,1080],[390,844]]){
    await browser.navigate(pathToFileURL(file).href+'?size='+w,w,h);
    const state=await browser.evaluate(`(()=>{
      const $=id=>document.getElementById(id),click=sel=>document.querySelector(sel).click(),visible=()=>[...document.querySelectorAll('[data-ladder-page]')].filter(p=>getComputedStyle(p).display!=='none').map(p=>Number(p.dataset.ladderPage)),labels=()=>data.miniGames.ladder.prizes.map(p=>p.label),n=()=>data.miniGames.ladder.players.length;
      const initial=visible(),initialBlocked=$('ladderWizardNext').disabled,contactCards=$('ladderContactPalette').children.length,initialFooterFits=$('ladderWizardNext').getBoundingClientRect().bottom<=innerHeight;
      $('ladderContactSearch').value='참가자 1';$('ladderContactSearch').dispatchEvent(new Event('input'));click('[data-contact-id="c1"]');
      const searchKept=$('ladderContactSearch').value==='참가자 1'&&document.querySelector('[data-contact-id="c1"]').getAttribute('aria-pressed')==='true';
      click('[data-contact-id="c1"]');const toggled=n()===0;
      $('ladderContactSearch').value='';$('ladderContactSearch').dispatchEvent(new Event('input'));
      for(let i=0;i<12;i++)click('[data-contact-id="c'+i+'"]');
      const cap=n()===12&&document.querySelector('[data-contact-id="c12"]').disabled; $('ladderManualName').value='초과';miniManualAdd('ladder','ladderManualName');const manualCap=n()===12,fullFooterFits=$('ladderWizardNext').getBoundingClientRect().bottom<=innerHeight;
      for(let i=3;i<12;i++)click('[data-contact-id="c'+i+'"]');
      $('ladderManualName').value='직접 추가';$('ladderManualName').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));const manual=n()===4;
      $('ladderWizardNext').click();const second=visible(),initialPrizes=labels(),presetSelected=document.querySelector('[data-ladder-preset="winner"]').getAttribute('aria-pressed')==='true',secondFooterFits=$('ladderWizardNext').getBoundingClientRect().bottom<=innerHeight;$('ladderWinnerCount').value='2';click('[data-ladder-preset="winner"]');const winner=labels();click('[data-ladder-preset="rank"]');const rank=labels();click('[data-ladder-preset="team"]');const teams=labels();click('[data-ladder-preset="default"]');const defaults=labels();
      const input=$('ladderPrizeList').querySelector('input');input.value='';input.dispatchEvent(new Event('input'));const blankBlocked=$('ladderWizardNext').disabled;input.value='직접 입력';input.dispatchEvent(new Event('input'));
      $('ladderWizardBack').click();const back=visible();$('ladderWizardNext').click();const customKept=labels()[0]==='직접 입력';$('ladderWizardNext').click();const third=visible();
      renderMiniContactPalette('rps','');const otherUnchanged=otherPaletteCalls===1;
      const board=$('ladderCanvas').getBoundingClientRect(),thirdFooterFits=$('ladderWizardBack').getBoundingClientRect().bottom<=innerHeight;
      return {initial,initialBlocked,contactCards,initialFooterFits,fullFooterFits,searchKept,toggled,cap,manualCap,manual,second,initialPrizes,presetSelected,secondFooterFits,winner,rank,teams,defaults,blankBlocked,back,customKept,third,thirdFooterFits,canvasBottom:board.bottom,canvasHeight:board.height,otherUnchanged,overflow:document.documentElement.scrollWidth>innerWidth+3};
    })()`);
    assert.deepEqual(state.initial,[1]);assert.equal(state.contactCards,217);assert.deepEqual(state.second,[2]);assert.deepEqual(state.back,[1]);assert.deepEqual(state.third,[3]);
    if(w>850)assert(state.initialFooterFits&&state.fullFooterFits&&state.secondFooterFits&&state.thirdFooterFits&&state.canvasBottom<=h,'Controls or board below viewport: '+JSON.stringify(state));
    assert.deepEqual(state.initialPrizes,['당첨','꽝','꽝','꽝']);assert(state.presetSelected);
    for(const k of ['initialBlocked','searchKept','toggled','cap','manualCap','manual','blankBlocked','customKept','otherUnchanged'])assert(state[k],k+': '+JSON.stringify(state));
    assert.deepEqual(state.winner,['당첨','당첨','꽝','꽝']);assert.deepEqual(state.rank,['1등','2등','3등','4등']);assert.deepEqual(state.teams,['A팀','B팀','A팀','B팀']);assert.deepEqual(state.defaults,['결과 1','결과 2','결과 3','결과 4']);assert(!state.overflow,JSON.stringify(state));
    if(w===1366){
      const result=await browser.evaluate(`(async()=>{const $=id=>document.getElementById(id);const pending=autoStartLadder();const locked=$('ladderWizardBack').disabled&&$('ladderResetBtn').disabled&&$('ladderPlayerButtons').inert;const before=data.miniGames.ladder.players.length;miniRemoveEntry('ladder',data.miniGames.ladder.players[0].id);const guarded=before===data.miniGames.ladder.players.length;await pending;const entries=miniGameRuntime.ladder.autoResultEntries.filter(Boolean),unique=new Set(entries.map(p=>p.id)).size;const results=$('ladderFullResultList').querySelectorAll('.revealed').length;const unlocked=!$('ladderWizardBack').disabled&&!$('ladderResetBtn').disabled;resetLadderBoard();return {locked,guarded,unique,results,unlocked,cleared:!miniGameRuntime.ladder.generated&&!miniGameRuntime.ladder.autoResultEntries.length}})()`);
      assert.deepEqual(result,{locked:true,guarded:true,unique:4,results:4,unlocked:true,cleared:true});console.log('LADDER_GAME_ENGINE_OK',JSON.stringify(result));
      const sample=await browser.evaluate(`(async()=>{const $=id=>document.getElementById(id);$('ladderWizardBack').click();data.miniGames.ladder.prizes.forEach((p,i)=>p.label=['결과 수정은','아랫쪽에서','할 수 있습니다','[SAMPLE]'][i]);renderLadder();const migrated=data.miniGames.ladder.prizes.map(p=>p.label);$('ladderWizardBack').click();for(let i=3;i<11;i++)document.querySelector('[data-contact-id="c'+i+'"]').click();$('ladderWizardNext').click();const setupFits=$('ladderWizardNext').getBoundingClientRect().bottom<=innerHeight;await new Promise(requestAnimationFrame);$('ladderWizardNext').click();const page=document.querySelector('[data-ladder-page="3"]'),frames=[];for(let i=0;i<30;i++){await new Promise(requestAnimationFrame);frames.push(Number(getComputedStyle(page).opacity));if(frames.at(-1)===1)break}const canvas=$('ladderCanvas').getBoundingClientRect();return {migrated,setupFits,n:data.miniGames.ladder.players.length,canvasBottom:canvas.bottom,footer:$('ladderWizardBack').getBoundingClientRect().bottom,intermediate:frames.filter(x=>x>0&&x<1).length}})()`);
      assert.deepEqual(sample.migrated,['당첨','꽝','꽝','꽝']);assert.equal(sample.n,12);assert(sample.setupFits&&sample.canvasBottom<=h&&sample.footer<=h&&sample.intermediate>=3,JSON.stringify(sample));console.log('LADDER_12_PLAYER_LAYOUT_OK',JSON.stringify(sample));
    }
    console.log('LADDER_WIZARD_OK',w,h,JSON.stringify(state));
  }
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
