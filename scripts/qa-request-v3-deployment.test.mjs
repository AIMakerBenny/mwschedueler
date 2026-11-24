import test from 'node:test';
import assert from 'node:assert/strict';
import {verify} from './verify-cloudflare-deployment-v3.mjs';
const versionId='12345678-1234-1234-1234-123456789012',sha='a'.repeat(40);
test('management verification uses two GET requests, rejects mismatched or split deployment',async()=>{
 const calls=[];
 const run=async({match=true,percentage=100}={})=>verify({account:'b'.repeat(32),token:'fixture',expected:sha,fetchImpl:async(url,options)=>{
  calls.push({url,method:options.method});
  assert.equal(new URL(url).hostname,'api.cloudflare.com');assert.equal(options.method,'GET');assert.equal(options.redirect,'error');
  if(url.includes('/builds/builds?'))return Response.json({success:true,result:{builds:{}}});
  if(url.endsWith('/deployments'))return Response.json({success:true,result:{deployments:[{id:'fixture',created_on:'2026-11-24T00:00:00Z',versions:[{version_id:versionId,percentage}]}]}});
  return Response.json({success:true,result:{id:versionId,annotations:{'workers/message':'git:'+(match?sha:'c'.repeat(40))}}});
 }});
 assert.equal((await run()).commitMatched,true);assert.equal(calls.length,2);
 await assert.rejects(run({match:false}),/not verified/);
 await assert.rejects(run({percentage:50}),/fully active/);
});

test('Git-connected deployment checks exact build-to-version association, not latest arbitrary build',async()=>{
 const calls=[];
 const run=async(commit=sha,branch='cloudflare-production')=>verify({account:'b'.repeat(32),token:'fixture',expected:sha,fetchImpl:async(url,options)=>{
  calls.push(url);assert.equal(new URL(url).hostname,'api.cloudflare.com');assert.equal(options.method,'GET');
  if(url.endsWith('/deployments'))return Response.json({success:true,result:{deployments:[{id:'fixture',created_on:'2026-11-24T00:00:00Z',versions:[{version_id:versionId,percentage:100}]}]}});
  if(url.endsWith('/versions/'+versionId))return Response.json({success:true,result:{id:versionId}});
  assert.equal(new URL(url).searchParams.get('version_ids'),versionId);
  return Response.json({success:true,result:{builds:{[versionId]:{build_outcome:'success',build_trigger_metadata:{commit_hash:commit,branch,repo_name:'mwschedueler'}}}}});
 }});
 assert.equal((await run()).evidence,'matching active version Workers Builds record');assert.equal(calls.length,3);
 await assert.rejects(run('c'.repeat(40)),/not verified/);
 await assert.rejects(run(sha,'preview'),/not verified/);
});
