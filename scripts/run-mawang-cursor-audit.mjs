import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../'+path,import.meta.url));
const code = read('assets/mawang-cursor-v1.js').toString();
const key = 'mws-cursor-v1';
const callbacks = {};
const properties = new Map();
const root = {dataset:{},clientWidth:1280,clientHeight:720,style:{setProperty:(k,v)=>properties.set(k,v),removeProperty:k=>properties.delete(k)},removeAttribute(){delete this.dataset.mwsCursor;}};
const variants = ['finger','red','big','mw','0216','codeng','devil-dance','system'].map(value=>({value}));
const sizes = ['32','48','64'].map(value=>({value}));
const status = {}, preview = {};
const choices = {append(){}};
const colorInput = {}, playInput = {}, playPanel = {};
const colors = {querySelector:()=>colorInput,querySelectorAll:()=>[]};
const reset = {addEventListener:(type,callback)=>callbacks.reset=callback};
const panel = {
  querySelectorAll:selector=>selector.includes('Variant')?variants:selector.includes('Size')?sizes:[],
  querySelector:selector=>({'[data-cursor-status]':status,'[data-cursor-test]':preview,'[data-cursor-choices]':choices,'[data-cursor-reset]':reset,'[data-cursor-colors]':colors,'[data-cursor-play]':playPanel,'[name="mwsCursorPlay"]':playInput}[selector]),
  addEventListener:(type,callback)=>callbacks.change=callback
};
const storage = new Map();
const mouse = {matches:true,addEventListener:(type,callback)=>callbacks.media=callback};
class FakeElement {
  constructor(){this.style={};this.classList={add(){}};this.events={};this.naturalWidth=40;}
  append(){} setAttribute(){} matches(){return false;}
  addEventListener(type,callback){this.events[type]=callback;}
  remove(){this.removed=true;}
  animate(frames,options){this.frames=frames;this.options=options;return {pause:()=>this.playing=false,play:()=>this.playing=true,cancel:()=>this.cancelled=true};}
}
let sprite = null, sheet = null, raf = null, rafCount = 0;
const images=[];
class FakeImage extends FakeElement {constructor(){super();this.naturalWidth=40;this.naturalHeight=20;sheet=this;images.push(this);}}
const pixels = {data:new Uint8ClampedArray([250,222,237,255,255,255,255,255,20,20,20,255])};
const canvas = {getContext:()=>({drawImage(){},getImageData:()=>pixels,putImageData(){}}),toDataURL:()=>'data:image/png;base64,test'};
const document = {documentElement:root,currentScript:{src:'https://example.test/assets/mawang-cursor-v1.js?v=3'},getElementById:()=>panel,readyState:'complete',createElement:tag=>tag==='canvas'?canvas:new FakeElement(),body:{append(el){sprite=el;}},addEventListener(){}};
const listeners = new Map();
const window = {addEventListener(type,callback,opts){listeners.set(type,callback);opts?.signal?.addEventListener('abort',()=>{if(listeners.get(type)===callback)listeners.delete(type);});}};
const localStorage = {getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
vm.runInNewContext(code,{document,window,localStorage,matchMedia:()=>mouse,URL,AbortController,Element:FakeElement,Image:FakeImage,getComputedStyle:el=>({cursor:el.cursor??properties.get('--mws-cursor-default')}),requestAnimationFrame:cb=>{raf=cb;return ++rafCount;},cancelAnimationFrame:()=>{raf=null;}});
assert.equal(root.dataset.mwsCursor,'finger');
assert(sizes.every(s=>!s.disabled));
assert(!listeners.has('pointermove'));
const points={finger:[[1,14],[1,21],[1,28]],red:[[1,1],[1,1],[1,1]],big:[[9,1],[13,1],[17,1]],mw:[[1,1],[1,1],[1,1]],'0216':[[1,1],[1,1],[1,1]],codeng:[[1,1],[1,1],[1,1]],'devil-dance':[[1,1],[1,1],[1,1]]};
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
    const [sx,sy]=hotspots[0];
    const primary=`url("https://example.test/assets/cursors/${variant}-${size}.png?v=3") ${x} ${y}`;
    const fallback=size>32?`, url("https://example.test/assets/cursors/${variant}-32.png?v=3") ${sx} ${sy}`:'';
    assert.equal(properties.get('--mws-cursor-default'),`${primary}${fallback}, auto`);
    assert.equal(properties.get('--mws-cursor-pointer'),`${primary}${fallback}, pointer`);
    assert.equal(properties.get('--mws-cursor-pointer').endsWith(', pointer'),true);
    assert.equal(root.dataset.mwsCursor,variant);
    assert.deepEqual(JSON.parse(storage.get(key)),{variant,size,colors:{mw:'#f8dce9','0216':'#f8dce9'},play:true});
    assert(sizes[i].checked);
    if (variant==='codeng'||variant==='devil-dance') {
      const apng=read(`assets/cursors/${variant}-motion-${size}.png`);
      const acTL=apng.indexOf(Buffer.from('acTL'));
      assert(acTL>0);assert.equal(apng.readUInt32BE(acTL+4),variant==='codeng'?5:20);
      assert.equal(apng.readUInt32BE(acTL+8),0);
      const width=size-[6,8,10][i],frames=variant==='codeng'?5:20;
      const strip=read(`assets/cursors/${variant}-strip-${size}.png`);
      assert.equal(strip.readUInt32BE(16),width*frames);assert.equal(strip.readUInt32BE(20),width);
      assert.equal(sprite.style.width,`${width}px`);
      assert(sprite.hidden);
      sheet.events.load();
      assert.match(properties.get('--mws-cursor-default'),/animation-arrow-/);
      const target=new FakeElement();
      const ev={target,pointerType:'mouse',buttons:0,clientX:100,clientY:200};
      const count=rafCount;
      listeners.get('pointermove')(ev); listeners.get('pointermove')({...ev,clientX:120});
      assert.equal(rafCount,count+1);raf();
      assert.equal(sprite.hidden,false);
      assert.equal(sprite.playing,true);assert.equal(sprite.options.duration,variant==='codeng'?250:800);assert.equal(sprite.options.easing,`steps(${frames}, end)`);
      assert.match(sprite.style.transform,new RegExp(`translate3d\\(${120+[6,8,10][i]-1}px`));
      for(const [clientX,clientY] of [[1279,719],[1279,0],[0,719],[0,0]]) {
        listeners.get('pointermove')({...ev,clientX,clientY});raf();
        const offset=[6,8,10][i]-1;
        const left=Math.min(root.clientWidth-width,clientX+offset),top=Math.min(root.clientHeight-width,clientY+offset);
        assert.equal(sprite.style.transform,`translate3d(${left}px,${top}px,0)`);
        assert.equal(sprite.hidden,false);
        assert.equal(sprite.playing,true);
      }
      root.clientWidth=1200;root.clientHeight=650;listeners.get('resize')();raf();
      assert.equal(sprite.style.transform,`translate3d(${[5,7,9][i]}px,${[5,7,9][i]}px,0)`);
      root.clientWidth=1280;root.clientHeight=720;
      listeners.get('pointermove')({...ev,target:Object.assign(new FakeElement(),{cursor:'text'})});
      assert.equal(sprite.hidden,true);
      assert.equal(sprite.playing,false);
    } else assert(!listeners.has('pointermove'));
  }
}
mouse.matches=false;callbacks.media();assert.equal(root.dataset.mwsCursor,undefined);assert.equal(properties.size,0);
mouse.matches=true;callbacks.media();assert.equal(root.dataset.mwsCursor,'devil-dance');
root.dataset.mwsMotion='reduced';storage.set('mws-screen-motion-v1','reduced');listeners.get('storage')({key:'mws-screen-motion-v1'});assert(listeners.has('pointermove'));
callbacks.change({target:{name:'mwsCursorPlay',checked:false}});assert(!listeners.has('pointermove'));assert.match(properties.get('--mws-cursor-default'),/devil-dance-64\.png/);
callbacks.change({target:{name:'mwsCursorPlay',checked:true}});assert(listeners.has('pointermove'));
callbacks.change({target:{name:'mwsCursorVariant',value:'mw'}});assert(!colors.hidden);assert(playPanel.hidden);
const before=images.length;callbacks.change({target:{name:'mwsCursorColor',value:'#75b5ff'}});for(const img of images.slice(before))img.onload?.();await Promise.resolve();await Promise.resolve();await Promise.resolve();assert.equal((properties.get('--mws-cursor-default').match(/data:image\/png/g)||[]).length,2);
assert.deepEqual([...pixels.data.slice(4)],[255,255,255,255,20,20,20,255]);assert(pixels.data[2]>pixels.data[0]);
callbacks.change({target:{name:'mwsCursorVariant',value:'0216'}});assert.equal(colorInput.value,'#f8dce9');assert.equal(JSON.parse(storage.get(key)).colors.mw,'#75b5ff');
storage.set(key,JSON.stringify({variant:'mini',size:32}));listeners.get('storage')({key});assert.equal(root.dataset.mwsCursor,'finger');assert(!listeners.has('pointermove'));
storage.set(key,'invalid JSON');listeners.get('storage')({key});assert.equal(root.dataset.mwsCursor,'finger');
callbacks.change({target:{name:'mwsCursorVariant',value:'toString'}});assert.equal(root.dataset.mwsCursor,'finger');
callbacks.change({target:{name:'mwsCursorVariant',value:'system'}});assert.equal(root.dataset.mwsCursor,undefined);assert(sizes.every(s=>s.disabled));
listeners.get('storage')({key});assert.equal(root.dataset.mwsCursor,undefined);
callbacks.reset();assert.deepEqual(JSON.parse(storage.get(key)),{variant:'finger',size:48,colors:{mw:'#f8dce9','0216':'#f8dce9'},play:true});
for (const page of ['index.html','content-planner.html','majoku-castle.html']) {
  const html=read(page).toString();assert(html.includes('assets/mawang-cursor-v1.css?v=3'));assert(html.includes('assets/mawang-cursor-v1.js?v=4'));
}
console.log('PASS: 21 cursor images, 6 sprite strips, 8 choices, independent colors and animation, 32px color-matched edge fallback, 4 corner clamps, resize, default migration, storage, reset, native arrow, event cleanup, frame coalescing, 3 application pages');
