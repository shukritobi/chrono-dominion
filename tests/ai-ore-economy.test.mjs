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
  g.time=100;g.players[1].credits=1800;
  assert.equal(g.power(1).low,false,'aviation saving fixture must be powered');
  g.runAI();
  assert.equal(queued(g,'harvester').length,0,
    faction+': do not divert Air Command savings to extra harvesters');
  assert.equal(g.players[1].credits,1800,
    faction+': keep the entire Air Command reserve while banking');

  reset();
  alive(g,'harvester')[0].hp=0;
  g.runAI();
  assert.equal(queued(g,'harvester').length,1,
    faction+': replacing the only lost harvester remains higher priority');
}
console.log('PASS: three-faction paid early ore expansion, cap, reserves, threats, power, aviation and saves');
