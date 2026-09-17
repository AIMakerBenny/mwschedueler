import fs from 'node:fs';

export function runPhase1MobileShellAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.css','utf8');
  const drawer=fs.readFileSync('assets/mobile-drawer-v130.css','utf8');

  const forbidden=[
    'v4.10 - true mobile off-canvas navigation drawer',
    'Mobile preset is an explicit app layout, not a squeezed desktop sidebar.',
    '.mobile-nav-toggle,.mobile-nav-backdrop{display:none}'
  ];
  for(const token of forbidden){
    if(core.includes(token))issues.push(`legacy mobile shell remains in app-core.css: ${token}`);
  }
  if(!drawer.includes('authoritative mobile full-menu drawer'))issues.push('authoritative mobile drawer marker missing');
  if(!drawer.includes('[data-device-mode="mobile"]'))issues.push('drawer is not scoped to the current mobile device mode');
  if(!drawer.includes('word-break:keep-all!important'))issues.push('Majoku subnavigation Korean text protection is missing');
  if(!drawer.includes('transform:translateX(-104%)!important'))issues.push('drawer closed-state transform is missing');
  if(!drawer.includes('.mobile-drawer-open .sidebar'))issues.push('drawer open-state selector is missing');

  const result={phase:1,name:'mobile-shell-authority',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase1MobileShellAudit();
