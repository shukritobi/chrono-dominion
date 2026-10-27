/* Chrono Dominion Blender sprite-atlas runtime, original 3D-rendered frames.
 * Manifest and all images are optional; live animated vector art remains fallback.
 * No runtime Blender/WebGL dependency, no synchronous network requests.
 */
(function(root){
  'use strict';
  const ENCODING='chrono-blender-v1',BASE='./art/baked-v1/';
  const models={},positions=new Map();
  const validFaction=new Set(['coalition','federation','psionic']);
  const validKinds=new Set(['soldier','specialist','tank','heavy','recon','harvester','aircraft',
    'hq','generator','refinery','barracks','factory','radar','tech','turret','beam','airfield']);
  const validStates=new Set(['idle','move','attack','construct','damaged']);
  let started=false,assetCount=0;
  const finite=v=>Number.isFinite(v)?v:0;
  function suitable(manifest){
    return manifest?.format===ENCODING&&[128,160,192,256].includes(manifest.frameSize)
      &&typeof manifest.entries==='object';
  }
  function load(){
    if(started)return;
    started=true;
    if(typeof root.fetch!=='function'||typeof root.Image!=='function')return;
    root.fetch(BASE+'manifest.json',{cache:'no-cache'}).then(r=>{
      if(!r.ok)throw Error('No baked asset manifest');
      return r.json();
    }).then(manifest=>{
      if(!suitable(manifest))return;
      for(const [faction,unitMap] of Object.entries(manifest.entries||{})){
        if(!validFaction.has(faction)||!unitMap)continue;
        const set=models[faction]??={};
        for(const [kind,spec] of Object.entries(unitMap)){
          if(!validKinds.has(kind)||typeof spec?.file!=='string'||
              !/^[a-z]+-[a-z]+\.png$/.test(spec.file)||
              ![1,8].includes(spec.directions)||!spec.states)continue;
          const states=spec.states;
          if(Object.keys(states).some(key=>!validStates.has(key)||!Number.isInteger(states[key])||
            states[key]<1||states[key]>12))continue;
          const img=new root.Image();
          const rows=Object.values(states).reduce((sum,n)=>sum+n,0);
          const width=spec.directions*manifest.frameSize,height=rows*manifest.frameSize;
          const entry={img,states,directions:spec.directions,size:manifest.frameSize,
            ready:false,pivot:Array.isArray(spec.pivot)?spec.pivot:[manifest.frameSize/2,manifest.frameSize*.88]};
          set[kind]=entry;
          img.onload=()=>{
            if(img.naturalWidth===width&&img.naturalHeight===height){entry.ready=true;assetCount++;}
          };
          img.onerror=()=>{entry.ready=false;};
          img.decoding='async';
          img.src=BASE+spec.file;
        }
      }
    }).catch(()=>{}); // Keep vector fallback without browser errors.
  }
  function animation(e,t,kind,states){
    if(e.type==='building'){
      if(e.built===false&&states.construct)return ['construct',Math.min(states.construct-1,Math.floor((e.construction||0)*states.construct))];
      if(e.hp/e.maxHp<.46&&states.damaged)return ['damaged',Math.floor(t*2)%states.damaged];
      return ['idle',Math.floor(t*2.5+e.id*.23)%Math.max(1,states.idle||1)];
    }
    const before=positions.get(e.id),moving=before?
      Math.hypot(e.x-before.x,e.y-before.y)>.004:false;
    const lastMoved=moving?t:(before?.lastMoved||0);
    positions.set(e.id,{x:e.x,y:e.y,lastMoved});
    if(positions.size>2200)positions.clear();
    if(e.engaging&&states.attack&&(e.ready||0)>.12)
      return ['attack',Math.floor(t*9+e.id)%states.attack];
    if((moving||t-lastMoved<.13)&&states.move)
      return ['move',Math.floor(t*9+e.id*.37)%states.move];
    return ['idle',Math.floor(t*2+e.id*.29)%Math.max(1,states.idle||1)];
  }
  function draw(c,e,options={}){
    const faction=options.faction;
    const entry=models[faction]?.[e.kind];
    if(!entry?.ready)return false;
    const isBuilding=e.type==='building'||entry.directions===1;
    const size=e.kind==='aircraft'?112:e.kind==='heavy'?104:
      e.kind==='harvester'?98:e.kind==='recon'?80:e.kind==='tank'?98:
      e.kind==='soldier'||e.kind==='specialist'?58:
      isBuilding?151:88;
    const time=finite(options.time),states=entry.states;
    let [state,frame]=animation(e,time,e.kind,states);
    if(!states[state]){state='idle';frame=0;}
    const index=Object.keys(states).slice(0,Object.keys(states).indexOf(state))
      .reduce((sum,key)=>sum+states[key],0)+frame;
    const radians=finite(e.worldHeading);
    const dir=isBuilding?0:((Math.round(radians*entry.directions/(2*Math.PI))%
      entry.directions)+entry.directions)%entry.directions;
    const pivotY=Math.max(0,Math.min(entry.size,finite(entry.pivot[1])));
    const dx=-size*.5,dy=-size*pivotY/entry.size+
      (e.kind==='aircraft'?Math.max(0,Math.min(1,finite(options.service?.blend)))*43:0);
    // Building smoke/construction overlay is rendered by the existing engine.
    c.drawImage(entry.img,dir*entry.size,index*entry.size,entry.size,entry.size,
      dx,dy,size,size);
    return true;
  }
  function drawUnit(c,e,options){return draw(c,e,options);}
  function drawBuilding(c,e,options){return draw(c,e,options);}
  root.ChronoBakedArt={version:'1.0.0',load,drawUnit,drawBuilding,
    get readyCount(){return assetCount;},get models(){return models;},suitable};
  // Load once; instances may call load again, which is idempotent.
  load();
})(typeof window==='object'?window:globalThis);
