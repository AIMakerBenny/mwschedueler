/* CF MWS V 1.0.6 - bridge global lexical app state into tool patch */
(()=>{
'use strict';
if(window.__mwsToolsBridgeV106)return;window.__mwsToolsBridgeV106=1;
try{if(typeof data!=='undefined')window.data=data}catch(_){ }
try{if(typeof saveData==='function'&&!window.saveData)window.saveData=saveData}catch(_){ }
try{if(typeof persist==='function'&&!window.persist)window.persist=persist}catch(_){ }
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const color=t=>({'친함':'#22c55e','협업':'#38bdf8','라이벌':'#f43f5e','소속':'#f59e0b','기타':'#8b5cf6'}[t]||'#8b5cf6');
function syncGlobal(){try{if(typeof data!=='undefined')window.data=data}catch(_){}}
function fixEdges(){
  syncGlobal();
  const r=window.data?.miniGames?.toolsV1?.relations,svg=document.querySelector('#mwsRelationBoard .mws-rel-svg');
  if(!r||!svg)return;
  const groups=new Map();
  for(const e of Array.isArray(r.edges)?r.edges:[]){const k=[String(e.a),String(e.b)].sort().join('|');if(!groups.has(k))groups.set(k,[]);groups.get(k).push(e)}
  const out=[];
  for(const list of groups.values())list.forEach((e,i)=>{
    const a=r.nodes?.[e.a],b=r.nodes?.[e.b];if(!a||!b)return;
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,off=(i-(list.length-1)/2)*1.9,ox=-dy/len*off,oy=dx/len*off;
    const x1=a.x+ox,y1=a.y+oy,x2=b.x+ox,y2=b.y+oy,tx=(a.x+b.x)/2+ox,ty=(a.y+b.y)/2+oy;
    out.push(`<line x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%" style="stroke:${color(e.type)}"></line><text x="${tx}%" y="${ty}%" text-anchor="middle">${esc(e.label||e.type)}</text>`)
  });
  const sig=(Array.isArray(r.edges)?r.edges.map(e=>`${e.id}|${e.a}|${e.b}|${e.type}|${e.label}`).join('~'):'');
  if(svg.dataset.v106LineSig!==sig){svg.dataset.v106LineSig=sig;svg.innerHTML=out.join('')}
}
let raf=0;const mo=new MutationObserver(()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;syncGlobal();fixEdges()})});
mo.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('mawang:datachange',()=>setTimeout(()=>{syncGlobal();fixEdges()},0));
[0,100,300,700,1500,3000,6000].forEach(ms=>setTimeout(()=>{syncGlobal();fixEdges()},ms));
})();
