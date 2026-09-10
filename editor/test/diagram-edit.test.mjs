import test from 'node:test';
import assert from 'node:assert/strict';
import {ganttDocument,patchHeading,patchPresentation,readPresentation,appendNode} from '../dist/diagram-edit.mjs';
const source='gantt\n    title Plan\n    dateFormat YYYY-MM-DD\n    section A\n    Alpha :task_1, 2026-09-10, 2d\n    section B\n    Beta :b, after task_1, 3d\n';
test('heading edits preserve schedules and node insertion targets',()=>{
 let next=patchHeading(source,{type:'title',value:'New plan'});
 next=patchHeading(next,{type:'section',index:3,value:'Product'});
 assert.equal(next,source.replace('title Plan','title New plan').replace('section A','section Product'));
 const added=appendNode(next,{sectionIndex:3,name:'Review',start:'after task_1',end:'0d',milestone:true,crit:true});
 assert.equal(added.id,'task_2');
 assert.match(added.source,/Review :crit, milestone, task_2, after task_1, 0d\n    section B/);
 assert.ok(added.source.includes('Beta :b, after task_1, 3d'));
});
test('metadata roundtrips quotes and only edits a single comment',()=>{
 let next=patchPresentation(source,{note:'Owner "A" <text>',noteLabel:'Note'});
 next=patchPresentation(next,{legendText:'Planned / Risk'});
 assert.deepEqual(readPresentation(next),{note:'Owner "A" <text>',noteLabel:'Note',legendText:'Planned / Risk'});
 assert.equal(next.split('\n').filter(l=>l.includes('%% gantt-studio')).length,1);
 assert.equal(next.split('\n').filter(l=>!l.includes('%% gantt-studio')).join('\n'),source);
 assert.throws(()=>patchPresentation(next,{note:'a\nb'}));
});
test('new lane and first task stay inside fenced CRLF document',()=>{
 const fence=String.fromCharCode(96).repeat(3);
 const wrapped=fence+'mermaid\r\n'+source.replaceAll('\n','\r\n')+fence;
 const next=appendNode(wrapped,{newSection:'Release',name:'Ship',start:'after b',end:'0d',milestone:true}).source;
 assert.ok(next.endsWith('Ship :milestone, task_2, after b, 0d\r\n'+fence));
 assert.equal(ganttDocument(next).sections.length,3);
 assert.equal(next.replaceAll('\r\n','').includes('\n'),false);
});
test('invalid and ambiguous input is rejected',()=>{
 assert.throws(()=>appendNode(source,{newSection:'A',name:'X',start:'1d'}));
 assert.throws(()=>appendNode(source,{sectionIndex:3,name:'X:Y',start:'1d'}));
 assert.throws(()=>appendNode(source,{sectionIndex:3,name:'X',start:'after b,',end:'1d'}));
 assert.throws(()=>patchHeading(source,{type:'section',index:3,value:'B'}));
 assert.throws(()=>patchHeading(source,{type:'title',value:'A\nsection B'}));
});
