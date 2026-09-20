import fs from 'node:fs';

export function runPhase118WardogsSessionEntryAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('assets/wardogs-intro-v1.css','utf8');
  const js=fs.readFileSync('assets/wardogs-intro-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'assets/wardogs-intro-v1.css?v=1.0.0-phase118',
    'assets/wardogs-intro-v1.js?v=1.0.0-phase118',
    'id="wardogsEntryV118"',
    'TACTICAL OPERATIONS SYSTEM',
    'PERSONNEL DATABASE <b>CONNECTED</b>',
    'CONTACT DATABASE <b>LINKED</b>',
    'CLASS SYSTEM <b>ONLINE</b>',
    'MISSION DATA <b>READY</b>'
  ])if(!index.includes(token))issues.push('WARDOGS entry markup missing: '+token);

  for(const token of [
    '.wardogs-entry-v118{',
    '.wardogs-entry-v118.is-full',
    '.wardogs-entry-v118.is-quick',
    '@keyframes wd118Scan',
    '@keyframes wd118QuickScan',
    '@media(prefers-reduced-motion:reduce)'
  ])if(!css.includes(token))issues.push('WARDOGS entry CSS missing: '+token);

  for(const token of [
    "const SESSION_KEY='mws_wardogs_intro_v118';",
    'const FULL_EXIT_AT=1500;',
    'const FULL_HIDE_AT=1710;',
    'const QUICK_HIDE_AT=340;',
    "sessionStorage.getItem(SESSION_KEY)==='1'",
    "sessionStorage.setItem(SESSION_KEY,'1')",
    "new MutationObserver(()=>onActiveChange(root))",
    "observer.observe(root,{attributes:true,attributeFilter:['class']});",
    "if(active&&!wasActive)enterWardogs();",
    'if(hasSeenFull())showQuick();',
    'else showFull();',
    "window.matchMedia?.('(prefers-reduced-motion: reduce)')",
    'window.mwsWardogsIntroV118=Object.freeze({'
  ])if(!js.includes(token))issues.push('WARDOGS entry runtime missing: '+token);

  if(/window\.setTab\s*=|setTab\s*=\s*function/.test(js))issues.push('WARDOGS intro must not override setTab');
  if(/setInterval\s*\(/.test(js))issues.push('WARDOGS intro must not use continuous polling');
  if(/filter:\s*blur|backdrop-filter/i.test(css))issues.push('WARDOGS intro uses an avoidable GPU-heavy blur effect');

  for(const token of [
    'run-phase118-wardogs-session-entry-audit.mjs',
    'assets/wardogs-intro-v1.css?v=1.0.0-phase118',
    'assets/wardogs-intro-v1.js?v=1.0.0-phase118',
    'mws_wardogs_intro_v118',
    'FULL_HIDE_AT=1710',
    'MISSION DATA <b>READY</b>'
  ])if(!workflow.includes(token))issues.push('production Phase 118 verification missing: '+token);

  const summary={phase:118,name:'wardogs-session-entry',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase118WardogsSessionEntryAudit();
