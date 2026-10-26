import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../art/baked-atlas-loader.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.ok(html.includes('./art/baked-atlas-loader.js'));
assert.ok(html.indexOf('baked-atlas-loader.js')<html.indexOf('./game.js'));

const sprites={
  coalition:{
    soldier:{file:'coalition-soldier.png',directions:8,
      states:{idle:1,move:2,attack:1},pivot:[80,141]},
    generator:{file:'coalition-generator.png',directions:1,
      states:{idle:2,construct:2,damaged:1},pivot:[80,141]}
  }
};
let requested=0;
class FakeImage{
  constructor(){this.naturalWidth=0;this.naturalHeight=0;}
  set src(url){
    if(url.includes('-soldier.png')){this.naturalWidth=1280;this.naturalHeight=640;}
    else{this.naturalWidth=160;this.naturalHeight=800;}
    this.onload?.();
  }
}
const window={
  Image:FakeImage,
  fetch:()=>{requested++;return Promise.resolve({ok:true,json:()=>
    Promise.resolve({format:'chrono-blender-v1',frameSize:160,entries:sprites})});}
};
runInNewContext(source,{window,console},{timeout:3000});
const art=window.ChronoBakedArt;
assert.equal(art.version,'1.0.0');
assert.equal(art.readyCount,0,'fallback until image is ready');
assert.equal(art.drawUnit({drawImage(){}},{kind:'soldier'},
  {faction:'coalition'}),false);
await new Promise(resolve=>setImmediate(resolve));
assert.equal(requested,1);
assert.equal(art.readyCount,2);
art.load();assert.equal(requested,1,'idempotent load');
const calls=[];
const c={drawImage(...args){calls.push(args);}};
const soldier={id:3,kind:'soldier',type:'unit',x:2,y:2,hp:70,maxHp:100,
  worldHeading:Math.PI/2,engaging:false,ready:0};
assert.equal(art.drawUnit(c,soldier,{faction:'coalition',time:1}),true);
assert.equal(calls.at(-1)[1],2*160,'quarter-turn direction');
assert.equal(calls.at(-1)[2],0,'idle frame row');
soldier.x=2.5;
assert.equal(art.drawUnit(c,soldier,{faction:'coalition',time:1.20}),true);
assert.ok([160,320].includes(calls.at(-1)[2]),'walk animation rows');
soldier.engaging=true;soldier.ready=.9;
assert.equal(art.drawUnit(c,soldier,{faction:'coalition',time:1.3}),true);
assert.equal(calls.at(-1)[2],480,'attack row');
const base={id:8,kind:'generator',type:'building',x:4,y:4,
  built:false,construction:.6,hp:500,maxHp:500};
assert.equal(art.drawBuilding(c,base,{faction:'coalition',time:2}),true);
assert.equal(calls.at(-1)[2],480,'construction row with progress');
base.built=true;base.hp=160;
assert.equal(art.drawBuilding(c,base,{faction:'coalition',time:2}),true);
assert.equal(calls.at(-1)[2],640,'damaged row');
assert.equal(art.drawUnit(c,{kind:'unknown'}, {faction:'coalition'}),false);
assert.equal(art.suitable({format:'not-valid',frameSize:160,entries:{}}),false);
console.log('PASS: Blender sprite atlas decoding, direction, firing, walk, construction, damage, fallback');
