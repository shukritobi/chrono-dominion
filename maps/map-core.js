/* Chrono Dominion v1.0: shared map authoring, storage and validation.
 * Works in the editor and the game, with no build dependencies.
 */
(function(root){
  'use strict';
  const SIZE=34, STORAGE_KEY='chrono-dominion-custom-map-v1';
  const BASES=[[5,6],[8,6],[5,9],[8,9],[28,27],[25,27],[28,24],[25,24]];
  const STARTING_UNITS=[[6,11],[7,11],[9,11],[7,11],[27,22],[26,22],[24,22],[26,22]];
  function key(x,y){return x+','+y;}
  function blockedSpawn(x,y){
    // Protect full 3x3 starting building footprints and immediate unit locations.
    return BASES.some(([a,b])=>Math.abs(a-x)<=1.5&&Math.abs(b-y)<=1.5)||
      STARTING_UNITS.some(([a,b])=>Math.abs(a-x)<.7&&Math.abs(b-y)<.7);
  }
  function isTile(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<SIZE&&y<SIZE;}
  function waterAt(map,x,y){
    if(Array.isArray(map?.waterTiles))return map.waterTiles.some(p=>p[0]===x&&p[1]===y);
    return (map?.waterRects||[]).some(([x0,x1,y0,y1])=>x+.5>x0&&x+.5<x1&&y+.5>y0&&y+.5<y1);
  }
  function validate(map){
    if(!map||typeof map!=='object')return {valid:false,error:'Map data must be an object'};
    if(map.id!=='custom')return {valid:false,error:'Custom map ID must be "custom"'};
    if(typeof map.name!=='string'||map.name.trim().length<3||map.name.trim().length>48)return {valid:false,error:'Map name must have 3–48 characters'};
    if(!['verdant','desert','snow'].includes(map.theme))return {valid:false,error:'Choose a supported terrain theme'};
    if(!Array.isArray(map.waterTiles)||map.waterTiles.length>520)return {valid:false,error:'Too many blocked water tiles'};
    if(!Array.isArray(map.ore)||map.ore.length<4||map.ore.length>36)return {valid:false,error:'Add between 4 and 36 ore deposits'};
    const used=new Set();
    for(const pair of map.waterTiles){
      if(!Array.isArray(pair)||pair.length!==2||!isTile(pair[0],pair[1]))return {valid:false,error:'Water must be placed inside the 34×34 map'};
      const k=key(pair[0],pair[1]);if(used.has(k))return {valid:false,error:'Duplicate water tile'};
      used.add(k);
      if(blockedSpawn(...pair))return {valid:false,error:'Water overlaps a protected starting base or unit'};
    }
    const ores=new Set();
    for(const pair of map.ore){
      if(!Array.isArray(pair)||pair.length!==2||!isTile(pair[0],pair[1]))return {valid:false,error:'Ore must be placed inside the map'};
      const k=key(...pair);
      if(ores.has(k)||used.has(k))return {valid:false,error:'Ore deposits must be unique and on dry land'};
      if(blockedSpawn(...pair))return {valid:false,error:'Ore overlaps a protected starting base'};
      ores.add(k);
    }
    return {valid:true,error:null};
  }
  function fromTemplate(input,name){
    const m=input||{};
    const waterTiles=[];
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)if(waterAt(m,x,y)&&!blockedSpawn(x,y))waterTiles.push([x,y]);
    const ore=Array.isArray(m.ore)?m.ore.filter(p=>Array.isArray(p)&&isTile(...p)&&!waterTiles.some(q=>q[0]===p[0]&&q[1]===p[1])&&!blockedSpawn(...p)).map(p=>[...p]):[];
    return {id:'custom',name:name||'My Battlefield',description:'Player-designed Chrono Dominion battlefield',
      theme:['verdant','desert','snow'].includes(m.theme)?m.theme:['verdant','desert','snow'].includes(m.id)?m.id:'verdant',
      waterColor:typeof m.waterColor==='string'?m.waterColor:'#2d6179',
      waterTiles,waterRects:[],ore};
  }
  // Versioned multi-map library. Each entry holds a validated editable
  // map, while the active entry is mirrored at the v1 key for compatibility.
  const LIBRARY_KEY='chrono-dominion-map-library-v2',MAX_MAPS=12;
  const freshLibrary=()=>({version:2,activeId:null,nextId:1,items:[]});
  const copy=value=>JSON.parse(JSON.stringify(value));
  const storageOf=storage=>storage||root.localStorage;
  function library(storage){
    try{
      const store=storageOf(storage);
      const encoded=store.getItem(LIBRARY_KEY);
      if(encoded){
        const candidate=JSON.parse(encoded);
        if(candidate?.version!==2||!Array.isArray(candidate.items)||candidate.items.length>MAX_MAPS)return freshLibrary();
        const seen=new Set(),items=[];
        for(const item of candidate.items){
          if(!item||!/^map-[1-9][0-9]*$/.test(item.slotId)||seen.has(item.slotId)||!validate(item.map).valid)continue;
          seen.add(item.slotId);
          items.push({slotId:item.slotId,map:copy(item.map),updatedAt:Number.isFinite(item.updatedAt)?item.updatedAt:0});
        }
        const maxId=Math.max(0,...items.map(item=>Number(item.slotId.slice(4))));
        const activeId=items.some(item=>item.slotId===candidate.activeId)?candidate.activeId:items[0]?.slotId||null;
        return {version:2,activeId,nextId:Math.max(maxId+1,Number.isSafeInteger(candidate.nextId)?candidate.nextId:1),items};
      }
      // Migrates the v1 single-map slot on the first library write.
      const legacy=store.getItem(STORAGE_KEY);
      if(legacy){
        const map=JSON.parse(legacy);
        if(validate(map).valid)return {version:2,activeId:'map-1',nextId:2,items:[{slotId:'map-1',map:copy(map),updatedAt:0}]};
      }
    }catch(err){/* Missing or malformed storage fails closed. */}
    return freshLibrary();
  }
  function commitLibrary(data,storage){
    try{
      const store=storageOf(storage);
      store.setItem(LIBRARY_KEY,JSON.stringify(data));
      const active=data.items.find(item=>item.slotId===data.activeId);
      // Keep old clients and skirmish loader able to read the active map.
      if(active)store.setItem(STORAGE_KEY,JSON.stringify(active.map));
      else if(typeof store.removeItem==='function')store.removeItem(STORAGE_KEY);
      return {valid:true,error:null,slotId:data.activeId};
    }catch(err){return {valid:false,error:'Map library could not be saved (storage unavailable or full)'};
    }
  }
  function list(storage){
    const l=library(storage);
    return {version:l.version,activeId:l.activeId,limit:MAX_MAPS,
      maps:l.items.map(item=>({slotId:item.slotId,name:item.map.name,theme:item.map.theme,
        water:item.map.waterTiles.length,ore:item.map.ore.length,updatedAt:item.updatedAt}))};
  }
  function load(storage){
    const l=library(storage);
    const entry=l.items.find(item=>item.slotId===l.activeId);
    return entry?copy(entry.map):null;
  }
  function loadSlot(slotId,storage){
    const entry=library(storage).items.find(item=>item.slotId===slotId);
    return entry?copy(entry.map):null;
  }
  function select(slotId,storage){
    const l=library(storage);
    if(!l.items.some(item=>item.slotId===slotId))return {valid:false,error:'Map slot not found'};
    l.activeId=slotId;
    return commitLibrary(l,storage);
  }
  function save(map,storage){
    const result=validate(map);if(!result.valid)return result;
    const l=library(storage),active=l.items.find(item=>item.slotId===l.activeId);
    if(!active)return saveAs(map,storage);
    active.map=copy(map);active.updatedAt=Date.now();
    return commitLibrary(l,storage);
  }
  function saveAs(map,storage){
    const result=validate(map);if(!result.valid)return result;
    const l=library(storage);
    if(l.items.length>=MAX_MAPS)return {valid:false,error:'Map library is full (12 maps). Export or delete a map to make space.'};
    const id='map-'+l.nextId++;
    l.items.push({slotId:id,map:copy(map),updatedAt:Date.now()});
    l.activeId=id;
    return commitLibrary(l,storage);
  }
  function duplicate(slotId,storage){
    const m=loadSlot(slotId,storage);
    if(!m)return {valid:false,error:'Map slot not found'};
    m.name=(m.name.slice(0,43)+' Copy').slice(0,48);
    return saveAs(m,storage);
  }
  function remove(slotId,storage){
    const l=library(storage),index=l.items.findIndex(item=>item.slotId===slotId);
    if(index<0)return {valid:false,error:'Map slot not found'};
    l.items.splice(index,1);
    if(l.activeId===slotId)l.activeId=l.items[0]?.slotId||null;
    return commitLibrary(l,storage);
  }
  root.ChronoMaps={SIZE,STORAGE_KEY,LIBRARY_KEY,MAX_MAPS,BASES,blockedSpawn,
    validate,fromTemplate,save,saveAs,load,loadSlot,list,select,duplicate,remove,waterAt};
})(typeof window==='object'?window:globalThis);
