/* One-shot feedback helpers. No timers, observers, document listeners or data writes. */
(function(root){
  'use strict';
  const previous=new WeakMap();
  const reduced=()=>root.mwsMotionReduced?.()??root.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
  function play(node,frames,duration){
    if(!node?.animate||reduced())return;
    previous.get(node)?.cancel();
    const animation=node.animate(frames,{duration,easing:'cubic-bezier(.2,.7,.3,1)'});
    previous.set(node,animation);
  }
  function metric(node,value){
    if(!node)return;
    const text=String(value),changed=node.textContent!==text;
    if(!changed)return;
    const visible=node.getClientRects?.().length>0;
    node.textContent=text;
    if(visible)play(node,[{opacity:.64,translate:'0 2px'},{opacity:1,translate:'0 0'}],150);
  }
  function success(node){play(node,[{scale:'1'},{scale:'1.13',offset:.42},{scale:'1'}],200)}
  function nav(node){play(node,[{opacity:.65},{opacity:1}],120)}
  function menu(node){play(node,[{opacity:0,translate:'0 -3px'},{opacity:1,translate:'0 0'}],180)}
  function status(node){if(node?.getClientRects?.().length)play(node,[{opacity:.66},{opacity:1}],150)}
  function snapshot(container,selector){return new Map([...container.querySelectorAll(selector)].map(node=>[node.dataset.id,node.querySelector('.friend-finder-state-v5')?.className||'']))}
  function stateChanges(container,selector,before){for(const node of container.querySelectorAll(selector)){const state=node.querySelector('.friend-finder-state-v5');if(before.has(node.dataset.id)&&before.get(node.dataset.id)!==state?.className)status(state)}}
  root.mwsUiInteractionsV1={metric,success,nav,menu,status,snapshot,stateChanges};
})(window);
