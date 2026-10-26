#!/usr/bin/env node
/* Generate the static browser catalog from editable map JSON definitions.
   Usage: node tools/maps/build.mjs      regenerates catalog.js
          node tools/maps/build.mjs --check  validates and compares without writing
*/
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const names=['verdant','desert','snow','expanse'];
const maps={};
for(const name of names){
  const file=path.join(root,'maps',name+'.json');
  const obj=JSON.parse(fs.readFileSync(file,'utf8'));
  const bad=reason=>{throw new Error(name+': '+reason);};
  if(obj.id!==name||typeof obj.name!=='string'||typeof obj.description!=='string')bad('invalid identity');
  if(!/^#[0-9a-fA-F]{6}$/.test(obj.waterColor))bad('invalid water color');
  const size=obj.size===48?48:34;
  if(name==='expanse'&&size!==48)bad('expanse must use 48 tiles');
  if(!Array.isArray(obj.ore)||obj.ore.length<4||obj.ore.length>50)bad('ore sites missing/out of bounds');
  if(!Array.isArray(obj.waterRects)||obj.waterRects.length<1||obj.waterRects.length>15)bad('water rectangles missing');
  for(const rect of obj.waterRects){
    if(!Array.isArray(rect)||rect.length!==4||!rect.every(Number.isFinite)||
       rect[0]<0||rect[1]>size||rect[2]<0||rect[3]>size||rect[0]>=rect[1]||rect[2]>=rect[3])bad('invalid water rectangle');
  }
  const water=(x,y)=>obj.waterRects.some(([a,b,c,d])=>x>a&&x<b&&y>c&&y<d);
  for(const p of obj.ore){
    if(!Array.isArray(p)||p.length!==2||!p.every(Number.isInteger)||
       p.some(v=>v<2||v>size-2)||water(p[0],p[1]))bad('invalid ore location');
  }
  for(const [x,y] of [[5,6],[size-6,size-7]]){
    if(water(x,y))bad('spawn base is submerged');
  }
  maps[name]=obj;
}
const output='/* Generated from maps/*.json by node tools/maps/build.mjs. Do not edit manually. */\nwindow.ChronoMapCatalog = '+JSON.stringify(maps,null,2)+';\n';
const dest=path.join(root,'maps','catalog.js');
if(process.argv.includes('--check')){
  if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==output){
    throw new Error('maps/catalog.js is outdated. Run node tools/maps/build.mjs and commit it.');
  }
  console.log('PASS: '+names.length+' map JSON files validated and catalog.js matches');
}else{
  fs.writeFileSync(dest,output,'utf8');
  console.log('Wrote '+dest);
}
