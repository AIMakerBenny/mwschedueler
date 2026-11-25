// Offline CSS source inventory. Does not modify runtime files.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const baseline=process.argv[2]||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const uniq=a=>[...new Set(a)];
const line=(s,p)=>s.slice(0,p).split('\n').length;
function scan(s,start,end,cb){let q='',par=0,br=0;for(let i=start;i<end;i++){const c=s[i],n=s[i+1];if(q){if(c==='\\')i++;else if(c===q)q='';continue}if(c==='/'&&n==='*'){const j=s.indexOf('*/',i+2);i=j<0?end:j+1;continue}if(c==='\\'){i++;continue}if(c==='"'||c==="'"){q=c;continue}if(c==='(')par++;else if(c===')')par=Math.max(0,par-1);else if(c==='[')br++;else if(c===']')br=Math.max(0,br-1);else if(!par&&!br&&cb(c,i)===false)return i}return end}
function strip(s){let o='',q='';for(let i=0;i<s.length;i++){const c=s[i];if(q){o+=c;if(c==='\\'&&i+1<s.length)o+=s[++i];else if(c===q)q='';continue}if(c==='"'||c==="'"){q=c;o+=c;continue}if(c==='\\'&&i+1<s.length){o+=c+s[++i];continue}if(c==='/'&&s[i+1]==='*'){const j=s.indexOf('*/',i+2);if(j<0)break;o+=' ';i=j+1;continue}o+=c}return o}
function split(s,d){const a=[];let from=0,b=0;scan(s,0,s.length,(c,i)=>{if(c==='{')b++;else if(c==='}')b--;else if(c===d&&!b){a.push(s.slice(from,i));from=i+1}});a.push(s.slice(from));return a}
function parse(s,file,startLine=1){
 const rules=[],atRules=[],warnings=[];let blocks=0,declCount=0,important=0;
 const lines=[0];for(let i=0;i<s.length;i++)if(s[i]==='\n')lines.push(i+1);
 const loc=p=>{let l=0,h=lines.length;while(l+1<h){const m=(l+h)>>1;if(lines[m]<=p)l=m;else h=m}return startLine+l};
 function block(begin,end,ctx){
  let from=begin;
  while(from<end){
   let kind='';const p=scan(s,from,end,c=>{if(c==='{'||c===';'||c==='}'){kind=c;return false}});
   if(p===end)break;
   const raw=s.slice(from,p),head=strip(raw).trim();let first=from;
   while(first<p){if(/\s/.test(s[first])){first++;continue}if(s.slice(first,first+2)==='/*'){const j=s.indexOf('*/',first+2);if(j>=0){first=j+2;continue}}break}
   if(kind!=='{'){if(kind===';'&&head.startsWith('@'))atRules.push({head,line:loc(first),context:ctx.join(' > ')});from=p+1;continue}
   let depth=1;const close=scan(s,p+1,end,c=>{if(c==='{')depth++;else if(c==='}'&&--depth===0)return false});
   if(close===end){warnings.push({line:loc(p),reason:'unclosed block'});break}
   if(head.startsWith('@')){atRules.push({head,line:loc(first),context:ctx.join(' > ')});if(/^@(media|supports|container|layer|scope|starting-style|document)\b/i.test(head))block(p+1,close,[...ctx,head]);}
   else if(head){
    blocks++;const decls=[];
    for(const piece of split(s.slice(p+1,close),';')){const str=strip(piece).trim();if(!str)continue;const col=scan(str,0,str.length,c=>c===':'?false:undefined);
     if(col===str.length){warnings.push({line:loc(p),reason:'non-declaration',text:str.slice(0,80)});continue}
     const property=str.slice(0,col).trim();if(!/^--[\w-]+$|^-?[a-zA-Z][\w-]*$/.test(property)){warnings.push({line:loc(p),reason:'nested or unsupported declaration',text:str.slice(0,80)});continue}
     const v=str.slice(col+1).trim(),imp=/!\s*important\s*$/i.test(v);decls.push({property:property.startsWith('--')?property:property.toLowerCase(),value:v.replace(/!\s*important\s*$/i,'').trim(),important:imp});declCount++;if(imp)important++;
    }
    for(const selector of split(head,',').map(x=>x.trim()).filter(Boolean))rules.push({file,line:loc(first),selector,context:ctx.join(' > '),decls});
   }from=close+1;
  }
 }
 block(0,s.length,[]);return {rules,atRules,warnings,blocks,declCount,important};
}
function stats(rules){
 const map=new Map(),sameSelector=[],duplicates=[],conflicts=[];
 for(const r of rules){const k=JSON.stringify([r.context,r.selector]);if(!map.has(k))map.set(k,[]);map.get(k).push(r)}
 for(const rs of map.values()){
  if(rs.length>1)sameSelector.push({selector:rs[0].selector,context:rs[0].context,count:rs.length,locations:rs.map(r=>({file:r.file,line:r.line,order:r.order}))});
  const exact=new Map(),props=new Map();
  for(const r of rs){const k=JSON.stringify(r.decls);if(!exact.has(k))exact.set(k,[]);exact.get(k).push(r);for(const d of r.decls){if(!props.has(d.property))props.set(d.property,[]);props.get(d.property).push({file:r.file,line:r.line,order:r.order,value:d.value,important:d.important})}}
  for(const same of exact.values())if(same.length>1&&same[0].decls.length)duplicates.push({selector:rs[0].selector,context:rs[0].context,declarations:same[0].decls,locations:same.map(r=>({file:r.file,line:r.line,order:r.order}))});
  for(const [property,ds] of props){const values=uniq(ds.map(x=>JSON.stringify([x.value,x.important])));if(values.length>1&&rs.length>1)conflicts.push({selector:rs[0].selector,context:rs[0].context,property,values:values.length,crossFile:uniq(ds.map(x=>x.file)).length>1,locations:ds})}
 }
 return {sameSelector,duplicates,conflicts};
}
const test=parse('.a,.b:is(.x,.y){color:red;content:"a;b"} .a{color:blue} .a{color:blue} @media(min-width:1px){.a{color:pink}}','test');
assert.equal(test.blocks,4);assert.equal(test.rules.length,5);assert.equal(stats(test.rules).duplicates.length,1);assert.equal(stats(test.rules).conflicts.length,1);
assert.equal(parse('.a{background:url("data:image/svg+xml;foo{bar}")}', 'test').declCount,1);
console.log('CSS_AUDIT_PARSER_SELFTEST_OK');
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8',maxBuffer:16*1024*1024}).split('\0').filter(Boolean);
const cssFiles=files.filter(p=>/\.css$/i.test(p)).sort();
const codeFiles=files.filter(p=>p==='index.html'||/^(src|assets)\/.*\.(js|mjs)$/.test(p)).sort();
const src=Object.fromEntries([...cssFiles,...codeFiles].map(p=>[p,fs.readFileSync(p,'utf8')]));
const html=src['index.html'],staticUnits=[];
for(const m of html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>|<style\b[^>]*>[\s\S]*?<\/style>/gi)){
 const tag=m[0];if(tag.startsWith('<link')){const href=tag.match(/href=["']([^"']+)/i)?.[1];if(href){const file=href.split('?')[0].replace(/^\//,'');staticUnits.push({file,type:'link',line:line(html,m.index),href,css:src[file]})}}
 else{const id=tag.match(/id=["']([^"']+)/)?.[1]||'anonymous';const i=tag.indexOf('>')+1;staticUnits.push({file:'index.html#'+id,type:'inline',line:line(html,m.index+i),css:tag.slice(i,-8)})}
}
const links=staticUnits.filter(x=>x.type==='link'),linked=new Set(links.map(x=>x.file));
const refs=cssFiles.map(file=>{const name=file.split('/').at(-1);const references=[];for(const p of codeFiles){let n=0,i=-1;while((i=src[p].indexOf(name,i+1))!==-1)n++;if(n)references.push({file:p,count:n})}return {file,linked:linked.has(file),references}});
const dynamic=codeFiles.flatMap(file=>{const hits=[];for(const m of src[file].matchAll(/createElement\s*\(\s*['"]style['"]\s*\)|insertRule\s*\(|adoptedStyleSheets|CSSStyleSheet\s*\(|<style\b/gi)){if(file==='index.html'&&m[0]==='<style')continue;hits.push({line:line(src[file],m.index),kind:m[0]})}return hits.length?[{file,hits}]:[]});
const units=[...staticUnits,...cssFiles.filter(p=>!linked.has(p)).map(file=>({file,type:'not-linked',line:1,css:src[file]}))];
const parsed=units.map((u,order)=>{assert.equal(typeof u.css,'string','Missing '+u.file);return {...u,order,...parse(u.css,u.file,u.type==='inline'?u.line:1)}});
const inventory=parsed.map(u=>({file:u.file,type:u.type,order:u.order,bytes:Buffer.byteLength(u.css),blocks:u.blocks,selectors:u.rules.length,declarations:u.declCount,important:u.important,atRules:u.atRules,keyframes:u.atRules.filter(x=>/^@(?:-\w+-)?keyframes\b/i.test(x.head)).length,warnings:u.warnings}));
const rules=parsed.flatMap(u=>u.rules.map(r=>({...r,order:u.order,static:u.type!=='not-linked'})));
const initialRules=rules.filter(r=>r.static),initial=stats(initialRules),all=stats(rules);
const buckets={sidebar:/\.sidebar\b|\.nav-scroll\b|\.nav-label\b|\.nav-game-divider\b|#sidebarPinBtn\b|\.sidebar-pin\b/,calendar:/#calendar\b|#calendarGrid\b|\.calendar[-\w]*\b|\.mini-event\b/,shell:/\.app\b|\.main\b|\.topbar\b|#pageTitle\b/,f1:/#gameF1Racing\b|\.f1[-\w]*\b/,contacts:/#contacts\b|\.contact[-\w]*\b/};
const domain={};
for(const [name,rx] of Object.entries(buckets)){const rr=initialRules.filter(r=>rx.test(r.selector)),s=stats(rr);domain[name]={selectors:rr.length,files:uniq(rr.map(r=>r.file)),repeated:s.sameSelector.length,exact:s.duplicates.length,conflicts:s.conflicts.length,crossFile:s.conflicts.filter(c=>c.crossFile).length,top:s.conflicts.sort((a,b)=>b.locations.length-a.locations.length).slice(0,8)}}
const sum=(items,k)=>items.reduce((n,x)=>n+x[k],0),staticInventory=inventory.filter(x=>x.type!=='not-linked');
const summary={baseline,cssFiles:cssFiles.length,sourceFiles:codeFiles.length,staticLinks:links.length,inlineBlocks:staticUnits.filter(x=>x.type==='inline').length,staticBytes:sum(staticInventory,'bytes'),staticRules:sum(staticInventory,'blocks'),staticSelectors:initialRules.length,staticDeclarations:sum(staticInventory,'declarations'),staticImportant:sum(staticInventory,'important'),allRules:sum(inventory,'blocks'),allDeclarations:sum(inventory,'declarations'),allImportant:sum(inventory,'important'),initialRepeated:initial.sameSelector.length,initialExact:initial.duplicates.length,initialExactExtra:initial.duplicates.reduce((n,x)=>n+x.locations.length-1,0),initialConflict:initial.conflicts.length,initialCrossFile:initial.conflicts.filter(c=>c.crossFile).length,allRepeated:all.sameSelector.length,allExact:all.duplicates.length,allConflict:all.conflicts.length,dynamicInjectionFiles:dynamic.length,warnings:inventory.reduce((n,x)=>n+x.warnings.length,0)};
const table=(heads,rows)=>'| '+heads.join(' | ')+' |\n| '+heads.map(()=> '---').join(' | ')+' |\n'+rows.map(r=>'| '+r.map(x=>String(x).replace(/\|/g,'\\|').replace(/\n/g,' ')).join(' | ')+' |').join('\n');
const report=[
'# Stage 2: CSS source inventory and conflict candidates',
'Baseline: '+baseline+'. Static audit only. No CSS or application runtime changed. All tracked CSS plus index.html and all JS/MJS under assets/ and src/ read. No network access to production.',
'## Summary',table(['Metric','Value'],Object.entries(summary)),
'## Domain priorities (overlapping; do not sum)',table(['Area','Selector instances','Files','Repeated selector/context pairs','Exact duplicate groups','Differing declaration groups','Cross-file differing groups'],Object.entries(domain).map(([k,v])=>[k,v.selectors,v.files.length,v.repeated,v.exact,v.conflicts,v.crossFile])),
'## CSS not linked in initial HTML',table(['File','Literal references in runtime source','Disposition'],refs.filter(x=>!x.linked).map(x=>[x.file,x.references.map(r=>r.file+' x'+r.count).join(', ')||'None found','Do not delete until runtime usage/imports are verified'])),
'## Highest-volume conflicts',table(['Area','Selector','Condition','Property','Locations (up to 12)'],Object.entries(domain).flatMap(([k,v])=>v.top.slice(0,5).map(c=>[k,c.selector,c.context||'root',c.property,c.locations.slice(0,12).map(l=>l.file+':'+l.line+' = '+l.value+(l.important?' !important':'')).join('; ')]))),
'## Static inventory',table(['Order','File','Load','Bytes','Rule blocks','Declarations','!important','Warnings'],inventory.map(x=>[x.order,x.file,x.type,x.bytes,x.blocks,x.declarations,x.important,x.warnings.length])),
'## Runtime CSS creation sites',table(['File','Locations'],dynamic.map(x=>[x.file,x.hits.map(h=>h.line+' '+h.kind).join(', ')])),
'## Interpretation and next stages',
'Stage 3: sidebar and shell. Establish a single owner for desktop rail geometry and state, preserving pinned/unpinned/expanded, keyboard, mobile, zoom, frame and theme variants. Examine app-core, sidebar-stable, sidebar-compact, sidebar-rail-scrollbar, workspace-clean, workspace-density, mawang-premium, ui-frame-presets and inline rules.',
'Stage 4: calendar. Separate toolbar, month geometry, group dock, copy tray, drag and hover, and mobile rules. Preserve six-week months and all existing interactions.',
'Stage 5: specialized / legacy styles. F1, Wardogs, minigames, gallery, post, alternate frames. Non-initial reference is not proof of unused code. No automatic removal based on filenames or version suffixes.',
'Stage 6: startup and request budget. Keep current API sequence. No production traffic for tests.',
'## Limitations and acceptance gates',
'Counts are syntactic candidates, not proof of visual defects. Selector and at-rule condition comparison is literal (apart from comments and edge whitespace); values preserve whitespace. Keyframes and descriptor at-rules are inventoried, not counted as ordinary selector declarations. Exact groups count selector+condition+ordered declaration list, not removable whole rules. Multiple declarations may be deliberate fallbacks. Different selectors matching the same element, specificity, shorthand/longhand, CSS variables, runtime-generated styles, nesting and equivalent media expressions require separate browser analysis. Literal references are not a runtime usage trace. Runtime CSS sites are identified but their generated contents are not parsed. No deletion is certified at stage 2.',
'Before deletion compare computed styles, geometry, screenshots and interactions in offline Chromium at 1366x768, 1920x1080, 2560x1440, 390x844; public/admin; pinned/unpinned; light/dark and applicable frame/zoom settings; cold/warm startup. Use real pointer and keyboard events. Re-run offline Worker request budget and distinguish pre-existing failures. Roll back any unexplained differences. No blanket deletion of !important or duplicated rules.'
].join('\n\n')+'\n';
const out='docs/css-stage2';fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(out+'/report.md',report);
fs.writeFileSync(out+'/inventory.json',JSON.stringify({summary,inventory,refs,dynamic,domain},null,2)+'\n');
for(const [key,value] of Object.entries(initial))fs.writeFileSync(out+'/initial-'+key+'.json',JSON.stringify(value)+'\n');
for(const [key,value] of Object.entries(all))fs.writeFileSync(out+'/all-'+key+'.json',JSON.stringify(value)+'\n');
console.log('CSS_STAGE2_SUMMARY '+JSON.stringify(summary));
console.log('CSS_STAGE2_NOT_LINKED '+JSON.stringify(refs.filter(x=>!x.linked)));
console.log('CSS_STAGE2_DOMAINS '+JSON.stringify(Object.fromEntries(Object.entries(domain).map(([k,v])=>[k,{selectors:v.selectors,files:v.files.length,repeated:v.repeated,exact:v.exact,conflicts:v.conflicts,crossFile:v.crossFile}]))));
console.log('CSS_STAGE2_WARNINGS '+JSON.stringify(inventory.filter(x=>x.warnings.length).map(x=>({file:x.file,warnings:x.warnings}))));
console.log('CSS_STAGE2_TOP '+JSON.stringify(Object.fromEntries(Object.entries(domain).map(([k,v])=>[k,v.top.slice(0,3).map(c=>({selector:c.selector,property:c.property,context:c.context,locations:c.locations.slice(0,5)}))]))));
console.log('CSS_STAGE2_LARGEST '+JSON.stringify(staticInventory.sort((a,b)=>b.bytes-a.bytes).slice(0,8).map(x=>({file:x.file,bytes:x.bytes,blocks:x.blocks,important:x.important}))));
