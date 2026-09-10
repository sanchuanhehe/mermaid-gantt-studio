import {ganttDocument,patchHeading,patchPresentation,appendNode} from './diagram-edit.mjs';
export function installDiagramUI({getContext,commit,onError}){
 const $=id=>document.getElementById(id);let selection;
 function open(hit={type:'title'}){
  try{
   const context=getContext();if(context.last?.kind!=='gantt'||context.last.revision!==context.revision)throw new Error('请先等待甘特图预览成功更新。');
   const doc=ganttDocument(context.source);selection={...hit,source:context.source,revision:context.revision};
   const adding=['node','lane'].includes(hit.type);$('diagram-add-fields').hidden=!adding;$('diagram-text-fields').hidden=adding;
   $('diagram-extra-label').hidden=hit.type!=='note';$('diagram-section-label').hidden=hit.type!=='node';$('diagram-lane-label').hidden=hit.type!=='lane';
   $('diagram-heading').textContent=({title:'编辑图表标题',section:'编辑泳道名称',note:'编辑备注',legend:'编辑图例',node:'添加节点',lane:'添加泳道'})[hit.type];
   $('diagram-error').textContent='';
   if(adding){
    $('diagram-section').replaceChildren();for(const lane of doc.sections){const option=document.createElement('option');option.value=lane.index;option.textContent=lane.name;$('diagram-section').append(option);}
    if(hit.type==='node'&&!doc.sections.length)throw new Error('请先添加泳道。');
    $('diagram-lane').value='';$('diagram-node-name').value=hit.type==='lane'?'新任务':'';
    const format=/^\s*dateFormat\s+(.+)$/m.exec(context.source)?.[1].trim();
    const date=new Date();const today=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
    $('diagram-start').value=format==='YYYY-MM-DD'?today:'';$('diagram-end').value='1d';
    $('diagram-format').textContent='日期格式：'+(format??'遵循源码 dateFormat')+'。'+(hit.type==='lane'?'同时添加首个节点，让新泳道显示在图中。':'任务 ID 自动生成，支持 after 依赖和工期。');
    for(const flag of ['done','active','crit','milestone'])$('new-'+flag).checked=false;
   }else{
    $('diagram-value').value=hit.type==='title'?(doc.title?.text??hit.text??''):hit.type==='section'?doc.sections.find(l=>l.index===hit.index)?.name??'':hit.type==='note'?context.options.note:hit.text??context.options.legendText??'';
    $('diagram-label').value=context.options.noteLabel;
   }
   $('diagram-dialog').showModal();
  }catch(error){onError(error.message);}
 }
 for(const [id,type]of [['add-node','node'],['add-lane','lane'],['edit-title','title'],['edit-note','note']])$(id).addEventListener('click',()=>open({type}));
 for(const id of ['diagram-close','diagram-cancel'])$(id).addEventListener('click',()=>$('diagram-dialog').close());
 $('diagram-form').addEventListener('submit',event=>{
  event.preventDefault();try{
   const context=getContext();if(context.source!==selection.source||context.revision!==selection.revision)throw new Error('图表已变化，请关闭面板并重新选择。');
   let next;
   if(selection.type==='node'||selection.type==='lane'){
    const input={name:$('diagram-node-name').value,start:$('diagram-start').value,end:$('diagram-end').value,sectionIndex:$('diagram-section').value};
    if(selection.type==='lane')input.newSection=$('diagram-lane').value;
    for(const flag of ['done','active','crit','milestone'])input[flag]=$('new-'+flag).checked;
    next=appendNode(context.source,input).source;
   }else if(selection.type==='note')next=patchPresentation(context.source,{note:$('diagram-value').value.trim(),noteLabel:$('diagram-label').value.trim()||'备注'});
   else if(selection.type==='legend')next=patchPresentation(context.source,{legendText:$('diagram-value').value.trim()});
   else next=patchHeading(context.source,{...selection,value:$('diagram-value').value});
   commit(next);$('diagram-dialog').close();
  }catch(error){$('diagram-error').textContent=error.message;}
 });
 return {open};
}
