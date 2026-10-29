import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const noop=()=>{},drawing=new Proxy({},{get:(o,k)=>o[k]??noop,set:(o,k,v)=>{o[k]=v;return true;}});
const nodes=new Map(),storage=new Map();
const document={getElementById(id){
  if(!nodes.has(id))nodes.set(id,{
    id,value:'',disabled:false,style:{},dataset:{},
    classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
    addEventListener:noop,setAttribute:noop,querySelectorAll:()=>[],
    querySelector:()=>({disabled:true,textContent:''}),
    getContext:()=>drawing,setPointerCapture:noop,
    getBoundingClientRect:()=>({left:0,top:0,width:1024,height:700}),
    set innerHTML(v){this._html=v},get innerHTML(){return this._html||''},
    set textContent(v){this._text=v},get textContent(){return this._text||''}
  });return nodes.get(id);
}};
const window={addEventListener:noop};
const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
runInNewContext(read('maps/catalog.js'),{window,console},{timeout:1000});
runInNewContext(read('game.js').replace('  new Game();','  window.__game=new Game();'),{
  window,document,console,localStorage,performance:{now:()=>0},
  devicePixelRatio:1,requestAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop
},{timeout:10000});
const g=window.__game,settings={playerFaction:'coalition',enemyFaction:'federation',
  map:'expanse',difficulty:'standard',startingCredits:5000};
g.newMatch(settings);
assert.equal(g.worldSize,48);

// Alternating narrow openings force a 457-step path across the XL map.
// The former 1,450-heap-pop limit stopped before reaching this valid goal.
const walls=new Set();
for(let x=7,band=0;x<46;x+=3,band++)
  for(let y=1;y<47;y++)
    if(y!==(band%2===0?4:43))walls.add(x+','+y);
g.walkable=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&
  x>0&&y>0&&x<47&&y<47&&!walls.has(x+','+y);
const path=g.findPath(5,2,42,45);
assert.ok(path.length>200,'XL serpentine route should be substantially longer than direct distance');
assert.equal(path.at(-1)?.x,42,'A* must reach the actual distant destination');
assert.equal(path.at(-1)?.y,45,'A* must reach the actual distant destination');
let prev={x:5,y:2};
for(const point of path){
  assert.ok(g.walkable(point.x,point.y),'every waypoint is traversable');
  const dx=Math.abs(point.x-prev.x),dy=Math.abs(point.y-prev.y);
  assert.ok(dx<=1&&dy<=1&&dx+dy>0,'each waypoint is adjacent');
  if(dx&&dy)assert.ok(g.walkable(prev.x,point.y)&&g.walkable(point.x,prev.y),
    'diagonal movement never clips a corner');
  prev=point;
}

// A* must remain optimal with the tighter eight-direction octile heuristic.
// A single-cell opening near the direct route is shorter, but a sufficiently
// costly traffic/hazard opening must select the farther reachable gate.
const gateWall=new Set();
for(let y=1;y<47;y++)if(y!==10&&y!==23)gateWall.add('12,'+y);
g.walkable=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&
  x>0&&y>0&&x<47&&y<47&&!gateWall.has(x+','+y);
const nearGate=g.findPath(6,11,20,11,null,null,true);
assert.ok(nearGate.some(p=>p.x===12&&p.y===10),
  'unweighted A* uses the shorter northern gate');
const costlyGate=g.findPath(6,11,20,11,null,
  p=>p.x===12&&p.y===10?200:0,true);
assert.ok(costlyGate.some(p=>p.x===12&&p.y===23),
  'nonnegative hazards still produce the cheaper southern detour');
assert.ok(!costlyGate.some(p=>p.x===12&&p.y===10),
  'a high-cost opening must not be chosen by an overestimating heuristic');
