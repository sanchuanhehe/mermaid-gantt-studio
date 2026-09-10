import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const repo=path.resolve(import.meta.dirname,'..');
test('release rejects mismatched versions/tags and missing notes; bump keeps dependencies intact',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gantt-version-'));
 try{
  for(const file of ['scripts/version.mjs','package.json','editor/package.json','renderer/package.json','renderer/package-lock.json','editor/dist/index.html','CHANGELOG.md']){const out=path.join(tmp,file);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(path.join(repo,file),out);}
  const version=JSON.parse(fs.readFileSync(path.join(tmp,'package.json'))).version;
  const [major,minor,patch]=version.split('-')[0].split('.').map(Number);const next=`${major}.${minor}.${patch+1}-beta.1`;
  const run=(...args)=>spawnSync(process.execPath,[path.join(tmp,'scripts/version.mjs'),...args],{encoding:'utf8'});
  assert.equal(run('release','v'+version).status,0);
  assert.notEqual(run('release','v'+next).status,0);
  const lockBefore=JSON.parse(fs.readFileSync(path.join(tmp,'renderer/package-lock.json')));
  assert.equal(run('set',next).status,0);assert.equal(run('check').status,0);
  const lockAfter=JSON.parse(fs.readFileSync(path.join(tmp,'renderer/package-lock.json')));
  assert.deepEqual(lockAfter.packages[''].dependencies,lockBefore.packages[''].dependencies);
  assert.notEqual(run('release','v'+next).status,0);
  assert.notEqual(run('set','0.02.0').status,0);
  const file=path.join(tmp,'editor/package.json'),value=JSON.parse(fs.readFileSync(file));value.version='9.9.9';fs.writeFileSync(file,JSON.stringify(value));assert.notEqual(run('check').status,0);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
