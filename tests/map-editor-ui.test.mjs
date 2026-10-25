import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const load=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const events=new Map(),memory=new Map();
const localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v))};
const gfx=new Proxy({}, {get:(x,k)=>x[k]??(()=>{}),set:(x,k,v)=>{x[k]=v;return true;}});
const elements=new Map();
function el(id){
  if(!elements.has(id))elements.set(id,{
    id,value:'',textContent:'',dataset:{},style:{},width:680,height:680,
    classList:{toggle(){},add(){},remove(){}},setAttribute(name,value){this[name]=value;},
    getContext(){return gfx;},
    getBoundingClientRect(){return {left:0,top:0,width:680,height:680};},
    setPointerCapture(){},
    addEventListener(type,fn){events.set(id+':'+type,fn)},
    querySelectorAll(){return []},
    click(){},
  });
  return elements.get(id);
}
const document={getElementById:el};
const window={document,localStorage,location:{href:'./map-editor.html'}};
const vars={window,document,console,localStorage,setTimeout:()=>1,clearTimeout(){}};
runInNewContext(load('maps/catalog.js'),vars);
runInNewContext(load('maps/map-core.js'),vars);
el('mapName').value='Player Canyon';
el('mapTheme').value='verdant';
el('template').value='verdant';
runInNewContext(load('maps/map-editor.js'),vars);
const fire=(id,type,event={})=>{
  const fn=events.get(id+':'+type);assert.ok(fn,'event handler exists: '+id+':'+type);fn(event);
};
const point=(x,y)=>({clientX:(x+.5)*20,clientY:(y+.5)*20,pointerId:1,preventDefault(){}});
let original=window.ChronoMaps.fromTemplate(window.ChronoMapCatalog.verdant,'My Battlefield');
const originalCount=original.waterTiles.length;
fire('editorCanvas','pointerdown',point(16,16));
fire('editorCanvas','pointerup');
fire('saveMap','click');
let saved=window.ChronoMaps.load(localStorage);
assert.ok(saved,'Save button wrote a valid map');
assert.equal(saved.waterTiles.length,originalCount+1,'pointerdown painted a new water tile');
assert.equal(window.ChronoMaps.waterAt(saved,16,16),true);
assert.equal(el('waterCount').textContent,String(saved.waterTiles.length));
fire('tools','click',{target:{closest(){return {dataset:{tool:'ore'}};}}});
fire('editorCanvas','pointerdown',point(16,16));
fire('editorCanvas','pointerup');
fire('saveMap','click');
saved=window.ChronoMaps.load(localStorage);
assert.equal(saved.waterTiles.length,originalCount,'ore brush clears water first');
assert.ok(saved.ore.some(([x,y])=>x===16&&y===16),'ore brush adds resource deposit');
assert.equal(el('status').textContent.includes('saved'),true);
fire('tools','click',{target:{closest(){return {dataset:{tool:'water'}};}}});
fire('editorCanvas','pointerdown',point(5,6));
fire('editorCanvas','pointerup');
fire('saveMap','click');
saved=window.ChronoMaps.load(localStorage);
assert.equal(window.ChronoMaps.waterAt(saved,5,6),false,'HQ area is protected from paint');
fire('playMap','click');
assert.equal(window.location.href,'./index.html?map=custom','Save & Play launches the authored skirmish');
console.log('PASS: editor paint/touch events, ore replacement, protected bases, save, and Save & Play');
