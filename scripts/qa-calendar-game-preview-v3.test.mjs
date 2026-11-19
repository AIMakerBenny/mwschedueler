import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const core=readFileSync('assets/app-core.js','utf8');
const code=core.slice(core.indexOf('function calendarGamePreviewV3('),core.indexOf('function calendarPreviewHTML(e){'));
const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aBfkAAAAASUVORK5CYII=';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function api(data){const scope={window:{},data,esc};vm.runInNewContext(code+'\nthis.api={resolve:calendarGamePreviewV3,html:calendarGamePreviewHTMLV3};',scope);return scope.api}
test('uploaded manual raster thumbnail appears in shared preview without changing data',()=>{
 const event={steamGame:{source:'manual',id:'manual:wow',name:'와우 <포에버>',image,platform:'PC'}},data={events:[event],gameLibrary:[]};const before=JSON.stringify(data),a=api(data);
 assert.equal(a.resolve(event).image,image);assert(a.html(event).includes('src="'+image+'"'));assert(a.html(event).includes('와우 &lt;포에버&gt;'));assert.equal(JSON.stringify(data),before);
});
test('existing image-less snapshot resolves its registered custom image',()=>{
 const data={gameLibrary:[{id:'manual:wow',name:'와우 포에버',image}]},event={steamGame:{id:'manual:wow',source:'manual',name:'와우 포에버',image:''}};
 assert.equal(api(data).resolve(event).image,image);
});
test('Steam and web thumbnails remain supported',()=>{
 const a=api({gameLibrary:[]});for(const image of ['https://example.com/game.jpg','http://example.com/game.jpg'])assert.equal(a.resolve({steamGame:{appid:'730',name:'Game',image}}).image,image);
});
test('script, SVG, malformed and oversized image sources never become preview image URLs',()=>{
 const a=api({gameLibrary:[]});for(const image of ['javascript:alert(1)','data:image/svg+xml;base64,PHN2Zz4=','data:image/png;base64,<bad>','https://example.com/" onerror="bad','data:image/png;base64,'+'A'.repeat(95000)]){
  const event={steamGame:{source:'manual',id:'manual:x',name:'Game',image}};assert.equal(a.resolve(event).image,'');assert(!a.html(event).includes('<img'));
 }
});
test('picker manual normalizer also falls back to registered thumbnail without a save',()=>{
 const source=readFileSync('assets/steam-game-v111.js','utf8');const functions=source.slice(source.indexOf('function validImage('),source.indexOf('function serializeGame('));const scope={getData:()=>({gameLibrary:[{id:'manual:wow',image}]}),appIdOf:g=>String(g?.appid||''),steamUrl:id=>'https://store.steampowered.com/app/'+id};vm.runInNewContext(functions+'\nthis.normalize=normalizeGame;',scope);assert.equal(scope.normalize({source:'manual',id:'manual:wow',name:'WOW',image:''}).image,image);
});
