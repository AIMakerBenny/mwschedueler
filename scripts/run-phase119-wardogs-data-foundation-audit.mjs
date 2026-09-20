import fs from 'node:fs';

export function runPhase119WardogsDataFoundationAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const dataRuntime=fs.readFileSync('assets/wardogs-data-v1.js','utf8');
  const cloud=fs.readFileSync('assets/cloud-v1.1.js','utf8');
  const staged=fs.readFileSync('assets/cloud-runtime-v130.js','utf8');
  const auth=fs.readFileSync('src/cf-v111-auth.js','utf8');
  const entry=fs.readFileSync('src/cf-v111-entry.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!index.includes('assets/wardogs-data-v1.js?v=1.0.0-phase119'))issues.push('WARDOGS data runtime is not loaded by index');

  for(const token of [
    "const SCHEMA_VERSION=1;",
    "const CLASS_IDS=Object.freeze(['assault','medic','recon','support','driver','pilot']);",
    "const contactId=String(item.contactId||'').trim();",
    "const classId=String(item.classId||'').trim().toLowerCase();",
    "imageId:String(item.imageId||'').trim()",
    "active:item.active!==false",
    "function appData()",
    "typeof data==='object'",
    "function findContact(contactId)",
    "window.mwsWardogsDataV119=Object.freeze({"
  ])if(!dataRuntime.includes(token))issues.push('WARDOGS data schema runtime missing: '+token);

  if(/validContactIds|contacts\.some\([^\n]*contactId/.test(dataRuntime))issues.push('WARDOGS normalizer must not delete orphaned contact references');

  for(const [name,source] of [['cloud-v1.1',cloud],['cloud-runtime-v130',staged]]){
    for(const token of [
      "const CACHE_SCHEMA_VERSION=3;",
      "const WARDOGS_CACHE_DB='mws_wardogs_meta_v1';",
      "const WARDOGS_CACHE_VERSION=1;",
      "const EXTRA_PARTS=['wardogs'];",
      "const ALL_PARTS=[...CACHE_STORES,...EXTRA_PARTS];",
      "wardogs:['wardogs']",
      "export:['contactMeta','miniGames','notebook','clipboard','wardogs']",
      "if(part==='wardogs'){try{return await wardogsCacheTx('readonly'",
      "if(part==='wardogs'){try{await wardogsCacheTx('readwrite'",
      "if(part==='wardogs'){const raw=d.wardogs",
      "if(part==='wardogs'){const raw=v",
      "wardogs:{schemaVersion:1,cards:[]}"
    ])if(!source.includes(token))issues.push(name+' WARDOGS cloud foundation missing: '+token);
    if(/CACHE_STORES=\[[^\]]*wardogs/.test(source))issues.push(name+' must not add wardogs to the destructive main IndexedDB store list');
    if(!source.includes("indexedDB.open(WARDOGS_CACHE_DB,WARDOGS_CACHE_VERSION)"))issues.push(name+' separate WARDOGS IndexedDB open missing');
  }

  for(const token of [
    "const PARTS=['core','contacts','contactMeta','events','posts','miniGames','activity','clipboard','notebook','wardogs'];",
    "const WARDOGS_CLASS_IDS=Object.freeze(['assault','medic','recon','support','driver','pilot']);",
    'const WARDOGS_MAX_CARDS=5000;',
    "VALUES('public','wardogs'",
    "VALUES('admin','wardogs'",
    'function normalizeWardogsPart(raw)',
    "if(part==='wardogs')return normalizeWardogsPart(raw);"
  ])if(!auth.includes(token))issues.push('WARDOGS D1 foundation missing: '+token);
  if(!auth.includes('schemaVersion\\":1')||!auth.includes('cards\\":[]'))issues.push('WARDOGS empty D1 seed JSON missing');

  if(!entry.includes("out=out.replace("const CACHE_DB='mawang_data';","const CACHE_DB='mawang_data_v130';");")){
    issues.push('production entry must preserve authoritative main cache remap without changing schema');
  }

  for(const token of [
    'run-phase119-wardogs-data-foundation-audit.mjs',
    'assets/wardogs-data-v1.js?v=1.0.0-phase119',
    'mws_wardogs_meta_v1',
    "wardogs:['wardogs']",
    '/api/parts/wardogs',
    '"schemaVersion":1'
  ])if(!workflow.includes(token))issues.push('production Phase 119 verification missing: '+token);

  const summary={phase:119,name:'wardogs-data-foundation',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase119WardogsDataFoundationAudit();
