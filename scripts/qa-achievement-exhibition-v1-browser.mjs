import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
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
assert(html.includes('assets/achievement-exhibition-v1.css?v=2'));
const styles=['app-core.css','mawang-premium-v1621.css','device-ui.css','ui-frame-presets.css','achievement-exhibition-v1.css','achievement-gallery-v1621.css'].map(p=>read('assets/'+p)).join('\n');
const runtime=read('assets/achievement-gallery-v1621.js');
const bootstrap=`
const fixtureCards=Array.from({length:26},(_,i)=>({id:'card-'+i,order:26-i,gameName:i===25?'A Difficult Game About Climbing':'Game '+i,contentName:'특별한 순간 '+i,description:'Original description '+i,frontImageId:'image-'+i}));
window.mwsGetAchievementCardsV1621=()=>fixtureCards;
window.fixtureMediaRequests=0;
window.mwsAchievementMediaV1={getBlob:async()=>{window.fixtureMediaRequests++;return new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="200" height="300" fill="#675143"/><circle cx="100" cy="126" r="65" fill="#c6a162"/></svg>'],{type:'image/svg+xml'})}};
`;
const fixture='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+styles+'\nbody{margin:0}.qa-shell{padding:20px;box-sizing:border-box;margin-left:180px}.qa-shell .section.active{display:block}@media(max-width:760px){.qa-shell{margin-left:0;padding:12px}}</style><body data-theme="neon" class="mws-premium"><main class="qa-shell"><h1 id="pageTitle">업적</h1>'+section+'</main><script>'+bootstrap+'</script><script>'+runtime+'</script></body></html>';
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
  await browser.clickPoint(result.firstCard.x,result.firstCard.y);
  const opened=await browser.evaluate(`(()=>{const modal=document.getElementById('achievementDetailModal');return !!modal&&!modal.hidden&&modal.querySelector('#achievementDetailTitle').textContent==='특별한 순간 25'&&modal.querySelector('[data-achievement-detail="description"]').textContent==='Original description 25'&&!!modal.querySelector('[data-achievement-card3d]')})()`);
  assert(opened,'Existing card detail action failed');
  await browser.evaluate(`document.querySelector('.achievement-detail-close').click()`);
  assert(await browser.evaluate(`document.getElementById('achievementDetailModal').hidden`));
  const empty=await browser.evaluate(`(async()=>{window.mwsGetAchievementCardsV1621=()=>[];await window.mwsRenderAchievementGalleryV1621();return !document.getElementById('achievementEmptyState').hidden&&document.getElementById('achievementGallery').hidden&&document.getElementById('achievementCountChip').textContent==='0장'&&!document.getElementById('achievementExhibitionPreview').children.length})()`);
  assert(empty,'Empty collection state failed');
  console.log('ACHIEVEMENT_EXHIBITION_OK',width,height,JSON.stringify(result));
 }
}finally{await browser?.close();rmSync(temp,{recursive:true,force:true})}
