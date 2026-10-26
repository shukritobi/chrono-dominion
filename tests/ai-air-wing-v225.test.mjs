import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const noop=()=>{},canvas=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',disabled:false,style:{},dataset:{},
    classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
    addEventListener:noop,setAttribute:noop,querySelectorAll:()=>[],
    querySelector:()=>({disabled:true,textContent:''}),
    getContext:()=>canvas,setPointerCapture:noop,
    getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
    set innerHTML(v){this._html=v},get innerHTML(){return this._html||''},
    set textContent(v){this._text=v},get textContent(){return this._text||''}
  });
  return nodes.get(id);
}};
const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
const window={addEventListener:noop};
runInNewContext(read('maps/catalog.js'),{window,console},{timeout:1000});
runInNewContext(read('game.js').replace('  new Game();','  window.__game=new Game();'),
  {window,document,console,localStorage,performance:{now:()=>0},
    devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop},
  {timeout:10000});
const g=window.__game;
const settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000};
const reset=()=>g.newMatch(settings);
const home=()=>g.entities.find(e=>e.owner===1&&e.kind==='hq');
const addTech=()=>{
  g.add(1,'factory',21,23);g.add(1,'radar',22,21);g.add(1,'tech',19,22);
  for(let i=0;i<4;i++)g.add(1,'generator',17+i,19);
};

// An AI with the actual tech prerequisites and an economy can construct Air Command.
reset();addTech();g.time=150;g.players[1].credits=7000;
const previousCanPlace=g.canPlace.bind(g);
g.canPlace=()=>true; // isolate tech choice from map-specific build-slot availability
g.runAI();
g.canPlace=previousCanPlace;
const construction=g.entities.find(e=>e.owner===1&&e.kind==='airfield');
assert.ok(construction,'AI should order Air Command once prerequisites are satisfied');
assert.equal(construction.built,false,'construction uses the normal building pipeline');

// Production should purchase aircraft through the existing queue, with a two-plane cap.
reset();addTech();g.add(1,'airfield',23,20);g.add(1,'recon',22,23);
g.add(1,'specialist',23,24);g.add(1,'tank',22,24);
g.time=260;g.players[1].credits=7000;g.queues=[];
g.runAI();
assert.equal(g.queues.find(q=>q.side===1)?.key,'aircraft',
  'aircraft should enter the normal paid production queue');
g.queues=[];g.add(1,'aircraft',21,20);g.add(1,'aircraft',22,20);
g.runAI();
assert.notEqual(g.queues.find(q=>q.side===1)?.key,'aircraft',
  'AI should not buy a third living aircraft');

// No omniscient target selection: unreported enemies cannot receive direct
// attack orders, and an observed but now hidden building uses old coordinates.
reset();
const plane=g.add(1,'aircraft',24,24),base=home();
const hidden=g.add(0,'turret',9,9);
g.aiExplored=new Set();
g.coordinateAIAirWing([plane],[],base,[]);
assert.notEqual(plane.order?.type,'attack','hidden enemies must not be attacked');
assert.notEqual(plane.order?.type,'attackMove','unreported structures must not be targeted');
const report={id:hidden.id,x:10,y:10,time:20,type:'building',kind:'turret'};
g.time=25;hidden.x=7;hidden.y=7;
g.coordinateAIAirWing([plane],[report],base,[]);
assert.equal(plane.order?.type,'attackMove','remembered objectives get movement orders');
assert.equal(plane.order.x,10,'last-seen X is used, not the hidden live X');
assert.equal(plane.order.y,10,'last-seen Y is used, not the hidden live Y');

// A genuinely visible threat can be directly engaged; air units must not
// be added to ground-only assault squads or occupy ground rally slots.
const intruder=g.add(0,'soldier',base.x+1,base.y+1);
g.coordinateAIAirWing([plane],[report],base,[intruder]);
assert.equal(plane.order?.type,'attack');
assert.equal(plane.order.id,intruder.id);
g.runAI();
assert.ok(!g.aiPlatoon?.ids.includes(plane.id));
assert.ok(!g.aiSupportPlatoon?.ids.includes(plane.id));

// No new persistent fields; existing v1 saves keep air orders.
assert.ok(g.saveGame());
assert.ok(g.loadGame());
assert.equal(g.entityById(plane.id)?.order?.type,'attack');
assert.equal(g.entityById(plane.id)?.order?.id,intruder.id);
console.log('PASS: AI airfield, paid aircraft queue, sensor-only air wing and v1 saves');
