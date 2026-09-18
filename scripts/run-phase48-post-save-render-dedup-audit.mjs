import fs from 'node:fs';

export function runPhase48PostSaveRenderDedupAudit(){
  const issues=[];
  const warnings=[];
  const core=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  if(!core.includes('function renderPostsAfterSaveV148()'))issues.push('post-save rendering has no optimizer-aware fallback helper');
  if(!core.includes('if(!window.__mwsCf571Optimizer)renderPosts()'))issues.push('post-save fallback does not skip duplicate production render');
  if(core.includes("saveData('게시글 신청자 상태 변경');renderPosts()"))issues.push('applicant status still performs an unconditional second post render');
  if(core.includes("saveData('게시글 신청자 전체 확정');renderPosts()"))issues.push('bulk confirm still performs an unconditional second post render');
  if(core.includes("saveData('게시글 신청자 전체 확정 취소');renderPosts()"))issues.push('bulk cancel still performs an unconditional second post render');
  if(core.includes("saveData('게시글 신청자 삭제');toast('게시글',`${c.name} 신청자를 삭제했습니다`);renderPosts()"))issues.push('applicant deletion still performs an unconditional second post render');
  if(!core.includes("saveData('게시글 신청자 상태 변경');renderPostsAfterSaveV148()"))issues.push('applicant status path does not use post-save fallback helper');
  if(!core.includes("saveData('게시글 신청자 전체 확정');renderPostsAfterSaveV148()"))issues.push('bulk confirm path does not use post-save fallback helper');
  if(!index.includes('assets/app-core.js?v=1.3.0-'))issues.push('app-core cache-bust revision is missing');

  const summary={phase:48,name:'post-save-render-dedup-performance',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase48PostSaveRenderDedupAudit();
