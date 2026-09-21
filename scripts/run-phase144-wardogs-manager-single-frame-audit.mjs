import fs from 'node:fs';
import path from 'node:path';

export function runPhase144WardogsManagerSingleFrameAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const manager=fs.readFileSync('assets/wardogs-manager-v1.js','utf8');
  const managerCss=fs.readFileSync('assets/wardogs-manager-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'assets/wardogs-manager-v1.js?v=1.0.0-phase127-touchfix-webview130-frame140-frame144',
    'assets/wardogs-manager-v1.css?v=1.0.0-phase127-mobile129-frame140-frame144'
  ])if(!index.includes(token))issues.push('Phase 144 manager cache revision missing: '+token);

  if(index.includes('assets/wardogs-manager-frame-phase143.css'))issues.push('duplicate Phase 143 frame stylesheet remains linked');
  if(fs.existsSync('assets/wardogs-manager-frame-phase143.css'))issues.push('duplicate Phase 143 frame stylesheet still exists');

  for(const token of [
    'function renderPortraitFrame(){',
    'const frameSrc=CLASS_FRAMES[classId]||CLASS_FRAMES.assault;',
    "if(layer.getAttribute('src')!==frameSrc)layer.setAttribute('src',frameSrc);",
    'layer.hidden=false;',
    '<img class="wardogs-manager-frame-v140" data-wardogs-manager-frame alt="" draggable="false" aria-hidden="true">',
    "drop.querySelectorAll('.wardogs-manager-portrait-image-v137').forEach(img=>img.remove());",
    "root.querySelector('[data-wardogs-manager-class]')?.addEventListener('change',()=>{markDirty();renderPortraitFrame()});",
    "window.__mwsWardogsManagerFrameV144='single-img-frame-no-overlay';"
  ])if(!manager.includes(token))issues.push('single manager frame runtime missing: '+token);

  for(const token of [
    '.wardogs-manager-drop-v122 img.wardogs-manager-frame-v140{',
    'position:absolute;inset:0;z-index:2;pointer-events:none;',
    'display:block;width:100%;height:100%;max-width:none;max-height:none;',
    '.wardogs-manager-drop-v122>img.wardogs-manager-frame-v140:not([hidden]){',
    'display:block!important;visibility:visible!important;opacity:1!important'
  ])if(!managerCss.includes(token))issues.push('single manager frame CSS missing: '+token);

  if(manager.includes('wardogsManagerFrameV143'))issues.push('Phase 143 dataset overlay runtime remains');
  if(manager.includes('__mwsWardogsManagerFrameV143'))issues.push('Phase 143 overlay marker remains');
  if(manager.includes("drop.querySelectorAll('img').forEach(img=>img.remove());"))issues.push('generic preview image cleanup can delete frame img');

  const cssFiles=fs.readdirSync('assets').filter(name=>name.endsWith('.css'));
  for(const name of cssFiles){
    const body=fs.readFileSync(path.join('assets',name),'utf8');
    if(/wardogs-manager-frame-v140[^\{]*\{[^\}]*display\s*:\s*none/i.test(body)){
      issues.push('CSS collision hides manager frame img: assets/'+name);
    }
    if(/wardogs-manager-drop-v122\s*::after[^\{]*\{[^\}]*background-image/i.test(body)||
       /data-wardogs-manager-frame-v143/i.test(body)){
      issues.push('duplicate manager frame overlay remains: assets/'+name);
    }
  }

  for(const token of [
    'run-phase144-wardogs-manager-single-frame-audit.mjs',
    "window.__mwsWardogsManagerFrameV144='single-img-frame-no-overlay';",
    '.wardogs-manager-drop-v122>img.wardogs-manager-frame-v140:not([hidden]){',
    "! grep -Fq 'assets/wardogs-manager-frame-phase143.css' /tmp/index.html"
  ])if(!workflow.includes(token))issues.push('production Phase 144 verification missing: '+token);

  const summary={phase:144,name:'wardogs-manager-single-frame-renderer',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase144WardogsManagerSingleFrameAudit();
