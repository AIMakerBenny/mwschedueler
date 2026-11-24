import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>readFileSync(new URL('../assets/'+p,import.meta.url),'utf8');
const protocol=read('media-batch-protocol-v5.js').replace(/^export /gm,'');
const client=read('media-batch-client-v5.js').replace(/^import .*\n/,'').replace(/^export /gm,'');
const text='/* Generated from V5 protocol and client */\n(()=>{\n'+protocol+'\n'+client+'\nself.mwsBatchGetV51=getDemandedMedia;\n})();\n';
const file=new URL('../assets/media-batch-sw-runtime-v51.js',import.meta.url);
if(process.argv.includes('--check'))assert.equal(readFileSync(file,'utf8'),text);else writeFileSync(file,text);
