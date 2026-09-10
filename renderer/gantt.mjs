#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {browserRender} from './browser-render.mjs';
const require=createRequire(import.meta.url);
export const MERMAID_VERSION='11.17.2';
export function prepareSource(source,{cleanPaste=false}={}){
 let s=source.replace(/^\uFEFF/,'').trim();
 const match=/^```(?:mermaid)?\s*\n([\s\S]*?)\n```\s*$/.exec(s);if(match)s=match[1];
 if(cleanPaste)s=s.replace(/&#x20;|&#32;|&nbsp;/gi,' ').replace(/\u00a0/g,' ').replace(/\u200b/g,'').replace(/\\[ \t]*\r?\n/g,'\n');
 return s;
}
function positive(value,fallback,min,name){const n=value===undefined?fallback:Number(value);if(!Number.isFinite(n)||n<min)throw new Error(`${name} 必须 >= ${min}`);return n;}
function settings(input={}){
 const o={...input};o.width=Math.round(positive(o.width,1600,720,'width'));o.fontSize=positive(o.fontSize,18,10,'font-size');o.rowHeight=positive(o.rowHeight,o.fontSize+10,o.fontSize+4,'row-height');o.scale=positive(o.scale,1,.1,'scale');o.timeout=positive(o.timeout,30000,1000,'timeout');
 o.mode??='styled';if(!['styled','native'].includes(o.mode))throw new Error('mode 必须为 styled 或 native');
 o.dates??='on';if(!['on','off'].includes(o.dates))throw new Error('dates 必须为 on 或 off');
 o.timezone??='UTC';o.fontFamily??='PingFang SC,Microsoft YaHei,Noto Sans CJK SC,Arial,sans-serif';o.noteLabel??='求助';
 if(o.height!==undefined)o.height=Math.round(positive(o.height,0,200,'height'));
 if(o.aspect && o.height!==undefined)throw new Error('height 与 aspect 互斥');
 if(o.aspect&&!/^\d+(?:\.\d+)?:\d+(?:\.\d+)?$/.test(o.aspect))throw new Error('aspect 示例：16:9、4:3');
 if(o.aspect&&o.aspect.split(':').some(x=>+x<=0))throw new Error('aspect 两项均须大于 0');
 if(o.today&&o.today!=='off'&&!Number.isFinite(Date.parse(o.today)))throw new Error('today 日期无效');
 return o;
}
/** All schedule syntax is passed to the official Mermaid engine unchanged. */
export async function renderMermaid(source,input={}){
 const options=settings(input),browser=await chromium.launch({headless:true,...(options.browser?{executablePath:options.browser}:{})});
 let timer;
 try{
  const context=await browser.newContext({viewport:{width:options.width,height:options.height??1200},deviceScaleFactor:options.scale,timezoneId:options.timezone});
  const page=await context.newPage();await page.setContent('<html><body style="margin:0;background:white"><div id="mount"></div></body></html>');
  // Network is not needed for chart rendering. Fonts come from the local machine.
  await page.route('**/*',route=>route.abort());
  if(options.today&&options.today!=='off'){const fixed=await page.evaluate(d=>new Date(d.length===10?d+'T12:00:00':d).getTime(),options.today);await page.clock.setFixedTime(new Date(fixed));}
  const entry=require.resolve('mermaid');const packageInfo=JSON.parse(await fs.readFile(path.join(path.dirname(entry),'..','package.json'),'utf8'));if(packageInfo.version!==MERMAID_VERSION)throw new Error(`Mermaid 版本 ${packageInfo.version} 与已验证适配器 ${MERMAID_VERSION} 不同，请重新运行兼容性测试后升级`);const bundle=path.join(path.dirname(entry),'mermaid.js');
  await page.addScriptTag({path:bundle});
  const operation=page.evaluate(browserRender,{source:prepareSource(source,options),options});
  const result=await Promise.race([operation,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`Mermaid 渲染超过 ${options.timeout}ms，已终止`)),options.timeout);})]);
  clearTimeout(timer);
  if(options.pngPath){await fs.mkdir(path.dirname(options.pngPath),{recursive:true});await page.locator('#mount > svg').screenshot({path:options.pngPath});}
  return result;
 }finally{clearTimeout(timer);await browser.close();}
}
const help=`用法：node gantt.mjs input.mmd -o result [选项]

  -o result.svg|result.png|result   输出 SVG、PNG 或两者
  --mode styled|native           默认 styled；native 保留官方图样式
  --width 1600                   画布宽度；默认自动高度
  --height 1200 / --aspect 16:9   可选固定高度或比例，互斥
  --font-size 18 --row-height 28 字号、行高
  --scale 1                      PNG 像素倍率
  --dates on|off                 右置标签时添加官方计算日期，默认 on
  --release YYYY-MM-DD           附加红色发布日期线
  --today YYYY-MM-DD|off          固定当前日期或隐藏；默认系统时间
  --timezone UTC                 渲染时区，默认 UTC
  --note '需协助事项' --note-label '求助'
  --config config.json           Mermaid initialize 配置
  --clean-paste                  修复 HTML 空格、零宽字符与行尾反斜杠
  --audit report.json            导出官方任务起止时间和几何核对结果
  --browser /path/to/chrome      使用已有 Chrome/Chromium
  --timeout 30000                官方引擎计算超时，单位毫秒
  --format svg|png|both           默认按 -o 扩展名推断
  --help

SVG、PNG 均使用官方 Mermaid 11.17.2 + Chromium，需要 npm ci 与浏览器。
source 中的 frontmatter、init、排期语法原样交给 Mermaid；不再使用自写语法解析器。
`;
async function main(args){
 if(!args.length||args.includes('--help')){console.log(help);return;}
 const names={'--mode':'mode','--width':'width','--height':'height','--aspect':'aspect','--font-size':'fontSize','--row-height':'rowHeight','--scale':'scale','--dates':'dates','--release':'release','--today':'today','--timezone':'timezone','--note':'note','--note-label':'noteLabel','--config':'configPath','--audit':'audit','--browser':'browser','--timeout':'timeout','--format':'format','--font-family':'fontFamily'};
 const o={};let input,output;
 for(let i=0;i<args.length;i++){const a=args[i];if(a==='--clean-paste'){o.cleanPaste=true;continue;}if(a==='-o'||a==='--output'||names[a]){const v=args[++i];if(v===undefined)throw new Error(`缺少 ${a} 的值`);if(a==='-o'||a==='--output')output=v;else o[names[a]]=v;}else if(a==='-'||!a.startsWith('-')){if(input)throw new Error('只接受一份输入');input=a;}else throw new Error('未知参数：'+a);}
 if(!input||!output)throw new Error('需要输入文件与 -o 输出路径');
 let source;if(input==='-'){const chunks=[];for await(const c of process.stdin)chunks.push(c);source=Buffer.concat(chunks).toString('utf8');}else source=await fs.readFile(input,'utf8');
 if(o.configPath)o.config=JSON.parse(await fs.readFile(o.configPath,'utf8'));
 const ext=path.extname(output).toLowerCase(),base=['.svg','.png'].includes(ext)?output.slice(0,-4):output;
 const format=o.format??(ext==='.svg'?'svg':ext==='.png'?'png':'both');if(!['svg','png','both'].includes(format))throw new Error('format 必须为 svg/png/both');
 await fs.mkdir(path.dirname(base),{recursive:true});
 const r=await renderMermaid(source,{...o,...(format!=='svg'?{pngPath:base+'.png'}:{})});
 if(format!=='png')await fs.writeFile(base+'.svg',r.svg);
 if(o.audit){await fs.mkdir(path.dirname(o.audit),{recursive:true});const {svg,rawSvg,...audit}=r;await fs.writeFile(o.audit,JSON.stringify(audit,null,2));}
 r.warnings.forEach(w=>console.error('提示：'+w));console.log(JSON.stringify({mermaidVersion:r.mermaidVersion,width:r.width,height:r.height,tasks:r.tasks.length,mode:o.mode??'styled',geometryUnchanged:JSON.stringify(r.geometryBefore)===JSON.stringify(r.geometryAfter)},null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main(process.argv.slice(2)).catch(e=>{console.error('错误：'+e.message);process.exitCode=1;});
