import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Exercise the production AI engagement planner, sensors, orders and legacy saves.
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const noop=()=>{},drawing=new Proxy({},{get:(o,k)=>o[k]??noop,
  set:(o,k,v)=>{o[k]=v;return true;}});
const catalog={addEventListener:noop};
runInNewContext(read('maps/catalog.js'),{window:catalog,console},{timeout:1000});
function game(faction){
  const nodes=new Map(),storage=new Map();
  const document={getElementById(id){
    if(!nodes.has(id))nodes.set(id,{
      id,value:'',disabled:false,style:{},dataset:{},
      classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
      addEventListener:noop,setAttribute:noop,querySelectorAll:()=>[],
      querySelector:()=>({disabled:true,textContent:''}),
      getContext:()=>drawing,setPointerCapture:noop,
      getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
      set innerHTML(v){this._html=v;},get innerHTML(){return this._html||'';},
      set textContent(v){this._text=v;},get textContent(){return this._text||'';}
    });return nodes.get(id);
  }};
  const window={...catalog};
  const localStorage={getItem:k=>storage.get(k)??null,
    setItem:(k,v)=>storage.set(k,String(v))};
  runInNewContext(read('game.js').replace('  new Game();','  window.__game=new Game();'),{
    window,document,localStorage,console,performance:{now:()=>0},
    devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop
  },{timeout:10000});
  const g=window.__game;
  g.updateUI=noop;g.notify=noop;g.draw=noop;
  g.newMatch({map:'verdant',difficulty:'standard',
    playerFaction:'coalition',enemyFaction:faction,startingCredits:5000});
  // Isolate the real planner from opening skirmish traffic, not from visibility.
  g.entities=[];g.nextId=1;g.time=100;
  const hq=g.add(1,'hq',26,26);
  g.add(1,'refinery',24,26);
  const worker=g.add(1,'harvester',14,14);
  const guard=g.add(1,'tank',9,14);
  const enemy=g.add(0,'soldier',17,14);
  return {g,hq,worker,guard,enemy};
}
for(const faction of ['coalition','federation','psionic']){
  {
    const {g,hq,worker,guard,enemy}=game(faction);
    assert.ok(g.sideCanSee(1,enemy),faction+': worker sensor sees local threat');
    assert.ok(Math.hypot(guard.x-enemy.x,guard.y-enemy.y)>6.5,
      'guard is beyond ordinary opportunistic target acquisition');
    const assignments=g.assignAIEngagements([guard],[],hq);
    assert.equal(assignments.get(guard.id),enemy.id,
      faction+': remote visible worker threat receives one local escort');
    assert.equal(guard.order?.type,'attack');
    assert.equal(guard.order?.id,enemy.id);
    assert.ok(g.saveGame()&&g.loadGame(),
      faction+': v1 save/load remains compatible with ordinary attack orders');
    assert.equal(g.entityById(guard.id)?.order?.id,enemy.id);
    assert.equal(g.entityById(worker.id)?.kind,'harvester');
  }
  {
    // The scout provides legitimate sight, but is not an available escort.
    // A heavy tank can fire from five tiles away; intercept before it reaches
    // the old fixed 4.5-tile harvester-defense trigger.
    const {g,hq,worker,guard,enemy}=game(faction);
    enemy.hp=0;guard.x=12;
    const scout=g.add(1,'recon',18,14);
    const siege=g.add(0,'heavy',20,14);
    assert.ok(g.sideCanSee(1,siege),faction+': scout spots approaching siege tank');
    assert.ok(Math.hypot(guard.x-siege.x,guard.y-siege.y)>6.5,
      faction+': defender cannot acquire this target through ordinary local combat');
    assert.equal(g.assignAIEngagements([guard],[],hq).get(guard.id),siege.id,
      faction+': ranged siege threat receives a preemptive worker escort');
    siege.x=20.7;guard.x=12.3;
    assert.equal(g.assignAIEngagements([guard],[],hq).has(guard.id),false,
      faction+': do not intercept a distant tank outside its firing approach');
    siege.hp=0;
    const rifle=g.add(0,'soldier',19,14);
    guard.x=12;
    assert.equal(g.assignAIEngagements([guard],[],hq).has(guard.id),false,
      faction+': short-range infantry must not inherit the siege interception radius');
    rifle.hp=0;siege.hp=100;siege.x=20;scout.hp=0;
    assert.equal(g.sideCanSee(1,siege),false,
      faction+': worker and remote defender cannot see the tank without scout');
    assert.equal(g.assignAIEngagements([guard],[],hq).has(guard.id),false,
      faction+': preemptive escorts cannot pursue hidden ranged threats');
    assert.equal(worker.kind,'harvester');
  }
  {
    const {g,hq,guard,enemy}=game(faction);
    enemy.x=19.5;
    assert.equal(g.sideCanSee(1,enemy),false,
      faction+': no sensor may reveal the remote attacker');
    assert.equal(g.assignAIEngagements([guard],[],hq).has(guard.id),false,
      faction+': cannot pursue a hidden enemy from omniscient positions');
  }
  {
    const {g,hq,worker,guard,enemy}=game(faction);
    worker.hp=0;
    g.add(1,'recon',18,14);
    assert.equal(g.sideCanSee(1,enemy),true);
    assert.equal(g.assignAIEngagements([guard],[],hq).has(guard.id),false,
      faction+': dead workers cannot trigger remote escort assignments');
  }
  {
    const {g,hq,guard,enemy}=game(faction);
    guard.order={type:'attackMove',x:5,y:5};
    assert.equal(g.assignAIEngagements([guard],[],hq).has(guard.id),false,
      faction+': do not recall a distant committed assault formation');
    assert.equal(guard.order.type,'attackMove');
  }
  {
    const {g,hq,guard,enemy}=game(faction);
    const baseGuard=g.add(1,'tank',25,24);
    const invader=g.add(0,'soldier',26,24);
    const assignments=g.assignAIEngagements([baseGuard,guard],[invader],hq);
    assert.equal(assignments.get(baseGuard.id),invader.id,
      faction+': immediate base defense gets first claim');
    assert.equal(assignments.get(guard.id),enemy.id,
      faction+': a second defender may still protect the worker');
  }
  {
    const {g,hq,worker,guard,enemy}=game(faction);
    worker.y=16;
    const second=g.add(0,'soldier',17,16),third=g.add(0,'soldier',17,18);
    const guard2=g.add(1,'tank',9,16),guard3=g.add(1,'tank',9,18);
    const assignments=g.assignAIEngagements([guard,guard2,guard3],[],hq);
    assert.equal(assignments.size,2,
      faction+': at most two ground escorts may be diverted in one AI decision');
    assert.ok([enemy.id,second.id,third.id].includes(assignments.get(guard.id))||
      !assignments.has(guard.id));
  }
}
// A rifle squad closer to a visible siege threat should not always crowd
// out a nearby tank that can return meaningful ranged fire.
for(const faction of ['coalition','federation','psionic']){
  const {g,hq,worker,guard,enemy}=game(faction);
  enemy.hp=0;
  guard.x=13;guard.y=16;
  const infantry=g.add(1,'soldier',15,14);
  const scout=g.add(1,'recon',18,14);
  const siege=g.add(0,'heavy',20,14);
  assert.ok(g.sideCanSee(1,siege),faction+': scout genuinely spots siege tank');
  assert.ok(Math.hypot(guard.x-siege.x,guard.y-siege.y)>6.5,
    faction+': tank cannot acquire siege through ordinary local combat');
  const result=g.assignAIEngagements([guard,infantry],[],hq);
  assert.equal(result.get(guard.id),siege.id,
    faction+': prioritise available armour against an outranging siege threat');
  assert.equal(guard.order?.type,'attack');
  assert.ok(g.saveGame()&&g.loadGame(),
    faction+': armour response uses existing serializable attack order');
  assert.equal(g.entityById(guard.id)?.order?.id,siege.id);
  assert.equal(g.entityById(worker.id)?.kind,'harvester');
  // For short-range enemies, retain the established nearest-first ranking.
  siege.hp=0;
  const rifle=g.add(0,'soldier',20,14);
  assert.ok(g.sideCanSee(1,rifle));
  guard.order=null;infantry.order=null;
  const shortRange=g.assignAIEngagements([guard,infantry],[],hq);
  assert.equal(shortRange.get(infantry.id),rifle.id,
    faction+': short-range threat remains a nearest-defender engagement');
  assert.equal(shortRange.has(guard.id),false,
    faction+': distant armour is not needlessly recalled for rifle threats');
  assert.equal(scout.hp>0,true);
}
console.log('PASS: bounded, fog-honest AI harvester escorts and base-first defense across three factions');
