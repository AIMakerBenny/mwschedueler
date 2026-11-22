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
  root.mwsUiInteractionsV1={metric,success,nav,menu};
})(window);
