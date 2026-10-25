/* Chrono Dominion v0.9 — battle statistics, map files and reconnaissance patrols. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const WORLD_SIZE = 34, TW = 64, TH = 32;
  const SAVE_KEY='chrono-dominion-skirmish-v1';
  const FACTION_BALANCE={
    coalition:{tank:{speed:1.12},heavy:{speed:1.10},recon:{speed:1.18,hp:.9}},
    federation:{tank:{hp:1.18,damage:1.13,speed:.90},heavy:{hp:1.15,damage:1.12,speed:.88},recon:{hp:1.28,damage:1.1,speed:.87}},
    psionic:{tank:{speed:1.13,hp:.91,damage:.94},specialist:{range:1.14},recon:{speed:1.13,range:1.09}}
  };
  const MAPS=window.ChronoMapCatalog||{
    verdant:{name:'Verdant Front',description:'Twin lake basins, fertile grassland and multiple contested ore veins.',ore:[[10,12],[13,15],[18,17],[23,21],[25,24],[19,11],[12,21]],waterColor:'#2d6179',waterRects:[[22,32,2,8],[2,9,22,28]]},
    desert:{name:'Ashen Basin',description:'Open desert routes, a central canyon lake and exposed mineral deposits.',ore:[[10,10],[14,14],[20,16],[22,20],[26,24],[15,24],[24,12]],waterColor:'#426c88',waterRects:[[12,22,10,13],[15,19,13,21],[3,7,23,28]]},
    snow:{name:'Frostline',description:'Icy lake channels and ore-rich frozen highlands with narrow approaches.',ore:[[11,13],[14,18],[18,22],[24,21],[24,25],[21,11],[10,23]],waterColor:'#618c98',waterRects:[[13,17,3,14],[16,19,14,21],[19,23,20,31]]}
  };
  const ABILITIES={
    coalition:{name:'Chrono Jump',cooldown:20,range:6.2,color:'#8bdbf9'},
    federation:{name:'Arc Discharge',cooldown:17,range:3.6,color:'#ffb36c'},
    psionic:{name:'Neural Jam',cooldown:24,range:4.1,color:'#d292f8'}
  };
  const COLORS = {
    coalition: {name:'COALITION FORCES',color:'#55c8e8',top:'#66879b',side:'#263e54',trim:'#8ce5ef',badge:'◈'},
    federation: {name:'IRON FEDERATION',color:'#e37665',top:'#8c7770',side:'#493b40',trim:'#f3a06d',badge:'★'},
    psionic: {name:'PSIONIC ORDER',color:'#bf8bec',top:'#846b9e',side:'#302a4d',trim:'#80e0cd',badge:'✧'}
  };
  const BUILD = {
    hq:{name:'Command Citadel',icon:'⌂',cost:0,hp:1300,power:0,requires:[]},
    generator:{name:'Power Generator',icon:'⚡',cost:650,hp:500,power:110,requires:['hq']},
    refinery:{name:'Ore Refinery',icon:'◆',cost:1300,hp:700,power:-35,requires:['generator']},
    barracks:{name:'Barracks',icon:'▥',cost:500,hp:520,power:-15,requires:['generator']},
    factory:{name:'War Factory',icon:'▣',cost:1700,hp:850,power:-65,requires:['refinery']},
    radar:{name:'Radar Array',icon:'◎',cost:900,hp:450,power:-40,requires:['refinery']},
    tech:{name:'Technology Lab',icon:'✧',cost:2200,hp:550,power:-90,requires:['factory','radar']},
    turret:{name:'Sentry Turret',icon:'♜',cost:600,hp:420,power:-20,requires:['generator'],range:5.1,damage:15,rate:1.1},
    beam:{name:'Energy Tower',icon:'◉',cost:1200,hp:470,power:-75,requires:['barracks','radar'],range:6.5,damage:26,rate:1.65}
  };
  const UNITS = {
    soldier:{name:'Rifle Squad',icon:'♟',cost:200,hp:70,speed:1.9,range:3.0,damage:11,rate:1.05,from:'barracks'},
    specialist:{name:'Special Operative',icon:'✦',cost:700,hp:80,speed:2.0,range:3.2,damage:14,rate:1.4,from:'barracks',requires:['radar']},
    tank:{name:'Battle Tank',icon:'▰',cost:850,hp:270,speed:1.55,range:4.0,damage:32,rate:1.45,from:'factory'},
    heavy:{name:'Siege Tank',icon:'▱',cost:1450,hp:420,speed:1.02,range:5.0,damage:53,rate:2.0,from:'factory',requires:['tech']},
    harvester:{name:'Ore Harvester',icon:'◈',cost:900,hp:310,speed:1.23,range:0,damage:0,from:'refinery'},
    recon:{name:'Recon Vehicle',icon:'⌁',cost:550,hp:145,speed:2.55,range:3.2,damage:13,rate:.9,from:'factory'}
  };
  const NAMES = {
    coalition:{hq:'Field Command',generator:'Fusion Array',refinery:'Ore Processor',barracks:'Training Centre',factory:'Vehicle Assembly',radar:'Tactical Radar',tech:'Chrono Laboratory',turret:'Auto Cannon',beam:'Prism Array',soldier:'Ranger',specialist:'Chrono Operative',tank:'Lynx Tank',heavy:'Bulwark MBT',harvester:'Alloy Harvester',recon:'Lynx Scout'},
    federation:{hq:'Iron Command',generator:'Thermal Reactor',refinery:'Industrial Refinery',barracks:'Garrison',factory:'Armour Foundry',radar:'Signal Tower',tech:'Weapons Institute',turret:'Gun Nest',beam:'Arc Coil',soldier:'Rifleman',specialist:'Arc Trooper',tank:'Bull Tank',heavy:'Mammoth Tank',harvester:'Ore Carrier',recon:'Iron Patrol'},
    psionic:{hq:'Neural Nexus',generator:'Bio Reactor',refinery:'Neural Refinery',barracks:'Initiation Chamber',factory:'Mind Forge',radar:'Psi Scanner',tech:'Ascension Spire',turret:'Neural Sentinel',beam:'Psychic Spire',soldier:'Acolyte',specialist:'Neural Disciple',tank:'Viper Tank',heavy:'Mindbreaker',harvester:'Psi Collector',recon:'Shade Runner'}
  };
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const turnToward=(current,wanted,maxDelta)=>{const delta=Math.atan2(Math.sin(wanted-current),Math.cos(wanted-current));return current+clamp(delta,-maxDelta,maxDelta);};
  const iso=(x,y)=>({x:(x-y)*TW/2,y:(x+y)*TH/2});
  const rand=(x,y,s=0)=>{let v=Math.sin(x*123.17+y*78.233+s*103.13)*43758.5453;return v-Math.floor(v);};
  const terrain = {
    verdant:['#3c604d','#416951','#456e56','#4b7459','#395d49'],
    desert:['#786c4d','#807351','#897952','#7f714b','#92805a'],
    snow:['#9baeb1','#a3b4b7','#adbdbe','#97a9ad','#b6c2c3']
  };
  class Game {
    constructor(){
      this.canvas=$('world');this.ctx=this.canvas.getContext('2d');
      this.radar=$('radar');this.rctx=this.radar.getContext('2d');
      this.camera={x:0,y:545,zoom:1};this.keys=new Set();
      this.entities=[];this.ores=[];this.particles=[];this.projectiles=[];this.orders=[];this.queues=[];this.nextId=1;
      this.selected=[];this.groups={};this.attackMoveArmed=false;this.abilityArmedId=null;this.dragStart=null;this.dragEnd=null;this.touchPointer=null;this.placing=null;this.tab='structures';
      this.players=[];this.stats=[];this.state='menu';this.last=performance.now();this.time=0;this.nextAI=0;this.nextUi=0;this.nextFog=0;this.fog=[];
      this.mouse={x:0,y:0,worldX:0,worldY:0};this.toastTimer=null;
      this.sprites={};this.buildingSprites={};this.defenseSprites={};this.infantrySprites={};this.specialistSprites={};this.reconSprites={};this.loadPilotSprites();
      this.vehicleAtlases=null;
      if(window.ChronoVehicleArt){try{this.vehicleAtlases=window.ChronoVehicleArt.createAtlases();}catch(err){console.warn('Directional atlas fallback:',err);}}
      this.loadRenderedAtlases();
      this.settings={playerFaction:'coalition',enemyFaction:'federation',map:'verdant',difficulty:'standard'};
      this.setupEvents();this.resize();this.updateSaveButtons();requestAnimationFrame(t=>this.frame(t));
    }
    loadPilotSprites(){
      if(typeof Image==='undefined')return;
      const files={coalition:'coalition-lynx',federation:'federation-bull',psionic:'psionic-viper'};
      for(const [faction,file] of Object.entries(files)){
        const img=new Image();img.decoding='async';img.src='./art/pilot/'+file+'.svg';
        this.sprites[faction]=img;
        const power=new Image();power.decoding='async';power.src='./art/pilot/'+faction+'-power.svg';
        this.buildingSprites[faction]=power;
        const defense=new Image();defense.decoding='async';defense.src='./art/pilot/'+faction+'-turret.svg';
        this.defenseSprites[faction]=defense;
        const infantry=new Image();infantry.decoding='async';infantry.src='./art/pilot/'+faction+'-infantry.svg';
        this.infantrySprites[faction]=infantry;
        const specialist=new Image();specialist.decoding='async';specialist.src='./art/pilot/'+faction+'-specialist.svg';
        this.specialistSprites[faction]=specialist;
        const recon=new Image();recon.decoding='async';recon.src='./art/pilot/'+faction+'-recon.svg';
        this.reconSprites[faction]=recon;
      }
    }
    loadRenderedAtlases(){
      // Production PNG atlases can replace the procedural pilot automatically
      // after the original Blender render pipeline produces complete pairs.
      if(typeof fetch!=='function'||typeof Image==='undefined')return;
      fetch('./art/rendered/manifest.json',{cache:'no-cache'}).then(response=>{
        if(!response.ok)throw Error('Atlas manifest unavailable');
        return response.json();
      }).then(manifest=>{
        if(manifest.format!=='png-atlas-v1'||manifest.directions!==32||
          manifest.frameSize!==128||manifest.columns!==8)return;
        for(const [faction,pair] of Object.entries(manifest.atlases||{})){
          if(!Object.hasOwn(COLORS,faction)||!pair?.hull||!pair?.turret)continue;
          const hull=new Image(),turret=new Image();
          let loaded=0,failed=false;
          const accept=()=>{
            if(failed||++loaded!==2)return;
            if(hull.naturalWidth!==1024||hull.naturalHeight!==512||
               turret.naturalWidth!==1024||turret.naturalHeight!==512)return;
            this.vehicleAtlases??={};
            this.vehicleAtlases[faction]={hull,turret};
          };
          const reject=()=>{failed=true;};
          hull.onload=accept;turret.onload=accept;
          hull.onerror=reject;turret.onerror=reject;
          hull.src='./art/rendered/'+pair.hull;
          turret.src='./art/rendered/'+pair.turret;
        }
      }).catch(()=>{}); // Keep procedural original-art sprites as safe fallback.
    }
    setupEvents(){
      window.addEventListener('resize',()=>this.resize());
      window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(e.target?.closest?.('input,select,textarea'))return;
        if(k==='f6'&&(this.state==='playing'||this.state==='paused')){e.preventDefault();this.saveGame();return;}
        if(k==='f9'){e.preventDefault();this.loadGame();return;}
        if(k==='s'&&e.ctrlKey&&(this.state==='playing'||this.state==='paused')){e.preventDefault();this.saveGame();return;}
        if(this.state==='playing'&&/^[1-9]$/.test(k)){
          e.preventDefault();
          if(e.ctrlKey){this.groups[k]=this.selected.filter(id=>{const unit=this.entityById(id);return unit&&unit.owner===0&&unit.type==='unit';});this.notify('Group '+k+' assigned ('+this.groups[k].length+' units)');}
          else {this.selected=(this.groups[k]||[]).filter(id=>{const unit=this.entityById(id);return unit&&unit.owner===0;});this.updateSelection();if(e.shiftKey)this.centerSelection();}
          return;
        }
        if(this.state==='playing'&&k==='f'&&this.selected.length){e.preventDefault();this.useSpecialistAbility();return;}
        if(this.state==='playing'&&['x','g','b','v','t'].includes(k)&&this.selected.length){
          const actions={x:'stop',g:'guard',b:'hold',v:'aggressive',t:'attackMove'};
          e.preventDefault();this.unitAction(actions[k]);return;
        }
        if(this.state==='playing'&&k==='h'){this.centerHQ();return;}
        if(this.state==='playing'&&k===' '){e.preventDefault();this.centerSelection();return;}
        this.keys.add(k);if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='escape'){if(this.placing){this.placing=null;this.updateUI(true);}else if(this.abilityArmedId){this.abilityArmedId=null;this.notify('Ability cancelled');this.updateSelection();}else if(this.state==='playing'||this.state==='paused')this.pause();}});
      window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
      this.canvas.addEventListener('contextmenu',e=>e.preventDefault());
      this.canvas.addEventListener('pointerdown',e=>this.pointerDown(e));
      this.canvas.addEventListener('pointermove',e=>this.pointerMove(e));
      this.canvas.addEventListener('pointercancel',()=>{this.touchPointer=null;this.dragStart=null;this.dragEnd=null;});
      window.addEventListener('pointerup',e=>this.pointerUp(e));
      this.canvas.addEventListener('wheel',e=>{e.preventDefault();this.camera.zoom=clamp(this.camera.zoom*(e.deltaY<0?1.09:.91),.65,1.8);},{passive:false});
      this.radar.addEventListener('click',e=>{if(this.state!=='playing')return;const r=this.radar.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*WORLD_SIZE,y=(e.clientY-r.top)/r.height*WORLD_SIZE;const p=iso(x,y);this.camera.x=p.x;this.camera.y=p.y;});
      $('tabs').addEventListener('click',e=>{const b=e.target.closest('button[data-tab]');if(b){this.tab=b.dataset.tab;this.updateUI(true);}});
      $('production').addEventListener('click',e=>{const b=e.target.closest('button[data-key]');if(b)this.chooseProduction(b.dataset.key);});
      $('queueList').addEventListener('click',e=>{const b=e.target.closest?.('button[data-cancel-key]');if(b)this.cancelProduction(b.dataset.cancelKey);});
      $('selection').addEventListener('click',e=>{const b=e.target.closest?.('button[data-action]');if(b)this.buildingAction(b.dataset.action);
        const unit=e.target.closest?.('button[data-unit-action]');if(unit)this.unitAction(unit.dataset.unitAction);
        const special=e.target.closest?.('button[data-special]');if(special)this.useSpecialistAbility();});
      $('openSkirmish').onclick=()=>{this.showMenu('skirmishMenu');this.drawMapPreview();};
      $('mapSelect').addEventListener('change',()=>this.drawMapPreview());
      $('backMenu').onclick=()=>this.showMenu('mainMenu');
      $('openHow').onclick=()=>this.showMenu('howMenu');
      $('backHow').onclick=()=>this.showMenu('mainMenu');
      $('start').onclick=()=>{const get=id=>$(id).value;this.newMatch({playerFaction:get('playerFaction'),enemyFaction:get('enemyFaction'),map:get('mapSelect'),difficulty:get('difficulty'),startingCredits:Number(get('startingCredits'))});};
      $('pauseBtn').onclick=()=>this.pause();$('resume').onclick=()=>this.pause();
      $('zoomIn').onclick=()=>{this.camera.zoom=clamp(this.camera.zoom*1.15,.65,1.8);};
      $('zoomOut').onclick=()=>{this.camera.zoom=clamp(this.camera.zoom/1.15,.65,1.8);};
      $('restart').onclick=()=>this.newMatch(this.settings);
      $('quit').onclick=()=>this.returnMenu();$('resultQuit').onclick=()=>this.returnMenu();
      $('playAgain').onclick=()=>this.newMatch(this.settings);
      $('copyResult').onclick=()=>this.copyBattleReport();
      $('saveGame').onclick=()=>this.saveGame();
      $('loadMain').onclick=()=>this.loadGame();
      $('loadPaused').onclick=()=>this.loadGame();
    }
    showMenu(which){['mainMenu','skirmishMenu','howMenu','pauseMenu','resultMenu'].forEach(id=>$(id).classList.toggle('hidden',id!==which));$('overlay').classList.remove('hidden');}
    returnMenu(){this.state='menu';this.selected=[];this.placing=null;this.showMenu('mainMenu');this.updateSaveButtons();this.updateUI(true);}
    pause(){if(this.state==='playing'){this.state='paused';this.showMenu('pauseMenu');this.updateSaveButtons();}else if(this.state==='paused'){this.state='playing';$('overlay').classList.add('hidden');}}
    hasSave(){
      try{return typeof localStorage!=='undefined'&&!!localStorage.getItem(SAVE_KEY);}
      catch(err){return false;}
    }
    updateSaveButtons(){
      for(const name of ['loadMain','loadPaused'])$(name).disabled=!this.hasSave();
    }
    saveGame(){
      if(this.state!=='playing'&&this.state!=='paused')return false;
      if(typeof localStorage==='undefined'){this.notify('Browser storage is unavailable');return false;}
      const state={
        version:1,createdAt:new Date().toISOString(),settings:this.settings,
        players:this.players,entities:this.entities,ores:this.ores,queues:this.queues,
        projectiles:this.projectiles,particles:this.particles,
        time:this.time,nextAI:this.nextAI,nextId:this.nextId,
        selected:this.selected,groups:this.groups,camera:this.camera,stats:this.stats,
        fog:this.fog.map(row=>row.map(cell=>!!cell.seen))
      };
      try{
        localStorage.setItem(SAVE_KEY,JSON.stringify(state));
        this.updateSaveButtons();this.notify('Skirmish saved in this browser');return true;
      }catch(err){this.notify('Unable to save: browser storage unavailable or full');return false;}
    }
    loadGame(){
      if(typeof localStorage==='undefined'){this.notify('Browser storage is unavailable');return false;}
      let saved;
      try{saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}
      catch(err){this.notify('Saved game is unreadable');return false;}
      if(!saved){this.notify('No saved skirmish in this browser');return false;}
      const validFaction=x=>Object.hasOwn(COLORS,x);
      // Validate before mutating the current game. A broken older snapshot must never destroy a live session.
      const valid= saved.version===1&&saved.settings&&
        validFaction(saved.settings.playerFaction)&&validFaction(saved.settings.enemyFaction)&&
        ['verdant','desert','snow'].includes(saved.settings.map)&&
        ['recruit','standard','veteran'].includes(saved.settings.difficulty)&&
        Array.isArray(saved.players)&&saved.players.length===2&&saved.players.every(p=>p&&validFaction(p.faction)&&Number.isFinite(p.credits)&&p.credits>=0)&&
        Array.isArray(saved.entities)&&saved.entities.length<2000&&
        saved.entities.every(e=>e&&Number.isInteger(e.id)&&e.id>0&&(e.owner===0||e.owner===1)&&
          (Object.hasOwn(BUILD,e.kind)||Object.hasOwn(UNITS,e.kind))&&
          Number.isFinite(e.x)&&Number.isFinite(e.y)&&e.x>=0&&e.y>=0&&e.x<=WORLD_SIZE&&e.y<=WORLD_SIZE&&
          Number.isFinite(e.hp)&&Number.isFinite(e.maxHp)&&e.maxHp>0)&&
        Array.isArray(saved.ores)&&saved.ores.length<=5000&&
        Array.isArray(saved.queues)&&saved.queues.length<=200&&
        Array.isArray(saved.fog)&&saved.fog.length===WORLD_SIZE&&
        saved.fog.every(row=>Array.isArray(row)&&row.length===WORLD_SIZE);
      if(!valid){this.notify('Saved game is incompatible with this version');return false;}
      this.settings={...saved.settings};
      this.players=saved.players.map(p=>({...p}));
      this.stats=Array.isArray(saved.stats)&&saved.stats.length===2?saved.stats.map(v=>({...this.newStats(),...v})): [this.newStats(),this.newStats()];
      this.entities=saved.entities.map(e=>({...e}));
      this.ores=saved.ores.map(o=>({...o}));
      this.queues=saved.queues.map(q=>({...q}));
      this.projectiles=Array.isArray(saved.projectiles)?saved.projectiles.filter(x=>x&&Number.isFinite(x.x)&&Number.isFinite(x.y)).map(x=>({...x})):[];
      this.particles=Array.isArray(saved.particles)?saved.particles.filter(x=>x&&Number.isFinite(x.x)&&Number.isFinite(x.y)).map(x=>({...x})):[];
      this.time=Number.isFinite(saved.time)?Math.max(0,saved.time):0;
      this.nextAI=Number.isFinite(saved.nextAI)?Math.max(this.time,saved.nextAI):this.time+5;
      this.nextId=Math.max(...this.entities.map(e=>e.id),0)+1;
      this.selected=Array.isArray(saved.selected)?saved.selected.filter(id=>this.entities.some(e=>e.id===id&&e.hp>0)):[];
      this.groups=saved.groups&&typeof saved.groups==='object'?saved.groups:{};
      this.camera=saved.camera&&Number.isFinite(saved.camera.x)&&Number.isFinite(saved.camera.y)&&Number.isFinite(saved.camera.zoom)?{
        x:clamp(saved.camera.x,-1020,1020),y:clamp(saved.camera.y,50,1080),zoom:clamp(saved.camera.zoom,.65,1.8)
      }:{x:0,y:370,zoom:1};
      this.fog=saved.fog.map(row=>row.map(seen=>({seen:!!seen,visible:false})));
      this.placing=null;this.attackMoveArmed=false;this.abilityArmedId=null;this.dragStart=null;this.dragEnd=null;this.touchPointer=null;
      this.keys.clear();this.nextUi=0;this.nextFog=0;
      this.state='playing';
      for(const [id,key] of [['playerFaction','playerFaction'],['enemyFaction','enemyFaction'],['mapSelect','map'],['difficulty','difficulty']])$(id).value=this.settings[key];
      $('startingCredits').value=String(this.settings.startingCredits||5000);
      this.drawMapPreview();
      this.updateFog();this.updateUI(true);this.updateSaveButtons();
      $('overlay').classList.add('hidden');
      this.notify('Saved skirmish loaded');return true;
    }
    centerHQ(){
      const h=this.entities.find(e=>e.owner===0&&e.kind==='hq'&&e.hp>0);
      if(h){const p=iso(h.x,h.y);this.camera.x=p.x;this.camera.y=p.y;}
    }
    centerSelection(){
      const live=this.selected.map(id=>this.entityById(id)).filter(Boolean);
      if(!live.length)return;
      const x=live.reduce((n,e)=>n+e.x,0)/live.length;
      const y=live.reduce((n,e)=>n+e.y,0)/live.length;
      const p=iso(x,y);this.camera.x=p.x;this.camera.y=p.y;
    }
    resize(){const b=this.canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);this.w=b.width;this.h=b.height;this.dpr=d;this.canvas.width=Math.round(this.w*d);this.canvas.height=Math.round(this.h*d);}
    add(owner,kind,x,y,built=true){
      const def=BUILD[kind]||UNITS[kind],modifier=FACTION_BALANCE[this.players[owner]?.faction]?.[kind]||{};
      const hitPoints=Math.round(def.hp*(modifier.hp||1));
      const e={id:this.nextId++,owner,kind,type:BUILD[kind]?'building':'unit',x,y,hp:hitPoints,maxHp:hitPoints,built,construction:built?1:0,ready:0,heading:0,order:null,load:0,work:0,kills:0,abilityReadyAt:0,stunnedUntil:0};
      if(e.type==='unit'){e.stance='guard';e.guardX=x;e.guardY=y;e.worldHeading=owner===0?0:Math.PI;e.turretHeading=e.worldHeading;e.desiredHeading=e.worldHeading;e.desiredTurretHeading=e.worldHeading;}
      this.entities.push(e);
      if(this.stats[owner]){if(e.type==='unit')this.stats[owner].unitsDeployed++;else this.stats[owner].buildingsConstructed++;}
      return e;
    }
    drawMapPreview(){
      const canvas=$('mapPreview'),ctx=canvas.getContext('2d');
      if(!ctx)return;
      const map=$('mapSelect').value||'verdant',cfg=MAPS[map]||MAPS.verdant;
      $('mapDescription').textContent=cfg.description;
      const width=canvas.width||272,height=canvas.height||144;
      const sx=width/WORLD_SIZE,sy=height/WORLD_SIZE;
      ctx.clearRect(0,0,width,height);
      const colors=terrain[map]||terrain.verdant;
      for(let x=0;x<WORLD_SIZE;x++)for(let y=0;y<WORLD_SIZE;y++){
        const filled=this.water(x+.5,y+.5,map);
        ctx.fillStyle=filled?cfg.waterColor:colors[Math.floor(rand(x,y)*colors.length)];
        ctx.fillRect(x*sx,y*sy,Math.ceil(sx),Math.ceil(sy));
      }
      ctx.fillStyle='#d9b477';
      for(const [x,y] of cfg.ore){
        ctx.beginPath();ctx.arc(x*sx,y*sy,Math.max(2.3,sx*.65),0,Math.PI*2);ctx.fill();
      }
      for(const [x,y,color] of [[5,6,'#6fd8f0'],[28,27,'#fa8070']]){
        ctx.fillStyle='#041823';ctx.fillRect(x*sx-5,y*sy-5,10,10);
        ctx.fillStyle=color;ctx.fillRect(x*sx-3.5,y*sy-3.5,7,7);
      }
      ctx.strokeStyle='#7191a9';ctx.lineWidth=1;ctx.strokeRect(.5,.5,width-1,height-1);
    }
    newMatch(s){
      this.settings={...s,startingCredits:Number(s.startingCredits)||5000};this.state='playing';this.time=0;this.nextAI=6;this.nextUi=0;this.nextFog=0;this.nextId=1;
      this.entities=[];this.ores=[];this.particles=[];this.projectiles=[];this.queues=[];this.selected=[];this.groups={};this.attackMoveArmed=false;this.abilityArmedId=null;this.placing=null;this.tab='structures';
      this.players=[{faction:s.playerFaction,credits:this.settings.startingCredits},{faction:s.enemyFaction,credits:this.settings.startingCredits}];
      this.stats=[this.newStats(),this.newStats()];
      this.camera={...this.camera,x:0,y:370,zoom:1.03};
      this.initMap();
      for(const side of [0,1]){
        const a=side===0?{x:5,y:6}:{x:28,y:27},sign=side===0?1:-1;
        this.add(side,'hq',a.x,a.y);
        this.add(side,'generator',a.x+3*sign,a.y);
        this.add(side,'refinery',a.x,a.y+3*sign);
        this.add(side,'barracks',a.x+3*sign,a.y+3*sign);
        this.add(side,'soldier',a.x+1*sign,a.y+5*sign);
        this.add(side,'soldier',a.x+2*sign,a.y+5*sign);
        this.add(side,'tank',a.x+4*sign,a.y+5*sign);
        const h=this.add(side,'harvester',a.x+2*sign,a.y+5*sign);h.order={type:'harvest'};
      }
      this.updateFog();$('overlay').classList.add('hidden');this.updateUI(true);this.updateSaveButtons();this.notify('Command established. Construct a War Factory to build tanks.');
    }
    initMap(){
      const oreSites=(MAPS[this.settings.map]||MAPS.verdant).ore;
      for(const [x,y] of oreSites){for(let i=0;i<8;i++){const ox=x+(rand(i,x,10)-.5)*3.3,oy=y+(rand(i,y,20)-.5)*3.3;if(this.water(ox,oy))continue;this.ores.push({x:ox,y:oy,amount:900+Math.floor(rand(i,x+y)*450),max:1350});}}
    }
    water(x,y,map=this.settings.map){
      const def=MAPS[map]||MAPS.verdant;
      return (def.waterRects||[]).some(rect=>x>rect[0]&&x<rect[1]&&y>rect[2]&&y<rect[3]);
    }
    buildingAt(x,y){return this.entities.find(e=>e.type==='building'&&e.hp>0&&Math.abs(e.x-x)<1.7&&Math.abs(e.y-y)<1.7);}
    canPlace(x,y,side){
      if(x<2||y<2||x>WORLD_SIZE-3||y>WORLD_SIZE-3)return false;
      for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if(this.water(x+dx,y+dy))return false;
      for(const e of this.entities){if(e.type==='building'&&Math.abs(e.x-x)<2.7&&Math.abs(e.y-y)<2.7)return false;}
      return this.entities.some(e=>e.owner===side&&e.type==='building'&&e.built&&dist(e,{x,y})<8.2);
    }
    getDef(e){return BUILD[e.kind]||UNITS[e.kind];}
    stat(e,key){const base=this.getDef(e)[key]||0,mods=FACTION_BALANCE[this.players[e.owner]?.faction]?.[e.kind];return base*(mods?.[key]??1);}
    unitRadius(e){return e.kind==='soldier'||e.kind==='specialist'?.23:e.kind==='heavy'?.56:e.kind==='harvester'?.47:e.kind==='recon'?.33:.39;}
    name(e){return NAMES[this.players[e.owner].faction][e.kind]||this.getDef(e).name;}
    count(side,kind){return this.entities.filter(e=>e.owner===side&&e.kind===kind&&e.hp>0&&e.built).length;}
    prereq(side,key){const def=BUILD[key]||UNITS[key];if(!def)return false;
      if(def.from&&!this.count(side,def.from))return false;
      return (def.requires||[]).every(k=>this.count(side,k)>0);
    }
    power(side){let make=0,use=0;for(const e of this.entities){if(e.owner!==side||e.type!=='building'||!e.built)continue;const n=BUILD[e.kind].power||0;if(n>0)make+=n;else use-=n;}return {make,use,low:use>make};}
    chooseProduction(key){
      if(this.state!=='playing')return;
      const def=BUILD[key]||UNITS[key],side=0;
      if(!def||!this.prereq(side,key)){this.notify('Required technology or production building missing');return;}
      if(this.players[0].credits<def.cost){this.notify('Insufficient credits');return;}
      if(BUILD[key]){if(key==='hq')return;this.placing=key;this.notify('Choose a clear location near your base. Right-click to cancel.');}
      else{if(this.queues.some(q=>q.side===0&&q.key===key)){this.notify('Already producing '+this.name({owner:0,kind:key}));return;}this.players[0].credits-=def.cost;this.stats[0].creditsSpent+=def.cost;this.queues.push({side:0,key,elapsed:0,total:Math.max(2,def.cost/250)});this.notify('Training '+this.name({owner:0,kind:key}));}
      this.updateUI(true);
    }
    cancelProduction(key){
      if(this.state!=='playing')return false;
      const index=this.queues.findIndex(q=>q.side===0&&q.key===key);
      if(index<0)return false;
      const q=this.queues[index],def=BUILD[key]||UNITS[key];
      if(!def)return false;
      // No delivered unit or item: credit reservation is reversed in full.
      this.players[0].credits+=def.cost;this.stats[0].creditsSpent=Math.max(0,this.stats[0].creditsSpent-def.cost);
      this.queues.splice(index,1);
      this.notify(this.name({owner:0,kind:key})+' cancelled: ¤'+def.cost+' refunded');
      this.updateUI(true);
      return true;
    }
    placeBuilding(x,y){
      const key=this.placing,def=BUILD[key];if(!key||!this.canPlace(x,y,0))return this.notify('Invalid placement: keep structures near your base.');
      if(this.players[0].credits<def.cost)return this.notify('Insufficient credits');
      this.players[0].credits-=def.cost;this.stats[0].creditsSpent+=def.cost;const e=this.add(0,key,Math.round(x),Math.round(y),false);e.buildTime=3.5+def.cost/650;
      this.placing=null;this.selected=[e.id];this.notify(this.name(e)+' construction started');this.updateUI(true);
    }
    buildingAction(action){
      if(this.state!=='playing'||this.selected.length!==1)return false;
      const e=this.entityById(this.selected[0]);
      if(!e||e.owner!==0||e.type!=='building')return false;
      if(action==='repair'){
        if(!e.built||e.hp>=e.maxHp||this.players[0].credits<1){this.notify('Repair unavailable');return false;}
        e.repairing=!e.repairing;
        this.notify(e.repairing?'Repair crew dispatched':'Repair stopped');
        this.updateSelection();return true;
      }
      if(action==='sell'){
        if(e.kind==='hq'){this.notify('Command Citadel cannot be sold');return false;}
        const refund=Math.floor(BUILD[e.kind].cost*.5*(e.built?1:.8));
        this.players[0].credits+=refund;this.recordLoss(e,null,true);
        this.particles.push({x:e.x,y:e.y,life:1,color:'#abf6b2',type:'cash'});
        e.hp=0;e.repairing=false;this.selected=[];
        this.notify(this.name(e)+' sold for ¤'+refund);
        this.updateUI(true);return true;
      }
      return false;
    }
    repairBuildings(dt){
      for(const e of this.entities){
        if(!e.repairing||e.hp<=0||!e.built||e.type!=='building')continue;
        const player=this.players[e.owner];if(!player)continue;
        if(e.hp>=e.maxHp){e.hp=e.maxHp;e.repairing=false;continue;}
        const unitCost=Math.max(.15,BUILD[e.kind].cost*.5/e.maxHp);
        if(player.credits<unitCost){e.repairing=false;continue;}
        const healing=Math.min(45*dt,e.maxHp-e.hp,player.credits/unitCost);
        e.hp=Math.min(e.maxHp,e.hp+healing);
        player.credits=Math.max(0,player.credits-healing*unitCost);
        if(e.hp>=e.maxHp-.01){e.hp=e.maxHp;e.repairing=false;}
      }
    }
    pointerPosition(e){
      const r=this.canvas.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;
      const wx=(x-this.w/2)/this.camera.zoom+this.camera.x,wy=(y-this.h/2)/this.camera.zoom+this.camera.y;
      return {x,y,gx:wx/TW+wy/TH,gy:wy/TH-wx/TW};
    }
    pointerDown(e){
      if(this.state!=='playing')return;
      const p=this.pointerPosition(e);this.mouse={x:p.x,y:p.y,worldX:p.gx,worldY:p.gy};
      if(e.pointerType==='touch'||e.pointerType==='pen'){
        e.preventDefault();
        this.touchPointer={id:e.pointerId,startX:e.clientX,startY:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};
        this.dragStart=p;this.dragEnd=p;this.canvas.setPointerCapture?.(e.pointerId);return;
      }
      if(e.button===2){e.preventDefault();if(this.placing){this.placing=null;this.updateUI(true);}else this.command(p,e);return;}
      if(e.button!==0)return;
      this.dragStart=p;this.dragEnd=p;this.canvas.setPointerCapture?.(e.pointerId);
    }
    pointerMove(e){
      const t=this.touchPointer;
      if(t&&t.id===e.pointerId){
        const deltaX=e.clientX-t.lastX,deltaY=e.clientY-t.lastY;
        if(Math.hypot(e.clientX-t.startX,e.clientY-t.startY)>10)t.moved=true;
        if(t.moved){
          this.camera.x-=deltaX/this.camera.zoom;
          this.camera.y-=deltaY/this.camera.zoom;
          this.dragStart=null;this.dragEnd=null;
        }
        t.lastX=e.clientX;t.lastY=e.clientY;
      }
      const p=this.pointerPosition(e);
      this.mouse={x:p.x,y:p.y,worldX:p.gx,worldY:p.gy};
      if(this.dragStart)this.dragEnd=p;
    }
    pointerUp(e){
      if(this.state!=='playing')return;
      const t=this.touchPointer;
      if(t&&t.id===e.pointerId){
        this.touchPointer=null;this.dragStart=null;this.dragEnd=null;
        if(t.moved)return;
        const p=this.pointerPosition(e);
        if(this.placing)this.placeBuilding(p.gx,p.gy);
        else{
          const hit=this.pick(p.gx,p.gy);
          if(hit&&hit.owner===0)this.selected=[hit.id];
          else if(this.selected.some(id=>{const u=this.entityById(id);return u&&u.owner===0&&u.type==='unit';}))this.command(p,e);
          else this.selected=hit?[hit.id]:[];
        }
        this.updateSelection();return;
      }
      if(!this.dragStart||e.button!==0)return;
      const a=this.dragStart,b=this.dragEnd||a;this.dragStart=null;this.dragEnd=null;
      if(Math.hypot(a.x-b.x,a.y-b.y)>12&&!this.placing){
        this.selected=this.entities.filter(t=>t.owner===0&&t.type==='unit'&&t.hp>0).filter(t=>{const p=this.screen(t.x,t.y);return p.x>=Math.min(a.x,b.x)&&p.x<=Math.max(a.x,b.x)&&p.y>=Math.min(a.y,b.y)&&p.y<=Math.max(a.y,b.y);}).map(t=>t.id);
      }else if(this.placing){this.placeBuilding(b.gx,b.gy);}
      else{const hit=this.pick(b.gx,b.gy);if(hit){if(e.shiftKey&&hit.owner===0)this.selected=[...new Set([...this.selected,hit.id])];else this.selected=[hit.id];}else this.selected=[];}
      this.updateSelection();
    }
    screen(x,y){const p=iso(x,y);return{x:this.w/2+(p.x-this.camera.x)*this.camera.zoom,y:this.h/2+(p.y-this.camera.y)*this.camera.zoom};}
    pick(x,y){let best=null,bd=Infinity;for(const e of this.entities){if(e.hp<=0||e.owner===1&&!this.isVisible(e.x,e.y))continue;const d=Math.hypot(x-e.x,y-e.y);const hit=e.type==='building'?1.75:1.07;if(d<hit&&d<bd){best=e;bd=d;}}return best;}
    command(p,event){
      if(this.abilityArmedId){const operative=this.entityById(this.abilityArmedId);this.abilityArmedId=null;
        if(operative)this.activateAbility(operative,{x:p.gx,y:p.gy});this.updateUI(true);return;}
      const chosen=this.entities.filter(e=>this.selected.includes(e.id)&&e.owner===0&&e.type==='unit'&&e.hp>0);if(!chosen.length)return;
      const enemy=this.pick(p.gx,p.gy);const target=enemy&&enemy.owner===1?enemy:null;
      // Grid formation: unique walkable slots around the clicked point, assigned
      // to the nearest unit first to reduce crossing and unit congestion.
      if(target){
        for(const e of chosen)e.order={type:'attack',id:target.id};
      }else{
        const slots=this.formationSlots(p.gx,p.gy,chosen.length);
        const remaining=chosen.slice();
        for(const slot of slots){
          let best=0;
          for(let i=1;i<remaining.length;i++)if(dist(remaining[i],slot)<dist(remaining[best],slot))best=i;
          const unit=remaining.splice(best,1)[0];
          if(!unit)break;
          unit.order={type:this.attackMoveArmed||event?.shiftKey?'attackMove':'move',x:slot.x,y:slot.y};
          unit.path=[];unit.pathTarget=null;
        }
      }
      this.attackMoveArmed=false;
      this.particles.push({x:p.gx,y:p.gy,life:.65,color:target?'#ff7c7c':'#80dbee',type:'marker'});
    }
    specialistAbilityInfo(e){
      return e?.kind==='specialist'?ABILITIES[this.players[e.owner]?.faction]:null;
    }
    useSpecialistAbility(){
      if(this.state!=='playing')return false;
      const e=this.selected.map(id=>this.entityById(id)).find(unit=>unit?.owner===0&&unit.kind==='specialist');
      if(!e){this.notify('Select a faction specialist first');return false;}
      const ability=this.specialistAbilityInfo(e);
      const remaining=Math.max(0,(e.abilityReadyAt||0)-this.time);
      if(remaining>0){this.notify(ability.name+' ready in '+Math.ceil(remaining)+'s');return false;}
      if(this.players[e.owner].faction==='coalition'){
        this.abilityArmedId=e.id;this.attackMoveArmed=false;this.placing=null;
        this.notify('Chrono Jump: right-click clear terrain within 6 tiles');
        this.updateSelection();return true;
      }
      return this.activateAbility(e);
    }
    activateAbility(e,target=null){
      if(this.state!=='playing'||!e||e.hp<=0||e.kind!=='specialist')return false;
      const ability=this.specialistAbilityInfo(e),faction=this.players[e.owner].faction;
      if(!ability||(e.abilityReadyAt||0)>this.time)return false;
      if(faction==='coalition'){
        if(!target)return false;
        const next={x:clamp(target.x,1,WORLD_SIZE-2),y:clamp(target.y,1,WORLD_SIZE-2)};
        if(dist(e,next)>ability.range||!this.canOccupyUnit(e,next.x,next.y)){
          if(e.owner===0)this.notify('Jump unavailable: target must be clear and in range');
          return false;
        }
        this.particles.push({x:e.x,y:e.y,life:.85,color:ability.color,type:'abilityPulse',radius:35});
        e.x=next.x;e.y=next.y;e.guardX=e.x;e.guardY=e.y;
        e.order=null;e.path=[];e.pathTarget=null;e.pathRecheck=0;
        this.particles.push({x:e.x,y:e.y,life:.85,color:ability.color,type:'abilityPulse',radius:48});
      }else{
        // Only hostile entities are affected. Power generators and other
        // infrastructure remain invulnerable to these specialist pulses.
        const victims=this.entities.filter(u=>u.hp>0&&u.owner!==e.owner&&dist(u,e)<=ability.range&&
          (u.type==='unit'||u.kind==='turret'||u.kind==='beam'));
        for(const u of victims){
          if(faction==='federation'){
            const amount=u.type==='building'?25:38;
            const beforeHp=u.hp;u.hp-=amount;
            if(this.stats[e.owner])this.stats[e.owner].damageDealt+=Math.min(amount,beforeHp);
            if(u.hp<=0){this.recordLoss(u,e.owner);e.kills++;this.selected=this.selected.filter(id=>id!==u.id);
              this.particles.push({x:u.x,y:u.y,life:1,color:'#ffa95e',type:'boom'});}
          }else if(faction==='psionic'){
            u.stunnedUntil=Math.max(u.stunnedUntil||0,this.time+3.8);
          }
          this.particles.push({x:u.x,y:u.y,life:.4,color:ability.color,type:'hit'});
        }
        this.particles.push({x:e.x,y:e.y,life:.85,color:ability.color,type:'abilityPulse',radius:ability.range*26});
      }
      e.abilityReadyAt=this.time+ability.cooldown;
      if(e.owner===0)this.notify(ability.name+' activated: '+ability.cooldown+'s cooldown');
      this.updateSelection();
      return true;
    }
    unitAction(action){
      if(this.state!=='playing')return false;
      const units=this.entities.filter(e=>e.hp>0&&e.owner===0&&e.type==='unit'&&e.kind!=='harvester'&&this.selected.includes(e.id));
      if(!units.length)return false;
      if(action==='attackMove'){
        this.attackMoveArmed=true;
        this.notify('Attack-move armed: right-click a destination');
        this.updateSelection();return true;
      }
      if(!['stop','guard','hold','aggressive'].includes(action))return false;
      this.attackMoveArmed=false;this.abilityArmedId=null;
      for(const e of units){
        if(action==='stop'){
          e.order=null;e.path=[];e.pathTarget=null;e.stance='guard';e.guardX=e.x;e.guardY=e.y;
        }else{
          e.stance=action;e.guardX=e.x;e.guardY=e.y;
          if(action==='hold'||action==='guard'){e.order=null;e.path=[];e.pathTarget=null;}
        }
      }
      this.notify(({stop:'Units stopped',guard:'Guard nearby area',hold:'Hold position',aggressive:'Aggressive pursuit'})[action]);
      this.updateSelection();return true;
    }
    unitActionPanel(units){
      if(!units.some(e=>e.owner===0&&e.type==='unit'&&e.kind!=='harvester'))return '';
      const stance=units.length===1?units[0].stance||'guard':'mixed';
      const opts=[['stop','X STOP'],['guard','G GUARD'],['hold','B HOLD'],['aggressive','V ATTACK'],['attackMove','T A-MOVE']];
      return '<div class="unitActions">'+opts.map(([act,label])=>
        '<button data-unit-action="'+act+'" class="'+((stance===act||act==='attackMove'&&this.attackMoveArmed)?'chosen':'')+'" title="'+act+'">'+label+'</button>'
      ).join('')+'</div>';
    }
    formationSlots(cx,cy,count){
      const slots=[],used=new Set(),want=Math.max(0,Math.min(count,120));
      const center={x:clamp(Math.round(cx),1,WORLD_SIZE-2),y:clamp(Math.round(cy),1,WORLD_SIZE-2)};
      const candidates=[];
      // Search expanding perimeter rings. The centre slot remains the first choice.
      for(let radius=0;radius<=WORLD_SIZE&&candidates.length<want*9+48;radius++){
        for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){
          if(Math.max(Math.abs(x),Math.abs(y))!==radius)continue;
          const p={x:center.x+x,y:center.y+y};
          if(!this.walkable(p.x,p.y))continue;
          candidates.push(p);
        }
        if(candidates.length>=want*3&&radius>2)break;
      }
      for(const p of candidates){
        const key=p.x+','+p.y;
        if(!used.has(key)){used.add(key);slots.push(p);}
        if(slots.length===want)break;
      }
      return slots;
    }
    entityById(id){return this.entities.find(e=>e.id===id&&e.hp>0);}
    nearest(source,predicate,range=Infinity){let result=null,best=range;for(const e of this.entities){if(e===source||e.hp<=0||!predicate(e))continue;const d=dist(source,e);if(d<best){best=d;result=e;}}return result;}
    walkable(x,y){
      if(x<1||y<1||x>WORLD_SIZE-2||y>WORLD_SIZE-2||this.water(x,y))return false;
      return !this.entities.some(b=>b.hp>0&&b.type==='building'&&Math.abs(b.x-x)<1.5&&Math.abs(b.y-y)<1.5);
    }
    findPath(sx,sy,tx,ty){
      // A* on the logical tile grid. Cache routes per unit to avoid solving every frame.
      const start={x:clamp(Math.round(sx),1,WORLD_SIZE-2),y:clamp(Math.round(sy),1,WORLD_SIZE-2)};
      const target={x:clamp(Math.round(tx),1,WORLD_SIZE-2),y:clamp(Math.round(ty),1,WORLD_SIZE-2)};
      let goal=target;
      if(!this.walkable(goal.x,goal.y)){
        let closest=Infinity,candidate=null;
        for(let radius=1;radius<=5;radius++){
          for(let ox=-radius;ox<=radius;ox++)for(let oy=-radius;oy<=radius;oy++){
            if(Math.max(Math.abs(ox),Math.abs(oy))!==radius)continue;
            const x=target.x+ox,y=target.y+oy;
            if(!this.walkable(x,y))continue;
            const score=Math.hypot(x-tx,y-ty)+Math.hypot(x-sx,y-sy)*.04;
            if(score<closest){closest=score;candidate={x,y};}
          }
          if(candidate)break;
        }
        if(!candidate)return [];
        goal=candidate;
      }
      const key=(x,y)=>x+','+y, begin=key(start.x,start.y),finish=key(goal.x,goal.y);
      const open=[{x:start.x,y:start.y,key:begin,f:0}], g=new Map([[begin,0]]),came=new Map(),closed=new Set();
      const directions=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
      let steps=0;
      while(open.length&&steps++<1250){
        let best=0;for(let i=1;i<open.length;i++)if(open[i].f<open[best].f)best=i;
        const node=open.splice(best,1)[0];if(closed.has(node.key))continue;
        if(node.key===finish){
          const path=[];let k=finish;
          while(k!==begin&&came.has(k)){
            const [x,y]=k.split(',').map(Number);path.push({x,y});k=came.get(k);
          }
          path.reverse();return path;
        }
        closed.add(node.key);
        for(const [dx,dy] of directions){
          const x=node.x+dx,y=node.y+dy,k=key(x,y);
          if(closed.has(k)||!this.walkable(x,y))continue;
          if(dx&&dy&&(!this.walkable(node.x+dx,node.y)||!this.walkable(node.x,node.y+dy)))continue;
          const cost=g.get(node.key)+(dx&&dy?1.4142:1);
          if(cost>=(g.get(k)??Infinity))continue;
          g.set(k,cost);came.set(k,node.key);
          open.push({x,y,key:k,f:cost+Math.hypot(goal.x-x,goal.y-y)});
        }
      }
      return [];
    }
    canOccupyUnit(e,x,y,ignoreUnits=false){
      const r=this.unitRadius(e);
      if(x<.8||y<.8||x>WORLD_SIZE-.8||y>WORLD_SIZE-.8||this.water(x,y))return false;
      for(const b of this.entities){
        if(b.hp<=0||b.id===e.id)continue;
        if(b.type==='building'&&Math.abs(b.x-x)<1.27+r*.14&&Math.abs(b.y-y)<1.27+r*.14)return false;
        if(!ignoreUnits&&b.type==='unit'){
          const margin=r+this.unitRadius(b);
          if((b.x-x)**2+(b.y-y)**2<margin*margin*.84)return false;
        }
      }
      return true;
    }
    separateUnits(){
      // Resolve leftover overlaps after spawns and group movement. Preserve
      // occupancy rules; use stable id ordering for reproducible results.
      const units=this.entities.filter(e=>e.type==='unit'&&e.hp>0).sort((a,b)=>a.id-b.id);
      for(let pass=0;pass<2;pass++)for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++){
        const a=units[i],b=units[j],minimum=(this.unitRadius(a)+this.unitRadius(b))*.95;
        let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
        if(d>=minimum)continue;
        if(d<.001){const angle=(a.id*13+b.id*7)%360*Math.PI/180;dx=Math.cos(angle);dy=Math.sin(angle);d=1;}
        const push=Math.min(.36,(minimum-d)*.5),ux=dx/d,uy=dy/d;
        const aNext={x:a.x-ux*push,y:a.y-uy*push},bNext={x:b.x+ux*push,y:b.y+uy*push};
        const okA=this.canOccupyUnit(a,aNext.x,aNext.y,true),okB=this.canOccupyUnit(b,bNext.x,bNext.y,true);
        if(okA){a.x=aNext.x;a.y=aNext.y;}
        if(okB){b.x=bNext.x;b.y=bNext.y;}
      }
    }
    move(e,tx,ty,dt){
      let d=Math.hypot(tx-e.x,ty-e.y);
      if(d<.24){e.path=[];return true;}
      const old=e.pathTarget;
      if(!old||!e.path||Math.hypot(old.x-tx,old.y-ty)>1.2||e.pathRecheck<=0){
        e.path=this.findPath(e.x,e.y,tx,ty);
        e.pathTarget={x:tx,y:ty};e.pathRecheck=1.6;
      }
      e.pathRecheck-=dt;
      while(e.path?.length&&Math.hypot(e.x-e.path[0].x,e.y-e.path[0].y)<.37)e.path.shift();
      const point=e.path?.[0];
      if(!point){
        // For an unreachable clicked tile, accept the nearest reachable landing point.
        return d<2.7||!this.walkable(Math.round(tx),Math.round(ty));
      }
      const dx=point.x-e.x,dy=point.y-e.y,len=Math.hypot(dx,dy);
      if(len<.001)return false;
      const move=Math.min(this.stat(e,'speed')*dt,len),vx=dx/len*move,vy=dy/len*move;
      const clear=(x,y)=>this.canOccupyUnit(e,x,y);
      if(clear(e.x+vx,e.y+vy)){e.x+=vx;e.y+=vy;e.stuck=0;}
      else if(clear(e.x+vx,e.y)){e.x+=vx;e.stuck=0;}
      else if(clear(e.x,e.y+vy)){e.y+=vy;e.stuck=0;}
      else {
        // Symmetric short sidesteps avoid simple head-on jams. No teleporting.
        const sign=e.id%2===0?1:-1;
        const sidestep=[[-vy*sign,vx*sign],[vy*sign,-vx*sign]];
        let moved=false;
        for(const [sx,sy] of sidestep)if(clear(e.x+sx,e.y+sy)){
          e.x+=sx;e.y+=sy;e.stuck=0;moved=true;break;
        }
        if(!moved){e.stuck=(e.stuck||0)+dt;if(e.stuck>.7){e.pathRecheck=0;e.stuck=0;}}
      }
      e.heading=Math.atan2(dy*TH,dx*TW);
      e.desiredHeading=Math.atan2(dy,dx);
      if(e.type==='unit'&&!e.engaging)e.desiredTurretHeading=e.desiredHeading;
      d=Math.hypot(tx-e.x,ty-e.y);
      return d<.24;
    }
    shoot(source,target){
      const def=this.getDef(source),damage=this.stat(source,'damage');
      if(!damage||!target||source.hp<=0||target.hp<=0||source.owner===target.owner)return;
      source.ready=def.rate||1.2;
      const faction=this.players[source.owner].faction;
      const bonus=source.kind==='specialist'&&faction==='federation'?1.3:1;
      const psychic=source.kind==='specialist'&&faction==='psionic';
      // A shot is now a moving projectile. Damage is resolved on impact, not firing.
      this.projectiles.push({
        x:source.x,y:source.y,targetId:target.id,owner:source.owner,sourceId:source.id,
        sourceKind:source.kind,damage:damage*bonus,psychic,age:0,
        speed:source.kind==='soldier'?8.5:source.kind==='tank'?6.8:source.kind==='heavy'?5:psychic?7:10,
        color:psychic?'#bb78ff':faction==='psionic'?'#a3f5c8':source.type==='building'?'#77d9ff':'#f4b36c'
      });
      this.particles.push({x:source.x,y:source.y,life:.2,type:'muzzle',color:faction==='psionic'?'#ba84ee':'#ffd698'});
    }
    updateProjectiles(dt){
      for(const shot of this.projectiles){
        shot.age+=dt;
        const target=this.entityById(shot.targetId);
        if(!target||target.owner===shot.owner||shot.age>8){shot.expired=true;continue;}
        const distance=dist(shot,target);
        if(distance>shot.speed*dt+.25){
          const scale=shot.speed*dt/distance;
          shot.x+=(target.x-shot.x)*scale;shot.y+=(target.y-shot.y)*scale;
          continue;
        }
        shot.x=target.x;shot.y=target.y;shot.expired=true;
        if(shot.psychic&&target.type==='unit'&&target.kind!=='harvester'&&target.hp<target.maxHp*.6){
          target.owner=shot.owner;target.order={type:'move',x:clamp(target.x+(shot.owner===0?1:-1),1,32),y:target.y+1};
          target.path=[];target.engaging=false;
          this.particles.push({x:target.x,y:target.y,life:.85,color:'#cd84fa',type:'control'});
          if(shot.owner===0)this.notify('Enemy unit captured');
          continue;
        }
        target.hp-=shot.damage;
        if(this.stats[shot.owner])this.stats[shot.owner].damageDealt+=Math.max(0,Math.min(shot.damage,target.hp+shot.damage));
        this.particles.push({x:target.x,y:target.y,life:.38,color:shot.color,type:'hit'});
        if(target.hp<=0){
          this.recordLoss(target,shot.owner);
          const killer=this.entityById(shot.sourceId);
          if(killer)killer.kills++;
          this.particles.push({x:target.x,y:target.y,life:1,color:'#ffa05a',type:'boom'});
          this.selected=this.selected.filter(id=>id!==target.id);
        }
      }
      this.projectiles=this.projectiles.filter(p=>!p.expired);
    }
    drawProjectiles(){
      const c=this.ctx;
      for(const shot of this.projectiles){
        if(!this.isVisible(shot.x,shot.y))continue;
        const p=iso(shot.x,shot.y);
        c.save();
        c.strokeStyle=shot.color;c.fillStyle=shot.color;c.lineWidth=2.8;
        c.shadowColor=shot.color;c.shadowBlur=9;
        c.beginPath();c.moveTo(p.x-6,p.y-10);c.lineTo(p.x,p.y-12);c.stroke();
        c.beginPath();c.arc(p.x,p.y-12,3.3,0,Math.PI*2);c.fill();c.restore();
      }
    }
    processHarvester(e,dt){
      e.work-=dt;
      const refinery=this.nearest(e,b=>b.owner===e.owner&&b.type==='building'&&b.kind==='refinery'&&b.built);
      if(!refinery)return;
      if(e.load>=360){if(dist(e,refinery)>3.6)this.move(e,refinery.x+1.9,refinery.y+1.3,dt);
        else if(e.work<=0){this.players[e.owner].credits+=e.load;if(this.stats[e.owner])this.stats[e.owner].oreHarvested+=e.load;e.load=0;e.work=.6;if(e.owner===0)this.particles.push({x:refinery.x,y:refinery.y,life:1,color:'#9fe29d',type:'cash'});}return;}
      let closest=null,d=Infinity;for(const o of this.ores){if(o.amount<=0)continue;const r=dist(e,o);if(r<d){d=r;closest=o;}}
      if(!closest)return;
      if(d>.8)this.move(e,closest.x,closest.y,dt);
      else if(e.work<=0){const amount=Math.min(80,closest.amount,360-e.load);e.load+=amount;closest.amount-=amount;e.work=.8;}
    }
    step(dt){
      this.time+=dt;
      const pan=380*dt/this.camera.zoom;
      if(this.keys.has('w')||this.keys.has('arrowup'))this.camera.y-=pan;
      if(this.keys.has('s')||this.keys.has('arrowdown'))this.camera.y+=pan;
      if(this.keys.has('a')||this.keys.has('arrowleft'))this.camera.x-=pan;
      if(this.keys.has('d')||this.keys.has('arrowright'))this.camera.x+=pan;
      this.camera.x=clamp(this.camera.x,-1020,1020);this.camera.y=clamp(this.camera.y,50,1080);
      for(const e of this.entities){
        if(e.hp<=0)continue;
        if(!e.built){e.construction+=dt/e.buildTime;if(e.construction>=1){e.construction=1;e.built=true;if(e.kind==='refinery'){const h=this.add(e.owner,'harvester',e.x+2,e.y+1);h.order={type:'harvest'};}}continue;}
        e.ready=Math.max(0,e.ready-dt);
        if((e.stunnedUntil||0)>this.time)continue;
        if(e.type==='unit'){
          if(e.kind==='harvester'){this.processHarvester(e,dt);continue;}
          const command=e.order,range=this.stat(e,'range'),stance=e.stance||'guard';
          let target=command?.type==='attack'?this.entityById(command.id):null;
          if(!target&&command?.type!=='move'){
            const detection=stance==='aggressive'?range+4.0:stance==='hold'?range:range+1.5;
            target=this.nearest(e,b=>b.owner!==e.owner&&b.built,detection);
          }
          e.engaging=!!target;
          if(target)e.desiredTurretHeading=Math.atan2(target.y-e.y,target.x-e.x);
          if(target){
            const hold=stance==='hold'&&command?.type!=='attack'&&command?.type!=='attackMove';
            const leash=stance==='guard'&&command?.type!=='attack'&&command?.type!=='attackMove'
                &&Math.hypot(e.x-(e.guardX??e.x),e.y-(e.guardY??e.y))>5;
            if(!hold&&!leash&&dist(e,target)>range)this.move(e,target.x,target.y,dt);
            else if(dist(e,target)<=range&&e.ready<=0)this.shoot(e,target);
          }
          else if(command?.type==='move'||command?.type==='attackMove'){
            if(this.move(e,command.x,command.y,dt)){
              if(stance==='guard'){e.guardX=e.x;e.guardY=e.y;}
              e.order=null;
            }
          }else if(stance==='guard'&&Math.hypot(e.x-(e.guardX??e.x),e.y-(e.guardY??e.y))>1.4)
            this.move(e,e.guardX,e.guardY,dt);
          // Enemy units hold their assigned position until strategic AI orders them.
        }else if(BUILD[e.kind].damage&&!this.power(e.owner).low){
          const def=BUILD[e.kind];const target=this.nearest(e,b=>b.owner!==e.owner&&b.type==='unit'&&b.built,def.range);
          if(target&&e.ready<=0)this.shoot(e,target);
        }
      }
      for(const e of this.entities){
        if(e.hp<=0||e.type!=='unit')continue;
        const speed=e.kind==='soldier'||e.kind==='specialist'?6.5:2.65;
        e.worldHeading=turnToward(e.worldHeading,e.desiredHeading??e.worldHeading,speed*dt);
        e.turretHeading=turnToward(e.turretHeading,e.desiredTurretHeading??e.worldHeading,(e.kind==='tank'||e.kind==='heavy'?4.3:7)*dt);
      }
      this.separateUnits();
      this.updateProjectiles(dt);
      this.repairBuildings(dt);
      for(let i=this.queues.length-1;i>=0;i--){const q=this.queues[i],slow=this.power(q.side).low?.55:1;q.elapsed+=dt*slow;if(q.elapsed>=q.total){const origin=this.nearest({x:q.side===0?6:28,y:q.side===0?6:28},b=>b.owner===q.side&&b.kind===UNITS[q.key].from&&b.built);
          if(origin){const u=this.add(q.side,q.key,clamp(origin.x+(q.side===0?2:-2),1,33),clamp(origin.y+(q.side===0?2:-2),1,33));if(q.key==='harvester')u.order={type:'harvest'};}
          this.queues.splice(i,1);}}
      if(this.time>=this.nextAI){this.runAI();this.nextAI=this.time+(this.settings.difficulty==='veteran'?5:this.settings.difficulty==='recruit'?13:8);}
      this.particles=this.particles.filter(p=>(p.life-=dt)>0);
      if(this.time>this.nextFog){this.updateFog();this.nextFog=this.time+.3;}
      if(this.time>this.nextUi){this.updateUI();this.nextUi=this.time+.45;}
      this.entities=this.entities.filter(e=>e.hp>0);
      for(let side=0;side<2;side++){if(!this.entities.some(e=>e.owner===side&&e.type==='building'&&e.hp>0)){this.finish(side===1);break;}}
    }
    runAI(){
      const side=1,me=this.players[side],base=this.entities.find(e=>e.owner===side&&e.kind==='hq'&&e.hp>0);
      if(!base)return;
      // The enemy now earns resources through the same refinery/harvester loop
      // as the player. Difficulty changes timing and priorities, not free income.
      const owned=kind=>this.entities.filter(e=>e.owner===side&&e.kind===kind&&e.hp>0);
      const built=kind=>owned(kind).filter(e=>e.built).length;
      const myBuildings=this.entities.filter(e=>e.owner===side&&e.type==='building'&&e.hp>0&&e.built);
      const invaders=this.entities.filter(e=>e.owner===0&&e.type==='unit'&&e.hp>0&&e.kind!=='harvester'&&myBuildings.some(b=>dist(b,e)<8));
      const threatened=invaders.length>0;
      for(const b of myBuildings){
        if(b.hp/b.maxHp<.58&&me.credits>550)b.repairing=true;
      }
      const shortage=this.power(side).low;
      let choice=null;
      if(!owned('generator').length||shortage)choice='generator';
      else if(!owned('refinery').length)choice='refinery';
      else if(threatened&&built('turret')<2&&me.credits>=BUILD.turret.cost+300)choice='turret';
      else if(!owned('factory').length)choice='factory';
      else if(!owned('radar').length&&me.credits>2600)choice='radar';
      else if(!owned('tech').length&&this.prereq(side,'tech')&&me.credits>4000)choice='tech';
      else if(built('factory')&&built('turret')<(this.settings.difficulty==='veteran'?2:1)&&me.credits>2200)choice='turret';
      if(choice&&this.prereq(side,choice)&&me.credits>=BUILD[choice].cost){
        for(let j=0;j<48;j++){
          const angle=j*2.39996,radius=4.2+Math.floor(j/8)*.85;
          const anchor=choice==='turret'&&threatened?(this.nearest(base,b=>b.owner===0&&b.type==='unit'&&b.kind!=='harvester')||base):base;
          // Keep all AI construction in supply radius of its living buildings.
          const origin=anchor===base?base:myBuildings.reduce((p,b)=>dist(anchor,b)<dist(anchor,p)?b:p,base);
          const x=Math.round(origin.x+Math.cos(angle)*radius),y=Math.round(origin.y+Math.sin(angle)*radius);
          if(!this.canPlace(x,y,side))continue;
          me.credits-=BUILD[choice].cost;this.stats[side].creditsSpent+=BUILD[choice].cost;
          const b=this.add(side,choice,x,y,false);b.buildTime=3.5+BUILD[choice].cost/650;
          break;
        }
      }
      if(!this.queues.some(q=>q.side===side)){
        let unit='soldier';
        if(!owned('harvester').length&&built('refinery'))unit='harvester';
        else if(built('factory')&&!owned('recon').length&&me.credits>=UNITS.recon.cost+650)unit='recon';
        else if(built('radar')&&built('barracks')&&!owned('specialist').length&&me.credits>=1400)unit='specialist';
        else if(built('factory')&&me.credits>1100){
          unit=built('tech')&&me.credits>2300&&rand(Math.floor(this.time),17)>.53?'heavy':'tank';
        }else if(built('barracks')&&me.credits<350)unit=null;
        if(unit&&this.prereq(side,unit)&&me.credits>=UNITS[unit].cost){
          me.credits-=UNITS[unit].cost;this.stats[side].creditsSpent+=UNITS[unit].cost;
          this.queues.push({side,key:unit,elapsed:0,total:Math.max(2,UNITS[unit].cost/250)});
        }
      }
      for(const specialist of owned('specialist')){
        if((specialist.abilityReadyAt||0)>this.time)continue;
        const threat=this.nearest(specialist,u=>u.owner===0&&u.type==='unit'&&u.hp>0,8);
        if(!threat)continue;
        if(me.faction==='coalition'){
          if(dist(specialist,threat)<2.2||dist(specialist,threat)>7.2)continue;
          for(const [dx,dy] of [[1,1],[-1,-1],[1,-1],[-1,1],[2,0],[-2,0],[0,2],[0,-2]]){
            const spot={x:threat.x+dx,y:threat.y+dy};
            if(this.canOccupyUnit(specialist,spot.x,spot.y)){
              this.activateAbility(specialist,spot);break;
            }
          }
        }else if(dist(specialist,threat)<=ABILITIES[me.faction].range){
          this.activateAbility(specialist);
        }
      }
      // Recon units move toward strategically useful ore, but defend harvesters
      // under attack. This produces an early contest rather than a blind HQ rush.
      for(const scout of owned('recon')){
        const endangered=this.entities.filter(u=>u.owner===side&&u.kind==='harvester'&&u.hp>0)
          .map(h=>({h,threat:this.nearest(h,e=>e.owner===0&&e.type==='unit'&&e.hp>0,5.5)}))
          .find(pair=>pair.threat);
        if(endangered){
          scout.order={type:'attack',id:endangered.threat.id};
          continue;
        }
        if(scout.order?.type==='attack'&&this.entityById(scout.order.id))continue;
        // Recon patrols travel between map-file ore sites and do not repeat
        // the same waypoint once it has been reached.
        if(scout.order?.type==='move'||scout.order?.type==='attackMove'){
          if(dist(scout,scout.order)>1.5)continue;
        }
        const ore=(MAPS[this.settings.map]||MAPS.verdant).ore;
        const route=ore.filter(pt=>!this.water(pt[0],pt[1])).slice(0,6);
        if(!route.length)continue;
        const index=((scout.patrolIndex||0)%route.length+route.length)%route.length;
        const point=route[index];
        scout.patrolIndex=(index+1)%route.length;
        scout.order={type:'attackMove',x:clamp(point[0]+.35,1,32),y:clamp(point[1]+.35,1,32)};
        // Contact information is remembered by the scout, and stored in saves.
        const spotted=this.nearest(scout,e=>e.owner===0&&e.type==='unit'&&e.hp>0,8);
        if(spotted)scout.lastContact={x:spotted.x,y:spotted.y,time:this.time,kind:spotted.kind};
      }
      // Local base defense always takes precedence over an offensive order.
      const fighters=this.entities.filter(e=>e.owner===side&&e.type==='unit'&&e.hp>0&&e.kind!=='harvester');
      for(const fighter of fighters){
        const attacker=this.nearest(fighter,e=>e.owner===0&&e.type==='unit'&&e.hp>0,6.5);
        if(attacker){fighter.order={type:'attack',id:attacker.id};continue;}
        if(fighter.kind==='recon'&&fighter.order?.type==='attackMove')continue;
        if(fighter.order?.type==='attack'&&this.entityById(fighter.order.id))continue;
        // Attack in groups; novices wait longer before committing.
        const minimum=this.settings.difficulty==='recruit'?5:this.settings.difficulty==='veteran'?2:3;
        if(fighters.length<minimum||this.time<(this.settings.difficulty==='recruit'?85:this.settings.difficulty==='veteran'?38:57))continue;
        const target=this.nearest(fighter,e=>e.owner===0&&e.type==='building'&&e.hp>0);
        if(target)fighter.order={type:'attack',id:target.id};
      }
    }
    updateFog(){
      if(!this.fog.length)this.fog=Array.from({length:WORLD_SIZE},()=>Array.from({length:WORLD_SIZE},()=>({seen:false,visible:false})));
      for(const row of this.fog)for(const c of row)c.visible=false;
      for(const e of this.entities){if(e.owner!==0||e.hp<=0)continue;const radius=e.kind==='recon'?8.1:e.type==='building'?5.8:4.8;
        const minX=clamp(Math.floor(e.x-radius),0,WORLD_SIZE-1),maxX=clamp(Math.ceil(e.x+radius),0,WORLD_SIZE-1);
        const minY=clamp(Math.floor(e.y-radius),0,WORLD_SIZE-1),maxY=clamp(Math.ceil(e.y+radius),0,WORLD_SIZE-1);
        for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++)if(Math.hypot(x-e.x,y-e.y)<=radius){this.fog[x][y].seen=true;this.fog[x][y].visible=true;}
      }
    }
    isVisible(x,y){const ix=clamp(Math.floor(x),0,WORLD_SIZE-1),iy=clamp(Math.floor(y),0,WORLD_SIZE-1);return !!this.fog[ix]?.[iy]?.visible;}
    updateSelection(){
      const targets=this.selected.map(id=>this.entityById(id)).filter(Boolean),box=$('selection');
      if(!targets.length){box.innerHTML='<strong>NO SELECTION</strong><p>Click a unit or building to inspect it.</p>';return;}
      if(targets.length>1){
        box.innerHTML='<strong>'+targets.length+' UNITS SELECTED</strong><p>Move in formation, hold, guard or attack-move.</p>'+this.unitActionPanel(targets)+
          (targets.some(e=>e.owner===0&&e.kind==='specialist')?'<button class="specialAction" data-special="use">F SPECIALIST ABILITY</button>':'');
        return;
      }
      const e=targets[0];
      let html='<strong>'+this.escape(this.name(e)).toUpperCase()+'</strong><p>'+Math.max(0,Math.ceil(e.hp))+' / '+e.maxHp+' HP · '+(e.owner===0?'FRIENDLY':'HOSTILE')+(e.built?'':' · CONSTRUCTING '+Math.round(e.construction*100)+'%')+'</p>';
      if(e.kind==='recon')html+='<p class="scoutInfo">RECON · extended vision · fast scouting</p>';
      if(e.owner===0&&e.type==='building'){
        const canRepair=e.built&&e.hp<e.maxHp;
        const disabledRepair=(!canRepair||!e.repairing&&this.players[0].credits<1)?' disabled':'';
        html+='<div class="buildActions"><button data-action="repair"'+disabledRepair+' title="Repair consumes credits over time">'+(e.repairing?'STOP REPAIR':'🔧 REPAIR')+'</button>';
        if(e.kind!=='hq')html+='<button data-action="sell" title="Sell this structure for a partial refund">¤ SELL</button>';
        html+='</div>';
      }
      else if(e.owner===0&&e.type==='unit'){
        html+=this.unitActionPanel(targets);
        if(e.kind==='specialist'){
          const a=this.specialistAbilityInfo(e),remaining=Math.max(0,Math.ceil((e.abilityReadyAt||0)-this.time));
          html+='<button class="specialAction" data-special="use" '+(remaining?'disabled':'')+
            ' title="Unique faction ability, keyboard F">'+(this.abilityArmedId===e.id?'CHOOSE JUMP TARGET':
            'F '+this.escape(a.name.toUpperCase())+(remaining?' · '+remaining+'S':''))+'</button>';
        }
      }
      box.innerHTML=html;
    }
    escape(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
    updateUI(force=false){
      if(!this.players.length)return;
      const me=this.players[0],power=this.power(0);
      $('money').textContent='¤ '+Math.floor(me.credits).toLocaleString();
      $('power').textContent='⚡ '+power.use+' / '+power.make;
      $('power').classList.toggle('low',power.low);
      $('army').textContent='♜ '+this.entities.filter(e=>e.owner===0&&e.type==='unit').length;
      $('battleClock').textContent=String(Math.floor(this.time/60)).padStart(2,'0')+':'+String(Math.floor(this.time%60)).padStart(2,'0');
      $('factionName').textContent=COLORS[me.faction].name;
      $('factionBadge').textContent=COLORS[me.faction].badge;
      $('factionBadge').style.color=COLORS[me.faction].color;
      $('factionInfo').textContent=power.low?'LOW POWER':'COMMAND SYSTEMS ONLINE';
      for(const b of $('tabs').querySelectorAll('button'))b.classList.toggle('active',b.dataset.tab===this.tab);
      let keys=this.tab==='structures'?['generator','refinery','barracks','factory','radar','tech']:this.tab==='defenses'?['turret','beam']:this.tab==='infantry'?['soldier','specialist']:['tank','heavy','recon','harvester'];
      $('production').innerHTML=keys.map(key=>{const d=BUILD[key]||UNITS[key],ready=this.prereq(0,key),rich=me.credits>=d.cost,q=this.queues.find(q=>q.side===0&&q.key===key);
        const label=NAMES[me.faction][key]||d.name;const available=ready&&rich&&!q;let reason=!ready?'Requires tech':!rich?'Not enough credits':q?'In production':'';
        const preview=(key==='generator'||key==='turret')?'./art/pilot/'+me.faction+'-'+(key==='generator'?'power':'turret')+'.svg':(key==='soldier'||key==='specialist')?'./art/pilot/'+me.faction+'-'+(key==='soldier'?'infantry':'specialist')+'.svg':key==='tank'?'./art/pilot/'+({coalition:'coalition-lynx',federation:'federation-bull',psionic:'psionic-viper'}[me.faction])+'.svg':key==='recon'?'./art/pilot/'+me.faction+'-recon.svg':null;
        const artwork=preview?'<img class="itemAsset" loading="lazy" alt="" src="'+preview+'">':'<span class="itemIcon">'+d.icon+'</span>';
        return '<button class="buildItem '+(!available?'locked ':'')+(this.placing===key?'selectedBuild':'')+'" data-key="'+key+'" '+(!available?'disabled':'')+' title="'+this.escape(label)+' '+this.escape(reason)+'">'+artwork+'<span class="itemTitle">'+this.escape(label)+'</span><span class="itemCost">¤ '+d.cost+'</span>'+(q?'<span class="progress" style="width:'+(q.elapsed/q.total*100)+'%"></span>':'')+'</button>';
      }).join('');
      $('queueList').innerHTML='<div class="queueHeader">ACTIVE PRODUCTION</div>'+this.queues.filter(q=>q.side===0).slice(0,6).map(q=>{
        const pct=Math.min(100,Math.max(0,Math.round(q.elapsed/q.total*100)));const name=this.escape(this.name({owner:0,kind:q.key}));
        return '<div class="queueEntry"><span class="name">'+name+'</span><span class="percent">'+pct+'%</span><button data-cancel-key="'+q.key+'" title="Cancel and refund full production cost">×</button><div class="track"><div class="bar" style="width:'+pct+'%"></div></div></div>';
      }).join('')+(this.queues.some(q=>q.side===0)?'':'<div class="queueEmpty">No units in production</div>');
      this.updateSelection();
    }
    newStats(){
      return {oreHarvested:0,creditsSpent:0,unitsDeployed:0,buildingsConstructed:0,unitsLost:0,buildingsLost:0,enemyUnitsDestroyed:0,enemyBuildingsDestroyed:0,damageDealt:0,buildingsSold:0};
    }
    recordLoss(entity,attackerOwner=null,sold=false){
      if(!entity||entity.lossRecorded)return;
      entity.lossRecorded=true;
      const own=this.stats?.[entity.owner];
      if(own){
        if(sold)own.buildingsSold++;
        else if(entity.type==='unit')own.unitsLost++;
        else own.buildingsLost++;
      }
      const killer=this.stats?.[attackerOwner];
      if(!sold&&killer&&attackerOwner!==entity.owner){
        if(entity.type==='unit')killer.enemyUnitsDestroyed++;
        else killer.enemyBuildingsDestroyed++;
      }
    }
    battleSummary(win){
      const score=(st)=>Math.max(0,Math.round(
        st.oreHarvested*.1+st.enemyUnitsDestroyed*90+st.enemyBuildingsDestroyed*220+
        st.damageDealt*.5+st.buildingsConstructed*12-st.unitsLost*14-st.buildingsLost*45
      ));
      const player=this.stats[0],enemy=this.stats[1];
      return {
        outcome:win?'VICTORY':'DEFEAT',duration:Math.round(this.time),
        map:(MAPS[this.settings.map]||MAPS.verdant).name,
        playerFaction:COLORS[this.players[0].faction].name,
        enemyFaction:COLORS[this.players[1].faction].name,
        player:{...player,score:score(player),credits:Math.floor(this.players[0].credits)},
        enemy:{...enemy,score:score(enemy),credits:Math.floor(this.players[1].credits)}
      };
    }
    copyBattleReport(){
      if(!this.lastBattleSummary)return false;
      const b=this.lastBattleSummary,format=n=>Number(n).toLocaleString();
      const message=[
        'CHRONO DOMINION · '+b.outcome,
        'Map: '+b.map,
        'Match duration: '+Math.floor(b.duration/60)+'m '+b.duration%60+'s',
        'Player: '+b.playerFaction+' · '+format(b.player.score)+' points',
        'Opponent: '+b.enemyFaction+' · '+format(b.enemy.score)+' points',
        'Ore delivered: '+format(b.player.oreHarvested),
        'Enemy units destroyed: '+b.player.enemyUnitsDestroyed,
        'Enemy buildings destroyed: '+b.player.enemyBuildingsDestroyed,
        'Friendly units lost: '+b.player.unitsLost
      ].join('\n');
      if(typeof navigator==='undefined'||!navigator.clipboard?.writeText){
        this.notify('Clipboard not available in this browser');return false;
      }
      navigator.clipboard.writeText(message).then(()=>this.notify('Battle report copied')).catch(()=>this.notify('Clipboard permission denied'));
      return true;
    }
    finish(win){
      if(this.state==='finished')return;
      this.state='finished';
      const battle=this.battleSummary(win);this.lastBattleSummary=battle;
      const label=(key)=>({oreHarvested:'ORE DELIVERED',enemyUnitsDestroyed:'UNITS DESTROYED',enemyBuildingsDestroyed:'STRUCTURES DESTROYED',unitsLost:'UNITS LOST',buildingsLost:'STRUCTURES LOST',unitsDeployed:'UNITS DEPLOYED',creditsSpent:'CREDITS SPENT'})[key];
      const format=n=>Math.round(n).toLocaleString();
      const sides=[{name:'YOUR ARMY',data:battle.player},{name:'OPPONENT',data:battle.enemy}];
      $('resultTitle').textContent=battle.outcome;
      $('resultText').textContent=battle.playerFaction+' vs '+battle.enemyFaction+
        ' · '+battle.map+' · '+String(Math.floor(battle.duration/60)).padStart(2,'0')+':'+String(battle.duration%60).padStart(2,'0');
      $('resultStats').innerHTML='<div class="resultGrid">'+sides.map(side=>
        '<section class="resultSide"><strong>'+side.name+'</strong><div class="resultScore">'+format(side.data.score)+' <small>PTS</small></div>'+
        ['oreHarvested','enemyUnitsDestroyed','enemyBuildingsDestroyed','unitsLost','buildingsLost','unitsDeployed','creditsSpent'].map(key=>
          '<div class="resultMetric"><span>'+label(key)+'</span><b>'+format(side.data[key])+'</b></div>'
        ).join('')+'</section>'
      ).join('')+'</div>';
      this.showMenu('resultMenu');
    }
    notify(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>el.classList.remove('show'),2500);}
    drawDiamond(x,y,fill,stroke){
      const p=iso(x,y),c=this.ctx;c.beginPath();c.moveTo(p.x,p.y-TH/2);c.lineTo(p.x+TW/2,p.y);c.lineTo(p.x,p.y+TH/2);c.lineTo(p.x-TW/2,p.y);c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=.55;c.stroke();}
    }
    drawTerrain(){
      const c=this.ctx,palette=terrain[this.settings.map]||terrain.verdant;
      for(let x=0;x<WORLD_SIZE;x++)for(let y=0;y<WORLD_SIZE;y++){
        const r=rand(x,y),water=this.water(x+.5,y+.5);
        this.drawDiamond(x+.5,y+.5,water?(MAPS[this.settings.map]||MAPS.verdant).waterColor:palette[Math.floor(r*palette.length)],'#091e243b');
        if(water&&r>.7){const p=iso(x+.5,y+.5);c.strokeStyle='#77b9c580';c.beginPath();c.moveTo(p.x-9,p.y);c.lineTo(p.x+6,p.y-3);c.stroke();}
        else if(!water&&r>.965){const p=iso(x+.5,y+.5);c.fillStyle='#223c34';c.beginPath();c.ellipse(p.x,p.y-3,4,2,0,0,Math.PI*2);c.fill();c.fillStyle=this.settings.map==='snow'?'#d7dfe0':'#294f3e';c.beginPath();c.moveTo(p.x-5,p.y-4);c.lineTo(p.x,p.y-16);c.lineTo(p.x+6,p.y-4);c.fill();}
      }
      for(const o of this.ores){if(o.amount<=0)continue;const p=iso(o.x,o.y),n=Math.min(4,Math.ceil(o.amount/350));
        for(let k=0;k<n;k++){const dx=(rand(k,o.x,11)-.5)*17,dy=(rand(k,o.y,12)-.5)*8;c.fillStyle=k%3===0?'#bdf0d1':'#dfab65';c.strokeStyle='#604b30';c.lineWidth=.6;c.beginPath();c.moveTo(p.x+dx,p.y+dy-11);c.lineTo(p.x+dx+7,p.y+dy-2);c.lineTo(p.x+dx,p.y+dy+2);c.lineTo(p.x+dx-5,p.y+dy-3);c.closePath();c.fill();c.stroke();}
      }
    }
    drawBuilding(e){
      const c=this.ctx,pal=COLORS[this.players[e.owner].faction],p=iso(e.x,e.y),h=(e.kind==='hq'?44:e.kind==='radar'?36:e.kind==='generator'?27:24)*Math.max(.25,e.construction);
      const shape=(pts,color)=>{c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.closePath();c.fillStyle=color;c.fill();};
      c.save();c.translate(p.x,p.y);
      const powerImage=e.kind==='generator'?this.buildingSprites[this.players[e.owner].faction]:e.kind==='turret'?this.defenseSprites[this.players[e.owner].faction]:null;
      if(powerImage&&powerImage.complete&&powerImage.naturalWidth>0){
        if(this.selected.includes(e.id))this.drawRing(0,2,51,pal.color);
        c.save();c.globalAlpha=e.built?1:Math.max(.25,e.construction*.85);c.drawImage(powerImage,-72,-131,144,144);c.restore();
        if(!e.built){c.fillStyle=pal.color;c.fillRect(-32,-9,64*e.construction,4);}
        this.health(e,0,-114,62);c.restore();return;
      }
      c.fillStyle='#050e17a3';c.beginPath();c.ellipse(6,5,54,20,0,0,Math.PI*2);c.fill();
      const a=[0,-25],b=[45,-3],d=[0,19],left=[-45,-3];
      shape([[left[0],left[1]],[d[0],d[1]],[d[0],d[1]-h],[left[0],left[1]-h]],pal.side);
      shape([[d[0],d[1]],[b[0],b[1]],[b[0],b[1]-h],[d[0],d[1]-h]],'#192536');
      shape([[a[0],a[1]-h],[b[0],b[1]-h],[d[0],d[1]-h],[left[0],left[1]-h]],pal.top);
      c.strokeStyle=pal.trim;c.lineWidth=2;c.beginPath();c.moveTo(left[0],left[1]-h);c.lineTo(0,19-h);c.lineTo(45,-3-h);c.stroke();
      c.fillStyle=pal.trim;
      if(e.kind==='generator'){c.fillRect(-19,-h-28,12,23);c.fillRect(8,-h-35,12,30);c.fillStyle='#d8f9ff';c.fillRect(-17,-h-25,8,6);}
      else if(e.kind==='hq'){shape([[-14,-h-3],[0,-h-32],[14,-h-3]],pal.side);c.fillRect(-3,-h-30,6,10);c.fillStyle='#d9f4ff';c.fillRect(-9,-h-9,18,4);}
      else if(e.kind==='radar'){c.strokeStyle=pal.trim;c.lineWidth=3;c.beginPath();c.moveTo(0,-h-2);c.lineTo(0,-h-33);c.stroke();c.beginPath();c.ellipse(0,-h-33,20,7,.25,0,7);c.stroke();}
      else if(e.kind==='refinery'){for(let i=0;i<3;i++){c.fillStyle='#c89455';c.fillRect(-25+i*12,-h-15,9,14);}c.fillStyle='#252d32';c.fillRect(12,-h-15,17,10);}
      else if(e.kind==='factory'){c.fillStyle='#23303c';c.fillRect(-23,-h-2,42,14);c.fillStyle=pal.trim;c.fillRect(-18,-h,31,3);}
      else if(e.kind==='tech'||e.kind==='beam'){c.strokeStyle=pal.trim;c.lineWidth=4;c.beginPath();c.moveTo(0,-h-3);c.lineTo(0,-h-39);c.stroke();c.fillStyle=pal.trim;c.beginPath();c.arc(0,-h-39,9,0,7);c.fill();}
      else if(e.kind==='turret'){c.fillStyle='#202d39';c.fillRect(-14,-h-9,28,12);c.strokeStyle=pal.trim;c.lineWidth=5;c.beginPath();c.moveTo(0,-h-5);c.lineTo(27,-h-13);c.stroke();}
      else{c.fillStyle=pal.trim;c.fillRect(-15,-h-9,29,5);}
      if(!e.built){c.fillStyle='#0a1524ab';c.fillRect(-33,-h-8,66,22);c.fillStyle=pal.trim;c.fillRect(-30,-h,60*e.construction,3);}
      if(this.selected.includes(e.id))this.drawRing(0,3,50,pal.color);
      this.health(e,0,-h-51,62);
      c.restore();
    }
    drawRing(x,y,r,color){const c=this.ctx;c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.ellipse(x,y,r,r*.44,0,0,Math.PI*2);c.stroke();}
    health(e,x,y,width){if(e.hp>=e.maxHp*.99)return;const c=this.ctx;c.fillStyle='#0e1622';c.fillRect(x-width/2,y,width,5);c.fillStyle=e.hp/e.maxHp>.4?'#77d381':'#e7776a';c.fillRect(x-width/2+1,y+1,(width-2)*Math.max(0,e.hp/e.maxHp),3);}
    drawUnit(e){
      const c=this.ctx,p=iso(e.x,e.y),pal=COLORS[this.players[e.owner].faction];c.save();c.translate(p.x,p.y);
      if((e.stunnedUntil||0)>this.time){this.drawRing(0,-8,26,'#bd93e8');}
      const atlas=(e.kind==='tank')?this.vehicleAtlases?.[this.players[e.owner].faction]:null;
      if(atlas?.hull&&atlas?.turret){
        const art=window.ChronoVehicleArt,srcSize=art.frameSize,cols=art.columns;
        const hullFrame=art.frameIndex(e.worldHeading),turretFrame=art.frameIndex(e.turretHeading??e.worldHeading);
        const drawLayer=(sheet,frame)=>c.drawImage(sheet,(frame%cols)*srcSize,Math.floor(frame/cols)*srcSize,srcSize,srcSize,-49,-63,98,98);
        if(this.selected.includes(e.id))this.drawRing(0,0,28,pal.color);
        drawLayer(atlas.hull,hullFrame);drawLayer(atlas.turret,turretFrame);
        this.health(e,0,-59,43);c.restore();return;
      }
      const inf=e.kind==='soldier'?this.infantrySprites[this.players[e.owner].faction]:e.kind==='specialist'?this.specialistSprites[this.players[e.owner].faction]:null;
      if(inf&&inf.complete&&inf.naturalWidth>0){
        if(this.selected.includes(e.id))this.drawRing(0,1,22,pal.color);
        c.drawImage(inf,-24,-48,48,48);this.health(e,0,-51,27);c.restore();return;
      }
      const recon=e.kind==='recon'?this.reconSprites[this.players[e.owner].faction]:null;
      if(recon&&recon.complete&&recon.naturalWidth>0){
        if(this.selected.includes(e.id))this.drawRing(0,0,24,pal.color);
        c.drawImage(recon,-42,-73,84,84);this.health(e,0,-66,38);c.restore();return;
      }
      const pilot=e.kind==='tank'?this.sprites[this.players[e.owner].faction]:null;
      if(pilot&&pilot.complete&&pilot.naturalWidth>0){
        if(this.selected.includes(e.id))this.drawRing(0,0,28,pal.color);
        c.drawImage(pilot,-47,-78,94,94);
        this.health(e,0,-76,43);c.restore();return;
      }
      c.fillStyle='#050b11a6';c.beginPath();c.ellipse(2,3,e.kind==='heavy'?23:17,7,0,0,Math.PI*2);c.fill();
      if(this.selected.includes(e.id))this.drawRing(0,1,e.kind==='heavy'?27:21,pal.color);
      if(e.kind==='soldier'||e.kind==='specialist'){
        c.fillStyle='#0c1420';c.fillRect(-3,-5,3,9);c.fillRect(2,-5,3,9);
        c.fillStyle=pal.top;c.fillRect(-5,-16,10,12);c.fillStyle=pal.color;c.fillRect(-5,-15,10,3);
        c.fillStyle='#e9c9a5';c.beginPath();c.arc(0,-20,4.6,0,7);c.fill();
        c.strokeStyle=e.kind==='specialist'?pal.trim:'#2a3037';c.lineWidth=3;c.beginPath();c.moveTo(3,-13);c.lineTo(11,-17);c.stroke();
        if(e.kind==='specialist'){c.strokeStyle=pal.trim;c.beginPath();c.arc(0,-20,9,Math.PI,Math.PI*2);c.stroke();}
        this.health(e,0,-33,27);
      }else{
        c.save();c.rotate(e.heading);
        const big=e.kind==='heavy',harvest=e.kind==='harvester',scout=e.kind==='recon';
        const sz=big?1.27:scout?.75:1;c.scale(sz,sz);
        c.fillStyle='#111b25';c.fillRect(-18,-12,36,7);c.fillRect(-18,5,36,7);
        c.fillStyle=pal.side;c.fillRect(-17,-9,34,18);
        c.fillStyle=pal.top;c.beginPath();c.moveTo(-17,-8);c.lineTo(11,-8);c.lineTo(18,-1);c.lineTo(11,8);c.lineTo(-17,8);c.closePath();c.fill();
        c.strokeStyle=pal.trim;c.lineWidth=2;c.beginPath();c.moveTo(-13,-7);c.lineTo(-13,7);c.stroke();
        c.fillStyle=pal.color;c.fillRect(-13,-7,7,4);
        if(scout){c.fillStyle=pal.trim;c.beginPath();c.moveTo(11,-6);c.lineTo(25,0);c.lineTo(11,6);c.closePath();c.fill();c.fillStyle='#182a37';c.fillRect(-8,-4,12,8);}
        else if(harvest){c.fillStyle='#d5ad68';c.fillRect(5,-6,11,12);c.fillStyle=e.load?'#b1e4cb':'#253b39';c.fillRect(-5,-5,9,10);}
        else{c.fillStyle='#293849';c.beginPath();c.arc(1,0,8,0,7);c.fill();c.strokeStyle=pal.trim;c.lineWidth=big?6:4;c.beginPath();c.moveTo(5,0);c.lineTo(big?29:25,0);c.stroke();c.fillStyle=pal.color;c.fillRect(-2,-3,7,6);}
        c.restore();this.health(e,0,-27,big?43:35);
      }
      c.restore();
    }
    drawEffects(){
      const c=this.ctx;
      for(const p of this.particles){const a=iso(p.x,p.y);c.save();c.translate(a.x,a.y);c.globalAlpha=clamp(p.life,0,1);
        if(p.type==='marker'){this.drawRing(0,0,20*(1.5-p.life),p.color);}
        else if(p.type==='boom'){c.fillStyle=p.color;c.beginPath();c.arc(0,-13,22*(1.1-p.life),0,7);c.fill();}
        else if(p.type==='abilityPulse'){
          const fraction=1-p.life/.85;
          const size=(p.radius||90)*fraction;
          c.strokeStyle=p.color;c.lineWidth=3.5;c.globalAlpha=clamp(p.life/.85,0,1);
          c.beginPath();c.ellipse(0,0,Math.max(2,size),Math.max(1,size*.47),0,0,Math.PI*2);c.stroke();
          c.beginPath();c.ellipse(0,-11,Math.max(1,size*.36),Math.max(1,size*.18),0,0,Math.PI*2);c.stroke();
        }
        else if(p.type==='muzzle'){c.fillStyle=p.color;c.beginPath();c.arc(0,-21,9*p.life/.2,0,Math.PI*2);c.fill();}
        else if(p.type==='cash'){c.fillStyle=p.color;c.font='bold 17px Consolas';c.fillText('+CREDITS',-34,-28-(1-p.life)*20);}
        else{c.strokeStyle=p.color;c.lineWidth=3;c.beginPath();c.arc(0,-9,15*(1-p.life)+4,0,7);c.stroke();}
        c.restore();}
    }
    drawFog(){
      const c=this.ctx;if(!this.fog.length)return;
      for(let x=0;x<WORLD_SIZE;x++)for(let y=0;y<WORLD_SIZE;y++){const cell=this.fog[x][y];if(cell.visible)continue;this.drawDiamond(x+.5,y+.5,cell.seen?'#08131ca8':'#04101af3');}
    }
    drawRadar(){
      const c=this.rctx,w=this.radar.width,h=this.radar.height;c.clearRect(0,0,w,h);c.fillStyle='#0b2028';c.fillRect(0,0,w,h);
      for(let x=0;x<WORLD_SIZE;x++)for(let y=0;y<WORLD_SIZE;y++){const cell=this.fog[x]?.[y];c.fillStyle=!cell?.seen?'#061019':this.water(x+.5,y+.5)?'#36617a':cell.visible?'#466449':'#294037';c.fillRect(x*w/WORLD_SIZE,y*h/WORLD_SIZE,Math.ceil(w/WORLD_SIZE),Math.ceil(h/WORLD_SIZE));}
      c.fillStyle='#c0a45b';for(const o of this.ores){if(o.amount>0&&this.fog[Math.floor(o.x)]?.[Math.floor(o.y)]?.seen)c.fillRect(o.x*w/WORLD_SIZE,o.y*h/WORLD_SIZE,3,3);}
      for(const e of this.entities){if(e.hp<=0||e.owner===1&&!this.isVisible(e.x,e.y))continue;c.fillStyle=e.owner===0?'#6bd7ec':'#ed7e6a';c.fillRect(e.x*w/WORLD_SIZE-2,e.y*h/WORLD_SIZE-2,e.type==='building'?5:3,e.type==='building'?5:3);}
      const {x:cx,y:cy}=this.worldToGrid(this.camera.x,this.camera.y);c.strokeStyle='#9ddbe99c';c.lineWidth=1;c.strokeRect(clamp(cx-6,0,34)*w/34,clamp(cy-8,0,34)*h/34,12*w/34,16*h/34);
    }
    worldToGrid(wx,wy){return{x:wx/TW+wy/TH,y:wy/TH-wx/TW};}
    draw(){
      const c=this.ctx,d=this.dpr;c.setTransform(d,0,0,d,0,0);c.fillStyle='#081821';c.fillRect(0,0,this.w,this.h);
      c.translate(this.w/2-this.camera.x*this.camera.zoom,this.h/2-this.camera.y*this.camera.zoom);c.scale(this.camera.zoom,this.camera.zoom);
      this.drawTerrain();
      const entities=this.entities.filter(e=>e.hp>0&&(e.owner===0||this.isVisible(e.x,e.y))).sort((a,b)=>(a.x+a.y)-(b.x+b.y));
      for(const e of entities)e.type==='building'?this.drawBuilding(e):this.drawUnit(e);
      this.drawProjectiles();this.drawEffects();this.drawFog();
      if(this.placing&&this.state==='playing'){
        const x=Math.round(this.mouse.worldX),y=Math.round(this.mouse.worldY),ok=this.canPlace(x,y,0);
        const color=ok?'#62e2a7':'#fa797f';
        for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
          const p=iso(x+dx,y+dy);
          c.save();c.globalAlpha=.42;
          this.drawDiamond(x+dx,y+dy,ok?'#42d39d':'#ff606a',color);
          c.restore();
        }
        c.save();c.strokeStyle=color;c.lineWidth=2;c.setLineDash([6,4]);
        const corner=[iso(x-1.5,y-1.5),iso(x+1.5,y-1.5),iso(x+1.5,y+1.5),iso(x-1.5,y+1.5)];
        c.beginPath();c.moveTo(corner[0].x,corner[0].y);
        corner.slice(1).forEach(p=>c.lineTo(p.x,p.y));c.closePath();c.stroke();c.restore();
      }
      if(this.dragStart&&this.dragEnd&&Math.hypot(this.dragStart.x-this.dragEnd.x,this.dragStart.y-this.dragEnd.y)>12){
        c.setTransform(d,0,0,d,0,0);const a=this.dragStart,b=this.dragEnd;c.fillStyle='#8bceef29';c.strokeStyle='#98d9f2';c.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);c.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);}
      this.drawRadar();
    }
    frame(now){const dt=Math.min(.06,(now-this.last)/1000||0);this.last=now;if(this.state==='playing')this.step(dt);this.draw();requestAnimationFrame(t=>this.frame(t));}
  }
  window.ChronoDominion={version:'0.9.0',build:'battle-results-and-patrols'};
  new Game();
})();
