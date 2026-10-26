import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),store=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',disabled:false,style:{},classList:{add(){},remove(){},toggle(){}},
    addEventListener(){},setAttribute(){},querySelectorAll(){return[];},
    querySelector(){return{disabled:true,textContent:''};},
    getContext(){return ctx},
    getBoundingClientRect(){return{left:0,top:0,width:id==='world'?1024:272,height:id==='world'?700:144}},
    set innerHTML(value){this._html=value},get innerHTML(){return this._html||''},
    set textContent(value){this._text=value},get textContent(){return this._text||''}
  });return nodes.get(id);
}};
const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))};
const window={addEventListener(){}};
runInNewContext(source,{window,document,localStorage,console,performance:{now:()=>0},
  requestAnimationFrame(){},setTimeout(){return 1;},clearTimeout(){},devicePixelRatio:1},{timeout:4000});
const g=window.__game;
const settings={playerFaction:'coalition',enemyFaction:'federation',map:'verdant',difficulty:'standard',startingCredits:5000};
const reset=()=>{g.newMatch(settings);g.time=108;g.nextAI=1e8;};
reset();
const home=g.entities.find(e=>e.owner===1&&e.kind==='hq');
const target=g.entities.find(e=>e.owner===0&&e.kind==='hq');
const intel={id:target.id,x:target.x,y:target.y,time:g.time,type:'building',kind:'hq'};
assert.equal(g.sideCanSee(1,target),false,'unscouted enemy base remains hidden');
const regular=g.entities.filter(e=>e.owner===1&&e.type==='unit'&&e.kind==='soldier');
assert.equal(g.coordinateAISupport(regular,[],home,false,new Set()).size,0,
  'second platoon cannot invent an unseen target');
const full=[...regular];
for(let i=0;i<6;i++)full.push(g.add(1,'soldier',25+i%3,19+Math.floor(i/3)));
const primary=g.coordinateAIPlatoon(full,[intel],home,false);
assert.ok(primary.size>=3,'primary unit group assembled');
const backup=g.coordinateAISupport(full,[intel],home,false,primary);
assert.ok(backup.size>=2,'extra combat units form independent support platoon');
assert.equal(g.aiSupportPlatoon.phase,'rally');
assert.ok([...backup].every(id=>!primary.has(id)),'support does not steal first platoon members');
assert.ok(g.aiSupportPlatoon.ids.every(id=>g.entityById(id).order?.type==='move'));
const original=g.aiSupportPlatoon.ids.map(id=>({...g.entityById(id).order}));
g.time+=3;
g.coordinateAISupport(full,[intel],home,false,primary);
assert.deepEqual(g.aiSupportPlatoon.ids.map(id=>({...g.entityById(id).order})),original,
  'support retains the assigned rally slots across repeated strategy ticks');
for(const id of g.aiSupportPlatoon.ids){
  const unit=g.entityById(id),i=g.aiSupportPlatoon.ids.indexOf(id);
  unit.x=g.aiSupportPlatoon.slots[i].x;unit.y=g.aiSupportPlatoon.slots[i].y;
}
g.coordinateAISupport(full,[intel],home,false,primary);
assert.equal(g.aiSupportPlatoon.phase,'assault','support only assaults after assembly');
assert.ok(g.aiSupportPlatoon.ids.every(id=>g.entityById(id).order?.type==='attackMove'));
assert.ok(g.saveGame(),'save multi-platoon state');
const snapshot=JSON.parse(store.get('chrono-dominion-skirmish-v1'));
assert.equal(snapshot.aiSupportPlatoon.phase,'assault');
assert.ok(g.loadGame(),'multi-platoon game loads');
assert.equal(g.aiSupportPlatoon.phase,'assault');
assert.ok(!g.aiSupportPlatoon.ids.some(id=>g.aiPlatoon.ids.includes(id)));
// Old v1.9 snapshots without optional reinforcements must remain playable.
const old={...snapshot};delete old.aiSupportPlatoon;
store.set('chrono-dominion-skirmish-v1',JSON.stringify(old));
assert.ok(g.loadGame());
assert.equal(g.aiSupportPlatoon,null);
const broken={...snapshot,aiSupportPlatoon:{...snapshot.aiSupportPlatoon,ids:[9999,9998]}};
store.set('chrono-dominion-skirmish-v1',JSON.stringify(broken));
assert.ok(g.loadGame());
assert.equal(g.aiSupportPlatoon,null,'invalid support platoon discarded safely');

// Retreat behavior requires real sighted danger and low health; no healing.
reset();
const base=g.entities.find(e=>e.owner===1&&e.kind==='hq');
const wounded=g.add(1,'soldier',23.5,23);
wounded.hp=wounded.maxHp*.20;
const unseen=g.retreatWoundedAI([wounded],base,1);
assert.equal(unseen.size,0,'no visible hostile means no omniscient retreat');
const enemy=g.add(0,'soldier',22.8,23);
assert.ok(g.sideCanSee(1,enemy));
const withdrew=g.retreatWoundedAI([wounded],base,1);
assert.ok(withdrew.has(wounded.id),'wounded fighter retreats from visible attacker');
assert.equal(wounded.order?.type,'move');
assert.ok(wounded.retreatUntil>g.time);
const beforeHP=wounded.hp;
assert.equal(g.retreatWoundedAI([wounded],base,1).size,1,
  'retreating fighter is not immediately recycled into an offensive platoon');
g.step(.05);
assert.equal(wounded.hp,beforeHP,'retreat provides no free HP');
assert.equal(wounded.order?.type,'move','low HP unit is not forced back into combat');
const cooldown=wounded.retreatCooldownAt;
g.time=wounded.retreatUntil+.05;
assert.equal(g.retreatWoundedAI([wounded],base,1).size,0,'retreat expires');
assert.ok(cooldown>g.time,'retreat cooldown prevents oscillation');
g.draw();
console.log('PASS: independent support platoons, assembly, fog, save migration, wounded retreat, no free healing');
