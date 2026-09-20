import fs from 'node:fs';

export function runPhase113ContactImageProcessorOwnershipAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const perf=fs.readFileSync('assets/perf-runtime.js','utf8');
  const maintenance=fs.readFileSync('assets/maintenance-runtime-v130.js','utf8');
  const index=fs.readFileSync('index.html','utf8');
  const postLogin=fs.readFileSync('assets/post-login-runtime-v130.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'async function compressContactImage(dataUrl,maxSize=1024,quality=.9)',
    'const mwsCompressContactImageV113=compressContactImage;',
    'window.mwsCompressContactImageV113=mwsCompressContactImageV113;',
    'candidate.image=await mwsCompressContactImageV113(raw);',
    'incoming.image=await mwsCompressContactImageV113(incoming.image);',
    "createImageBitmap(blob,{imageOrientation:'from-image'})"
  ])if(!app.includes(token))issues.push('canonical contact image processor missing: '+token);

  if(perf.includes('window.compressContactImage=')||perf.includes('compressContactImage=preserveOriginalImage')){
    issues.push('performance runtime still overrides contact image processor');
  }
  if(maintenance.includes('window.compressContactImage=')||maintenance.includes('compressContactImageV571')){
    issues.push('maintenance runtime still overrides contact image processor');
  }

  if(!index.includes('assets/app-core.js?v=1.3.0-search113'))issues.push('app-core cache revision is not search113');
  if(!postLogin.includes('/assets/perf-runtime.js?v=1.4.0-phase113-contact-image-owner1'))issues.push('perf runtime cache revision is stale');
  if(!perf.includes('maintenance-runtime-v130.js?v=1.3.0-stage68-contact-media-canonical2'))issues.push('maintenance runtime cache revision is stale');
  if(!entry.includes('post-login-runtime-v130.js?v=1.4.0-phase113-contact-image-owner1'))issues.push('post-login runtime cache revision is stale');

  for(const token of [
    'run-phase113-contact-image-processor-ownership-audit.mjs',
    'mwsCompressContactImageV113',
    'phase113-contact-image-owner1',
    'stage68-contact-media-canonical2',
    'search113'
  ])if(!workflow.includes(token))issues.push('production Phase 113 verification missing: '+token);

  const summary={phase:113,name:'contact-image-processor-ownership',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase113ContactImageProcessorOwnershipAudit();
