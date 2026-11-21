import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {createServer} from 'node:http';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=read('index.html'),entry=read('src/cf-v111-entry.js');
const pos=entry.indexOf('function normalizeCloudCore(');
const transform=vm.runInNewContext(entry.slice(pos,pos+entry.slice(pos).indexOf('\n}\n')+3)+'\nnormalizeCloudCore');
const core=transform(read('assets/cloud-v1.1.js'));
const between=(a,b)=>core.slice(core.indexOf(a),core.indexOf(b,core.indexOf(a)+a.length));
const style=[...index.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n');
const css=['assets/app-core.css','assets/mawang-premium-v1621.css','assets/workspace-clean-v1.css'].map(read).join('\n')+style;
const markup=index.slice(index.indexOf('<body '),index.indexOf('<button type="button" id="mobileNavToggle"'));
assert(markup.includes('class="hidden" aria-modal="true"')&&markup.includes('data-mws-mode="public"'));
const fixture=String.raw`
const $=id=>document.getElementById(id), REMEMBER_KEY='mws_access_remember_v1',MODE_KEY='mws_access_mode_v1';
let mode=null,currentAdmin=null,hydrating=false,hydrationSeq=0,manifest=null,cloudSaveTimer=0,saveRetryTimer=0,saveRun=null,draftBlocked=null;
const loadedParts=new Set(),baselineJson=new Map(),dirtyParts=new Set();
const qa=window.qaEntry={calls:[],session:'valid',saveOk:true,logoutOk:true};
const timeout=p=>p,validateCacheSchema=async()=>{},installSaveBridge=()=>{},installLazyTabBridge=()=>{},updateStorageStatus=()=>{},toast=()=>{},markDirty=()=>{},manualSave=()=>{},loadAdminList=()=>{},addAdmin=()=>{};
window.__mwsPostLoginUiReadyV130=true;
async function fetchJson(url){qa.calls.push(url);if(url==='/api/auth/session'){await new Promise(r=>setTimeout(r,250));return qa.session==='valid'?{authenticated:true,user:{id:1}}:{authenticated:false}}if(url==='/api/auth/logout'){if(!qa.logoutOk)throw Error('fixture logout error');return {ok:true}}throw Error(url)}
async function adminLogin(u,p){qa.calls.push('manual-login');if(u!=='fixture'||p!=='fixture-password')throw Error('fixture invalid credentials');currentAdmin={id:1};return {authenticated:true}}
async function hydrate(chosen){qa.calls.push('hydrate:'+chosen);hydrationSeq++;hydrating=true;await new Promise(r=>setTimeout(r,150));manifest={parts:{core:1}};window.__mwsAppReadyV130=chosen==='admin';applyModeUi();hydrating=false;}
async function writeCloudNow(){qa.calls.push('save');if(qa.saveOk)dirtyParts.clear();return qa.saveOk;}
window.qaDirty=()=>dirtyParts.add('core');
`+between('  function setLoginError(','  function stripPostSources(')+between('  function enterAppShell(','  async function adminLogin(')+between('  let accessBusy=false;','  async function loadAdminList(')+between('  function bindUi()','\n\n')+String.raw`
if(new URL(location.href).searchParams.has('expired'))qa.session='expired';
init();`;
assert.doesNotThrow(()=>new vm.Script(fixture));
const html='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head>'+markup+'<div class="app" inert><main class="main"><h1>캘린더</h1><button id="background">캘린더 사용</button><span id="syncStatusText"></span></main></div><script>'+fixture+'</script></body></html>';
const server=createServer((_req,res)=>{res.setHeader('content-type','text/html; charset=utf-8');res.end(html)});
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-public-entry-'));
let browser;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/';browser=await launchCalendarBrowser(dir);
  const state=()=>browser.evaluate(`(()=>{const $=id=>document.getElementById(id),gate=$('mwsAccessGate'),app=document.querySelector('.app'),box=gate.querySelector('.mws-login-shell').getBoundingClientRect();return {mode:document.body.dataset.mwsMode,gate:getComputedStyle(gate).display!=='none',busy:app.inert,button:$('mwsChangeModeBtn').textContent,ready:!!window.__mwsAppReadyV130,calls:qaEntry.calls,fit:box.left>=0&&box.right<=innerWidth&&box.top>=0&&box.bottom<=innerHeight,password:$('mwsLoginPw').value}})()`);
  const eventually=async fn=>{for(let n=0;n<80;n++){if(await fn())return;await wait(50)}throw Error('state did not settle: '+JSON.stringify(await state()))};
  for(const [w,h] of [[1366,768],[1920,1080],[2560,1440],[390,844]]){
    await browser.navigate(url+'?size='+w,w,h);assert.equal((await state()).gate,false);
    await eventually(async()=>!(await state()).busy);let s=await state();assert.equal(s.mode,'public');assert.deepEqual(s.calls,['hydrate:public']);
    await browser.evaluate("document.getElementById('mwsChangeModeBtn').click()");s=await state();assert(s.gate&&s.busy&&s.fit,JSON.stringify(s));
    await browser.evaluate("document.getElementById('mwsLoginBack').click()");s=await state();assert(!s.gate&&!s.busy);console.log('MWS_PUBLIC_ENTRY_VIEWPORT_OK',w,h);
  }
  await browser.evaluate("document.getElementById('mwsChangeModeBtn').click();document.getElementById('mwsLoginId').value='fixture';document.getElementById('mwsLoginPw').value='fixture-password';document.getElementById('mwsLoginForm').requestSubmit()");
  await eventually(async()=>{const s=await state();return s.mode==='admin'&&!s.gate&&!s.busy});assert.equal((await state()).password,'');
  await browser.navigate(url+'?restore',1366,768);assert.equal((await state()).gate,false);await eventually(async()=>!(await state()).busy);let s=await state();assert.equal(s.mode,'admin');assert.deepEqual(s.calls,['/api/auth/session','hydrate:admin']);
  await browser.evaluate("qaDirty();qaEntry.saveOk=false;document.getElementById('mwsChangeModeBtn').click()");await eventually(async()=>!(await state()).busy);s=await state();assert.equal(s.mode,'admin');assert(!s.calls.includes('/api/auth/logout'));
  await browser.evaluate("qaEntry.saveOk=true;qaEntry.logoutOk=false;document.getElementById('mwsChangeModeBtn').click()");await eventually(async()=>!(await state()).busy);assert.equal((await state()).mode,'admin');
  await browser.evaluate("qaEntry.logoutOk=true;document.getElementById('mwsChangeModeBtn').click()");await eventually(async()=>{const s=await state();return s.mode==='public'&&!s.busy});s=await state();assert(!s.gate);assert.deepEqual(s.calls.slice(-2),['/api/auth/logout','hydrate:public']);
  await browser.evaluate("localStorage.setItem('mws_access_remember_v1','1');localStorage.setItem('mws_access_mode_v1','admin')");
  await browser.navigate(url+'?expired',1366,768);assert.equal((await state()).gate,false);await eventually(async()=>!(await state()).busy);s=await state();assert.equal(s.mode,'public');assert.deepEqual(s.calls,['/api/auth/session','hydrate:public']);
  console.log('MWS_PUBLIC_ENTRY_AUTH_LIFECYCLE_OK',JSON.stringify(s));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));rmSync(dir,{recursive:true,force:true})}
