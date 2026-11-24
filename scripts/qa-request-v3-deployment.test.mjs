import test from 'node:test';
import assert from 'node:assert/strict';
import {verify} from './verify-cloudflare-deployment-v3.mjs';
const versionId='12345678-1234-1234-1234-123456789012',sha='a'.repeat(40);
test('management verification uses two GET requests, rejects mismatched or split deployment',async()=>{
 const calls=[];
 const run=async({match=true,percentage=100}={})=>verify({account:'b'.repeat(32),token:'fixture',expected:sha,fetchImpl:async(url,options)=>{
  calls.push({url,method:options.method});
  assert.equal(new URL(url).hostname,'api.cloudflare.com');assert.equal(options.method,'GET');assert.equal(options.redirect,'error');
  if(url.endsWith('/deployments'))return Response.json({success:true,result:{deployments:[{id:'fixture',created_on:'2026-11-24T00:00:00Z',versions:[{version_id:versionId,percentage}]}]}});
  return Response.json({success:true,result:{id:versionId,annotations:{'workers/message':'git:'+(match?sha:'c'.repeat(40))}}});
 }});
 assert.equal((await run()).commitMatched,true);assert.equal(calls.length,2);
 await assert.rejects(run({match:false}),/not verified/);
 await assert.rejects(run({percentage:50}),/fully active/);
});
