import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const src=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__testGame = new Game();');
const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const elements=new Map(),local=new Map();
const localStorage={getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,String(v))};
const document={getElementById(id){
  if(!elements.has(id))elements.set(id,{
    id,value:'',disabled:false,style:{},classList:{add(){},remove(){},toggle(){}},
    setAttribute(){},addEventListener(){},querySelectorAll(){return[];},
    querySelector(){return {disabled:true,textContent:''};},
    getContext(){return ctx;},
    getBoundingClientRect(){return{width:id==='world'?1024:272,height:id==='world'?700:144,left:0,top:0};},
    set innerHTML(v){this._html=v;},get innerHTML(){return this._html??'';},
    set textContent(v){this._text=v;},get textContent(){return this._text??'';}
  });
  return elements.get(id);
}};
const window={addEventListener(){}};
runInNewContext(src,{window,document,localStorage,console,performance:{now:()=>0},
  requestAnimationFrame(){},setTimeout(){return 1;},clearTimeout(){},devicePixelRatio:1},{timeout:4000});
const game=window.__testGame;
const newGame=()=>game.newMatch({playerFaction:'coalition',enemyFaction:'federation',map:'verdant',difficulty:'recruit',startingCredits:5000});
newGame();
// Flood the battlefield with an unrealistic but plausible late-game army.
let count=0;
for(let y=10;y<30;y++)for(let x=8;x<31;x++){
  if(count>=130)break;
  if(!game.walkable(x,y))continue;
  game.add(count%5===0?1:0,'soldier',x+.05+(count%2)*.14,y+.11);
  count++;
}
assert.equal(count,130,'stress scenario includes 130 units');
const units=game.entities.filter(e=>e.type==='unit');
assert.ok(units.length>130);
const before=units.map(e=>({id:e.id,x:e.x,y:e.y}));

// Frames maintain a spatial index while units move, then release it for
// out-of-step editor/test mutations and browser save compatibility.
let indexed=0,scanned=0;
const occupancy=game.canOccupyUnit.bind(game);
game.canOccupyUnit=function(e,x,y,ignoreUnits){
  if(this.unitBuckets){
    indexed++;
    const candidates=this.unitBuckets.nearby(x,y).length;
    assert.ok(candidates<units.length/2,'spatial bucket candidate list remains local');
  }else scanned++;
  return occupancy(e,x,y,ignoreUnits);
};
game.selected=units.filter(u=>u.owner===0).slice(0,35).map(u=>u.id);
game.command({gx:24,gy:14},{shiftKey:false});
for(let i=0;i<24;i++)game.step(.04);
assert.equal(game.unitBuckets,null,'temporary index is discarded after each simulation step');
assert.ok(indexed>0,'spatial occupancy index used for moving units');
assert.ok(units.some((u,i)=>Math.hypot(u.x-before[i].x,u.y-before[i].y)>.1),
  'large squad actually starts moving');
assert.ok(units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y)),'no invalid positions');
assert.ok(units.every(u=>u.x>0&&u.x<34&&u.y>0&&u.y<34),'all units stay in world');
assert.ok(units.every(u=>!game.water(u.x,u.y)),'none enter impassable lakes');
assert.ok(units.every(u=>!game.entities.some(b=>b.type==='building'&&
  b.hp>0&&Math.abs(u.x-b.x)<.5&&Math.abs(u.y-b.y)<.5)),
  'no unit cuts through an occupied structure centre');
// One isolated unit may still query exact positions outside step.
const isolated=game.add(0,'soldier',16,10);
const blocker=game.add(0,'soldier',16.02,10.02);
assert.equal(game.canOccupyUnit(isolated,blocker.x,blocker.y),false);
assert.ok(scanned>0,'out-of-step lookup falls back safely');
game.separateUnits();
assert.equal(game.unitBuckets,null,'manual overlap correction releases its index');

// Save/load must not capture or retain the transient spatial index.
assert.ok(game.saveGame());
const save=JSON.parse(localStorage.getItem('chrono-dominion-skirmish-v1'));
assert.ok(!('unitBuckets' in save));
assert.ok(game.loadGame());
assert.equal(game.unitBuckets,null);
game.draw();
// The visible diagnostic is updated no more than once per second.
game.state='paused';
game.frame(1000);game.frame(2200);
assert.match(elements.get('perfStatus').textContent,/\\d+ FPS · \\d+ UNITS/,
  'rendered frame-rate and army size are visible in the HUD');
console.log('PASS: frame-rate monitor and unit counter');
console.log('PASS: 130-unit spatial collision stress, occupied terrain, index cleanup and save compatibility');
