import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const code=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const noop=()=>{},drawing=new Proxy({},{get:(o,k)=>o[k]??noop,
  set:(o,k,v)=>{o[k]=v;return true;}});
const dom=new Map(),store=new Map();
const document={getElementById(id){
  if(!dom.has(id))dom.set(id,{
    id,value:'',style:{},disabled:false,dataset:{},
    classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,
    setAttribute:noop,querySelectorAll:()=>[],
    querySelector:()=>({disabled:true,textContent:''}),getContext:()=>drawing,
    getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
    set innerHTML(v){this._html=v},get innerHTML(){return this._html||''},
    set textContent(v){this._text=v},get textContent(){return this._text||''}
  });return dom.get(id);
}};
const window={addEventListener:noop};
runInNewContext(code,{window,document,console,performance:{now:()=>0},
  devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop,
  localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))}
},{timeout:10000});
const g=window.__game;
const settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000};
const reset=()=>{g.newMatch(settings);g.time=112;g.nextAI=1e8;};
reset();
const base=g.entities.find(e=>e.owner===1&&e.kind==='hq');
const playerHQ=g.entities.find(e=>e.owner===0&&e.kind==='hq');
assert.equal(g.sideCanSee(1,playerHQ),false);
const attacker=g.add(1,'soldier',24,21),wing=g.add(1,'tank',24,22);
const turret=g.add(0,'turret',25,20);
const refinery=g.add(0,'refinery',25,24);
g.aiPlatoon={phase:'assault',ids:[attacker.id,wing.id],slots:[{x:24,y:21},{x:24,y:22}],
  targetId:refinery.id,targetTime:g.time,target:{x:25,y:24},startedAt:g.time-25};
assert.ok(g.sideCanSee(1,turret)&&g.sideCanSee(1,refinery));
let focused=g.coordinateAISiegeFocus([attacker,wing]);
assert.equal(focused.size,2,'visible structures get coordinated siege orders');
assert.equal(attacker.order.type,'attack');
assert.equal(wing.order.type,'attack');
assert.equal(focused.get(attacker.id),turret.id,
  'known defense gets suppression priority before ordinary economy building');
const before=g.aiSiegeOrders;
g.coordinateAISiegeFocus([attacker,wing]);
assert.equal(g.aiSiegeOrders,before,'unchanged orders do not count again');
const assignments=new Map([[attacker.id,777]]);
focused=g.coordinateAISiegeFocus([attacker,wing],assignments);
assert.equal(focused.has(attacker.id),false,'nearby raider defense supersedes siege');
attacker.retreatUntil=g.time+20;
focused=g.coordinateAISiegeFocus([attacker,wing]);
assert.equal(focused.has(attacker.id),false,'retreating troops stay out of siege');
attacker.retreatUntil=0;attacker.retreatCooldownAt=g.time+15;
focused=g.coordinateAISiegeFocus([attacker,wing]);
assert.equal(focused.has(attacker.id),false,'post-retreat recovery is protected');
attacker.retreatCooldownAt=0;
focused=g.coordinateAISiegeFocus([attacker,wing],new Map(),true);
assert.equal(focused.size,0,'base emergency takes precedence');
const snapshot=attacker.order;
turret.x=3;turret.y=5;refinery.x=3;refinery.y=8;
assert.equal(g.sideCanSee(1,turret),false);
assert.equal(g.sideCanSee(1,refinery),false);
assert.equal(g.coordinateAISiegeFocus([attacker,wing]).size,0,
  'AI must not fire at enemy structures through fog');
assert.equal(attacker.order,snapshot,'missing visual contact makes no new order');
g.resumeAISiegeAdvance(g.aiPlatoon,[attacker]);
assert.equal(attacker.order?.type,'attackMove',
  'loss of direct building vision resumes navigation toward the remembered objective');
assert.equal(g.sideCanSee(1,playerHQ),false);
const original=g.walkable.bind(g);
g.walkable=(x,y)=>x>=1&&x<=32&&y>=1&&y<=32;
const objective={x:13,y:13},source={x:27,y:27};
const left=g.chooseFlank(source,objective,0);
const separated=g.chooseFlank(source,objective,0,null,[left]);
assert.ok(left&&separated&&Math.hypot(left.x-separated.x,left.y-separated.y)>1.8,
  'a second fighter avoids the first firing location');
assert.ok(g.walkable(left.x,left.y)&&g.walkable(separated.x,separated.y));
g.walkable=original;
// A real projectile travels with positional tracer history and a hit pulse.
reset();
const tank=g.add(1,'tank',24,23);
const building=g.add(0,'turret',24,21);
assert.ok(g.sideCanSee(1,building));
g.shoot(tank,building);
assert.equal(g.projectiles.length,1);
const initial=g.projectiles[0];
assert.equal(initial.prevX,initial.x);
g.updateProjectiles(.15);
assert.ok(g.projectiles.length>0);
assert.ok(Math.hypot(g.projectiles[0].prevX-g.projectiles[0].x,
  g.projectiles[0].prevY-g.projectiles[0].y)>.01,
  'flight stores last position for tracer drawing');
g.drawProjectiles();
g.updateProjectiles(2);
assert.ok(g.aiSiegeHits>=1,'AI impact counter only grows on actual building hits');
assert.ok(g.particles.some(p=>p.type==='shockwave'),
  'tank siege impact produces original shockwave geometry');
g.drawEffects();
assert.ok(g.saveGame()&&g.loadGame(),'old save schema remains compatible');
assert.equal(g.aiSiegeOrders,0,'transient focus counters reset after load');
assert.equal(g.aiSiegeHits,0,'transient hit counters reset after load');
console.log('PASS: v2.19 siege fire, emergency priority, fog, flank spacing, tracer and impact FX');
