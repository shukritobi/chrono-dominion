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
  map:'expanse',difficulty:'standard',startingCredits:5000});
assert.equal(g.worldSize,48);
const scout=g.add(0,'recon',24,24);
const enemy=g.add(1,'soldier',32.95,24.95);
const incomplete=g.add(0,'radar',38,18,false);
const enemyRadar=g.add(1,'radar',40,30);
g.updateFog();
assert.equal(g.fog[38][18].seen,false,
  'an unfinished friendly structure cannot explore distant terrain');
assert.equal(g.sideCanSee(0,incomplete),false,
  'unfinished structures are also excluded from live sensor detection');
assert.equal(g.fog[40][30].visible,false,
  'enemy structures cannot reveal terrain for the player');
assert.equal(g.isVisible(enemy.x,enemy.y),true,
  'edge case: integer fog tile is lit by a scout');
assert.equal(g.sideCanSee(0,enemy),false,
  'actual enemy position lies outside the scout sensor radius');
assert.equal(g.playerCanSeeEntity(enemy),false,
  'a visible tile alone must not expose the enemy entity');
assert.equal(g.pick(enemy.x,enemy.y),null,
  'hidden edge-of-sight enemy cannot be clicked or manually targeted');

const drawn=[];
const oldDrawUnit=g.drawUnit,oldDrawBuilding=g.drawBuilding;
g.drawUnit=e=>drawn.push(e.id);g.drawBuilding=()=>{};
g.draw();
assert.equal(drawn.includes(enemy.id),false,
  'hidden enemy must not be drawn on the battlefield');
g.drawUnit=oldDrawUnit;g.drawBuilding=oldDrawBuilding;

const redBlips=[];
const radarContext=new Proxy({fillStyle:'',fillRect(x,y,w,h){
  if(this.fillStyle==='#ed7e6a')redBlips.push({x,y,w,h});
}},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
g.rctx=radarContext;
g.drawRadar();
assert.equal(redBlips.length,0,
  'radar must not leak hidden edge-of-sight enemy positions');

scout.x=29;scout.y=25;g.updateFog();
assert.equal(g.sideCanSee(0,enemy),true);
assert.equal(g.playerCanSeeEntity(enemy),true);
assert.equal(g.pick(enemy.x,enemy.y)?.id,enemy.id,
  'enemy becomes selectable when actual friendly sensors detect it');
drawn.length=0;g.drawUnit=e=>drawn.push(e.id);g.drawBuilding=()=>{};
g.draw();
assert.ok(drawn.includes(enemy.id),'detected enemy is drawn');
redBlips.length=0;g.drawRadar();
assert.ok(redBlips.length>0,'detected enemy appears on radar');

incomplete.built=true;g.updateFog();
assert.equal(g.fog[38][18].visible,true,
  'completed friendly buildings contribute exploration');
incomplete.hp=0;g.updateFog();
assert.equal(g.fog[38][18].visible,false,
  'destroyed structures stop granting live vision');
assert.equal(g.fog[38][18].seen,true,
  'explored terrain remains remembered after sensor loss');

assert.equal(g.saveGame(),true);
assert.equal(g.loadGame(),true);
assert.equal(g.fog[38][18].seen,true,
  'historical explored terrain survives a save round-trip');
assert.equal(g.fog[38][18].visible,false,
  'dead sensors cannot restore live visibility on load');
assert.equal(g.playerCanSeeEntity(g.entityById(enemy.id)),true);
assert.equal(window.ChronoDominion.version,'2.42.0');
console.log('v2.41 construction sensors, edge-of-fog entity/radar visibility and saves passed');
