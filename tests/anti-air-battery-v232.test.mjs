import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const noop=()=>{},drawing=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',disabled:false,style:{},dataset:{},
    classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
    addEventListener:noop,setAttribute:noop,querySelectorAll:()=>[],
    querySelector:()=>({disabled:true,textContent:''}),
    getContext:()=>drawing,setPointerCapture:noop,
    getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
    set innerHTML(v){this._html=v},get innerHTML(){return this._html||''},
    set textContent(v){this._text=v},get textContent(){return this._text||''}
  });return nodes.get(id);
}};
const window={addEventListener:noop};
const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
runInNewContext(read('maps/catalog.js'),{window,console},{timeout:1000});
runInNewContext(read('game.js').replace('  new Game();','  window.__game=new Game();'),{
  window,document,console,localStorage,performance:{now:()=>0},
  devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop
},{timeout:10000});
const g=window.__game;
const settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000};
const reset=()=>g.newMatch(settings);
reset();
assert.equal(g.prereq(0,'flak'),false,'radar prerequisite enforced');
g.add(0,'radar',10,9);
assert.equal(g.prereq(0,'flak'),true);
g.tab='defenses';g.updateUI(true);
assert.ok(nodes.get('production').innerHTML.includes('Skyguard Battery'));
const flak=g.add(0,'flak',11,10),infantry=g.add(1,'soldier',12,10);
const plane=g.add(1,'aircraft',14,10);
assert.equal(g.defenseTarget(flak)?.id,plane.id);
g.projectiles.length=0;g.shoot(flak,infantry);
assert.equal(g.projectiles.length,0,'direct fire cannot hit ground');
g.shoot(flak,plane);
assert.equal(g.projectiles.at(-1)?.damage,32);
plane.x=18.1;plane.y=10;
assert.equal(g.defenseTarget(flak),null,'range is not shared sensor sight');
const recon=g.add(0,'recon',16,10);
assert.equal(g.defenseTarget(flak)?.id,plane.id,'shared sensors spot aircraft');
recon.hp=0;
assert.equal(g.defenseTarget(flak),null,'lost scout removes sight');
plane.hp=0;
assert.equal(g.defenseTarget(flak),null,'ground targets remain ineligible');
plane.hp=220;plane.x=14;plane.y=10;
g.projectiles.length=0;flak.ready=0;
const normalPower=g.power.bind(g);
g.power=side=>side===0?{make:0,use:100,low:true}:normalPower(side);
g.nextAI=Infinity;g.nextFog=Infinity;g.nextUi=Infinity;
g.step(.05);
assert.equal(g.projectiles.filter(p=>p.sourceId===flak.id).length,0);
g.power=side=>side===0?{make:1000,use:100,low:false}:normalPower(side);
flak.ready=0;g.step(.05);
assert.equal(g.projectiles.find(p=>p.sourceId===flak.id)?.targetId,plane.id);
g.power=normalPower;
g.time=40;
g.intel[0]=[{id:99,kind:'flak',type:'building',x:11,y:10,time:39}];
assert.ok(g.airReturnExposure(0,{x:3,y:10},{x:20,y:10})>0);
g.intel[0]=[];
assert.equal(g.airReturnExposure(0,{x:3,y:10},{x:20,y:10}),0);

// AI construction must use its own recent reports, not unseen live aircraft.
reset();
for(let i=0;i<4;i++)g.add(1,'generator',17+i,19);
g.add(1,'factory',21,23);g.add(1,'radar',22,21);
g.add(1,'tech',19,22);g.add(1,'airfield',23,20);
g.add(1,'turret',19,20);g.add(1,'turret',20,21);
g.time=150;g.players[1].credits=7000;
const canPlace=g.canPlace.bind(g);g.canPlace=()=>true;
const hidden=g.add(0,'aircraft',6,6);
g.runAI();
assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='flak').length,0,
  'unseen aircraft cannot trigger construction');
g.intel[1].push({id:hidden.id,kind:'aircraft',type:'unit',x:6,y:6,time:g.time});
g.runAI();
const battery=g.entities.find(e=>e.owner===1&&e.kind==='flak');
assert.ok(battery,'recent observed aircraft triggers air defense');
assert.equal(battery.built,false,'uses normal construction');
g.runAI();
assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='flak').length,1,
  'unfinished batteries count toward AI cap');
g.canPlace=canPlace;
assert.ok(g.saveGame());assert.ok(g.loadGame());
assert.equal(g.entityById(battery.id)?.kind,'flak');
runInNewContext(read('art/animated-entities.js'),{window,console},{timeout:1000});
const ctx=new Proxy({},{
  get:(o,k)=>k==='createRadialGradient'||k==='createLinearGradient'?
    ()=>({addColorStop:noop}):(o[k]??noop),
  set:(o,k,v)=>{o[k]=v;return true;}
});
assert.equal(window.ChronoAnimatedArt.drawBuilding(ctx,battery,
  {faction:'federation',time:1}),true);
console.log('v2.32 Skyguard anti-air regression passed');
