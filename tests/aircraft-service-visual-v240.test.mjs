import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const noop=()=>{};
const drawing=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',disabled:false,style:{},dataset:{},
    classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
    addEventListener:noop,setAttribute:noop,querySelectorAll:()=>[],
    querySelector:()=>({disabled:true,textContent:''}),
    getContext:()=>drawing,setPointerCapture:noop,
    getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
    set innerHTML(v){this._html=v},get innerHTML(){return this._html||''},
    set textContent(v){this._text=v},get textContent(){return this._text||''}
  });return nodes.get(id);
}};
const window={addEventListener:noop};
const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
runInNewContext(read('maps/catalog.js'),{window,console},{timeout:1000});
runInNewContext(read('game.js').replace('  new Game();','  window.__game=new Game();'),{
  window,document,console,localStorage,performance:{now:()=>0},
  devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop
},{timeout:10000});
const g=window.__game;
g.newMatch({playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000});
const pad=g.add(0,'airfield',10,10),plane=g.add(0,'aircraft',10.8,10);
plane.rearming=true;plane.rearmPadId=pad.id;plane.ammo=0;
const visuals=[];
window.ChronoBakedArt={drawUnit(_ctx,e,options){if(e===plane)visuals.push(options.service);return true;}};
g.time=10;g.drawUnit(plane);
assert.equal(visuals.at(-1).blend,0);
assert.equal(visuals.at(-1).docked,true);
for(let i=0;i<14;i++){g.time+=.1;g.drawUnit(plane);}
assert.ok(visuals.at(-1).blend>.99,'aircraft descends gradually while docked');
plane.rearming=false;
for(let i=0;i<10;i++){g.time+=.1;g.drawUnit(plane);}
assert.equal(visuals.at(-1).blend,0,'aircraft ascends after release');
plane.rearming=true;plane.rearmPadId=pad.id;plane.x=pad.x+6;
g.time+=.1;g.drawUnit(plane);
assert.equal(visuals.at(-1).docked,false,'return flight is not mistaken for landing');
plane.x=pad.x+.5;pad.hp=0;
g.time+=.1;g.drawUnit(plane);
assert.equal(visuals.at(-1).docked,false,'destroyed airfields cannot show servicing');
pad.hp=pad.maxHp;plane.rearming=false;
assert.equal(g.saveGame(),true);
const saved=JSON.parse(storage.get('chrono-dominion-skirmish-v1'));
assert.ok(!Object.hasOwn(saved.entities.find(e=>e.id===plane.id),'airServiceVisual'),
  'visual interpolation never enters browser saves');
assert.equal(g.loadGame(),true);
assert.equal(window.ChronoDominion.version,'2.41.0');

// Baked Blender aircraft lower on the screen without shifting ground units.
const entries={coalition:{
  aircraft:{file:'coalition-aircraft.png',directions:8,states:{idle:1,move:2,attack:1},pivot:[80,141]},
  soldier:{file:'coalition-soldier.png',directions:8,states:{idle:1,move:2,attack:1},pivot:[80,141]}
}};
class FakeImage{
  set src(_url){this.naturalWidth=1280;this.naturalHeight=640;this.onload?.();}
}
const artWindow={Image:FakeImage,fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve({
  format:'chrono-blender-v1',frameSize:160,entries})})};
runInNewContext(read('art/baked-atlas-loader.js'),{window:artWindow,console},{timeout:3000});
await new Promise(resolve=>setImmediate(resolve));
const calls=[],ctx={drawImage(...args){calls.push(args);}};
const craft={kind:'aircraft',type:'unit',id:500,x:5,y:5,worldHeading:0,ready:0};
assert.equal(artWindow.ChronoBakedArt.drawUnit(ctx,craft,{faction:'coalition',time:1,service:{blend:0}}),true);
const airborneY=calls.at(-1)[6];
artWindow.ChronoBakedArt.drawUnit(ctx,craft,{faction:'coalition',time:1.1,service:{blend:1}});
assert.equal(calls.at(-1)[6]-airborneY,43,'baked sprite descends by 43 pixels');
const infantry={...craft,id:501,kind:'soldier'};
artWindow.ChronoBakedArt.drawUnit(ctx,infantry,{faction:'coalition',time:1,service:{blend:1}});
const infantryY=calls.at(-1)[6];
artWindow.ChronoBakedArt.drawUnit(ctx,infantry,{faction:'coalition',time:1.1,service:{blend:0}});
assert.equal(calls.at(-1)[6],infantryY,'landing transform never affects infantry');

// Original vector aircraft also lower their altitude, with no external assets.
const animatedWindow={};
runInNewContext(read('art/animated-entities.js'),{window:animatedWindow,console},{timeout:3000});
const translations=[];
const vector=new Proxy({
  translate(x,y){translations.push([x,y]);},
  createRadialGradient(){return {addColorStop:noop};}
},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const vectorCraft={...craft,id:600,hp:220,maxHp:220,engaging:false};
assert.equal(animatedWindow.ChronoAnimatedArt.drawUnit(vector,vectorCraft,
  {faction:'coalition',time:2,service:{blend:0}}),true);
const flightY=translations.at(-1)[1];
animatedWindow.ChronoAnimatedArt.drawUnit(vector,vectorCraft,
  {faction:'coalition',time:2,service:{blend:1}});
assert.ok(translations.at(-1)[1]-flightY>40,
  'vector aircraft descends and deploys landing gear');
console.log('v2.40 aircraft touchdown, takeoff, baked/vector rendering and saves passed');
