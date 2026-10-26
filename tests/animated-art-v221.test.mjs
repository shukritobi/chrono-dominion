import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source=readFileSync(new URL('../art/animated-entities.js',import.meta.url),'utf8');
const vehicles=readFileSync(new URL('../art/vehicle-renderer.js',import.meta.url),'utf8');
const gameSource=readFileSync(new URL('../game.js',import.meta.url),'utf8')
  .replace('  new Game();','  window.__gameUnderTest = new Game();');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.ok(html.includes('./art/animated-entities.js'),'animated art loads in live HTML');
assert.ok(html.indexOf('./art/animated-entities.js')<html.indexOf('./game.js'),
  'animated art loads before the game');

const operations=[];
const ctx=new Proxy({},{
  get(target,k){
    if(k==='createRadialGradient')return (...args)=>{
      operations.push(['gradient',...args]);
      return {addColorStop(){}};
    };
    if(k==='drawImage')return (...args)=>operations.push(['drawImage',args.length]);
    if(k==='fill'||k==='stroke'||k==='ellipse'||k==='fillRect'||k==='moveTo'||k==='lineTo')
      return (...args)=>operations.push([k,...args]);
    return target[k]??(()=>{});
  },
  set(t,k,v){t[k]=v;return true;}
});
const elements=new Map();
const doc={
  createElement(tag){assert.equal(tag,'canvas');return {width:0,height:0,getContext:()=>ctx};},
  getElementById(id){
    if(!elements.has(id))elements.set(id,{
      style:{},classList:{toggle(){},add(){},remove(){}},
      getContext:()=>ctx,addEventListener(){},querySelectorAll(){return [];},
      getBoundingClientRect(){return {width:id==='world'?1050:256,height:id==='world'?740:190,left:0,top:0};},
      set innerHTML(v){this._html=v;},get innerHTML(){return this._html||'';},
      set textContent(v){this._text=v;},get textContent(){return this._text||'';}
    });
    return elements.get(id);
  }
};
const window={document:doc,addEventListener(){}};
const scope={window,document:doc,console,performance:{now:()=>0},
  requestAnimationFrame(){},devicePixelRatio:2,setTimeout:()=>1,clearTimeout(){},
  Image:class{constructor(){this.complete=false;this.naturalWidth=0;}}
};
runInNewContext(source,scope,{timeout:5000});
const renderer=window.ChronoAnimatedArt;
assert.equal(renderer.version,'1.0.0');
assert.deepEqual(Object.keys(renderer.themes),['coalition','federation','psionic']);
const kinds=['soldier','specialist','heavy','recon','harvester','aircraft'];
for(const [fi,faction] of Object.keys(renderer.themes).entries()){
  for(const [ki,kind] of kinds.entries()){
    const e={id:fi*100+ki+1,x:3,y:5,kind,hp:80,maxHp:100,worldHeading:Math.PI/4,
      turretHeading:Math.PI/3,engaging:ki%2===0,ready:.9,load:135};
    operations.length=0;
    assert.equal(renderer.drawUnit(ctx,e,{faction,time:1}),true,kind+' drawn');
    assert.ok(operations.filter(o=>o[0]==='fill').length>4,kind+' has detailed geometry');
    const first=operations.filter(o=>o[0]==='lineTo').map(o=>o.slice(1)).slice(0,15);
    e.x+=.15;
    operations.length=0;
    renderer.drawUnit(ctx,e,{faction,time:1.12});
    const second=operations.filter(o=>o[0]==='lineTo').map(o=>o.slice(1)).slice(0,15);
    if(kind==='soldier'||kind==='specialist')
      assert.notDeepEqual(second,first,'infantry stride responds to displacement');
  }
  const builds=['hq','generator','refinery','barracks','factory','radar','tech','turret','beam','airfield'];
  for(const kind of builds){
    operations.length=0;
    assert.equal(renderer.drawBuilding(ctx,{id:fi+4,kind,hp:80,maxHp:100,built:true},
      {faction,time:2.5}),true,kind+' animated building rendered');
    assert.ok(operations.filter(o=>o[0]==='fill').length>8,
      kind+' has substantial original geometric detail');
  }
}
assert.equal(renderer.drawUnit(ctx,{kind:'undefined'},{faction:'coalition'}),false);

runInNewContext(vehicles,scope,{timeout:5000});
runInNewContext(gameSource,scope,{timeout:7000});
const game=window.__gameUnderTest;
game.newMatch({playerFaction:'coalition',enemyFaction:'federation',map:'verdant',difficulty:'recruit'});
const hq=game.entities.find(e=>e.kind==='hq');
operations.length=0;game.drawBuilding(hq);
assert.ok(operations.some(o=>o[0]==='gradient'),'live building uses animated lighting');
const ranger=game.entities.find(e=>e.kind==='soldier');
operations.length=0;game.drawUnit(ranger);
assert.ok(operations.filter(o=>o[0]==='fill').length>4,'live soldier uses animated model');
const factory=game.add(0,'factory',9,3),radar=game.add(0,'radar',4,9),airfield=game.add(0,'airfield',13,4);
assert.ok(factory&&radar&&airfield);
assert.equal(game.prereq(0,'aircraft'),true);
game.tab='structures';game.updateUI(true);
assert.ok(elements.get('production').innerHTML.includes('Sky Command'));
game.tab='vehicles';game.updateUI(true);
assert.ok(elements.get('production').innerHTML.includes('Falcon Interceptor'));
const plane=game.add(0,'aircraft',18,5),start=plane.x;
assert.equal(game.canOccupyUnit(plane,25,5),true,'air unit crosses lake');
assert.equal(game.move(plane,28,5,.2),false,'air movement begins');
assert.ok(plane.x>start,'aircraft moves under own flight logic');
assert.equal(game.unitRadius(plane),.35);
game.draw();
assert.ok(operations.some(o=>o[0]==='drawImage'),'legacy directional tanks preserved');
console.log('PASS: animated high-DPI faction roster, structures, flying aircraft, and existing tank atlases');
