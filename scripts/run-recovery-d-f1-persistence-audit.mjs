import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

export function runRecoveryDF1PersistenceAudit(){
  const issues=[],warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const racing=fs.readFileSync('assets/f1-racing-v1.js','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    "f1Racing:{selectedDriverIds:[],selectedTrackId:'majoku-ring-v1',totalLaps:10,workspaceLayout:{}}",
    'f1.selectedDriverIds=[...new Set(',
    "f1.selectedTrackId=String(f1.selectedTrackId||'majoku-ring-v1');",
    'function mwsGetF1RacingSettingsRecoveryD(){',
    'function mwsSaveF1RacingSettingsRecoveryD(patch={}){',
    "const reason='F1 레이싱 설정 저장';",
    'const saved=persist();',
    'window.mwsGetF1RacingSettingsRecoveryD=mwsGetF1RacingSettingsRecoveryD;',
    "window.__mwsF1PersistenceRecoveryD='miniGames-f1Racing-v1';"
  ])if(!app.includes(token))issues.push('Recovery D app persistence missing: '+token);

  for(const token of [
    'let persistenceRestoredRecoveryD=false;',
    'function restoreF1SettingsRecoveryD(force=false){',
    'const validContactIds=new Set(contacts.map(row=>String(row.id)));',
    'selectedIds.splice(0,selectedIds.length,...restoredIds);',
    "activeTrackId=window.mwsGetF1TrackV182?.(restoredTrack)?restoredTrack:'majoku-ring-v1';",
    'function persistF1SettingsRecoveryD(extra={}){',
    'persistF1SettingsRecoveryD();',
    'totalLaps:selectedTotalLapsRecoveryD',
    'window.mwsF1RestoreSettingsRecoveryD=restoreF1SettingsRecoveryD;',
    "window.__mwsF1RecoveryD='persistent-roster-track-settings-v1';"
  ])if(!racing.includes(token))issues.push('Recovery D F1 runtime missing: '+token);

  for(const token of [
    'assets/app-core.js?v=1.3.0-search115-wardogs116-backup126-datetime149-calendarsearch171-searchtab172-drag174-endquick175-workspace176-splitquick177-circular178-f1shell180-f1contacts181-f1persistD',
    'assets/f1-racing-v1.js?v=1.0.0-phase180-shell&p=203&recovery=D1'
  ])if(!index.includes(token))issues.push('Recovery D asset cache missing: '+token);

  for(const token of ['node --check scripts/run-recovery-d-f1-persistence-audit.mjs',"echo '[recovery-d] F1 persistent roster and track settings'"])if(!workflow.includes(token))issues.push('Recovery D workflow verification missing: '+token);
  const syntax=spawnSync(process.execPath,['--check','assets/f1-racing-v1.js'],{encoding:'utf8'});
  if(syntax.status!==0)issues.push('assets/f1-racing-v1.js syntax failed: '+String(syntax.stderr||syntax.stdout||'').trim());
  const result={phase:'recovery-d',name:'f1-persistent-roster-track-settings',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(result));if(issues.length)process.exitCode=1;return result;
}
if(import.meta.url==='file://'+process.argv[1])runRecoveryDF1PersistenceAudit();
