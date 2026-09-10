import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {findTaskLine,patchTask} from '../dist/source-edit.mjs';
const app=(await fs.readFile(new URL('../dist/app.mjs',import.meta.url),'utf8')).replace(/^import .*\n/gm,'');
function harness(){
 const nodes=new Map(),events=new Map(),timers=new Map(),messages=[];let next=0;
 class Element{
  value='';checked=false;disabled=false;hidden=false;textContent='';className='';style={};listeners={};files=[];
  parentElement={firstChild:{textContent:'设置'}};
  classList={contains:name=>this.className===name};
  replaceChildren(){} append(){} setAttribute(){} showModal(){} close(){}
  addEventListener(type,fn){this.listeners[type]=fn;}setRangeText(){}remove(){}click(){}
 }
 const defaults={mode:'styled',width:'2560',aspect:'',font:'23',row:'27',release:'2026-10-15',dates:'',today:'','note-label':'求助',note:'',scale:'1',zoom:'fit',source:''};
 for(const id of ['task-overlay','task-close','task-cancel','task-form','undo-visual','source','engine','notice','lines','line-count','svg','png','preview','empty','size','summary','paper','refresh','save-source','file','sample',...Object.keys(defaults)]){const el=new Element();el.value=defaults[id]??'';nodes.set(id,el);}
 nodes.get('dates').checked=true;nodes.get('engine').contentWindow={postMessage:data=>messages.push(data)};
 const win={addEventListener:(type,fn)=>events.set(type,fn)};
 const context=vm.createContext({installWorkspaceUI:()=>{},installPreviewZoom:()=>{},findTaskLine,patchTask,document:{getElementById:id=>nodes.get(id),fonts:{ready:Promise.resolve()},body:{append(){}},createElement:()=>new Element()},window:win,location:{origin:'http://localhost'},URL,Blob,Intl,Date,Number,String,Array,Object,Promise,Error,console,confirm:()=>true,fetch:async()=>({ok:true,text:async()=> 'gantt\n section A\nTask :a, 2026-09-01, 1d'}),setTimeout:fn=>{const id=++next;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),setInterval,clearInterval});
 const run=()=>vm.runInContext(`(async()=>{${app}\n})()`,context);
 const emit=data=>events.get('message')({origin:'http://localhost',source:nodes.get('engine').contentWindow,data});
 const flush=()=>{const snapshot=[...timers.entries()];for(const [id,fn]of snapshot){timers.delete(id);fn();}};
 return {nodes,messages,run,emit,flush};
}
test('editing queues current source and rejects stale renders',async()=>{
 const h=harness();await h.run();h.emit({type:'ready'});
 let request=h.messages.filter(m=>m.type==='render').at(-1);assert.ok(request.source.startsWith('gantt'));assert.equal(request.options.width,2560);
 h.nodes.get('source').value='gantt\n section B\nChanged :b, 2026-09-02, 2d';h.nodes.get('source').listeners.input();assert.equal(h.nodes.get('svg').disabled,true);
 h.emit({type:'rendered',id:request.id,result:{}});request=h.messages.filter(m=>m.type==='render').at(-1);assert.match(request.source,/Changed/);
 h.emit({type:'rendered',id:request.id,result:{svg:'<svg xmlns="http://www.w3.org/2000/svg"/>',width:2560,height:500,kind:'gantt',taskCount:1,laneCount:1,warnings:[]}});
 assert.equal(h.nodes.get('svg').disabled,false);assert.equal(h.nodes.get('preview').hidden,false);assert.match(h.nodes.get('summary').textContent,/1 个泳道/);
 h.nodes.get('source').value='invalid';h.nodes.get('source').listeners.input();h.flush();request=h.messages.filter(m=>m.type==='render').at(-1);
 h.emit({type:'rendered',id:request.id,error:'Parse error'});assert.equal(h.nodes.get('png').disabled,true);assert.equal(h.nodes.get('preview').hidden,false);assert.match(h.nodes.get('notice').textContent,/Parse error/);
 h.nodes.get('source').value='gantt\n section A\nFixed :a, 2026-09-01, 1d';h.nodes.get('source').listeners.input();h.flush();request=h.messages.filter(m=>m.type==='render').at(-1);
 h.emit({type:'rendered',id:request.id,result:{svg:'<svg/>',width:2560,height:500,kind:'gantt',taskCount:1,laneCount:1,warnings:[]}});assert.equal(h.nodes.get('svg').disabled,false);
});
test('invalid canvas settings stop dispatch with a useful error',async()=>{
 const h=harness();await h.run();h.nodes.get('width').value='20';h.emit({type:'ready'});assert.equal(h.messages.filter(m=>m.type==='render').length,0);assert.match(h.nodes.get('notice').textContent,/720/);
});
test('static entrypoints resolve and CLI lane adapter is unchanged',async()=>{
 const dist=new URL('../dist/',import.meta.url);
 for(const page of ['index.html','renderer.html']){
  const html=await fs.readFile(new URL(page,dist),'utf8');
  for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){assert.ok((await fs.stat(new URL(match[1],dist))).isFile(),match[1]);}
 }
 const actual=await fs.readFile(new URL('browser-render.mjs',dist),'utf8');
 const expected=await fs.readFile(new URL('../../renderer/browser-render.mjs',import.meta.url),'utf8');
 assert.equal(actual,expected);
 assert.match(actual,/data-lane-boundary/);
});
