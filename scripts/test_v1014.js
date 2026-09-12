const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4173/content-planner.html',{waitUntil:'load'});
  await page.waitForTimeout(250);

  await page.evaluate(()=>{contactDb=[{id:'p1',name:'참가자',image:'',labels:[]}];addParticipant('p1')});
  const a1=await page.locator('.participant-node.selected .participant-avatar').boundingBox();
  await page.evaluate(()=>{const n=document.querySelector('.participant-node.selected'),e=getEl(n.dataset.id);e.w=300;e.h=360;renderPositions()});
  await page.waitForTimeout(40);
  const a2=await page.locator('.participant-node.selected .participant-avatar').boundingBox();
  if(!a1||!a2||a2.width<=a1.width*1.6)throw new Error('participant avatar did not scale '+JSON.stringify({a1,a2}));

  await page.evaluate(()=>{addTextAtV110(240,200,320,70);clearSelection()});
  const textNode=page.locator('.node.text-node').last();
  await textNode.locator('.editable').click();
  if(!(await textNode.evaluate(n=>n.classList.contains('selected'))))throw new Error('text not reselectable');
  const before=await textNode.boundingBox();
  const hb=await textNode.locator('.drag-handle').boundingBox();
  if(!before||!hb)throw new Error('move handle missing');
  await page.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2); await page.mouse.down();
  await page.mouse.move(hb.x+100,hb.y+70,{steps:5}); await page.mouse.up(); await page.waitForTimeout(40);
  const after=await textNode.boundingBox();
  if(!after||after.x<before.x+60||after.y<before.y+40)throw new Error('text MOVE failed '+JSON.stringify({before,after}));
  await textNode.locator('.editable').fill('수정된 텍스트');
  if((await textNode.locator('.editable').textContent())!=='수정된 텍스트')throw new Error('text edit failed');

  const closeStyle=await textNode.locator('.node-delete').evaluate(b=>({bg:getComputedStyle(b).backgroundColor,border:getComputedStyle(b).borderTopWidth}));
  if(closeStyle.bg!=='rgba(0, 0, 0, 0)'||closeStyle.border!=='0px')throw new Error('close button still decorated '+JSON.stringify(closeStyle));

  await page.click('#toolBrush'); await page.locator('#drawSize').fill('11'); await page.locator('#drawSize').dispatchEvent('input');
  await page.click('#toolEraser'); await page.locator('#drawSize').fill('47'); await page.locator('#drawSize').dispatchEvent('input');
  await page.click('#toolBrush'); let v=await page.locator('#drawSize').inputValue(); if(v!=='11')throw new Error('brush size not retained '+v);
  const menuBox=await page.locator('#brushSizeMenu').boundingBox(), groupBox=await page.locator('#toolBrush').locator('..').boundingBox();
  if(!menuBox||!groupBox||menuBox.x<groupBox.x-2)throw new Error('brush menu opens under left category '+JSON.stringify({menuBox,groupBox}));
  await page.click('#toolEraser'); v=await page.locator('#drawSize').inputValue(); if(v!=='47')throw new Error('eraser size not retained '+v);

  await page.evaluate(()=>window.dispatchEvent(new MessageEvent('message',{origin:location.origin,data:{type:'mws:planner-emoticons',emoticons:[{id:'user-test',name:'사용자 테스트',src:'data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22%3E%3Crect width=%2210%22 height=%2210%22 fill=%22red%22/%3E%3C/svg%3E'}]}})));
  await page.evaluate(()=>renderStickerGridV110());
  if(await page.locator('#stickerGrid .sticker-pick[title="사용자 테스트"]').count()!==1)throw new Error('custom emoticon missing');

  await page.evaluate(async()=>{const bytes=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z9gAAAABJRU5ErkJggg=='),c=>c.charCodeAt(0));const f=new File([bytes],'drop.png',{type:'image/png'});await addImageFileV114(f,{x:700,y:500})});
  if(await page.locator('.node.image-node').count()<1)throw new Error('image insertion helper failed');

  if(errors.length)throw new Error('page errors: '+errors.join(' | '));
  console.log('V1.0.14 planner regression passed');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
