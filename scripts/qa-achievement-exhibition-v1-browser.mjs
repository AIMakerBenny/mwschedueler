import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import os from 'node:os';
import path from 'node:path';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html');
const start=html.indexOf('<section id="achievements"');
const end=html.indexOf('</section>',start);
assert(start>=0&&end>start);
const section=html.slice(start,end+10).replace('class="section"','class="section active"');
assert(html.includes('assets/achievement-exhibition-v1.css?v=5'));
const styles=['app-core.css','mawang-premium-v1621.css','device-ui.css','ui-frame-presets.css','achievement-exhibition-v1.css','achievement-gallery-v1621.css','ui-interactions-v1.css'].map(p=>read('assets/'+p)).join('\n');
const runtime=read('assets/achievement-gallery-v1621.js');
const bootstrap=`
const fixtureCards=Array.from({length:26},(_,i)=>({id:'card-'+i,order:26-i,gameName:i===25?'A Difficult Game About Climbing':'Game '+i,contentName:'특별한 순간 '+i,description:'Original description '+i,frontImageId:'image-'+i}));
window.mwsGetAchievementCardsV1621=()=>fixtureCards;
window.fixtureMediaRequests=0;
window.mwsAchievementMediaV1={getBlob:async()=>{window.fixtureMediaRequests++;return new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="200" height="300" fill="#675143"/><circle cx="100" cy="126" r="65" fill="#c6a162"/></svg>'],{type:'image/svg+xml'})}};
`;
const fixture='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+styles+'\nbody{margin:0}.qa-shell{padding:20px;box-sizing:border-box;margin-left:180px}.qa-shell .section.active{display:block}@media(max-width:760px){.qa-shell{margin-left:0;padding:12px}}</style><body data-theme="neon" class="mws-premium"><main class="qa-shell"><h1 id="pageTitle">업적</h1>'+section+'</main><script>'+bootstrap+'</script><script>'+runtime+'</script></body></html>';
const capture=process.env.MWS_HALL_CAPTURE==='1';
const output='visual-achievement-hall';
if(capture)mkdirSync(output,{recursive:true});
const temp=mkdtempSync(path.join(os.tmpdir(),'mws-achievement-exhibition-'));let browser;
try{
 const file=path.join(temp,'index.html');writeFileSync(file,fixture);
 browser=await launchCalendarBrowser(temp);
 for(const [width,height,columns] of [[1366,768,4],[1920,1080,5],[2560,1440,6],[390,844,2]]){
  await browser.navigate(pathToFileURL(file).href+'?width='+width,width,height);
  const result=await browser.evaluate(`(async()=>{
   window.fixtureMediaRequests=0;
   await window.mwsRenderAchievementGalleryV1621();
   const grid=document.getElementById('achievementGallery'),tiles=[...grid.children],r=e=>e.getBoundingClientRect(),first=tiles[0],thumb=first.querySelector('.achievement-card-thumb'),button=first.querySelector('button'),caption=first.querySelector('.achievement-card-caption'),img=thumb.querySelector('img');
   await img.decode();
   const styles=getComputedStyle(grid),box=r(thumb),frame=r(button);
   const actualColumns=styles.gridTemplateColumns.split(' ').length;
   const firstRow=tiles.filter(t=>Math.abs(r(t).top-r(first).top)<1);
   const horizontalGutter=firstRow.length>1?r(firstRow[1]).left-r(first).right:0;
   const secondRow=tiles[actualColumns],verticalGutter=r(secondRow).top-r(first).bottom;
   const header=document.querySelector('.achievement-gallery-head');
   const preview=document.getElementById('achievementExhibitionPreview'),previewImages=[...preview.querySelectorAll('img')];
   const previewsMatch=previewImages.length===3&&previewImages.every((im,i)=>im.src===tiles[i].querySelector('img').src);
   const previewVisible=getComputedStyle(preview).display!=='none';
   const heroFits=r(header).right<=innerWidth+1&&r(header.querySelector('.achievement-exhibition-stat')).right<=r(header).right;
   return {previewsMatch,previewVisible,heroFits,mediaRequests:window.fixtureMediaRequests,laurels:!!header.querySelector('.achievement-laurels'),collectionHeading:document.querySelector('.achievement-collection-heading h3').textContent,actualColumns,cardCount:tiles.length,sorted:tiles.every((t,i)=>t.dataset.achievementCardId==='card-'+(25-i)),count:document.getElementById('achievementCountChip').textContent,heading:header.querySelector('h2').textContent,oneTitle:document.querySelector('#pageTitle').textContent==='업적'&&!header.textContent.includes('업적'),horizontalGutter,verticalGutter,ratio:Math.abs(box.width/box.height-2/3)<.01,imageFit:getComputedStyle(img).objectFit==='contain',frame:frame.width-box.width>=12&&getComputedStyle(button).borderRadius!=='0px',caption:r(caption).top>=box.bottom-1,rootFits:document.documentElement.scrollWidth<=innerWidth+1,imageReady:img.naturalWidth>0,firstCard:{x:frame.left+frame.width/2,y:box.top+Math.min(60,box.height/2)}};
  })()`);
  assert.equal(result.actualColumns,columns,JSON.stringify(result));
  assert(result.previewsMatch&&result.heroFits&&result.laurels,JSON.stringify(result));
  assert.equal(result.previewVisible,width>760);
  assert.equal(result.mediaRequests,26);
  assert.equal(result.collectionHeading,'전체 컬렉션');
  assert.equal(result.cardCount,26);assert.equal(result.count,'26장');assert.equal(result.heading,'명예의 전당');
  assert(result.sorted&&result.oneTitle&&result.ratio&&result.imageFit&&result.frame&&result.caption&&result.rootFits&&result.imageReady,JSON.stringify(result));
  assert(result.horizontalGutter>=(width>760?25:12)-.5&&result.verticalGutter>=(width>760?25:12)-.5,JSON.stringify(result));
  const firstOverlay=await browser.evaluate("(()=>{const first=document.querySelector('.achievement-card-open');const peek=first.querySelector('.achievement-card-peek');return {exists:!!peek,text:peek?.textContent.trim(),hidden:getComputedStyle(peek).opacity==='0'}})()");
  assert(firstOverlay.exists&&firstOverlay.text==='Original description 25'&&firstOverlay.hidden,JSON.stringify(firstOverlay));
  if(capture){
    writeFileSync(path.join(output,'hall-'+width+'-default.jpg'),Buffer.from(await browser.captureScreenshot(),'base64'));
  }
  if(width>760){
    const hoverMotion=await browser.evaluate(`(async()=>{
      const button=document.querySelector('.achievement-card-open'),box=button.getBoundingClientRect();
      button.dispatchEvent(new PointerEvent('pointermove',{
        bubbles:true,pointerType:'mouse',
        clientX:box.left+box.width*.8,clientY:box.top+box.height*.2
      }));
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      return {
        tiltX:button.style.getPropertyValue('--ach-tilt-x'),
        tiltY:button.style.getPropertyValue('--ach-tilt-y'),
        lightX:button.style.getPropertyValue('--ach-light-x'),
        transition:getComputedStyle(button).transitionProperty
      };
    })()`);
    assert(Number.parseFloat(hoverMotion.tiltX)>0&&Number.parseFloat(hoverMotion.tiltY)>0,JSON.stringify(hoverMotion));
    assert(Number.parseFloat(hoverMotion.lightX)>50&&hoverMotion.transition.includes('transform'),JSON.stringify(hoverMotion));
    assert(await browser.evaluate("(()=>{const b=document.querySelector('.achievement-card-open');return parseFloat(b.style.getPropertyValue('--ach-parallax-x'))<0&&parseFloat(b.style.getPropertyValue('--ach-parallax-y'))>0})()"),'Real parallax values missing');
    // Actual mouse enters the card, not just a synthesized pointer event.
    await browser.movePoint(result.firstCard.x,result.firstCard.y);
    await new Promise(resolve=>setTimeout(resolve,420));
    const onHover=await browser.evaluate("(()=>{const b=document.querySelector('.achievement-card-open'),peek=b.querySelector('.achievement-card-peek'),img=b.querySelector('.achievement-card-thumb img'),spot=getComputedStyle(b.querySelector('.achievement-card-thumb'),'::before');return {overlayVisibility:getComputedStyle(peek).visibility,overlayHeight:peek.getBoundingClientRect().height,overlayPaintOrder:img.nextSibling===peek,hover:b.matches(':hover'),cardTransform:getComputedStyle(b).transform,imageTransform:getComputedStyle(img).transform,peekOpacity:getComputedStyle(peek).opacity,peekY:getComputedStyle(peek).transform,reflection:spot.opacity,firstTileZ:getComputedStyle(b.closest('.achievement-card-tile')).zIndex}})()");
    assert(onHover.hover&&onHover.overlayPaintOrder&&onHover.overlayHeight>40&&onHover.overlayVisibility==='visible'&&onHover.cardTransform!=='none'&&onHover.imageTransform!=='none'&&Number(onHover.peekOpacity)>.9&&Number(onHover.reflection)>.4&&onHover.firstTileZ==='4',JSON.stringify({width,onHover}));
    if(capture)writeFileSync(path.join(output,'hall-'+width+'-hover.jpg'),Buffer.from(await browser.captureScreenshot(),'base64'));
    await browser.movePoint(6,height-6);
    await new Promise(resolve=>setTimeout(resolve,350));
    const afterLeave=await browser.evaluate("(()=>{const b=document.querySelector('.achievement-card-open');return {tilt:b.style.getPropertyValue('--ach-tilt-x'),parallax:b.style.getPropertyValue('--ach-parallax-x'),peek:getComputedStyle(b.querySelector('.achievement-card-peek')).opacity}})()");
    assert(afterLeave.tilt===''&&afterLeave.parallax===''&&Number(afterLeave.peek)<.05,JSON.stringify({width,afterLeave}));
    // Reduced-motion settings prevent positional animation while preserving focus.
    const reduced=await browser.evaluate("(()=>{document.documentElement.dataset.mwsMotion='reduced';const b=document.querySelector('.achievement-card-open'),img=b.querySelector('.achievement-card-thumb img');return {card:getComputedStyle(b).transitionDuration,image:getComputedStyle(img).transitionDuration}})()");
    assert(reduced.card.split(',').every(x=>parseFloat(x)===0)&&reduced.image.split(',').every(x=>parseFloat(x)===0),JSON.stringify({width,reduced}));
    await browser.evaluate("delete document.documentElement.dataset.mwsMotion");
  }else{
    const mobile=await browser.evaluate("(()=>({peek:getComputedStyle(document.querySelector('.achievement-card-peek')).display,scroll:document.documentElement.scrollWidth-innerWidth}))()");
    assert(mobile.peek==='none'&&mobile.scroll<=1,JSON.stringify(mobile));
  }
  await browser.clickPoint(result.firstCard.x,result.firstCard.y);
  const opened=await browser.evaluate(`(()=>{const modal=document.getElementById('achievementDetailModal');return !!modal&&!modal.hidden&&modal.querySelector('#achievementDetailTitle').textContent==='특별한 순간 25'&&modal.querySelector('[data-achievement-detail="description"]').textContent==='Original description 25'&&!!modal.querySelector('[data-achievement-card3d]')})()`);
  assert(opened,'Existing card detail action failed');
  const geometry=await browser.evaluate(`(()=>{
    const modal=document.querySelector('.achievement-detail-modal'),dialog=document.querySelector('.achievement-detail-dialog'),stage=document.querySelector('.achievement-detail-stage'),controls=document.querySelector('.achievement-detail-controls'),info=document.querySelector('.achievement-detail-info');
    const b=e=>e.getBoundingClientRect(),d=b(dialog),c=b(controls),st=b(stage);
    return {dialogScroll:dialog.scrollHeight-dialog.clientHeight,modalScroll:modal.scrollHeight-modal.clientHeight,dialogBottom:d.bottom,dialogRight:d.right,controlsBottom:c.bottom,ratio:st.width/st.height,stageHeight:st.height,infoKeyboard:info.tabIndex===0,infoOverflow:getComputedStyle(info).overflowY,dialogOverflow:getComputedStyle(dialog).overflowY};
  })()`);
  assert(Math.abs(geometry.ratio-2/3)<.015&&geometry.stageHeight>100&&geometry.infoKeyboard,JSON.stringify({width,geometry}));
  assert(geometry.dialogRight<=width+1&&geometry.dialogBottom<=height+1&&geometry.controlsBottom<=height+1,JSON.stringify({width,geometry}));
  if(width>760){
    assert(geometry.dialogScroll<=2&&geometry.modalScroll<=2&&geometry.dialogOverflow==='hidden',JSON.stringify({width,geometry}));
    assert(geometry.infoOverflow==='auto',JSON.stringify({width,geometry}));
  }
  if(capture)writeFileSync(path.join(output,'hall-'+width+'-detail-front.jpg'),Buffer.from(await browser.captureScreenshot(),'base64'));
  if(width>760){
    const pt=await browser.evaluate(`(()=>{const r=document.querySelector('.achievement-detail-stage').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
    await browser.mouseDown(pt.x,pt.y);await browser.mouseDrag(pt.x+155,pt.y);await browser.mouseUp(pt.x+155,pt.y);
    const rotated=await browser.evaluate(`Number(document.querySelector('[data-achievement-card3d]').dataset.rotateY)`);
    assert(rotated>=75&&rotated<=105,'3D drag did not reach side view: '+rotated);
    if(capture)writeFileSync(path.join(output,'hall-'+width+'-detail-side.jpg'),Buffer.from(await browser.captureScreenshot(),'base64'));
    await browser.mouseDown(pt.x,pt.y);await browser.mouseDrag(pt.x+155,pt.y);await browser.mouseUp(pt.x+155,pt.y);
    const back=await browser.evaluate(`Number(document.querySelector('[data-achievement-card3d]').dataset.rotateY)`);
    assert(back>=165&&back<=200,'3D drag did not reach back view: '+back);
    if(capture)writeFileSync(path.join(output,'hall-'+width+'-detail-back.jpg'),Buffer.from(await browser.captureScreenshot(),'base64'));
    await browser.evaluate(`document.querySelector('.achievement-detail-reset').click()`);
    assert.equal(await browser.evaluate(`Number(document.querySelector('[data-achievement-card3d]').dataset.rotateY)`),0,'Front reset did not work');
  }
  await browser.evaluate(`(()=>{
    document.querySelector('.achievement-detail-close').click();
    window.mwsGetAchievementCardsV1621=()=>fixtureCards.map(c=>({...c,description:c.id==='card-25'?'긴 설명 테스트 '.repeat(1100):c.description}));
    document.querySelector('.achievement-card-open').click();
  })()`);
  const longInfo=await browser.evaluate(`(()=>{
    const modal=document.querySelector('.achievement-detail-modal'),dialog=document.querySelector('.achievement-detail-dialog'),info=document.querySelector('.achievement-detail-info'),dd=info.querySelector('.achievement-detail-description-row dd');
    const infoCanScroll=info.scrollHeight>info.clientHeight+5;
    const modalCanScroll=modal.scrollHeight>modal.clientHeight+5;
    if(infoCanScroll)info.scrollTop=info.scrollHeight;
    if(modalCanScroll)modal.scrollTop=modal.scrollHeight;
    return {text:dd.textContent.length,infoCanScroll,modalCanScroll,infoScrollTop:info.scrollTop,modalScrollTop:modal.scrollTop,dialogScroll:dialog.scrollHeight-dialog.clientHeight};
  })()`);
  assert(longInfo.text>8000,JSON.stringify({width,longInfo}));
  if(width>760)assert(longInfo.infoCanScroll&&longInfo.infoScrollTop>100&&longInfo.dialogScroll<=2,JSON.stringify({width,longInfo}));
  else assert(longInfo.modalCanScroll&&longInfo.modalScrollTop>100,JSON.stringify({width,longInfo}));
  if(capture)writeFileSync(path.join(output,'hall-'+width+'-detail-long.jpg'),Buffer.from(await browser.captureScreenshot(),'base64'));
  await browser.evaluate(`(()=>{document.querySelector('.achievement-detail-close').click();window.mwsGetAchievementCardsV1621=()=>fixtureCards})()`);
  assert(await browser.evaluate(`document.getElementById('achievementDetailModal').hidden`));
  const empty=await browser.evaluate(`(async()=>{window.mwsGetAchievementCardsV1621=()=>[];await window.mwsRenderAchievementGalleryV1621();return !document.getElementById('achievementEmptyState').hidden&&document.getElementById('achievementGallery').hidden&&document.getElementById('achievementCountChip').textContent==='0장'&&!document.getElementById('achievementExhibitionPreview').children.length})()`);
  assert(empty,'Empty collection state failed');
  console.log('ACHIEVEMENT_EXHIBITION_OK',width,height,JSON.stringify(result));
 }
}finally{await browser?.close();rmSync(temp,{recursive:true,force:true})}
