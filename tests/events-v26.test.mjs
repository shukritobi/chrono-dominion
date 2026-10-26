import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const code=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',disabled:false,style:{},dataset:{},
    classList:{add(){},remove(){},toggle(){}},
    addEventListener(){},setAttribute(){},querySelectorAll(){return[];},
    querySelector(){return{disabled:true,textContent:''}},getContext(){return ctx},
    getBoundingClientRect(){return{left:0,top:0,width:id==='world'?1024:272,
      height:id==='world'?700:144}},
    set innerHTML(v){this._html=v;},get innerHTML(){return this._html||'';},
    set textContent(v){this._text=v;},get textContent(){return this._text||'';}
  });return nodes.get(id);
}};
const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
const window={addEventListener(){}};
runInNewContext(code,{window,document,localStorage,console,performance:{now:()=>0},
  requestAnimationFrame(){},setTimeout(){return 1},clearTimeout(){},devicePixelRatio:1},{timeout:10000});
const g=window.__game;
const settings={playerFaction:'coalition',enemyFaction:'federation',map:'verdant',
  difficulty:'standard',startingCredits:5000};
g.newMatch(settings);
assert.equal(g.battleEvents.length,0,'fresh match has no historical events');
assert.match(nodes.get('battleEventList').innerHTML,/No tactical events/);
const hq=g.entities.find(e=>e.owner===0&&e.kind==='hq');
const structure=g.entities.find(e=>e.owner===0&&e.kind==='generator');
const enemy=g.entities.find(e=>e.owner===1&&e.kind==='tank');
assert.ok(hq&&structure&&enemy);
g.time=5;
g.shoot(enemy,structure);
assert.equal(g.battleEvents.length,0,'shooting alone cannot create a hit alert');
assert.equal(g.projectiles.length,1);
g.projectiles[0].x=structure.x;g.projectiles[0].y=structure.y;
g.updateProjectiles(.1);
assert.equal(g.battleEvents.length,1,'projectile impact records friendly building damage');
const first=g.battleEvents[0];
assert.equal(first.kind,'damage');
assert.equal(first.x,structure.x);
assert.equal(first.y,structure.y);
assert.equal(first.refId,structure.id);
assert.ok(!first.text.includes('Enemy'),'event must not reveal unseen attacker identity');
assert.match(nodes.get('toast').textContent,/UNDER ATTACK/);
g.updateUI(true);
assert.match(nodes.get('battleEventList').innerHTML,/under attack/);
assert.equal(nodes.get('battleEventCount').textContent,'1');
assert.ok(g.centerBattleEvent(first.id));
assert.equal(g.camera.x,(first.x-first.y)*32,'event jump uses stored position');
assert.equal(g.camera.y,(first.x+first.y)*16);
assert.equal(g.centerBattleEvent(-100),false,'unknown event does not move camera');
g.time=6;structure.hp-=12;g.noteBuildingDamage(structure,1);
assert.equal(g.battleEvents.length,1,'repeat damage is throttled per building');
g.time=7;structure.hp=structure.maxHp*.29;g.noteBuildingDamage(structure,1);
assert.equal(g.battleEvents.length,2,'new critical threshold bypasses ordinary cooldown');
assert.equal(g.battleEvents[0].kind,'critical');
g.time=8;structure.hp-=2;g.noteBuildingDamage(structure,1);
assert.equal(g.battleEvents.length,2,'repeated critical hits are throttled');
g.time=26;structure.hp-=2;g.noteBuildingDamage(structure,1);
assert.equal(g.battleEvents.length,3,'later critical attack may re-alert');
g.time=27;structure.hp=0;g.recordLoss(structure,1);
assert.equal(g.battleEvents[0].kind,'loss','destroyed friendly structure has distinct event');
const lostCount=g.battleEvents.length;
g.recordLoss(structure,1);
assert.equal(g.battleEvents.length,lostCount,'loss events are recorded only once');
const enemyHQ=g.entities.find(e=>e.owner===1&&e.kind==='hq');
g.noteBuildingDamage(enemyHQ,0);
assert.equal(g.battleEvents.length,lostCount,'enemy building damage is not reported');
g.noteBuildingDamage(enemyHQ,1);
assert.equal(g.battleEvents.length,lostCount,'friendly fire cannot create false events');
g.time=30;
const hostile=g.entities.find(e=>e.owner===1&&e.kind==='soldier');
hostile.x=7;hostile.y=7;
g.updateFog();g.updateIntel(0);g.checkPlayerThreats();
assert.equal(g.battleEvents[0].kind,'alert','base contact uses player-side sensor report');
const alert=g.battleEvents[0];
assert.equal(alert.x,hostile.x);
assert.equal(alert.y,hostile.y);
g.time=31;g.updateIntel(0);g.checkPlayerThreats();
assert.equal(g.battleEvents.filter(e=>e.kind==='alert').length,1,'alert cooldown prevents spam');
const barracks=g.entities.find(e=>e.owner===0&&e.kind==='barracks');
barracks.hp-=15;g.noteBuildingDamage(barracks,1);
assert.ok(g.saveGame());
const saved=JSON.parse(storage.get('chrono-dominion-skirmish-v1'));
assert.equal(saved.battleEvents.length,g.battleEvents.length);
const expected=g.battleEvents.length;
g.battleEvents=[];
assert.ok(g.loadGame());
assert.equal(g.battleEvents.length,expected,'save restores event history');
assert.equal(g.battleEvents[0].id,alert.id);
assert.ok(g.nextBattleEventId>Math.max(...g.battleEvents.map(e=>e.id)));
const originalSize=g.battleEvents.length;
g.time=32;g.noteBuildingDamage(g.entities.find(e=>e.id===barracks.id),1);
assert.equal(g.battleEvents.length,originalSize,'restored damage throttles survive reload');

// A malicious local save cannot inject HTML or unbounded history.
const polluted={...saved,battleEvents:[
  {id:77,time:4,x:3,y:4,kind:'alert',text:'<img src=x onerror=alert(1)>',refId:null},
  {id:78,time:5,x:999,y:999,kind:'alert',text:'invalid',refId:null},
  {id:79,time:5,x:2,y:2,kind:'script',text:'invalid',refId:null},
  ...Array.from({length:20},(_,i)=>({id:100+i,time:i,x:2,y:2,
    kind:'damage',text:'bounded',refId:1}))
]};
storage.set('chrono-dominion-skirmish-v1',JSON.stringify(polluted));
assert.ok(g.loadGame());
assert.ok(g.battleEvents.length<=12,'event history is bounded on load');
assert.match(nodes.get('battleEventList').innerHTML,/&lt;img/,'user-controlled text is escaped');
assert.doesNotMatch(nodes.get('battleEventList').innerHTML,/<img src=x onerror/);
assert.ok(g.battleEvents.every(e=>e.x>=0&&e.x<=34&&['alert','damage','critical','loss'].includes(e.kind)));
const legacy={...saved};delete legacy.battleEvents;
storage.set('chrono-dominion-skirmish-v1',JSON.stringify(legacy));
assert.ok(g.loadGame(),'old saves without event history remain compatible');
assert.equal(g.battleEvents.length,0);
g.newMatch({...settings,map:'snow'});
assert.equal(g.battleEvents.length,0,'new battle clears history');
assert.equal(g.nextBattleEventId,1);
g.draw();
console.log('PASS: projectile damage, critical/loss alerts, fog-safe markers, cooldown, history UI, save/load and injection validation');
