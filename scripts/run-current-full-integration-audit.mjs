import {runPhase1MobileShellAudit} from './run-phase1-mobile-shell-audit.mjs';
import {runPhase2StartupReadinessAudit} from './run-phase2-startup-readiness-audit.mjs';
import {runPhase3PostLoginStyleReadinessAudit} from './run-phase3-post-login-style-readiness-audit.mjs';
import {runPhase4PostLoginModuleFailureAudit} from './run-phase4-post-login-module-failure-audit.mjs';

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

export function runCurrentFullIntegrationAudit(){return runPhase4FullIntegrationAudit();}

if(import.meta.url===`file://${process.argv[1]}`)runCurrentFullIntegrationAudit();
