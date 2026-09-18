import fs from 'node:fs';
import vm from 'node:vm';

export function runPhase71KoreanImeJamoSearchAudit(){
  const issues=[];
  const warnings=[];
  const app=fs.readFileSync('assets/app-core.js','utf8');
  const index=fs.readFileSync('index.html','utf8');

  if(!app.includes("const MWS_KOREAN_CHOSEONG='ᄀᄁᄂᄃᄄᄅᄆᄇᄈᄉᄊᄋᄌᄍᄎᄏᄐᄑᄒ'"))issues.push('modern Hangul choseong map is missing');
  if(!app.includes("normalize('NFKD')"))issues.push('Korean search does not Unicode-normalize IME input');
  if(!index.includes('assets/app-core.js?v=1.3.0-search71'))issues.push('search71 cache-bust is missing');

  const start=app.indexOf("const MWS_KOREAN_INITIALS=");
  const end=app.indexOf('function allContactLabels()',start);
  if(start<0||end<0){
    issues.push('cannot isolate shared search helpers');
  }else{
    try{
      const sandbox={window:{}};
      vm.runInNewContext(app.slice(start,end),sandbox);
      const initials=sandbox.window.mwsKoreanInitials;
      const match=sandbox.window.mwsTextMatches;
      const contact=sandbox.window.contactMatches;
      const compat='ㅇㅇㄱ';
      const choseong='ᄋᄋᄀ';
      const tests=[
        [initials('우왁굳'),'ㅇㅇㄱ','completed Hangul extraction'],
        [initials(compat),'ㅇㅇㄱ','compatibility-jamo query'],
        [initials(choseong),'ㅇㅇㄱ','modern choseong IME query'],
        [match('우왁굳',compat),true,'compatibility-jamo match'],
        [match('우왁굳',choseong),true,'modern choseong match'],
        [contact({name:'우왁굳',labels:['버튜버']},choseong),true,'contact match with IME choseong']
      ];
      const contacts=[{name:'우왁굳',labels:['버튜버']},{name:'리나',labels:['버튜버']}];
      const filtered=contacts.filter(c=>contact(c,choseong));
      tests.push([filtered.length,1,'end-to-end contact filter count']);
      tests.push([filtered[0]?.name,'우왁굳','end-to-end contact filter identity']);
      for(const row of tests){
        if(row[0]!==row[1])issues.push(row[2]+': expected '+String(row[1])+' got '+String(row[0]));
      }
    }catch(error){
      issues.push('IME Jamo functional test failed: '+String(error?.message||error));
    }
  }

  const summary={phase:71,name:'korean-ime-jamo-search',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase71KoreanImeJamoSearchAudit();
