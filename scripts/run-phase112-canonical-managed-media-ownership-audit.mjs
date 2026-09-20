import fs from 'node:fs';

export function runPhase112CanonicalManagedMediaOwnershipAudit(){
  const issues=[];
  const warnings=[];
  const maintenance=fs.readFileSync('assets/maintenance-runtime-v130.js','utf8');
  const perf=fs.readFileSync('assets/perf-runtime.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    "const CACHE_DB='mawang_data_v130';",
    'function canonicalMediaUrl(value)',
    "if(u.origin===location.origin)",
    "const match=/^(contacts|workspace)\\/([^/]+)(?:\\/v(\\d+)(?:-([a-f0-9]{32}))?)?$/",
    "if(kind==='contact')params.set('r','2');",
    'function isManagedMediaRef(value)',
    'return canonicalMediaUrl(value);',
    'migrateLiveAndLocalStorage();',
    'migrateIndexedDbMedia().catch(()=>{});'
  ])if(!maintenance.includes(token))issues.push('canonical managed-media ownership missing: '+token);

  if(maintenance.includes('function directMediaUrl(value)'))issues.push('legacy same-origin to direct-R2 converter remains active');
  if(maintenance.includes('isManagedDirectMedia('))issues.push('legacy direct-only media ownership remains active');
  if(!perf.includes('maintenance-runtime-v130.js?v=1.3.0-stage68-contact-media-canonical1'))issues.push('maintenance runtime cache revision not advanced');

  for(const token of [
    'run-phase112-canonical-managed-media-ownership-audit.mjs',
    'canonicalMediaUrl(value)',
    'isManagedMediaRef(value)',
    'stage68-contact-media-canonical1'
  ])if(!workflow.includes(token))issues.push('production Phase 112 verification missing: '+token);

  const summary={phase:112,name:'canonical-managed-media-ownership',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase112CanonicalManagedMediaOwnershipAudit();
