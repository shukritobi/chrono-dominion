import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const noop=()=>{},canvas=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',style:{},disabled:false,dataset:{},
    classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,
    setAttribute:noop,querySelectorAll:()=>[],querySelector:()=>({disabled:true,textContent:''}),
    getContext:()=>canvas,
    getBoundingClientRect:()=>({left:0,top:0,width:id==='world'?1024:272,height:id==='world'?700:144}),
    set innerHTML(v){this._h=v},get innerHTML(){return this._h||''},
    set textContent(v){this._t=v},get textContent(){return this._t||''}
  });return nodes.get(id);
}};
const window={addEventListener:noop};
runInNewContext(source,{window,document,console,performance:{now:()=>0},
  devicePixelRatio:1,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},
  setTimeout:()=>1,clearTimeout:noop,requestAnimationFrame:noop
},{timeout:10000});
const g=window.__game;
const settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000};
g.newMatch(settings);
const scout=g.add(1,'recon',17,16);
const originalWalkable=g.walkable.bind(g);
g.walkable=(x,y)=>x>=1&&x<=32&&y>=1&&y<=32;
const report={id:7777,x:16,y:16,time:g.time,type:'building',kind:'turret'};
g.intel[1]=[];
g.entities.push({id:report.id,owner:0,type:'building',kind:'turret',
  x:report.x,y:report.y,hp:100,maxHp:100,built:true});
assert.equal(g.scoutEscape(scout),false,'unseen defenses must never trigger evasive orders');
assert.equal(scout.order,null);
g.entities.pop();
g.intel[1]=[report];
const initialRisk=g.scoutThreatPenalty(scout);
assert.ok(initialRisk>=200,'reported turret creates a dangerous starting position');
assert.equal(g.scoutEscape(scout),true,'scout chooses a safer reachable exit');
assert.equal(scout.order.type,'move');
assert.ok(g.scoutThreatPenalty(scout.order)<initialRisk-35,'exit reduces exposure');
assert.ok(g.scoutPath(scout,scout.order),'escape uses a reachable threat-aware route');
assert.ok(scout.retreatUntil>g.time&&scout.retreatCooldownAt>g.time);
const destination={...scout.order};
assert.equal(g.scoutEscape(scout),true,'safe escape order is retained');
assert.equal(scout.order.x,destination.x);
assert.equal(scout.order.y,destination.y);
scout.order=null;scout.retreatUntil=0;scout.retreatCooldownAt=0;
g.walkable=(x,y)=>x===17&&y===16;
assert.equal(g.scoutEscape(scout),false,'fully enclosed scout cannot teleport');
g.walkable=originalWalkable;
assert.equal(g.saveGame(),true);
assert.equal(g.loadGame(),true,'evasion metadata uses existing save schema');
g.newMatch(settings);
const live=g.add(1,'recon',17,16);
g.intel[1]=[{...report,time:g.time}];
g.runAI();
assert.ok(live.order?.type==='move'&&live.retreatUntil>g.time,
  'AI loop invokes emergency escape before choosing its normal patrol');
console.log('PASS: v2.12 fog-honest evasion, reachable exits, route retention, failure handling, AI integration');
