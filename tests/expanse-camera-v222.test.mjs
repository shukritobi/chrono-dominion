import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const script=read('game.js').replace('  new Game();','  window.__game=new Game();');
const noop=()=>{},canvas=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const elements=new Map(),listeners=new Map(),memory=new Map();
const document={hidden:false,addEventListener:(event,fn)=>listeners.set('document:'+event,fn),getElementById(id){
  if(!elements.has(id))elements.set(id,{
    id,value:'',disabled:false,style:{},dataset:{},
    classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
    setAttribute:noop,addEventListener:(event,fn)=>listeners.set(id+':'+event,fn),
    setPointerCapture:noop,querySelectorAll:()=>[],querySelector:()=>({disabled:true,textContent:''}),
    getContext:()=>canvas,getBoundingClientRect:()=>({left:0,top:0,width:id==='world'?1024:272,height:id==='world'?700:144}),
    set innerHTML(v){this._html=v},get innerHTML(){return this._html||''},
    set textContent(v){this._text=v},get textContent(){return this._text||''}
  });return elements.get(id);
}};
const localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v))};
const window={addEventListener:(name,fn)=>listeners.set('window:'+name,fn),localStorage};
runInNewContext(read('maps/catalog.js'),{window,console},{timeout:1000});
runInNewContext(script,{window,document,localStorage,console,
  performance:{now:()=>0},devicePixelRatio:1,requestAnimationFrame:noop,
  clearTimeout:noop,setTimeout:()=>1},{timeout:10000});
const g=window.__game,settings={
  playerFaction:'coalition',enemyFaction:'federation',
  map:'verdant',difficulty:'standard',startingCredits:5000
};
assert.equal(g.worldSize,34,'legacy map size remains unchanged');
g.newMatch(settings);
const original=JSON.stringify(g.fog.map(row=>row.map(c=>c.seen)));
assert.equal(g.fog.length,34);
assert.ok(g.saveGame(),'save old 34x34 battle');
const legacy=memory.get('chrono-dominion-skirmish-v1');
g.newMatch({...settings,map:'expanse'});
assert.equal(g.worldSize,48,'Frontier Expanse uses true 48x48 terrain');
assert.equal(g.fog.length,48);assert.equal(g.fog[0].length,48);
const friendly=g.entities.find(e=>e.owner===0&&e.kind==='hq');
const hostile=g.entities.find(e=>e.owner===1&&e.kind==='hq');
assert.equal(friendly.x,5);
assert.equal(hostile.x,42);assert.equal(hostile.y,41);
assert.equal(g.sideCanSee(0,hostile),false,'distant enemy HQ is hidden');
assert.ok(g.ores.some(o=>o.x>34&&o.amount>0),
  'larger battlefield actually has resource deposits outside old playable area');
assert.ok(g.walkable(45,45),'outer XL terrain is traversable');
const cam={...g.camera};

const wheel=listeners.get('world:wheel');
assert.equal(typeof wheel,'function','mouse wheel listener exists');
const worldCanvas=document.getElementById('world');
const oldBounds=worldCanvas.getBoundingClientRect;
worldCanvas.getBoundingClientRect=()=>({left:91,top:43,width:1024,height:700});
g.camera={x:0,y:420,zoom:1};
const wx=91+715,wy=43+245;
const worldUnderCursor=()=>({
  x:g.camera.x+(wx-91-g.w/2)/g.camera.zoom,
  y:g.camera.y+(wy-43-g.h/2)/g.camera.zoom
});
const anchored=worldUnderCursor();
let wheelPrevented=0;
const wheelEvent=deltaY=>({clientX:wx,clientY:wy,deltaY,deltaX:0,
  preventDefault(){wheelPrevented++;}});
wheel(wheelEvent(-120));
assert.ok(g.camera.zoom>1,'scroll up zooms in');
assert.ok(Math.abs(worldUnderCursor().x-anchored.x)<1e-7,
  'scroll up preserves terrain under cursor in X');
assert.ok(Math.abs(worldUnderCursor().y-anchored.y)<1e-7,
  'scroll up preserves terrain under cursor in Y');
wheel(wheelEvent(120));
assert.ok(Math.abs(worldUnderCursor().x-anchored.x)<1e-7,
  'scroll down preserves terrain under cursor in X');
assert.ok(Math.abs(worldUnderCursor().y-anchored.y)<1e-7,
  'scroll down preserves terrain under cursor in Y');
const unchanged=JSON.stringify(g.camera);
wheel(wheelEvent(0));
assert.equal(JSON.stringify(g.camera),unchanged,
  'horizontal-only trackpad wheel must not zoom out');
wheel(wheelEvent(NaN));
assert.equal(JSON.stringify(g.camera),unchanged,'invalid wheel delta is ignored');
g.camera.zoom=1.8;
const maxZoom=JSON.stringify(g.camera);
wheel(wheelEvent(-120));
assert.equal(JSON.stringify(g.camera),maxZoom,'upper zoom bound does not drift');
g.camera.zoom=.65;
const minZoom=JSON.stringify(g.camera);
wheel(wheelEvent(120));
assert.equal(JSON.stringify(g.camera),minZoom,'lower zoom bound does not drift');
const edge=g.worldSize*32;
g.camera={x:edge,y:edge,zoom:1};
wheel(wheelEvent(-120));
assert.ok(g.camera.x<=edge&&g.camera.x>=-edge&&
  g.camera.y>=50&&g.camera.y<=edge,'zoom respects world camera bounds');
g.pause();
const pausedCamera=JSON.stringify(g.camera);
wheel(wheelEvent(-120));
assert.equal(JSON.stringify(g.camera),pausedCamera,'paused match does not zoom');
g.pause();
assert.ok(wheelPrevented>=8,'wheel events prevent browser scrolling');
worldCanvas.getBoundingClientRect=oldBounds;
g.camera={...cam};

