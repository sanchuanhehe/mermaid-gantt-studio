import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('CHANGELOG.md',root),'utf8');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const categories={Added:'新增',Changed:'变更',Deprecated:'即将弃用',Removed:'移除',Fixed:'修复',Security:'安全'};
let body='',list=false,section=false;
function endList(){if(list){body+='</ul>';list=false;}}
for(const line of source.split('\n')){
 const version=/^## \[([^\]]+)\](.*)$/.exec(line);
 if(version){endList();if(section)body+='</section>';section=true;body+='<section><h2>'+esc(version[1]==='Unreleased'?'未发布 · Unreleased':'v'+version[1])+'</h2><p class="date">'+esc(version[1]==='Unreleased'?'开发中的改动，尚未进入 stable':version[2].replace(/^ - /,''))+'</p>';continue;}
 if(!section||/^\[[^\]]+\]:/.test(line))continue;
 const category=/^### (.+)$/.exec(line);
 if(category){endList();body+='<h3>'+esc(categories[category[1]]??category[1])+' <small>'+esc(category[1])+'</small></h3>';continue;}
 if(line.startsWith('- ')){if(!list){body+='<ul>';list=true;}body+='<li>'+esc(line.slice(2))+'</li>';continue;}
 endList();if(line.trim())body+='<p>'+esc(line)+'</p>';
}
endList();if(section)body+='</section>';
const html='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>更新日志 · Mermaid 排期工作台</title><style>body{margin:0;background:#f5f7fb;color:#17324d;font:16px/1.75 system-ui,-apple-system,"PingFang SC",sans-serif}main{max-width:800px;margin:auto;padding:48px 24px 80px}a{color:#245bdb;text-underline-offset:4px}header{margin-bottom:32px}h1{font-size:32px;letter-spacing:-1px;margin:16px 0 4px}header p,.date{color:#64748b}section{background:white;border:1px solid #dce4ef;border-radius:16px;padding:28px 32px;margin:24px 0;box-shadow:0 4px 20px #17324d04}h2{font-size:24px;margin:0}.date{font-size:14px;margin:4px 0 22px}h3{font-size:16px;margin:22px 0 8px}small{font-size:12px;font-weight:400;color:#64748b;margin-left:6px}ul{padding-left:22px;margin:0}li{padding:4px 0}footer{color:#64748b;font-size:13px}@media(max-width:520px){main{padding:24px 16px}section{padding:20px}h1{font-size:26px}}</style></head><body><main><header><a href="./" target="_blank" rel="noopener">打开排期工作台 ↗</a><h1>更新日志</h1><p>Mermaid 排期工作台 · 每个版本值得关注的变化</p></header>'+body+'<footer>内容来自本版本的 CHANGELOG.md，遵循 <a href="https://keepachangelog.com/en/1.1.0/" target="_blank" rel="noopener">Keep a Changelog</a>。更新条目保留原文。</footer></main></body></html>\n';
const output=new URL('editor/dist/changelog.html',root);
if(process.argv.includes('--check')){
 if(!fs.existsSync(output)||fs.readFileSync(output,'utf8')!==html)throw new Error('Run npm run changelog:build to sync CHANGELOG.md');
}else fs.writeFileSync(output,html);
console.log('Changelog page synchronized: '+fileURLToPath(output));
