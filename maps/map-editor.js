/* Chrono Dominion Map Forge: touch-friendly editor for local custom skirmishes. */
(function(){
  'use strict';
  const core=window.ChronoMaps, catalog=window.ChronoMapCatalog;
  if(!core||!catalog)return;
  const $=id=>document.getElementById(id), canvas=$('editorCanvas'),ctx=canvas.getContext('2d');
  const SIZE=core.SIZE,CELL=canvas.width/SIZE,landColors={
    verdant:['#345d49','#406e54','#51775a'],desert:['#817252','#937e57','#a08c69'],
    snow:['#93adb6','#a3b6bb','#bac8cd']
  };
  let map=core.load()||core.fromTemplate(catalog.verdant,'My Battlefield');
  let tool='water',painting=false,previousCell='';
  function cellFromEvent(e){
    const rect=canvas.getBoundingClientRect();
    const x=Math.floor((e.clientX-rect.left)/rect.width*SIZE);
    const y=Math.floor((e.clientY-rect.top)/rect.height*SIZE);
    return {x,y};
  }
  function pairIndex(pairs,x,y){return pairs.findIndex(p=>p[0]===x&&p[1]===y);}
  function inform(message,error=false){
    const el=$('status');el.textContent=message;el.classList.toggle('error',error);
  }
  function repaint(){
    map.theme=$('mapTheme').value;
    map.name=$('mapName').value;
    const colors=landColors[map.theme]||landColors.verdant;
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
      const kind=(x*17+y*23+x*y*11)%colors.length;
      ctx.fillStyle=core.waterAt(map,x,y)?(catalog[map.theme]?.waterColor||'#376c86'):colors[kind];
      ctx.fillRect(x*CELL,y*CELL,CELL+.15,CELL+.15);
    }
    ctx.strokeStyle='#a3d5de1b';ctx.lineWidth=.65;
    for(let i=0;i<=SIZE;i++){
      ctx.beginPath();ctx.moveTo(i*CELL,0);ctx.lineTo(i*CELL,canvas.height);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,i*CELL);ctx.lineTo(canvas.width,i*CELL);ctx.stroke();
    }
    for(const [x,y] of map.ore){
      const cx=(x+.5)*CELL,cy=(y+.5)*CELL;
      ctx.fillStyle='#1c2731';ctx.beginPath();ctx.arc(cx,cy,CELL*.35,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#e4bb71';ctx.beginPath();
      ctx.moveTo(cx,cy-CELL*.32);ctx.lineTo(cx+CELL*.27,cy);ctx.lineTo(cx,cy+CELL*.34);
      ctx.lineTo(cx-CELL*.27,cy);ctx.closePath();ctx.fill();
    }
    ctx.globalAlpha=.15;ctx.fillStyle='#f5f9ff';
    for(const [x,y] of core.BASES)ctx.fillRect((x-1)*CELL,(y-1)*CELL,3*CELL,3*CELL);
    ctx.globalAlpha=1;
    for(const [x,y,color] of [[5,6,'#78ecf0'],[28,27,'#f18476']]){
      ctx.fillStyle='#102639';ctx.fillRect((x-.8)*CELL,(y-.8)*CELL,CELL*1.6,CELL*1.6);
      ctx.fillStyle=color;ctx.fillRect((x-.48)*CELL,(y-.48)*CELL,CELL*.96,CELL*.96);
    }
    $('waterCount').textContent=String(map.waterTiles.length);
    $('oreCount').textContent=String(map.ore.length);
  }
  function paint(x,y){
    if(x<0||y<0||x>=SIZE||y>=SIZE)return;
    const cell=x+','+y;
    if(cell===previousCell)return;
    previousCell=cell;
    if(core.blockedSpawn(x,y)){inform('Protected starting zone: keep both command bases clear.',true);return;}
    const water=pairIndex(map.waterTiles,x,y),ore=pairIndex(map.ore,x,y);
    if(tool==='water'){
      if(water<0)map.waterTiles.push([x,y]);
      if(ore>=0)map.ore.splice(ore,1);
    }else if(tool==='land'){
      if(water>=0)map.waterTiles.splice(water,1);
    }else if(tool==='ore'){
      if(water>=0)map.waterTiles.splice(water,1);
      if(ore<0&&map.ore.length<36)map.ore.push([x,y]);
    }else if(tool==='removeOre'){
      if(ore>=0)map.ore.splice(ore,1);
    }
    repaint();
    const result=core.validate(map);
    if(result.valid)inform('Map is valid. Save it or export a JSON backup.');
    else inform(result.error,true);
  }
  function chooseTool(t){
    if(!['water','land','ore','removeOre'].includes(t))return;
    tool=t;
    for(const btn of $('tools').querySelectorAll('button[data-tool]')){
      btn.setAttribute('aria-pressed',String(btn.dataset.tool===t));
    }
    inform({water:'Water brush selected. Drag to paint lakes.',land:'Land brush selected. Drag to clear water.',
      ore:'Ore brush selected. Tap to place deposits.',removeOre:'Erase Ore selected. Tap to remove deposits.'}[t]);
  }
  function useMap(input){
    map=core.fromTemplate(input,input?.id==='custom'?input.name:'My Battlefield');
    if(input?.id==='custom')map={...input,waterTiles:input.waterTiles.map(p=>[...p]),ore:input.ore.map(p=>[...p])};
    $('mapName').value=map.name;
    $('mapTheme').value=map.theme;
    repaint();
    const result=core.validate(map);
    inform(result.valid?'Loaded map is ready to save and play.':result.error,!result.valid);
  }
  function save(){
    repaint();
    const result=core.save(map);
    inform(result.valid?'Map saved to this browser. Open Skirmish and choose Custom Battlefield.':result.error,!result.valid);
    return result.valid;
  }
  $('tools').addEventListener('click',e=>{
    const button=e.target.closest('button[data-tool]');if(button)chooseTool(button.dataset.tool);
  });
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();painting=true;previousCell='';
    if(canvas.setPointerCapture)canvas.setPointerCapture(e.pointerId);
    const p=cellFromEvent(e);paint(p.x,p.y);
  });
  canvas.addEventListener('pointermove',e=>{
    if(!painting)return;e.preventDefault();
    const p=cellFromEvent(e);paint(p.x,p.y);
  });
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,()=>{painting=false;previousCell='';});
  $('mapTheme').addEventListener('change',()=>{map.waterColor=catalog[$('mapTheme').value]?.waterColor||'#2d6179';repaint();});
  $('mapName').addEventListener('input',()=>{map.name=$('mapName').value;});
  $('loadTemplate').addEventListener('click',()=>{
    const key=$('template').value;
    if(key==='blank')useMap({id:'blank',theme:'verdant',name:'My Battlefield',ore:[],waterRects:[]});
    else useMap(catalog[key]);
    inform('Template loaded. Changes are not saved until you choose Save.');
  });
  $('saveMap').addEventListener('click',save);
  $('playMap').addEventListener('click',()=>{if(save())window.location.href='./index.html?map=custom';});
  $('restoreMap').addEventListener('click',()=>{
    const stored=core.load();
    if(stored)useMap(stored);else inform('No valid custom map saved in this browser.',true);
  });
  $('exportMap').addEventListener('click',()=>{
    repaint();
    const result=core.validate(map);
    if(!result.valid){inform(result.error,true);return;}
    const blob=new Blob([JSON.stringify(map,null,2)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='ChronoDominion-CustomMap.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    inform('Map JSON downloaded. Keep it as a reusable backup.');
  });
  $('importMap').addEventListener('click',()=>$('fileInput').click());
  $('fileInput').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      if(file.size>70000)throw Error('File is too large for one battlefield.');
      const data=JSON.parse(await file.text());
      if(data.id!=='custom')throw Error('Import a custom map exported from Map Forge.');
      const result=core.validate(data);
      if(!result.valid)throw Error(result.error);
      useMap(data);inform('Map imported. Save to this browser when ready.');
    }catch(err){inform('Import failed: '+err.message,true);}
    e.target.value='';
  });
  chooseTool('water');
  useMap(map);
})();
