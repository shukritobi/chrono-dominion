import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',disabled:false,style:{},classList:{add(){},remove(){},toggle(){}},
    setAttribute(){},addEventListener(){},querySelectorAll(){return[];},
    querySelector(){return{disabled:true,textContent:''};},
    getContext(){return ctx},getBoundingClientRect(){return{left:0,top:0,width:id==='world'?1024:272,height:id==='world'?700:144}},
    set innerHTML(v){this._html=v},get innerHTML(){return this._html||''},
    set textContent(v){this._text=v},get textContent(){return this._text||''}
  });return nodes.get(id);
}};
const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))};
const window={addEventListener(){}};
runInNewContext(source,{window,document,localStorage,console,performance:{now:()=>0},
  requestAnimationFrame(){},setTimeout(){return 1;},clearTimeout(){},devicePixelRatio:1},{timeout:4000});
const g=window.__game;
const settings={playerFaction:'coalition',enemyFaction:'federation',map:'verdant',difficulty:'standard',startingCredits:5000};
const reset=()=>{g.newMatch(settings);g.time=112;g.nextAI=100000;};
reset();
const home=g.entities.find(e=>e.owner===1&&e.kind==='hq');
const defenders=g.entities.filter(e=>e.owner===1&&e.type==='unit'&&e.kind!=='harvester');
assert.ok(defenders.length>=3);
const farAway=g.entities.find(e=>e.owner===0&&e.kind==='hq');
assert.equal(g.sideCanSee(1,farAway),false);
const noTargets=g.assignAIEngagements(defenders,[],home);
assert.equal(noTargets.size,0,'an unscouted command center must not become a combat target');
assert.ok(defenders.every(u=>!u.order||u.order.type!=='attack'),
  'unseen enemy must not issue direct attack orders');

// Two separate visible raiders near the AI base should be defended against.
// A single fighter cannot be retargeted multiple times in one AI tick.
const hostileA=g.add(0,'soldier',home.x-3,home.y+1);
const hostileB=g.add(0,'soldier',home.x+1,home.y-2);
const spare=g.add(1,'tank',home.x-3.5,home.y+2);
const available=[...defenders,spare];
assert.equal(g.sideCanSee(1,hostileA),true);
assert.equal(g.sideCanSee(1,hostileB),true);
const orders=g.assignAIEngagements(available,[hostileA,hostileB],home);
assert.ok(orders.size>=2,'visible threats receive defenders');
assert.ok([...orders.values()].includes(hostileA.id),'first attack direction covered');
assert.ok([...orders.values()].includes(hostileB.id),'second attack direction covered');
assert.equal(new Set([...orders.keys()]).size,orders.size,'no defender assigned twice');
for(const [id,target] of orders){
  assert.equal(g.entityById(id).order.type,'attack');
  assert.equal(g.entityById(id).order.id,target);
  assert.ok([hostileA.id,hostileB.id].includes(target));
}
const wounded=available[0];wounded.retreatUntil=g.time+15;wounded.order={type:'move',x:25,y:26};
const without=g.assignAIEngagements(available,[hostileA,hostileB],home);
assert.equal(without.has(wounded.id),false,'retreating unit excluded from focus fire');
assert.equal(wounded.order.type,'move','retreat order is preserved');

// Even a previously issued direct AI attack order cannot chase an enemy after
// it leaves all AI vision. The player keeps control of its own attack orders.
reset();
const base=g.entities.find(e=>e.owner===1&&e.kind==='hq');
const aiSoldier=g.entities.find(e=>e.owner===1&&e.kind==='soldier');
const playerSoldier=g.entities.find(e=>e.owner===0&&e.kind==='soldier');
const movingEnemy=g.add(0,'soldier',base.x-3,base.y);
aiSoldier.order={type:'attack',id:movingEnemy.id};
assert.ok(g.sideCanSee(1,movingEnemy));
movingEnemy.x=3;movingEnemy.y=23;
assert.equal(g.sideCanSee(1,movingEnemy),false);
const attackerBefore={x:aiSoldier.x,y:aiSoldier.y};
g.step(.04);
assert.ok(aiSoldier.order===null||aiSoldier.order.type!=='attack'||aiSoldier.order.id!==movingEnemy.id,
  'AI releases a target it no longer sees');
assert.ok(Math.hypot(aiSoldier.x-attackerBefore.x,aiSoldier.y-attackerBefore.y)<.2,
  'AI does not sprint toward a hidden live coordinate');
playerSoldier.order={type:'attack',id:base.id};
g.step(.04);
assert.equal(playerSoldier.order?.id,base.id,'player attack commands remain untouched');

// These tactical decisions should not introduce transient fields into saved
// games, change the economy, or invalidate older match snapshots.
const credits=g.players.map(p=>p.credits);
assert.ok(g.saveGame());
const record=JSON.parse(storage.get('chrono-dominion-skirmish-v1'));
assert.ok(!Object.hasOwn(record,'aiEngagements'));
assert.ok(g.loadGame());
assert.equal(g.players[0].credits,credits[0]);
assert.equal(g.players[1].credits,credits[1]);
g.draw();
console.log('PASS: visible focus-fire, multiple defenders, no double assignment, retreat and hidden-target safety');
