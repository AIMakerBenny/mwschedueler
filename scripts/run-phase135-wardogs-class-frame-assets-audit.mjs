import fs from 'node:fs';

export function runPhase135WardogsClassFrameAssetsAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const runtime=fs.readFileSync('assets/wardogs-v1.js','utf8');
  const css=fs.readFileSync('assets/wardogs-v1.css','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  const frames={
    assault:'assets/wardogs-frames/assault.webp',
    medic:'assets/wardogs-frames/medic.webp',
    recon:'assets/wardogs-frames/recon.webp',
    support:'assets/wardogs-frames/support.webp',
    driver:'assets/wardogs-frames/driver.webp',
    pilot:'assets/wardogs-frames/pilot.webp'
  };

  for(const [classId,file] of Object.entries(frames)){
    const token=`${classId}:'${file}`;
    if(!runtime.includes(token))issues.push('class frame mapping missing: '+token);
    if(!fs.existsSync(file)){
      issues.push('class frame asset missing: '+file);
      continue;
    }
    const bytes=fs.readFileSync(file);
    if(bytes.length<8000)issues.push('class frame asset unexpectedly small: '+file);
    if(bytes.length>30000)issues.push('class frame asset exceeds 30KB performance guard: '+file);
    if(bytes.length<12||bytes.subarray(0,4).toString()!=='RIFF'||bytes.subarray(8,12).toString()!=='WEBP'){
      issues.push('class frame asset is not WebP: '+file);
      continue;
    }
    const riffSize=bytes.readUInt32LE(4);
    if(riffSize+8!==bytes.length){
      issues.push('class frame RIFF size mismatch/truncated file: '+file+' expected '+(riffSize+8)+' bytes, got '+bytes.length);
      continue;
    }
    let offset=12;
    let hasImageChunk=false;
    while(offset<bytes.length){
      if(offset+8>bytes.length){
        issues.push('class frame has truncated chunk header: '+file);
        break;
      }
      const type=bytes.subarray(offset,offset+4).toString();
      const size=bytes.readUInt32LE(offset+4);
      const end=offset+8+size;
      if(end>bytes.length){
        issues.push('class frame has truncated '+type+' chunk: '+file);
        break;
      }
      if(type==='VP8 '||type==='VP8L')hasImageChunk=true;
      offset=end+(size&1);
    }
    if(offset!==bytes.length)issues.push('class frame chunk alignment mismatch: '+file);
    if(!hasImageChunk)issues.push('class frame image payload missing: '+file);
  }

  for(const token of [
    'const CLASS_FRAMES=Object.freeze({',
    'function applyClassFrame(layer,classId)',
    'applyClassFrame(view.frameLayer,card?.classId);',
    'applyClassFrame(frameLayer,card?.classId);',
    "window.__mwsWardogsClassFramesV135='uploaded-transparent-overlays';"
  ])if(!runtime.includes(token))issues.push('class frame runtime missing: '+token);

  for(const token of [
    '/* Phase 135: WARDOGS class frame assets */',
    '.wardogs-gallery-visual-v124.wardogs-portrait-stage-v134{',
    '.wardogs-detail-media-frame-v125.wardogs-portrait-stage-v134{',
    'aspect-ratio:3/4;'
  ])if(!css.includes(token))issues.push('class frame layout CSS missing: '+token);

  for(const token of [
    'assets/wardogs-v1.js?v=1.0.0-phase125-portrait138',
    'assets/wardogs-v1.css?v=1.0.0-phase125-mobile129-portrait138-gallery136'
  ])if(!index.includes(token))issues.push('Phase 135 cache revision missing: '+token);

  for(const token of [
    'run-phase135-wardogs-class-frame-assets-audit.mjs',
    'assets/wardogs-v1.js?v=1.0.0-phase125-portrait138',
    'assets/wardogs-v1.css?v=1.0.0-phase125-mobile129-portrait138-gallery136',
    "__mwsWardogsClassFramesV135='uploaded-transparent-overlays';",
    "assault:'assets/wardogs-frames/assault.webp",
    "medic:'assets/wardogs-frames/medic.webp",
    "recon:'assets/wardogs-frames/recon.webp",
    "support:'assets/wardogs-frames/support.webp",
    "driver:'assets/wardogs-frames/driver.webp",
    "pilot:'assets/wardogs-frames/pilot.webp",
    'aspect-ratio:3/4;',
    "[phase148] live WARDOGS frame WebP integrity OK"
  ])if(!workflow.includes(token))issues.push('production Phase 135 verification missing: '+token);

  const summary={phase:135,name:'wardogs-class-frame-assets',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase135WardogsClassFrameAssetsAudit();
