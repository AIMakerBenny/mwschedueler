import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../'+path,import.meta.url));
const code = read('assets/mawang-cursor-v1.js').toString();
const key = 'mws-cursor-v1';
const callbacks = {};
const properties = new Map();
const root = {dataset:{},style:{setProperty:(k,v)=>properties.set(k,v),removeProperty:k=>properties.delete(k)},removeAttribute(){delete this.dataset.mwsCursor;}};
const variants = ['finger','red','big','codeng','devil-dance','system'].map(value=>({value}));
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
const reduce = {matches:false,addEventListener:(type,callback)=>callbacks.reduce=callback};
class FakeElement {
  constructor(){this.style={};this.classList={add(){}};this.events={};this.naturalWidth=40;}
  append(){} setAttribute(){} matches(){return false;}
  addEventListener(type,callback){this.events[type]=callback;}
  remove(){this.removed=true;}
}
let sprite = null, raf = null, rafCount = 0;
const document = {documentElement:root,currentScript:{src:'https://example.test/assets/mawang-cursor-v1.js?v=2'},getElementById:()=>panel,readyState:'complete',createElement:()=>new FakeElement(),body:{append(el){sprite=el;}},addEventListener(){}};
const listeners = new Map();
const window = {addEventListener(type,callback,opts){listeners.set(type,callback);opts?.signal?.addEventListener('abort',()=>{if(listeners.get(type)===callback)listeners.delete(type);});}};
const localStorage = {getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
vm.runInNewContext(code,{document,window,localStorage,matchMedia:q=>q.includes('reduced')?reduce:mouse,URL,AbortController,Element:FakeElement,getComputedStyle:el=>({cursor:el.cursor??properties.get('--mws-cursor-default')}),requestAnimationFrame:cb=>{raf=cb;return ++rafCount;},cancelAnimationFrame:()=>{raf=null;}});
assert.equal(root.dataset.mwsCursor,'finger');
assert(sizes.every(s=>!s.disabled));
assert(!listeners.has('pointermove'));
const points={finger:[[1,14],[1,21],[1,28]],red:[[1,1],[1,1],[1,1]],big:[[9,1],[13,1],[17,1]],codeng:[[1,1],[1,1],[1,1]],'devil-dance':[[1,1],[1,1],[1,1]]};
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
    if (variant==='codeng'||variant==='devil-dance') {
      const apng=read(`assets/cursors/${variant}-motion-${size}.png`);
      const acTL=apng.indexOf(Buffer.from('acTL'));
      assert(acTL>0);assert.equal(apng.readUInt32BE(acTL+4),variant==='codeng'?5:20);
      assert.equal(apng.readUInt32BE(acTL+8),0);
      assert.equal(sprite.width,size-[6,8,10][i]);
      assert(sprite.hidden);
      sprite.events.load();
      assert.match(properties.get('--mws-cursor-default'),/animation-arrow-/);
      const target=new FakeElement();
      const ev={target,pointerType:'mouse',buttons:0,clientX:100,clientY:200};
      const count=rafCount;
      listeners.get('pointermove')(ev); listeners.get('pointermove')({...ev,clientX:120});
      assert.equal(rafCount,count+1);raf();
      assert.equal(sprite.hidden,false);
      assert.match(sprite.style.transform,new RegExp(`translate3d\\(${120+[6,8,10][i]-1}px`));
      listeners.get('pointermove')({...ev,target:Object.assign(new FakeElement(),{cursor:'text'})});
      assert.equal(sprite.hidden,true);
    } else assert(!listeners.has('pointermove'));
  }
}
mouse.matches=false;callbacks.media();assert.equal(root.dataset.mwsCursor,undefined);assert.equal(properties.size,0);
mouse.matches=true;callbacks.media();assert.equal(root.dataset.mwsCursor,'devil-dance');
reduce.matches=true;callbacks.reduce();assert(!listeners.has('pointermove'));assert.match(properties.get('--mws-cursor-default'),/devil-dance-64\.png/);
reduce.matches=false;callbacks.reduce();assert(listeners.has('pointermove'));
storage.set(key,JSON.stringify({variant:'mini',size:32}));listeners.get('storage')({key});assert.equal(root.dataset.mwsCursor,'finger');assert(!listeners.has('pointermove'));
storage.set(key,'invalid JSON');listeners.get('storage')({key});assert.equal(root.dataset.mwsCursor,'finger');
callbacks.change({target:{name:'mwsCursorVariant',value:'toString'}});assert.equal(root.dataset.mwsCursor,'finger');
callbacks.change({target:{name:'mwsCursorVariant',value:'system'}});assert.equal(root.dataset.mwsCursor,undefined);assert(sizes.every(s=>s.disabled));
listeners.get('storage')({key});assert.equal(root.dataset.mwsCursor,undefined);
callbacks.reset();assert.deepEqual(JSON.parse(storage.get(key)),{variant:'finger',size:48});
for (const page of ['index.html','content-planner.html','majoku-castle.html']) {
  const html=read(page).toString();assert(html.includes('assets/mawang-cursor-v1.css?v=2'));assert(html.includes('assets/mawang-cursor-v1.js?v=2'));
}
console.log('PASS: 15 cursor images, 6 animated assets, 6 choices, default migration, storage, reset, motion fallback, native arrow, event cleanup, frame coalescing, 3 application pages');
