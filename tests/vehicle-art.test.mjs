import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const art = readFileSync(new URL('../art/vehicle-renderer.js', import.meta.url), 'utf8');
const gameSource = readFileSync(new URL('../game.js', import.meta.url), 'utf8').replace('  new Game();','  window.__gameUnderTest = new Game();');
let drawn = 0, filled = 0;
const ctx = new Proxy({}, {get(t,key){
  if(key==='drawImage')return () => {drawn++;};
  if(key==='fill')return () => {filled++;};
  return t[key] ?? (()=>{});
},set(t,k,value){t[k]=value;return true;}});
const els = new Map(), created=[];
const doc = {
  createElement(tag) {
    assert.equal(tag, 'canvas');
    const canvas={width:0,height:0,getContext:()=>ctx};created.push(canvas);return canvas;
  },
  getElementById(id){
    if(!els.has(id))els.set(id,{
      style:{},classList:{toggle(){},add(){},remove(){}},
      getContext:()=>ctx,addEventListener(){},querySelectorAll(){return []},
      getBoundingClientRect(){return {width:id==='world'?1050:256,height:id==='world'?740:190,left:0,top:0};},
      set innerHTML(s){this._html=s;},get innerHTML(){return this._html||'';},
      set textContent(s){this._text=s;},get textContent(){return this._text||'';}
    });
    return els.get(id);
  }
};
const window={document:doc,addEventListener(){}};
const scope={window,document:doc,console,performance:{now:()=>0},requestAnimationFrame(){},devicePixelRatio:1,setTimeout:()=>1,clearTimeout(){},Image:class{constructor(){this.complete=false;this.naturalWidth=0;}}};
runInNewContext(art,scope,{timeout:3000});
const renderer=window.ChronoVehicleArt;
assert.equal(renderer.frameCount,32);
assert.equal(renderer.frameIndex(0),0);
assert.equal(renderer.frameIndex(Math.PI/2),8);
assert.equal(renderer.frameIndex(Math.PI),16);
assert.equal(renderer.frameIndex(-Math.PI/2),24);
const atlas=renderer.createAtlases();
assert.deepEqual(Object.keys(atlas),['coalition','federation','psionic']);
assert.equal(created.length,6);
for(const side of Object.values(atlas))for(const sheet of Object.values(side)){
  assert.equal(sheet.width,1024);assert.equal(sheet.height,512);
}
assert.ok(filled>1000,'directional geometry is actually drawn');

runInNewContext(gameSource,scope,{timeout:4000});
const game=window.__gameUnderTest;
assert.ok(game?.vehicleAtlases?.coalition?.hull,'game integrates directional assets');
game.newMatch({playerFaction:'coalition',enemyFaction:'federation',map:'verdant',difficulty:'recruit'});
game.draw();assert.ok(drawn>0,'in-game renderer uses atlas drawImage');
const tank=game.entities.find(e=>e.owner===0&&e.kind==='tank');
assert.ok(tank);
tank.worldHeading=Math.PI/2;tank.turretHeading=Math.PI;
game.draw();
assert.equal(renderer.frameIndex(tank.worldHeading),8);
assert.equal(renderer.frameIndex(tank.turretHeading),16,'independent turret aims separately');
assert.ok(els.get('production').innerHTML.includes('coalition-power.svg'),'production panel loads new faction reactor art');
for(let i=0;i<100;i++)game.step(.05);
game.draw();
console.log('PASS: 32 directional hulls and turrets across 3 factions, frames, in-game rendering and sidebar art');
