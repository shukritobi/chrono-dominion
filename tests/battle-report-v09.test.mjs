import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const script=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__v09Game = new Game();');
const scriptMaps=readFileSync(new URL('../maps/catalog.js',import.meta.url),'utf8');
const ctx=new Proxy({}, {get:(t,k)=>t[k]??(()=>{}),set:(t,k,v)=>{t[k]=v;return true}});
const elements=new Map();
const document={getElementById(id){
  if(!elements.has(id))elements.set(id,{
    style:{},value:'',disabled:false,width:272,height:144,
    classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return[]},
    getContext(){return ctx},
    getBoundingClientRect(){return{width:id==='world'?1024:272,height:id==='world'?700:144,left:0,top:0}},
    set innerHTML(v){this._html=v},get innerHTML(){return this._html||''},
    set textContent(v){this._text=v},get textContent(){return this._text||''}
  });
  return elements.get(id);
}};
const memory=new Map();
const localStorage={
  getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v))
};
const win={addEventListener(){}};
let copiedReport='';
const navigator={clipboard:{writeText(text){copiedReport=text;return Promise.resolve();}}};
const globals={window:win,document,localStorage,navigator,console,performance:{now:()=>0},
  requestAnimationFrame(){},devicePixelRatio:1,setTimeout:()=>1,clearTimeout(){}};
runInNewContext(scriptMaps,globals,{timeout:2500});
assert.equal(Object.keys(win.ChronoMapCatalog).length,3);
runInNewContext(script,globals,{timeout:3500});
const g=win.__v09Game;
for(const map of ['verdant','desert','snow']){
  const source=JSON.parse(readFileSync(new URL('../maps/'+map+'.json',import.meta.url),'utf8'));
  const runtime=win.ChronoMapCatalog[map];
  assert.equal(JSON.stringify(runtime),JSON.stringify(source),'compiled '+map+' matches editable JSON');
  g.newMatch({playerFaction:'coalition',enemyFaction:'federation',map,difficulty:'recruit',startingCredits:5000});
  const r=source.waterRects[0];
  assert.equal(g.water((r[0]+r[1])/2,(r[2]+r[3])/2),true,'JSON blocked terrain is active');
  assert.equal(g.ores.every(o=>!g.water(o.x,o.y)),true,'ore is on valid land');
}
g.newMatch({playerFaction:'coalition',enemyFaction:'federation',map:'verdant',difficulty:'recruit'});
const original=g.stats[0].unitsDeployed;
const enemy=g.entities.find(e=>e.owner===1&&e.kind==='soldier');
assert.ok(original>0,'starting units are tracked');
g.recordLoss(enemy,0);
g.recordLoss(enemy,0);
assert.equal(g.stats[0].enemyUnitsDestroyed,1,'kill is counted once');
assert.equal(g.stats[1].unitsLost,1,'loss is counted on victim side');
g.add(0,'tank',14,14);
assert.equal(g.stats[0].unitsDeployed,original+1,'recruitment is counted');
g.players[0].credits=3921;g.stats[0].oreHarvested=1060;g.stats[0].damageDealt=500;
const report=g.battleSummary(true);
assert.equal(report.outcome,'VICTORY');
assert.equal(report.player.oreHarvested,1060);
assert.ok(report.player.score>0);
assert.ok(g.saveGame(),'battle counters included in save');
g.stats[0].oreHarvested=0;
assert.equal(g.loadGame(),true);
assert.equal(g.stats[0].oreHarvested,1060,'score state survives save/load');
g.finish(true);
assert.equal(elements.get('resultTitle').textContent,'VICTORY');
assert.ok(elements.get('resultStats').innerHTML.includes('ORE DELIVERED'));
assert.ok(elements.get('resultStats').innerHTML.includes('UNITS DESTROYED'));
assert.equal(g.copyBattleReport(),true,'report copying is available');
assert.ok(copiedReport.includes('\n'),'copied report is genuinely multiline');
// An AI recon must advance to another waypoint when the previous one is reached.
g.newMatch({playerFaction:'coalition',enemyFaction:'federation',map:'verdant',difficulty:'recruit'});
const recon=g.add(1,'recon',24,24);g.runAI();
assert.ok(recon.order?.type==='attackMove'||recon.order?.type==='attack');
const firstIndex=recon.patrolIndex||0;
if(recon.order?.type==='attackMove'){
  recon.x=recon.order.x;recon.y=recon.order.y;recon.order=null;
  g.runAI();
  assert.notEqual(recon.patrolIndex,firstIndex,'AI recon moves to next patrol waypoint');
}
console.log('PASS: external JSON maps, score accounting, victory report, save compatibility and AI patrol routes');
