import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const tmp=mkdtempSync(path.join(os.tmpdir(),'mws-archive-'));let browser;
try{
  const svg='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect width=%22300%22 height=%22300%22 fill=%22%237dd3fc%22/%3E%3C/svg%3E';
  const data=read('assets/mawang-archive-data-v1.js').replace(/image:portraits\[id\]\?[^,]+,/,'image:'+JSON.stringify(svg)+',');
  const runtime=read('assets/mawang-archive-v1.js').replace("'/media/mawang-profile/'+p.character+'?rev='+p.revision",JSON.stringify(svg+'#profile-')+'+p.revision');
  const mock=`let serial=2,profiles={mi:{character:'mi',revision:'123-abcd'}};window.fetch=async(url,opts={})=>{if(url==='/api/mawang-profile')return new Response(JSON.stringify({profiles:Object.values(profiles)}));if(url.includes('/mawang-profile/')){let character=url.split('/').pop();if(opts.method==='PUT'){let profile={character,revision:String(++serial)+'-abcd'};profiles[character]=profile;return new Response(JSON.stringify({profile}))}if(opts.method==='DELETE'){delete profiles[character];return new Response(JSON.stringify({ok:true}))}}throw Error('Unexpected endpoint '+url)};window.confirm=()=>true;`;
  const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+read('assets/app-core.css')+'\n'+read('assets/mawang-archive-v1.css')+'\n@media(min-width:1000px){.main{margin-left:190px}}'+'</style><main class="main"><div style="height:76px"></div><section class="section active" id="mawangArchive"><div class="mawang-archive" id="mwsArchiveRoot"></div></section></main><script>'+mock+'</script><script>'+data+'</script><script>'+runtime+'</script>';
  const file=path.join(tmp,'archive.html');writeFileSync(file,html);
  browser=await launchCalendarBrowser(tmp);
  for(const [width,height,mobile] of [[1366,768,false],[1920,911,false],[1920,1080,false],[2560,1440,false],[2560,1080,false],[390,844,true],[844,390,true]]){
    await browser.navigate(pathToFileURL(file).href,width,height,mobile);
    const result=await browser.evaluate(`(async()=>{
      const r=document.getElementById('mwsArchiveRoot'),q=s=>r.querySelector(s),all=s=>r.querySelectorAll(s),check=(v,m)=>{if(!v)throw Error(m)},names=()=>[...all('.ma-roster-label strong')].map(x=>x.textContent),select=id=>{for(let i=0;i<15&&!q('[data-ma-character="'+id+'"]');i++){const next=q('[data-ma-step="1"]');if(next.disabled)break;next.click()}const b=q('[data-ma-character="'+id+'"]');check(b,'selectable: '+id);b.click()},rewind=()=>{while(!q('[data-ma-step="-1"]').disabled)q('[data-ma-step="-1"]').click()},collect=()=>{rewind();const result=names();while(!q('[data-ma-step="1"]').disabled){q('[data-ma-step="1"]').click();result.push(...names())}return result},hero=()=>q('.ma-main-profile img')?.src;
      for(let i=0;i<30&&q('[data-ma-profile-upload]').disabled;i++)await new Promise(r=>setTimeout(r,20));
      check(!q('[data-ma-profile-upload]').disabled,'profile list loaded');
      check(getComputedStyle(q('.ma-profile-actions')).display==='none','public upload hidden');
      check(q('#maCharacterName').textContent==='유정'&&q('.ma-count').textContent==='27 / 27','initial selection');
      check(collect().slice(0,6).join(',')==='유정,다정,백수정,흑수정,반반수정,애정','requested order');rewind();
      check(q('[data-ma-step="-1"]').disabled&&!q('[data-ma-step="1"]').disabled&&q('.ma-pagination').textContent.startsWith('1 / '),'visible previous/next pages');
      check(q('.ma-roster-grid').scrollWidth<=q('.ma-roster-grid').clientWidth+1,'no horizontal scrolling');
      check(q('.ma-roster').getBoundingClientRect().bottom<=q('.ma-stage').getBoundingClientRect().top,'roster first');
      check(!q('a[href],.ma-gallery-frame,.ma-stage-nav,.ma-stage-ring,.ma-upload-input'),'profile-only, no external links or decorations');
      check(q('.ma-main-profile').getBoundingClientRect().width>=220,'large profile');
      if(innerWidth>=1000){const photo=q('.ma-main-profile').getBoundingClientRect();check(photo.bottom<=innerHeight-8,'whole portrait visible at initial viewport '+JSON.stringify({bottom:photo.bottom,height:innerHeight}));}
      check(getComputedStyle(q('.ma-main-profile img')).objectFit==='contain','uncropped full photo');
      check(all('.ma-character-details>div').length===2,'expanded character details');
      select('mi');check(hero()===q('[data-ma-character="mi"] img').src&&hero().includes('profile-123-abcd'),'saved profile exactly matches roster');
      const allNames=collect();check(allNames.length===27&&new Set(allNames).size===27&&allNames.includes('꼬뫙'),'all pages accessible and no duplicates');
      rewind();select('hina');check(q('#maCharacterName').textContent==='히나','select classic');
      q('[data-ma-filter="classic"]').click();check(collect().length===14,'classic direct view');
      q('[data-ma-filter="jeong"]').click();const jeong=collect();check(jeong.length===12&&jeong.slice(-2).join(',')==='흑미정,금미정','Mi series last');
      const search=q('.ma-search input');search.value='수정';search.dispatchEvent(new Event('input',{bubbles:true}));check(names().join(',')==='백수정,흑수정,반반수정','Su variants');
      search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));q('[data-ma-filter="all"]').click();
      rewind();const last=[...all('[data-ma-character]')].at(-1);last.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));check(q('.ma-pagination').textContent.startsWith('2 /')&&q('[data-ma-character].is-selected')===q('[data-ma-character]'),'keyboard cross page');
      search.value='꼬뫙';search.dispatchEvent(new Event('input',{bubbles:true}));check(names().join(',')==='꼬뫙'&&q('#maCharacterName').textContent==='꼬뫙'&&!hero(),'new record no invented photo');
      document.body.dataset.mwsMode='admin';check(getComputedStyle(q('.ma-profile-actions')).display==='flex'&&!q('.ma-profile-input').multiple,'single profile input');
      const input=q('.ma-profile-input'),upload=async(name)=>{q('[data-ma-profile-upload]').click();const dt=new DataTransfer();dt.items.add(new File(['image'],name,{type:'image/png'}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));for(let i=0;i<30&&q('[data-ma-profile-upload]').disabled;i++)await new Promise(r=>setTimeout(r,20))};
      await upload('profile.png');const first=hero();check(first&&first===q('[data-ma-character="kkomwang"] img').src,'new profile immediate');
      await upload('replacement.png');check(hero()!==first&&hero()===q('[data-ma-character="kkomwang"] img').src,'replace matching hero');
      q('[data-ma-profile-reset]').click();for(let i=0;i<30&&q('[data-ma-profile-upload]').disabled;i++)await new Promise(r=>setTimeout(r,20));check(!hero(),'reset only profile');
      search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));rewind();select('mi');check(hero().includes('profile-123-abcd'),'other saved profile intact');
      q('.ma-main-profile img').dispatchEvent(new Event('error'));check(q('.ma-main-profile .ma-portrait').classList.contains('ma-image-missing'),'broken profile fallback');
      document.documentElement.dataset.mwsMotion='reduced';check(getComputedStyle(q('.ma-stage-info')).animationName==='none','reduced animation');check(getComputedStyle(q('[data-ma-character]')).transitionDuration==='0s','reduced transition');
      check(document.documentElement.scrollWidth<=innerWidth+2,'horizontal viewport overflow');
      return {width:innerWidth,grid:q('.ma-roster-grid').getBoundingClientRect().width,profile:q('.ma-main-profile').getBoundingClientRect().width};
    })()`);
    console.log('PASS archive',width,height,result);
  }
}finally{await browser?.close();rmSync(tmp,{recursive:true,force:true})}
