import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {renderMermaid,prepareSource} from '../gantt.mjs';
import {fixtures} from './fixtures.mjs';
const browser=process.env.GANTT_BROWSER;
const options={browser,width:1600,today:'2026-09-10',timezone:'UTC',dates:'off'};
const report=[];
const schedule=r=>r.tasks.map(t=>({id:t.id,label:t.label,section:t.section,start:t.start,end:t.end,renderEnd:t.renderEnd,milestone:t.milestone,vert:t.vert})).sort((a,b)=>a.id.localeCompare(b.id));
test('input keeps all official source directives',()=>{
 const s='---\nconfig:\n  theme: neutral\n---\ngantt\n excludes weekends\n A :2026-09-01, 3d';assert.equal(prepareSource(s),s);
 assert.equal(prepareSource('```mermaid\n'+s+'\n```'),s);
});
for(const fixture of fixtures)test('official parity: '+fixture.name,{timeout:90000},async()=>{
 const styled=await renderMermaid(fixture.source,{...options,mode:'styled'});
 const native=await renderMermaid(fixture.source,{...options,mode:'native'});
 assert.deepEqual(schedule(styled),schedule(native));
 assert.deepEqual(styled.geometryBefore,styled.geometryAfter);
 assert.equal(styled.tasks.length,styled.geometryBefore.length);
 if(fixture.expect){const t=styled.tasks.find(t=>t.id===fixture.expect.id);assert(t);for(const field of ['start','end'])if(fixture.expect[field])assert.equal(new Date(t[field]).toISOString(),new Date(fixture.expect[field]).toISOString());}
 if(fixture.compact){assert(styled.compact);assert.equal(styled.laneCount,1);assert.equal(styled.laneBoundaryCount,2);}
 if(fixture.name.includes('excludes'))assert(styled.excludedRanges>0);
 report.push({name:fixture.name,passed:true,taskCount:styled.tasks.length,schedule: schedule(styled),geometryUnchanged:true,excludedRanges:styled.excludedRanges});
});
test('original WS53 inventory through official engine',{timeout:90000},async()=>{
 const s=await fs.readFile(new URL('../examples/ws53.mmd',import.meta.url),'utf8');const r=await renderMermaid(s,{...options,width:2560,aspect:'16:9',fontSize:23,rowHeight:27,release:'2026-10-15'});assert.equal(r.tasks.length,40);assert.equal(r.height,1440);assert.deepEqual(r.geometryBefore,r.geometryAfter);assert.equal(r.laneCount,6);assert.equal(r.laneBoundaryCount,7);
 report.push({name:'ws53-40-tasks',passed:true,geometryUnchanged:true});
});
test('invalid official syntax is not silently reinterpreted',{timeout:90000},async()=>{await assert.rejects(()=>renderMermaid('gantt\nthis is invalid syntax',{...options}));});
test('timezone-aware clock and date schedule',{timeout:90000},async()=>{
 const r=await renderMermaid('gantt\n dateFormat YYYY-MM-DD\n section A\n Work :a, 2026-09-10, 2d',{...options,timezone:'Pacific/Kiritimati'});
 assert.equal(r.currentInstant,'2026-09-09T22:00:00.000Z');
 assert.equal(new Date(r.tasks[0].start).toISOString(),'2026-09-09T10:00:00.000Z');
 report.push({name:'timezone-aware-clock',passed:true});
});
test('dense ticks retain geometry and avoid duplicate labels',{timeout:90000},async()=>{
 const r=await renderMermaid(fixtures[0].source,{...options,width:1400});
 assert(r.warnings.some(w=>w.includes('刻度')));assert(/visibility:\s*hidden/.test(r.svg));
 assert.deepEqual(r.geometryBefore,r.geometryAfter);
 report.push({name:'dense-tick-labels',passed:true,geometryUnchanged:true});
});
test('write compatibility report',async()=>{if(process.env.GANTT_REPORT)await fs.writeFile(process.env.GANTT_REPORT,JSON.stringify({engine:'mermaid@11.17.2',fixtures:report},null,2));});
