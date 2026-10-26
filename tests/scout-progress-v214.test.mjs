import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const noop=()=>{},canvas=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',style:{},dataset:{},disabled:false,
    classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,setAttribute:noop,
    querySelectorAll:()=>[],querySelector:()=>({disabled:true,textContent:''}),getContext:()=>canvas,
    getBoundingClientRect:()=>({left:0,top:0,width:id==='world'?1024:272,height:id==='world'?700:144}),
    set innerHTML(v){this._h=v},get innerHTML(){return this._h||''},
    set textContent(v){this._t=v},get textContent(){return this._t||''}
  });return nodes.get(id);
}};
const window={addEventListener:noop};
runInNewContext(source,{window,document,console,devicePixelRatio:1,performance:{now:()=>0},
  requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop,
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))}
},{timeout:10000});
const g=window.__game;
g.newMatch({playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000});
const home=g.entities.find(u=>u.owner===1&&u.kind==='hq');
const scout=g.add(1,'recon',home.x-1,home.y-1);
const near={x:home.x-4,y:home.y-4};
const far={x:home.x-16,y:home.y-16};
assert.ok(g.scoutAdvanceScore(far,80)>g.scoutAdvanceScore(near,80),
  'scouts are rewarded for revealing farther uncharted sectors');
assert.equal(g.scoutAdvanceScore(far,3),0,'surveyed territory gives no progress bonus');
const originalWaypoints=g.scoutWaypoints.bind(g);
const originalFrontiers=g.scoutFrontiers.bind(g);
const originalPath=g.scoutPath.bind(g);
const originalWalkable=g.walkable.bind(g);
const originalSurvey=g.scoutSurveyValue.bind(g);
g.scoutWaypoints=()=>[near,far];g.scoutFrontiers=()=>[];
g.walkable=()=>true;g.scoutSurveyValue=()=>80;
g.scoutPath=(_s,p)=>({path:Array(9).fill(p),exposure:0,worst:0});
assert.equal(g.assignScoutPatrol(scout),true);
assert.equal(scout.order.x,far.x,'all else equal, choose farther unexplored target');
assert.equal(scout.order.y,far.y);
const originalScore=g.scoutAdvanceScore(far,80);
g.entities.push({id:99009,owner:0,type:'building',kind:'hq',x:8,y:8,
  hp:100,maxHp:100,built:true});
assert.equal(g.scoutAdvanceScore(far,80),originalScore,
  'unseen enemy HQ cannot affect exploration scoring');
g.entities.pop();
g.intel[1]=[{id:99009,type:'building',kind:'hq',x:8,y:8,time:g.time}];
assert.equal(g.scoutAdvanceScore(far,80),0,'actual enemy building report stops bonus');
g.intel[1]=[{id:99009,type:'building',kind:'hq',x:8,y:8,time:g.time-181}];
assert.ok(g.scoutAdvanceScore(far,80)>0,'expired reports allow broad searching again');
g.scoutWaypoints=originalWaypoints;g.scoutFrontiers=originalFrontiers;
g.scoutPath=originalPath;g.walkable=originalWalkable;g.scoutSurveyValue=originalSurvey;
assert.equal(g.saveGame(),true);
assert.equal(g.loadGame(),true,'no new save fields required');
console.log('PASS: v2.14 distant-frontier scoring, no hidden intel, expirations and save compatibility');
