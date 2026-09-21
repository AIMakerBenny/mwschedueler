import fs from 'node:fs';

export function runPhase143WardogsManagerFrameVisibilityAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const manager=fs.readFileSync('assets/wardogs-manager-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  const retiredCss='assets/wardogs-manager-frame-phase143.css';

  if(index.includes('assets/wardogs-manager-frame-phase143.css'))issues.push('retired Phase 143 CSS overlay is still linked');
  if(fs.existsSync(retiredCss))issues.push('retired Phase 143 CSS overlay file still exists');
  if(manager.includes('wardogsManagerFrameV143'))issues.push('retired Phase 143 dataset frame renderer remains');
  if(manager.includes("__mwsWardogsManagerFrameV143='css-overlay-class-frame'"))issues.push('retired Phase 143 runtime marker remains');

  for(const token of [
    "window.__mwsWardogsManagerFrameV144='single-img-frame-no-overlay';",
    '<img class="wardogs-manager-frame-v140" data-wardogs-manager-frame alt="" draggable="false" aria-hidden="true">',
    "root.querySelector('[data-wardogs-manager-class]')?.addEventListener('change',()=>{markDirty();renderPortraitFrame()});"
  ])if(!manager.includes(token))issues.push('Phase 143 retirement successor missing: '+token);

  for(const token of [
    "echo '[phase143] superseded by Phase 144 single img frame'",
    "! grep -Fq 'assets/wardogs-manager-frame-phase143.css' /tmp/index.html",
    "! grep -Fq '__mwsWardogsManagerFrameV143' /tmp/wardogs-manager-v1.js"
  ])if(!workflow.includes(token))issues.push('Phase 143 retirement production check missing: '+token);

  const summary={phase:143,name:'wardogs-manager-frame-overlay-retired',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase143WardogsManagerFrameVisibilityAudit();
