/* CF MWS V 1.0.6 tool patch loader */
(()=>{
'use strict';
if(window.__mwsToolsLoaderV106)return;window.__mwsToolsLoaderV106=1;
const parts=Array.from({length:7},(_,i)=>`/assets/tools-v1.0.6-b64-${i+1}.txt?v=1.0.6`);
const expected='4895d3261d6d9b69c3052d61689290c94991387ea70c7225dd966c25fae74f62';
(async()=>{try{
 const texts=await Promise.all(parts.map(async u=>{const r=await fetch(u,{cache:'force-cache'});if(!r.ok)throw new Error(`tool patch ${r.status}`);return (await r.text()).trim()}));
 const raw=atob(texts.join(''));const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));const code=new TextDecoder().decode(bytes);
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code));const actual=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(actual!==expected)throw new Error('tool patch integrity check failed');
 (0,eval)(code);
}catch(e){console.error('V1.0.6 tool patch load failed',e)}})();
})();
