import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Exercise the real construction planner and placement rules, not a mock AI.
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

for(const faction of ['coalition','federation','psionic']){
  const g=game();
  const reset=()=>g.newMatch({map:'verdant',difficulty:'standard',
    playerFaction:'coalition',enemyFaction:faction,startingCredits:5000});
  const prerequisites=()=>{
    g.add(1,'factory',24,23);g.add(1,'radar',23,25);
    g.add(1,'generator',21,24);g.add(1,'generator',22,20);
  };
  reset();prerequisites();g.time=150;g.players[1].credits=2400;
  assert.equal(g.power(1).low,false,faction+': powered prerequisites required');
  assert.ok(g.prereq(1,'airfield'),faction+': factory and radar unlock aviation');
  const before=g.players[1].credits,spent=g.stats[1].creditsSpent;
  g.runAI();
  const fields=g.entities.filter(e=>e.owner===1&&e.kind==='airfield'&&e.hp>0);
  assert.equal(fields.length,1,faction+': affordable Air Command must be constructed');
  assert.equal(fields[0].built,false,'normal construction timer required');
  assert.ok(before-g.players[1].credits>=1750,'Air Command must cost at least 1750 credits');
  assert.ok(g.stats[1].creditsSpent-spent>=1750,'spending telemetry must record Air Command');
  assert.ok(g.saveGame()&&g.loadGame(),'construction must survive save/load');
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='airfield').length,1);

  reset();prerequisites();
  g.add(1,'tank',24,20);g.add(1,'tank',23,19);
  g.time=150;g.players[1].credits=1800;g.queues=[];
  const bank=g.players[1].credits;
  g.runAI();
  assert.equal(g.players[1].credits,bank,
    faction+': safe two-tank base should bank credits toward aviation');
  assert.equal(g.queues.filter(q=>q.side===1).length,0,
    faction+': routine tank recruitment must pause during aviation saving');
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='turret').length,0,
    faction+': optional turret must not consume the aviation reserve');

  // In a long contested match one of two tanks may be destroyed before
  // Air Command funding completes. A surviving tank should still protect
  // the aviation budget when the base is not under observed attack.
  reset();prerequisites();g.add(1,'tank',23,21);
  g.time=260;g.players[1].credits=1800;g.queues=[];
  g.runAI();
  assert.equal(g.players[1].credits,1800,
    faction+': late one-tank base must preserve Air Command savings');
  assert.equal(g.queues.filter(q=>q.side===1).length,0,
    faction+': late one-tank airfield reserve must block optional recruitment');

  // Do not compromise early ground defenses: before 240 seconds, one
  // tank is not a sufficient screen for the same saving rule.
  reset();prerequisites();g.add(1,'tank',23,21);
  g.time=150;g.players[1].credits=1800;g.queues=[];
  g.runAI();
  assert.ok(g.queues.some(q=>q.side===1&&q.key!=='aircraft'),
    faction+': early one-tank base should continue recruiting');

  // An observed attack cancels saving even in a mature base.
  reset();prerequisites();g.add(1,'tank',23,21);
  const home=g.entities.find(e=>e.owner===1&&e.kind==='hq');
  g.add(0,'soldier',home.x+1,home.y+1);
  g.time=260;g.players[1].credits=1800;g.queues=[];
  g.runAI();
  assert.ok(g.queues.some(q=>q.side===1&&q.key!=='aircraft'),
    faction+': detected invasion must override late aviation savings');

  reset();prerequisites();g.time=150;g.players[1].credits=2399;
  g.runAI();
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='airfield').length,0,
    faction+': emergency generator reserve must be respected');

  reset();g.add(1,'factory',24,23);g.add(1,'generator',21,24);
  g.time=150;g.players[1].credits=5000;g.runAI();
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='airfield').length,0,
    faction+': cannot bypass radar prerequisite');

  reset();g.add(1,'factory',24,23);g.add(1,'radar',23,25);
  g.time=150;g.players[1].credits=5000;
  assert.equal(g.power(1).low,true,'brownout fixture must be unpowered');
  g.runAI();
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='airfield').length,0,
    faction+': power recovery must precede aviation');
}
console.log('PASS: affordable AI aviation across three factions, power reserve, prerequisites and saves');
