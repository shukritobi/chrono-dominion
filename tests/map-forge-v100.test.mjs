import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const local=new Map(),localStorage={
  getItem:k=>local.get(k)??null,
  setItem:(k,v)=>local.set(k,String(v)),
  removeItem:k=>local.delete(k)
};
const window={addEventListener(){},localStorage};
const globals={window,localStorage,console};
runInNewContext(read('maps/catalog.js'),globals);
runInNewContext(read('maps/map-core.js'),globals);
const core=window.ChronoMaps;
assert.equal(core.SIZE,34);
const template=window.ChronoMapCatalog.verdant;
const battlefield=core.fromTemplate(template,'Test Battlefield');
assert.equal(battlefield.id,'custom');
assert.equal(battlefield.theme,'verdant');
assert.ok(battlefield.waterTiles.length>10);
assert.ok(core.validate(battlefield).valid,'base map converts to legal custom map');
assert.equal(core.waterAt(battlefield,24,4),true,'converted lake remains present');
assert.equal(core.waterAt(battlefield,5,6),false,'starting HQ is never submerged');
const broken={...battlefield,waterTiles:[[5,6]],ore:[[10,12],[13,15],[18,17],[23,21]]};
assert.equal(core.validate(broken).valid,false,'protects starting HQ');
const duplicate={...battlefield,ore:[[10,12],[10,12],[12,21],[18,17]]};
assert.equal(core.validate(duplicate).valid,false,'duplicate ore is rejected');
const tooSparse={...battlefield,ore:[[10,12],[13,15]]};
assert.equal(core.validate(tooSparse).valid,false,'minimum ore requirement enforced');
assert.ok(core.save(battlefield,localStorage).valid);
assert.equal(core.load(localStorage).name,'Test Battlefield');
const strict={...battlefield,name:'X'};
assert.equal(core.save(strict,localStorage).valid,false);
assert.equal(core.load(localStorage).name,'Test Battlefield','invalid saves do not replace good maps');

const controls=new Map(),canvas2d=new Proxy({},{
  get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}
});
const node=id=>{
  if(!controls.has(id))controls.set(id,{
    id,value:'',width:id==='mapPreview'?272:256,height:id==='mapPreview'?144:190,
    style:{},disabled:false,textContent:'',dataset:{},
    classList:{toggle(){},add(){},remove(){}},querySelectorAll(){return[]},addEventListener(){},
    querySelector(){return{disabled:true,textContent:'Custom Battlefield'}},
    getContext(){return canvas2d},
    getBoundingClientRect(){return{width:id==='world'?1024:256,height:id==='world'?700:190,left:0,top:0}},
    set innerHTML(v){this._html=v},get innerHTML(){return this._html||''}
  });
  return controls.get(id);
};
const document={getElementById:node};
const gameSrc=read('game.js').replace('  new Game();','  window.__game = new Game();');
runInNewContext(gameSrc,{window,document,localStorage,console,performance:{now:()=>0},
  requestAnimationFrame(){},devicePixelRatio:1,setTimeout:()=>1,clearTimeout(){}},{timeout:4000});
const g=window.__game;
assert.equal(window.ChronoDominion.version,'1.5.0');
assert.ok(window.ChronoMapCatalog.custom,'custom map installed into runtime catalog');
g.newMatch({map:'custom',playerFaction:'coalition',enemyFaction:'federation',difficulty:'recruit',startingCredits:5000});
assert.equal(g.settings.map,'custom');
assert.equal(g.water(24,4),true,'custom terrain blocks movement');
assert.equal(g.water(5,6),false);
assert.ok(g.ores.length>=4,'custom map spawns resource fields');
node('mapSelect').value='custom';
g.drawMapPreview();
assert.equal(node('mapDescription').textContent,'Player-designed Chrono Dominion battlefield');
assert.ok(g.saveGame(),'custom map included in a skirmish snapshot');
const save=JSON.parse(localStorage.getItem('chrono-dominion-skirmish-v1'));
assert.equal(save.customMap.name,'Test Battlefield','embedded map survives separately from editor storage');
localStorage.removeItem(core.STORAGE_KEY);
delete window.ChronoMapCatalog.custom;
assert.ok(g.loadGame(),'custom map embedded in save can restore after deletion from Map Forge');
assert.equal(g.settings.map,'custom');
assert.equal(g.water(24,4),true);
const invalid={...save,customMap:{...save.customMap,waterTiles:[[5,6]]}};
delete window.ChronoMapCatalog.custom;
localStorage.setItem('chrono-dominion-skirmish-v1',JSON.stringify(invalid));
assert.equal(g.loadGame(),false,'corrupt custom maps cannot be loaded');
console.log('PASS: Map Forge schema, protected HQ, ore, local persistence, live custom game and save embedding');
