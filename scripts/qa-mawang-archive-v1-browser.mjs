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
  const runtime=read('assets/mawang-archive-v1.js').replace(/https:\/\/i\.ytimg\.com\/vi\/'\+id\+'\/hqdefault\.jpg/,'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22300%22%20height=%22300%22/%3E').replace("'/media/mawang-archive/'+p.character+'/'+p.id",JSON.stringify(svg+"#")+"+p.id").replace("'/media/mawang-profile/'+p.character+'?rev='+p.revision",JSON.stringify(svg+'#profile-')+'+p.revision');
  const mock=`let stored=[{character:'ye',id:'00000000-0000-4000-8000-000000000001'},{character:'ye',id:'00000000-0000-4000-8000-000000000002'}];let serial=2,profiles={};window.fetch=async(url,opts={})=>{if(url.includes('/mawang-profile/')){let character=url.split('/').pop();if(opts.method==='PUT'){let profile={character,revision:String(++serial)+'-abcd'};profiles[character]=profile;return new Response(JSON.stringify({profile}))}if(opts.method==='DELETE'){delete profiles[character];return new Response(JSON.stringify({ok:true}))}}let [,character,id]=url.match(/mawang-gallery(?:\\/([^/]+)(?:\\/([^/]+))?)?$/)||[];if(opts.method==='POST'){let photo={character,id:'00000000-0000-4000-8000-'+String(++serial).padStart(12,'0')};stored.unshift(photo);return new Response(JSON.stringify({photo}),{status:201})}if(opts.method==='DELETE'){stored=stored.filter(p=>p.id!==id);return new Response(JSON.stringify({ok:true}))}return new Response(JSON.stringify({photos:stored,profiles:Object.values(profiles)}))};window.confirm=()=>true;`;
  const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+read('assets/app-core.css')+'\n'+read('assets/mawang-archive-v1.css')+'</style><main class="main"><section class="section active" id="mawangArchive"><div class="mawang-archive" id="mwsArchiveRoot"></div></section></main><script>'+mock+'</script><script>'+data+'</script><script>'+runtime+'</script>';
  const file=path.join(tmp,'archive.html');writeFileSync(file,html);
  browser=await launchCalendarBrowser(tmp);
  for(const [width,height,mobile] of [[1366,768,false],[1920,1080,false],[2560,1440,false],[2560,1080,false],[390,844,true],[844,390,true]]){
    await browser.navigate(pathToFileURL(file).href,width,height,mobile);
    const result=await browser.evaluate(`(async()=>{
      const r=document.getElementById('mwsArchiveRoot'),q=s=>r.querySelector(s),all=s=>r.querySelectorAll(s);
      const check=(v,m)=>{if(!v)throw Error(m)};
      check(q('#maCharacterName').textContent==='유정','initial character');
      for(let i=0;i<30&&q('[data-ma-upload]').disabled;i++)await new Promise(r=>setTimeout(r,20));
      check(!q('[data-ma-upload]').disabled,'gallery loaded');
      check(getComputedStyle(q('.ma-gallery-actions')).display==='none','public upload hidden');
      check(getComputedStyle(q('.ma-profile-actions')).display==='none','public profile hidden');
      check(all('[data-ma-character]').length===26,'roster count');
      check(q('.ma-roster').getBoundingClientRect().bottom<=q('.ma-stage').getBoundingClientRect().top,'roster first');
      check(q('.ma-character-card .ma-portrait').getBoundingClientRect().width>=100,'large portraits');
      check(q('.ma-roster-grid').scrollWidth>q('.ma-roster-grid').clientWidth,'horizontal roster');
      q('[data-ma-character="hina"]').click();check(q('#maCharacterName').textContent==='히나','select');
      q('[data-ma-filter="classic"]').click();check(all('[data-ma-character]').length===14,'classic');
      const search=q('input');search.value='코코';search.dispatchEvent(new Event('input',{bubbles:true}));
      check(all('[data-ma-character]').length===3,'search');
      search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
      q('[data-ma-filter="jeong"]').click();check(all('[data-ma-character]').length===12,'jeong');
      search.value='수정';search.dispatchEvent(new Event('input',{bubbles:true}));check(all('[data-ma-character]').length===3,'three Su variants');
      q('[data-ma-character="su-half"]').click();check(q('#maCharacterName').textContent==='반반수정'&&q('.ma-stage-nav span').textContent==='0 / 0','half variant independent');
      search.value='미정';search.dispatchEvent(new Event('input',{bubbles:true}));check(all('[data-ma-character]').length===2,'two Mi variants');
      q('[data-ma-character="mi-gold"]').click();check(q('#maCharacterName').textContent==='금미정'&&q('.ma-stage-nav span').textContent==='0 / 0','gold variant independent');
      search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
      q('[data-ma-character="mi-gold"]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));check(q('#maCharacterName').textContent==='예정','keyboard');
      check(all('[data-ma-photo]').length===3,'two uploaded plus original');
      q('[data-ma-step="1"]').click();check(q('#maCharacterName').textContent==='예정'&&q('[data-ma-photo="1"]').getAttribute('aria-pressed')==='true','next photo, same avatar');
      q('[data-ma-photo="0"]').click();
      const frame=q('.ma-gallery-frame');frame.dispatchEvent(new WheelEvent('wheel',{deltaY:120,bubbles:true,cancelable:true}));
      check(q('[data-ma-photo="1"]').getAttribute('aria-pressed')==='true','wheel next photo');
      frame.dispatchEvent(new PointerEvent('pointerdown',{pointerId:1,isPrimary:true,button:0,pointerType:'mouse',clientX:200,clientY:100,bubbles:true}));
      frame.dispatchEvent(new PointerEvent('pointerup',{pointerId:1,isPrimary:true,button:0,pointerType:'mouse',clientX:100,clientY:100,bubbles:true}));
      check(q('[data-ma-photo="2"]').getAttribute('aria-pressed')==='true','drag next photo');
      q('[data-ma-character="ae"]').click();check(q('.ma-stage-nav span').textContent==='0 / 0','empty character');
      document.body.dataset.mwsMode='admin';check(getComputedStyle(q('.ma-gallery-actions')).display==='flex','admin upload visible');
      check(getComputedStyle(q('.ma-profile-actions')).display==='flex','admin profile visible');
      check(!q('.ma-profile-input').multiple&&q('.ma-upload-input').multiple,'independent input modes');
      q('[data-ma-upload]').click();
      const input=q('.ma-upload-input'),dt=new DataTransfer();dt.items.add(new File(['image'],'first.png',{type:'image/png'}));dt.items.add(new File(['image'],'second.png',{type:'image/png'}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
      for(let i=0;i<30&&q('[data-ma-upload]').disabled;i++)await new Promise(r=>setTimeout(r,20));
      check(all('[data-ma-photo]').length===2&&q('.ma-gallery-message').textContent.includes('2장 업로드 완료'),'multiple upload');
      check(!q('[data-ma-character="ae"] img'),'gallery does not change profile');
      const profileInput=q('.ma-profile-input'),uploadProfile=async(name)=>{q('[data-ma-profile-upload]').click();const dt=new DataTransfer();dt.items.add(new File(['image'],name,{type:'image/png'}));profileInput.files=dt.files;profileInput.dispatchEvent(new Event('change',{bubbles:true}));for(let i=0;i<30&&q('[data-ma-profile-upload]').disabled;i++)await new Promise(r=>setTimeout(r,20))};
      await uploadProfile('profile.png');check(q('.ma-profile-label').textContent==='등록된 프로필 사진'&&q('[data-ma-character="ae"] img'),'profile upload');
      const profileURL=q('[data-ma-character="ae"] img').src;
      await uploadProfile('replacement.png');check(q('[data-ma-character="ae"] img').src!==profileURL&&all('[data-ma-photo]').length===2,'profile replacement preserves gallery');
      q('[data-ma-delete]').click();for(let i=0;i<30&&q('[data-ma-upload]').disabled;i++)await new Promise(r=>setTimeout(r,20));
      check(all('[data-ma-photo]').length===1,'delete uploaded photo only');
      check(q('[data-ma-character="ae"] img'),'gallery delete preserves profile');
      q('[data-ma-profile-reset]').click();for(let i=0;i<30&&q('[data-ma-profile-upload]').disabled;i++)await new Promise(r=>setTimeout(r,20));
      check(!q('[data-ma-character="ae"] img')&&all('[data-ma-photo]').length===1,'profile reset preserves gallery');
      q('[data-ma-character="ye"]').click();check(all('[data-ma-photo]').length===3,'separate character galleries');
      q('.ma-stage-art img[data-ma-image]')?.dispatchEvent(new Event('error'));check(q('.ma-stage-art .ma-portrait').classList.contains('ma-image-missing'),'broken image fallback');
      document.documentElement.dataset.mwsMotion='reduced';check(getComputedStyle(q('.ma-stage-info')).animationName==='none','reduced animation');check(getComputedStyle(q('[data-ma-character]')).transitionDuration==='0s','reduced transition');
      check(document.documentElement.scrollWidth<=innerWidth+2,'horizontal overflow: '+document.documentElement.scrollWidth+' > '+innerWidth);
      return {width:innerWidth,stage:q('.ma-stage').getBoundingClientRect().width,grid:q('.ma-roster-grid').getBoundingClientRect().width};
    })()`);
    console.log('PASS archive',width,height,result);
  }
}finally{await browser?.close();rmSync(tmp,{recursive:true,force:true})}
