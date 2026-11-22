import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const tmp=mkdtempSync(path.join(os.tmpdir(),'mws-archive-'));let browser;
try{
  // Fixtures do not depend on external image hosts. A fake failed image is
  // dispatched separately to exercise the same real image error handler.
  const svg='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect width=%22300%22 height=%22300%22 fill=%22%237dd3fc%22/%3E%3C/svg%3E';
  const data=read('assets/mawang-archive-data-v1.js').replace(/image:portraits\[id\]\?[^,]+,/,'image:'+JSON.stringify(svg)+',').replace(/profileImage:'[^']+'/,'profileImage:'+JSON.stringify(svg));
  const runtime=read('assets/mawang-archive-v1.js').replace(/https:\/\/i\.ytimg\.com\/vi\/'\+id\+'\/hqdefault\.jpg/,'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22300%22%20height=%22300%22/%3E');
  const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+read('assets/app-core.css')+'\n'+read('assets/mawang-archive-v1.css')+'</style><main class="main"><section class="section active" id="mawangArchive"><div class="mawang-archive" id="mwsArchiveRoot"></div></section></main><script>'+data+'</script><script>'+runtime+'</script>';
  const file=path.join(tmp,'archive.html');writeFileSync(file,html);
  browser=await launchCalendarBrowser(tmp);
  for(const [width,height,mobile] of [[1366,768,false],[1920,1080,false],[2560,1440,false],[2560,1080,false],[390,844,true],[844,390,true]]){
    await browser.navigate(pathToFileURL(file).href,width,height,mobile);
    const result=await browser.evaluate(`(()=>{
      const r=document.getElementById('mwsArchiveRoot'),q=s=>r.querySelector(s),all=s=>r.querySelectorAll(s);
      const check=(v,m)=>{if(!v)throw Error(m)};
      check(q('#maCharacterName').textContent==='유정','initial character');
      check(all('[data-ma-character]').length===23,'roster count');
      q('[data-ma-character="hina"]').click();check(q('#maCharacterName').textContent==='히나','select');
      q('[data-ma-filter="classic"]').click();check(all('[data-ma-character]').length===14,'classic');
      const search=q('input');search.value='코코';search.dispatchEvent(new Event('input',{bubbles:true}));
      check(all('[data-ma-character]').length===3,'search');
      search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
      q('[data-ma-filter="jeong"]').click();check(all('[data-ma-character]').length===9,'jeong');
      q('[data-ma-character="mi"]').click();q('[data-ma-character="mi"]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));check(q('#maCharacterName').textContent==='예정','keyboard');
      q('[data-ma-step="1"]').click();check(q('#maCharacterName').textContent==='선정','next character');
      q('.ma-stage-art img[data-ma-image]')?.dispatchEvent(new Event('error'));check(q('.ma-stage-art .ma-portrait').classList.contains('ma-image-missing'),'broken image fallback');
      document.documentElement.dataset.mwsMotion='reduced';check(getComputedStyle(q('.ma-stage-info')).animationName==='none','reduced animation');check(getComputedStyle(q('[data-ma-character]')).transitionDuration==='0s','reduced transition');
      check(document.documentElement.scrollWidth<=innerWidth+2,'horizontal overflow: '+document.documentElement.scrollWidth+' > '+innerWidth);
      return {width:innerWidth,stage:q('.ma-stage').getBoundingClientRect().width,grid:q('.ma-roster-grid').getBoundingClientRect().width};
    })()`);
    console.log('PASS archive',width,height,result);
  }
}finally{await browser?.close();rmSync(tmp,{recursive:true,force:true})}
