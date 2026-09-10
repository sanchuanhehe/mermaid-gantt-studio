import test from 'node:test';
import assert from 'node:assert/strict';
import {installPreviewZoom} from '../dist/preview-zoom.mjs';
test('wheel zoom retains pointer position, respects scroll mode and clamps size',()=>{
 const handlers={},viewport={clientHeight:500,clientWidth:800,scrollLeft:0,scrollTop:0,getBoundingClientRect:()=>({left:0,top:0}),addEventListener:(name,fn)=>handlers[name]=fn};
 const paper={style:{width:'1000px'},getBoundingClientRect:()=>({left:24-viewport.scrollLeft,top:24-viewport.scrollTop,width:parseFloat(paper.style.width),height:parseFloat(paper.style.width)/2})};
 const option={value:'',textContent:''},select={querySelector:()=>option},wheelToggle={checked:false};
 const api=installPreviewZoom({viewport,paper,select,wheelToggle,getWidth:()=>1000});let prevented=false;
 const event={deltaY:-40,deltaMode:0,clientX:324,clientY:174,preventDefault:()=>prevented=true};
 handlers.wheel(event);assert.equal(prevented,false);assert.equal(api.current(),1);
 handlers.wheel({...event,ctrlKey:true});assert.equal(prevented,true);assert.ok(api.current()>1);
 const rect=paper.getBoundingClientRect();assert.ok(Math.abs(rect.left+.3*rect.width-324)<.01);assert.ok(Math.abs(rect.top+.3*rect.height-174)<.01);
 api.zoomTo(100,324,174);assert.equal(api.current(),4);api.zoomTo(.001,324,174);assert.equal(api.current(),.05);
 wheelToggle.checked=true;handlers.wheel(event);assert.ok(api.current()>.05);
 handlers.gesturestart(event);const start=api.current();handlers.gesturechange({...event,scale:2});assert.ok(Math.abs(api.current()-start*2)<.002);handlers.gestureend(event);
});
