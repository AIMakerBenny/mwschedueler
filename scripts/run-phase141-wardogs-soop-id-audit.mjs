import fs from 'node:fs';

export function runPhase141WardogsSoopIdAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const wardogs=fs.readFileSync('assets/wardogs-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'function wardogsStationId(raw){',
    "if(!/(^|\\.)sooplive\\.com$/.test(host)&&!/(^|\\.)afreecatv\\.com$/.test(host))return '';",
    "if(parts[0]?.toLowerCase()==='station'&&parts[1])return parts[1];",
    "if((host.startsWith('bj.')||host.startsWith('play.'))&&parts[0])return parts[0];",
    "<div><span>SOOP ID</span><strong data-wardogs-detail-contact-id>-</strong></div>",
    "const stationId=wardogsStationId(contact?.stationUrl);",
    "stationId||String(card.contactId||'-')",
    "window.__mwsWardogsSoopIdV141='station-url-display-fallback-contact-id';"
  ])if(!wardogs.includes(token))issues.push('WARDOGS SOOP ID display runtime missing: '+token);

  if(!index.includes('assets/wardogs-v1.js?v=1.0.0-phase125-portrait138-soopid141'))issues.push('Phase 141 WARDOGS JS cache revision missing');
  if(wardogs.includes("root.querySelector('[data-wardogs-detail-contact-id]').textContent=String(card.contactId||'-');"))issues.push('legacy UUID-only detail display remains active');

  for(const token of [
    'run-phase141-wardogs-soop-id-audit.mjs',
    'assets/wardogs-v1.js?v=1.0.0-phase125-portrait138-soopid141',
    "window.__mwsWardogsSoopIdV141='station-url-display-fallback-contact-id';",
    'function wardogsStationId(raw){',
    '<span>SOOP ID</span>',
    "const stationId=wardogsStationId(contact?.stationUrl);",
    "stationId||String(card.contactId||'-')"
  ])if(!workflow.includes(token))issues.push('production Phase 141 verification missing: '+token);

  const stationIdForTest=raw=>{
    const text=String(raw||'').trim();
    if(!text)return '';
    try{
      const url=new URL(/^https?:\/\//i.test(text)?text:`https://${text}`);
      const host=url.hostname.toLowerCase();
      if(!/(^|\.)sooplive\.com$/.test(host)&&!/(^|\.)afreecatv\.com$/.test(host))return '';
      const parts=url.pathname.split('/').filter(Boolean).map(part=>{try{return decodeURIComponent(part)}catch(_){return part}});
      if(parts[0]?.toLowerCase()==='station'&&parts[1])return parts[1];
      if((host.startsWith('bj.')||host.startsWith('play.'))&&parts[0])return parts[0];
      if(parts[0]&&!['live','directory'].includes(parts[0].toLowerCase()))return parts[0];
    }catch(_){}
    return '';
  };
  for(const [url,expected] of [
    ['https://www.sooplive.com/station/usharko0o0','usharko0o0'],
    ['https://www.sooplive.com/station/usharko0o0/','usharko0o0'],
    ['https://www.sooplive.com/station/usharko0o0?x=1','usharko0o0'],
    ['www.sooplive.com/station/usharko0o0/','usharko0o0']
  ]){
    const actual=stationIdForTest(url);
    if(actual!==expected)issues.push(`station ID parse failed for ${url}: ${actual}`);
  }
  if(stationIdForTest('https://example.com/station/usharko0o0')!=='')issues.push('non-SOOP/Afreeca URL should not produce station ID');

  const summary={phase:141,name:'wardogs-detail-soop-id-display',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase141WardogsSoopIdAudit();
