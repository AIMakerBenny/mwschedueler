import fs from 'node:fs';

const file='assets/app-core.css';
const original=fs.readFileSync(file,'utf8');
let css=original;
const changes=[];

function replaceExact(name,from,to=''){
  const first=css.indexOf(from);
  if(first<0)throw new Error(`[phase1] ${name}: expected source block not found`);
  if(css.indexOf(from,first+from.length)>=0)throw new Error(`[phase1] ${name}: source block is not unique`);
  css=css.slice(0,first)+to+css.slice(first+from.length);
  changes.push(name);
}

function replaceSection(name,startMarker,endMarker,replacement){
  const start=css.indexOf(startMarker);
  if(start<0)throw new Error(`[phase1] ${name}: start marker not found`);
  const end=css.indexOf(endMarker,start+startMarker.length);
  if(end<0)throw new Error(`[phase1] ${name}: end marker not found`);
  if(css.indexOf(startMarker,start+startMarker.length)>=0)throw new Error(`[phase1] ${name}: start marker is not unique`);
  css=css.slice(0,start)+replacement+css.slice(end);
  changes.push(name);
}

function replaceInSection(name,startMarker,endMarker,transform){
  const start=css.indexOf(startMarker);
  if(start<0)throw new Error(`[phase1] ${name}: section start not found`);
  const end=css.indexOf(endMarker,start+startMarker.length);
  if(end<0)throw new Error(`[phase1] ${name}: section end not found`);
  const before=css.slice(start,end);
  const after=transform(before);
  if(after===before)throw new Error(`[phase1] ${name}: transform made no change`);
  css=css.slice(0,start)+after+css.slice(end);
  changes.push(name);
}

/* Base responsive shell from the original single-column mobile layout.
   Preserve component responsiveness, remove only app/sidebar/nav/main ownership. */
replaceExact(
  'base max-width shell',
  '@media(max-width:900px){\n .app{grid-template-columns:1fr}.sidebar{height:auto;position:static;border-right:0;border-bottom:1px solid var(--border)}.nav{flex-direction:row;overflow:auto}.main{padding:14px}\n .grid.cols-3,.grid.cols-2{grid-template-columns:1fr}.formgrid{grid-template-columns:1fr}.field.full{grid-column:auto}.title-device{grid-template-columns:1fr}\n .calendar{grid-template-columns:repeat(7,minmax(100px,1fr));overflow:auto}.calendar-head{grid-template-columns:repeat(7,minmax(100px,1fr));overflow:auto}\n}',
  '@media(max-width:900px){\n .grid.cols-3,.grid.cols-2{grid-template-columns:1fr}.formgrid{grid-template-columns:1fr}.field.full{grid-column:auto}.title-device{grid-template-columns:1fr}\n .calendar{grid-template-columns:repeat(7,minmax(100px,1fr));overflow:auto}.calendar-head{grid-template-columns:repeat(7,minmax(100px,1fr));overflow:auto}\n}'
);

/* v2.2: first narrow-screen sidebar/navigation fallback. */
replaceExact(
  'v2.2 narrow shell',
  '@media(max-width:760px){\n  .app{grid-template-columns:1fr!important}\n  .sidebar{width:100%!important;height:auto!important;position:static!important;overflow:visible}\n  .sidebar-head{min-height:0}\n  .logo-full{display:block!important}.logo-mini{display:none!important}.logo small{display:block!important}\n  .sidebar-pin{display:none!important}\n  .nav{flex-direction:row!important;overflow:auto}\n  .nav button{width:auto;min-width:48px}.nav-label{display:none!important}\n}\n'
);

/* v2.4: remove its obsolete phone shell but retain creator-footer responsiveness. */
replaceExact(
  'v2.4 narrow shell',
  '@media(max-width:760px){\n  .app{grid-template-columns:1fr!important}\n  .sidebar{\n    width:100%!important;\n    min-width:100%!important;\n    position:static!important;\n  }\n  .sidebar:hover,\n  body.sidebar-pinned .sidebar{\n    width:100%!important;\n    min-width:100%!important;\n    box-shadow:none!important;\n  }\n  .nav{\n    flex-direction:row!important;\n    overflow:auto!important;\n  }\n  .nav button,\n  .sidebar:hover .nav button,\n  body.sidebar-pinned .nav button{\n    width:46px!important;\n    min-width:46px!important;\n    max-width:46px!important;\n    margin:0!important;\n    padding:0!important;\n    justify-content:center!important;\n  }\n  .nav-label{display:none!important}\n  .creator-footer{\n    flex-direction:row!important;\n    align-items:flex-end!important;\n    justify-content:flex-end!important;\n    flex-wrap:wrap!important;\n  }\n  .creator-links{\n    flex-wrap:wrap!important;\n  }\n}\n',
  '@media(max-width:760px){\n  .creator-footer{\n    flex-direction:row!important;\n    align-items:flex-end!important;\n    justify-content:flex-end!important;\n    flex-wrap:wrap!important;\n  }\n  .creator-links{flex-wrap:wrap!important}\n}\n'
);

