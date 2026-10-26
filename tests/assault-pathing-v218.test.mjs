import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const noop=()=>{},drawing=new Proxy({},{get:(o,k)=>o[k]??noop,
  set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',disabled:false,style:{},dataset:{},
    classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,
    setAttribute:noop,querySelectorAll:()=>[],querySelector:()=>({disabled:true,textContent:''}),
    getContext:()=>drawing,
    getBoundingClientRect:()=>({left:0,top:0,width:id==='world'?1024:272,height:id==='world'?700:144}),
    set innerHTML(v){this._html=v;},get innerHTML(){return this._html||'';},
    set textContent(v){this._text=v;},get textContent(){return this._text||'';}
  });return nodes.get(id);
}};
const window={addEventListener:noop};
runInNewContext(source,{window,document,console,performance:{now:()=>0},
  devicePixelRatio:1,localStorage:{
    getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))
  },setTimeout:()=>1,clearTimeout:noop,requestAnimationFrame:noop},{timeout:10000});
const g=window.__game,settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000};
g.newMatch(settings);g.time=105;
const base=g.entities.find(e=>e.owner===1&&e.kind==='hq');
const hostile=g.entities.find(e=>e.owner===0&&e.kind==='hq');
const scoutReport={id:hostile.id,x:hostile.x,y:hostile.y,time:g.time,
  kind:'hq',type:'building'};
assert.equal(g.sideCanSee(1,hostile),false,'current enemy location remains unseen');
const originalWalkable=g.walkable.bind(g);
g.walkable=(x,y)=>x>=1&&x<=32&&y>=1&&y<=32&&x!==14;
const front={id:99991,x:21,y:23,time:g.time-3,kind:'factory',type:'building'};
assert.equal(g.reachableAIObjective([scoutReport,front],{x:25,y:23},base)?.id,front.id,
  'lower-priority reachable factory wins over inaccessible HQ report');
assert.equal(g.reachableAIObjective([scoutReport],{x:25,y:23},base),null,
  'disconnected reported objective is rejected, not forced into a wall');
const firing=g.chooseFlank({x:25,y:23},front,0);
assert.ok(firing&&g.walkable(firing.x,firing.y),
  'attack destination is a passable tile, not a building footprint');
assert.ok(Math.hypot(firing.x-front.x,firing.y-front.y)<=5.5,
  'approach reaches a viable firing position close to reported objective');
assert.equal(g.chooseFlank({x:25,y:23},scoutReport,0),null,
  'a blocked objective cannot get an impossible attackMove order');
// Actual hidden target motion never supplies a new reported coordinate.
const selected=g.reachableAIObjective([scoutReport,front],{x:25,y:23},base)?.id;
hostile.x=9;hostile.y=19;
assert.equal(g.reachableAIObjective([scoutReport,front],{x:25,y:23},base)?.id,selected,
  'changing an unseen hostile object does not change target');
g.walkable=(x,y)=>x>=1&&x<=32&&y>=1&&y<=32;
const attacker=g.add(1,'soldier',25,23);
const objective={x:8,y:8},plan={phase:'assault',targetId:99992,target:objective};
attacker.order={type:'attackMove',x:6,y:6};
g.recoverStalledAIAssault(plan,[attacker]);
const first=attacker.order;
g.time+=17;
g.recoverStalledAIAssault(plan,[attacker]);
assert.equal(g.aiAssaultReroutes,0,'no reroute before the bounded stall interval');
g.time+=2;
g.recoverStalledAIAssault(plan,[attacker]);
assert.equal(g.aiAssaultReroutes,1,'stalled attacker selects a new reachable flank');
assert.notDeepEqual(attacker.order,first,'new order differs from blocked old approach');
assert.equal(attacker.order.type,'attackMove');
assert.ok(g.chooseFlank(attacker,plan.target,0),'accessible flank remains available');
g.recoverStalledAIAssault(plan,[attacker]);
assert.equal(g.aiAssaultReroutes,1,'no immediate oscillation after reroute');
attacker.x+=1.6;g.time+=1;
g.recoverStalledAIAssault(plan,[attacker]);
assert.equal(g.aiAssaultReroutes,1,'real movement resets stall timer');
g.walkable=originalWalkable;
assert.ok(g.saveGame()&&g.loadGame(),'attack path changes use legacy save schema');
assert.equal(g.aiAssaultReroutes,0,'transient stall telemetry resets on load');
assert.equal(g.aiAssaultProgress.size,0,'old saves never import transient path cache');
console.log('PASS: v2.18 reachable targets, flank geometry, hidden-intel safety, stall recovery and saves');
