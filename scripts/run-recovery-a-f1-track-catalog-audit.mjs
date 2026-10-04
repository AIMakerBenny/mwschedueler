import fs from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

export function runRecoveryAF1TrackCatalogAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const source=fs.readFileSync('assets/f1-track-v1.js','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');
  const sandbox={};
  vm.createContext(sandbox);
  try{vm.runInContext(source,sandbox,{filename:'assets/f1-track-v1.js'})}catch(error){issues.push('Track runtime evaluation failed: '+String(error))}
  const tracks=sandbox.MWS_F1_TRACKS_V182||{};
  const ids=['majoku-ring-v1','castle-street-circuit-v1','blue-coast-speedway-v1'];
  if(Object.keys(tracks).length<3)issues.push('Expected at least 3 tracks, found '+Object.keys(tracks).length);
  for(const id of ids){
    if(!tracks[id]){issues.push('Track missing: '+id);continue}
    const copy=sandbox.mwsGetF1TrackV182?.(id);
    if(!copy||copy.id!==id)issues.push('Track lookup failed: '+id);
    const validation=sandbox.mwsValidateF1TrackV182?.(copy)||['validator unavailable'];
    if(validation.length)issues.push('Track validation '+id+': '+validation.join(', '));
  }
  for(const name of ['마주쿠 링','캐슬 스트리트 서킷','블루 코스트 스피드웨이'])if(!source.includes("name:'"+name+"'"))issues.push('Track name missing: '+name);
  if(!/assets\/f1-track-v1\.js\?v=1\.0\.0-phase197-line-meta-recoveryA-tracks(?:3|7)/.test(index))issues.push('Recovery A track cache link missing');
  for(const token of ['function getTrackCatalogV186(){','renderTrackChoicesV186();',"count.textContent=tracks.length+'개 트랙'"])if(!racing.includes(token))issues.push('Track selection UI integration missing: '+token);
  for(const token of ['node --check scripts/run-recovery-a-f1-track-catalog-audit.mjs',"echo '[recovery-a] F1 track catalog'"])if(!workflow.includes(token))issues.push('Recovery A workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-track-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('Track JS syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:'recovery-a',name:'f1-three-track-catalog',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runRecoveryAF1TrackCatalogAudit();
