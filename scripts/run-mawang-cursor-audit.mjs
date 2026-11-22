import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../'+path,import.meta.url));
const code = read('assets/mawang-cursor-v1.js').toString();
const key = 'mws-cursor-v1';
const callbacks = {};
const properties = new Map();
const root = {dataset:{},style:{setProperty:(k,v)=>properties.set(k,v),removeProperty:k=>properties.delete(k)},removeAttribute(){delete this.dataset.mwsCursor;}};
const variants = ['system','finger','red','mini','big'].map(value=>({value}));
const sizes = ['32','48','64'].map(value=>({value}));
const status = {}, preview = {};
const choices = {append(){}};
const reset = {addEventListener:(type,callback)=>callbacks.reset=callback};
const panel = {
  querySelectorAll:selector=>selector.includes('Variant')?variants:sizes,
  querySelector:selector=>({'[data-cursor-status]':status,'[data-cursor-test]':preview,'[data-cursor-choices]':choices,'[data-cursor-reset]':reset}[selector]),
  addEventListener:(type,callback)=>callbacks.change=callback
};
const storage = new Map();
const mouse = {matches:true,addEventListener:(type,callback)=>callbacks.media=callback};
const makeElement = ()=>({append(){}});
const document = {documentElement:root,currentScript:{src:'https://example.test/assets/mawang-cursor-v1.js?v=1'},getElementById:()=>panel,readyState:'complete',createElement:makeElement};
const window = {addEventListener:(type,callback)=>callbacks.storage=callback};
const localStorage = {getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
vm.runInNewContext(code,{document,window,localStorage,matchMedia:()=>mouse,URL});
assert.equal(root.dataset.mwsCursor,undefined);
assert(sizes.every(s=>s.disabled));
const points={finger:[[1,14],[1,21],[1,28]],red:[[1,1],[1,1],[1,1]],mini:[[6,1],[9,1],[12,1]],big:[[9,1],[13,1],[17,1]]};
for (const [variant,hotspots] of Object.entries(points)) {
  callbacks.change({target:{name:'mwsCursorVariant',value:variant}});
  for (const [i,size] of [32,48,64].entries()) {
    callbacks.change({target:{name:'mwsCursorSize',value:String(size)}});
    const [x,y]=hotspots[i];
    const png=read(`assets/cursors/${variant}-${size}.png`);
    assert.equal(png.subarray(1,4).toString(),'PNG');
    const w=png.readUInt32BE(16),h=png.readUInt32BE(20);
    assert.equal(Math.max(w,h),size);
    assert(x>=0&&x<w&&y>=0&&y<h);
    assert.equal(properties.get('--mws-cursor-default'),`url("https://example.test/assets/cursors/${variant}-${size}.png") ${x} ${y}, auto`);
    assert.equal(properties.get('--mws-cursor-pointer').endsWith(', pointer'),true);
    assert.equal(root.dataset.mwsCursor,variant);
    assert.deepEqual(JSON.parse(storage.get(key)),{variant,size});
    assert(sizes[i].checked);
  }
}
mouse.matches=false;callbacks.media();assert.equal(root.dataset.mwsCursor,undefined);assert.equal(properties.size,0);
mouse.matches=true;callbacks.media();assert.equal(root.dataset.mwsCursor,'big');
storage.set(key,JSON.stringify({variant:'mini',size:32}));callbacks.storage({key});assert.equal(root.dataset.mwsCursor,'mini');
storage.set(key,'invalid JSON');callbacks.storage({key});assert.equal(root.dataset.mwsCursor,undefined);
callbacks.change({target:{name:'mwsCursorVariant',value:'toString'}});assert.equal(root.dataset.mwsCursor,undefined);
callbacks.reset();assert.deepEqual(JSON.parse(storage.get(key)),{variant:'system',size:48});
for (const page of ['index.html','content-planner.html','majoku-castle.html']) {
  const html=read(page).toString();assert(html.includes('assets/mawang-cursor-v1.css?v=1'));assert(html.includes('assets/mawang-cursor-v1.js?v=1'));
}
console.log('PASS: 12 cursor images and hotspots, 5 options, storage, reset, touch fallback, cross-document updates, 3 application pages');
