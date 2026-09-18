import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function walk(dir){
  const out=[];
  if(!fs.existsSync(dir))return out;
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())out.push(...walk(p));
    else if(/\.(?:js|mjs|html)$/i.test(ent.name))out.push(p);
  }
  return out;
}
function count(src,re){return (src.match(re)||[]).length}
function record(name,src){
  const stats={
    functionContactMatches:count(src,/function\s+contactMatches\s*\(/g),
    assignContactMatches:count(src,/(?:window\.)?contactMatches\s*=/g),
    functionRenderContacts:count(src,/function\s+renderContacts\s*\(/g),
    assignRenderContacts:count(src,/(?:window\.)?renderContacts\s*=/g),
    functionFilteredContacts:count(src,/function\s+filteredContacts\s*\(/g),
    contactSearchHandlers:count(src,/contactSearch[^\n]{0,160}(?:oninput|addEventListener)/gi),
    mwsTextMatches:count(src,/mwsTextMatches/g),
    koreanInitials:count(src,/mwsKoreanInitials/g)
  };
  if(Object.values(stats).some(Boolean))console.log('SEARCH_OWNER',JSON.stringify({name,...stats}));
}

for(const file of [...walk('assets'),...walk('src'),'index.html']){
  if(!fs.existsSync(file))continue;
  record(file,fs.readFileSync(file,'utf8'));
}

try{
  const loader=fs.readFileSync('assets/online-v5-loader.js','utf8');
  const m=loader.match(/const PAYLOAD='([^']+)'/);
  if(m){
    const decoded=zlib.gunzipSync(Buffer.from(m[1],'base64')).toString('utf8');
    record('DECODED:assets/online-v5-loader.js',decoded);
    for(const needle of ['contactMatches','renderContacts','filteredContacts','contactSearch']){
      let from=0,shown=0;
      while((from=decoded.indexOf(needle,from))>=0&&shown<12){
        console.log('SEARCH_SNIPPET',JSON.stringify({needle,snippet:decoded.slice(Math.max(0,from-260),Math.min(decoded.length,from+520)).replace(/\s+/g,' ')}));
        from+=needle.length;shown++;
      }
    }
  }
}catch(error){console.log('SEARCH_DECODE_ERROR',String(error?.message||error))}

console.log(JSON.stringify({phase:72,name:'search-owner-collision-diagnostic',issues:[],warnings:[],pass:true}));
