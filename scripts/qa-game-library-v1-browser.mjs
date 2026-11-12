import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser']
  .map(n=>spawnSync('which',[n],{encoding:'utf8'}))
  .find(x=>x.status===0)?.stdout.trim();
assert(chrome,'Chromium required for manual game picker browser QA');
const load=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const core=load('assets/app-core.css');
const steam=load('assets/steam-game-v111.js');
const boot=`
let editingEventId='e1';
let saved=0,reasonHistory=[],notices=[];
const legacy={appid:'730',name:'Counter-Strike 2',image:'https://example.com/730.png',
 storeUrl:'https://store.steampowered.com/app/730/'};
let data={events:[
 {id:'e1',title:'방송 1',date:'2026-11-01',start:'20:00',end:'22:00',contentGroupId:'wow',steamGame:null},
 {id:'e2',title:'방송 2',date:'2026-11-02',start:'21:00',end:'23:00',contentGroupId:'sbo',steamGame:{...legacy}}
],contentGroups:[{id:'wow',name:'와우 포에버',color:'#0f8c95'},{id:'sbo',name:'SBO',color:'#5533ff'}],gameLibrary:[]};
function saveData(reason){saved++;reasonHistory.push(reason);window.dispatchEvent(new CustomEvent('mawang:datachange',{detail:{reason}}));return true;}
function toast(...args){notices.push(args.join(':'));}
function applyEventPayloadWithRepeat(payload,id){Object.assign(data.events.find(x=>x.id===id),payload);}
document.getElementById('saveEventBtn').onclick=()=>{
 applyEventPayloadWithRepeat({title:'방송 1',date:'2026-11-01',start:'20:00',end:'22:00',contentGroupId:'wow'},editingEventId);
 document.getElementById('eventModal').classList.remove('open');
 saveData('schedule');return true;
};
`;
const check=`
document.addEventListener('DOMContentLoaded',()=>{
(async()=>{
 const $=id=>document.getElementById(id);
 const next=()=>new Promise(resolve=>setTimeout(resolve,20));
 await next();
 const panel=$('eventGamePanelV112');
 const hasPanel=!!panel&&panel.querySelector('#gameLibListV1');
 const initialSteamListed=$('gameLibListV1')?.textContent.includes('Counter-Strike 2');
 const unchangedBefore=JSON.stringify(data.events[1].steamGame)===JSON.stringify(legacy);
 $('gameLibAddToggleV1').click();
 const opened=!$('gameManualFormV1').hidden;
 $('gameManualNameV1').value='와우 포에버';
 $('gameManualPlatformV1').value='PC';
 $('gameManualImageUrlV1').value='https://example.com/wow.webp';
 $('gameManualSaveV1').click();
 await next();
 const item=data.gameLibrary[0];
 const added=data.gameLibrary.length===1&&item?.source==='manual'&&
   item.name==='와우 포에버'&&item.platform==='PC'&&item.id.startsWith('manual:');
 const librarySaved=saved===1&&reasonHistory[0]==='게임 라이브러리 추가';
 const notTouchEvents=JSON.stringify(data.events[1].steamGame)===JSON.stringify(legacy)
   &&data.events[0].date==='2026-11-01'&&data.events[0].contentGroupId==='wow';
 const gamePicked=$('eventGamePreviewV112').textContent.includes('와우 포에버');
 $('gameLibFilterV1').value='와우';
 $('gameLibFilterV1').dispatchEvent(new Event('input',{bubbles:true}));
 const filtered=$('gameLibListV1').querySelectorAll('[data-game-key]').length===1;
 $('gameLibListV1').querySelector('[data-game-key]')?.click();
 $('saveEventBtn').click();
 const linked=data.events[0].steamGame?.source==='manual'&&data.events[0].steamGame?.id===item.id;
 const unchangedAfter=JSON.stringify(data.events[1].steamGame)===JSON.stringify(legacy)
   &&data.events[0].start==='20:00'&&data.events[0].contentGroupId==='wow'
   &&data.contentGroups[0].name==='와우 포에버';
 const names=data.gameLibrary.length===1;
 $('eventModal').classList.add('open');
 await next();
 $('gameLibFilterV1').value='';
 $('gameLibFilterV1').dispatchEvent(new Event('input',{bubbles:true}));
 const edit=$('gameLibListV1').querySelector('[data-edit-key]');
 edit?.click();
 const editOpened=!$('gameManualFormV1').hidden&&$('gameManualNameV1').value==='와우 포에버';
 $('gameManualNameV1').value='와우 포에버 리마스터';
 $('gameManualSaveV1').click();
 await next();
 const edited=data.gameLibrary.length===1&&data.gameLibrary[0].id===item.id&&
   data.gameLibrary[0].name==='와우 포에버 리마스터';

 const eventSnapshotRetained=data.events[0].steamGame.name==='와우 포에버';
 // An actual browser file input must be compressed to a safe reusable image.
 $('gameLibAddToggleV1').click();
 $('gameManualNameV1').value='직접 만든 이미지 게임';
 $('gameManualPlatformV1').value='웹';
 const canvas=document.createElement('canvas');canvas.width=32;canvas.height=20;
 canvas.getContext('2d').fillStyle='#25aacc';canvas.getContext('2d').fillRect(0,0,32,20);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
 const file=new File([blob],'cover.png',{type:'image/png'});
 const dt=new DataTransfer();dt.items.add(file);
 $('gameManualImageFileV1').files=dt.files;
 $('gameManualSaveV1').click();
 for(let attempt=0;attempt<15&&$('gameManualSaveV1').disabled;attempt++)await next();
 const fileStored=data.gameLibrary.some(item=>item.name==='직접 만든 이미지 게임'&&
   item.platform==='웹'&&/^data:image\/(?:webp|jpeg|png);base64,/.test(item.image)&&item.image.length<95000);
 document.body.dataset.mwsMode='public';
 $('gameLibAddToggleV1').click();
 const publicBlocked=$('gameManualFormV1').hidden;
 const noRootOverflow=document.documentElement.scrollWidth<=innerWidth+3;
 const ok=hasPanel&&initialSteamListed&&unchangedBefore&&opened&&added&&librarySaved&&
   notTouchEvents&&gamePicked&&filtered&&linked&&unchangedAfter&&names&&
   editOpened&&edited&&eventSnapshotRetained&&fileStored&&publicBlocked&&noRootOverflow;
 $('qa-result').textContent=JSON.stringify({ok,width:innerWidth,hasPanel,initialSteamListed,
  unchangedBefore,opened,added,librarySaved,notTouchEvents,gamePicked,filtered,linked,
  unchangedAfter,names,editOpened,edited,eventSnapshotRetained,fileStored,publicBlocked,noRootOverflow,
  saves:saved,gameLibraryLength:data.gameLibrary.length,notices,formHidden:$('gameManualFormV1').hidden});
})().catch(error=>{$('qa-result').textContent=JSON.stringify({ok:false,error:String(error),stack:error.stack})});
});
`;
const tmp=mkdtempSync(path.join(os.tmpdir(),'mws-manual-game-v1-'));
try{
 const page=path.join(tmp,'game.html');
 writeFileSync(page,`<!doctype html><html lang="ko"><head><meta charset="utf-8">
 <meta name="viewport" content="width=device-width,initial-scale=1">
 <style>${core}
 #eventModal{position:static!important;display:block!important;padding:10px!important}
 #eventModal .event-modalbox{max-height:none!important;min-height:350px}
 #calendarGrid{display:none}
 </style></head><body data-mws-mode="admin">
 <div id="calendarGrid"></div><div id="upcomingDashboard"></div>
 <div id="eventModal" class="modal open"><div class="event-modalbox"><div class="event-modal-layout">
 <aside class="event-memo-panel">기존 왼쪽 연속 콘텐츠 및 메모장</aside>
 <section class="event-info-panel"><input id="evTitle" value="방송 1"><button id="saveEventBtn">스케줄 저장</button></section>
 </div></div></div><pre id="qa-result">pending</pre>
 <script>${boot}</script><script>${steam}</script><script>${check}</script>
 </body></html>`,'utf8');
 for(const [width,height] of [[1920,1080],[1366,768],[900,768]]){
  const run=spawnSync(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
   '--disable-background-networking','--no-first-run','--virtual-time-budget=3500',
   '--window-size='+width+','+height,'--dump-dom','file://'+page],
   {encoding:'utf8',timeout:30000,maxBuffer:12*1024*1024});
  assert.equal(run.status,0,'Chrome exit '+width+' '+run.stderr.slice(-1200));
  const match=run.stdout.match(/<pre id="qa-result">([^<]+)<\/pre>/);
  assert(match,'Missing game browser QA '+width+' '+run.stdout.slice(-900));
  const result=JSON.parse(match[1]);
  assert(result.ok,'Game library browser test failed '+width+': '+JSON.stringify(result));
  console.log('GAME_LIBRARY_V1_BROWSER_OK',width,JSON.stringify(result));
 }
}finally{rmSync(tmp,{recursive:true,force:true})}
