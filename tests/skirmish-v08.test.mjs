import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__testGame = new Game();');
const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    style:{},value:'',width:id==='mapPreview'?272:256,height:id==='mapPreview'?144:190,
    classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return[]},
    getContext(){return ctx},getBoundingClientRect(){return{width:id==='world'?1024:256,height:id==='world'?700:190,left:0,top:0}},
    set innerHTML(v){this._html=v},get innerHTML(){return this._html||''},
    set textContent(v){this._text=v},get textContent(){return this._text||''}
  });return nodes.get(id);
}};
const window={addEventListener(){}};
runInNewContext(source,{window,document,console,performance:{now:()=>0},
  requestAnimationFrame(){},devicePixelRatio:1,setTimeout:()=>1,clearTimeout(){}
},{timeout:4000});
const g=window.__testGame;
const newGame=(map,credits=5000,player='coalition',enemy='federation')=>
  g.newMatch({playerFaction:player,enemyFaction:enemy,map,difficulty:'recruit',startingCredits:credits});
const signatures=new Map();
for(const name of ['verdant','desert','snow']){
  newGame(name,8000);
  assert.equal(g.players[0].credits,8000,'player chosen credits respected');
  assert.equal(g.players[1].credits,8000,'same economic starting terms for enemy');
  const geometry=[];
  for(let x=1;x<33;x++)for(let y=1;y<33;y++)if(g.water(x+.5,y+.5))geometry.push(x+','+y);
  signatures.set(name,geometry.join('|'));
  assert.ok(geometry.length>10,'map has real water obstacles');
  assert.ok(g.ores.length>30,'ore nodes spawn on each map');
  assert.ok(g.ores.every(o=>!g.water(o.x,o.y)),'ore is not deposited inside water');
  const bases=g.entities.filter(e=>e.kind==='hq');
  assert.equal(bases.length,2);
  assert.ok(bases.every(e=>!g.water(e.x,e.y)),'bases remain on land');
  nodes.get('mapSelect').value=name;
  g.drawMapPreview();
  assert.ok(nodes.get('mapDescription').textContent.length>20,'description updates for chosen map');
  g.draw();
}
assert.notEqual(signatures.get('verdant'),signatures.get('desert'));
assert.notEqual(signatures.get('desert'),signatures.get('snow'));
assert.notEqual(signatures.get('verdant'),signatures.get('snow'));

// Different recon vehicles use distinct faction stats and share production requirements.
newGame('verdant',8000,'coalition','federation');
const scout1=g.add(0,'recon',13,13),scout2=g.add(1,'recon',21,21);
assert.ok(g.stat(scout1,'speed')>g.stat(scout2,'speed'),'Coalition scouts are quicker');
assert.ok(scout2.hp>scout1.hp,'Federation patrol has more armor');
assert.ok(g.stat(scout2,'damage')>g.stat(scout1,'damage'),'Federation scout is stronger');
assert.ok(g.stat(scout1,'speed')>g.stat(g.entities.find(e=>e.owner===0&&e.kind==='tank'),'speed'),'scouting vehicle beats main tank on speed');
assert.ok(g.name(scout1).includes('Scout'));
g.updateFog();
assert.equal(g.isVisible(20,13),true,'recon provides extended forward vision');
const credits=g.players[0].credits;
g.add(0,'factory',12,6);
g.chooseProduction('recon');
assert.equal(g.players[0].credits,credits-550,'recon queue charges correct price');
assert.ok(g.queues.some(q=>q.side===0&&q.key==='recon'));
g.tab='vehicles';g.updateUI(true);
assert.ok(nodes.get('production').innerHTML.includes('coalition-recon.svg'),'recon art displayed in build palette');
assert.ok(g.cancelProduction('recon'));
assert.equal(g.players[0].credits,credits,'recon refund works');

// AI scouts a resource route when a recon vehicle is available.
newGame('desert',5000,'coalition','federation');
const aiScout=g.add(1,'recon',25,24);
g.runAI();
assert.ok(aiScout.order?.type==='attackMove'||aiScout.order?.type==='attack','recon AI starts a scouting or defensive order');
// Threats near the AI harvester override scouting with protection.
const enemyHarvester=g.entities.find(e=>e.owner===1&&e.kind==='harvester');
const raider=g.add(0,'soldier',enemyHarvester.x+1,enemyHarvester.y+1);
g.runAI();
assert.equal(aiScout.order?.type,'attack');
assert.equal(aiScout.order?.id,raider.id,'recon AI defends its harvester');
console.log('PASS: three unique terrain maps and ore distributions, preview, credits, recon balance, production and scouting');
