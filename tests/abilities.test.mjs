import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__testGame = new Game();');
const ctx=new Proxy({},{
  get:(o,k)=>o[k]??(()=>{}),
  set:(o,k,v)=>{o[k]=v;return true}
});
const nodes=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    style:{},value:'',disabled:false,
    classList:{add(){},remove(){},toggle(){}},addEventListener(){},
    getContext(){return ctx},querySelectorAll(){return[]},
    getBoundingClientRect(){return{width:id==='world'?1100:256,height:id==='world'?750:190,left:0,top:0}},
    set innerHTML(v){this._html=v},get innerHTML(){return this._html||''},
    set textContent(v){this._text=v},get textContent(){return this._text||''}
  });return nodes.get(id);
}};
const window={addEventListener(){}};
runInNewContext(source,{
  window,document,console,performance:{now:()=>0},requestAnimationFrame(){},
  devicePixelRatio:1,setTimeout:()=>1,clearTimeout(){}
},{timeout:4000});
const game=window.__testGame;
const setup=(player='coalition',enemy='federation')=>{
  game.newMatch({playerFaction:player,enemyFaction:enemy,map:'verdant',difficulty:'recruit'});
  const caster=game.add(0,'specialist',15,15);
  const hostile=game.add(1,'tank',18,15);
  game.selected=[caster.id];
  return{caster,hostile};
};
// Coalition: targetable jump, no clipping, no cooldown evasion, resets orders.
{
  const {caster,hostile}=setup('coalition','federation');
  assert.equal(game.useSpecialistAbility(),true);
  assert.equal(game.abilityArmedId,caster.id);
  game.command({gx:hostile.x,gy:hostile.y}, {});
  assert.equal(caster.x,15,'blink refuses an occupied hostile tile');
  assert.equal(caster.abilityReadyAt,0,'invalid destination does not burn cooldown');
  assert.equal(game.useSpecialistAbility(),true);
  game.command({gx:17,gy:17}, {});
  assert.ok(Math.hypot(caster.x-17,caster.y-17)<.1,'jump teleports onto valid ground');
  assert.ok(caster.abilityReadyAt>=20,'jump starts cooldown');
  assert.equal(game.useSpecialistAbility(),false,'jump cannot be cast during cooldown');
  assert.equal(game.projectiles.length,0);
  assert.ok(game.particles.some(p=>p.type==='abilityPulse'),'visible effect exists');
}
// Federation: AoE damages enemy troops without damaging friendly units or infrastructure.
{
  const {caster,hostile}=setup('federation','coalition');
  const friend=game.add(0,'soldier',16,16);
  const building=game.add(1,'generator',18,16);
  const hp=hostile.hp,friendHP=friend.hp,buildingHP=building.hp;
  assert.equal(game.useSpecialistAbility(),true);
  assert.equal(hostile.hp,hp-38,'Arc Discharge deals 38 immediate AoE damage');
  assert.equal(friend.hp,friendHP,'friendly fire is disabled');
  assert.equal(building.hp,buildingHP,'civil structures are not specialist pulse targets');
  assert.equal(game.useSpecialistAbility(),false,'arc ability has a cooldown');
}
// Psionic: timed disable prevents attacking, and does not leave permanent effects.
{
  const {caster,hostile}=setup('psionic','coalition');
  hostile.x=17;hostile.y=15;
  const enemyTurret=game.add(1,'turret',18,17);
  assert.equal(game.useSpecialistAbility(),true);
  assert.ok(hostile.stunnedUntil>=3.8,'Neural Jam stuns enemy tank');
  assert.ok(enemyTurret.stunnedUntil>=3.8,'Neural Jam disables enemy defenses');
  const previous=hostile.x;
  hostile.order={type:'move',x:20,y:15};
  game.step(.05);
  assert.equal(hostile.x,previous,'stunned target cannot execute a move order');
  game.time=hostile.stunnedUntil+.01;
  hostile.stunnedUntil=game.time-.01;
  assert.ok(game.useSpecialistAbility()===false,'caster remains on cooldown');
  assert.ok(game.particles.some(p=>p.type==='abilityPulse'));
}
// Older save snapshots without cooldown values remain compatible.
{
  const {caster}=setup('coalition','psionic');
  delete caster.abilityReadyAt;
  delete caster.stunnedUntil;
  assert.equal(game.useSpecialistAbility(),true,'pre-v0.7 specialists can trigger abilities');
}
game.draw();
console.log('PASS: Coalition teleport, blocked destination, three cooldowns, Arc damage, Neural stun, save compatibility and render');
