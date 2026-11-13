import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const load=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const manager=load('assets/calendar-content-groups-v2.js');
const html=load('index.html');
assert(html.includes('calendar-content-groups-v2.js?v=8-recovery-manager'));
const chrome=['google-chrome','google-chrome-stable','chromium','chromium-browser']
  .map(x=>spawnSync('which',[x],{encoding:'utf8'})).find(x=>x.status===0)?.stdout.trim();
assert(chrome,'Chromium unavailable');
const fixture=Array.from({length:19},(_,i)=>({
 id:'event-'+i,date:'2026-11-'+String(i+1).padStart(2,'0'),
 title:(i<9?'SBO 관련 일정 ':i<15?'와우 진행 일정 ':'기타 게임 방송 ')+i,
 start:'20:00',end:'22:00',restDay:false,
 contentGroupId:i<9?'lost-original-a':i<15?'lost-original-b':'lost-original-c'
}));
const setup=[
 'let data={contentGroups:[],events:'+JSON.stringify(fixture)+'};',
 'let saveCalls=0,serverCore={contentGroups:[]},serverEvents=structuredClone(data.events);',
 'let discardWrites=false,notices=[];',
 'function toast(...args){notices.push(args.join(" : "))}',
 'function saveData(reason){saveCalls++;dispatchEvent(new CustomEvent("mawang:datachange",{detail:{reason}}));return true}',
 'function confirm(){return true} function hideCalendarEventPreview(){}',
 'document.body.dataset.mwsMode="admin";window.__mwsAppReadyV130=true;',
 'window.mwsV55SaveNow=async()=>{if(!discardWrites){serverCore={contentGroups:structuredClone(data.contentGroups)};serverEvents=structuredClone(data.events)}return true;};',
 'window.fetch=async url=>({ok:true,json:async()=>({data:String(url).includes("/core")?structuredClone(serverCore):structuredClone(serverEvents)})});'
].join('\n');
const check=[
 '(async()=>{',
 'const $=id=>document.getElementById(id);const sleep=()=>new Promise(r=>setTimeout(r,30));',
 'const m=window.mwsCalendarContentGroupsV2;',
 'const start=$("calendarGroupRecoveryPanelV1"),manager=$("calendarGroupManagerRecoveryV1");',
 'const initial=!start&&manager?.tagName==="DETAILS"&&!manager.open&&manager.querySelectorAll(".calendar-group-recovery-row-v1").length===3;',
 'const initialNoGroups=data.contentGroups.length===0;',
 'const originalNameField=manager.querySelector(".calendar-group-recovery-row-v1 input[type=text]");',
 'originalNameField.value="임시 이름 입력";dispatchEvent(new Event("mawang:datachange"));',
 'const inputPreserved=originalNameField===manager.querySelector(".calendar-group-recovery-row-v1 input[type=text]")&&originalNameField.value==="임시 이름 입력";',
 'const originalLinks=data.events.map(e=>[e.id,e.contentGroupId]);',
 'const originals=["lost-original-a","lost-original-b","lost-original-c"];',
 'const labels=["SBO","와우 포에버","다른 게임 프로젝트"];',
 'for(let i=0;i<3;i++){',
 ' const row=$("calendarGroupManagerRecoveryV1").querySelector(".calendar-group-recovery-row-v1");',
 ' if(!row)throw Error("Recovery row missing "+i);',
 ' row.querySelector("input[type=text]").value=labels[i];',
 ' row.querySelector("input[type=color]").value=["#7659a5","#0f8c95","#a54d59"][i];',
 ' row.querySelector("button").click();await sleep();',
 '}',
 'const groupsSaved=serverCore.contentGroups.length===3&&originals.every((id,i)=>serverCore.contentGroups.some(g=>g.id===id&&g.name===labels[i]));',
 'const linksIntact=data.events.length===19&&originalLinks.every(([id,link])=>data.events.find(e=>e.id===id).contentGroupId===link);',
 'const noOrphans=$("calendarGroupManagerRecoveryV1").hidden;',
 'const managerOptions=$("calendarGroupTargetV2").options.length===4;',
 'data={events:structuredClone(serverEvents),contentGroups:structuredClone(serverCore.contentGroups)};',
 'dispatchEvent(new Event("mws:app-ready"));',
 'const reloadNames=$("calendarGroupTargetV2").options.length===4&&m.groups().length===3&&m.find("lost-original-b")?.name==="와우 포에버";',
 'discardWrites=true;$("calendarGroupNewNameV2").value="저장 실패 테스트";',
 '$("calendarGroupCreateV2").click();await sleep();',
 'const error=$("calendarGroupPanelV2").querySelector(".calendar-group-persist-status-v1");',
 'const refusedFalseSuccess=error?.classList.contains("error")&&error?.textContent.includes("온라인 저장 실패");',
 'const serverUntouched=serverCore.contentGroups.length===3;',
 'const noFakeSuccess=!notices.some(x=>x.includes("저장 실패 테스트")&&x.includes("온라인 저장 완료"));',
 'discardWrites=false;data={events:structuredClone(serverEvents),contentGroups:[]};serverCore={contentGroups:[]};',
 'dispatchEvent(new Event("mws:app-ready"));',
 'const bulkButton=$("calendarGroupManagerRecoveryV1").querySelector(".calendar-group-bulk-recovery-v1");',
 'const bulkShown=Boolean(bulkButton)&&!$("calendarGroupManagerRecoveryV1").hidden&&!manager.open;manager.open=true;',
 'bulkButton?.click();await sleep();',
 'const bulkRestored=serverCore.contentGroups.length===3&&originals.every(id=>serverCore.contentGroups.some(g=>g.id===id&&g.name.startsWith("이름 미확인 그룹 ")&&g.color==="#808080"));',
 'const bulkLinksIntact=data.events.length===19&&originalLinks.every(([id,link])=>data.events.find(e=>e.id===id).contentGroupId===link);',
 'const bulkHidesRecovery=$("calendarGroupManagerRecoveryV1").hidden;',
 'const ok=initial&&initialNoGroups&&inputPreserved&&groupsSaved&&linksIntact&&noOrphans&&managerOptions&&reloadNames&&refusedFalseSuccess&&serverUntouched&&noFakeSuccess&&bulkShown&&bulkRestored&&bulkLinksIntact&&bulkHidesRecovery;',
 '$("qa-result").textContent=JSON.stringify({ok,initial,initialNoGroups,inputPreserved,groupsSaved,linksIntact,noOrphans,managerOptions,reloadNames,refusedFalseSuccess,serverUntouched,noFakeSuccess,bulkShown,bulkRestored,bulkLinksIntact,bulkHidesRecovery,recovered:serverCore.contentGroups.length,events:serverEvents.length,saves:saveCalls});',
 '})().catch(error=>{document.getElementById("qa-result").textContent=JSON.stringify({ok:false,error:String(error),stack:error.stack})});'
].join('\n');
const controls='<section id="calendar"><button id="calendarGroupToggleV2"></button><button id="calendarGroupManageToggleV4"></button>'+
'<div id="calendarGroupPanelV2" hidden><span id="calendarGroupCountV2"></span><button id="calendarGroupCancelV2"></button>'+
'<button id="calendarGroupApplyV2"></button><button id="calendarGroupClearV2"></button><button id="calendarGroupCreateV2"></button>'+
'<input id="calendarGroupNewNameV2"><input type="color" id="calendarGroupNewColorV2" value="#0f8c95"><select id="calendarGroupTargetV2"></select></div>'+
'<div id="calendarGroupManagerPanelV4" hidden><button id="calendarGroupManageCloseV4"></button><select id="calendarGroupManageTargetV4"></select>'+
'<input id="calendarGroupRenameV2"><input type="color" id="calendarGroupRecolorV2"><button id="calendarGroupUpdateV2"></button><button id="calendarGroupDeleteV2"></button></div>'+
'<div id="calendarGrid"></div></section><select id="evContentGroupV2"></select><div id="evContentGroupNewWrapV2" hidden>'+
'<input id="evContentGroupNewNameV2"><input type="color" id="evContentGroupNewColorV2"><button id="evContentGroupCreateV2"></button></div>'+
'<pre id="qa-result">pending</pre>';
const folder=mkdtempSync(path.join(os.tmpdir(),'mws-orphan-group-recovery-'));
try{
 const filename=path.join(folder,'index.html');
 writeFileSync(filename,'<!doctype html><html lang="ko"><head><meta charset="utf-8">'+
 '<style>:root{--accent:#8254ba;--border:#333;--panel:#141522;--text:white;--muted:#aaa;--input:#10121a}[hidden]{display:none!important}</style></head>'+
 '<body>'+controls+'<script>'+setup+'</script><script>'+manager+'</script><script>'+check+'</script></body></html>','utf8');
 const run=spawnSync(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--disable-background-networking','--no-first-run','--virtual-time-budget=2500',
 '--window-size=1898,902','--dump-dom','file://'+filename],{encoding:'utf8',timeout:30000,maxBuffer:12*1024*1024});
 assert.equal(run.status,0,'Chrome failed: '+run.stderr.slice(-1000));
 const match=run.stdout.match(/<pre id="qa-result">([^<]+)<\/pre>/);
 assert(match,'Browser result missing '+run.stdout.slice(-900));
 const result=JSON.parse(match[1]);
 assert(result.ok,'Orphan recovery test failed '+JSON.stringify(result));
 console.log('CALENDAR_ORPHAN_RECOVERY_V1_OK',JSON.stringify(result));
}finally{rmSync(folder,{recursive:true,force:true})}
