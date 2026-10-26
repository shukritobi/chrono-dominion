import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const memory=new Map();
const localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v))};
const audioEvents=[];
class FakeOscillator{
  constructor(){this.type='sine';this.frequency={setValueAtTime(){},exponentialRampToValueAtTime(){}};}
  connect(){}
  start(at){audioEvents.push(['start',at]);}
  stop(at){audioEvents.push(['stop',at]);}
}
class FakeAudioContext{
  constructor(){this.currentTime=1;this.destination={};this.state='running';}
  createOscillator(){return new FakeOscillator();}
  createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
}
const w={addEventListener(){},localStorage,AudioContext:FakeAudioContext};
const vm={window:w,localStorage,console};
runInNewContext(read('audio/sfx.js'),vm,{timeout:2000});
assert.ok(w.ChronoAudio&&!w.ChronoAudio.enabled,'sound defaults to disabled');
assert.equal(w.ChronoAudio.play('shot'),false,'silent prior to user opting in');
assert.equal(audioEvents.length,0);
assert.equal(w.ChronoAudio.setEnabled(true),true);
assert.equal(localStorage.getItem('chrono-dominion-sound-enabled-v1'),'true');
assert.equal(w.ChronoAudio.play('shot'),true,'opted-in user can hear a sound');
assert.equal(w.ChronoAudio.play('shot'),false,'per-effect throttling avoids sound pileups');
assert.equal(w.ChronoAudio.setEnabled(false),false);
assert.equal(w.ChronoAudio.play('win'),false,'muting disables output');

const ctx=new Proxy({}, {get:(obj,key)=>obj[key]??(()=>{}),set:(obj,key,value)=>{obj[key]=value;return true;}});
const elements=new Map(),listeners=new Map();
const document={getElementById(id){
  if(!elements.has(id))elements.set(id,{
    id,style:{},value:'',disabled:false,
    classList:{add(){},remove(){},toggle(){}},
    setAttribute(name,value){this[name]=value;},addEventListener(name,fn){listeners.set(id+':'+name,fn);},
    getContext(){return ctx;},querySelectorAll(){return[];},querySelector(){return{disabled:true,textContent:''};},
    getBoundingClientRect(){return{left:0,top:0,width:id==='world'?1080:272,height:id==='world'?700:144};},
    set innerHTML(value){this._html=value;},get innerHTML(){return this._html||'';},
    set textContent(value){this._text=value;},get textContent(){return this._text||'';}
  });
  return elements.get(id);
}};
const gameSource=read('game.js').replace('  new Game();','  window.__game = new Game();');
runInNewContext(gameSource,{window:w,document,console,localStorage,performance:{now:()=>0},
  requestAnimationFrame(){},setTimeout(){return 1;},clearTimeout(){},devicePixelRatio:1},{timeout:4000});
const g=w.__game,settings={playerFaction:'coalition',enemyFaction:'federation',map:'verdant',difficulty:'recruit',startingCredits:5000};
assert.equal(w.ChronoDominion.version,'2.1.0');
assert.ok(elements.get('soundToggle').textContent.includes('OFF'));
elements.get('soundToggle').onclick();
assert.equal(w.ChronoAudio.enabled,true);
assert.equal(elements.get('soundToggle')['aria-pressed'],'true');
elements.get('soundToggle').onclick();
assert.equal(w.ChronoAudio.enabled,false);

// A lake spanning a complete map column isolates the far side.
g.newMatch(settings);g.entities=[];
g.water=(x,y)=>x>=16&&x<=18;
const a=g.add(0,'soldier',9,10),b=g.add(0,'soldier',11,10);
g.selected=[a.id,b.id];
const reachable=g.reachableTiles({x:10,y:10});
assert.ok(reachable.has('10,10'));
assert.ok(!reachable.has('27,10'),'flood fill rejects island behind lake');
const slots=g.formationSlots(27,10,2,{x:10,y:10});
assert.equal(slots.length,2,'group receives distinct valid orders');
assert.ok(slots.every(point=>point.x<16),'formation never assigns destination across water');
g.command({gx:27,gy:10},{shiftKey:false});
assert.equal(a.order?.type,'move');
assert.equal(b.order?.type,'move');
assert.ok(a.order.x<16&&b.order.x<16);
assert.notEqual(a.order.x+','+a.order.y,b.order.x+','+b.order.y);
for(let i=0;i<110;i++)g.step(.04);
assert.ok(a.x<16&&b.x<16,'squad members do not clip through lake');
assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>.2,'squad units keep separation');

// Flanking uses navigable points on opposite sides of a remembered goal.
g.water=()=>false;
const origin={x:27,y:24},enemyReport={x:10,y:12};
const left=g.chooseFlank(origin,enemyReport,0),right=g.chooseFlank(origin,enemyReport,1);
assert.ok(left&&right,'AI chooses two reachable flanks');
assert.notEqual(left.x+','+left.y,right.x+','+right.y,'different squads use different sides');
assert.ok(g.walkable(left.x,left.y)&&g.walkable(right.x,right.y));
g.water=(x,y)=>x>=16&&x<=18;
assert.equal(g.chooseFlank(origin,enemyReport,0),null,
  'AI rejects flanking points separated by a lake even when those points are walkable');
g.water=()=>false;
g.draw();
console.log('PASS: opt-in sound, mute, event throttle, reachable squad slots, collision and AI flanking');
