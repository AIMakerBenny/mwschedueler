import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const core=read('assets/app-core.js');
const game=core.slice(core.indexOf('function calendarGamePreviewV3('),core.indexOf('function positionCalendarEventPreview('));
const detail=core.slice(core.indexOf('function openCalendarEventDetailsV1(id){'),core.indexOf('let calendarSuppressEventClickV174='));
const css=['app-core.css','workspace-clean-v1.css','calendar-details-v1.css'].map(n=>read('assets/'+n)).join('\n');
const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aBfkAAAAASUVORK5CYII=';
const setup=`
const data={events:[{id:'qa',title:'와우 포에버',date:'2026-11-18',start:'10:41',end:'02:40',steamGame:{source:'manual',id:'manual:wow',name:'와우 포에버',image:''}}],contentGroups:[],gameLibrary:[{source:'manual',id:'manual:wow',name:'와우 포에버',image:${JSON.stringify(image)}}]};
const baseline=JSON.stringify(data);let editorOpens=0;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const category=()=>null,eventParticipantRows=()=>[],formatDateWeekday=s=>s,formatTimeKorean=s=>s,deviceChip=()=>'<span>PC</span>';
function hideCalendarEventPreview(){}function openEvent(){editorOpens++}
${game}\n${detail}
document.getElementById('qaCard').onclick=()=>openCalendarEventDetailsV1('qa');
document.getElementById('calendarEventPreview').innerHTML=calendarPreviewHTML(data.events[0]);
`;
const checks=`
const tick=()=>new Promise(r=>setTimeout(r,35));
window.addEventListener('DOMContentLoaded',async()=>{
 const $=s=>document.querySelector(s);await tick();$('#qaCard').click();
 const drawer=$('#calendarEventDetailsV1'),animation=drawer.getAnimations()[0];
 const explicitMotion=Boolean(animation)&&animation.effect.getTiming().duration===320;
 animation.pause();animation.currentTime=160;await tick();
 const matrix=new DOMMatrix(getComputedStyle(drawer).transform),middle=matrix.m41;
 const entersThroughIntermediatePosition=middle>1&&middle<drawer.getBoundingClientRect().width;
 window.dispatchEvent(new Event('mawang:datachange'));await tick();
 const refreshKeepsMotion=drawer.getAnimations()[0]===animation;
 animation.finish();await tick();
 const finalPosition=Math.abs(new DOMMatrix(getComputedStyle(drawer).transform).m41)<1;
 const detailImage=drawer.querySelector('.calendar-preview-game-v3 img'),hoverImage=$('#calendarEventPreview .calendar-preview-game-v3 img');
 const uploadedImageDecoded=detailImage?.complete&&detailImage.naturalWidth>0&&hoverImage?.complete&&hoverImage.naturalWidth>0;
 const oneGameSection=drawer.querySelectorAll('.calendar-preview-game-v3').length===1;
 $('#background').click();const exit=drawer.getAnimations()[0];exit.pause();exit.currentTime=160;await tick();
 const leaving=new DOMMatrix(getComputedStyle(drawer).transform).m41;
 const exitsThroughIntermediatePosition=leaving>1&&leaving<drawer.getBoundingClientRect().width*1.04;
 exit.finish();await tick();const backgroundCloses=drawer.hidden&&!window.mwsCalendarDetailsV1.isOpen()&&editorOpens===0;
 $('#qaCard').click();$('#calendarDetailsCloseV1').click();$('#qaCard').click();
 const reopening=drawer.getAnimations()[0];reopening.finish();await tick();
 const rapidReopenStable=!drawer.hidden&&window.mwsCalendarDetailsV1.isOpen()&&drawer.classList.contains('open');
 $('#result').textContent=JSON.stringify({explicitMotion,entersThroughIntermediatePosition,refreshKeepsMotion,finalPosition,uploadedImageDecoded,oneGameSection,exitsThroughIntermediatePosition,backgroundCloses,rapidReopenStable,noMutation:baseline===JSON.stringify(data)});
});`;
function fixture(test){return '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'\nbody{margin:0;padding:16px;background:#101217;color:#eef0f5}.main{padding:12px}#calendarEventPreview{position:static;display:block;visibility:visible;opacity:1;pointer-events:auto;max-width:500px;margin-top:28px}#result{position:fixed;visibility:hidden}</style><body><div class="app"><main class="main"><section id="calendar" class="section active"><h1>캘린더</h1><div id="calendarGrid"><div class="day"><button id="qaCard" class="mini-event" data-evid="qa">10:41 와우 포에버</button><button id="background">달력 바탕</button></div></div><div id="calendarEventPreview"></div></section></main></div><pre id="result">pending</pre><script>'+read('assets/calendar-details-v1.js')+'</script><script>'+setup+(test?checks:'')+'</script></body></html>'}
if(process.env.MWS_MOTION_FIXTURE){writeFileSync(process.env.MWS_MOTION_FIXTURE,fixture(false));process.exit(0)}
const temp=mkdtempSync(path.join(os.tmpdir(),'mws-motion-'));
try{const file=path.join(temp,'index.html');writeFileSync(file,fixture(true));
 const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser'].map(n=>spawnSync('which',[n],{encoding:'utf8'})).find(r=>r.status===0)?.stdout.trim();assert(chrome,'Chromium required');
 for(const[width,height]of [[1366,768],[1920,1080],[2560,1440],[2560,1080]]){
  const run=spawnSync(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--disable-background-networking','--virtual-time-budget=2500','--window-size='+width+','+height,'--dump-dom','file://'+file],{encoding:'utf8',timeout:30000,maxBuffer:18*1024*1024});
  assert.equal(run.status,0,run.stderr.slice(-700));const match=run.stdout.match(/<pre id="result">([^<]+)<\/pre>/);assert(match,'Missing motion result');const result=JSON.parse(match[1]);for(const[key,value]of Object.entries(result))assert.equal(value,true,width+'x'+height+' '+key+' '+JSON.stringify(result));console.log('CALENDAR_MOTION_IMAGE_V3_OK',width,height,JSON.stringify(result));
 }
}finally{rmSync(temp,{recursive:true,force:true})}