const pointer=(id,x,y,button=1)=>({pointerId:id,pointerType:'mouse',
  button,clientX:x,clientY:y,preventDefault:noop});
g.pointerDown(pointer(1,400,300));
assert.equal(g.mousePan?.id,1,'middle mouse starts panning');
g.pointerMove(pointer(1,480,330));
assert.ok(g.camera.x<cam.x-50,'drag shifts camera horizontally');
assert.ok(g.camera.y<cam.y-15,'drag shifts camera vertically');
g.pointerUp(pointer(1,480,330));
assert.equal(g.mousePan,null,'release clears mouse camera gesture');
assert.equal(g.selected.length,0,'middle drag does not select units');
g.keys.add(' ');
g.pointerDown(pointer(2,500,320,0));
const prior=g.camera.x;
g.pointerMove(pointer(2,520,320,0));
assert.ok(g.camera.x<prior-10,'Space + left-drag pans instead of selecting');
g.pointerUp(pointer(2,520,320,0));g.keys.delete(' ');
assert.equal(g.selected.length,0);
const target=g.entities.find(e=>e.owner===0&&e.kind==='soldier');
const screen=g.screen(target.x,target.y);
g.pointerDown(pointer(3,screen.x,screen.y,0));
g.pointerUp(pointer(3,screen.x,screen.y,0));
assert.equal(g.selected[0],target.id,'ordinary left click still selects units');
const touch=(id,x,y)=>({pointerType:'touch',pointerId:id,clientX:x,clientY:y,
  button:0,preventDefault:noop});
const lastCameraX=g.camera.x;
g.pointerDown(touch(4,500,300));g.pointerMove(touch(4,540,300));
g.pointerUp(touch(4,540,300));
assert.ok(g.camera.x<lastCameraX-15,'single-finger touchscreen panning still works');
const z=g.camera.zoom;
g.pointerDown(touch(5,450,340));g.pointerDown(touch(6,550,340));
g.pointerMove(touch(6,590,340));
assert.ok(g.camera.zoom>z,'two-finger pinch still zooms');
g.pointerUp(touch(6,590,340));g.pointerUp(touch(5,450,340));
const radarBefore=g.camera.x;
listeners.get('radar:click')({clientX:260,clientY:120});
assert.notEqual(g.camera.x,radarBefore,'radar navigation covers the larger world');
g.drawRadar();
assert.ok(g.saveGame(),'XL map saves through existing storage key');
const savedXL=JSON.parse(memory.get('chrono-dominion-skirmish-v1'));
assert.equal(savedXL.fog.length,48,'XL save records expanded map state');
g.newMatch(settings);
assert.equal(g.worldSize,34);
assert.ok(g.loadGame(),'saved XL world loads even if current map is 34');
assert.equal(g.worldSize,48);assert.equal(g.fog.length,48);
memory.set('chrono-dominion-skirmish-v1',legacy);
assert.ok(g.loadGame(),'old 34x34 snapshot loads while 48x48 world is active');
assert.equal(g.worldSize,34);
assert.equal(JSON.stringify(g.fog.map(row=>row.map(c=>c.seen))),original);
assert.equal(g.fog.length,34);
const keyEvent=listeners.get('window:keydown');
keyEvent({key:' ',target:null,preventDefault:noop});
assert.equal(g.keys.has(' '),true,'space enters hold-to-pan mode');
listeners.get('window:keyup')({key:' '});
assert.equal(g.keys.has(' '),false);
// Switching apps or losing browser focus can drop keyup/pointerup events.
const focusLost=listeners.get('window:blur');
const visibilityChanged=listeners.get('document:visibilitychange');
assert.equal(typeof focusLost,'function','window blur clears held controls');
assert.equal(typeof visibilityChanged,'function','tab visibility clears held controls');
keyEvent({key:'w',target:null,preventDefault:noop});
g.pointerDown(pointer(30,480,320));
assert.ok(g.keys.has('w')&&g.mousePan?.id===30);
focusLost();
assert.equal(g.keys.size,0,'blur releases held keyboard pan');
assert.equal(g.mousePan,null,'blur releases middle-button drag');
assert.equal(g.dragStart,null,'blur clears stale selection drag');
g.pointerUp(pointer(30,480,320));
g.pointerDown(touch(31,450,320));g.pointerDown(touch(32,550,320));
assert.equal(g.touchPoints.size,2);
g.keys.add('a');
document.hidden=true;visibilityChanged();
assert.equal(g.keys.size,0,'hidden tab releases held movement keys');
assert.equal(g.touchPoints.size,0,'hidden tab releases pinch pointers');
assert.equal(g.touchPointer,null,'hidden tab releases touch tap');
document.hidden=false;
g.keys.add('d');visibilityChanged();
assert.ok(g.keys.has('d'),'visible-tab notification does not cancel active controls');
g.keys.clear();
g.keys.add('w');g.pause();
assert.equal(g.keys.size,0,'pausing clears held camera movement');
g.pause();
g.keys.add('w');g.returnMenu();
assert.equal(g.keys.size,0,'returning to menu clears held keys');
g.keys.add('w');g.newMatch(settings);
assert.equal(g.keys.size,0,'starting a new match cannot inherit held keys');
assert.ok(g.saveGame()&&g.loadGame(),'input cleanup preserves existing saves');
assert.match(read('index.html'),/Frontier Expanse XL/);
assert.match(read('index.html'),/Space\+drag or middle-drag/);
assert.match(read('maps/catalog.js'),/48/);
console.log('PASS: v2.22 48x48 terrain, fog, AI base, mouse, touch, radar and legacy saves');