/* v2.6: desktop sticky sidebar remains; its old phone reset no longer participates. */
replaceExact(
  'v2.6 narrow sidebar reset',
  '@media(max-width:760px){\n  .sidebar,\n  .sidebar:hover,\n  body.sidebar-pinned .sidebar,\n  body.sidebar-pinned .sidebar:hover{\n    position:static!important;\n    height:auto!important;\n    max-height:none!important;\n    overflow:visible!important;\n  }\n}\n'
);

/* Resolution preset: keep feature-specific phone sizing, remove the obsolete app/sidebar/navigation shell. */
replaceInSection(
  'resolution mobile shell',
  '/* Resolution-specific layout presets. FHD is the default and mostly follows the native layout. */',
  '@media(max-width:1100px)',
  section=>section.replace(
    /body\[data-resolution="mobile"\] \.app,body\[data-resolution="mobile"\]\.sidebar-pinned \.app\{[\s\S]*?(?=body\[data-resolution="mobile"\] \.grid\.cols-2,)/,
    ''
  )
);

/* v4.8: remove the horizontal-card mobile navigation generation wholesale.
   Only component-level mobile rules survive here. */
const v48ComponentRules=`/* Current component-only mobile rules retained from v4.8. */
body[data-resolution="mobile"] .toolbar{align-items:stretch!important;gap:9px!important;flex-wrap:wrap!important}
body[data-resolution="mobile"] .toolbar>.row{width:100%!important}
body[data-resolution="mobile"] .contact-board-layout{grid-template-columns:1fr!important}
body[data-resolution="mobile"] .contact-tag-panel{position:static!important;max-height:none!important}
body[data-resolution="mobile"] #contacts .contact-maintenance-grid{grid-template-columns:1fr!important}
body[data-resolution="mobile"] #contacts .contact-maintenance-card{grid-template-columns:74px minmax(0,1fr)!important;min-height:112px!important}
body[data-resolution="mobile"] #contacts .contact-maintenance-avatar{width:74px!important;height:74px!important;min-width:74px!important}
@media(max-width:620px){
  body[data-resolution="mobile"] .contact-controls-note{font-size:10px!important}
}

`;
replaceSection(
  'v4.8 mobile preset shell',
  '/* Mobile preset is an explicit app layout, not a squeezed desktop sidebar. */',
  '/* v4.9 - cinematic gacha selection redesign */',
  v48ComponentRules
);

/* v4.10: its entire drawer generation is superseded by mobile-drawer-v130.css,
   which now owns closed/open transform, toggle, backdrop, rows and footer. */
replaceSection(
  'v4.10 off-canvas drawer',
  '/* =========================================================\n   v4.10 - true mobile off-canvas navigation drawer\n   ========================================================= */',
  '/* =========================================================\n   v4.11 - headbutt gacha stage + self exclusion in collab\n   ========================================================= */',
  ''
);

/* Structural audit: app-core must no longer own the mobile application shell/navigation. */
const forbidden=[
  ['resolution mobile app shell','body[data-resolution="mobile"] .app'],
  ['resolution mobile sidebar shell','body[data-resolution="mobile"] .sidebar'],
  ['resolution mobile nav scroll','body[data-resolution="mobile"] .nav-scroll'],
  ['resolution mobile nav button','body[data-resolution="mobile"] .nav button'],
  ['resolution mobile drawer toggle','body[data-resolution="mobile"] .mobile-nav-toggle'],
  ['resolution mobile drawer backdrop','body[data-resolution="mobile"] .mobile-nav-backdrop']
];
for(const [name,needle] of forbidden){
  if(css.includes(needle))throw new Error(`[phase1] stale ${name} remains in app-core.css`);
}

const legacyNarrowShell=/@media\(max-width:760px\)\{[\s\S]{0,1200}?(?:\.app\{grid-template-columns:1fr|\.sidebar\{[^}]*position:static|\.nav\{[^}]*flex-direction:row)/;
if(legacyNarrowShell.test(css))throw new Error('[phase1] stale max-width:760 application shell remains');

const opens=(css.match(/\{/g)||[]).length;
const closes=(css.match(/\}/g)||[]).length;
if(opens!==closes)throw new Error(`[phase1] CSS brace mismatch after cleanup: ${opens} open / ${closes} close`);
if(css===original)throw new Error('[phase1] no changes produced');

fs.writeFileSync(file,css);
console.log(`[phase1] cleaned ${changes.length} legacy mobile shell generations`);
console.log(`[phase1] ${original.length} -> ${css.length} chars (${original.length-css.length} removed)`);
for(const name of changes)console.log(` - ${name}`);
