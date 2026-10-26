import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',disabled:false,style:{},classList:{add(){},remove(){},toggle(){}},
    addEventListener(){},setAttribute(){},querySelectorAll(){return[];},
    querySelector(){return{disabled:true,textContent:''}},getContext(){return ctx},
    getBoundingClientRect(){return{left:0,top:0,width:id==='world'?1024:272,
      height:id==='world'?700:144}},
    set innerHTML(v){this._h=v},get innerHTML(){return this._h||''},
    set textContent(v){this._t=v},get textContent(){return this._t||''}
  });return nodes.get(id);
}};
const window={addEventListener(){}};
runInNewContext(source,{
  window,document,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},
  console,performance:{now:()=>0},setTimeout(){return 1},clearTimeout(){},
  requestAnimationFrame(){},devicePixelRatio:1
},{timeout:10000});
const g=window.__game;
const settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000};
g.newMatch(settings);
let brief=g.playerReconSummary();
assert.ok(brief.seen>0&&brief.percent>0&&brief.percent<75);
assert.ok(brief.visible>0&&brief.visible<=brief.seen);
assert.equal(brief.tracked,0,'enemy base must not be in initial intelligence');
assert.match(nodes.get('reconStatus').innerHTML,/NO ENEMY CONTACT RECORDED/);
const hq=g.entities.find(e=>e.owner===1&&e.kind==='hq');
assert.ok(hq);
assert.equal(g.centerIntelContact(hq.id),false,'no jump to unseen target');
const recon=g.add(0,'recon',23,23);
g.time=10;g.updateFog();g.updateIntel(0);g.updateUI(true);
brief=g.playerReconSummary();
assert.ok(brief.tracked>0,'scout actually observes hostile units and structures');
assert.ok(brief.live>0);
assert.ok(brief.latest);
assert.match(nodes.get('reconStatus').innerHTML,/data-contact-id=/);
const seenReport=g.intel[0].find(c=>c.id===hq.id);
assert.ok(seenReport,'HQ discovery requires real sight');
const last={x:seenReport.x,y:seenReport.y};
recon.x=11;recon.y=15;g.time=17;g.updateFog();g.updateIntel(0);
assert.equal(g.sideCanSee(0,hq),false);
brief=g.playerReconSummary();
assert.ok(brief.tracked>0,'last contact persists after scouts withdraw');
assert.ok(g.centerIntelContact(hq.id),'jump to previously verified last contact');
const point={x:(last.x-last.y)*24,y:(last.x+last.y)*12};
assert.ok(Math.abs(g.camera.x-point.x)<.001&&Math.abs(g.camera.y-point.y)<.001,
  'map jump goes to historical coordinates');
assert.equal(g.centerIntelContact(-42),false);
assert.equal(g.saveGame(),true);
g.intel[0]=[];
assert.equal(g.loadGame(),true);
assert.ok(g.intel[0].some(c=>c.id===hq.id),'saved intelligence restored');
const hostile=g.entities.find(e=>e.owner===1&&e.kind==='soldier');
hostile.x=7;hostile.y=7;g.time=25;
g.updateFog();g.updateIntel(0);g.checkPlayerThreats();
assert.match(nodes.get('toast').textContent,/BASE ALERT/);
const initial=g.reconAlerts.get(hostile.id);
assert.equal(initial,25);
g.time=26;g.updateIntel(0);g.checkPlayerThreats();
assert.equal(g.reconAlerts.get(hostile.id),initial,'repeated detections are throttled');
g.time=44;g.updateIntel(0);g.checkPlayerThreats();
assert.equal(g.reconAlerts.get(hostile.id),44,'new alert allowed after cooldown');
g.newMatch({...settings,map:'snow'});
assert.equal(g.reconAlerts.size,0,'new battle resets alert cooldown');
assert.equal(g.playerReconSummary().tracked,0,'new battle has no enemy intelligence');
g.draw();
console.log('PASS: recon HUD, fog-limited contacts, last-known jump, cooldown, saves and reset');