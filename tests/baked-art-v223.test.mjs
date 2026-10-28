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



// Full 32-facing authored tanks must retain the correct frame selection in-game.
const tankSprite={coalition:{tank:{file:'coalition-tank.png',directions:32,
  states:{idle:1,move:1,attack:1,destroyed:1},pivot:[80,141]}}};
class TankImage{
  set src(_url){this.naturalWidth=5120;this.naturalHeight=640;this.onload?.();}
}
const tankWindow={Image:TankImage,fetch:()=>Promise.resolve({ok:true,json:()=>
  Promise.resolve({format:'chrono-blender-v1',frameSize:160,entries:tankSprite})})};
runInNewContext(source,{window:tankWindow,console},{timeout:3000});
await new Promise(resolve=>setImmediate(resolve));
const tankCalls=[];
const tankEntity={id:140,kind:'tank',type:'unit',x:0,y:0,hp:100,maxHp:100,
  worldHeading:Math.PI/2,engaging:false,ready:0};
assert.equal(tankWindow.ChronoBakedArt.drawUnit({drawImage(...xs){tankCalls.push(xs);}},
  tankEntity,{faction:'coalition',time:1}),true);
assert.equal(tankCalls.at(-1)[1],8*160,'quarter-turn must index 8/32 atlas columns');
tankEntity.engaging=true;tankEntity.ready=1;
tankWindow.ChronoBakedArt.drawUnit({drawImage(...xs){tankCalls.push(xs);}},
  tankEntity,{faction:'coalition',time:2});
assert.equal(tankCalls.at(-1)[2],2*160,'tank attacks use authored attack state');

// Production acceptance: test the actual published manifest and PNG IHDRs,
// not only the two synthetic sprites above. A missing, wrong-size or
// cross-faction atlas would otherwise silently fall back to vector artwork.
const published=JSON.parse(readFileSync(new URL('../art/baked-v1/manifest.json',import.meta.url),'utf8'));
const factions=['coalition','federation','psionic'];
const expectedKinds=['soldier','specialist','heavy','aircraft','generator','factory',
  'radar','hq','refinery','barracks','tech','turret','beam','airfield'];
const vehicleKinds=['tank','recon','harvester'];
const releasedVehicleCount=factions.reduce((n,faction)=>n+vehicleKinds.filter(
  kind=>Object.hasOwn(published.entries[faction],kind)).length,0);
assert.ok([0,9].includes(releasedVehicleCount),
  'vehicle wave is all-or-nothing across 3 factions and 3 kinds');
const activeKinds=releasedVehicleCount===9?[...expectedKinds,...vehicleKinds]:expectedKinds;
assert.equal(published.format,'chrono-blender-v1');
assert.equal(published.frameSize,160);
assert.deepEqual(Object.keys(published.entries).sort(),factions.slice().sort());
const atlasSizes=new Map();
for(const faction of factions){
  const entries=published.entries[faction];
  assert.deepEqual(Object.keys(entries).sort(),activeKinds.slice().sort(),
    faction+': retain every approved Blender atlas, including complete vehicle wave');
  for(const [kind,spec] of Object.entries(entries)){
    const name=faction+'-'+kind+'.png';
    assert.equal(spec.file,name,'manifest cannot accidentally load another faction or path');
    const directions=kind==='tank'?32:
      ['soldier','specialist','heavy','aircraft','recon','harvester'].includes(kind)?8:1;
    assert.equal(spec.directions,directions,name+': expected Blender facing count');
    if(kind==='tank')assert.deepEqual(spec.states,{idle:1,move:1,attack:1,destroyed:1},
      name+': preserve four real 32-facing tank states');
    const rows=Object.values(spec.states).reduce((sum,count)=>{
      assert.ok(Number.isInteger(count)&&count>0&&count<=12,name+': valid state frames');
      return sum+count;
    },0);
    assert.ok(rows>0,name+': at least one animation frame');
    const width=published.frameSize*spec.directions,height=published.frameSize*rows;
    assert.deepEqual(spec.canvasSize,[width,height],name+': metadata must match packed frames');
    assert.ok(Array.isArray(spec.pivot)&&spec.pivot.length===2&&
      spec.pivot.every(n=>Number.isFinite(n)&&n>=0&&n<=published.frameSize),
      name+': pivot must be within one sprite cell');
    const bytes=readFileSync(new URL('../art/baked-v1/'+name,import.meta.url));
    assert.ok(bytes.length>33,name+': atlas is not empty');
    assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',
      name+': valid PNG signature');
    assert.equal(bytes.toString('ascii',12,16),'IHDR',name+': PNG header exists');
    assert.equal(bytes.readUInt32BE(16),width,name+': actual PNG width');
    assert.equal(bytes.readUInt32BE(20),height,name+': actual PNG height');
    assert.equal(bytes[24],8,name+': 8-bit pixels');
    assert.equal(bytes[25],6,name+': transparent RGBA pixels');
    atlasSizes.set(name,{width,height});
  }
}
assert.equal(atlasSizes.size,42+releasedVehicleCount,
  'all published atlases must be checked without allowing partial releases');

// Exercise the runtime loader against the real manifest and actual PNG
// dimensions, while leaving browser decoding to the browser.
class PublishedImage{
  set src(url){
    const size=atlasSizes.get(url.split('/').at(-1));
    if(!size){this.onerror?.();return;}
    this.naturalWidth=size.width;this.naturalHeight=size.height;
    this.onload?.();
  }
}
const publishedWindow={
  Image:PublishedImage,
  fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve(published)})
};
runInNewContext(source,{window:publishedWindow,console},{timeout:3000});
await new Promise(resolve=>setImmediate(resolve));
assert.equal(publishedWindow.ChronoBakedArt.readyCount,42+releasedVehicleCount,
  'every published original Blender atlas should become renderable');
let drawn=0;
for(const faction of factions)for(const [kind,spec] of Object.entries(published.entries[faction])){
  const entity={id:++drawn,kind,type:spec.directions===1?'building':'unit',
    x:3,y:4,hp:100,maxHp:100,built:true,construction:1,worldHeading:0};
  const render=spec.directions===1?publishedWindow.ChronoBakedArt.drawBuilding:
    publishedWindow.ChronoBakedArt.drawUnit;
  assert.equal(render({drawImage(){}},entity,{faction,time:2}),true,
    faction+'/'+kind+': published atlas must be drawable');
}
console.log('PASS: all '+(42+releasedVehicleCount)+
  ' published Blender PNG atlases match manifest dimensions, factions and runtime loader');
