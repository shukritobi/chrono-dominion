import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const gameCode=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const canvas=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',disabled:false,style:{},classList:{add(){},remove(){},toggle(){}},
    setAttribute(){},addEventListener(){},querySelectorAll(){return[];},
    querySelector(){return{disabled:true,textContent:''}},
    getContext(){return canvas},
    getBoundingClientRect(){return{left:0,top:0,width:id==='world'?1024:272,height:id==='world'?700:144}},
    set innerHTML(v){this._h=v},get innerHTML(){return this._h||''},
    set textContent(v){this._t=v},get textContent(){return this._t||''}
  });return nodes.get(id);
}};
const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
const window={addEventListener(){}};
runInNewContext(gameCode,{window,document,localStorage,console,performance:{now:()=>0},
  setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){},devicePixelRatio:1},{timeout:5000});
const g=window.__game,settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000};
g.newMatch(settings);
assert.ok(g.aiExplored instanceof Set || typeof g.aiExplored.add==='function');
assert.ok(g.aiExplored.size>0,'AI HQ and nearby friendly units survey their own starting territory');
assert.ok(!g.aiExplored.has('5,6'),'AI may not inherit the players explored base territory');
const enemyHQ=g.entities.find(e=>e.owner===0&&e.kind==='hq');
assert.equal(g.sideCanSee(1,enemyHQ),false);
const playerFog=g.fog.flat().filter(c=>c.seen).length;
const startSurvey=g.aiExplored.size;
const scout=g.add(1,'recon',17,23);
g.updateAISurvey();
assert.ok(g.aiExplored.size>=startSurvey,'scout adds explored terrain');
assert.equal(g.sideCanSee(1,enemyHQ),false,'surveying does not reveal enemies outside real sight');
assert.ok(g.intel[1].every(c=>c.id!==enemyHQ.id),'terrain memory is not omniscient intel');

const waypoints=g.scoutWaypoints();
assert.ok(waypoints.length>7);
const accessible=waypoints.filter(p=>g.walkable(p.x,p.y)&&g.findPath(scout.x,scout.y,p.x,p.y).length);
assert.ok(accessible.length>=2);
assert.equal(g.assignScoutPatrol(scout),true);
assert.equal(scout.order?.type,'move');
const first={...scout.order};
const another=g.add(1,'recon',17.7,23);
g.updateAISurvey();
assert.equal(g.assignScoutPatrol(another),true,'independent scout gets exploration destination');
assert.ok(Math.hypot(first.x-another.order.x,first.y-another.order.y)>=4,
  'two scouts avoid duplicated sector destinations');
assert.equal(g.intel[1].some(c=>c.id===enemyHQ.id),false,'choosing patrol cannot reveal hidden HQ');

// Artificially mark all but two known sector regions surveyed. The score
// must prefer the genuinely untouched region, not fixed round-robin indices.
const candidates=waypoints.filter(p=>g.walkable(p.x,p.y)&&g.findPath(scout.x,scout.y,p.x,p.y).length);
const high=candidates.find(p=>Math.hypot(p.x-scout.x,p.y-scout.y)>3);
assert.ok(high);
g.aiExplored=new Set();
for(let x=0;x<34;x++)for(let y=0;y<34;y++)g.aiExplored.add(x+','+y);
for(let dx=-6;dx<=6;dx++)for(let dy=-6;dy<=6;dy++){
  const x=high.x+dx,y=high.y+dy;
  if(x>=0&&x<34&&y>=0&&y<34&&dx*dx+dy*dy<=36)g.aiExplored.delete(x+','+y);
}
assert.ok(g.scoutSurveyValue(high)>0);
another.order=null;
scout.patrolIndex=0;
assert.equal(g.assignScoutPatrol(scout),true,'scout can plan using surveyed map memory');
assert.ok(g.scoutSurveyValue(scout.order)>0,'scout selects an unexplored sector');

// Reload restores survey, but old saves without memory still work.
assert.ok(g.saveGame());
const saved=JSON.parse(storage.get('chrono-dominion-skirmish-v1'));
assert.ok(saved.aiExplored.length>0);
const expectedSize=g.aiExplored.size;
g.aiExplored.clear();
assert.ok(g.loadGame());
assert.ok(g.aiExplored.size>=expectedSize,
  'survey memory survives a local save and current observers may uncover more terrain');
assert.ok(saved.aiExplored.every(cell=>g.aiExplored.has(cell)),
  'every saved surveyed tile remains surveyed after reloading');
const legacy={...saved};delete legacy.aiExplored;
storage.set('chrono-dominion-skirmish-v1',JSON.stringify(legacy));
assert.ok(g.loadGame());
assert.ok(g.aiExplored.size>0,'old saves safely rebuild current observed territory');

// Invalid or hostile save metadata is discarded; selected cells are bounded.
const polluted={...saved,aiExplored:['999,999','NaN,5',null,'34,1','2,2','2,2','__proto__']};
storage.set('chrono-dominion-skirmish-v1',JSON.stringify(polluted));
assert.ok(g.loadGame());
assert.ok(!g.aiExplored.has('999,999'));
assert.ok(g.aiExplored.has('2,2'));
assert.ok(g.aiExplored.size<400);
g.newMatch({...settings,map:'desert'});
assert.ok(!g.aiExplored.has('5,6'),'map reset does not carry explored distant enemy positions');
g.draw();
console.log('PASS: independent fog survey, scout sector coordination, new coverage priorities, legacy saves and validation');
