// Patch only explicit Gantt directives. Dates and dependencies remain Mermaid's job.
export function ganttDocument(source){
 const lines=source.split('\n'),start=lines.findIndex(l=>/^\s*gantt\s*\r?$/.test(l));
 if(start<0)throw new Error('此功能用于 Mermaid 甘特图，请先输入 gantt。');
 let end=lines.findIndex((l,i)=>i>start&&/^\s*```/.test(l));if(end<0)end=lines.length;
 const sections=[];let title=null;
 for(let i=start+1;i<end;i++){
  const section=/^(\s*)section\s+(.+?)\s*\r?$/.exec(lines[i]);if(section)sections.push({index:i,name:section[2],indent:section[1]});
  const heading=/^(\s*)title\s+(.+?)\s*\r?$/.exec(lines[i]);if(heading)title={index:i,text:heading[2],indent:heading[1]};
 }
 return {lines,start,end,sections,title,eol:source.includes('\r\n')?'\r':''};
}
function single(value,label,{colon=false}={}){value=String(value??'').trim();if(!value||/[\r\n]/.test(value)||colon&&value.includes(':'))throw new Error(`${label}不能为空或包含换行${colon?'、冒号':''}。`);return value;}
export function patchHeading(source,{type,index,value}){
 const doc=ganttDocument(source),text=single(value,type==='title'?'标题':'泳道名称');
 if(type==='title'){
  if(doc.title)doc.lines[doc.title.index]=doc.title.indent+'title '+text+doc.eol;
  else doc.lines.splice(doc.start+1,0,'    title '+text+doc.eol);
 }else{
  const lane=doc.sections.find(l=>l.index===index);if(!lane)throw new Error('泳道已变化，请重新选择。');
  if(doc.sections.some(l=>l.index!==index&&l.name===text))throw new Error('泳道名称已存在，请使用不同名称。');
  doc.lines[index]=lane.indent+'section '+text+doc.eol;
 }
 return doc.lines.join('\n');
}
const META=/^\s*%% gantt-studio (\{.*\})\s*\r?$/;
export function readPresentation(source){
 const doc=ganttDocument(source),found=doc.lines.slice(doc.start+1,doc.end).filter(l=>META.test(l));
 if(found.length>1)throw new Error('存在多条 gantt-studio 设置，请合并为一条。');
 if(!found.length)return {};
 let data;try{data=JSON.parse(META.exec(found[0])[1]);}catch{throw new Error('gantt-studio 设置不是有效 JSON。');}
 const result={};for(const key of ['note','noteLabel','legendText'])if(data[key]!==undefined){if(typeof data[key]!=='string'||/[\r\n]/.test(data[key]))throw new Error('备注与图例文字需要是单行文本。');result[key]=data[key];}return result;
}
export function patchPresentation(source,changes){
 const doc=ganttDocument(source),data={...readPresentation(source),...changes};
 for(const key of Object.keys(data))if(!['note','noteLabel','legendText'].includes(key)||typeof data[key]!=='string'||/[\r\n]/.test(data[key]))throw new Error('备注和图例只支持单行文字。');
 const line='    %% gantt-studio '+JSON.stringify(data)+doc.eol;
 const index=doc.lines.findIndex((l,i)=>i>doc.start&&i<doc.end&&META.test(l));
 if(index<0)doc.lines.splice(doc.start+1,0,line);else doc.lines[index]=line;
 return doc.lines.join('\n');
}
export function appendNode(source,{sectionIndex,newSection,name,start,end,milestone=false,crit=false,done=false,active=false}){
 const doc=ganttDocument(source),label=single(name,'节点名称',{colon:true});
 const schedule=[single(start,'开始 / 依赖'),String(end??'').trim()].filter(Boolean).join(', ');
 if(/[\r\n]/.test(schedule)||schedule.split(',').some(p=>!p.trim()))throw new Error('排期表达式不能换行或包含空项。');
 let id='task_1',n=1;while(new RegExp('\\btask_'+n+'\\b').test(source))id='task_'+(++n);
 const flags=[done?'done':'',active?'active':'',crit?'crit':'',milestone?'milestone':''].filter(Boolean);
 const node='    '+label+' :'+[...flags,id,schedule].join(', ')+doc.eol;
 if(newSection!==undefined){
  const lane=single(newSection,'泳道名称');if(doc.sections.some(l=>l.name===lane))throw new Error('泳道名称已存在。');
  doc.lines.splice(doc.end,0,doc.eol,'    section '+lane+doc.eol,node);
 }else{
  const i=doc.sections.findIndex(s=>s.index===Number(sectionIndex));if(i<0)throw new Error('请选择节点所属泳道。');
  doc.lines.splice(doc.sections[i+1]?.index??doc.end,0,node);
 }
 return {source:doc.lines.join('\n'),id};
}
