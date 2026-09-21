import fs from 'node:fs';
import crypto from 'node:crypto';

const EXPECTED={
  "assault": "5be42ac6d73f84d55b4f1c201438fb46610c476d",
  "medic": "07469c310003d6c4fc85e58a10fdbe642756205c",
  "recon": "8968e1138f207dee71d3fb6955351e5a2002e642",
  "support": "e79a71aeed6dfbf459f4db8c47f3a7c5d596a5d8",
  "driver": "db53d6f5f106d3369eb3e0f83520e1839fb1dd5b",
  "pilot": "e1b408f3502ef05714a623b22110ad0f2b107cea"
};

const FRAME_REVISION={assault:'phase166',medic:'phase165',recon:'phase163',support:'phase166',driver:'phase161',pilot:'phase166'};

function gitBlobSha(bytes){
  return crypto.createHash('sha1')
    .update(Buffer.from(`blob ${bytes.length}\0`))
    .update(bytes)
    .digest('hex');
}
function webpInfo(bytes){
  if(bytes.length<30||bytes.subarray(0,4).toString()!=='RIFF'||bytes.subarray(8,12).toString()!=='WEBP')return {ok:false};
  if(bytes.readUInt32LE(4)+8!==bytes.length)return {ok:false};
  let offset=12,hasAlpha=false,hasImage=false,width=0,height=0;
  while(offset<bytes.length){
    if(offset+8>bytes.length)return {ok:false};
    const type=bytes.subarray(offset,offset+4).toString();
    const size=bytes.readUInt32LE(offset+4);
    const start=offset+8,end=start+size;
    if(end>bytes.length)return {ok:false};
    if(type==='VP8X'){
      if(size<10)return {ok:false};
      width=1+bytes[start+4]+(bytes[start+5]<<8)+(bytes[start+6]<<16);
      height=1+bytes[start+7]+(bytes[start+8]<<8)+(bytes[start+9]<<16);
    }
    if(type==='ALPH')hasAlpha=true;
    if(type==='VP8 '||type==='VP8L')hasImage=true;
    offset=end+(size&1);
  }
  return {ok:offset===bytes.length,hasAlpha,hasImage,width,height};
}

export function runPhase150WardogsFrameSourceReplacementAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const manager=fs.readFileSync('assets/wardogs-manager-v1.js','utf8');
  const gallery=fs.readFileSync('assets/wardogs-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  const galleryCss=fs.readFileSync('assets/wardogs-v1.css','utf8');
  const managerCss=fs.readFileSync('assets/wardogs-manager-v1.css','utf8');

  for(const [classId,expectedSha] of Object.entries(EXPECTED)){
    const file=`assets/wardogs-frames/${classId}.webp`;
    if(!fs.existsSync(file)){issues.push('Phase 150 frame missing: '+file);continue;}
    const bytes=fs.readFileSync(file);
    const actualSha=gitBlobSha(bytes);
    if(actualSha!==expectedSha)issues.push(`Phase 150 ${classId} frame bytes differ from rebuilt source: ${actualSha}`);
    const info=webpInfo(bytes);
    if(!info.ok)issues.push('Phase 150 invalid/truncated WebP: '+classId);
    if(!info.hasAlpha)issues.push('Phase 150 frame lacks alpha: '+classId);
    if(!info.hasImage)issues.push('Phase 150 frame lacks image payload: '+classId);
    if(info.width!==360||info.height!==480)issues.push(`Phase 150 frame size mismatch: ${classId} ${info.width}x${info.height}`);
    const token=`${classId}:'assets/wardogs-frames/${classId}.webp?v=${FRAME_REVISION[classId]}'`;
    if(!manager.includes(token))issues.push('Phase 150 manager cache-busted frame mapping missing: '+token);
    if(!gallery.includes(token))issues.push('Phase 150 gallery cache-busted frame mapping missing: '+token);
  }

  for(const token of [
    'assets/wardogs-manager-v1.js?v=1.0.0-phase127-touchfix-webview130-frame140-frame144-frames150',
    'assets/wardogs-v1.js?v=1.0.0-phase125-portrait138-soopid141-frames150'
  ])if(!index.includes(token))issues.push('Phase 150 runtime cache revision missing: '+token);

  for(const [classId,inset] of Object.entries({
    assault:'7.9% 11.6% 22.6% 11.8%',
    medic:'8.2% 11.7% 23% 11.8%',
    support:'8.2% 12.1% 23.8% 12.2%',
    pilot:'8.8% 12.2% 23.9% 13.3%'
  })){
    if(!galleryCss.includes(`data-wardogs-class="${classId}"`))issues.push('Phase 166 gallery aperture selector missing: '+classId);
    if(!managerCss.includes(`data-wardogs-class="${classId}"`))issues.push('Phase 166 manager aperture selector missing: '+classId);
    if(!galleryCss.includes(`clip-path:inset(${inset});`))issues.push('Phase 166 gallery aperture geometry missing: '+classId);
    if(!managerCss.includes(`clip-path:inset(${inset});`))issues.push('Phase 166 manager aperture geometry missing: '+classId);
  }

  for(const runtime of [manager,gallery]){
    if(!runtime.includes("window.__mwsWardogsFrameSourcesV150='user-source-rebuild-cache-busted';"))
      issues.push('Phase 150 frame source marker missing from a WARDOGS runtime');
    if(!runtime.includes("window.__mwsWardogsFrameBatchV166='assault-support-pilot-class-apertures';"))issues.push('Phase 166 frame batch marker missing from a WARDOGS runtime');
  }

  for(const token of [
    'run-phase150-wardogs-frame-source-replacement-audit.mjs',
    "[phase150] live replacement frame alpha/dimensions/source bytes OK",
    "?v=phase150",
    'frames150'
  ])if(!workflow.includes(token))issues.push('Phase 150 production verification missing: '+token);

  const summary={phase:150,name:'wardogs-frame-source-replacement',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase150WardogsFrameSourceReplacementAudit();
