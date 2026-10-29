import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const js=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__game=new Game();');
const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',style:{},disabled:false,dataset:{},
    classList:{add(){},remove(){},toggle(){}},addEventListener(){},
    setAttribute(){},querySelectorAll(){return[];},
    querySelector(){return{disabled:true,textContent:''}},
    getContext(){return ctx},setPointerCapture(){},
    getBoundingClientRect(){return{left:0,top:0,width:id==='world'?1024:272,height:id==='world'?700:144}},
    set innerHTML(v){this._html=v},get innerHTML(){return this._html||''},
    set textContent(v){this._text=v},get textContent(){return this._text||''}
  });return nodes.get(id);
}};
const window={addEventListener(){}};
runInNewContext(js,{window,document,console,performance:{now:()=>0},devicePixelRatio:1,
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},
  setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){}
},{timeout:10000});
const g=window.__game;
const settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000};
g.newMatch(settings);
let commands=0,placements=0;
const originalCommand=g.command.bind(g),originalPlace=g.placeBuilding.bind(g);
g.command=(...args)=>{commands++;return originalCommand(...args)};
g.placeBuilding=(...args)=>{placements++;return originalPlace(...args)};
const touch=(id,x,y)=>({pointerType:'touch',pointerId:id,clientX:x,clientY:y,
  button:0,preventDefault(){}});
const point=(x,y)=>({
  x:g.camera.x+(x-g.w/2)/g.camera.zoom,
  y:g.camera.y+(y-g.h/2)/g.camera.zoom
});
const near=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-7,msg+' ('+a+' vs '+b+')');
const player=g.entities.find(e=>e.owner===0&&e.kind==='soldier');
g.selected=[player.id];
g.placing='generator';
g.pointerDown(touch(1,460,350));
g.pointerDown(touch(2,560,350));
assert.equal(g.touchPoints.size,2);
assert.equal(g.dragStart,null,'pinch cancels box selection and construction tap');
const before=point(510,350),zoomBefore=g.camera.zoom;
g.pointerMove(touch(2,600,350));
assert.ok(g.camera.zoom>zoomBefore,'spreading fingers zooms in');
const after=point(530,350);
near(before.x,after.x,'pinch anchors horizontal world coordinate');
near(before.y,after.y,'pinch anchors vertical world coordinate');
const panned=point(530,350);
g.pointerMove(touch(1,500,350));
const shifted=point(550,350);
near(panned.x,shifted.x,'two-finger drag preserves terrain under midpoint');
near(panned.y,shifted.y,'two-finger drag preserves terrain under midpoint Y');
g.pointerUp(touch(2,600,350));
assert.equal(g.touchPoints.size,1);
g.pointerMove(touch(1,520,360));
g.pointerUp(touch(1,520,360));
assert.equal(g.touchPoints.size,0);
assert.equal(g.touchPointer,null);
assert.equal(commands,0,'pinch must never issue unit commands');
assert.equal(placements,0,'pinch must never place a building');
assert.equal(g.placing,'generator','pinch must preserve pending build choice');
assert.equal(g.selected[0],player.id,'pinch must preserve selected unit');

// Cancelled touches must not become clicks or leave stale pointer state.
g.pointerDown(touch(3,450,300));g.pointerCancel(touch(3,450,300));
assert.equal(g.touchPoints.size,0);
g.pointerUp(touch(3,450,300));
assert.equal(placements,0);
g.pointerDown(touch(4,450,300));g.pointerDown(touch(5,550,300));
g.pointerCancel(touch(5,550,300));g.pointerUp(touch(4,450,300));
assert.equal(placements,0,'cancelled pinch cannot place a building');

// Single-finger tap still places a structure and mouse selection still works.
g.placing=null;
const hit=g.screen(player.x,player.y);
g.selected=[];
g.pointerDown(touch(6,hit.x,hit.y));
g.pointerUp(touch(6,hit.x,hit.y));
assert.equal(g.selected[0],player.id,'single touch selects friendly unit');
g.pointerDown({pointerType:'mouse',pointerId:7,button:0,clientX:hit.x,clientY:hit.y});
g.pointerUp({pointerType:'mouse',pointerId:7,button:0,clientX:hit.x,clientY:hit.y});
assert.equal(g.selected[0],player.id,'mouse selection remains intact');

// Zoom must respect the existing range even for extreme pinch distances.
g.pointerDown(touch(8,100,300));g.pointerDown(touch(9,101,300));
g.pointerMove(touch(9,1000,300));
assert.ok(g.camera.zoom<=1.8);
g.pointerMove(touch(9,100.1,300));
assert.ok(g.camera.zoom>=.65);
g.pointerUp(touch(8,100,300));g.pointerUp(touch(9,100.1,300));
assert.equal(commands,0);

// Extremely long one-finger drags and two-finger gestures must not strand the
// camera outside the map. Mouse panning and wheel zoom already clamp there.
const cameraBounds=()=>{
  const span=g.worldSize*32;
  assert.ok(g.camera.x>=-span&&g.camera.x<=span,'touch X stays inside world limits');
  assert.ok(g.camera.y>=50&&g.camera.y<=g.worldSize*32,
    'touch Y stays inside world limits');
};
const placementsBeforeBounds=placements,commandsBeforeBounds=commands;
g.camera={x:0,y:370,zoom:1};
g.pointerDown(touch(20,500,350));
g.pointerMove(touch(20,-10000,10000));
cameraBounds();
assert.equal(g.camera.x,g.worldSize*32,'drag clamps at positive X edge');
assert.equal(g.camera.y,50,'drag clamps at minimum Y');
g.pointerMove(touch(20,10000,-10000));
cameraBounds();
assert.equal(g.camera.x,-g.worldSize*32,'drag clamps at negative X edge');
assert.equal(g.camera.y,g.worldSize*32,'drag clamps at maximum Y');
g.pointerUp(touch(20,10000,-10000));
g.camera={x:g.worldSize*32-10,y:g.worldSize*18-10,zoom:1};
g.pointerDown(touch(21,450,350));
g.pointerDown(touch(22,550,350));
g.pointerMove(touch(21,5000,5000));
cameraBounds();
g.pointerMove(touch(22,5100,5000));
cameraBounds();
g.pointerUp(touch(22,5100,5000));
g.pointerUp(touch(21,5000,5000));
assert.equal(g.touchPoints.size,0,'edge pinch releases all pointers');
assert.equal(placements,placementsBeforeBounds,'edge gestures never place structures');
assert.equal(commands,commandsBeforeBounds,'edge gestures never issue orders');

// Stylus drag follows the same bounded pan path, not a free camera escape.
g.camera={x:0,y:370,zoom:1};
g.pointerDown({...touch(23,500,350),pointerType:'pen'});
g.pointerMove({...touch(23,-10000,10000),pointerType:'pen'});
cameraBounds();
g.pointerUp({...touch(23,-10000,10000),pointerType:'pen'});
assert.equal(placements,placementsBeforeBounds);

// New match, pause, return to menu and save/load clear transient gestures.
g.pointerDown(touch(10,200,200));g.pause();
assert.equal(g.touchPoints.size,0);
g.pause();
g.pointerDown(touch(11,200,200));g.returnMenu();
assert.equal(g.touchPoints.size,0);
g.newMatch(settings);
assert.equal(g.touchPoints.size,0);
g.pointerDown(touch(12,200,200));
assert.ok(g.saveGame());
assert.ok(g.loadGame());
assert.equal(g.touchPoints.size,0,'save/load must not revive active touches');
console.log('PASS: anchored pinch, two-finger pan, no accidental orders, cancel, tap, mouse, zoom bounds and state reset');
