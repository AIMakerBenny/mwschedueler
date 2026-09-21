import fs from 'node:fs';

export function runPhase143WardogsManagerFrameVisibilityAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const manager=fs.readFileSync('assets/wardogs-manager-v1.js','utf8');
  const managerCss=fs.readFileSync('assets/wardogs-manager-v1.css','utf8');
  const frameCss=fs.readFileSync('assets/wardogs-manager-frame-phase143.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'assets/wardogs-manager-v1.js?v=1.0.0-phase127-touchfix-webview130-frame140-frame143',
    'assets/wardogs-manager-frame-phase143.css?v=1.0.0'
  ])if(!index.includes(token))issues.push('Phase 143 cache/wiring missing: '+token);

  for(const token of [
    "if(drop)drop.dataset.wardogsManagerFrameV143=classId;",
    "window.__mwsWardogsManagerFrameV143='css-overlay-class-frame';",
    "root.querySelector('[data-wardogs-manager-class]')?.addEventListener('change',()=>{markDirty();renderPortraitFrame()});",
    'renderPortraitFrame();'
  ])if(!manager.includes(token))issues.push('manager Phase 143 runtime missing: '+token);

  for(const token of [
    '.wardogs-manager-drop-v122::after{',
    'content:"";position:absolute;inset:0;z-index:2;pointer-events:none;',
    'background-position:center;background-repeat:no-repeat;background-size:100% 100%',
    '[data-wardogs-manager-frame-v143="assault"]::after{background-image:url("/assets/wardogs-frames/assault.webp")}',
    '[data-wardogs-manager-frame-v143="medic"]::after{background-image:url("/assets/wardogs-frames/medic.webp")}',
    '[data-wardogs-manager-frame-v143="recon"]::after{background-image:url("/assets/wardogs-frames/recon.webp")}',
    '[data-wardogs-manager-frame-v143="support"]::after{background-image:url("/assets/wardogs-frames/support.webp")}',
    '[data-wardogs-manager-frame-v143="driver"]::after{background-image:url("/assets/wardogs-frames/driver.webp")}',
    '[data-wardogs-manager-frame-v143="pilot"]::after{background-image:url("/assets/wardogs-frames/pilot.webp")}',
    '.wardogs-manager-drop-v122>img.wardogs-manager-frame-v140{display:none!important}'
  ])if(!frameCss.includes(token))issues.push('Phase 143 frame overlay CSS missing: '+token);

  for(const token of [
    'z-index:1;',
    '.wardogs-manager-drop-state-v122{',
    'position:relative;z-index:3'
  ])if(!managerCss.includes(token))issues.push('protected portrait/state stacking missing: '+token);

  for(const token of [
    'run-phase143-wardogs-manager-frame-visibility-audit.mjs',
    'assets/wardogs-manager-frame-phase143.css?v=1.0.0',
    "window.__mwsWardogsManagerFrameV143='css-overlay-class-frame';",
    'data-wardogs-manager-frame-v143="medic"'
  ])if(!workflow.includes(token))issues.push('production Phase 143 verification missing: '+token);

  const summary={phase:143,name:'wardogs-manager-frame-visibility',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase143WardogsManagerFrameVisibilityAudit();
