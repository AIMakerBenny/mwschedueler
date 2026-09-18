import fs from 'node:fs';
import vm from 'node:vm';

export function runPhase70UniversalKoreanInitialSearchAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  for(const marker of ['function mwsKoreanInitials','function mwsTextMatches','window.mwsTextMatches=mwsTextMatches','window.contactMatches=contactMatches']){
    if(!app.includes(marker))issues.push('missing shared search marker: '+marker);
  }
  for(const marker of ['favoriteEventSearchText(e).includes(q)',"String(m.title||'').toLowerCase().includes(q)","(c.name+' '+(c.labels||[]).join(' ')).toLowerCase().includes(query)"]){
    if(app.includes(marker))issues.push('raw matcher still bypasses shared Korean-initial search: '+marker);
  }
  if((app.match(/mwsTextMatches\(/g)||[]).length<6)issues.push('too few app search surfaces use mwsTextMatches');
  if((app.match(/contactMatches\(c,/g)||[]).length<8)issues.push('too few contact search surfaces use contactMatches');
  if(!index.includes('app-core.js?v=1.3.0-search'))issues.push('app-core search cache-bust missing');
  if(!index.includes('window.mwsTextMatches?window.mwsTextMatches'))issues.push('late v53 applicant renderer still bypasses shared matcher');
  for(const id of ['postApplicantSearch','targetSearch','memoSearch','favoriteScheduleSearch','selfContactSearch','participantSearch','targetPickerSearch']){
    const pos=index.indexOf('id="'+id+'"');
    if(pos<0){issues.push('search input missing: '+id);continue}
    const end=index.indexOf('>',pos);const tag=index.slice(pos,end+1);
    if(!tag.includes('초성'))issues.push('search input placeholder does not advertise initial search: '+id);
  }
  if(!index.includes('연락처 또는 초성 검색'))issues.push('mini-game contact search placeholder was not updated');

  const start=app.indexOf("const MWS_KOREAN_INITIALS=");
  const end=app.indexOf('function allContactLabels()',start);
  if(start<0||end<0)issues.push('shared matcher helper block cannot be isolated for functional test');
  else{
    try{
      const sandbox={window:{}};
      vm.runInNewContext(app.slice(start,end),sandbox);
      const match=sandbox.window.mwsTextMatches;const contact=sandbox.window.contactMatches;
      const tests=[
        [match&&match('우왁굳','ㅇㅇㄱ'),true,'우왁굳 to ㅇㅇㄱ'],
        [match&&match('김마왕 방송','ㄱㅁㅇ'),true,'김마왕 to ㄱㅁㅇ'],
        [match&&match('오늘 방송 준비','ㅇㄴㅂㅅ'),true,'multi-word Korean initials'],
        [contact&&contact({name:'리나',labels:['버튜버']},'ㄹㄴ'),true,'contact initials'],
        [contact&&contact({name:'리나',labels:['버튜버']},'ㅂㅌㅂ'),true,'label initials']
      ];
      for(const row of tests)if(row[0]!==row[1])issues.push('functional initial-search failure: '+row[2]);
    }catch(error){issues.push('shared matcher functional test failed: '+String(error&&error.message||error))}
  }
  const summary={phase:70,name:'universal-korean-initial-search',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase70UniversalKoreanInitialSearchAudit();
