import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('index.html'),css=read('style.css');
assert.match(html,/id="cancelMode"[^>]*aria-label="Cancel current placement or targeted order"/);
const version=JSON.parse(read('package.json')).version.replace(/\.0$/,'');
assert.ok(html.includes('PROTOTYPE '+version+' · '),'release banner must match package version');
assert.ok(css.includes('.cancelMode:focus-visible'));
assert.ok(css.includes('@media (pointer:coarse){.cancelMode{min-height:44px'));
const nodes=new Map(),events=new Map(),storage=new Map();
const canvas=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const document={getElementById(id){
  if(!nodes.has(id)){
    const classes=new Set();
    nodes.set(id,{id,style:{},dataset:{},disabled:false,value:'',
      classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),
        toggle:(x,force)=>{if(force===undefined)force=!classes.has(x);if(force)classes.add(x);else classes.delete(x);return force;}},
      addEventListener(){},setAttribute(){},querySelectorAll(){return[]},querySelector(){return{disabled:true,textContent:''}},
      getContext(){return canvas},setPointerCapture(){},
      getBoundingClientRect(){return{left:0,top:0,width:id==='world'?1024:272,height:id==='world'?700:144}},
      set innerHTML(v){this._html=v},get innerHTML(){return this._html||''},
      set textContent(v){this._text=v},get textContent(){return this._text||''}
    });
  }
  return nodes.get(id);
}};
const window={addEventListener:(type,fn)=>events.set(type,fn)};
const js=read('game.js').replace('  new Game();','  window.__game=new Game();');
runInNewContext(js,{window,document,console,performance:{now:()=>0},devicePixelRatio:1,
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},
  setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){}},{timeout:10000});
const g=window.__game;
g.newMatch({playerFaction:'coalition',enemyFaction:'federation',map:'verdant',difficulty:'standard',startingCredits:5000});
const button=document.getElementById('cancelMode');
assert.equal(button.classList.contains('hidden'),true,'no pending order: cancel button hidden');
const credits=g.players[0].credits,entities=g.entities.length;
g.chooseProduction('generator');
assert.equal(g.placing,'generator');
assert.equal(button.classList.contains('hidden'),false,'placing reveals cancel button');
assert.equal(typeof button.onclick,'function');
button.onclick();
assert.equal(g.placing,null);
assert.equal(g.players[0].credits,credits,'cancelled placement never spends credits');
assert.equal(g.entities.length,entities,'cancelled placement never creates structures');
assert.equal(button.classList.contains('hidden'),true);
assert.equal(g.cancelCurrentMode(),false,'idle cancel is a no-op');
const soldier=g.entities.find(e=>e.owner===0&&e.kind==='soldier');
assert.ok(soldier);
g.selected=[soldier.id];
assert.equal(g.unitAction('attackMove'),true);
assert.equal(g.attackMoveArmed,true);
assert.equal(button.classList.contains('hidden'),false);
button.onclick();
assert.equal(g.attackMoveArmed,false,'cancel disarms attack move');
assert.equal(g.selected[0],soldier.id,'selection is retained');
const specialist=g.add(0,'specialist',8,8);
assert.ok(specialist);
g.selected=[specialist.id];
assert.equal(g.useSpecialistAbility(),true);
assert.equal(g.abilityArmedId,specialist.id);
assert.equal(button.classList.contains('hidden'),false);
button.onclick();
assert.equal(g.abilityArmedId,null,'cancel disarms Chrono Jump');
assert.equal(button.classList.contains('hidden'),true);
assert.equal(specialist.abilityReadyAt||0,0,'cancel does not consume ability cooldown');
g.chooseProduction('generator');
let prevented=false;
events.get('keydown')({key:'Escape',target:null,preventDefault(){prevented=true}});
assert.equal(g.placing,null,'keyboard escape uses same cancel path');
assert.equal(g.state,'playing','escape cancels instead of pausing');
assert.equal(g.saveGame(),true,'new UI does not change save format');
assert.equal(JSON.parse(storage.get('chrono-dominion-skirmish-v1')).version,1);
console.log('PASS: mobile cancel placement, attack move, Chrono targeting, keyboard and save compatibility');
