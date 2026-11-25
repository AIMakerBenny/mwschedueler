// Stage 3–5 safe source cleanup. Never remove unlike values or conditional fallbacks.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(p=>p.endsWith('.css'));
function scan(s,start,end,cb){let q='',par=0,br=0;for(let i=start;i<end;i++){const c=s[i],n=s[i+1];if(q){if(c==='\\')i++;else if(c===q)q='';continue}if(c==='/'&&n==='*'){const j=s.indexOf('*/',i+2);i=j<0?end:j+1;continue}if(c==='\\'){i++;continue}if(c==='"'||c==="'"){q=c;continue}if(c==='(')par++;else if(c===')')par=Math.max(0,par-1);else if(c==='[')br++;else if(c===']')br=Math.max(0,br-1);else if(!par&&!br&&cb(c,i)===false)return i}return end}
function removeDuplicates(s){
 const declarations=[],skip=[];
 function walk(start,end,ctx){let from=start;while(from<end){let kind='';const open=scan(s,from,end,c=>{if(c==='{'||c===';'||c==='}'){kind=c;return false}});if(open===end)break;if(kind!=='{'){from=open+1;continue}
  const header=s.slice(from,open).replace(/^\s*(?:\/\*[\s\S]*?\*\/\s*)*/,'').trim();
  let depth=1;const close=scan(s,open+1,end,c=>{if(c==='{')depth++;else if(c==='}'&&--depth===0)return false});if(close===end)throw Error('Unclosed CSS block');
  if(/^@(media|supports|container)\b/i.test(header))walk(open+1,close,[...ctx,header]);
  else if(!header.startsWith('@')&&header&&!header.includes('/*')){
   let seg=open+1;const parts=[];let nested=false;
   scan(s,open+1,close,(c,i)=>{if(c==='{'||c==='}')nested=true;if(c===';'){parts.push([seg,i+1]);seg=i+1}});
   if(seg<close)parts.push([seg,close]);
   if(!nested)for(const [a,b] of parts){
    const raw=s.slice(a,b),m=raw.match(/^(\s*)(--[\w-]+|-?[a-zA-Z][\w-]*)\s*:\s*([\s\S]*?)(?:;\s*)?$/);
    if(!m||raw.includes('/*'))continue;
    const property=m[2].startsWith('--')?m[2]:m[2].toLowerCase(),value=m[3].trim();
    // CSS-wide rollback, animation timelines and custom properties retain every declaration.
    if(!value||property.startsWith('--')||/^(?:animation|transition|all)(?:-|$)/.test(property)||/\brevert(?:-layer)?\b/.test(value))continue;
    declarations.push({key:JSON.stringify([ctx,header,property,value]),selector:header,context:ctx,property,value,a:a+m[1].length,b,line:s.slice(0,a+m[1].length).split('\n').length});
   }
  }from=close+1;
 }}
 walk(0,s.length,[]);
 const seen=new Set(),removed=[];
 for(let i=declarations.length-1;i>=0;i--){const d=declarations[i];if(seen.has(d.key))removed.push(d);else seen.add(d.key)}
 let out=s;for(const d of removed.sort((a,b)=>b.a-a.a))out=out.slice(0,d.a)+out.slice(d.a,d.b).replace(/[^\n\r]/g,'')+out.slice(d.b);
 return {out,removed};
}
const fixture='.x{color:red; padding:1px}.x{color:blue}.x{color:red; padding:1px}@media(max-width:2px){.x{color:red}}';
const check=removeDuplicates(fixture);assert.equal(check.removed.length,2);assert(check.out.includes('color:blue'));assert(check.out.includes('@media(max-width:2px){.x{color:red}}'));assert.equal(removeDuplicates(check.out).removed.length,0);
let html=read('index.html');const initial=[...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)];
const findings=[];for(const file of files){
 const source=read(file);if(/@(?:import|namespace|layer|scope)\b/.test(source))continue;
 const {out,removed}=removeDuplicates(source);if(!removed.length)continue;
 assert.equal(removeDuplicates(out).removed.length,0,'Cleanup idempotence '+file);
 fs.writeFileSync(file,out);findings.push({file,bytesBefore:Buffer.byteLength(source),bytesAfter:Buffer.byteLength(out),removed:removed.map(({selector,context,property,value,line})=>({selector,context,property,value,line}))});
 // Preserve cache keys for untouched CSS, revise only changed URLs.
 const hash=crypto.createHash('sha256').update(out).digest('hex').slice(0,12);
 html=html.replace(new RegExp('(href="'+file.replaceAll('.','\\.')+'\\?[^"]+)(")','g'),'$1&clean='+hash+'$2');
}
// Keep original F1 source files as the editable canonical inputs; merge only the
// contiguous linked run. All reside in assets/ so relative URLs retain meaning.
const f1links=[...html.matchAll(/^<link rel="stylesheet" href="(assets\/f1-racing[^"]+\.css\?[^"]+)">[ \t]*$/gm)];
assert(f1links.length>=2,'F1 style list');
const start=f1links[0].index,end=f1links.at(-1).index+f1links.at(-1)[0].length;
assert.equal(html.slice(start,end).replace(/^<link rel="stylesheet" href="assets\/f1-racing[^"]+\.css\?[^"]+">[ \t]*$/gm,'').trim(),'','F1 links must be contiguous');
const sources=f1links.map(m=>m[1].split('?')[0]);
const runtimeFiles=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(p=>/^(assets|src)\/.*\.(?:js|mjs)$/.test(p));
for(const p of runtimeFiles){const code=read(p);for(const file of sources)assert(!code.includes(file.split('/').at(-1)),'Runtime references F1 stylesheet: '+p+' '+file)}
const combined=sources.map(file=>{const css=read(file);assert(!/@(?:import|namespace|charset)\b/.test(css),'Cannot concatenate '+file);return '/* Source: '+file+' */\n'+css.trimEnd()+'\n'}).join('\n');
const hash=crypto.createHash('sha256').update(combined).digest('hex').slice(0,12),bundle='assets/f1-racing-bundle-v1.css';
fs.writeFileSync(bundle,combined);
html=html.slice(0,start)+'<link rel="stylesheet" href="'+bundle+'?v='+hash+'" data-mws-style-sources="'+sources.join(' ')+'">'+html.slice(end);
fs.writeFileSync('index.html',html);
const output={filesChanged:findings.length,declarationsRemoved:findings.reduce((n,f)=>n+f.removed.length,0),bytesRemoved:findings.reduce((n,f)=>n+f.bytesBefore-f.bytesAfter,0),staticLinksBefore:initial.length,staticLinksAfter:[...html.matchAll(/<link\b[^>]*rel="stylesheet"/g)].length,bundle,sources,findings};
fs.mkdirSync('docs/css-stage37',{recursive:true});fs.writeFileSync('docs/css-stage37/cleanup.json',JSON.stringify(output,null,2)+'\n');
console.log('CSS_CLEANUP '+JSON.stringify({...output,findings:findings.map(f=>({file:f.file,removed:f.removed.length,bytes:f.bytesBefore-f.bytesAfter}))}));
