import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const tmp=mkdtempSync(path.join(os.tmpdir(),'mws-archive-'));let browser;
try{
  const svg='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect width=%22300%22 height=%22300%22 fill=%22%237dd3fc%22/%3E%3C/svg%3E';
  const data=read('assets/mawang-archive-data-v1.js').replace(/image:id==='marorong'\?[^,]+:portraits\[id\]\?[^,]+,/,'image:id===\'marorong\'?\'/assets/mawang-archive-portraits/marorong.webp\':(portraits[id]||imageId?'+JSON.stringify(svg)+':null),');
  const runtime=read('assets/mawang-archive-v1.js').replace("'/media/mawang-profile/'+p.character+'?rev='+p.revision",JSON.stringify(svg+'#profile-')+'+p.revision').replace("(c.image?.startsWith('/assets/mawang-archive-portraits/')?{url:c.image}:null)","(c.image?{url:c.image}:null)");
  const mock=`let serial=2,profiles={mi:{character:'mi',revision:'123-abcd'}};window.fetch=async(url,opts={})=>{if(url==='/api/mawang-profile')return new Response(JSON.stringify({profiles:Object.values(profiles)}));if(url.includes('/mawang-profile/')){let character=url.split('/').pop();if(opts.method==='PUT'){let profile={character,revision:String(++serial)+'-abcd'};profiles[character]=profile;return new Response(JSON.stringify({profile}))}if(opts.method==='DELETE'){delete profiles[character];return new Response(JSON.stringify({ok:true}))}}throw Error('Unexpected endpoint '+url)};window.confirm=()=>true;`;
  const header=read('index.html').slice(read('index.html').indexOf('    <div class="topbar">'),read('index.html').indexOf('\n<section id="dashboard"'));
  const html='<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+read('assets/app-core.css')+'\n'+read('assets/mawang-archive-v1.css')+'\n'+read('assets/topbar-context-v1.css')+'\n'+read('assets/mawang-archive-header-v1.css')+'\n@media(min-width:1000px){.archive-fixture{padding-left:190px}}'+'</style><body class="mws-premium" data-theme="neon"><div class="archive-fixture"><main class="main">'+header+'<section class="section active" id="mawangArchive"><div class="mawang-archive" id="mwsArchiveRoot"></div></section></main></div><script>'+mock+'</script><script>'+data+'</script><script>'+runtime+'</script>';
  const file=path.join(tmp,'archive.html');writeFileSync(file,html);
  browser=await launchCalendarBrowser(tmp);
  for(const [width,height,mobile] of [[1366,768,false],[1920,911,false],[1920,1080,false],[2560,1440,false],[2560,1080,false],[390,844,true],[844,390,true]]){
    await browser.navigate(pathToFileURL(file).href,width,height,mobile);
    const result=await browser.evaluate(`(async()=>{
      const r=document.getElementById('mwsArchiveRoot'),q=s=>r.querySelector(s),all=s=>r.querySelectorAll(s),check=(v,m)=>{if(!v)throw Error(m)},names=()=>[...all('.ma-roster-label strong')].map(x=>x.textContent),select=id=>{for(let i=0;i<15&&!q('[data-ma-character="'+id+'"]');i++){const next=q('[data-ma-step="1"]');if(next.disabled)break;next.click()}const b=q('[data-ma-character="'+id+'"]');check(b,'selectable: '+id);b.click()},rewind=()=>{for(let i=0;i<4&&!q('.ma-pagination').textContent.startsWith('1 /');i++)q('[data-ma-step="-1"]').click()},collect=()=>{rewind();const total=Number(q('.ma-pagination').textContent.split(' / ')[1]?.split(' ')[0])||1,result=names();for(let i=1;i<total;i++){q('[data-ma-step="1"]').click();result.push(...names())}return result},hero=()=>q('.ma-main-profile img')?.src;
      for(let i=0;i<30&&!q('[data-ma-character="mi"] img')?.src.includes('profile-123-abcd');i++)await new Promise(r=>setTimeout(r,20));
      check(q('[data-ma-character="mi"] img')?.src.includes('profile-123-abcd'),'profile list loaded');
      check(!q('.ma-profile-actions, .ma-profile-label, .ma-profile-input'),'public controls absent from DOM');
      const heading=document.querySelector('.main > .topbar'),headerFilters=document.querySelector('.ma-header-filters');
      check(headerFilters?.querySelectorAll('[data-ma-filter]').length===4,'header has four category controls');
      const archiveSection=document.getElementById('mawangArchive');
      archiveSection.classList.remove('active');
      await Promise.resolve();
      check(headerFilters.hidden&&getComputedStyle(headerFilters).display==='none','archive categories disappear immediately after leaving archive');
      archiveSection.classList.add('active');
      await Promise.resolve();
      check(!headerFilters.hidden,'archive categories return only on archive');
      if(innerWidth>=1101){const h=heading.getBoundingClientRect(),nav=headerFilters.getBoundingClientRect();check(h.height<=55&&nav.width>0&&nav.right<=h.right+1&&getComputedStyle(heading).boxShadow==='none'&&getComputedStyle(heading).borderTopWidth==='0px','archive title and filters fit one compact unboxed row '+JSON.stringify({h:h.height,navRight:nav.right,headerRight:h.right}));}
      else check(getComputedStyle(headerFilters).display==='none'&&getComputedStyle(q('.ma-filters')).display!=='none','compact screen keeps filters in roster');
      check(q('#maCharacterName').textContent==='유정'&&q('.ma-count').textContent==='28 / 28','initial selection');
      check(collect().slice(0,6).join(',')==='유정,다정,백수정,흑수정,반반수정,애정','requested order');rewind();
      check(!q('[data-ma-step="-1"]').disabled&&!q('[data-ma-step="1"]').disabled&&q('.ma-pagination').textContent.startsWith('1 / '),'circular previous/next pages');
      const next=q('[data-ma-step="1"]'),nextRect=next.getBoundingClientRect(),hit=document.elementFromPoint(nextRect.x+nextRect.width/2,nextRect.y+nextRect.height/2);
      check(nextRect.width>=36&&nextRect.height>=44&&hit?.closest('button')===next,'next page is a visible and unobstructed click target '+JSON.stringify({width:innerWidth,height:innerHeight,rect:nextRect,hit:hit?.className}));
      check(names().length===13&&names().includes('꼬뫙')&&names().at(-1)==='금미정','page one contains all Jeong avatars');
      const jeongCard=q('.ma-character-card').getBoundingClientRect();
      next.click();check(q('.ma-pagination').textContent==='2 / 3 페이지 · 클래식'&&names().length===14&&names()[0]==='하카'&&!names().includes('꼬뫙'),'page two contains all classic avatars');
      const classicCard=q('.ma-character-card').getBoundingClientRect();
      next.click();check(q('.ma-pagination').textContent==='3 / 3 페이지 · 마스코트'&&names().join(',')==='마로롱'&&q('[data-ma-character="marorong"] img')?.src.includes('marorong.webp'),'third page mascot');
      const mascotCard=q('.ma-character-card').getBoundingClientRect();
      check(Math.abs(jeongCard.width-classicCard.width)<=2&&Math.abs(classicCard.width-mascotCard.width)<=2&&Math.abs(mascotCard.height-classicCard.height)<=3,'all groups use identical card dimensions '+JSON.stringify({jeong:[jeongCard.width,jeongCard.height],classic:[classicCard.width,classicCard.height],mascot:[mascotCard.width,mascotCard.height]}));next.click();check(q('.ma-pagination').textContent==='1 / 3 페이지 · 정 시리즈','last page wraps to first');q('[data-ma-step="-1"]').click();check(q('.ma-pagination').textContent==='3 / 3 페이지 · 마스코트','first page wraps to last');next.click();
      await new Promise(r=>setTimeout(r,340));check(q('.ma-roster-grid').scrollWidth<=q('.ma-roster-grid').clientWidth+1,'no horizontal scrolling');
      check(q('.ma-roster').getBoundingClientRect().bottom<=q('.ma-stage').getBoundingClientRect().top,'roster first');
      check(!q('a[href],.ma-gallery-frame,.ma-stage-nav,.ma-stage-ring,.ma-upload-input'),'profile-only, no external links or decorations');
      check(q('.ma-main-profile').getBoundingClientRect().width>=220,'large profile');
      if(innerWidth>=1000){await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const photo=q('.ma-main-profile').getBoundingClientRect();check(photo.bottom<=innerHeight-8,'whole portrait visible at initial viewport '+JSON.stringify({bottom:photo.bottom,height:innerHeight}));}
      check(getComputedStyle(q('.ma-main-profile img')).objectFit==='contain','uncropped full photo');
      check(all('.ma-character-details>div').length===3,'verified character details only');
      const heroStep=step=>q('[data-ma-hero-step="'+step+'"]'),heroClick=step=>heroStep(step).click();
      for(const step of [-1,1]){const button=heroStep(step);button.scrollIntoView({block:'center'});const rect=button.getBoundingClientRect(),art=q('.ma-stage-art').getBoundingClientRect();check(rect.width>=44&&rect.height>=44&&rect.left>=art.left&&rect.right<=art.right&&document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2)?.closest('button')===button,'hero arrow is accessible over the portrait');}
      window.scrollTo(0,0);heroClick(1);check(q('#maCharacterName').textContent==='다정'&&q('[data-ma-character="da"]').classList.contains('is-selected'),'hero next selects adjacent character');
      heroClick(-1);check(q('#maCharacterName').textContent==='유정','hero previous selects adjacent character');heroClick(-1);check(q('#maCharacterName').textContent==='마로롱'&&q('[data-ma-character="marorong"]').classList.contains('is-selected'),'hero previous wraps across roster pages');heroClick(1);check(q('#maCharacterName').textContent==='유정'&&q('.ma-pagination').textContent.startsWith('1 / '),'hero next wraps to first page');
      const lastOnPage=[...all('[data-ma-character]')].at(-1);lastOnPage.click();heroClick(1);check(q('.ma-pagination').textContent.startsWith('2 / ')&&q('[data-ma-character].is-selected')===q('[data-ma-character]'),'hero crosses roster page boundary');rewind();
      select('mi');check(hero()===q('[data-ma-character="mi"] img').src&&hero().includes('profile-123-abcd'),'saved profile exactly matches roster');
      const allNames=collect();check(allNames.length===28&&new Set(allNames).size===28&&allNames.includes('꼬뫙'),'all pages accessible and no duplicates');
      rewind();select('hina');check(q('#maCharacterName').textContent==='히나','select classic');
      q('[data-ma-filter="classic"]').click();check(collect().length===14,'classic direct view');select('baby-kuma');heroClick(1);check(q('#maCharacterName').textContent==='마로롱'&&q('.ma-pagination').textContent.startsWith('3 / '),'classic last character continues into mascot');heroClick(1);check(q('#maCharacterName').textContent==='유정'&&q('.ma-pagination').textContent.startsWith('1 / '),'mascot continues into first character');
      if(innerWidth>=1101){headerFilters.querySelector('[data-ma-filter="jeong"]').click();check(q('[data-ma-filter="jeong"]').getAttribute('aria-pressed')==='true'&&headerFilters.querySelector('[data-ma-filter="jeong"]').getAttribute('aria-pressed')==='true','header and roster category stay synced');}
      else q('[data-ma-filter="jeong"]').click();const jeong=collect();check(jeong.length===13&&jeong.includes('꼬뫙')&&jeong.slice(-2).join(',')==='흑미정,금미정','Mi series last, Kkomwang within Jeong');
      const search=q('.ma-search input');search.value='수정';search.dispatchEvent(new Event('input',{bubbles:true}));check(names().join(',')==='백수정,흑수정,반반수정','Su variants');
      const copy=q('.ma-desc').textContent;heroClick(1);check(q('#maCharacterName').textContent==='흑수정'&&q('.ma-desc').textContent===copy,'variant copy is shared');heroClick(1);check(q('#maCharacterName').textContent==='반반수정'&&q('.ma-desc').textContent===copy,'third variant copy is shared');heroClick(1);check(q('#maCharacterName').textContent==='백수정','hero navigation respects search and category');
      search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));q('[data-ma-filter="all"]').click();
      rewind();const last=[...all('[data-ma-character]')].at(-1);last.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));check(q('.ma-pagination').textContent.startsWith('2 /')&&q('[data-ma-character].is-selected')===q('[data-ma-character]'),'keyboard cross page');
      search.value='꼬뫙';search.dispatchEvent(new Event('input',{bubbles:true}));check(names().join(',')==='꼬뫙'&&q('#maCharacterName').textContent==='꼬뫙'&&!hero()&&q('.ma-desc').textContent.includes('쇼츠 콘텐츠 활성화'),'new record short-form purpose without invented photo');
      check(heroStep(-1).disabled&&heroStep(1).disabled&&!q('.ma-character-details'),'single result hides navigation and unsupported detail');
      document.body.dataset.mwsMode='admin';await Promise.resolve();check(!q('.ma-profile-actions'),'unready admin has no controls');window.__mwsAppReadyV130=true;window.dispatchEvent(new CustomEvent('mws:app-ready'));check(getComputedStyle(q('.ma-profile-actions')).display==='flex'&&!q('.ma-profile-input').multiple,'authenticated admin has single profile input');
      q('.ma-facts').scrollIntoView({block:'end'});const info=q('.ma-facts').getBoundingClientRect();check(info.bottom<=innerHeight+1,'bottom character details can be reached');window.scrollTo(0,0);
      const input=q('.ma-profile-input'),upload=async(name)=>{q('[data-ma-profile-upload]').click();const dt=new DataTransfer();dt.items.add(new File(['image'],name,{type:'image/png'}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));for(let i=0;i<30&&q('[data-ma-profile-upload]').disabled;i++)await new Promise(r=>setTimeout(r,20))};
      await upload('profile.png');const first=hero();check(first&&first===q('[data-ma-character="kkomwang"] img').src,'new profile immediate');
      await upload('replacement.png');check(hero()!==first&&hero()===q('[data-ma-character="kkomwang"] img').src,'replace matching hero');
      q('[data-ma-profile-reset]').click();for(let i=0;i<30&&q('[data-ma-profile-upload]').disabled;i++)await new Promise(r=>setTimeout(r,20));check(!hero(),'reset only profile');
      search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));rewind();select('mi');check(hero().includes('profile-123-abcd'),'other saved profile intact');
      document.body.dataset.mwsMode='public';await Promise.resolve();check(!q('.ma-profile-actions, .ma-profile-label, .ma-profile-input'),'logout removes controls');
      q('.ma-main-profile img').dispatchEvent(new Event('error'));check(q('.ma-main-profile .ma-portrait').classList.contains('ma-image-missing'),'broken profile fallback');
      document.documentElement.dataset.mwsMotion='reduced';check(getComputedStyle(q('.ma-stage-info')).animationName==='none','reduced animation');check(getComputedStyle(q('[data-ma-character]')).transitionDuration==='0s','reduced transition');
      check(document.documentElement.scrollWidth<=innerWidth+2,'horizontal viewport overflow');
      return {width:innerWidth,grid:q('.ma-roster-grid').getBoundingClientRect().width,profile:q('.ma-main-profile').getBoundingClientRect().width};
    })()`);
    console.log('PASS archive',width,height,result);
  }
}finally{await browser?.close();rmSync(tmp,{recursive:true,force:true})}
