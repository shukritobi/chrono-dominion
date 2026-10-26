import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const js=readFileSync(new URL('../game.js',import.meta.url),'utf8')
 .replace('  new Game();','  window.__game=new Game();');
const context=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),store=new Map();
const document={getElementById(id){
 if(!nodes.has(id))nodes.set(id,{
   value:'',disabled:false,style:{},classList:{add(){},remove(){},toggle(){}},
   setAttribute(){},addEventListener(){},querySelectorAll(){return[];},
   querySelector(){return{disabled:true,textContent:''}},
   getContext(){return context},
   getBoundingClientRect(){return{left:0,top:0,width:id==='world'?1024:272,height:id==='world'?700:144}},
   set innerHTML(x){this._h=x},get innerHTML(){return this._h||''},
   set textContent(x){this._t=x},get textContent(){return this._t||''}
 });return nodes.get(id);
}};
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))};
const window={addEventListener(){}};
runInNewContext(js,{window,document,localStorage,console,performance:{now:()=>0},
 setTimeout(){return 1;},clearTimeout(){},requestAnimationFrame(){},devicePixelRatio:1},{timeout:5000});
const g=window.__game;
const settings={playerFaction:'coalition',enemyFaction:'federation',map:'verdant',
  difficulty:'standard',startingCredits:5000};
g.newMatch(settings);
const unexplored=(x,y)=>!g.fog[x][y].seen;
assert.ok(unexplored(28,27),'enemy starting area begins concealed');
g.fog[28][27].seen=true;
g.fog[28][27].visible=true;
g.newMatch({...settings,map:'snow'});
assert.ok(unexplored(28,27),'new skirmish must reset previously explored enemy HQ');
assert.equal(g.fog.length,34);
assert.equal(g.fog.every(row=>row.length===34),true);
g.newMatch({...settings,map:'desert'});
assert.ok(unexplored(28,27),'map switch must not leak old reconnaissance');

const enemyHQ=g.entities.find(e=>e.owner===1&&e.kind==='hq');
const hidden=g.add(0,'soldier',15,18);
const visible=g.add(0,'soldier',enemyHQ.x-3,enemyHQ.y);
assert.ok(!g.sideCanSee(1,hidden),'test hostile is outside all enemy sensors');
assert.ok(g.sideCanSee(1,visible),'test raider can be seen next to enemy base');
let leaks=0,checks=0;
const original=g.nearest.bind(g);
g.nearest=(source,predicate,range)=>{
 if(source===enemyHQ){
   checks++;
   if(predicate(hidden))leaks++;
 }
 return original(source,predicate,range);
};
g.time=90;
g.runAI();
assert.ok(checks>0,'AI evaluated defense placement from its HQ');
assert.equal(leaks,0,'defense planning cannot target unobserved units');
assert.ok(g.entities.filter(e=>e.owner===1&&e.kind==='turret').length>0,
 'visible threat leads to a defensive turret construction when credits permit');
// New fog history and current match are still saved correctly.
assert.ok(g.saveGame());
assert.ok(g.loadGame());
assert.ok(!g.fog[28][27].seen || g.fog[28][27].visible,
 'loaded fog must be internally consistent');
console.log('PASS: restart clears explored fog on each map, defensive placement respects AI sight, save/load');
