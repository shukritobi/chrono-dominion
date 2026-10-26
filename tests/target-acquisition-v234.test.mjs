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
g.time=60;g.nextAI=1e9;g.nextFog=1e9;g.nextUi=1e9;

// Aggressive units search beyond their personal 4.8-tile sensor radius.
// They must not acquire hidden live enemies just because those enemies
// happen to fall inside their larger automatic engagement radius.
const attacker=g.add(0,'heavy',12,19),hidden=g.add(1,'soldier',19,19);
attacker.stance='aggressive';
assert.equal(g.sideCanSee(0,hidden),false,'target starts outside all player sensors');
const start={x:attacker.x,y:attacker.y};
g.step(.05);
assert.equal(attacker.engaging,false,'player cannot automatically lock an unseen target');
assert.equal(attacker.order,null,'hidden target does not create an attack order');
assert.equal(attacker.x,start.x,'no hidden-target chase');

// Shared friendly scouting makes the SAME enemy a legitimate target.
const scout=g.add(0,'recon',17,19);
assert.equal(g.sideCanSee(0,hidden),true,'friendly scout reveals the enemy');
g.step(.05);
assert.equal(attacker.engaging,true,'shared sight enables automatic engagement');
scout.hp=0;
assert.equal(g.sideCanSee(0,hidden),false);
g.step(.05);
assert.equal(attacker.engaging,false,'losing the scout drops the hidden target');

// Attack-move still advances through fog instead of acquiring unseen units.
attacker.order={type:'attackMove',x:26,y:19};
const previousX=attacker.x;
g.step(.05);
assert.equal(attacker.engaging,false,'attack-move cannot auto-track hidden enemies');
assert.ok(attacker.x>previousX,'attack-move keeps moving when no enemy is visible');

// The AI uses exactly the same visibility rule.
const aiAttacker=g.add(1,'heavy',18,11),playerTarget=g.add(0,'soldier',25,11);
aiAttacker.stance='aggressive';
assert.equal(g.sideCanSee(1,playerTarget),false);
g.step(.05);
assert.equal(aiAttacker.engaging,false,'AI also refuses hidden automatic targets');
const aiScout=g.add(1,'recon',23,11);
assert.equal(g.sideCanSee(1,playerTarget),true);
g.step(.05);
assert.equal(aiAttacker.engaging,true,'AI shared sight still works');
aiScout.hp=0;

// Direct manual player attack orders retain their pre-existing behavior.
assert.equal(g.sideCanSee(0,hidden),false);
attacker.order={type:'attack',id:hidden.id};
g.step(.05);
assert.equal(attacker.order?.id,hidden.id,'manual attack orders are not discarded');

// No save schema/key changes, and orders survive round-trip serialization.
assert.equal(g.saveGame(),true);
assert.equal(g.loadGame(),true);
const loaded=g.entityById(attacker.id);
assert.equal(loaded.order?.id,hidden.id,'manual order survives save/load');
assert.equal(g.entityById(aiAttacker.id)?.owner,1);
console.log('v2.34 fog-honest automatic acquisition regression passed');
