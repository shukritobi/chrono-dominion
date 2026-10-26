import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const noop=()=>{},ctx=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',style:{},dataset:{},disabled:false,classList:{add:noop,remove:noop,toggle:noop},
    addEventListener:noop,setAttribute:noop,querySelectorAll:()=>[],querySelector:()=>({disabled:true,textContent:''}),
    getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:id==='world'?1024:272,height:id==='world'?700:144}),
    set innerHTML(v){this._h=v},get innerHTML(){return this._h||''},
    set textContent(v){this._t=v},get textContent(){return this._t||''}
  });return nodes.get(id);
}};
const window={addEventListener:noop};
runInNewContext(source,{window,document,console,performance:{now:()=>0},devicePixelRatio:1,
  requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop,
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))}
},{timeout:10000});
const g=window.__game;
const cfg={playerFaction:'coalition',enemyFaction:'federation',map:'verdant',
  difficulty:'standard',startingCredits:5000};
g.newMatch(cfg);
const soldier=g.add(0,'soldier',15,15),baseDamage=g.stat(soldier,'damage'),baseSpeed=g.stat(soldier,'speed');
const baseHP=soldier.maxHp;
assert.equal(g.veterancyRank(soldier),0);
assert.equal(g.veterancyName(soldier),'RECRUIT');
assert.equal(g.veterancyRank(g.add(0,'harvester',15,16)),0);
g.selected=[soldier.id];
const kill=()=>{const enemy=g.add(1,'soldier',15.8,15.4);enemy.hp=1;
  g.shoot(soldier,enemy);g.updateProjectiles(.3);assert.ok(enemy.hp<=0);};
kill();assert.equal(soldier.kills,1);assert.equal(g.veterancyRank(soldier),0);
kill();assert.equal(g.veterancyRank(soldier),1);
assert.equal(g.veterancyName(soldier),'VETERAN');
assert.ok(g.stat(soldier,'damage')>baseDamage);
assert.ok(g.stat(soldier,'speed')>baseSpeed);
const veteranDamage=g.stat(soldier,'damage');
g.shoot(soldier,g.add(1,'soldier',16,16));
const veteranReload=soldier.ready;
assert.ok(veteranReload<1.2,'veterans reload sooner');
for(let n=0;n<3;n++)kill();
assert.equal(g.veterancyRank(soldier),2);
assert.equal(soldier.kills,5);
assert.ok(g.stat(soldier,'damage')>veteranDamage);
assert.ok(g.stat(soldier,'speed')>baseSpeed);
assert.equal(soldier.maxHp,baseHP,'promotions never heal or inflate maximum health');
g.updateSelection();
assert.ok(nodes.get('selection').innerHTML.includes('ELITE'),'rank shown in selection');
assert.ok(nodes.get('selection').innerHTML.includes('5 KILLS'),'confirmed kills visible');
g.drawUnit(soldier);
assert.equal(g.saveGame(),true);
assert.equal(g.loadGame(),true);
const veteran=g.entityById(soldier.id);
assert.equal(g.veterancyRank(veteran),2,'saved combat experience survives load');
const old=JSON.parse(storage.get('chrono-dominion-skirmish-v1'));
for(const u of old.entities)if(u.type==='unit')delete u.kills;
storage.set('chrono-dominion-skirmish-v1',JSON.stringify(old));
assert.equal(g.loadGame(),true);
assert.equal(g.veterancyRank(g.entityById(soldier.id)),0,'older save defaults to Recruit');
g.newMatch(cfg);assert.ok(g.entities.every(e=>g.veterancyRank(e)===0),
  'fresh match does not inherit experience');
console.log('PASS: v2.16 kill promotions, damage/speed/reload scaling, rank HUD, drawing, old saves');
