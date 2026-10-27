import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Exercise the real construction planner and placement rules, not a mock AI.
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
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
for(const faction of ['coalition','federation','psionic']){
  const g=game();
  g.newMatch({map:'verdant',difficulty:'standard',playerFaction:'coalition',
    enemyFaction:faction,startingCredits:5000});
  const hq=g.entities.find(e=>e.owner===1&&e.kind==='hq');
  // Prerequisite-complete, powered base with a distant established outpost.
  // No direct spawn of the Air Command under test.
  g.add(1,'factory',25,24);g.add(1,'radar',24,26);g.add(1,'tech',23,25);
  g.add(1,'generator',23,22);g.add(1,'generator',20,25);
  g.add(1,'generator',20,22);
  const outpost=g.add(1,'generator',15,16);
  g.time=160;g.players[1].credits=10000;
  assert.equal(g.power(1).low,false,'construction base must have spare power');
  assert.ok(g.prereq(1,'airfield'),'airfield technology must be unlocked');
  const realCanPlace=g.canPlace.bind(g);
  // Model an HQ surrounded by blocked terrain while leaving one genuine
  // engine-legal site near the outpost. No placement legality is bypassed.
  let site=null;
  for(let j=0;j<48;j++){
    const angle=j*2.39996,radius=4.2+Math.floor(j/8)*.85;
    const x=Math.round(outpost.x+Math.cos(angle)*radius);
    const y=Math.round(outpost.y+Math.sin(angle)*radius);
    if(distance({x,y},hq)>10&&realCanPlace(x,y,1)){site={x,y};break;}
  }
  assert.ok(site,'test map must provide a real legal outpost construction site');
  g.canPlace=(x,y,side)=>x===site.x&&y===site.y&&realCanPlace(x,y,side);
  const beforeCredits=g.players[1].credits;
  const beforeBuildings=g.stats[1].buildingsConstructed;
  g.runAI();
  const airfields=g.entities.filter(e=>e.owner===1&&e.kind==='airfield'&&e.hp>0);
  assert.equal(airfields.length,1,faction+': AI must expand beyond the HQ ring');
  assert.deepEqual({x:airfields[0].x,y:airfields[0].y},site,
    faction+': airfield must use the real legal outpost site');
  assert.equal(airfields[0].built,false,'normal timed construction must be used');
  assert.equal(g.players[1].credits,beforeCredits-1750-200,
    'construction and queued infantry must debit their actual prices');
  assert.equal(g.stats[1].buildingsConstructed,beforeBuildings+1);
  assert.ok(g.saveGame()&&g.loadGame(),'expanded construction must survive save/load');
  assert.equal(g.entities.filter(e=>e.owner===1&&e.kind==='airfield').length,1);
}
console.log('PASS: AI expands Air Command construction to legal outposts for all factions, with real spending and saves');
