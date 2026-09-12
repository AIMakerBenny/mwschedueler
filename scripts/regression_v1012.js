const {chromium}=require('playwright');

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:960}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4173/content-planner.html',{waitUntil:'load'});
  await page.waitForTimeout(500);

  const normal=await page.evaluate(()=>{
    resizePlannerCanvas();
    const r=document.getElementById('board').getBoundingClientRect();
    return{ratio:r.width/r.height,w:r.width,h:r.height};
  });
  if(Math.abs(normal.ratio-1.6)>.02)throw new Error('normal canvas stretched '+JSON.stringify(normal));

  await page.evaluate(()=>{document.body.classList.add('planner-fullscreen');resizePlannerCanvas()});
  await page.waitForTimeout(100);
  const full=await page.evaluate(()=>{
    const r=document.getElementById('board').getBoundingClientRect();
    const c=getComputedStyle(document.getElementById('creatorMode'));
    return{ratio:r.width/r.height,cols:c.gridTemplateColumns,rows:c.gridTemplateRows};
  });
  if(Math.abs(full.ratio-1.6)>.02)throw new Error('fullscreen canvas stretched '+JSON.stringify(full));
  await page.evaluate(()=>{document.body.classList.remove('planner-fullscreen');resizePlannerCanvas()});

  const shape=await page.evaluate(()=>{
    const btn=document.querySelector('button[onclick*="toggleShapeMenu"]');
    toggleShapeMenu({stopPropagation(){},currentTarget:btn});
    const r=document.getElementById('shapeMenu').getBoundingClientRect();
    return{left:r.left,right:r.right,vw:innerWidth};
  });
  if(shape.left<0||shape.right>shape.vw+1)throw new Error('shape menu overflow '+JSON.stringify(shape));

  const part=await page.evaluate(()=>{
    const e=addElement('participant',{w:120,h:150,data:{contactId:'test',name:'테스트 참가자',image:'',labels:[],team:'',role:''}});
    render();
    e.w=60;e.h=75;render();
    const n=document.querySelector(`.node[data-id="${e.id}"]`);
    const a=n.querySelector('.participant-avatar');
    const t=n.querySelector('.participant-name');
    const nr=n.getBoundingClientRect(),ar=a.getBoundingClientRect(),tr=t.getBoundingClientRect();
    return{nw:nr.width,nh:nr.height,aw:ar.width,ah:ar.height,nameRight:tr.right,nodeRight:nr.right,nameBottom:tr.bottom,nodeBottom:nr.bottom};
  });
  if(part.aw>part.nw||part.ah>part.nh||part.nameRight>part.nodeRight+1||part.nameBottom>part.nodeBottom+1){
    throw new Error('participant contents overflow '+JSON.stringify(part));
  }

  const saved=await page.evaluate(async()=>{
    openCanvasInfoModal();
    document.getElementById('canvasInfoTitle').value='V112 regression';
    document.getElementById('canvasInfoAuthor').value='test';
    document.getElementById('canvasInfoSummary').value='one';
    await saveCanvasInfo();
    let rows=await dbAll();
    const id=state.activeProposalId;
    openCanvasInfoModal();
    document.getElementById('canvasInfoSummary').value='two';
    await saveCanvasInfo();
    rows=await dbAll();
    const row=rows.find(x=>x.id===id);
    return{count:rows.filter(x=>x.title==='V112 regression').length,summary:row?.summary,id:!!id};
  });
  if(!saved.id||saved.count!==1||saved.summary!=='two')throw new Error('save/archive integration failed '+JSON.stringify(saved));

  if(errors.length)throw new Error('page errors: '+errors.join(' | '));
  await browser.close();
  console.log(JSON.stringify({normal,full,shape,part,saved},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
