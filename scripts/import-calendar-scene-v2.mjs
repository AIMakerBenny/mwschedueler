// Offline import for the original generated photographic-style artwork.
// No runtime asset request. Verify dimensions, byte budget and source identity.
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const asset=new URL('../assets/calendar-scene-art-v2.jpg',import.meta.url);
const cssFile=new URL('../assets/workspace-clean-v1.css',import.meta.url);
const indexFile=new URL('../index.html',import.meta.url);
const approved='fa8b8abee3cd70e71b49cb21480c867e3f756606ea6cc0ec214137ea4fcaf800';
const sha=b=>createHash('sha256').update(b).digest('hex');
function dimensions(b){
 assert(b[0]===255&&b[1]===216&&b[b.length-2]===255&&b[b.length-1]===217,'JPEG markers');
 let p=2;
 while(p+4<b.length){
  assert(b[p++]===255,'JPEG segment');while(b[p]===255)p++;
  const marker=b[p++];if(marker===218||marker===217)break;
  const len=b.readUInt16BE(p);assert(len>=2&&p+len<=b.length,'JPEG segment size');
  if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){
   return [b.readUInt16BE(p+5),b.readUInt16BE(p+3)];
  }p+=len;
 }
 throw Error('JPEG dimensions not found');
}
function validate(b){assert(b.length<=240000,'Asset byte budget');assert.deepEqual(dimensions(b),[1280,720]);assert.equal(sha(b),approved,'Artwork differs from approved original')}
export function checkImportedScene(write=false){
 const b=readFileSync(asset);validate(b);
 const css=readFileSync(cssFile,'utf8'),re=/--calendar-atmosphere-art:url\("data:image\/(?:png|jpeg);base64,([A-Za-z0-9+/=]+)"\)/;
 const m=css.match(re);assert(m,'Existing embedded art missing');
 if(write){
  const out=css.replace(re,'--calendar-atmosphere-art:url("data:image/jpeg;base64,'+b.toString('base64')+'")');
  const index=readFileSync(indexFile,'utf8'),link=/workspace-clean-v1\.css[^"]+/;
  assert(link.test(index),'Stylesheet link missing');
  const next=index.replace(link,v=>v.replace(/&sceneV2=[a-f0-9]+/g,'')+'&sceneV2='+sha(out).slice(0,12));
  writeFileSync(cssFile,out);writeFileSync(indexFile,next);
 }else{
  assert(m[0].includes('data:image/jpeg;'),'Imported image not embedded');
  assert(Buffer.from(m[1],'base64').equals(b),'Embedded image differs from approved source');
 }
 console.log('CALENDAR_IMPORTED_SCENE_OK',1280,720,b.length,approved);
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 const [flag,input]=process.argv.slice(2);
 if(flag==='--import'){
  assert(input,'Pass the optimized calendar-scene-art-v2.jpg path');
  const b=readFileSync(input);validate(b);if(path.resolve(input)!==fileURLToPath(asset))copyFileSync(input,asset);checkImportedScene(true);
 }else{assert.equal(flag,'--check');checkImportedScene(false)}
}
