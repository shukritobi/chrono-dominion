import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const noop=()=>{},drawing=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',disabled:false,style:{},dataset:{},
    classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
    addEventListener:noop,setAttribute:noop,querySelectorAll:()=>[],
    querySelector:()=>({disabled:true,textContent:''}),
    getContext:()=>drawing,setPointerCapture:noop,
    getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
    set innerHTML(v){this._html=v;},get innerHTML(){return this._html||'';},
    set textContent(v){this._text=v;},get textContent(){return this._text||'';}
  });return nodes.get(id);
}};
const window={addEventListener:noop};
const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
runInNewContext(read('maps/catalog.js'),{window,console},{timeout:1000});
runInNewContext(read('game.js').replace('  new Game();','  window.__game=new Game();'),{
  window,document,localStorage,console,performance:{now:()=>0},
  devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop
},{timeout:10000});
const g=window.__game;
assert.equal(window.ChronoDominion.version,'2.42.0');
const setup=()=>{
  g.newMatch({playerFaction:'coalition',enemyFaction:'federation',
    map:'verdant',difficulty:'standard',startingCredits:5000});
  for(let i=0;i<4;i++)g.add(1,'generator',17+i,19);
  g.add(1,'factory',21,23);g.add(1,'radar',22,21);
  g.add(1,'tech',19,22);g.add(1,'airfield',23,20);
  g.add(1,'turret',19,20);g.add(1,'turret',20,21);
  g.time=150;g.players[1].credits=9000;
  g.canPlace=()=>true; // Isolate AI strategy from placement geometry.
  assert.equal(g.power(1).low,false);
};
const batteries=()=>g.entities.filter(e=>e.owner===1&&e.kind==='flak'&&e.hp>0);
const report=(id,time=g.time)=>({id,kind:'aircraft',type:'unit',x:6,y:6,time});
setup();
const a=g.add(0,'aircraft',6,6),b=g.add(0,'aircraft',7,6);
g.runAI();
assert.equal(batteries().length,0,'unseen planes cannot trigger defenses');
g.intel[1].push(report(a.id),report(a.id));
g.runAI();
assert.equal(batteries().length,1,'one unique sighting warrants one Skyguard');
g.runAI();
assert.equal(batteries().length,1,'duplicate reports cannot inflate the count');
g.intel[1].push(report(b.id));
g.runAI();
assert.equal(batteries().length,2,'observed wing triggers second Skyguard');
assert.ok(batteries().every(e=>!e.built),'normal construction is used');
g.runAI();
assert.equal(batteries().length,2,'unfinished batteries count toward the cap');
assert.equal(g.power(1).low,false,'base has sufficient power for two batteries');
assert.ok(g.saveGame()&&g.loadGame(),'existing save format remains valid');
assert.equal(batteries().length,2,'defenses persist across save/load');

setup();
const stale=g.add(0,'aircraft',6,6);
g.intel[1].push(report(stale.id,g.time-29));
g.runAI();
assert.equal(batteries().length,0,'stale intelligence cannot trigger defense');
g.intel[1].push(report(stale.id,g.time+1));
g.runAI();
assert.equal(batteries().length,0,'future reports cannot trigger defense');

setup();
const single=g.add(0,'aircraft',6,6);
g.intel[1].push(report(single.id),{...report(single.id+100),type:'building'});
g.runAI();
assert.equal(batteries().length,1,'non-aircraft reports do not increase the cap');

setup();
const low=g.add(0,'aircraft',6,6);
g.intel[1].push(report(low.id));g.players[1].credits=1200;
g.runAI();
assert.equal(batteries().length,0,'the 500-credit reserve is preserved');
console.log('PASS: v2.42 observed-air-wing Skyguard scaling, cap, budget, power and save/load');
