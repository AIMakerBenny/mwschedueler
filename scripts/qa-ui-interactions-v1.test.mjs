import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('motion defaults to system and preserves saved user choices',()=>{
  const source=read('index.html').match(/<script id="mws-motion-preference">([\s\S]*?)<\/script>/)[1];
  for(const [saved,initial,expected,after] of [[null,false,false,true],[null,true,true,false],['full',true,false,false],['reduced',false,true,true]]){
    let change;
    const system={matches:initial,addEventListener(type,fn){change=fn}};
    const window={dispatchEvent(){}},document={documentElement:{dataset:{}},addEventListener(){}};
    vm.runInNewContext(source,{window,document,matchMedia:()=>system,localStorage:{getItem:()=>saved},Event:class{}});
    assert.equal(window.mwsMotionReduced(),expected);
    system.matches=!initial;change();assert.equal(window.mwsMotionReduced(),after);
  }
});

test('feedback only animates changed, visible values; reduced motion is respected',()=>{
  let system=false,setting;
  const window={matchMedia:()=>({matches:system}),mwsMotionReduced:()=>setting};
  vm.runInNewContext(read('assets/ui-interactions-v1.js'),{window});
  const api=window.mwsUiInteractionsV1,animations=[];
  const node={textContent:'0',getClientRects:()=>[{}],animate(frames,options){const animation={frames,options,cancelled:false,cancel(){this.cancelled=true}};animations.push(animation);return animation}};
  api.metric(node,0);assert.equal(animations.length,0);
  api.metric(node,1);assert.equal(node.textContent,'1');assert.equal(animations.length,1);
  api.metric(node,'1');assert.equal(animations.length,1);
  api.metric(node,2);assert.equal(animations.length,2);assert(animations[0].cancelled);
  system=true;api.metric(node,3);assert.equal(node.textContent,'3');assert.equal(animations.length,2);
  setting=false;api.success(node);assert.equal(animations.length,3);assert.equal(animations.at(-1).options.duration,200);
  setting=true;api.success(node);assert.equal(animations.length,3);
  setting=false;node.getClientRects=()=>[];api.metric(node,4);assert.equal(animations.length,3);assert.equal(node.textContent,'4');
});

test('production references the shared design layer and preserves existing event/drag owners',()=>{
  const index=read('index.html'),core=read('assets/app-core.js'),css=read('assets/ui-interactions-v1.css');
  assert(index.includes('assets/ui-interactions-v1.css?v=2')&&index.includes('assets/ui-interactions-v1.js?v=1'));
  assert(core.includes('highlightedGroup===id')&&core.includes('data-mws-ui-group')&&core.includes('highlightGroup(\'\');hideCalendarEventPreview()'));
  assert(core.includes('beginCalendarPointerEventDragV174(e,el)')&&core.includes('saveData(\'캘린더 복사 보관함 추가\')'));
  assert(css.includes('scale:1.02')&&css.includes('scale:.98!important')&&css.includes('@media (hover:hover) and (pointer:fine)'));
  assert(!/\btransition\s*:[^;{}]*\b(?:all|width|height|margin|padding)\b/.test(css));
});
