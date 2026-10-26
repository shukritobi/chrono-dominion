import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const context=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',style:{},disabled:false,dataset:{},
    classList:{add(){},remove(){},toggle(){}},
    addEventListener(){},setAttribute(){},querySelectorAll(){return[];},
    querySelector(){return{disabled:true,textContent:''}},
    getContext(){return context},
    getBoundingClientRect(){return{left:0,top:0,width:id==='world'?1024:272,height:id==='world'?700:144}},
    set innerHTML(v){this._html=v},get innerHTML(){return this._html||''},
    set textContent(v){this._text=v},get textContent(){return this._text||''}
  });return nodes.get(id);
}};
const window={addEventListener(){}};
runInNewContext(source,{window,document,console,performance:{now:()=>0},devicePixelRatio:1,
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},
  setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){}
},{timeout:10000});
const g=window.__game;
const settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000};
g.newMatch(settings);
const playerBase=g.entities.find(e=>e.owner===0&&e.kind==='hq');
assert.equal(g.sideCanSee(1,playerBase),false);
const scout=g.add(1,'recon',17,23);
g.updateAISurvey();
const candidates=g.scoutFrontiers(scout);
assert.ok(candidates.length>0&&candidates.length<=14,'frontier path checking is bounded');
assert.ok(candidates.every(c=>g.aiExplored.has(c.point.x+','+c.point.y)));
assert.ok(candidates.every(c=>g.scoutSurveyValue(c.point)>=5));
assert.ok(candidates.every(c=>!g.water(c.point.x,c.point.y)));
const landmarks=new Set(g.scoutWaypoints().map(p=>p.x+','+p.y));
assert.ok(candidates.some(c=>!landmarks.has(c.point.x+','+c.point.y)),
  'scouts consider objectives outside preset sector and ore positions');
assert.ok(g.intel[1].every(c=>c.id!==playerBase.id),'planning cannot reveal unseen structures');
const originalLandmarks=g.scoutWaypoints.bind(g);
g.scoutWaypoints=()=>[];
assert.equal(g.assignScoutPatrol(scout),true,'dynamic exploration works without fixed landmarks');
assert.equal(scout.order.type,'move');
const order={...scout.order},before=g.aiExplored.size;
scout.x=order.x;scout.y=order.y;
g.updateAISurvey();
assert.ok(g.aiExplored.size>before,'arrival at chosen frontier actually discovers terrain');
scout.x=17;scout.y=23;scout.order=null;
const second=g.add(1,'recon',17.7,23);
g.updateAISurvey();
assert.equal(g.assignScoutPatrol(scout),true);
assert.equal(g.assignScoutPatrol(second),true,'multiple scouts can explore independently');
assert.ok(Math.hypot(scout.order.x-second.order.x,scout.order.y-second.order.y)>=4.1,
  'scouts reserve separate frontier objectives');
const originalPath=g.findPath.bind(g);
g.findPath=()=>[];scout.order=null;
assert.equal(g.assignScoutPatrol(scout),false,'unreachable frontiers do not create orders');
assert.equal(scout.order,null);
g.findPath=originalPath;g.scoutWaypoints=originalLandmarks;
g.aiExplored=new Set();
for(let x=0;x<34;x++)for(let y=0;y<34;y++)g.aiExplored.add(x+','+y);
assert.equal(g.scoutFrontiers(scout).length,0,'no frontier if map is fully surveyed');
assert.equal(g.assignScoutPatrol(scout),true,'old landmark routes provide fallback');
g.newMatch({...settings,map:'desert'});
assert.ok(!g.aiExplored.has('5,6'),'fresh match resets AI survey memory');
g.draw();
console.log('PASS: dynamic fog-frontier reconnaissance, bounded candidates, coverage improvement, multiple scouts, unreachable routes and fallback');