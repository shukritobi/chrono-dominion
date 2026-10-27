import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Real AI construction/production planner, not a mocked unit-selection function.
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
  const reset=(airfieldBuilt=true)=>{
    g.newMatch({map:'verdant',difficulty:'standard',
      playerFaction:'coalition',enemyFaction:faction,startingCredits:5000});
    g.add(1,'factory',24,23);g.add(1,'radar',23,25);
    g.add(1,'generator',21,24);g.add(1,'generator',22,20);
    g.add(1,'airfield',15,15,airfieldBuilt);
    g.add(1,'tank',23,21);
    g.time=260;g.queues=[];
    assert.equal(g.power(1).low,false,'fixture must be powered');
    assert.equal(g.prereq(1,'aircraft'),airfieldBuilt,
      'only an operational airfield can produce aircraft');
  };

  reset();
  g.players[1].credits=1800;
  const savedCredits=g.players[1].credits;
  g.runAI();
  assert.equal(g.players[1].credits,savedCredits,
    faction+': safe airbase must bank instead of buying optional defenses or ground units');
  assert.equal(g.queues.filter(q=>q.side===1).length,0,
    faction+': no low-cost queue should interrupt aircraft savings');
  assert.equal(g.entities.filter(e=>e.owner===1&&['tech','turret'].includes(e.kind)).length,0,
    faction+': optional tech and turrets must not consume aviation reserve');

  // The reserve is exactly the cost of a generator, and the aircraft must
  // beat optional recon/specialist production even when neither is owned.
  g.players[1].credits=2249;
  g.runAI();
  assert.equal(g.queues.filter(q=>q.side===1).length,0,
    faction+': cannot spend emergency generator reserve');
  g.players[1].credits=2250;
  const spent=g.stats[1].creditsSpent;
  g.runAI();
  assert.equal(g.queues.find(q=>q.side===1)?.key,'aircraft',
    faction+': paid aircraft must outrank optional recruitment');
  assert.equal(g.players[1].credits,650,'emergency generator credits must remain');
  assert.equal(g.stats[1].creditsSpent-spent,1600,'real aircraft cost must be recorded');
  g.advanceProduction(10);
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='aircraft'&&e.hp>0).length,1,
    faction+': paid aircraft must deploy through the real production pipeline');
  assert.ok(g.saveGame()&&g.loadGame(),'aircraft and budget must survive v1 save/load');
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='aircraft').length,1);
  g.queues=[];g.players[1].credits=1800;
  g.runAI();
  assert.equal(g.queues.filter(q=>q.side===1).length,0,
    faction+': AI should also bank for its second plane');

  reset(false);
  g.players[1].credits=2300;
  g.runAI();
  assert.equal(g.queues.filter(q=>q.side===1).length,0,
    faction+': save while the paid airfield is still under construction');
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='turret').length,0,
    faction+': unfinished airfield must not trigger optional turret spending');

  reset();
  const base=g.entities.find(e=>e.owner===1&&e.kind==='hq');
  g.add(0,'soldier',base.x+1,base.y+1);
  g.players[1].credits=1800;
  g.runAI();
  assert.ok(g.queues.some(q=>q.side===1&&q.key!=='aircraft'),
    faction+': observed nearby invasion must restore defensive recruitment');

  reset();
  const harvester=g.entities.find(e=>e.owner===1&&e.kind==='harvester');
  harvester.hp=0;g.players[1].credits=1000;
  g.runAI();
  assert.equal(g.queues.find(q=>q.side===1)?.key,'harvester',
    faction+': lost harvester must be replaced before aircraft saving');
}
console.log('PASS: three-faction aircraft funding, paid deployment, emergency reserve, threats, harvesters and saves');
