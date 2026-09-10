import test from 'node:test';
import assert from 'node:assert/strict';
import {findTaskLine,patchTask} from '../dist/source-edit.mjs';
const source='---\nconfig: {}\n---\ngantt\n    dateFormat YYYY-MM-DD\n    excludes weekends\n    section A\n    First :done, a, 2026-09-01, 3d\n    Next :crit, b, after a, 7d\n    Final :milestone, c, after b, 0d\n';
const task={id:'b',label:'Next'};
test('rename and status preserve dependency, task ID and all other lines',()=>{
 const line=findTaskLine(source,task);assert.equal(line.schedule,'after a, 7d');
 const result=patchTask(source,task,line.original,{label:'Review',schedule:line.schedule,done:true});
 assert.equal(result,source.replace('Next :crit, b, after a, 7d','Review :done, b, after a, 7d'));
});
test('date changes affect only the selected schedule',()=>{
 const line=findTaskLine(source,task);
 assert.equal(patchTask(source,task,line.original,{label:'Next',schedule:'2026-10-01, 2026-10-08',crit:true}),source.replace('after a, 7d','2026-10-01, 2026-10-08'));
});
test('stale and ambiguous mappings are rejected',()=>{
 const line=findTaskLine(source,task);
 assert.throws(()=>patchTask(source.replace('7d','8d'),task,line.original,{label:'Next',schedule:'after a, 7d'}),/已变化/);
 assert.equal(findTaskLine(source+'    Next :crit, b, after a, 7d\n',task),null);
 assert.equal(findTaskLine('gantt\n Next :2026-09-01, 2d',task),null);
});
test('invalid edits rejected, CRLF and colon-bearing schedule preserved',()=>{
 const s='gantt\r\n  Hour :h, 2026-09-01 12:00, 2h\r\n',t={id:'h',label:'Hour'},line=findTaskLine(s,t);
 assert.equal(patchTask(s,t,line.original,{label:'Hour two',schedule:line.schedule}),s.replace('Hour :','Hour two :'));
 assert.throws(()=>patchTask(s,t,line.original,{label:'Bad:name',schedule:line.schedule}),/冒号/);
 assert.throws(()=>patchTask(s,t,line.original,{label:'Hour',schedule:'after h,\n2d'}),/不要换行/);
});

test('official task labels may contain alignment whitespace',()=>{
 const official={id:'b',label:'Next      '};
 const line=findTaskLine(source,official);assert.ok(line);
 assert.equal(patchTask(source,official,line.original,{label:'Reviewed',schedule:line.schedule,crit:true}),source.replace('Next :','Reviewed :'));
});
