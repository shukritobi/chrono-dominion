import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const noop=()=>{},canvas=new Proxy({},{get:(o,k)=>o[k]??noop,
  set:(o,k,v)=>{o[k]=v;return true;}});
const dom=new Map(),storage=new Map();
const document={getElementById(id){
  if(!dom.has(id))dom.set(id,{
    id,value:'',style:{},dataset:{},disabled:false,
    classList:{add:noop,remove:noop,toggle:noop},addEventListener:noop,
    setAttribute:noop,querySelectorAll:()=>[],
    querySelector:()=>({disabled:true,textContent:''}),getContext:()=>canvas,
    getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
    set innerHTML(v){this._h=v},get innerHTML(){return this._h||''},
    set textContent(v){this._t=v},get textContent(){return this._t||''}
  });return dom.get(id);
}};
const window={addEventListener:noop};
runInNewContext(source,{window,document,console,performance:{now:()=>0},
  devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop,
  localStorage:{getItem:k=>storage.get(k)??null,
    setItem:(k,v)=>storage.set(k,String(v))}
},{timeout:10000});
const g=window.__game;
const settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000};
function scenario(support){
  g.newMatch(settings);g.time=110;
  const base=g.entities.find(e=>e.owner===1&&e.kind==='hq');
  const members=[g.add(1,'soldier',25,23),g.add(1,'soldier',26,23),
    g.add(1,'soldier',23,22)];
  const visible=g.add(0,'soldier',25,24);
  const report={id:90000,kind:'factory',type:'building',x:21,y:23,time:109};
  const slots=[{x:23,y:20},{x:23,y:21},{x:23,y:22}];
  const plan={phase:'rally',ids:members.map(u=>u.id),slots,
    targetId:report.id,targetTime:report.time,
    target:{x:report.x,y:report.y},startedAt:100};
  if(support)g.aiSupportPlatoon=plan;
  else g.aiPlatoon=plan;
  members[0].order=null;
  members[1].order={type:'attack',id:visible.id};
  members[2].order=null;
  const coordinate=()=>support?
    g.coordinateAISupport(members,[report],base,false,new Set()):
    g.coordinateAIPlatoon(members,[report],base,false);
  assert.ok(g.sideCanSee(1,visible),'active contact is truly visible');
  const originalAttack=members[1].order;
  const selected=coordinate();
  assert.equal(selected.size,3,'existing platoon members are retained');
  assert.equal(plan.phase,'rally','a single early arrival does not launch assault');
  assert.equal(members[0].order.type,'move','idle member resumes assigned rally');
  assert.deepEqual({...members[0].order},{type:'move',x:23,y:20});
  assert.equal(members[1].order,originalAttack,
    'a visible tactical target is not interrupted by rally recovery');
  assert.equal(members[2].order,null,'already arrived member stays idle');
  assert.equal(g.aiRallyResumes,1,'only one lost order was restored');
  const stable=members[0].order;
  coordinate();
  assert.equal(members[0].order,stable,'repeated AI ticks do not reset a valid path');
  assert.equal(g.aiRallyResumes,1,'no redundant recovery counted');
  visible.x=2;visible.y=2;
  assert.equal(g.sideCanSee(1,visible),false,'old target is no longer observed');
  coordinate();
  assert.deepEqual({...members[1].order},{type:'move',x:23,y:21},
    'after contact is lost, the member returns to its original slot');
  assert.equal(g.aiRallyResumes,2);
  members[0].engaging=true;members[0].order=null;
  coordinate();
  assert.equal(members[0].order,null,'active auto-engagement remains protected');
  members[0].engaging=false;
  coordinate();
  assert.equal(members[0].order.type,'move',
    'after auto-engagement ends, staging resumes');
  assert.equal(g.aiRallyResumes,3);
  assert.ok(g.saveGame()&&g.loadGame(),'legacy skirmish saves remain compatible');
  assert.equal(g.aiRallyResumes,0,'recovery telemetry is transient across loads');
  assert.equal((support?g.aiSupportPlatoon:g.aiPlatoon)?.phase,'rally',
    'saved squad staging survives reload');
}
scenario(false);
scenario(true);
g.newMatch(settings);
assert.equal(g.aiRallyResumes,0,'new matches clear rally telemetry');
console.log('PASS: v2.20 primary/support rally recovery, visible defense, idle arrival, stable routes and saves');