for(const route of [nearGate,costlyGate]){
  assert.equal(route.at(-1)?.x,20);
  assert.equal(route.at(-1)?.y,11);
  let previous={x:6,y:11};
  for(const point of route){
    assert.ok(g.walkable(point.x,point.y),'weighted route stays traversable');
    if(point.x!==previous.x&&point.y!==previous.y)
      assert.ok(g.walkable(point.x,previous.y)&&g.walkable(previous.x,point.y),
        'weighted detour cannot cut blocked diagonal corners');
    previous=point;
  }
}

// An ordinary player move can use an exact-cost octile corridor. If
// diagonal-first is blocked, straight-first remains optimal; a balanced
// interleaving can also avoid both edge corridors. A* handles other obstacles.
let shortcutAttempts=0,shortcutHits=0;
const originalShortcut=g.directOctilePath.bind(g);
g.directOctilePath=(...args)=>{
  shortcutAttempts++;
  const route=originalShortcut(...args);
  if(route)shortcutHits++;
  return route;
};
const openTile=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&
  x>0&&y>0&&x<47&&y<47;
g.walkable=openTile;
const clearRoute=g.findPath(4,4,40,30,null,null,true);
assert.equal(clearRoute.length,36,'clear route has optimal octile step count');
assert.equal(clearRoute.at(-1)?.x,40);
assert.equal(clearRoute.at(-1)?.y,30);
assert.equal(shortcutAttempts,1);
assert.equal(shortcutHits,1,'clear route must avoid A* fallback');
let previousClear={x:4,y:4};
for(const point of clearRoute){
  assert.ok(Math.abs(point.x-previousClear.x)<=1&&
    Math.abs(point.y-previousClear.y)<=1,'shortcut stays adjacent');
  previousClear=point;
}
g.walkable=(x,y)=>openTile(x,y)&&!(x===5&&y===5);
const alternate=g.findPath(4,4,40,30,null,null,true);
assert.equal(shortcutAttempts,2);
assert.equal(shortcutHits,2,'straight-first corridor avoids unnecessary A*');
assert.equal(alternate.length,36,'alternate route retains exact octile cost');
assert.equal(alternate.at(-1)?.x,40);
assert.equal(alternate.at(-1)?.y,30);
let previousAlternate={x:4,y:4};
for(const point of alternate){
  assert.ok(g.walkable(point.x,point.y),'alternate route uses walkable tiles');
  const dx=Math.abs(point.x-previousAlternate.x);
  const dy=Math.abs(point.y-previousAlternate.y);
  assert.ok(dx<=1&&dy<=1&&dx+dy>0,'alternate route is adjacent');
  if(dx&&dy)assert.ok(g.walkable(point.x,previousAlternate.y)&&
    g.walkable(previousAlternate.x,point.y),
    'alternate route never clips a diagonal shoulder');
  previousAlternate=point;
}
const verticalAlternate=g.findPath(4,4,30,40,null,null,true);
assert.equal(shortcutAttempts,3);
assert.equal(shortcutHits,3,'Y-major corridor uses alternate shortcut');
assert.equal(verticalAlternate.length,36);
assert.equal(verticalAlternate.at(-1)?.x,30);
assert.equal(verticalAlternate.at(-1)?.y,40);
// The diagonal-first route crosses (10,10), straight-first crosses (10,4).
// A balanced exact-cost route crosses (10,8) instead of either blocked tile.
g.walkable=(x,y)=>openTile(x,y)&&
  !(x===10&&y===10)&&!(x===10&&y===4);
const balanced=g.findPath(4,4,40,30,null,null,true);
assert.equal(shortcutAttempts,4);
assert.equal(shortcutHits,4,'balanced corridor avoids full A*');
assert.equal(balanced.length,36,'balanced route retains optimal octile cost');
assert.equal(balanced.at(-1)?.x,40);
assert.equal(balanced.at(-1)?.y,30);
assert.ok(balanced.some(p=>p.x===10&&p.y===8),
  'balanced route crosses the unobstructed central corridor');
