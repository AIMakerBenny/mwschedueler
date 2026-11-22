import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

// Real action owners and real Chromium pointer events, but deliberately no
// network, cloud runtime, production data or persistence credentials.
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const core=read('assets/app-core.js'),tools=read('assets/tools.js');
const slice=(s,a,b)=>{const start=s.indexOf(a),end=s.indexOf(b,start+1);assert(start>=0&&end>start,a);return s.slice(start,end)};
const script=`
const data={events:[{id:'original',title:'QA event',date:'2026-11-21',completed:true,contentGroupId:'group',seriesId:'series'}],scheduleClipboard:[],memos:[{id:'memo',title:'old',content:''}]};
let editingMemoId='memo',calendarDragPayload=null,calendarSuppressEventClickV174=null,calendarCtrlCopyMode=false,calendarViewModeV172='month';
const writes=[],moves=[];const saveData=reason=>{writes.push(reason);return true};const toast=()=>{},formatDate=s=>s,isCalendarTabActive=()=>true,hideCalendarEventPreview=()=>{},memoById=id=>data.memos.find(m=>m.id===id);
const post={comments:[{id:'comment',status:'pending'}]};const postById=()=>post,syncPostContactApplicationHistories=()=>{},renderPostsAfterSaveV148=()=>{};
window.mwsCanEditCalendarClipboardV1=()=>true;window.mwsCalendarMoveGuardV4={recordMove:(...args)=>moves.push(args)};
${slice(core,'function cloneEventAsTemplate','function clipboardChipColor')}
${slice(core,'let calendarPointerEventDragV174','function renderCalendar(){')}
${slice(core,'function saveCurrentMemo(){','function deleteCurrentMemo(){')}
${slice(core,'window.updatePostApplicantStatus=(postId,commentId,status)=>{const p=postById(postId),c=p?.comments.find(x=>x.id===commentId);if(!c)return;const previous=c.status;','window.setPostApplicantDecision=')}
${slice(tools,'window.mwsToolsDrag=','window.mwsToolsOver=')}
document.querySelector('.mini-event').onpointerdown=e=>beginCalendarPointerEventDragV174(e,e.currentTarget);
document.querySelector('#saveMemoBtn').onclick=saveCurrentMemo;
document.querySelector('#approve').onclick=()=>updatePostApplicantStatus('post','comment','selected');
`;
new Function(script);
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-ui-mutations-')),file=path.join(dir,'fixture.html');
writeFileSync(file,`<!doctype html><meta charset="utf-8"><style>${read('assets/ui-interactions-v1.css')} #calendarGrid{display:flex;gap:20px}.day{width:180px;height:140px;border:1px solid #888}.mini-event{height:32px;background:#334155;color:white}.calendar-event-pointer-ghost-v174{position:fixed;pointer-events:none}#calendarCopyTrayToggleV4{position:absolute;left:440px;top:50px}</style><body data-device-mode="pc" data-resolution="fhd"><section id="calendar" class="section active"><div id="calendarGrid"><div class="day" data-date="2026-11-21"><div class="mini-event" data-evid="original"><span class="mini-event-main">QA event</span></div></div><div class="day" data-date="2026-11-22"></div></div><button id="calendarCopyTrayToggleV4">Copy</button></section><section id="memos"><input id="memoTitleInput" value="QA memo"><textarea id="memoContentInput">QA content</textarea><button id="saveMemoBtn">Save</button></section><section id="posts"><div class="post-applicant-card" data-comment-id="comment"><button id="approve">Approve</button></div></section><section id="toolTier"><div id="source" class="mws-contact-chip" draggable="true">Card</div></section><script>${read('assets/ui-interactions-v1.js')}</script><script>${script}</script></body>`);
let browser;
try{
  browser=await launchCalendarBrowser(dir);await browser.navigate(pathToFileURL(file).href,1366,768);
  const point=selector=>browser.evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})()`);
  const source=await point('.mini-event'),dest=await point('[data-date="2026-11-22"]');
  await browser.mouseDown(source.x,source.y);await browser.mouseDrag(dest.x,dest.y);
  assert(await browser.evaluate(`!!document.querySelector('.calendar-event-pointer-ghost-v174')&&document.querySelector('[data-date="2026-11-22"]').classList.contains('drag-over')`));
  await browser.mouseUp(dest.x,dest.y);
  assert.deepEqual(await browser.evaluate(`({date:data.events[0].date,moves:moves.length,ghost:!!document.querySelector('.calendar-event-pointer-ghost-v174')})`),{date:'2026-11-22',moves:1,ghost:false});
  const tray=await point('#calendarCopyTrayToggleV4');await browser.mouseDown(source.x,source.y);await browser.mouseDrag(tray.x,tray.y);await browser.mouseUp(tray.x,tray.y);
  assert.equal(await browser.evaluate('data.scheduleClipboard.length'),1);
  const result=await browser.evaluate(`(()=>{const original=JSON.stringify(data.events[0]),item=data.scheduleClipboard[0],copy=createEventFromClipboardItem(item.id,'2026-11-24');return {originalUnchanged:JSON.stringify(data.events[0])===original,newId:copy.id!==data.events[0].id,date:copy.date,group:copy.contentGroupId,series:copy.seriesId,complete:copy.completed,copyCount:data.events.length}})()`);
  assert.deepEqual(result,{originalUnchanged:true,newId:true,date:'2026-11-24',group:'group',series:'',complete:false,copyCount:2});
  await browser.evaluate(`document.getElementById('saveMemoBtn').click();document.getElementById('approve').click()`);
  assert.deepEqual(await browser.evaluate(`({title:data.memos[0].title,content:data.memos[0].content,status:post.comments[0].status,writes})`),{title:'QA memo',content:'QA content',status:'selected',writes:['일정 이동','캘린더 복사 보관함 추가','복사 보관함에서 일정 추가','메모 저장','게시글 신청자 상태 변경']});
  assert(await browser.evaluate(`(()=>{const node=document.getElementById('source'),transfer=new DataTransfer();node.ondragstart=e=>mwsToolsDrag(e,'contact');node.dispatchEvent(new DragEvent('dragstart',{dataTransfer:transfer}));const active=node.classList.contains('mws-ui-drag-source')&&transfer.getData('text/mws-contact')==='contact';node.dispatchEvent(new DragEvent('dragend',{dataTransfer:transfer}));return active&&!node.classList.contains('mws-ui-drag-source')})()`));
  console.log('MWS_UI_MUTATIONS_V2_OK',JSON.stringify(result));
}finally{await browser?.close();rmSync(dir,{recursive:true,force:true})}
