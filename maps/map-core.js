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
  function save(map,storage){
    const result=validate(map);
    if(!result.valid)return result;
    try{
      (storage||root.localStorage).setItem(STORAGE_KEY,JSON.stringify(map));
      return {valid:true,error:null};
    }catch(err){return {valid:false,error:'Browser storage unavailable or full'};}
  }
  function load(storage){
    try{
      const raw=(storage||root.localStorage).getItem(STORAGE_KEY);
      if(!raw)return null;
      const map=JSON.parse(raw);
      return validate(map).valid?map:null;
    }catch(err){return null;}
  }
  root.ChronoMaps={SIZE,STORAGE_KEY,BASES,blockedSpawn,validate,fromTemplate,save,load,waterAt};
})(typeof window==='object'?window:globalThis);