let previousBalanced={x:4,y:4};
for(const point of balanced){
  assert.ok(g.walkable(point.x,point.y),'balanced route stays on walkable tiles');
  const dx=Math.abs(point.x-previousBalanced.x);
  const dy=Math.abs(point.y-previousBalanced.y);
  assert.ok(dx<=1&&dy<=1&&dx+dy>0,'balanced route remains adjacent');
  if(dx&&dy)assert.ok(g.walkable(point.x,previousBalanced.y)&&
    g.walkable(previousBalanced.x,point.y),
    'balanced route cannot clip a blocked diagonal shoulder');
  previousBalanced=point;
}
// A centered diagonal band is a fourth optimal corridor. All three older
// routes are blocked, but a centered route with straight steps at both ends
// remains clear. The same geometry must work for X-major and Y-major orders.
const verifyCentered=(route,sx,sy,tx,ty,label)=>{
  assert.equal(route.length,36,label+': exact octile step count');
  assert.equal(route.at(-1)?.x,tx,label+': reaches target X');
  assert.equal(route.at(-1)?.y,ty,label+': reaches target Y');
  let prev={x:sx,y:sy};
  for(const p of route){
    assert.ok(g.walkable(p.x,p.y),label+': traverses only walkable cells');
    const dx=Math.abs(p.x-prev.x),dy=Math.abs(p.y-prev.y);
    assert.ok(dx<=1&&dy<=1&&dx+dy>0,label+': adjacent steps');
    if(dx&&dy)assert.ok(g.walkable(p.x,prev.y)&&g.walkable(prev.x,p.y),
      label+': diagonal shoulders must be clear');
    prev=p;
  }
};
g.walkable=(x,y)=>openTile(x,y)&&
  !(x===9&&y===9)&&!(x===11&&y===4)&&!(x===6&&y===5);
const centeredX=g.findPath(4,4,40,30,null,null,true);
assert.equal(shortcutAttempts,5);
assert.equal(shortcutHits,5,'centered X-major corridor avoids full A*');
verifyCentered(centeredX,4,4,40,30,'X-major centered');
assert.ok(centeredX.some(p=>p.x===9&&p.y===4),
  'centered route starts with half the straight-only steps');
g.walkable=(x,y)=>openTile(x,y)&&
  !(x===9&&y===9)&&!(x===4&&y===11)&&!(x===5&&y===6);
const centeredY=g.findPath(4,4,30,40,null,null,true);
assert.equal(shortcutAttempts,6);
assert.equal(shortcutHits,6,'centered Y-major corridor avoids full A*');
verifyCentered(centeredY,4,4,30,40,'Y-major centered');

// Blocking both possible first steps forces the original A* fallback.
g.walkable=(x,y)=>openTile(x,y)&&
  !(x===5&&y===5)&&!(x===5&&y===4);
const obstructed=g.findPath(4,4,40,30,null,null,true);
assert.equal(shortcutAttempts,7);
assert.equal(shortcutHits,6,'all four blocked corridors must fall back to A*');
assert.equal(obstructed.at(-1)?.x,40);
assert.equal(obstructed.at(-1)?.y,30);
let previousBlocked={x:4,y:4};
for(const point of obstructed){
  assert.ok(g.walkable(point.x,point.y),'fallback never enters blocked cell');
  if(point.x!==previousBlocked.x&&point.y!==previousBlocked.y)
    assert.ok(g.walkable(point.x,previousBlocked.y)&&
      g.walkable(previousBlocked.x,point.y),'fallback respects corners');
  previousBlocked=point;
}
// Weighted searches and legacy Euclidean callers must not take the shortcut.
g.walkable=openTile;
const weighted=g.findPath(4,4,40,30,null,
  p=>p.x===5&&p.y===5?1000:0,true);
assert.ok(!weighted.some(p=>p.x===5&&p.y===5),
  'hazard costs cannot be bypassed by the clear-corridor shortcut');
g.findPath(4,4,40,30);
assert.equal(shortcutAttempts,7,'weighted and non-opt-in searches use A*');
g.directOctilePath=originalShortcut;

