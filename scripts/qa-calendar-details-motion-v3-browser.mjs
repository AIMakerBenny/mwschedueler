import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
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
 const ready=()=>new Promise((resolve,reject)=>{const start=performance.now();function next(){if($('#calendarEventDetailsV1').getAnimations().length){resolve();return}if(performance.now()-start>800){reject(Error('Missing prepared drawer animation'));return}requestAnimationFrame(next)}requestAnimationFrame(next)});
 await ready();
 const drawer=$('#calendarEventDetailsV1'),animation=drawer.getAnimations()[0];
 const explicitMotion=Boolean(animation)&&animation.effect.getTiming().duration===360&&animation.effect.getTiming().easing==='cubic-bezier(0.4, 0, 0.6, 1)';
 const opaqueSlide=animation.effect.getKeyframes().every(frame=>frame.opacity===undefined);
 animation.pause();animation.currentTime=180;await tick();
 const main=document.querySelector('.app>.main'),layout=main.getAnimations()[0];
 const calendarUsesCompositor=Boolean(layout)&&layout.effect.getKeyframes().every(frame=>frame.width===undefined&&frame.marginRight===undefined)&&getComputedStyle(main).transitionProperty==='none';
 let resizeCount=0;const resizeObserver=new ResizeObserver(()=>resizeCount++);resizeObserver.observe(main);
 for(const t of [25,75,125,175,225,275]){layout.pause();layout.currentTime=t;await tick()}
 const noPerFrameRelayout=resizeCount<=2;resizeObserver.disconnect();
 const matrix=new DOMMatrix(getComputedStyle(drawer).transform),middle=matrix.m41;
 const entersThroughIntermediatePosition=middle>drawer.getBoundingClientRect().width*.42&&middle<drawer.getBoundingClientRect().width*.62;
 window.dispatchEvent(new Event('mawang:datachange'));await tick();
 const refreshKeepsMotion=drawer.getAnimations()[0]===animation;
 animation.finish();await tick();
 const finalPosition=Math.abs(new DOMMatrix(getComputedStyle(drawer).transform).m41)<1;
 const detailImage=drawer.querySelector('.calendar-preview-game-v3 img'),hoverImage=$('#calendarEventPreview .calendar-preview-game-v3 img');
 const uploadedImageDecoded=detailImage?.complete&&detailImage.naturalWidth>0&&hoverImage?.complete&&hoverImage.naturalWidth>0;
 const oneGameSection=drawer.querySelectorAll('.calendar-preview-game-v3').length===1;
 $('#background').click();await ready();const exit=drawer.getAnimations()[0];exit.pause();exit.currentTime=180;await tick();
 const leaving=new DOMMatrix(getComputedStyle(drawer).transform).m41;
 const exitsThroughIntermediatePosition=leaving>1&&leaving<drawer.getBoundingClientRect().width*1.04;
 exit.finish();await tick();const backgroundCloses=drawer.hidden&&!window.mwsCalendarDetailsV1.isOpen()&&editorOpens===0;
 $('#qaCard').click();$('#calendarDetailsCloseV1').click();$('#qaCard').click();await ready();
 const reopening=drawer.getAnimations()[0];reopening.finish();await tick();
 const rapidReopenStable=!drawer.hidden&&window.mwsCalendarDetailsV1.isOpen()&&drawer.classList.contains('open');
 $('#result').textContent=JSON.stringify({explicitMotion,opaqueSlide,calendarUsesCompositor,noPerFrameRelayout,entersThroughIntermediatePosition,refreshKeepsMotion,finalPosition,uploadedImageDecoded,oneGameSection,exitsThroughIntermediatePosition,backgroundCloses,rapidReopenStable,noMutation:baseline===JSON.stringify(data)});
});`;
function fixture(test){return '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'\nbody{margin:0;padding:16px;background:#101217;color:#eef0f5}.main{padding:12px}#calendarEventPreview{position:static;display:block;visibility:visible;opacity:1;pointer-events:auto;max-width:500px;margin-top:28px}#result{position:fixed;visibility:hidden}</style><body><div class="app"><main class="main"><section id="calendar" class="section active"><h1>캘린더</h1><div id="calendarGrid"><div class="day"><button id="qaCard" class="mini-event" data-evid="qa">10:41 와우 포에버</button><button id="background">달력 바탕</button></div></div><div id="calendarEventPreview"></div></section></main></div><pre id="result">pending</pre><script>'+read('assets/calendar-details-v1.js')+'</script><script>'+setup+(test?checks:'')+'</script></body></html>'}
if(process.env.MWS_MOTION_FIXTURE){writeFileSync(process.env.MWS_MOTION_FIXTURE,fixture(false));process.exit(0)}
const temp=mkdtempSync(path.join(os.tmpdir(),'mws-motion-'));
let browser;
try{const file=path.join(temp,'index.html');writeFileSync(file,fixture(true));
 browser=await launchCalendarBrowser(temp);
 for(const[width,height]of [[1366,768],[1920,1080],[2560,1440],[2560,1080]]){
  await browser.navigate(pathToFileURL(file).href+'?size='+width+'x'+height,width,height);
  const result=await browser.evaluate(`new Promise((resolve,reject)=>{const start=performance.now();const check=()=>{const value=document.querySelector('#result')?.textContent;if(value&&value!=='pending'){resolve(JSON.parse(value));return}if(performance.now()-start>6000){reject(new Error('Missing motion result'));return}setTimeout(check,25)};check()})`);
  for(const[key,value]of Object.entries(result))assert.equal(value,true,width+'x'+height+' '+key+' '+JSON.stringify(result));console.log('CALENDAR_MOTION_IMAGE_V3_OK',width,height,JSON.stringify(result));
 }
 const reducedFile=path.join(temp,'reduced.html');writeFileSync(reducedFile,fixture(false));
 await browser.setReducedMotion(true);
 await browser.navigate(pathToFileURL(reducedFile).href,1366,768);
 const preference=await browser.evaluate(`(async()=>{const $=s=>document.querySelector(s),ready=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))));$('#qaCard').click();await ready();const d=$('#calendarEventDetailsV1'),a=d.getAnimations()[0];const defaultOpen=a?.effect.getTiming().duration===360;const noPreferenceControl=d.querySelectorAll('header button').length===1&&!$('#calendarDetailsMotionV6');a.finish();await ready();$('#calendarDetailsCloseV1').click();await ready();const exit=d.getAnimations()[0];const defaultClose=exit?.effect.getTiming().duration===360;exit.finish();await ready();return {reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,defaultOpen,defaultClose,noPreferenceControl,closed:d.hidden}})()`);
 for(const value of Object.values(preference))assert.equal(value,true,JSON.stringify(preference));console.log('CALENDAR_MOTION_DEFAULT_V7_OK',JSON.stringify(preference));
}finally{await browser?.close();rmSync(temp,{recursive:true,force:true})}
