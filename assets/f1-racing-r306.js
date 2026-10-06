(()=>{
'use strict';
const VERSION306='phase306-f1-marker-overlay-collision-avoidance';
const stateV306={installed:false,timer:0,observer:null,layoutCount:0,lastReport:null};

function stageV306(){return document.querySelector('#f1RacingViewRaceV185 .f1-racing-race-map-stage-v188')}
function rectShiftV306(rect,dx,dy){return {left:rect.left+dx,right:rect.right+dx,top:rect.top+dy,bottom:rect.bottom+dy,width:rect.width,height:rect.height}}
function intersectsV306(a,b,pad=6){return a.left<b.right+pad&&a.right>b.left-pad&&a.top<b.bottom+pad&&a.bottom>b.top-pad}
function insideV306(rect,bounds,margin=4){return rect.left>=bounds.left+margin&&rect.right<=bounds.right-margin&&rect.top>=bounds.top+margin&&rect.bottom<=bounds.bottom-margin}
function positionV306(node){return Math.max(1,Number(node?.closest('.f1-racing-race-vehicle-v189')?.dataset?.livePositionV254)||999)}
function chooseOffsetV306(base,bounds,placed,candidates,pad=6){
 for(const [dx,dy] of candidates){
  const next=rectShiftV306(base,dx,dy);
  if(!insideV306(next,bounds,4))continue;
  if(placed.some(other=>intersectsV306(next,other,pad)))continue;
  return {dx,dy,rect:next};
 }
 const fallback=candidates.find(([dx,dy])=>insideV306(rectShiftV306(base,dx,dy),bounds,2))||[0,0];
 return {dx:fallback[0],dy:fallback[1],rect:rectShiftV306(base,fallback[0],fallback[1])};
}
function layoutThoughtsV306(bounds){
 const nodes=[...document.querySelectorAll('.f1-racing-driver-thought-v303')].filter(node=>node.isConnected);
 nodes.forEach(node=>{node.style.setProperty('--v306-thought-x','0px');node.style.setProperty('--v306-thought-y','0px')});
 nodes.sort((a,b)=>positionV306(a)-positionV306(b));
 const placed=[],rows=[];
 const candidates=[[0,0],[-76,-16],[76,-16],[-92,-64],[92,-64],[0,-92],[-132,-38],[132,-38],[-110,46],[110,46],[0,58]];
 for(const node of nodes){
  let selected=null;
  for(const [dx,dy] of candidates){
   node.style.setProperty('--v306-thought-x',dx+'px');
   node.style.setProperty('--v306-thought-y',dy+'px');
   const actual=node.getBoundingClientRect();
   if(!insideV306(actual,bounds,3))continue;
   if(placed.some(other=>intersectsV306(actual,other,8)))continue;
   selected={dx,dy,rect:actual};break;
  }
  if(!selected){
   let best=null;
   for(const [dx,dy] of candidates){
    node.style.setProperty('--v306-thought-x',dx+'px');
    node.style.setProperty('--v306-thought-y',dy+'px');
    const actual=node.getBoundingClientRect();
    const overlapArea=placed.reduce((sum,other)=>{
     const w=Math.max(0,Math.min(actual.right,other.right)-Math.max(actual.left,other.left));
     const h=Math.max(0,Math.min(actual.bottom,other.bottom)-Math.max(actual.top,other.top));
     return sum+w*h;
    },0);
    const penalty=insideV306(actual,bounds,1)?0:100000;
    const score=overlapArea+penalty;
    if(!best||score<best.score)best={dx,dy,rect:actual,score};
   }
   selected=best;
  }
  node.style.setProperty('--v306-thought-x',selected.dx+'px');
  node.style.setProperty('--v306-thought-y',selected.dy+'px');
  node.dataset.v306Shift=selected.dx+','+selected.dy;
  placed.push(selected.rect);
  rows.push({position:positionV306(node),dx:selected.dx,dy:selected.dy});
 }
 return rows;
}
function layoutPositionTagsV306(bounds){
 const nodes=[...document.querySelectorAll('.car-position-tag-v254')].filter(node=>node.isConnected);
 nodes.forEach(node=>{node.style.setProperty('--v306-tag-x','0px');node.style.setProperty('--v306-tag-y','0px')});
 nodes.sort((a,b)=>positionV306(a)-positionV306(b));
 const placed=[],rows=[];
 const candidates=[[0,0],[-36,0],[36,0],[0,36],[-36,36],[36,36],[-54,18],[54,18],[0,-36],[-54,-18],[54,-18],[-72,36],[72,36]];
 for(const node of nodes){
  let selected=null;
  for(const [dx,dy] of candidates){
   node.style.setProperty('--v306-tag-x',dx+'px');
   node.style.setProperty('--v306-tag-y',dy+'px');
   const actual=node.getBoundingClientRect();
   if(!insideV306(actual,bounds,2))continue;
   if(placed.some(other=>intersectsV306(actual,other,3)))continue;
   selected={dx,dy,rect:actual};break;
  }
  if(!selected){
   const [dx,dy]=candidates.at(-1);
   node.style.setProperty('--v306-tag-x',dx+'px');
   node.style.setProperty('--v306-tag-y',dy+'px');
   selected={dx,dy,rect:node.getBoundingClientRect()};
  }
  node.dataset.v306Shift=selected.dx+','+selected.dy;
  placed.push(selected.rect);
  rows.push({position:positionV306(node),dx:selected.dx,dy:selected.dy});
 }
 return rows;
}
function overlapCountV306(selector,pad=2){
 const nodes=[...document.querySelectorAll(selector)].filter(node=>node.isConnected&&getComputedStyle(node).display!=='none'&&Number(getComputedStyle(node).opacity||1)>.05);
 const rects=nodes.map(node=>node.getBoundingClientRect()),pairs=[];
 for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++)if(intersectsV306(rects[i],rects[j],pad))pairs.push([i,j]);
 return {count:pairs.length,pairs,nodes:nodes.length};
}
function layoutV306(){
 const stage=stageV306();if(!stage||String(window.mwsF1GetScreenStateV185?.()||'')!=='RACE')return null;
 const bounds=stage.getBoundingClientRect();
 const thoughts=layoutThoughtsV306(bounds),tags=layoutPositionTagsV306(bounds);
 stateV306.layoutCount+=1;
 const report={version:VERSION306,thoughts,tags,thoughtOverlap:overlapCountV306('.f1-racing-driver-thought-v303',1),tagOverlap:overlapCountV306('.car-position-tag-v254',0)};
 report.allPass=report.thoughtOverlap.count===0&&report.tagOverlap.count===0;
 stateV306.lastReport=report;return report;
}
function scheduleV306(){requestAnimationFrame(()=>requestAnimationFrame(layoutV306))}
function installV306(){
 if(stateV306.installed)return true;stateV306.installed=true;
 const layer=document.getElementById('f1RacingRaceVehicleLayerV188');
 if(layer){stateV306.observer=new MutationObserver(scheduleV306);stateV306.observer.observe(layer,{childList:true,subtree:true})}
 stateV306.timer=window.setInterval(()=>{if(String(window.mwsF1GetScreenStateV185?.()||'')==='RACE')layoutV306()},240);
 window.addEventListener('resize',scheduleV306,{passive:true});window.visualViewport?.addEventListener('resize',scheduleV306,{passive:true});
 scheduleV306();return true;
}
function qaV306(){const report=layoutV306()||{thoughtOverlap:{count:0,nodes:0},tagOverlap:{count:0,nodes:0},allPass:true};return {...report,installed:stateV306.installed,layoutCount:stateV306.layoutCount,allPass:Boolean(stateV306.installed&&report.allPass)}}
window.mwsF1LayoutMarkerOverlaysV306=layoutV306;
window.mwsF1QaMarkerOverlayCollisionV306=qaV306;
window.__mwsF1RacingV306=VERSION306;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installV306,{once:true});else installV306();
})();