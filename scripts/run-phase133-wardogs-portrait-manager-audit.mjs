import fs from 'node:fs';

export function runPhase133WardogsPortraitManagerAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const data=fs.readFileSync('assets/wardogs-data-v1.js','utf8');
  const manager=fs.readFileSync('assets/wardogs-manager-v1.js','utf8');
  const css=fs.readFileSync('assets/wardogs-manager-v1.css','utf8');
  const worker=fs.readFileSync('src/cf-v111-auth.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    "const PORTRAIT_SOURCES=Object.freeze(['contact','custom']);",
    "portraitPositionX:clampNumber(item.portraitPositionX,0,100,50)",
    "portraitPositionY:clampNumber(item.portraitPositionY,0,100,50)",
    "portraitScale:clampNumber(item.portraitScale,0.25,3,1)",
    "window.__mwsWardogsPortraitSchemaV133='contact-custom-position-scale';"
  ])if(!data.includes(token))issues.push('portrait schema foundation missing: '+token);

  for(const token of [
    "let draftPortraitSource='contact';",
    "data-wardogs-manager-source=\"contact\"",
    "data-wardogs-manager-source=\"custom\"",
    "const imageUrl=String(contact?.image||'').trim();",
    "draftPortraitSource='custom';",
    "const portraitSource=draftPortraitSource==='custom'?'custom':'contact';",
    "let portraitImageId=previousPortraitImageId;",
    "portraitImageId=String(result?.id||'');",
    "portraitImageId=previousImageId;",
    "imageId:previousImageId,",
    "portraitPositionX:draftPortraitX",
    "portraitPositionY:draftPortraitY",
    "portraitScale:draftPortraitScale",
    "String(card?.imageId||'')===id||String(card?.portraitImageId||'')===id",
    "window.__mwsWardogsPortraitManagerV133='contact-default-custom-override';"
  ])if(!manager.includes(token))issues.push('portrait manager behavior missing: '+token);

  for(const token of [
    '.wardogs-manager-source-v133{',
    '.wardogs-manager-source-v133 button.active{'
  ])if(!css.includes(token))issues.push('portrait source UI style missing: '+token);

  for(const token of [
    "const portraitImageId=String(item.portraitImageId||'').trim().slice(0,160);",
    "const portraitSource=requestedPortraitSource==='custom'&&portraitImageId?'custom':'contact';",
    "portraitPositionX,",
    "portraitPositionY,",
    "portraitScale,"
  ])if(!worker.includes(token))issues.push('Cloudflare portrait field preservation missing: '+token);

  for(const token of [
    'assets/wardogs-manager-v1.js?v=1.0.0-phase127-touchfix-webview130-portrait138',
    'assets/wardogs-manager-v1.css?v=1.0.0-phase127-mobile129-portrait138'
  ])if(!index.includes(token))issues.push('portrait manager cache revision missing: '+token);

  for(const token of [
    'run-phase133-wardogs-portrait-manager-audit.mjs',
    'assets/wardogs-manager-v1.js?v=1.0.0-phase127-touchfix-webview130-portrait138',
    'assets/wardogs-manager-v1.css?v=1.0.0-phase127-mobile129-portrait138',
    "__mwsWardogsPortraitManagerV133='contact-default-custom-override'",
    "const imageUrl=String(contact?.image||'').trim();",
    "portraitImageId=String(result?.id||'');"
  ])if(!workflow.includes(token))issues.push('production Phase 133 verification missing: '+token);

  // Portrait rendering is verified by Phase 134 and later audits.
  const summary={phase:133,name:'wardogs-portrait-manager',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase133WardogsPortraitManagerAudit();
