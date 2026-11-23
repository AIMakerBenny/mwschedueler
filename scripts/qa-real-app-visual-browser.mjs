import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {launchCalendarBrowser} from './calendar-browser-realtime.mjs';

// Exercises the real public Cloudflare Workers site, not a truncated fixture.
// Candidate CSS/JS is injected into a temporary Chromium tab only. No writes.
const url=process.env.MWS_REAL_APP_URL||'https://mawang-scheduler.majoku.workers.dev/';
assert(/^https:\/\/mawang-scheduler\.majoku\.workers\.dev\/$/.test(url),'Public production host only');
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const clean=read('assets/workspace-clean-v1.css');
const visual=read('assets/visual-experience-v1.css');
const behavior=read('assets/visual-experience-v1.js');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const dir=mkdtempSync(path.join(os.tmpdir(),'mws-real-visual-'));
const output='visual-real-app';
const capture=process.env.MWS_REAL_VISUAL_CAPTURE==='1';
let browser;
try{
  browser=await launchCalendarBrowser(dir);
  for(const [width,height,mobile] of [[1366,768,false],[1920,1080,false],[390,844,true]]){
    await browser.navigate(url,width,height,mobile);
    let state=null;
    for(let n=0;n<110;n++){
      state=await browser.evaluate("(()=>({cells:document.querySelectorAll('#calendarGrid .day').length,calendar:!!document.querySelector('#calendar.active'),app:!!document.querySelector('.app:not([inert])'),startup:document.body.dataset.calendarStartup||'',title:document.querySelector('#pageTitle')?.textContent?.trim()}))()");
      if(state.cells>=28&&state.calendar&&state.app&&state.startup!=='pending')break;
      await sleep(150);
    }
    assert(state.cells>=28&&state.calendar&&state.app&&state.startup!=='pending','Real public calendar never reached settled state: '+JSON.stringify({width,state}));
    // Dismiss the announcement only in this ephemeral public QA browser so
    // the actual calendar, not the onboarding overlay, is visually inspected.
    await browser.evaluate("(()=>{const dialog=document.querySelector('#mwsAnnouncementDialog');if(dialog?.open){dialog.querySelector('[data-notice-close]')?.click()}return !document.querySelector('#mwsAnnouncementDialog[open]')})()");
    await sleep(100);
    // Swap the production copy of the edited stylesheet, then load the PR's
    // new CSS and JS. This does not change files or data on the hosted site.
    const injected=await browser.evaluate('(()=>{'+
      'const old=[...document.querySelectorAll("link[rel=stylesheet]")].find(link=>link.href.includes("/assets/workspace-clean-v1.css"));'+
      'if(!old)return {ok:false,reason:"workspace-clean stylesheet not found"};old.remove();'+
      'const style=(id,css)=>{const el=document.createElement("style");el.id=id;el.textContent=css;document.body.append(el)};'+
      'style("mws-candidate-clean",'+JSON.stringify(clean)+');'+
      'style("mws-candidate-visual",'+JSON.stringify(visual)+');'+
      'const run=document.createElement("script");run.textContent='+JSON.stringify(behavior)+';document.body.append(run);'+
      'return {ok:true,clean:true,visual:!!document.querySelector("#mws-candidate-visual")}})()');
    assert(injected.ok,'Could not inject candidate styles: '+JSON.stringify(injected));
    await sleep(280);
    const result=await browser.evaluate("(()=>{const $=s=>document.querySelector(s),visible=e=>!!e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().width>0;const grid=$('#calendarGrid'),title=$('#pageTitle'),wiki=$('#mwsArchiveWikiLink'),kicker=$('.mws-archive-kicker'),first=$('#calendarGrid .day'),style=first&&getComputedStyle(first),r=grid?.getBoundingClientRect();const svgs=[...document.querySelectorAll('.topbar svg')].filter(visible).map(e=>e.getBoundingClientRect().width);return {title:title?.textContent?.trim(),calendar:!!$('#calendar.active'),dayCount:grid?.querySelectorAll('.day').length,gridWidth:r?.width,gridHeight:r?.height,firstDayWidth:first?.getBoundingClientRect().width,overflow:document.documentElement.scrollWidth>innerWidth+4,kickerVisible:visible(kicker),wikiVisible:visible(wiki),maxVisibleHeaderSvg:Math.max(0,...svgs),dayShadow:style?.boxShadow,dayBackground:style?.backgroundImage,applicationInert:document.querySelector('.app')?.hasAttribute('inert'),pending:document.body.dataset.calendarStartup==='pending',candidateStyle:!!$('#mws-candidate-visual'),appWidth:document.querySelector('.app')?.getBoundingClientRect().width}})()");
    assert(result.calendar&&result.dayCount>=28&&result.gridHeight>180&&result.gridWidth>200&&result.firstDayWidth>10&&result.appWidth>200,'Actual calendar visually invalid: '+JSON.stringify({width,result}));
    assert(!result.overflow&&!result.kickerVisible&&!result.wikiVisible&&result.maxVisibleHeaderSvg<=40&&!result.applicationInert&&!result.pending,'Broken header, blocked app or viewport overflow: '+JSON.stringify({width,result}));
    const cssDiagnostics=await browser.evaluate("(()=>({bodyClass:document.body.className,calendarContainsGrid:document.querySelector('#calendar')?.contains(document.querySelector('#calendarGrid')),scopedDays:document.querySelectorAll('body.mws-premium #calendar #calendarGrid .day').length,unscopedDays:document.querySelectorAll('#calendarGrid .day').length,firstDayInlineStyle:document.querySelector('#calendarGrid .day')?.getAttribute('style')||'',styleSheetRules:document.querySelector('#mws-candidate-visual')?.sheet?.cssRules?.length||0,styleSheetText:document.querySelector('#mws-candidate-visual')?.textContent?.length||0,panel:getComputedStyle(document.querySelector('#calendarGrid .day')).getPropertyValue('--panel'),text:getComputedStyle(document.querySelector('#calendarGrid .day')).getPropertyValue('--text'),backgroundDecl:[...document.querySelector('#mws-candidate-visual').sheet.cssRules].find(r=>r.selectorText==='body.mws-premium #calendar #calendarGrid .day')?.style.getPropertyValue('background'),backgroundSupported:CSS.supports('background','linear-gradient(155deg,color-mix(in srgb,var(--text) 3%,var(--panel)),var(--panel) 46%)')}))()");
    console.log('MWS_CANDIDATE_CSS_DIAGNOSTICS',width,JSON.stringify(cssDiagnostics));
    if(!result.dayBackground.includes('gradient')){
      const cascade=await browser.evaluate("(()=>{const el=document.querySelector('#calendarGrid .day'),rows=[];for(const sheet of document.styleSheets){let rules;try{rules=sheet.cssRules}catch{continue}function walk(all){for(const rule of all){if(rule.cssRules?.length)walk(rule.cssRules);if(!rule.selectorText||!rule.style)continue;try{if(!el.matches(rule.selectorText))continue}catch{continue}for(const key of ['background','background-image','background-color']){const value=rule.style.getPropertyValue(key);if(value)rows.push({source:sheet.href?.slice(-95)||sheet.ownerNode?.id||'inline',selector:rule.selectorText.slice(0,180),key,value:value.slice(0,190),priority:rule.style.getPropertyPriority(key)})}}}walk(rules)}return rows.slice(-55)})()");
      console.log('MWS_BACKGROUND_CASCADE',width,JSON.stringify(cascade));
    }

    if(capture){mkdirSync(output,{recursive:true});writeFileSync(path.join(output,'calendar-debug-'+width+'.jpg'),Buffer.from(await browser.captureScreenshot(),'base64'));writeFileSync(path.join(output,'calendar-debug-'+width+'.json'),JSON.stringify({result,cssDiagnostics},null,2));}
    assert(result.candidateStyle&&result.dayBackground.includes('gradient'),'Candidate calendar style not loaded: '+JSON.stringify({width,result,cssDiagnostics}));
    if(capture){
      mkdirSync(output,{recursive:true});
      writeFileSync(path.join(output,'calendar-'+width+'.jpg'),Buffer.from(await browser.captureScreenshot(),'base64'));
      writeFileSync(path.join(output,'calendar-'+width+'.json'),JSON.stringify(result,null,2));
    }
    const tab=await browser.evaluate("(()=>{if(typeof window.setTab!=='function')return {ok:false};window.setTab('dashboard');return {ok:!!document.querySelector('#dashboard.active'),count:document.querySelectorAll('#dashboard .dashboard-kpi-grid-local>.card').length}})()");
    assert(tab.ok&&tab.count===6,'Real dashboard failed navigation: '+JSON.stringify({width,tab}));
    await sleep(250);
    if(capture&&width===1920)writeFileSync(path.join(output,'dashboard-'+width+'.jpg'),Buffer.from(await browser.captureScreenshot(),'base64'));
    console.log('MWS_REAL_APP_VISUAL_OK',width,height,JSON.stringify(result));
  }
}finally{
  await browser?.close();
  rmSync(dir,{recursive:true,force:true});
}
