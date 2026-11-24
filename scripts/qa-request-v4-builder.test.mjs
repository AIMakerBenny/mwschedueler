import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,mkdir,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {build} from './build-media-v4-catalog.mjs';
test('offline builder emits content-addressed objects, bundles, and only approved revisions',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'mws-v4-build-'));
 try{
  const rows=[];
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j4xkAAAAASUVORK5CYII=','base64');
  for(let i=0;i<8;i++){const file='image'+i+'.png';await writeFile(join(dir,file),Buffer.concat([png,Buffer.from(String(i%4))]));rows.push({url:'/media/contact/a'+i+'?v=1&h='+String(i+1).padStart(32,'0'),file,type:'image/png',publicApproved:true,group:i<4?'a':'b'})}
  const spec=join(dir,'inventory.json'),out=join(dir,'output');
  await writeFile(spec,JSON.stringify({origin:'https://media.example.test',entries:rows}));
  const c=await build(spec,out);
  assert.equal(c.entries.length,8);assert.equal(c.packs.length,1,'Duplicate pack bytes share one stored pack; duplicate group uses direct objects');
  assert.equal((await readFile(join(out,'v4/objects/'+c.entries[0].sha256))).length,c.entries[0].bytes);
  const original=c.entries[0];rows[0].url=rows[0].url.replace('v=1','v=2');await writeFile(join(dir,rows[0].file),Buffer.concat([png,Buffer.from('new')]));
  await writeFile(spec,JSON.stringify({origin:'https://media.example.test',entries:rows}));
  const next=await build(spec,out);assert.notEqual(next.entries[0].sha256,original.sha256);assert.equal(next.entries[1].sha256,c.entries[1].sha256);
  rows[0].publicApproved=false;await writeFile(spec,JSON.stringify({origin:'https://media.example.test',entries:rows}));
  await assert.rejects(build(spec,out),/explicit approval/);
  rows[0].publicApproved=true;rows[0].url='/media/workspace/private?v=1&h='+'a'.repeat(32);
  await writeFile(spec,JSON.stringify({origin:'https://media.example.test',entries:rows}));await assert.rejects(build(spec,out),/explicit approval/);
 }finally{await rm(dir,{recursive:true,force:true})}
});
