import {runPhase1MobileShellAudit} from './run-phase1-mobile-shell-audit.mjs';
import {runPhase2StartupReadinessAudit} from './run-phase2-startup-readiness-audit.mjs';
import {runPhase3PostLoginStyleReadinessAudit} from './run-phase3-post-login-style-readiness-audit.mjs';
import {runPhase4PostLoginModuleFailureAudit} from './run-phase4-post-login-module-failure-audit.mjs';
import {runPhase5MobileCalendarAddAccessAudit} from './run-phase5-mobile-calendar-add-access-audit.mjs';
import {runPhase6HydrationFailureIsolationAudit} from './run-phase6-hydration-failure-isolation-audit.mjs';
import {runPhase7SaveInflightEditAudit} from './run-phase7-save-inflight-edit-audit.mjs';
import {runPhase8ModeSwitchSaveFlushAudit} from './run-phase8-mode-switch-save-flush-audit.mjs';
import {runPhase9ExportLazyLoadFailureAudit} from './run-phase9-export-lazy-load-failure-audit.mjs';
import {runPhase10PageLifecycleSaveAudit} from './run-phase10-page-lifecycle-save-audit.mjs';
import {runPhase11LazyTabReadinessAudit} from './run-phase11-lazy-tab-readiness-audit.mjs';
import {runPhase12ManualSaveSerializationAudit} from './run-phase12-manual-save-serialization-audit.mjs';
import {runPhase13AtomicMultipartSaveAudit} from './run-phase13-atomic-multipart-save-audit.mjs';
import {runPhase14MediaCommitBoundaryAudit} from './run-phase14-media-commit-boundary-audit.mjs';
import {runPhase15ConcurrentAdminVersionGuardAudit} from './run-phase15-concurrent-admin-version-guard-audit.mjs';
import {runPhase16MobileCalendarDayDetailAudit} from './run-phase16-mobile-calendar-day-detail-audit.mjs';
import {runPhase17MobileCalendarTextVisibilityAudit} from './run-phase17-mobile-calendar-text-visibility-audit.mjs';
import {runPhase18MobileCalendarDetailMediaAudit} from './run-phase18-mobile-calendar-detail-media-audit.mjs';

export function runPhase2FullIntegrationAudit(){
  const results=[runPhase1MobileShellAudit(),runPhase2StartupReadinessAudit()];
  const issues=results.flatMap(r=>r.issues.map(x=>`Phase ${r.phase}: ${x}`));
  const warnings=results.flatMap(r=>r.warnings.map(x=>`Phase ${r.phase}: ${x}`));
  const summary={currentPhase:2,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase3FullIntegrationAudit(){
  const previous=runPhase2FullIntegrationAudit();
  const current=runPhase3PostLoginStyleReadinessAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:3,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase4FullIntegrationAudit(){
  const previous=runPhase3FullIntegrationAudit();
  const current=runPhase4PostLoginModuleFailureAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:4,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase5FullIntegrationAudit(){
  const previous=runPhase4FullIntegrationAudit();
  const current=runPhase5MobileCalendarAddAccessAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:5,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase6FullIntegrationAudit(){
  const previous=runPhase5FullIntegrationAudit();
  const current=runPhase6HydrationFailureIsolationAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:6,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase7FullIntegrationAudit(){
  const previous=runPhase6FullIntegrationAudit();
  const current=runPhase7SaveInflightEditAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:7,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase8FullIntegrationAudit(){
  const previous=runPhase7FullIntegrationAudit();
  const current=runPhase8ModeSwitchSaveFlushAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:8,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase9FullIntegrationAudit(){
  const previous=runPhase8FullIntegrationAudit();
  const current=runPhase9ExportLazyLoadFailureAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:9,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase10FullIntegrationAudit(){
  const previous=runPhase9FullIntegrationAudit();
  const current=runPhase10PageLifecycleSaveAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:10,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase11FullIntegrationAudit(){
  const previous=runPhase10FullIntegrationAudit();
  const current=runPhase11LazyTabReadinessAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:11,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase12FullIntegrationAudit(){
  const previous=runPhase11FullIntegrationAudit();
  const current=runPhase12ManualSaveSerializationAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:12,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase13FullIntegrationAudit(){
  const previous=runPhase12FullIntegrationAudit();
  const current=runPhase13AtomicMultipartSaveAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:13,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase14FullIntegrationAudit(){
  const previous=runPhase13FullIntegrationAudit();
  const current=runPhase14MediaCommitBoundaryAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:14,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase15FullIntegrationAudit(){
  const previous=runPhase14FullIntegrationAudit();
  const current=runPhase15ConcurrentAdminVersionGuardAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:15,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase16FullIntegrationAudit(){
  const previous=runPhase15FullIntegrationAudit();
  const current=runPhase16MobileCalendarDayDetailAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:16,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase17FullIntegrationAudit(){
  const previous=runPhase16FullIntegrationAudit();
  const current=runPhase17MobileCalendarTextVisibilityAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:17,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase18FullIntegrationAudit(){
  const previous=runPhase17FullIntegrationAudit();
  const current=runPhase18MobileCalendarDetailMediaAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:18,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runCurrentFullIntegrationAudit(){return runPhase18FullIntegrationAudit();}

if(import.meta.url===`file://${process.argv[1]}`)runCurrentFullIntegrationAudit();
