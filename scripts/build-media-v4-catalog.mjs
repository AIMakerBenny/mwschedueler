// Offline only. Reads explicitly approved local image files. Never calls R2 or Worker.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import '../assets/media-v4-delivery.js';
const M=globalThis.MWSMediaV4, hash=b=>createHash('sha256').update(b).digest('hex');
const signature=(b,t)=>t==='image/png'?b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):t==='image/jpeg'?b[0]===255&&b[1]===216&&b[2]===255:t==='image/webp'?b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP':t==='image/gif'?/^GIF8[79]a$/.test(b.toString('ascii',0,6)):t==='image/avif'?b.toString('ascii',4,8)==='ftyp'&&/avif|avis/.test(b.toString('ascii',8,32)):false;
export async function build(specFile,outDir){
 const spec=JSON.parse(await readFile(specFile,'utf8')),base=dirname(resolve(specFile)),out=resolve(outDir);
 if(!M.origin(spec.origin)||!Array.isArray(spec.entries))throw Error('approved HTTPS custom domain and entry list required');
 const catalog={schema:1,origin:spec.origin,entries:[],packs:[]},groups=new Map(),seen=new Set();
 const put=async(key,b)=>{const file=resolve(out,key);await mkdir(dirname(file),{recursive:true});await writeFile(file,b)};
 for(const row of spec.entries){
  if(row.publicApproved!==true||!M.canonical(row.url)||seen.has(row.url)||typeof row.file!=='string')throw Error('explicit approval and exact unique contact revision required');
  seen.add(row.url);const file=resolve(base,row.file),rel=relative(base,file);
  if(rel.startsWith('..')||isAbsolute(rel))throw Error('source outside inventory folder');
  const b=await readFile(file);if(!b.length||b.length>M.MAX_OBJECT||!signature(b,row.type))throw Error('invalid source image');
  const e={url:row.url,sha256:hash(b),type:row.type,bytes:b.length};
  catalog.entries.push(e);await put('v4/objects/'+e.sha256,b);
  // Only opt-in groups representing images normally viewed together are packed.
  if(typeof row.group==='string'&&row.group&&b.length<=M.MAX_PACK){if(!groups.has(row.group))groups.set(row.group,[]);groups.get(row.group).push({e,b})}
 }
 for(const rows of groups.values()){
  let batch=[],size=0;
  async function flush(){if(batch.length>=4){let offset=0;const members=batch.map(({e})=>{const m={url:e.url,offset};offset+=e.bytes;return m});const b=Buffer.concat(batch.map(x=>x.b)),sha256=hash(b);catalog.packs.push({sha256,bytes:b.length,members});await put('v4/packs/'+sha256,b)}batch=[];size=0}
  for(const r of rows){if(size+r.b.length>M.MAX_PACK||batch.length>=32)await flush();batch.push(r);size+=r.b.length}await flush();
 }
 if(!M.validate(catalog))throw Error('catalog validation failed');
 await put('catalog.json',JSON.stringify(catalog,null,2)+'\n');
 await put('media-v4-catalog.js','globalThis.MWS_PUBLIC_MEDIA_V4_CATALOG='+JSON.stringify(catalog)+';\n');
 return catalog;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){if(!process.argv[2]||!process.argv[3])throw Error('usage: node scripts/build-media-v4-catalog.mjs approved-inventory.json output-directory');await build(process.argv[2],process.argv[3])}
