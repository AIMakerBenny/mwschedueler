import fs from 'node:fs';

export function runPhase108PostScheduleParticipantPrefillAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const workflow=fs.readFileSync('.github/workflows/deploy-cloudflare-production.yml','utf8');

  for(const token of [
    'function postScheduleParticipantStatusV108(comment)',
    "if(raw==='selected'||raw==='confirmed')return 'confirmed';",
    "if(raw==='pending'||raw==='planned')return 'planned';",
    'function scheduleEligiblePostApplicantsV108(post)',
    "const rank=participantStatus==='confirmed'?2:1;",
    'const applicantRows=scheduleEligiblePostApplicantsV108(post);',
    'const contactStatusById=new Map();',
    "if(!previous||row.status==='confirmed')contactStatusById.set(id,row.status);",
    'const mergedStatuses={...(selectedParticipantStatuses||{})};',
    "const importedStatus=contactStatusById.get(id)||'planned';",
    "if(mergedStatuses[id]!=='confirmed'||importedStatus==='confirmed')mergedStatuses[id]=importedStatus;",
    "const plannedCount=applicantRows.filter(row=>row.status==='planned').length;",
    '확정</strong> 인원은 일정 참여자에 <strong>확정</strong>으로',
    '<strong>대기</strong> 인원은 <strong>예정</strong>으로 자동 등록됩니다.'
  ]){
    if(!index.includes(token))issues.push('post schedule participant prefill guard missing: '+token);
  }

  if(index.includes("if(c.status!=='selected')continue;")&&index.includes('function confirmedUniquePostApplicants(post)')){
    issues.push('legacy selected-only schedule prefill remains active');
  }

  for(const token of [
    'postScheduleParticipantStatusV108',
    'scheduleEligiblePostApplicantsV108',
    'targetPostScheduleExpectation'
  ]){
    if(!workflow.includes(token))issues.push('production Phase 108 verification missing: '+token);
  }

  const summary={phase:108,name:'post-schedule-participant-prefill',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase108PostScheduleParticipantPrefillAudit();
