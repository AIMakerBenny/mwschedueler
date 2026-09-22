import fs from 'node:fs';

export function runPhase170RuntimeOverlapCleanupAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const wardogsCss=fs.readFileSync('assets/wardogs-v1.css','utf8');
  const activeLoader=fs.readFileSync('assets/cloud-v1.1-loader.js','utf8');
  const stagedLoader=fs.readFileSync('assets/cloud-runtime-loader-v130.js','utf8');
  const device=fs.readFileSync('assets/device-ui.js','utf8');
  const majoku=fs.readFileSync('assets/majoku-host-fix-v114.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');
  const post=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  const retired=["assets/boss-manager-v116.js","assets/boss-tools-v119.js","assets/friend-live-preview-v120.js","assets/majoku-sidebar-v110.js","assets/majoku-sidebar-v111.js","assets/neo-v1.0.0.css","assets/steam-game-v110.js","assets/test-v5.3.js","assets/ui-fixes-v113.js","assets/wardogs-gallery-phase142.css"];
  for(const file of retired)if(fs.existsSync(file))issues.push('retired duplicate/legacy file still exists: '+file);

  if(index.includes('assets/wardogs-gallery-phase142.css'))issues.push('retired WARDOGS override stylesheet is still linked');
  if(!index.includes("assets/wardogs-v1.css?v=1.0.0-phase125-mobile129-portrait138-gallery136-aperture152-medicaperture165-classapertures166-unassigned168-framepreload169-consolidated170"))issues.push('consolidated WARDOGS stylesheet revision is missing');

  for(const token of [
    '/* Phase 170: consolidated gallery transparency. Former Phase 142/151 override stylesheet merged here. */',
    '.wardogs-gallery-visual-v124.wardogs-portrait-stage-v134{background:transparent!important}',
    '.wardogs-gallery-visual-v124 img.wardogs-portrait-image-v134{background:transparent!important}'
  ])if(!wardogsCss.includes(token))issues.push('consolidated WARDOGS CSS missing: '+token);

  for(const [name,src] of [['active cloud loader',activeLoader],['staged cloud loader',stagedLoader]]){
    if(src.includes('calendar-drag-layout-fix.css'))issues.push(name+' still duplicates calendar drag stylesheet ownership');
    if(src.includes('const loadStyle='))issues.push(name+' still contains dead style loader after calendar CSS ownership consolidation');
  }
  const calendarRefs=(device.match(/calendar-drag-layout-fix\.css/g)||[]).length;
  if(calendarRefs!==1)issues.push('device-ui must be the single calendar drag stylesheet owner, refs='+calendarRefs);
  if(!device.includes('data-mws-calendar-drag-fix'))issues.push('device-ui calendar drag stylesheet ownership marker missing');

  for(const token of ['assets/majoku-sidebar-v113.js','assets/boss-raid-v116.js','assets/boss-raid-fix-v119.js'])
    if(!majoku.includes(token))issues.push('current Majoku host dependency lost: '+token);
  for(const file of ['assets/majoku-sidebar-v113.js','assets/steam-game-v111.js','assets/ui-fixes-v121.js','assets/boss-manager-v121.js'])
    if(!fs.existsSync(file))issues.push('current successor asset missing: '+file);

  if(!entry.includes('const deferred=[')||!entry.includes('perf-runtime')||!entry.includes('device-ui'))
    issues.push('Worker compatibility stripping for source fallback scripts changed unexpectedly');
  if(!post.includes('/assets/perf-runtime.js?v=1.4.0-phase')||!post.includes('/assets/device-ui.js?v=1.3.0-perf'))
    issues.push('post-login authoritative runtime ownership changed unexpectedly');

  for(const file of ['assets/cloud-v5.5.js','assets/cloud-v1.1.js','assets/cloud-v1.1-loader.js','assets/cloud-runtime-v130.js','assets/cloud-runtime-loader-v130.js'])
    if(!fs.existsSync(file))issues.push('protected cloud compatibility/staging asset missing: '+file);
  warnings.push('Cloud compatibility/staging files remain intentionally protected; they are not active duplicate UI owners.');

  for(const token of [
    'run-phase170-runtime-overlap-cleanup-audit.mjs',
    "assets/wardogs-v1.css?v=1.0.0-phase125-mobile129-portrait138-gallery136-aperture152-medicaperture165-classapertures166-unassigned168-framepreload169-consolidated170",
    'Phase 170: consolidated gallery transparency',
    'calendar-drag-layout-fix.css'
  ])if(!workflow.includes(token))issues.push('Phase 170 workflow verification missing: '+token);

  const summary={phase:170,name:'runtime-overlap-final-cleanup',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase170RuntimeOverlapCleanupAudit();
