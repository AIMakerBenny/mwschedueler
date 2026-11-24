import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {normalizeCloudCore,normalizeBossScript} from '../src/cf-v111-entry.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const generated={
 'assets/cf-static-bootstrap-v1.js':read('assets/cloud-v1.1-loader.js').replace('app-version-v120.js?v=1.3.0','app-version-v120.js?v=1.4.0-phase73').replaceAll('/assets/cloud-v1.1.js?','/assets/cf-static-cloud-core-v1.js?').replaceAll('/assets/boss-manager-v121.js?','/assets/cf-static-boss-manager-v1.js?'),
 'assets/cf-static-cloud-core-v1.js':normalizeCloudCore(read('assets/cloud-v1.1.js')),
 'assets/cf-static-boss-manager-v1.js':normalizeBossScript(read('assets/boss-manager-v121.js'))
};
for(const [file,content] of Object.entries(generated)){
 if(process.argv.includes('--check'))assert.equal(read(file),content,'Stale static asset: '+file+'; run node scripts/build-cf-static-runtime.mjs');
 else writeFileSync(new URL('../'+file,import.meta.url),content);
}
console.log('CF_STATIC_RUNTIME_OK '+Object.keys(generated).length);
