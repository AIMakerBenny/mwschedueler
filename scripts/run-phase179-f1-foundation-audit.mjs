import fs from 'node:fs';

export function runPhase179F1FoundationAudit(){
  const issues=[];
  const warnings=[];
  const index=fs.readFileSync('index.html','utf8');
  const core=fs.readFileSync('assets/app-core.js','utf8');

  const navHorse=index.indexOf('data-tab="gamePachinko"');
  const horseSection=index.indexOf('<section id="gamePachinko" class="section mini-game-section">');
  const gachaNav=index.indexOf('data-tab="gameMultiDraw"');
  if(navHorse<0)issues.push('Existing horse-racing navigation entry is missing');
  if(horseSection<0)issues.push('Existing horse-racing section is missing');
  if(gachaNav<0)issues.push('Existing Gacha navigation entry is missing');

  for(const token of [
    "gamePachinko:'경마'",
    "if(tab==='gamePachinko')safeRenderView('경마',renderPachinko);",
    "pachinko:{running:false,racers:[],winnerId:'',turn:0,placements:[],rosterKey:'',timer:null}",
    "if(game==='pachinko')return data.miniGames.pachinko.players;",
    "function renderPachinko()"
  ])if(!core.includes(token))issues.push('Protected horse-racing integration anchor missing: '+token);

  for(const token of [
    'function contact(id){return data.contacts.find(c=>c.id===id)}',
    'function contactMatches(c,q=',
    'window.contactMatches=contactMatches;',
    'data.contacts||[]'
  ])if(!core.includes(token))issues.push('Contact integration anchor missing: '+token);

  const sidebar=index.match(/<aside class="sidebar">[\s\S]*?<\/aside>/)?.[0]||'';
  const legacyHub=index.match(/<section id="legacy" class="section">[\s\S]*?<\/section>/)?.[0];
  if(legacyHub){
    if(!legacyHub.includes('data-tab="gamePachinko" data-legacy-link-v1')||sidebar.includes('data-tab="gamePachinko"'))issues.push('Horse-racing must be accessible from Legacy only');
    const f1=sidebar.indexOf('data-tab="gameF1Racing"'),gacha=sidebar.indexOf('data-tab="gameMultiDraw"');
    if(f1<0||gacha<0||f1>gacha)issues.push('F1 must remain in the active minigame navigation before Gacha');
  }else if(navHorse>=0&&gachaNav>=0&&navHorse>gachaNav)issues.push('Horse-racing navigation is unexpectedly after Gacha');
  if(index.includes('data-tab="gameF1Racing"'))warnings.push('F1 racing shell already exists before Phase 180');

  const result={
    phase:179,
    name:'f1-racing-foundation-audit',
    issues,
    warnings,
    pass:issues.length===0,
    anchors:{
      horseNavigation:navHorse>=0,
      horseSection:horseSection>=0,
      contactSource:'data.contacts',
      targetPlacement:legacyHub?'active minigames before Gacha':'immediately before gamePachinko'
    }
  };
  console.log(JSON.stringify(result));
  if(issues.length)process.exitCode=1;
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`)runPhase179F1FoundationAudit();
