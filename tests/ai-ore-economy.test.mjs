import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Exercise real AI purchasing, production exits and saves, not a mocked planner.
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const noop=()=>{};
const drawing=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const catalog={addEventListener:noop};
runInNewContext(read('maps/catalog.js'),{window:catalog,console},{timeout:1000});
function game(){
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
  const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
  runInNewContext(read('game.js').replace('  new Game();','  window.__game=new Game();'),{
    window,document,localStorage,console,performance:{now:()=>0},
    devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop
  },{timeout:10000});
  const g=window.__game;
  g.updateUI=noop;g.notify=noop;g.draw=noop;
  return g;
}
const alive=(g,kind)=>g.entities.filter(e=>e.owner===1&&e.kind===kind&&e.hp>0);
const queued=(g,kind)=>g.queues.filter(q=>q.side===1&&q.key===kind);
for(const faction of ['coalition','federation','psionic']){
  const g=game();
  const reset=()=>{
    g.newMatch({map:'verdant',difficulty:'standard',
      playerFaction:'coalition',enemyFaction:faction,startingCredits:5000});
    g.time=20;g.queues=[];
  };
  reset();
  assert.equal(alive(g,'harvester').length,1,'each AI begins with one ore truck');
  const credits=g.players[1].credits,spent=g.stats[1].creditsSpent;
  g.runAI();
  assert.equal(queued(g,'harvester').length,1,faction+': should queue an early second ore truck');
  assert.equal(g.players[1].credits,credits-(g.stats[1].creditsSpent-spent),
    faction+': construction and unit spending must debit real credits');
  assert.ok(g.stats[1].creditsSpent-spent>=900,
    faction+': second harvester must cost its full 900 credits');
  assert.ok(g.players[1].credits>=650,
    faction+': early expansion retains an emergency generator reserve');
  g.runAI();
  assert.equal(queued(g,'harvester').length,1,'repeated AI ticks cannot duplicate a queued harvester');
  g.advanceProduction(10);
  assert.equal(alive(g,'harvester').length,2,
    faction+': second harvester must deploy through normal production');
  g.players[1].credits=5000;
  g.runAI();
  assert.equal(queued(g,'harvester').length,0,
    faction+': cap at two active harvesters');
  assert.ok(g.saveGame()&&g.loadGame(),'original v1 saves must remain readable');
  assert.equal(alive(g,'harvester').length,2,'both harvesters survive save/load');

  reset();g.players[1].credits=1549;
  g.runAI();
  assert.equal(queued(g,'harvester').length,0,
    faction+': cannot consume the emergency power reserve');

  reset();g.time=121;
  g.runAI();
  assert.equal(queued(g,'harvester').length,0,
    faction+': no late-game expansion after the early economy window');

  reset();
  const hq=alive(g,'hq')[0];
  g.add(0,'soldier',hq.x+1,hq.y+1);
  g.runAI();
  assert.equal(queued(g,'harvester').length,0,
    faction+': local invasion must take priority over economy expansion');

  reset();
  g.add(1,'factory',24,23);g.add(1,'radar',23,25);
  assert.equal(g.power(1).low,true,'brownout fixture must lack sufficient power');
  g.runAI();
  assert.equal(queued(g,'harvester').length,0,
    faction+': restore power before optional economy expansion');

  reset();
  g.add(1,'factory',24,23);g.add(1,'radar',23,25);
  g.add(1,'generator',21,24);g.add(1,'generator',22,20);
  g.add(1,'tank',23,21);g.add(1,'tank',23,20);
  g.time=150;g.players[1].credits=1800;
  assert.equal(g.power(1).low,false,'aviation saving fixture must be powered');
  g.runAI();
  assert.equal(queued(g,'harvester').length,0,
    faction+': do not divert Air Command savings to extra harvesters');
  assert.equal(g.players[1].credits,1800,
    faction+': keep the entire Air Command reserve while banking');

  // A second early harvester should not strand the AI behind the old
  // 2,600-credit radar threshold: the 900-credit radar needs only a
  // 650-credit emergency power reserve.
  reset();
  g.add(1,'factory',24,23);g.add(1,'generator',21,24);
  g.time=150;g.players[1].credits=1550;
  g.queues.push({side:1,key:'soldier',elapsed:0,total:2});
  assert.equal(g.power(1).low,false,'radar purchase fixture must be powered');
  g.runAI();
  assert.equal(alive(g,'radar').length,1,
    faction+': affordable radar must not wait for 2,600 credits');
  assert.equal(g.players[1].credits,650,
    faction+': radar purchase leaves the emergency generator reserve');
  assert.equal(alive(g,'radar')[0].built,false,'radar still takes time to construct');

  reset();
  g.add(1,'factory',24,23);g.add(1,'generator',21,24);
  g.time=150;g.players[1].credits=1549;
  g.queues.push({side:1,key:'soldier',elapsed:0,total:2});
  g.runAI();
  assert.equal(alive(g,'radar').length,0,
    faction+': radar must not consume the generator reserve');

  reset();
  alive(g,'harvester')[0].hp=0;
  g.runAI();
  assert.equal(queued(g,'harvester').length,1,
    faction+': replacing the only lost harvester remains higher priority');

  // Lost or not-yet-built radar should not be perpetually postponed by
  // cheap optional recruitment. Exercise the real AI and construction.
  reset();
  g.add(1,'factory',24,23);g.add(1,'generator',21,24);
  g.time=300;g.players[1].credits=1200;
  assert.ok(alive(g,'tank').length+alive(g,'heavy').length>0,
    faction+': radar recovery requires an existing ground screen');
  assert.equal(g.power(1).low,false,'radar reserve fixture must be powered');
  g.runAI();g.runAI();
  assert.equal(queued(g,'recon').length+queued(g,'soldier').length+
    queued(g,'tank').length+queued(g,'specialist').length,0,
    faction+': optional recruitment must not consume radar savings');
  assert.equal(g.players[1].credits,1200,
    faction+': preserve the radar budget while below 1,550 credits');
  g.players[1].credits=1550;g.runAI();
  assert.equal(alive(g,'radar').length,1,
    faction+': a funded radar must enter normal paid construction');
  assert.equal(alive(g,'radar')[0].built,false,
    faction+': radar must not be granted instantly');
  assert.equal(g.players[1].credits,650,
    faction+': the emergency generator reserve survives radar purchase');
  assert.equal(g.queues.filter(q=>q.side===1).length,0,
    faction+': do not spend the emergency reserve during radar construction');
  g.players[1].credits=1100;g.runAI();
  assert.equal(g.players[1].credits,1100,
    faction+': optional units stay paused until the radar is operational');
  // Building progress is advanced by the world simulation, not unit queues.
  g.step(6);
  assert.equal(alive(g,'radar')[0].built,true,
    faction+': construction finishes through the normal production clock');
  assert.ok(g.saveGame()&&g.loadGame(),
    faction+': restored radar must survive legacy save/load');

  reset();
  g.add(1,'factory',24,23);g.add(1,'generator',21,24);
  g.time=300;g.players[1].credits=1200;
  const radarHq=alive(g,'hq')[0];
  g.add(0,'soldier',radarHq.x+1,radarHq.y+1);
  g.runAI();
  assert.ok(g.players[1].credits<1200,
    faction+': visible base attack releases radar savings for defense');

  reset();
  g.add(1,'factory',24,23);g.add(1,'generator',21,24);
  g.time=300;g.players[1].credits=1200;
  for(const tank of [...alive(g,'tank'),...alive(g,'heavy')])tank.hp=0;
  g.runAI();
  assert.ok(g.queues.some(q=>q.side===1),
    faction+': a destroyed ground screen releases radar savings for recruitment');

  reset();
  g.add(1,'factory',24,23);g.add(1,'generator',21,24);
  g.time=300;g.players[1].credits=1200;
  alive(g,'harvester')[0].hp=0;
  g.runAI();
  assert.equal(queued(g,'harvester').length,1,
    faction+': replace lost income instead of banking for radar');

  // A safe AI brownout must not spend its last credits on optional soldiers
  // while it is trying to afford the 650-credit generator. This uses the
  // actual planner, actual power consumption and normal paid construction.
  reset();
  g.add(1,'factory',24,23);g.add(1,'radar',23,25);
  g.time=180;g.players[1].credits=600;
  assert.equal(g.power(1).low,true,faction+': fixture needs a real brownout');
  const generatorsBefore=alive(g,'generator').length;
  g.runAI();g.runAI();
  assert.equal(g.players[1].credits,600,
    faction+': safe brownout must preserve the generator budget');
  assert.equal(g.queues.filter(q=>q.side===1).length,0,
    faction+': optional recruitment cannot starve power recovery');
  g.players[1].credits=650;
  g.runAI();
  assert.equal(alive(g,'generator').length,generatorsBefore+1,
    faction+': a funded generator uses real construction');
  assert.equal(g.players[1].credits,0,
    faction+': generator costs its full 650 credits');
  assert.equal(alive(g,'generator').filter(b=>!b.built).length,1,
    faction+': power recovery is not instant');
  g.players[1].credits=900;g.runAI();
  assert.equal(alive(g,'generator').length,generatorsBefore+1,
    faction+': unfinished generator prevents duplicate purchases');
  assert.equal(g.players[1].credits,900,
    faction+': no optional purchases before pending generator completes');
  assert.equal(g.queues.filter(q=>q.side===1).length,0);
  assert.ok(g.saveGame()&&g.loadGame(),
    faction+': pending generator remains compatible with legacy saves');
  const pending=alive(g,'generator').find(b=>!b.built);
  assert.ok(pending,'pending paid generator survives load');
  pending.built=true;pending.construction=1;
  assert.equal(g.power(1).low,false,'completed generator restores normal power');
  g.runAI();
  assert.ok(g.queues.some(q=>q.side===1),
    faction+': normal recruitment resumes after power restoration');

  // Observed invasion overrides the savings gate; the AI may still defend.
  reset();
  g.add(1,'factory',24,23);g.add(1,'radar',23,25);
  g.time=180;g.players[1].credits=600;
  const powerHq=alive(g,'hq')[0];
  g.add(0,'soldier',powerHq.x+1,powerHq.y+1);
  g.runAI();
  assert.ok(g.queues.some(q=>q.side===1),
    faction+': visible base invasion overrides generator banking');
}
console.log('PASS: three-faction ore expansion, radar and brownout reserves, emergency overrides and saves');
