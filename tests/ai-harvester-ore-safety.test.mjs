import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Use the production harvester selector, including actual faction visibility.
// Navigation is isolated here; the existing ore-reachability suite tests
// real paths, blocked deposits, stalled workers and save compatibility.
const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const noop=()=>{};
const drawing=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',style:{},disabled:false,dataset:{},
    classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
    setAttribute:noop,addEventListener:noop,querySelectorAll:()=>[],
    querySelector:()=>({disabled:true,textContent:''}),getContext:()=>drawing,
    getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
    set innerHTML(v){this._html=v;},get innerHTML(){return this._html||'';},
    set textContent(v){this._text=v;},get textContent(){return this._text||'';}
  });return nodes.get(id);
}};
const window={addEventListener:noop};
runInNewContext(source,{window,document,console,performance:{now:()=>0},
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},
  devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop
},{timeout:10000});
const g=window.__game;
g.updateUI=noop;g.notify=noop;g.draw=noop;

for(const faction of ['coalition','federation','psionic']){
  g.newMatch({map:'verdant',difficulty:'standard',startingCredits:5000,
    playerFaction:'coalition',enemyFaction:faction});
  g.entities=[];g.ores=[
    {x:12,y:10,amount:2000,max:2000},
    {x:10,y:13,amount:2000,max:2000}
  ];
  const harvester=g.add(1,'harvester',10,10);
  // Test threat ranking separately from terrain collision and A*.
  g.canOccupyUnit=()=>true;
  g.findPath=(x,y,tx,ty)=>[{x:tx,y:ty}];
  assert.equal(g.chooseHarvestDeposit(harvester),0,
    faction+': nearest unthreatened deposit wins');

  // A friendly observer makes the nearby guard visible without omniscience.
  g.add(1,'recon',14,10);
  const enemy=g.add(0,'soldier',15,10);
  assert.equal(g.sideCanSee(1,enemy),true,
    faction+': enemy must be actually visible to the AI');
  assert.equal(g.chooseHarvestDeposit(harvester),1,
    faction+': visible fighter makes the nearby deposit less desirable');

  const see=g.sideCanSee;
  g.sideCanSee=()=>false;
  assert.equal(g.chooseHarvestDeposit(harvester),0,
    faction+': physically present but unseen enemy must not influence mining');
  g.sideCanSee=see;

  enemy.hp=0;
  const turret=g.add(0,'turret',16,10);
  assert.equal(g.chooseHarvestDeposit(harvester),1,
    faction+': detected armed structure also makes a deposit risky');

  const distantFighter=g.add(0,'soldier',10,14);
  assert.equal(g.sideCanSee(1,distantFighter),true);
  assert.equal(g.chooseHarvestDeposit(harvester),0,
    faction+': when both deposits are dangerous, continue mining nearest');

  distantFighter.hp=0;
  const originalPath=g.findPath;
  g.findPath=(x,y,tx,ty)=>tx===10&&ty===13?[]:[{x:tx,y:ty}];
  assert.equal(g.chooseHarvestDeposit(harvester),0,
    faction+': an unreachable safer deposit must not strand the harvester');
  g.findPath=originalPath;

  // Do not change the player-controlled harvester's established behavior.
  const playerHarvester=g.add(0,'harvester',10,10);
  turret.hp=0;
  g.add(1,'soldier',12,10);
  assert.equal(g.chooseHarvestDeposit(playerHarvester),0,
    faction+': player mining remains nearest-reachable ore');

  // No new persisted routing state or save-schema migration.
  g.newMatch({map:'verdant',difficulty:'standard',startingCredits:5000,
    playerFaction:'coalition',enemyFaction:faction});
  assert.equal(g.saveGame(),true);
  assert.equal(g.loadGame(),true);
}
console.log('PASS: three-faction fog-honest safe ore choice, bounded fallback, paths and legacy saves');
