import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__testGame = new Game();');
const storage=new Map();
const localStorage={
  getItem:key=>storage.get(key)??null,
  setItem:(key,value)=>{storage.set(key,String(value));},
  removeItem:key=>{storage.delete(key);}
};
const context=new Proxy({},{get:(t,p)=>t[p]??(()=>{}),set:(t,p,v)=>{t[p]=v;return true;}});
const nodes={};
const document={getElementById(id){return nodes[id]??(nodes[id]={
  value:'',disabled:false,style:{},classList:{add(){},remove(){},toggle(){}},
  getContext(){return context;},addEventListener(){},querySelectorAll(){return[]},
  getBoundingClientRect(){return{width:id==='world'?1024:256,height:id==='world'?720:190,left:0,top:0};},
  set innerHTML(value){this._html=value;},get innerHTML(){return this._html??'';},
  set textContent(value){this._text=value;},get textContent(){return this._text??'';}
});}};
const window={addEventListener(){}};
runInNewContext(source,{
  window,document,localStorage,console,performance:{now:()=>0},requestAnimationFrame(){},
  devicePixelRatio:1,setTimeout:()=>1,clearTimeout(){}
},{timeout:3000});
const game=window.__testGame;
const settings={playerFaction:'coalition',enemyFaction:'psionic',map:'snow',difficulty:'standard'};
game.newMatch(settings);
assert.equal(nodes.loadMain.disabled,true,'load is disabled before saving');
const tank=game.entities.find(e=>e.owner===0&&e.kind==='tank');
const troops=game.entities.filter(e=>e.owner===0&&['tank','soldier'].includes(e.kind));
game.selected=troops.map(e=>e.id);
game.command({gx:15,gy:15},{shiftKey:false});
const orders=troops.map(e=>e.order);
assert.equal(new Set(orders.map(o=>o.x+','+o.y)).size,troops.length,'formation creates unique slots');
assert.ok(orders.every(o=>game.walkable(o.x,o.y)),'all assigned formation positions are traversable');
const credits=game.players[0].credits=3777;
game.fog[1][1].seen=true;
game.time=45.25;
const beforeId=tank.id;
assert.ok(game.saveGame(),'save writes a snapshot');
assert.equal(nodes.loadMain.disabled,false,'load menu is enabled');
const snapshot=JSON.parse([...storage.values()][0]);
assert.equal(snapshot.version,1);
game.players[0].credits=100;game.entities=[];game.settings.map='desert';
assert.ok(game.loadGame(),'load succeeds');
assert.equal(game.players[0].credits,credits,'credits restored');
assert.equal(game.settings.map,'snow','map restored');
assert.equal(game.time,45.25,'elapsed time restored');
assert.ok(game.entities.find(e=>e.id===beforeId),'unit restored');
assert.ok(game.fog[1][1].seen,'discovered fog restored');
assert.equal(game.state,'playing');
assert.equal(nodes.loadMain.disabled,false);
// Invalid or incompatible data must not overwrite the current match.
const current=game.players[0].credits;
storage.set('chrono-dominion-skirmish-v1','{bad json');
assert.equal(game.loadGame(),false);
assert.equal(game.players[0].credits,current,'bad snapshot cannot destroy current match');
storage.set('chrono-dominion-skirmish-v1',JSON.stringify({...snapshot,version:99}));
assert.equal(game.loadGame(),false,'incompatible version rejected');
// Placement rejects a footprint touching the pond even when the centre is dry.
game.entities=[{id:1,owner:0,type:'building',kind:'hq',built:true,hp:1300,maxHp:1300,x:18,y:5}];
assert.equal(game.water(22,5),false);
assert.equal(game.water(23,5),true);
assert.equal(game.canPlace(22,5,0),false,'3x3 footprint rejects water at the edge');
game.draw();
console.log('PASS: versioned save/load, corrupt save handling, formation uniqueness, footprint water collision, rendering');
