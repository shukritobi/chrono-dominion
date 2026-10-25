import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__testGame = new Game();');
const context=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const dom=new Map();
const document={getElementById(id){
  if(!dom.has(id))dom.set(id,{
    id,style:{},value:'',disabled:false,classList:{add(){},remove(){},toggle(){}},
    getContext(){return context;},addEventListener(){},querySelectorAll(){return [];},
    getBoundingClientRect(){return{width:id==='world'?1050:256,height:id==='world'?700:190,left:0,top:0};},
    set innerHTML(v){this._html=v;},get innerHTML(){return this._html||'';},
    set textContent(v){this._text=v;},get textContent(){return this._text||'';}
  });
  return dom.get(id);
}};
const window={addEventListener(){}};
runInNewContext(source,{window,document,console,performance:{now:()=>0},
  requestAnimationFrame(){},devicePixelRatio:1,setTimeout:()=>1,clearTimeout(){}
},{timeout:4000});
const game=window.__testGame;
const start=(player='coalition',enemy='federation')=>game.newMatch({
  playerFaction:player,enemyFaction:enemy,map:'verdant',difficulty:'recruit'
});
start();
const friendly=game.entities.find(e=>e.owner===0&&e.kind==='tank');
const federation=game.entities.find(e=>e.owner===1&&e.kind==='tank');
assert.ok(federation.hp>friendly.hp,'Federation heavy armour gives greater tank HP');
assert.ok(game.stat(friendly,'speed')>game.stat(federation,'speed'),
  'Coalition tank moves faster than Federation');
game.selected=[friendly.id];
assert.equal(game.unitAction('hold'),true);
assert.equal(friendly.stance,'hold');
assert.equal(friendly.order,null);
assert.equal(game.unitAction('aggressive'),true);
assert.equal(friendly.stance,'aggressive');
assert.equal(game.unitAction('stop'),true);
assert.equal(friendly.order,null);
assert.equal(game.unitAction('attackMove'),true);
assert.equal(game.attackMoveArmed,true);
game.command({gx:15,gy:17},{shiftKey:false});
assert.equal(friendly.order.type,'attackMove','armed attack-move issues tactical order');
assert.equal(game.attackMoveArmed,false,'attack-move is consumed after one command');
assert.equal(game.unitAction('guard'),true);
assert.equal(friendly.stance,'guard');
assert.equal(friendly.order,null);
friendly.guardX=0;friendly.guardY=0;
friendly.order={type:'move',x:friendly.x,y:friendly.y};
game.step(.04);
assert.equal(friendly.order,null,'unit completes an already-reached move order');
assert.ok(Math.abs(friendly.guardX-friendly.x)<.01,'guard anchor follows successful move');
assert.ok(Math.abs(friendly.guardY-friendly.y)<.01,'guard anchor updates both axes');


// Intentional pileups separate without crossing buildings or off-map terrain.
const a=game.add(0,'soldier',15,15),b=game.add(0,'soldier',15,15);
const overlap=()=>Math.hypot(a.x-b.x,a.y-b.y);
game.separateUnits();
assert.ok(overlap()>.3,'overlapping troops are pushed apart');
assert.equal(game.canOccupyUnit(a,b.x,b.y),false,'occupied unit tiles are rejected');
assert.equal(game.canOccupyUnit(a,15,15),false,'nearby troop collision is checked');

// Queue renders a visible cancellation affordance and refunds all reserved credits.
start();
const factory=game.add(0,'factory',11,6);assert.ok(factory);
const money=game.players[0].credits;
game.chooseProduction('tank');
assert.equal(game.players[0].credits,money-850);
assert.ok(game.queues.some(q=>q.key==='tank'&&q.side===0));
assert.ok(dom.get('queueList').innerHTML.includes('data-cancel-key="tank"'),
  'the active queue contains a cancel button');
assert.equal(game.cancelProduction('tank'),true);
assert.equal(game.players[0].credits,money,'cancel returns full credits');
assert.ok(!game.queues.some(q=>q.key==='tank'&&q.side===0));
assert.equal(game.cancelProduction('tank'),false,'cannot cancel an already cancelled job');

// Saved tactical orders and faction stats survive normal simulation.
start('psionic','federation');
assert.ok(game.stat(game.entities.find(e=>e.owner===0&&e.kind==='tank'),'speed')>
          game.stat(game.entities.find(e=>e.owner===1&&e.kind==='tank'),'speed'));
for(let i=0;i<80;i++)game.step(.05);
game.draw();
console.log('PASS: faction balance, tactical stances, attack-move, unit spacing, production refund and skirmish render');
