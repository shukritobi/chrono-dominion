import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Production-engine refinery delivery and legacy save regression. No mock
// credit grants, health changes or altered harvester navigation.
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
  g.entities=[];g.nextId=1;g.time=100;
  g.add(1,'hq',25,24);
  const refinery=g.add(1,'refinery',24,26);
  const worker=g.add(1,'harvester',26,27);
  worker.order={type:'harvest'};
  return {g,refinery,worker};
}
const deliver=(g,worker,credits=1000,load=360)=>{
  g.players[1].credits=credits;
  worker.load=load;worker.work=0;
  const beforeSpent=g.stats[1].creditsSpent;
  const beforeOre=g.stats[1].oreHarvested;
  g.processHarvester(worker,.2);
  return {spent:g.stats[1].creditsSpent-beforeSpent,
    ore:g.stats[1].oreHarvested-beforeOre};
};
for(const faction of ['coalition','federation','psionic']){
  {
    const {g,worker}=game(faction);
    worker.hp=worker.maxHp-100;
    const {spent,ore}=deliver(g,worker,1000);
    assert.equal(ore,360,faction+': delivery must credit full ore cargo');
    assert.equal(spent,45,faction+': 60 hull points cost 45 real credits');
    assert.equal(worker.hp,worker.maxHp-40,faction+': service capped at 60 HP per unload');
    assert.equal(g.players[1].credits,1315,
      faction+': income and paid repairs reconcile exactly');
    assert.equal(worker.load,0);
    g.processHarvester(worker,.1);
    assert.equal(worker.hp,worker.maxHp-40,
      faction+': no second repair without another completed delivery');
    assert.equal(g.stats[1].creditsSpent,spent,
      faction+': no duplicate repair debit between deliveries');
    assert.ok(g.saveGame()&&g.loadGame(),faction+': service preserves v1 save/load');
    assert.equal(g.entityById(worker.id)?.hp,worker.maxHp-40);
    assert.equal(g.players[1].credits,1315);
  }
  {
    const {g,worker}=game(faction);
    worker.hp=worker.maxHp-20;
    const {spent}=deliver(g,worker,1000);
    assert.equal(worker.hp,worker.maxHp,faction+': never overrepair a worker');
    assert.equal(spent,15,faction+': charge only for actual restored health');
  }
  {
    const {g,worker}=game(faction);
    worker.hp=worker.maxHp-100;
    const {spent,ore}=deliver(g,worker,280);
    assert.equal(ore,360,faction+': low cash must not cancel ore delivery');
    assert.equal(worker.hp,worker.maxHp-100,
      faction+': cannot repair below emergency generator reserve');
    assert.equal(spent,0);
    assert.equal(g.players[1].credits,640);
  }
  {
    const {g,worker}=game(faction);
    worker.hp=worker.maxHp-100;
    const {spent}=deliver(g,worker,310);
    assert.ok(Math.abs(worker.hp-(worker.maxHp-100+20/.75))<1e-8,
      faction+': partial repairs use only credits above the reserve');
    assert.ok(Math.abs(spent-20)<1e-8);
    assert.equal(g.players[1].credits,650,
      faction+': never spend reserved generator credits');
  }
  {
    const {g,worker}=game(faction);
    worker.hp=worker.maxHp-100;
    const {spent}=deliver(g,worker,1000,0);
    assert.equal(spent,0,faction+': an empty worker must not receive free service');
    assert.equal(worker.hp,worker.maxHp-100);
  }
  {
    const {g,worker}=game(faction);
    worker.hp=worker.maxHp-100;
    worker.x=35;worker.y=35;
    const {spent}=deliver(g,worker,1000);
    assert.equal(spent,0,faction+': distant worker cannot receive refinery service');
    assert.equal(worker.hp,worker.maxHp-100);
    assert.equal(worker.load,360,faction+': distant loaded truck keeps cargo');
  }
  {
    const {g}=game(faction);
    const human=g.add(0,'harvester',26,27);
    g.add(0,'refinery',24,26);
    human.hp=human.maxHp-100;human.load=360;human.work=0;
    g.players[0].credits=1000;
    g.processHarvester(human,.2);
    assert.equal(human.hp,human.maxHp-100,
      faction+': no unrequested automatic paid repairs for player workers');
  }
}
console.log('PASS: paid AI refinery hull service, generator reserve, exact delivery accounting and v1 saves across three factions');