// AI ordinary move orders may use a clear exact-cost route without changing
// the original Euclidean A* fallback. Harvesters and combat orders are excluded.
g.entities=[];
g.walkable=openTile;
let aiShortcutAttempts=0;
g.directOctilePath=(...args)=>{
  aiShortcutAttempts++;
  return originalShortcut(...args);
};
const aiMover=g.add(1,'tank',4,4);
aiMover.order={type:'move',x:40,y:30};
g.move(aiMover,40,30,.2);
assert.equal(aiShortcutAttempts,1,'AI ordinary ground movement can take direct route');
const aiHarvester=g.add(1,'harvester',4,7);
aiHarvester.order={type:'move',x:40,y:30};
g.move(aiHarvester,40,30,.2);
assert.equal(aiShortcutAttempts,1,'AI harvesters retain existing pathfinding');
const aiAttacker=g.add(1,'tank',4,10);
aiAttacker.order={type:'attackMove',x:40,y:30};
g.move(aiAttacker,40,30,.2);
assert.equal(aiShortcutAttempts,1,'AI combat movement retains existing pathfinding');
g.directOctilePath=()=>{aiShortcutAttempts++;return null;};
const euclidean=g.findPath(4,4,40,30);
const aiFallback=g.findPath(4,4,40,30,null,null,false,true);
assert.equal(aiShortcutAttempts,2,'AI tries the shortcut once before A*');
assert.equal(JSON.stringify(aiFallback),JSON.stringify(euclidean),
  'blocked AI shortcut falls back to unchanged Euclidean A* route');
g.directOctilePath=originalShortcut;

// A genuinely unreachable target still returns a safe partial route.
g.walkable=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&
  x>0&&y>0&&x<47&&y<47&&x!==24;
const partial=g.findPath(5,20,42,20);
assert.ok(partial.length>0,'unreachable destination yields a useful partial route');
assert.ok(partial.every(p=>p.x<24),'fallback never crosses an impassable barrier');

// Historical 34x34 navigation and localStorage save format remain intact.
delete g.walkable;
g.newMatch({...settings,map:'verdant'});
assert.equal(g.worldSize,34);
assert.equal(g.saveGame(),true);
assert.equal(g.loadGame(),true);
g.entities=[];
g.water=()=>false;
const legacy=g.findPath(8,12,23,12);
assert.equal(legacy.length,15,'legacy open-terrain shortest path is unchanged');
assert.equal(legacy.at(-1)?.x,23);

// Packed A* keys must remain unique at both edges of 34x34 and 48x48
// battlefields. In particular, a row boundary must never become a shortcut.
for(const map of ['verdant','expanse']){
  g.newMatch({...settings,map});
  g.entities=[];
  g.water=()=>false;
  const edge=g.worldSize-2,mid=Math.floor(edge/2);
  const endpoints=[
    [1,1,edge,edge],
    [edge,1,1,edge],
    [1,edge,edge,1],
    [edge,edge,1,1],
    [1,mid,edge,mid]
  ];
  for(const [sx,sy,tx,ty] of endpoints){
    const route=g.findPath(sx,sy,tx,ty);
    assert.ok(route.length>0,map+' edge route must exist');
    assert.equal(route.at(-1)?.x,tx,map+' reaches requested X');
    assert.equal(route.at(-1)?.y,ty,map+' reaches requested Y');
    let previous={x:sx,y:sy};
    for(const point of route){
      assert.ok(point.x>=1&&point.x<=edge&&point.y>=1&&point.y<=edge,
        map+' route must never wrap outside legal grid bounds');
      const dx=Math.abs(point.x-previous.x),dy=Math.abs(point.y-previous.y);
      assert.ok(dx<=1&&dy<=1&&dx+dy>0,
        map+' packed-key route must keep adjacent waypoints');
      previous=point;
    }
  }
}
assert.equal(window.ChronoDominion.version,'2.42.0');
console.log('v2.35 XL full-route A*, safe fallback, corner and save regression passed');
