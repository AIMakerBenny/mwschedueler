// Rebuild the F1 stylesheet from the explicit, ordered source manifest.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
let html=fs.readFileSync('index.html','utf8');
const re=/<link rel="stylesheet" href="assets\/f1-racing-bundle-v1\.css\?v=([a-f0-9]+)(?:&[^"]*)?" data-mws-style-sources="([^"]+)">/;
const match=html.match(re);assert(match,'Missing F1 bundle source manifest');
const sources=match[2].split(' ');assert(sources.length>=2&&new Set(sources).size===sources.length);
const css=sources.map(p=>{assert(/^assets\/f1-racing[-\w]+\.css$/.test(p)&&p!=='assets/f1-racing-bundle-v1.css');const v=fs.readFileSync(p,'utf8');assert(!/@(?:import|namespace|charset)\b/.test(v));return '/* Source: '+p+' */\n'+v.trimEnd()+'\n'}).join('\n');
const hash=crypto.createHash('sha256').update(css).digest('hex').slice(0,12);
if(process.argv.includes('--check')){assert.equal(fs.readFileSync('assets/f1-racing-bundle-v1.css','utf8'),css,'F1 stylesheet stale; rebuild');assert.equal(match[1],hash,'F1 stylesheet URL stale')}
else{fs.writeFileSync('assets/f1-racing-bundle-v1.css',css);html=html.replace(re,'<link rel="stylesheet" href="assets/f1-racing-bundle-v1.css?v='+hash+'" data-mws-style-sources="'+match[2]+'">');fs.writeFileSync('index.html',html)}
console.log('F1_BUNDLE_OK '+sources.length+' files '+hash);
