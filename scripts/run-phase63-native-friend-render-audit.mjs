import fs from 'node:fs';
import zlib from 'node:zlib';

function decodedV5(){
  const source=fs.readFileSync('assets/online-v5-loader.js','utf8');
  const match=source.match(/const PAYLOAD='([^']+)'/);
  if(!match)throw new Error('online V5 payload missing');
  return zlib.gunzipSync(Buffer.from(match[1],'base64')).toString('utf8');
}

export function runPhase63NativeFriendRenderAudit(){
  const issues=[];
  const warnings=[];
  const source=decodedV5();
  const cardNeedle='return `<article class="friend-finder-card-v5';
  const cardIndex=source.indexOf(cardNeedle);
  const gridIndex=source.indexOf('grid.innerHTML=arr.map(c=>');
  if(cardIndex<0)issues.push('native Friend Finder card template missing');
  if(gridIndex<0)issues.push('native Friend Finder grid renderer missing');
  if(cardIndex>=0){
    const before=source.slice(Math.max(0,cardIndex-1400),cardIndex);
    const after=source.slice(cardIndex,Math.min(source.length,cardIndex+4200));
    console.log('PHASE63_NATIVE_FRIEND_EXCERPT_START');
    console.log(before+after);
    console.log('PHASE63_NATIVE_FRIEND_EXCERPT_END');
  }
  const summary={phase:63,name:'native-friend-render-source',issues,warnings,pass:issues.length===0};
  console.log(JSON.stringify(summary));
  if(issues.length)process.exitCode=1;
  return summary;
}
if(import.meta.url===`file://${process.argv[1]}`)runPhase63NativeFriendRenderAudit();
