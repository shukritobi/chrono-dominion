import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const noop=()=>{},canvas=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',style:{},dataset:{},disabled:false,
    classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,setAttribute:noop,
    querySelectorAll:()=>[],querySelector:()=>({disabled:true,textContent:''}),getContext:()=>canvas,
    getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
    set innerHTML(v){this._h=v},get innerHTML(){return this._h||''},
    set textContent(v){this._t=v},get textContent(){return this._t||''}
  });return nodes.get(id);
}};
const window={addEventListener:noop};
runInNewContext(source,{window,document,console,performance:{now:()=>0},
  devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop,
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))}
},{timeout:10000});
const g=window.__game;
const settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000};
g.newMatch(settings);g.time=105;
const ownHQ=g.entities.find(e=>e.owner===1&&e.kind==='hq');
const enemyHQ=g.entities.find(e=>e.owner===0&&e.kind==='hq');
const report=(id,kind,x,y,age=1)=>({id,kind,type:'building',x,y,time:g.time-age});
const hq=report(enemyHQ.id,'hq',enemyHQ.x,enemyHQ.y,8);
const turret=report(9901,'turret',ownHQ.x-2,ownHQ.y-3,0);
const factory=report(9902,'factory',ownHQ.x-10,ownHQ.y-10,3);
const generator=report(9903,'generator',ownHQ.x-4,ownHQ.y-4,1);
const intel=[turret,hq,generator,factory];
assert.equal(g.sideCanSee(1,enemyHQ),false,'enemy HQ not currently visible');
assert.equal(g.rankAIObjectives(intel,ownHQ)[0].id,hq.id,
  'valuable reported HQ outranks most recent turret');
assert.equal(g.rankAIObjectives(intel,ownHQ,hq.id)[0].id,factory.id,
  'support squad prefers a different worthwhile reported building');
assert.equal(g.rankAIObjectives([hq],ownHQ,hq.id)[0].id,hq.id,
  'support may converge on the only known objective');
assert.equal(g.rankAIObjectives([report(9910,'hq',5,5,181),turret],ownHQ)[0].id,turret.id,
  'outdated intelligence does not control targeting');
assert.equal(g.rankAIObjectives([{...hq,x:NaN},turret],ownHQ)[0].id,turret.id,
  'invalid report coordinates rejected');
const before=g.rankAIObjectives(intel,ownHQ).map(r=>r.id).join(',');
enemyHQ.x=4;enemyHQ.y=18;
assert.equal(g.rankAIObjectives(intel,ownHQ).map(r=>r.id).join(','),before,
  'hidden opponent movement never influences selection');
const fighters=g.entities.filter(e=>e.owner===1&&e.type==='unit'&&e.kind!=='harvester');
for(let i=0;i<6;i++)fighters.push(g.add(1,'soldier',25+i%3,19+Math.floor(i/3)));
const primary=g.coordinateAIPlatoon(fighters,intel,ownHQ,false);
assert.ok(primary.size>=3);
assert.equal(g.aiPlatoon.targetId,hq.id,'primary chooses strategic HQ report');
const support=g.coordinateAISupport(fighters,intel,ownHQ,false,primary);
assert.ok(support.size>=2);
assert.equal(g.aiSupportPlatoon.targetId,factory.id,'support diversifies target');
g.newMatch(settings);g.time=105;
const home=g.entities.find(e=>e.owner===1&&e.kind==='hq');
const reserve=g.entities.filter(e=>e.owner===1&&e.kind==='soldier');
const extra=g.add(1,'soldier',25,19);
const candidates=[...reserve,extra];
for(const unit of candidates)unit.retreatCooldownAt=g.time+30;
const only=[report(10098,'factory',15,16)];
assert.equal(g.coordinateAISupport(candidates,only,home,false,new Set()).size,0,
  'support excludes fighters still recovering after retreat');
assert.equal(g.aiSupportPlatoon,null);
assert.ok(g.saveGame()&&g.loadGame(),'unchanged save schema remains compatible');
console.log('PASS: v2.17 strategic targets, fog honesty, stale reports, support roles, cooldown and save');
