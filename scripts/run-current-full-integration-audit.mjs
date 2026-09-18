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
import {runPhase19MobileCalendarPcDragRestoreAudit} from './run-phase19-mobile-calendar-pc-drag-restore-audit.mjs';
import {runPhase20MobileCalendarDetailNavStateAudit} from './run-phase20-mobile-calendar-detail-nav-state-audit.mjs';
import {runPhase21MobileCalendarQuickAddLayerAudit} from './run-phase21-mobile-calendar-quick-add-layer-audit.mjs';
import {runPhase22MobileModalLayerAudit} from './run-phase22-mobile-modal-layer-audit.mjs';
import {runPhase23MobileCalendarDrawerStateAudit} from './run-phase23-mobile-calendar-drawer-state-audit.mjs';
import {runPhase24MobileQuickAddAnchorAudit} from './run-phase24-mobile-quick-add-anchor-audit.mjs';
import {runPhase25MobileDetailMediaFallbackAudit} from './run-phase25-mobile-detail-media-fallback-audit.mjs';
import {runPhase26MobileEventEditorHeaderAudit} from './run-phase26-mobile-event-editor-header-audit.mjs';
import {runPhase27MobileDayDetailScrollResetAudit} from './run-phase27-mobile-day-detail-scroll-reset-audit.mjs';
import {runPhase28EventEditorScrollResetAudit} from './run-phase28-event-editor-scroll-reset-audit.mjs';
import {runPhase29MobileDayDetailViewportAudit} from './run-phase29-mobile-day-detail-viewport-audit.mjs';
import {runPhase30SteamScanPerformanceAudit} from './run-phase30-steam-scan-performance-audit.mjs';
import {runPhase31LivePollingPerformanceAudit} from './run-phase31-live-polling-performance-audit.mjs';
import {runPhase32CalendarObserverPerformanceAudit} from './run-phase32-calendar-observer-performance-audit.mjs';
import {runPhase33ClockPerformanceAudit} from './run-phase33-clock-performance-audit.mjs';
import {runPhase34MobileDayObserverPerformanceAudit} from './run-phase34-mobile-day-observer-performance-audit.mjs';
import {runPhase35PointerMovePerformanceAudit} from './run-phase35-pointer-move-performance-audit.mjs';
import {runPhase36TodayPeopleStartupPollingAudit} from './run-phase36-today-people-startup-polling-audit.mjs';
import {runPhase37ContactStartupPollingAudit} from './run-phase37-contact-startup-polling-audit.mjs';
import {runPhase38CalendarPreviewMoveAudit} from './run-phase38-calendar-preview-mousemove-audit.mjs';
import {runPhase39TodayPeopleSyncDedupAudit} from './run-phase39-today-people-sync-dedup-audit.mjs';
import {runPhase40ParticipantSearchDebounceAudit} from './run-phase40-participant-search-debounce-audit.mjs';
import {runPhase41ContactAddInjectionAudit} from './run-phase41-contact-add-injection-audit.mjs';

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

export function runPhase19FullIntegrationAudit(){
  const previous=runPhase18FullIntegrationAudit();
  const current=runPhase19MobileCalendarPcDragRestoreAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:19,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase20FullIntegrationAudit(){
  const previous=runPhase19FullIntegrationAudit();
  const current=runPhase20MobileCalendarDetailNavStateAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:20,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase21FullIntegrationAudit(){
  const previous=runPhase20FullIntegrationAudit();
  const current=runPhase21MobileCalendarQuickAddLayerAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:21,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase22FullIntegrationAudit(){
  const previous=runPhase21FullIntegrationAudit();
  const current=runPhase22MobileModalLayerAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:22,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase23FullIntegrationAudit(){
  const previous=runPhase22FullIntegrationAudit();
  const current=runPhase23MobileCalendarDrawerStateAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:23,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase24FullIntegrationAudit(){
  const previous=runPhase23FullIntegrationAudit();
  const current=runPhase24MobileQuickAddAnchorAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:24,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase25FullIntegrationAudit(){
  const previous=runPhase24FullIntegrationAudit();
  const current=runPhase25MobileDetailMediaFallbackAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:25,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase26FullIntegrationAudit(){
  const previous=runPhase25FullIntegrationAudit();
  const current=runPhase26MobileEventEditorHeaderAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:26,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase27FullIntegrationAudit(){
  const previous=runPhase26FullIntegrationAudit();
  const current=runPhase27MobileDayDetailScrollResetAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:27,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase28FullIntegrationAudit(){
  const previous=runPhase27FullIntegrationAudit();
  const current=runPhase28EventEditorScrollResetAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:28,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase29FullIntegrationAudit(){
  const previous=runPhase28FullIntegrationAudit();
  const current=runPhase29MobileDayDetailViewportAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:29,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase30FullIntegrationAudit(){
  const previous=runPhase29FullIntegrationAudit();
  const current=runPhase30SteamScanPerformanceAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:30,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase31FullIntegrationAudit(){
  const previous=runPhase30FullIntegrationAudit();
  const current=runPhase31LivePollingPerformanceAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:31,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase32FullIntegrationAudit(){
  const previous=runPhase31FullIntegrationAudit();
  const current=runPhase32CalendarObserverPerformanceAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:32,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase33FullIntegrationAudit(){
  const previous=runPhase32FullIntegrationAudit();
  const current=runPhase33ClockPerformanceAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:33,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase34FullIntegrationAudit(){
  const previous=runPhase33FullIntegrationAudit();
  const current=runPhase34MobileDayObserverPerformanceAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:34,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase35FullIntegrationAudit(){
  const previous=runPhase34FullIntegrationAudit();
  const current=runPhase35PointerMovePerformanceAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:35,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase36FullIntegrationAudit(){
  const previous=runPhase35FullIntegrationAudit();
  const current=runPhase36TodayPeopleStartupPollingAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:36,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase37FullIntegrationAudit(){
  const previous=runPhase36FullIntegrationAudit();
  const current=runPhase37ContactStartupPollingAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:37,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase38FullIntegrationAudit(){
  const previous=runPhase37FullIntegrationAudit();
  const current=runPhase38CalendarPreviewMoveAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:38,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase39FullIntegrationAudit(){
  const previous=runPhase38FullIntegrationAudit();
  const current=runPhase39TodayPeopleSyncDedupAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:39,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase40FullIntegrationAudit(){
  const previous=runPhase39FullIntegrationAudit();
  const current=runPhase40ParticipantSearchDebounceAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:40,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runPhase41FullIntegrationAudit(){
  const previous=runPhase40FullIntegrationAudit();
  const current=runPhase41ContactAddInjectionAudit();
  const issues=[...previous.issues,...current.issues.map(x=>`Phase ${current.phase}: ${x}`)];
  const warnings=[...previous.warnings,...current.warnings.map(x=>`Phase ${current.phase}: ${x}`)];
  const summary={currentPhase:41,issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify({fullIntegration:summary}));
  if(issues.length)process.exitCode=1;
  return summary;
}

export function runCurrentFullIntegrationAudit(){return runPhase41FullIntegrationAudit();}

if(import.meta.url===`file://${process.argv[1]}`)runCurrentFullIntegrationAudit();
