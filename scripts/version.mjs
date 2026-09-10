import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const json=file=>JSON.parse(read(file));
const manifests=['package.json','editor/package.json','renderer/package.json'];
const semver=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:alpha|beta|rc)\.(0|[1-9]\d*))?$/;
const [mode='check',value]=process.argv.slice(2);
if(mode==='set'){
 if(!semver.test(value??''))throw new Error('版本示例：0.1.0、0.2.0-beta.1');
 for(const file of manifests){const data=json(file);data.version=value;fs.writeFileSync(path.join(root,file),JSON.stringify(data,null,2)+'\n');}
 const file='renderer/package-lock.json',lock=json(file);lock.version=value;lock.packages[''].version=value;fs.writeFileSync(path.join(root,file),JSON.stringify(lock,null,2)+'\n');
 const html=read('editor/dist/index.html').replace(/(<span class="brand-version" data-app-version>)[^<]*(<\/span>)/,`$1v${value}$2`);
 fs.writeFileSync(path.join(root,'editor/dist/index.html'),html);
 console.log(`Version set to ${value}; update CHANGELOG.md before release.`);
}else if(mode==='check'||mode==='release'){
 const version=json('package.json').version;if(!semver.test(version))throw new Error('Invalid version');
 for(const file of manifests)if(json(file).version!==version)throw new Error(`Version mismatch: ${file}`);
 const lock=json('renderer/package-lock.json');if(lock.version!==version||lock.packages[''].version!==version)throw new Error('Lockfile version mismatch');
 if(!read('editor/dist/index.html').includes(`data-app-version>v${version}</span>`))throw new Error('UI version mismatch');
 if(mode==='release'){
  if(value!==`v${version}`)throw new Error(`Tag ${value} must equal v${version}`);
  const changelog=read('CHANGELOG.md'),section=changelog.split(`## [${version}] - `)[1]?.split(/\n## /)[0];
  if(!section||!/^\d{4}-\d{2}-\d{2}\n/.test(section)||!section.includes('\n- '))throw new Error('Missing dated release changelog');
 }
 console.log(version);
}else throw new Error('Usage: node scripts/version.mjs check|set VERSION|release TAG');
