import fs from 'node:fs';

export function runPhase117WardogsTacticalClassTabsAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const css=fs.readFileSync('assets/wardogs-v1.css','utf8');
  const js=fs.readFileSync('assets/wardogs-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  if(!/assets\/wardogs-v1\.css\?v=1\.0\.0-phase(?:117|1[2-9][0-9]|[2-9][0-9]{2,})/.test(index))issues.push('WARDOGS tactical stylesheet is not loaded by index');
  if(!/assets\/wardogs-v1\.js\?v=1\.0\.0-phase(?:117|1[2-9][0-9]|[2-9][0-9]{2,})/.test(index))issues.push('WARDOGS tactical runtime is not loaded by index');
  for(const token of [
    'data-wardogs-ui-v117="1"',
    'WARDOGS COMMAND INTERFACE',
    'TACTICAL OPERATIONS SYSTEM // 전쟁견들',
    'id="wardogsClassStageCode"',
    'id="wardogsClassStageTitle"',
    'id="wardogsClassEmptyText"'
  ])if(!index.includes(token))issues.push('WARDOGS tactical shell missing: '+token);

  const classes=['assault','medic','recon','support','driver','pilot'];
  for(const id of classes){
    const count=(index.match(new RegExp('data-wardogs-class="'+id+'"','g'))||[]).length;
    if(count!==1)issues.push('WARDOGS class tab '+id+' count is '+count+', expected 1');
  }

  for(const token of [
    '#wardogs{',
    '.wardogs-shell-v117{',
    '.wardogs-class-tabs-v117{',
    '.wardogs-class-tab-v117.active',
    '.wardogs-class-stage-v117{',
    '@media(max-width:640px)'
  ])if(!css.includes(token))issues.push('WARDOGS tactical CSS missing: '+token);

  for(const token of [
    "const CLASSES=Object.freeze([",
    "{id:'assault',name:'어썰트',code:'ASLT',label:'어썰트'}",
    "{id:'medic',name:'메딕',code:'MED',label:'메딕'}",
    "{id:'recon',name:'리콘',code:'RCN',label:'리콘'}",
    "{id:'support',name:'서포트',code:'SUP',label:'서포트'}",
    "{id:'driver',name:'드라이버',code:'DRV',label:'드라이버'}",
    "{id:'pilot',name:'파일럿',code:'PLT',label:'파일럿'}",
    "function setClass(next)",
    "['ArrowLeft','ArrowRight','Home','End']",
    "window.mwsWardogsV117=Object.freeze({"
  ])if(!js.includes(token))issues.push('WARDOGS class runtime missing: '+token);

  if(/@keyframes\s+wardogs/i.test(css))issues.push('Phase 117 must not add WARDOGS intro animation before Phase 118');

  for(const token of [
    'run-phase117-wardogs-tactical-class-tabs-audit.mjs',
    'assets/wardogs-v1.css?v=1.0.0-phase125',
    'assets/wardogs-v1.js?v=1.0.0-phase125',
    'WARDOGS COMMAND INTERFACE',
    'data-wardogs-class="pilot"'
  ])if(!workflow.includes(token))issues.push('production Phase 117 verification missing: '+token);

  const summary={phase:117,name:'wardogs-tactical-class-tabs',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase117WardogsTacticalClassTabsAudit();
