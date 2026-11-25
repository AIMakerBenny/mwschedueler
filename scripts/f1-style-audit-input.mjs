// Legacy phase audits must verify the real linked bundle before inspecting
// the logical ordered source URLs. No fake stylesheet links exist at runtime.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
export function readF1AuditIndex(){
 const html=fs.readFileSync('index.html','utf8');
 const re=/<link rel="stylesheet" href="assets\/f1-racing-bundle-v1\.css\?v=([a-f0-9]+)" data-mws-style-sources="([^"]+)">/;
 const m=html.match(re);if(!m)return html;
 const paths=m[2].split(' '),urls=JSON.parse(fs.readFileSync('docs/css-stage37/f1-source-urls.json','utf8'));
 assert.deepEqual(urls.map(u=>u.split('?')[0]),paths,'F1 source manifest order mismatch');
 const css=paths.map(p=>'/* Source: '+p+' */\n'+fs.readFileSync(p,'utf8').trimEnd()+'\n').join('\n');
 assert.equal(fs.readFileSync('assets/f1-racing-bundle-v1.css','utf8'),css,'F1 runtime bundle differs from source');
 assert.equal(crypto.createHash('sha256').update(css).digest('hex').slice(0,12),m[1],'F1 cache key mismatch');
 return html.replace(re,urls.map(u=>'<link rel="stylesheet" href="'+u+'">').join('\n'));
}
