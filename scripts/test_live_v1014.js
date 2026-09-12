const {chromium}=require('playwright');
(async()=>{
  const base='https://mawang-scheduler.majoku.workers.dev';
  const health=await fetch(base+'/api/health').then(r=>r.text());
  if(!health.includes('CF MWS V 1.0.14')) throw new Error('live health version mismatch: '+health.slice(0,300));
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base+'/content-planner.html?v=1.0.14',{waitUntil:'load'});
  await page.waitForTimeout(350);
  if((await page.title())!=='MAWANG Content Planner V1.0.14') throw new Error('live planner title mismatch: '+await page.title());

  await page.evaluate(()=>{contactDb=[{id:'p1',name:'참가자',image:'',labels:[]}];addParticipant('p1')});
  const a1=await page.locator('.participant-node.selected .participant-avatar').boundingBox();
  await page.evaluate(()=>{const n=document.querySelector('.participant-node.selected'),e=getEl(n.dataset.id);e.w=300;e.h=360;renderPositions()});
  await page.waitForTimeout(40);
  const a2=await page.locator('.participant-node.selected .participant-avatar').boundingBox();
  if(!a1||!a2||a2.width<=a1.width*1.6) throw new Error('participant avatar scaling failed '+JSON.stringify({a1,a2}));

  await page.evaluate(()=>{addTextAtV110(240,200,320,70);clearSelection()});
  const textNode=page.locator('.node.text-node').last();
  await textNode.locator('.editable').click();
  if(!(await textNode.evaluate(n=>n.classList.contains('selected')))) throw new Error('text re-selection failed');
  if((await textNode.locator('.editable').getAttribute('contenteditable'))!=='true') throw new Error('selected text not editable');
  const stateBefore=await textNode.evaluate(n=>{const e=getEl(n.dataset.id);return{x:e.x,y:e.y}});
  const hb=await textNode.locator('.drag-handle').boundingBox();
  if(!hb) throw new Error('text move handle missing');
  await page.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2); await page.mouse.down();
  await page.mouse.move(hb.x+100,hb.y+70,{steps:5}); await page.mouse.up(); await page.waitForTimeout(40);
  const stateAfter=await textNode.evaluate(n=>{const e=getEl(n.dataset.id);return{x:e.x,y:e.y}});
  if(stateAfter.x<=stateBefore.x+60||stateAfter.y<=stateBefore.y+40) throw new Error('text MOVE state failed '+JSON.stringify({stateBefore,stateAfter}));
  await textNode.locator('.editable').fill('수정된 텍스트');
  if((await textNode.locator('.editable').textContent())!=='수정된 텍스트') throw new Error('text edit failed');

  const closeStyle=await textNode.locator('.node-delete').evaluate(b=>({bg:getComputedStyle(b).backgroundColor,border:getComputedStyle(b).borderTopWidth}));
  if(closeStyle.bg!=='rgba(0, 0, 0, 0)'||closeStyle.border!=='0px') throw new Error('close button decoration remains '+JSON.stringify(closeStyle));

  await page.click('#toolBrush'); await page.locator('#drawSize').evaluate((el)=>{el.value='11';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.click('#toolEraser'); await page.locator('#drawSize').evaluate((el)=>{el.value='47';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.click('#toolBrush'); if((await page.locator('#drawSize').inputValue())!=='11') throw new Error('brush size not retained');
  const menu=await page.locator('#brushSizeMenu').boundingBox(), group=await page.locator('#toolBrush').locator('..').boundingBox();
  if(!menu||!group||menu.x<group.x-2) throw new Error('brush popup hidden left '+JSON.stringify({menu,group}));
  await page.click('#toolEraser'); if((await page.locator('#drawSize').inputValue())!=='47') throw new Error('eraser size not retained');

  await page.evaluate(()=>window.dispatchEvent(new MessageEvent('message',{origin:location.origin,data:{type:'mws:planner-emoticons',emoticons:[{id:'user-test',name:'사용자 테스트',src:'data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%2210%22%3E%3Crect width=%2210%22 height=%2210%22 fill=%22red%22/%3E%3C/svg%3E'}]}})));
  if(await page.locator('#stickerGrid .sticker-pick[title="사용자 테스트"]').count()!==1) throw new Error('custom emoticon not received');

  await page.evaluate(async()=>{const bytes=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z9gAAAABJRU5ErkJggg=='),c=>c.charCodeAt(0));const f=new File([bytes],'drop.png',{type:'image/png'});await addImageFileV114(f,{x:700,y:500})});
  if(await page.locator('.node.image-node').count()<1) throw new Error('image insertion failed');

  if(errors.length) throw new Error('page errors: '+errors.join(' | '));
  console.log('LIVE V1.0.14 verification passed',{stateBefore,stateAfter,a1,a2});
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
