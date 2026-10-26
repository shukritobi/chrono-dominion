import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const noop=()=>{},drawing=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',style:{},dataset:{},disabled:false,
    classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,
    setAttribute:noop,querySelectorAll:()=>[],
    querySelector:()=>({disabled:true,textContent:''}),getContext:()=>drawing,
    getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
    set innerHTML(v){this._html=v},get innerHTML(){return this._html||''},
    set textContent(v){this._text=v},get textContent(){return this._text||''}
  });return nodes.get(id);
}};
const window={addEventListener:noop};
runInNewContext(source,{window,document,console,performance:{now:()=>0},
  devicePixelRatio:1,localStorage:{
    getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))
  },setTimeout:()=>1,clearTimeout:noop,requestAnimationFrame:noop},{timeout:10000});
const g=window.__game;
const settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000};
const prepare=(time)=>{
  g.newMatch(settings);g.time=time;
  const base=g.entities.find(e=>e.owner===1&&e.kind==='hq');
  const hq=g.entities.find(e=>e.owner===0&&e.kind==='hq');
  return {base,report:{id:hq.id,type:'building',kind:'hq',
    x:hq.x,y:hq.y,time:time-1},fighters:g.entities.filter(e=>
      e.owner===1&&e.type==='unit'&&e.kind!=='harvester')};
};
let {base,report,fighters}=prepare(105);
assert.equal(g.sideCanSee(1,g.entities.find(e=>e.owner===0&&e.kind==='hq')),false,
  'platoon objectives must originate from observed reports');
let primary=g.coordinateAIPlatoon(fighters,[report],base,false);
assert.equal(primary.size,3);
const start=g.aiPlatoon.startedAt,originalSlots=g.aiPlatoon.slots.map(s=>({...s}));
const fallen=g.entityById(g.aiPlatoon.ids[0]);
fallen.hp=0;
primary=g.coordinateAIPlatoon(fighters,[report],base,false);
assert.equal(primary.size,2,'survivors stay committed despite falling below new-platoon minimum');
assert.equal(g.aiPlatoon.startedAt,start,'a casualty does not restart rally timeout');
assert.equal(g.aiPlatoon.slots.length,2,'dead member slot removed');
assert.equal(g.aiPlatoon.slots[0].x,originalSlots[1].x,'survivor keeps original slot');
assert.equal(g.aiPlatoon.slots[1].y,originalSlots[2].y,'second survivor keeps original slot');
assert.ok(!primary.has(fallen.id),'dead members cannot remain committed');
g.aiPlatoon.ids.forEach((id,i)=>{
  const u=g.entityById(id);u.x=g.aiPlatoon.slots[i].x;u.y=g.aiPlatoon.slots[i].y;
});
g.coordinateAIPlatoon(fighters,[report],base,false);
assert.equal(g.aiPlatoon.phase,'assault','surviving pair can launch together');
assert.ok(g.saveGame());
assert.ok(g.loadGame());
assert.equal(g.aiPlatoon.ids.length,2,'attrition-adjusted plan persists in v1 save');
assert.equal(g.aiPlatoon.phase,'assault');

({base,report,fighters}=prepare(108));
for(let i=0;i<6;i++)fighters.push(g.add(1,'soldier',25+i%3,19+Math.floor(i/3)));
primary=g.coordinateAIPlatoon(fighters,[report],base,false);
const support=g.coordinateAISupport(fighters,[report],base,false,primary);
assert.ok(support.size>=3,'independent support formed');
const supportStart=g.aiSupportPlatoon.startedAt;
const wounded=g.entityById(g.aiSupportPlatoon.ids[0]);
wounded.hp=wounded.maxHp*.2;
wounded.retreatUntil=g.time+20;
const remaining=g.coordinateAISupport(fighters,[report],base,false,primary);
assert.equal(remaining.size,support.size-1,'support preserves remaining fighters');
assert.equal(g.aiSupportPlatoon.startedAt,supportStart,'support rally is not reset');
assert.ok(!remaining.has(wounded.id),'wounded unit leaves support');
assert.ok(!g.coordinateAIPlatoon(fighters,[report],base,false).has(wounded.id),
  'primary must not commandeer retreating support troops');
assert.ok(g.saveGame()&&g.loadGame(),'support attrition preserves save compatibility');
assert.equal(g.aiSupportPlatoon.ids.length,remaining.size);
console.log('PASS: v2.15 platoon attrition, staging, wounded reserve and save/load');
