/* Chrono Dominion v2.42 — adaptive, sensor-informed AI air defense. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  let WORLD_SIZE = 34;
  const TW = 64, TH = 32;
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
  const mapSize=name=>MAPS[name]?.size===48?48:34;
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
    beam:{name:'Energy Tower',icon:'◉',cost:1200,hp:470,power:-75,requires:['barracks','radar'],range:6.5,damage:26,rate:1.65,antiAirBonus:1.5},
    airfield:{name:'Air Command',icon:'✈',cost:1750,hp:700,power:-55,requires:['factory','radar']},
    flak:{name:'Skyguard Battery',icon:'⌁',cost:950,hp:440,power:-45,requires:['radar'],range:7.3,damage:32,rate:1.2,antiAirOnly:true}
  };
  const UNITS = {
    soldier:{name:'Rifle Squad',icon:'♟',cost:200,hp:70,speed:1.9,range:3.0,damage:11,rate:1.05,from:'barracks'},
    specialist:{name:'Special Operative',icon:'✦',cost:700,hp:80,speed:2.0,range:3.2,damage:14,rate:1.4,from:'barracks',requires:['radar']},
    tank:{name:'Battle Tank',icon:'▰',cost:850,hp:270,speed:1.55,range:4.0,damage:32,rate:1.45,from:'factory'},
    heavy:{name:'Siege Tank',icon:'▱',cost:1450,hp:420,speed:1.02,range:5.0,damage:53,rate:2.0,from:'factory',requires:['tech']},
    harvester:{name:'Ore Harvester',icon:'◈',cost:900,hp:310,speed:1.23,range:0,damage:0,from:'refinery'},
    recon:{name:'Recon Vehicle',icon:'⌁',cost:550,hp:145,speed:2.55,range:3.2,damage:13,rate:.9,from:'factory'},
    aircraft:{name:'Strike Aircraft',icon:'✈',cost:1600,hp:220,speed:4.4,range:4.5,damage:38,rate:1.65,ammo:4,from:'airfield',requires:['radar']}
  };
  const NAMES = {
    coalition:{hq:'Field Command',generator:'Fusion Array',refinery:'Ore Processor',barracks:'Training Centre',factory:'Vehicle Assembly',radar:'Tactical Radar',tech:'Chrono Laboratory',turret:'Auto Cannon',beam:'Prism Array',soldier:'Ranger',specialist:'Chrono Operative',tank:'Lynx Tank',heavy:'Bulwark MBT',harvester:'Alloy Harvester',recon:'Lynx Scout',airfield:'Sky Command',aircraft:'Falcon Interceptor',flak:'Skyguard Battery'},
    federation:{hq:'Iron Command',generator:'Thermal Reactor',refinery:'Industrial Refinery',barracks:'Garrison',factory:'Armour Foundry',radar:'Signal Tower',tech:'Weapons Institute',turret:'Gun Nest',beam:'Arc Coil',soldier:'Rifleman',specialist:'Arc Trooper',tank:'Bull Tank',heavy:'Mammoth Tank',harvester:'Ore Carrier',recon:'Iron Patrol',airfield:'Aviation Foundry',aircraft:'Iron Talon',flak:'Iron Flak Array'},
    psionic:{hq:'Neural Nexus',generator:'Bio Reactor',refinery:'Neural Refinery',barracks:'Initiation Chamber',factory:'Mind Forge',radar:'Psi Scanner',tech:'Ascension Spire',turret:'Neural Sentinel',beam:'Psychic Spire',soldier:'Acolyte',specialist:'Neural Disciple',tank:'Viper Tank',heavy:'Mindbreaker',harvester:'Psi Collector',recon:'Shade Runner',airfield:'Aether Platform',aircraft:'Spectre Wing',flak:'Aether Lance'}
  };
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  // Render-only landing transitions follow entity identity, never serialized saves.
  const airServiceVisuals=new WeakMap();
  const turnToward=(current,wanted,maxDelta)=>{const delta=Math.atan2(Math.sin(wanted-current),Math.cos(wanted-current));return current+clamp(delta,-maxDelta,maxDelta);};
  const iso=(x,y)=>({x:(x-y)*TW/2,y:(x+y)*TH/2});
  const rand=(x,y,s=0)=>{let v=Math.sin(x*123.17+y*78.233+s*103.13)*43758.5453;return v-Math.floor(v);};
  const terrain = {
    verdant:['#3c604d','#416951','#456e56','#4b7459','#395d49'],
    desert:['#786c4d','#807351','#897952','#7f714b','#92805a'],
    snow:['#9baeb1','#a3b4b7','#adbdbe','#97a9ad','#b6c2c3']
  };
  // Spatial buckets keep local collision checks proportional to nearby units,
  // rather than comparing every moving vehicle with every unit every frame.
  class UnitBuckets {
    constructor(size=2,kind='unit'){this.size=size;this.kind=kind;this.cells=new Map();this.positions=new Map();}
    key(x,y){return Math.floor(x/this.size)+','+Math.floor(y/this.size);}
    insert(e){
      if(e.hp<=0||(this.kind&&e.type!==this.kind))return;
      const k=this.key(e.x,e.y),set=this.cells.get(k)||new Set();
      set.add(e);this.cells.set(k,set);this.positions.set(e.id,k);
    }
    remove(e){
      const k=this.positions.get(e.id);
      if(k!==undefined){const set=this.cells.get(k);set?.delete(e);if(set?.size===0)this.cells.delete(k);}
      this.positions.delete(e.id);
    }
    move(e,x,y){
      const next=this.key(x,y),prev=this.positions.get(e.id);
      if(prev!==next){this.remove(e);e.x=x;e.y=y;this.insert(e);}
      else {e.x=x;e.y=y;}
    }
    rebuild(entities){
      this.cells.clear();this.positions.clear();
      for(const e of entities)this.insert(e);
      return this;
    }
    nearby(x,y){
      const bx=Math.floor(x/this.size),by=Math.floor(y/this.size),result=[];
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const set=this.cells.get((bx+dx)+','+(by+dy));
        if(set)for(const e of set)result.push(e);
      }
      return result;
    }
  }
  class Game {
    constructor(){
      this.canvas=$('world');this.ctx=this.canvas.getContext('2d');
      this.radar=$('radar');this.rctx=this.radar.getContext('2d');
      this.camera={x:0,y:545,zoom:1};this.keys=new Set();this.mousePan=null;
      this.entities=[];this.ores=[];this.particles=[];this.projectiles=[];this.orders=[];this.queues=[];this.nextId=1;this.unitBuckets=null;this.buildingBuckets=null;this.sensorBuckets=null;
      this.selected=[];this.groups={};this.attackMoveArmed=false;this.abilityArmedId=null;this.dragStart=null;this.dragEnd=null;this.touchPointer=null;this.touchPoints=new Map();this.touchGesture=null;this.placing=null;this.tab='structures';
      this.players=[];this.stats=[];this.intel=[[],[]];this.aiExplored=new Set();this.reconAlerts=new Map();this.battleEvents=[];this.damageAlerts=new Map();this.nextBattleEventId=1;this.aiPlatoon=null;this.aiSupportPlatoon=null;this.aiAssaultProgress=new Map();this.aiAssaultReroutes=0;this.aiSiegeOrders=0;this.aiSiegeHits=0;this.aiRallyResumes=0;this.state='menu';this.last=performance.now();this.time=0;this.nextAI=0;this.nextHarvesterResponseAt=0;this.unservedHarvesterShooterId=0;this.nextRadarResponseAt=0;this.nextUi=0;this.nextFog=0;this.fog=[];
      this.perfFrames=0;this.lastPerfAt=null;
      this.mouse={x:0,y:0,worldX:0,worldY:0};this.toastTimer=null;this.audio=window.ChronoAudio||null;
      this.sprites={};this.buildingSprites={};this.defenseSprites={};this.infantrySprites={};this.specialistSprites={};this.reconSprites={};this.loadPilotSprites();
      this.vehicleAtlases=null;
      if(window.ChronoVehicleArt){try{this.vehicleAtlases=window.ChronoVehicleArt.createAtlases();}catch(err){console.warn('Directional atlas fallback:',err);}}
      this.loadRenderedAtlases();
      this.settings={playerFaction:'coalition',enemyFaction:'federation',map:'verdant',difficulty:'standard'};
      this.refreshCustomMap();
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
        if(this.state==='playing'&&k===' '){
          e.preventDefault();this.keys.add(' ');return;
        }
        if(this.state==='playing'&&k==='c'){e.preventDefault();this.centerSelection();return;}
        this.keys.add(k);if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='escape'){if(!this.cancelCurrentMode()&&(this.state==='playing'||this.state==='paused'))this.pause();}});
      window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
      // A lost keyup after switching windows can otherwise pan the battlefield
      // indefinitely. Discard active mouse/touch gestures as well.
      const releaseInput=()=>{this.keys.clear();this.resetTouch();};
      window.addEventListener('blur',releaseInput);
      document.addEventListener?.('visibilitychange',()=>{
        if(document.hidden)releaseInput();
      });
      this.canvas.addEventListener('contextmenu',e=>e.preventDefault());
      this.canvas.addEventListener('pointerdown',e=>this.pointerDown(e));
      this.canvas.addEventListener('pointermove',e=>this.pointerMove(e));
      this.canvas.addEventListener('pointercancel',e=>this.pointerCancel(e));
      window.addEventListener('pointerup',e=>this.pointerUp(e));
      this.canvas.addEventListener('wheel',e=>{
        e.preventDefault();
        // Horizontal-only trackpad scroll must not zoom the battlefield.
        if(this.state!=='playing'||!Number.isFinite(e.deltaY)||e.deltaY===0)return;
        this.zoomAtClientPoint(e.clientX,e.clientY,e.deltaY<0?1.09:.91);
      },{passive:false});
      this.radar.addEventListener('click',e=>{if(this.state!=='playing')return;const r=this.radar.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*WORLD_SIZE,y=(e.clientY-r.top)/r.height*WORLD_SIZE;const p=iso(x,y);this.camera.x=p.x;this.camera.y=p.y;});
      $('reconStatus').addEventListener('click',e=>{const b=e.target.closest?.('button[data-contact-id]');if(b)this.centerIntelContact(Number(b.dataset.contactId));});
      $('battleEventList').addEventListener('click',e=>{const b=e.target.closest?.('button[data-event-id]');if(b)this.centerBattleEvent(Number(b.dataset.eventId));});
      $('tabs').addEventListener('click',e=>{const b=e.target.closest('button[data-tab]');if(b){this.tab=b.dataset.tab;this.updateUI(true);}});
      $('production').addEventListener('click',e=>{const b=e.target.closest('button[data-key]');if(b)this.chooseProduction(b.dataset.key);});
      $('queueList').addEventListener('click',e=>{const b=e.target.closest?.('button[data-cancel-key]');if(b)this.cancelProduction(b.dataset.cancelKey);});
      $('selection').addEventListener('click',e=>{const b=e.target.closest?.('button[data-action]');if(b)this.buildingAction(b.dataset.action);
        const unit=e.target.closest?.('button[data-unit-action]');if(unit)this.unitAction(unit.dataset.unitAction);
        const special=e.target.closest?.('button[data-special]');if(special)this.useSpecialistAbility();});
      $('openSkirmish').onclick=()=>{this.refreshCustomMap();this.showMenu('skirmishMenu');this.drawMapPreview();};
      $('mapSelect').addEventListener('change',()=>this.drawMapPreview());
      $('backMenu').onclick=()=>this.showMenu('mainMenu');
      $('openHow').onclick=()=>this.showMenu('howMenu');
      $('menuAudioSettings').onclick=()=>{$('audioPanel').classList.remove('hidden');$('audioSettings').setAttribute('aria-expanded','true');};
      $('backHow').onclick=()=>this.showMenu('mainMenu');
      $('start').onclick=()=>{const get=id=>$(id).value;this.audio?.unlock();this.newMatch({playerFaction:get('playerFaction'),enemyFaction:get('enemyFaction'),map:get('mapSelect'),difficulty:get('difficulty'),startingCredits:Number(get('startingCredits'))});};
      $('cancelMode').onclick=()=>this.cancelCurrentMode();
      $('pauseBtn').onclick=()=>this.pause();$('resume').onclick=()=>this.pause();
      $('soundToggle').onclick=()=>{
        this.audio?.setEnabled(!this.audio.enabled);
        this.updateSoundToggle();
        if(this.audio?.enabled)this.audio.play('build');
      };
      this.updateSoundToggle();
      const updateMixer=()=>{
        $('sfxVolume').value=String(Math.round((this.audio?.sfxVolume??.8)*100));
        $('musicVolume').value=String(Math.round((this.audio?.musicVolume??.35)*100));
        $('sfxLevel').textContent=$('sfxVolume').value+'%';
        $('musicLevel').textContent=$('musicVolume').value+'%';
        $('musicEnabled').checked=!!this.audio?.musicEnabled;
        $('voiceEnabled').checked=!!this.audio?.voiceEnabled;
      };
      updateMixer();
      this.audio?.loadBuiltins?.()?.then?.(count=>{
        if(!this.audio?.imported?.loaded){
          $('audioStatus').textContent=count
            ?count+' built-in original sounds ready. Local audio folders are optional.'
            :'Built-in audio unavailable; synthesized effects and browser voices remain available.';
        }
      }).catch?.(()=>{});
      const closeAudio=()=>{$('audioPanel').classList.add('hidden');$('audioSettings').setAttribute('aria-expanded','false');};
      $('audioSettings').onclick=()=>{
        const opening=$('audioPanel').classList.contains('hidden');
        $('audioPanel').classList.toggle('hidden',!opening);
        $('audioSettings').setAttribute('aria-expanded',String(opening));
        if(opening)updateMixer();
      };
      $('audioClose').onclick=closeAudio;
      $('sfxVolume').oninput=e=>{this.audio?.setSfxVolume(Number(e.target.value)/100);$('sfxLevel').textContent=e.target.value+'%';};
      $('musicVolume').oninput=e=>{this.audio?.setMusicVolume(Number(e.target.value)/100);$('musicLevel').textContent=e.target.value+'%';};
      $('musicEnabled').onchange=e=>{this.audio?.setMusicEnabled(e.target.checked);};
      $('voiceEnabled').onchange=e=>{this.audio?.setVoiceEnabled(e.target.checked);};
      $('voicePreview').onclick=()=>{
        this.audio?.setEnabled(true);this.updateSoundToggle();
        this.audio?.setVoiceEnabled(true);$('voiceEnabled').checked=true;
        const spoken=this.audio?.previewVoice('federation','soldier');
        $('audioStatus').textContent=spoken?'Previewing Iron Federation field radio.':'Browser voice synthesis unavailable; synthesized effects still work.';
      };
      $('audioImport').onclick=()=>{
        if(!this.audio?.enabled){this.audio?.setEnabled(true);this.updateSoundToggle();}
        this.audio?.unlock();$('audioFiles').click();
      };
      $('audioFiles').onchange=async e=>{
        if(!e.target.files?.length)return;
        $('audioStatus').textContent='Reading local audio filenames…';
        try{
          const result=await this.audio?.importFiles(e.target.files);
          $('audioStatus').textContent=result
            ?result.loaded+' files found · '+result.matched+' assigned · '+result.tracks+' music groups. No files uploaded.'
            :'Audio engine unavailable.';
          if(result?.matched)this.audio?.play('ready');
        }catch(err){$('audioStatus').textContent='Could not read this folder. Try WAV, OGG or MP3 files.';}
        e.target.value='';
      };
      $('audioClear').onclick=()=>{this.audio?.clearLocalPack();$('audioStatus').textContent='Local sound pack cleared. Built-in sound library restored.';};
      $('zoomIn').onclick=()=>{this.camera.zoom=clamp(this.camera.zoom*1.15,.65,1.8);};
      $('zoomOut').onclick=()=>{this.camera.zoom=clamp(this.camera.zoom/1.15,.65,1.8);};
      $('restart').onclick=()=>this.newMatch(this.settings);
      $('quit').onclick=()=>this.returnMenu();$('resultQuit').onclick=()=>this.returnMenu();
      $('playAgain').onclick=()=>this.newMatch(this.settings);
      $('copyResult').onclick=()=>this.copyBattleReport();
      $('saveGame').onclick=()=>this.saveGame();
      $('loadMain').onclick=()=>{this.audio?.unlock();this.loadGame();};
      $('loadPaused').onclick=()=>{this.audio?.unlock();this.loadGame();};
    }
    installCustomMap(map){
      if(!window.ChronoMaps?.validate(map).valid)return false;
      const copy=JSON.parse(JSON.stringify(map));
      Object.defineProperty(copy,'_waterSet',{value:new Set(copy.waterTiles.map(p=>p.join(','))),enumerable:false});
      MAPS.custom=copy;
      const option=$('mapSelect').querySelector('option[value="custom"]');
      if(option){option.disabled=false;option.textContent='CUSTOM · '+copy.name.toUpperCase();}
      return true;
    }
    refreshCustomMap(){
      if(!window.ChronoMaps)return false;
      const custom=window.ChronoMaps.load();
      const installed=custom&&this.installCustomMap(custom);
      if(!installed){
        delete MAPS.custom;
        const option=$('mapSelect').querySelector('option[value="custom"]');
        if(option){option.disabled=true;option.textContent='Custom Battlefield · Create in Map Forge';}
        if($('mapSelect').value==='custom')$('mapSelect').value='verdant';
      }
      if(installed&&typeof location!=='undefined'){
        try{if(new URLSearchParams(location.search).get('map')==='custom')$('mapSelect').value='custom';}
        catch(err){/* Browser URL unavailable in embedded tests. */}
      }
      return !!installed;
    }
    updateSoundToggle(){
      const control=$('soundToggle'),on=!!this.audio?.enabled;
      control.textContent=on?'♪ ON':'♪ OFF';
      control.setAttribute?.('aria-pressed',String(on));
      control.setAttribute?.('aria-label',on?'Disable battle sound effects':'Enable battle sound effects');
      control.title=on?'Mute game sounds and soundtrack':'Enable game sounds and soundtrack (off by default)';
    }
    showMenu(which){['mainMenu','skirmishMenu','howMenu','pauseMenu','resultMenu'].forEach(id=>$(id).classList.toggle('hidden',id!==which));$('overlay').classList.remove('hidden');}
    returnMenu(){this.audio?.setScene('menu');this.state='menu';this.keys.clear();this.resetTouch();this.selected=[];this.placing=null;this.showMenu('mainMenu');this.updateSaveButtons();this.updateUI(true);}
    pause(){if(this.state==='playing'){this.audio?.setScene('pause');this.keys.clear();this.resetTouch();this.state='paused';this.showMenu('pauseMenu');this.updateSaveButtons();}else if(this.state==='paused'){this.state='playing';this.audio?.setScene('battle');$('overlay').classList.add('hidden');}}
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
        customMap:this.settings.map==='custom'?MAPS.custom:null,
        intel:this.intel,aiExplored:[...this.aiExplored],battleEvents:this.battleEvents,aiPlatoon:this.aiPlatoon,aiSupportPlatoon:this.aiSupportPlatoon,
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
      const loadedCustom=saved?.settings?.map==='custom'&&(saved.customMap||MAPS.custom);
      const validMap=Object.hasOwn(MAPS,saved?.settings?.map)||
        (saved?.settings?.map==='custom'&&window.ChronoMaps?.validate(loadedCustom)?.valid);
      // Validate before mutating the current game. A broken older snapshot must never destroy a live session.
      const savedSize=mapSize(saved?.settings?.map);
      const valid= saved.version===1&&saved.settings&&
        validFaction(saved.settings.playerFaction)&&validFaction(saved.settings.enemyFaction)&&
        validMap&&
        ['recruit','standard','veteran'].includes(saved.settings.difficulty)&&
        Array.isArray(saved.players)&&saved.players.length===2&&saved.players.every(p=>p&&validFaction(p.faction)&&Number.isFinite(p.credits)&&p.credits>=0)&&
        Array.isArray(saved.entities)&&saved.entities.length<2000&&
        saved.entities.every(e=>e&&Number.isInteger(e.id)&&e.id>0&&(e.owner===0||e.owner===1)&&
          (Object.hasOwn(BUILD,e.kind)||Object.hasOwn(UNITS,e.kind))&&
          Number.isFinite(e.x)&&Number.isFinite(e.y)&&e.x>=0&&e.y>=0&&e.x<=savedSize&&e.y<=savedSize&&
          Number.isFinite(e.hp)&&Number.isFinite(e.maxHp)&&e.maxHp>0)&&
        Array.isArray(saved.ores)&&saved.ores.length<=5000&&
        Array.isArray(saved.queues)&&saved.queues.length<=200&&
        Array.isArray(saved.fog)&&saved.fog.length===savedSize&&
        saved.fog.every(row=>Array.isArray(row)&&row.length===savedSize);
      if(!valid){this.notify('Saved game is incompatible with this version');return false;}
      if(saved.settings.map==='custom'&&loadedCustom)this.installCustomMap(loadedCustom);
      WORLD_SIZE=mapSize(saved.settings.map);
      this.settings={...saved.settings};
      this.players=saved.players.map(p=>({...p}));
      this.stats=Array.isArray(saved.stats)&&saved.stats.length===2?saved.stats.map(v=>({...this.newStats(),...v})): [this.newStats(),this.newStats()];
      // Older saves had no intelligence memory; validate new memory before using it.
      this.intel=Array.isArray(saved.intel)&&saved.intel.length===2?
        saved.intel.map(entries=>Array.isArray(entries)?entries.slice(0,150).filter(v=>
          v&&Number.isInteger(v.id)&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&
          Number.isFinite(v.time)&&['unit','building'].includes(v.type)&&v.x>=0&&v.x<=WORLD_SIZE&&v.y>=0&&v.y<=WORLD_SIZE
        ).map(v=>({...v})):[]):[[],[]];
      this.reconAlerts=new Map();
      // Treat local saves as untrusted input. Older snapshots omit this field.
      this.battleEvents=Array.isArray(saved.battleEvents)?saved.battleEvents.slice(0,12).filter(v=>
        v&&Number.isInteger(v.id)&&v.id>0&&Number.isFinite(v.time)&&v.time>=0&&v.time<=1e8&&
        Number.isFinite(v.x)&&Number.isFinite(v.y)&&v.x>=0&&v.x<=WORLD_SIZE&&v.y>=0&&v.y<=WORLD_SIZE&&
        typeof v.text==='string'&&v.text.length<=100&&['alert','damage','critical','loss'].includes(v.kind)&&
        (v.refId===null||Number.isInteger(v.refId)&&v.refId>0)
      ).map(v=>({id:v.id,time:v.time,x:v.x,y:v.y,text:v.text,kind:v.kind,refId:v.refId})): [];
      this.nextBattleEventId=Math.max(0,...this.battleEvents.map(v=>v.id))+1;
      this.damageAlerts=new Map();
      for(const event of this.battleEvents){
        if(['damage','critical'].includes(event.kind)&&event.refId&&!this.damageAlerts.has(event.refId))
          this.damageAlerts.set(event.refId,{time:event.time,critical:event.kind==='critical'});
      }
      this.aiExplored=new Set(Array.isArray(saved.aiExplored)?
        saved.aiExplored.slice(0,WORLD_SIZE*WORLD_SIZE).filter(key=>{
          if(typeof key!=='string'||!/^\d{1,2},\d{1,2}$/.test(key))return false;
          const [x,y]=key.split(',').map(Number);
          return x>=0&&x<WORLD_SIZE&&y>=0&&y<WORLD_SIZE;
        }):[]);
      this.aiPlatoon=this.restoreAIPlatoon(saved.aiPlatoon,saved.entities);
      this.aiSupportPlatoon=this.restoreAIPlatoon(saved.aiSupportPlatoon,saved.entities);
      // Stuck detection is transient; old snapshots never stored it.
      this.aiAssaultProgress=new Map();this.aiAssaultReroutes=0;this.aiSiegeOrders=0;this.aiSiegeHits=0;this.aiRallyResumes=0;
      if(this.aiSupportPlatoon&&this.aiPlatoon&&this.aiSupportPlatoon.ids.some(id=>this.aiPlatoon.ids.includes(id)))this.aiSupportPlatoon=null;
      this.entities=saved.entities.map(e=>({...e,
        kills:Number.isInteger(e.kills)&&e.kills>=0?Math.min(9999,e.kills):0,
        lanePass:null,laneWaiting:null}));this.unitBuckets=null;this.buildingBuckets=null;this.sensorBuckets=null;this.laneReservations=new Map();
      this.ores=saved.ores.map(o=>({...o}));
      this.queues=saved.queues.map(q=>({...q}));
      this.projectiles=Array.isArray(saved.projectiles)?saved.projectiles.filter(x=>x&&Number.isFinite(x.x)&&Number.isFinite(x.y)).map(x=>({...x})):[];
      this.particles=Array.isArray(saved.particles)?saved.particles.filter(x=>x&&Number.isFinite(x.x)&&Number.isFinite(x.y)).map(x=>({...x})):[];
      this.time=Number.isFinite(saved.time)?Math.max(0,saved.time):0;
      this.nextAI=Number.isFinite(saved.nextAI)?Math.max(this.time,saved.nextAI):this.time+5;
      this.nextHarvesterResponseAt=0;this.unservedHarvesterShooterId=0;this.nextRadarResponseAt=0; // Tactical cooldowns are transient.
      this.nextId=Math.max(...this.entities.map(e=>e.id),0)+1;
      this.selected=Array.isArray(saved.selected)?saved.selected.filter(id=>this.entities.some(e=>e.id===id&&e.hp>0)):[];
      this.groups=saved.groups&&typeof saved.groups==='object'?saved.groups:{};
      this.camera=saved.camera&&Number.isFinite(saved.camera.x)&&Number.isFinite(saved.camera.y)&&Number.isFinite(saved.camera.zoom)?{
        x:clamp(saved.camera.x,-WORLD_SIZE*TW/2,WORLD_SIZE*TW/2),y:clamp(saved.camera.y,50,WORLD_SIZE*TH),zoom:clamp(saved.camera.zoom,.65,1.8)
      }:{x:0,y:370,zoom:1};
      this.fog=saved.fog.map(row=>row.map(seen=>({seen:!!seen,visible:false})));
      this.placing=null;this.attackMoveArmed=false;this.abilityArmedId=null;this.resetTouch();
      this.keys.clear();this.nextUi=0;this.nextFog=0;
      this.state='playing';this.audio?.setScene('battle');
      for(const [id,key] of [['playerFaction','playerFaction'],['enemyFaction','enemyFaction'],['mapSelect','map'],['difficulty','difficulty']])$(id).value=this.settings[key];
      $('startingCredits').value=String(this.settings.startingCredits||5000);
      this.drawMapPreview();
      this.updateFog();this.updateAISurvey();this.updateIntel(0);this.updateUI(true);this.updateSaveButtons();
      $('overlay').classList.add('hidden');
      this.notify('Saved skirmish loaded');this.audio?.announce('commandOnline');return true;
    }
    get worldSize(){return WORLD_SIZE;}
    clampCamera(){
      const span=WORLD_SIZE*TW/2;
      this.camera.x=clamp(this.camera.x,-span,span);
      this.camera.y=clamp(this.camera.y,50,WORLD_SIZE*TH);
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
      if(kind==='aircraft')e.ammo=UNITS.aircraft.ammo;
      if(e.type==='unit'){e.stance='guard';e.guardX=x;e.guardY=y;e.worldHeading=owner===0?0:Math.PI;e.turretHeading=e.worldHeading;e.desiredHeading=e.worldHeading;e.desiredTurretHeading=e.worldHeading;}
      this.entities.push(e);this.unitBuckets?.insert(e);this.sensorBuckets?.[owner]?.insert(e);
      if(this.stats[owner]){if(e.type==='unit')this.stats[owner].unitsDeployed++;else this.stats[owner].buildingsConstructed++;}
      return e;
    }
    drawMapPreview(){
      const canvas=$('mapPreview'),ctx=canvas.getContext('2d');
      if(!ctx)return;
      const map=$('mapSelect').value||'verdant',cfg=MAPS[map]||MAPS.verdant;
      $('mapDescription').textContent=cfg.description;
      const width=canvas.width||272,height=canvas.height||144;
      const size=mapSize(map),sx=width/size,sy=height/size;
      ctx.clearRect(0,0,width,height);
      const colors=terrain[cfg.theme||map]||terrain.verdant;
      for(let x=0;x<size;x++)for(let y=0;y<size;y++){
        const filled=this.water(x+.5,y+.5,map);
        ctx.fillStyle=filled?cfg.waterColor:colors[Math.floor(rand(x,y)*colors.length)];
        ctx.fillRect(x*sx,y*sy,Math.ceil(sx),Math.ceil(sy));
      }
      ctx.fillStyle='#d9b477';
      for(const [x,y] of cfg.ore){
        ctx.beginPath();ctx.arc(x*sx,y*sy,Math.max(2.3,sx*.65),0,Math.PI*2);ctx.fill();
      }
      for(const [x,y,color] of [[5,6,'#6fd8f0'],[size-6,size-7,'#fa8070']]){
        ctx.fillStyle='#041823';ctx.fillRect(x*sx-5,y*sy-5,10,10);
        ctx.fillStyle=color;ctx.fillRect(x*sx-3.5,y*sy-3.5,7,7);
      }
      ctx.strokeStyle='#7191a9';ctx.lineWidth=1;ctx.strokeRect(.5,.5,width-1,height-1);
    }
    newMatch(s){
      if(s.map==='custom'&&!MAPS.custom){this.notify('Open Map Forge and save a valid battlefield first');return false;}
      WORLD_SIZE=mapSize(s.map);
      this.keys.clear();this.resetTouch();this.settings={...s,startingCredits:Number(s.startingCredits)||5000};this.state='playing';this.time=0;this.nextAI=6;this.nextHarvesterResponseAt=0;this.unservedHarvesterShooterId=0;this.nextRadarResponseAt=0;this.nextUi=0;this.nextFog=0;this.nextId=1;
      this.entities=[];this.ores=[];this.particles=[];this.projectiles=[];this.queues=[];this.unitBuckets=null;this.buildingBuckets=null;this.sensorBuckets=null;this.fog=[];this.selected=[];this.groups={};this.attackMoveArmed=false;this.abilityArmedId=null;this.placing=null;this.tab='structures';
      this.players=[{faction:s.playerFaction,credits:this.settings.startingCredits},{faction:s.enemyFaction,credits:this.settings.startingCredits}];
      this.stats=[this.newStats(),this.newStats()];this.intel=[[],[]];this.aiExplored=new Set();this.reconAlerts=new Map();this.battleEvents=[];this.damageAlerts=new Map();this.nextBattleEventId=1;this.aiPlatoon=null;this.aiSupportPlatoon=null;this.aiAssaultProgress=new Map();this.aiAssaultReroutes=0;this.aiSiegeOrders=0;this.aiSiegeHits=0;this.aiRallyResumes=0;this.trafficYieldCount=0;this.laneReservations=new Map();
      this.camera={...this.camera,x:0,y:370,zoom:1.03};
      this.initMap();
      for(const side of [0,1]){
        const a=side===0?{x:5,y:6}:{x:WORLD_SIZE-6,y:WORLD_SIZE-7},sign=side===0?1:-1;
        this.add(side,'hq',a.x,a.y);
        this.add(side,'generator',a.x+3*sign,a.y);
        this.add(side,'refinery',a.x,a.y+3*sign);
        this.add(side,'barracks',a.x+3*sign,a.y+3*sign);
        this.add(side,'soldier',a.x+1*sign,a.y+5*sign);
        this.add(side,'soldier',a.x+2*sign,a.y+5*sign);
        this.add(side,'tank',a.x+4*sign,a.y+5*sign);
        const h=this.add(side,'harvester',a.x+2*sign,a.y+5*sign);h.order={type:'harvest'};
      }
      this.audio?.setScene('battle');this.updateFog();this.updateAISurvey();this.updateIntel(0);$('overlay').classList.add('hidden');this.updateUI(true);this.updateSaveButtons();this.notify('Command established. Construct a War Factory to build tanks.');this.audio?.announce('commandOnline');
    }
    initMap(){
      const oreSites=(MAPS[this.settings.map]||MAPS.verdant).ore;
      for(const [x,y] of oreSites){for(let i=0;i<8;i++){const ox=x+(rand(i,x,10)-.5)*3.3,oy=y+(rand(i,y,20)-.5)*3.3;if(this.water(ox,oy))continue;this.ores.push({x:ox,y:oy,amount:900+Math.floor(rand(i,x+y)*450),max:1350});}}
    }
    water(x,y,map=this.settings.map){
      const def=MAPS[map]||MAPS.verdant;
      if(def._waterSet)return def._waterSet.has(Math.floor(x)+','+Math.floor(y));
      if(Array.isArray(def.waterTiles))return def.waterTiles.some(([tx,ty])=>tx===Math.floor(x)&&ty===Math.floor(y));
      return (def.waterRects||[]).some(rect=>x>rect[0]&&x<rect[1]&&y>rect[2]&&y<rect[3]);
    }
    buildingAt(x,y){return this.entities.find(e=>e.type==='building'&&e.hp>0&&Math.abs(e.x-x)<1.7&&Math.abs(e.y-y)<1.7);}
    canPlace(x,y,side){
      if(x<2||y<2||x>WORLD_SIZE-3||y>WORLD_SIZE-3)return false;
      for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if(this.water(x+dx,y+dy))return false;
      for(const e of this.entities){if(e.hp>0&&e.type==='building'&&Math.abs(e.x-x)<2.7&&Math.abs(e.y-y)<2.7)return false;}
      return this.entities.some(e=>e.hp>0&&e.owner===side&&e.type==='building'&&e.built&&dist(e,{x,y})<8.2);
    }
    getDef(e){return BUILD[e.kind]||UNITS[e.kind];}
    veterancyRank(e){
      if(!e||e.type!=='unit'||e.kind==='harvester')return 0;
      const kills=Number.isInteger(e.kills)&&e.kills>=0?e.kills:0;
      return kills>=5?2:kills>=2?1:0;
    }
    veterancyName(e){return ['RECRUIT','VETERAN','ELITE'][this.veterancyRank(e)];}
    awardKill(source){
      if(!source||source.hp<=0)return;
      const before=this.veterancyRank(source);
      source.kills=Math.min(9999,(Number.isInteger(source.kills)&&source.kills>=0?source.kills:0)+1);
      const after=this.veterancyRank(source);
      if(after<=before)return;
      this.particles.push({x:source.x,y:source.y,life:1,color:'#f4cf78',type:'marker'});
      if(source.owner===0)this.notify(this.name(source)+' promoted: '+this.veterancyName(source));
      if(this.selected.includes(source.id))this.updateSelection();
    }
    stat(e,key){
      const base=this.getDef(e)[key]||0;
      const mods=FACTION_BALANCE[this.players[e.owner]?.faction]?.[e.kind];
      const rank=this.veterancyRank(e);
      const bonus=key==='damage'?[1,1.12,1.25][rank]:
        key==='speed'?[1,1.06,1.12][rank]:1;
      return base*(mods?.[key]??1)*bonus;
    }
    unitRadius(e){return e.kind==='soldier'||e.kind==='specialist'?.23:e.kind==='heavy'?.56:e.kind==='harvester'?.47:e.kind==='recon'?.33:e.kind==='aircraft'?.35:.39;}
    name(e){return NAMES[this.players[e.owner].faction][e.kind]||this.getDef(e).name;}
    count(side,kind){return this.entities.filter(e=>e.owner===side&&e.kind===kind&&e.hp>0&&e.built).length;}
    prereq(side,key){const def=BUILD[key]||UNITS[key];if(!def)return false;
      if(def.from&&!this.count(side,def.from))return false;
      return (def.requires||[]).every(k=>this.count(side,k)>0);
    }
    power(side){let make=0,use=0;for(const e of this.entities){if(e.owner!==side||e.type!=='building'||!e.built||e.hp<=0)continue;const n=BUILD[e.kind].power||0;if(n>0)make+=n;else use-=n;}return {make,use,low:use>make};}
    cancelCurrentMode(){
      if(this.state!=='playing'||!(this.placing||this.abilityArmedId||this.attackMoveArmed))return false;
      this.placing=null;this.abilityArmedId=null;this.attackMoveArmed=false;
      this.resetTouch();this.notify('Command cancelled');this.updateUI(true);
      return true;
    }
    chooseProduction(key){
      if(this.state!=='playing')return;
      const def=BUILD[key]||UNITS[key],side=0;
      if(!def||!this.prereq(side,key)){this.notify('Required technology or production building missing');return;}
      if(this.players[0].credits<def.cost){this.notify('Insufficient credits');return;}
      if(BUILD[key]){if(key==='hq')return;this.placing=key;this.notify('Choose a clear location near your base. Tap CANCEL or right-click to abort.');}
      else{if(this.queues.some(q=>q.side===0&&q.key===key)){this.notify('Already producing '+this.name({owner:0,kind:key}));return;}this.players[0].credits-=def.cost;this.stats[0].creditsSpent+=def.cost;this.queues.push({side:0,key,elapsed:0,total:Math.max(2,def.cost/250)});this.audio?.play('queue',{kind:key});this.notify('Training '+this.name({owner:0,kind:key}));}
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
      const key=this.placing,def=BUILD[key];
      if(!key)return this.notify('Invalid placement: keep structures near your base.');
      // A prerequisite can be sold or destroyed while the placement ghost is active.
      // Recheck before charging credits, and clear a now-impossible build order.
      if(!this.prereq(0,key)){
        this.placing=null;this.notify('Required technology or production building missing');
        this.updateUI(true);return;
      }
      if(!this.canPlace(x,y,0))return this.notify('Invalid placement: keep structures near your base.');
      if(this.players[0].credits<def.cost)return this.notify('Insufficient credits');
      this.players[0].credits-=def.cost;this.stats[0].creditsSpent+=def.cost;const e=this.add(0,key,Math.round(x),Math.round(y),false);e.buildTime=3.5+def.cost/650;
      this.placing=null;this.selected=[e.id];this.audio?.play('build');this.notify(this.name(e)+' construction started');this.updateUI(true);
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
    zoomAtClientPoint(clientX,clientY,factor){
      const oldZoom=this.camera.zoom,nextZoom=clamp(oldZoom*factor,.65,1.8);
      if(nextZoom===oldZoom)return;
      const bounds=this.canvas.getBoundingClientRect();
      const dx=clientX-bounds.left-this.w/2,dy=clientY-bounds.top-this.h/2;
      // Preserve the world point under the cursor, like touchscreen pinch.
      this.camera.x+=dx/oldZoom-dx/nextZoom;
      this.camera.y+=dy/oldZoom-dy/nextZoom;
      this.camera.zoom=nextZoom;
      this.clampCamera();
    }
    pointerPosition(e){
      const r=this.canvas.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;
      const wx=(x-this.w/2)/this.camera.zoom+this.camera.x,wy=(y-this.h/2)/this.camera.zoom+this.camera.y;
      return {x,y,gx:wx/TW+wy/TH,gy:wy/TH-wx/TW};
    }
    resetTouch(){
      this.mousePan=null;this.touchPointer=null;this.touchGesture=null;this.touchPoints?.clear();
      this.dragStart=null;this.dragEnd=null;
    }
    touchMidpoint(){
      const [a,b]=[...this.touchPoints.values()];
      return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:Math.hypot(a.x-b.x,a.y-b.y)};
    }
    rebaseTouchGesture(){
      if(this.touchPoints.size<2){this.touchGesture=null;return;}
      this.touchGesture=this.touchMidpoint();
      if(this.touchPointer)this.touchPointer.moved=true;
      this.dragStart=null;this.dragEnd=null;
    }
    pointerDown(e){
      if(this.state!=='playing')return;
      const p=this.pointerPosition(e);this.mouse={x:p.x,y:p.y,worldX:p.gx,worldY:p.gy};
      if(e.pointerType==='touch'){
        e.preventDefault();this.touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});
        this.canvas.setPointerCapture?.(e.pointerId);
        if(this.touchPoints.size===1){
          this.touchPointer={id:e.pointerId,startX:e.clientX,startY:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};
          this.dragStart=p;this.dragEnd=p;
        }else this.rebaseTouchGesture();
        return;
      }
      if(e.pointerType==='pen'){
        e.preventDefault();
        this.touchPointer={id:e.pointerId,startX:e.clientX,startY:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};
        this.dragStart=p;this.dragEnd=p;this.canvas.setPointerCapture?.(e.pointerId);return;
      }
      if(e.button===1||(e.button===0&&this.keys.has(' '))){
        e.preventDefault();this.mousePan={id:e.pointerId,lastX:e.clientX,lastY:e.clientY};
        this.dragStart=null;this.dragEnd=null;
        this.canvas.setPointerCapture?.(e.pointerId);return;
      }
      if(e.button===2){e.preventDefault();if(this.placing){this.placing=null;this.updateUI(true);}else this.command(p,e);return;}
      if(e.button!==0)return;
      this.dragStart=p;this.dragEnd=p;this.canvas.setPointerCapture?.(e.pointerId);
    }
    pointerMove(e){
      if(this.mousePan&&this.mousePan.id===e.pointerId){
        const pan=this.mousePan,zoom=this.camera.zoom;
        this.camera.x-=(e.clientX-pan.lastX)/zoom;
        this.camera.y-=(e.clientY-pan.lastY)/zoom;
        pan.lastX=e.clientX;pan.lastY=e.clientY;this.clampCamera();
        return;
      }
      if(e.pointerType==='touch'&&this.touchPoints.has(e.pointerId)){
        this.touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});
        if(this.touchPoints.size>=2){
          const current=this.touchMidpoint(),previous=this.touchGesture||current;
          const oldZoom=this.camera.zoom;
          const nextZoom=clamp(oldZoom*current.distance/Math.max(1,previous.distance),.65,1.8);
          // Keep the terrain beneath the previous midpoint under the new midpoint.
          const bounds=this.canvas.getBoundingClientRect();
          const oldX=previous.x-bounds.left-this.w/2,oldY=previous.y-bounds.top-this.h/2;
          const newX=current.x-bounds.left-this.w/2,newY=current.y-bounds.top-this.h/2;
          const anchorX=this.camera.x+oldX/oldZoom,anchorY=this.camera.y+oldY/oldZoom;
          this.camera.zoom=nextZoom;
          this.camera.x=anchorX-newX/nextZoom;this.camera.y=anchorY-newY/nextZoom;
          // Touch pan and pinch must obey the same world limits as mouse pan
          // and cursor-wheel zoom. Preserve the midpoint anchor away from edges.
          this.clampCamera();
          this.touchGesture=current;this.dragStart=null;this.dragEnd=null;
          return;
        }
      }
      const t=this.touchPointer;
      if(t&&t.id===e.pointerId){
        const dx=e.clientX-t.lastX,dy=e.clientY-t.lastY;
        if(Math.hypot(e.clientX-t.startX,e.clientY-t.startY)>10)t.moved=true;
        if(t.moved){
          this.camera.x-=dx/this.camera.zoom;this.camera.y-=dy/this.camera.zoom;
          this.clampCamera();
          this.dragStart=null;this.dragEnd=null;
        }
        t.lastX=e.clientX;t.lastY=e.clientY;
      }
      const p=this.pointerPosition(e);
      this.mouse={x:p.x,y:p.y,worldX:p.gx,worldY:p.gy};
      if(this.dragStart)this.dragEnd=p;
    }
    pointerCancel(e){
      if(this.mousePan?.id===e.pointerId){
        this.mousePan=null;this.dragStart=null;this.dragEnd=null;return;
      }
      if(this.touchPoints.has(e.pointerId)){
        this.touchPoints.delete(e.pointerId);
        if(this.touchPoints.size>=2)this.rebaseTouchGesture();
        else if(this.touchPoints.size===1){
          const [id,p]=this.touchPoints.entries().next().value;
          this.touchGesture=null;
          this.touchPointer={id,startX:p.x,startY:p.y,lastX:p.x,lastY:p.y,moved:true};
        }else this.resetTouch();
      }else if(this.touchPointer?.id===e.pointerId)this.resetTouch();
      this.dragStart=null;this.dragEnd=null;
    }
    pointerUp(e){
      if(this.mousePan?.id===e.pointerId){
        this.mousePan=null;this.dragStart=null;this.dragEnd=null;return;
      }
      if(this.state!=='playing')return;
      if(e.pointerType==='touch'){
        if(!this.touchPoints.has(e.pointerId))return;
        this.touchPoints.delete(e.pointerId);
        if(this.touchPoints.size>=2){this.rebaseTouchGesture();return;}
        if(this.touchPoints.size===1){
          const [id,p]=this.touchPoints.entries().next().value;
          this.touchGesture=null;
          this.touchPointer={id,startX:p.x,startY:p.y,lastX:p.x,lastY:p.y,moved:true};
          this.dragStart=null;this.dragEnd=null;return;
        }
        this.touchGesture=null;
      }
      const t=this.touchPointer;
      if(t&&t.id===e.pointerId){
        this.touchPointer=null;this.dragStart=null;this.dragEnd=null;
        if(t.moved)return;
        const p=this.pointerPosition(e);
        if(this.placing)this.placeBuilding(p.gx,p.gy);
        else{
          const hit=this.pick(p.gx,p.gy);
          if(hit&&hit.owner===0){this.selected=[hit.id];this.audio?.play('select',{kind:hit.kind,faction:this.players[0]?.faction});}
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
      else{const hit=this.pick(b.gx,b.gy);if(hit){if(e.shiftKey&&hit.owner===0)this.selected=[...new Set([...this.selected,hit.id])];else this.selected=[hit.id];if(hit.owner===0)this.audio?.play('select',{kind:hit.kind,faction:this.players[0]?.faction});}else this.selected=[];}
      this.updateSelection();
    }
    screen(x,y){const p=iso(x,y);return{x:this.w/2+(p.x-this.camera.x)*this.camera.zoom,y:this.h/2+(p.y-this.camera.y)*this.camera.zoom};}
    pick(x,y){let best=null,bd=Infinity;for(const e of this.entities){if(e.hp<=0||!this.playerCanSeeEntity(e))continue;const d=Math.hypot(x-e.x,y-e.y);const hit=e.type==='building'?1.75:1.07;if(d<hit&&d<bd){best=e;bd=d;}}return best;}
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
        // Restrict group destinations to terrain reachable from the squad's
        // current position; prevents assigning half a squad behind a lake.
        // Keep ground units on connected terrain while letting aircraft use
        // their independent flight layer, even in mixed selections.
        const groups=[chosen.filter(e=>e.kind!=='aircraft'),
          chosen.filter(e=>e.kind==='aircraft')];
        for(const group of groups){
          if(!group.length)continue;
          const airborne=group[0].kind==='aircraft';
          const origin={x:group.reduce((sum,e)=>sum+e.x,0)/group.length,
                        y:group.reduce((sum,e)=>sum+e.y,0)/group.length};
          const slots=this.formationSlots(p.gx,p.gy,group.length,origin,airborne);
          const remaining=group.slice();
          for(const slot of slots){
            let best=0;
            for(let i=1;i<remaining.length;i++)if(dist(remaining[i],slot)<dist(remaining[best],slot))best=i;
            const unit=remaining.splice(best,1)[0];
            if(!unit)break;
            unit.yieldOrder=null;unit.yieldRetryAt=0;unit.laneWaiting=null;
            unit.order={type:this.attackMoveArmed||event?.shiftKey?'attackMove':'move',x:slot.x,y:slot.y};
            unit.path=[];unit.pathTarget=null;unit.pathGoal=null;unit.pathRecheck=0;unit.trafficWait=0;unit.trafficRepath=false;
          }
          for(const unit of remaining){
            unit.order=null;unit.yieldOrder=null;unit.yieldRetryAt=0;unit.laneWaiting=null;unit.path=[];unit.pathTarget=null;unit.pathGoal=null;unit.trafficWait=0;unit.trafficRepath=false;
          }
        }
      }
      this.audio?.play(target?'attack':'move',{kind:chosen[0]?.kind,faction:this.players[0]?.faction});
      this.attackMoveArmed=false;
      this.particles.push({x:p.gx,y:p.gy,life:.65,color:target?'#ff7c7c':'#80dbee',type:'marker'});
      this.updateUI(true);
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
        this.notify('Chrono Jump: tap clear terrain within 6 tiles');
        this.updateUI(true);return true;
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
          (u.type==='unit'||u.kind==='turret'||u.kind==='beam'||u.kind==='flak'));
        for(const u of victims){
          if(faction==='federation'){
            const amount=u.type==='building'?25:38;
            const beforeHp=u.hp;u.hp-=amount;
            this.noteBuildingDamage(u,e.owner);
            if(this.stats[e.owner])this.stats[e.owner].damageDealt+=Math.min(amount,beforeHp);
            if(u.hp<=0){this.recordLoss(u,e.owner);this.awardKill(e);this.selected=this.selected.filter(id=>id!==u.id);
              this.particles.push({x:u.x,y:u.y,life:1,color:'#ffa95e',type:'boom'});}
          }else if(faction==='psionic'){
            u.stunnedUntil=Math.max(u.stunnedUntil||0,this.time+3.8);
          }
          this.particles.push({x:u.x,y:u.y,life:.4,color:ability.color,type:'hit'});
        }
        this.particles.push({x:e.x,y:e.y,life:.85,color:ability.color,type:'abilityPulse',radius:ability.range*26});
      }
      e.abilityReadyAt=this.time+ability.cooldown;
      if(e.owner===0||this.sideCanSee(0,e))this.audio?.play('ability');
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
        this.notify('Attack-move armed: tap a destination');
        this.updateUI(true);return true;
      }
      if(!['stop','guard','hold','aggressive'].includes(action))return false;
      this.attackMoveArmed=false;this.abilityArmedId=null;
      for(const e of units){
        e.yieldOrder=null;e.yieldRetryAt=0;e.laneWaiting=null;
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
    reachableTiles(origin){
      // Four/eight-way flood-fill runs once per group order, not every frame.
      // It enumerates only walkable cells connected to the selected army.
      const start={x:clamp(Math.round(origin.x),1,WORLD_SIZE-2),
                   y:clamp(Math.round(origin.y),1,WORLD_SIZE-2)};
      const walk=this.navigationWalk();
      const nearby=[];
      for(let radius=0;radius<7&&!nearby.length;radius++)for(let dx=-radius;dx<=radius;dx++)for(let dy=-radius;dy<=radius;dy++){
        const x=start.x+dx,y=start.y+dy;
        if(Math.max(Math.abs(dx),Math.abs(dy))===radius&&walk(x,y))nearby.push({x,y});
      }
      const cell=nearby[0];
      if(!cell)return new Set();
      const key=(x,y)=>x+','+y,seen=new Set([key(cell.x,cell.y)]),queue=[cell];
      const directions=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
      for(let i=0;i<queue.length;i++){
        const at=queue[i];
        for(const [dx,dy] of directions){
          const x=at.x+dx,y=at.y+dy,k=key(x,y);
          if(seen.has(k)||!walk(x,y))continue;
          if(dx&&dy&&(!walk(at.x+dx,at.y)||!walk(at.x,at.y+dy)))continue;
          seen.add(k);queue.push({x,y});
        }
      }
      return seen;
    }
    formationSlots(cx,cy,count,origin=null,airborne=false){
      const want=Math.max(0,Math.min(count,120)),center={
        x:clamp(Math.round(cx),1,WORLD_SIZE-2),y:clamp(Math.round(cy),1,WORLD_SIZE-2)
      };
      if(!want)return [];
      const connected=!airborne&&origin?this.reachableTiles(origin):null;
      const walk=airborne?null:this.navigationWalk();
      const usable=(x,y)=>airborne?
        x>=1&&y>=1&&x<=WORLD_SIZE-2&&y<=WORLD_SIZE-2:
        walk(x,y)&&(!connected||connected.has(x+','+y));
      const candidates=[];
      // Rings closest to the ordered destination first. Each cell is unique.
      for(let radius=0;radius<WORLD_SIZE&&candidates.length<want*4;radius++){
        for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
          if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;
          const x=center.x+dx,y=center.y+dy;
          if(usable(x,y))candidates.push({x,y});
        }
        if(candidates.length>=want*3&&radius>=2)break;
      }
      // A narrow island may contain fewer free tiles than selected troops.
      // Distinct slots avoid repeated orders to an impossible shared point.
      return candidates.slice(0,want);
    }
    entityById(id){return this.entities.find(e=>e.id===id&&e.hp>0);}
    nearest(source,predicate,range=Infinity){let result=null,best=range;for(const e of this.entities){if(e===source||e.hp<=0||!predicate(e))continue;const d=dist(source,e);if(d<best){best=d;result=e;}}return result;}
    navigationWalk(){
      // Build a compact building-footprint index once per synchronous path or
      // formation query. The previous tile cache still scanned every entity
      // once per distinct tile, which scales poorly on crowded XL maps.
      // Custom walkable implementations (tests/map tools) retain their rules.
      const standard=this.walkable===Game.prototype.walkable;
      // The grid is integer-valued in A* and formation searches. Numeric
      // tile keys avoid repeated "x,y" allocations during every path query.
      // Retain the original string key for fractional/out-of-grid callers so
      // custom walkability hooks preserve their exact cache semantics.
      const tileKey=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&
        x>=0&&y>=0&&x<WORLD_SIZE&&y<WORLD_SIZE?
        y*WORLD_SIZE+x:x+','+y;
      // Buildings cannot be added or destroyed during step()'s movement phase:
      // construction, projectiles and production run after it. Reuse the
      // immutable footprint across the many unit routes in that phase only.
      // Outside step(), every query still sees live building changes.
      const frame=this._movementNavCache;
      let blocked=standard?frame?.blocked:null;
      if(standard&&!blocked){
        blocked=new Set();
        for(const b of this.entities){
        if(b.hp<=0||b.type!=='building')continue;
        const minX=Math.max(1,Math.floor(b.x-1.5)+1);
        const maxX=Math.min(WORLD_SIZE-2,Math.ceil(b.x+1.5)-1);
        const minY=Math.max(1,Math.floor(b.y-1.5)+1);
        const maxY=Math.min(WORLD_SIZE-2,Math.ceil(b.y+1.5)-1);
        for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++)
          if(Math.abs(b.x-x)<1.5&&Math.abs(b.y-y)<1.5)
            blocked.add(tileKey(x,y));
        }
        if(frame)frame.blocked=blocked;
      }
      // Tile and water decisions remain per-query; only building footprints
      // are shared, so terrain changes and custom hooks never go stale.
      const passable=new Map();
      return (x,y)=>{
        const k=tileKey(x,y);
        if(!passable.has(k))passable.set(k,standard?
          x>=1&&y>=1&&x<=WORLD_SIZE-2&&y<=WORLD_SIZE-2&&
            !this.water(x,y)&&!blocked.has(k):
          this.walkable(x,y));
        return passable.get(k);
      };
    }
    walkable(x,y){
      if(x<1||y<1||x>WORLD_SIZE-2||y>WORLD_SIZE-2||this.water(x,y))return false;
      const buildings=this.buildingBuckets?.nearby(x,y)||this.entities;
      return !buildings.some(b=>b.hp>0&&b.type==='building'&&Math.abs(b.x-x)<1.5&&Math.abs(b.y-y)<1.5);
    }
    trafficCosts(except){
      // Create a coarse, per-request heat map only when a moving unit is
      // genuinely stuck. Other units remain traversable but expensive.
      // A* probes only legal integer tiles. Pack those keys to match its
      // node identifiers; preserve legacy string identity for edge/outside
      // cells so the heat map never aliases two different coordinates.
      const heat=new Map(),key=(x,y)=>x>=1&&y>=1&&
        x<=WORLD_SIZE-2&&y<=WORLD_SIZE-2?
        y*WORLD_SIZE+x:x+','+y;
      for(const other of this.entities){
        if(other===except||other.hp<=0||other.type!=='unit'||
          other.kind==='aircraft')continue;
        const radius=this.unitRadius(other)+this.unitRadius(except);
        const cx=Math.round(other.x),cy=Math.round(other.y);
        for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
          const x=cx+dx,y=cy+dy,d=Math.hypot(x-other.x,y-other.y);
          if(d>radius+1.05)continue;
          const penalty=d<radius+.14?7:d<radius+.65?2.6:.5;
          const k=key(x,y);
          heat.set(k,Math.min(18,(heat.get(k)||0)+penalty));
        }
      }
      return heat;
    }
    directOctilePath(start,goal,walk){
      // Diagonal-first, straight-first, interleaved and centered corridors
      // all have exact unobstructed octile cost. Try alternatives only after
      // the preceding corridor fails; never bypass diagonal corner checks.
      const spanX=Math.abs(goal.x-start.x),spanY=Math.abs(goal.y-start.y);
      const major=Math.max(spanX,spanY),diagonals=Math.min(spanX,spanY);
      const trace=mode=>{
        const route=[];
        let x=start.x,y=start.y,step=0;
        while(x!==goal.x||y!==goal.y){
          let dx=Math.sign(goal.x-x),dy=Math.sign(goal.y-y);
          if(mode===1&&dx&&dy){
            if(Math.abs(goal.x-x)>Math.abs(goal.y-y))dy=0;
            else if(Math.abs(goal.y-y)>Math.abs(goal.x-x))dx=0;
          }else if(mode===2&&dx&&dy&&
            Math.floor((step+1)*diagonals/major)===Math.floor(step*diagonals/major)){
            // Interleave diagonal and straight steps across the corridor.
            if(spanX>spanY)dy=0;else dx=0;
          }else if(mode===3&&dx&&dy&&
            step<Math.floor((major-diagonals)/2)){
            // A centered diagonal band: half the straight-only steps first,
            // then diagonals, then the rest. Still exact-cost octile routing.
            if(spanX>spanY)dy=0;else dx=0;
          }
          const nx=x+dx,ny=y+dy;
          if(!walk(nx,ny)||(dx&&dy&&(!walk(nx,y)||!walk(x,ny))))return null;
          route.push({x:nx,y:ny});
          x=nx;y=ny;step++;
        }
        return route;
      };
      const direct=trace(0);
      if(direct)return direct;
      // Additional exact-cost corridors can avoid local obstacles without
      // invoking A*. Every step, including diagonal shoulders, is checked.
      return spanX&&spanY&&spanX!==spanY?
        (trace(1)||trace(2)||trace(3)):null;
    }
    findPath(sx,sy,tx,ty,avoidUnit=null,extraCost=null,useOctile=false,allowDirect=false){
      // A* uses a binary minimum heap to avoid repeatedly scanning a large
      // open list. During congestion replans it also prices nearby unit traffic.
      const start={x:clamp(Math.round(sx),1,WORLD_SIZE-2),y:clamp(Math.round(sy),1,WORLD_SIZE-2)};
      const goal={x:clamp(Math.round(tx),1,WORLD_SIZE-2),y:clamp(Math.round(ty),1,WORLD_SIZE-2)};
      // A* visits only in-bounds grid cells. Packed numeric keys avoid allocating
      // thousands of coordinate strings per large-army path query.
      const key=(x,y)=>y*WORLD_SIZE+x,begin=key(start.x,start.y),finish=key(goal.x,goal.y);
      const walk=this.navigationWalk();
      // Only ordinary unweighted ground move orders opt into a direct
      // exact-cost corridor. AI ordinary movers may use it without changing
      // their Euclidean A* heuristic if blocked. Harvesters, recon, combat,
      // traffic-priced recovery and hazard-weighted queries keep A* intact.
      if((useOctile||allowDirect)&&!avoidUnit&&!extraCost){
        const direct=this.directOctilePath(start,goal,walk);
        if(direct)return direct;
      }
      const open=[],push=node=>{
        open.push(node);let i=open.length-1;
        while(i>0){
          const parent=(i-1)>>1;
          if(open[parent].f<=node.f)break;
          open[i]=open[parent];i=parent;
        }
        open[i]=node;
      };
      const pop=()=>{
        const first=open[0],last=open.pop();
        if(open.length){
          let i=0;
          while(i*2+1<open.length){
            let child=i*2+1;
            if(child+1<open.length&&open[child+1].f<open[child].f)child++;
            if(open[child].f>=last.f)break;
            open[i]=open[child];i=child;
          }
          open[i]=last;
        }
        return first;
      };
      push({...start,key:begin,f:0});
      const costs=new Map([[begin,0]]),came=new Map(),closed=new Set();
      const traffic=avoidUnit?this.trafficCosts(avoidUnit):null;
      const moves=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
      // Opt-in only for ordinary player move orders: changing enemy AI routes
      // lowered Ashen Basin ore income in the broad experiment (PR #97).
      // Octile distance is the exact obstacle-free lower bound for our
      // eight-way grid (orthogonal cost 1, diagonal cost sqrt(2)). Unlike
      // Euclidean distance it stays admissible while expanding fewer tiles
      // on long mixed-axis routes; congestion/hazard costs are nonnegative.
      const heuristic=(x,y)=>{
        const dx=Math.abs(goal.x-x),dy=Math.abs(goal.y-y);
        return Math.max(dx,dy)+(Math.SQRT2-1)*Math.min(dx,dy);
      };
      let nearest=begin,nearestDist=Math.hypot(start.x-tx,start.y-ty),nearestCost=0;
      const trace=(end)=>{
        const path=[];let k=end;
        while(k!==begin&&came.has(k)){
          const x=k%WORLD_SIZE,y=Math.floor(k/WORLD_SIZE);
          path.push({x,y});k=came.get(k);
        }
        path.reverse();return path;
      };
      // Count unique expanded tiles, not stale heap entries. The old fixed
      // 1450-pop limit truncated valid routes on the 48x48 Expanse map.
      // At most WORLD_SIZE² distinct cells can be closed, so this also bounds
      // work on unreachable destinations without weakening corner rules.
      let expansions=0;
      const maxExpansions=WORLD_SIZE*WORLD_SIZE;
      while(open.length&&expansions<maxExpansions){
        const node=pop();
        if(closed.has(node.key))continue;
        closed.add(node.key);
        expansions++;
        const remaining=Math.hypot(node.x-tx,node.y-ty),travelled=costs.get(node.key);
        if(remaining<nearestDist-.001||(Math.abs(remaining-nearestDist)<.001&&travelled<nearestCost)){
          nearest=node.key;nearestDist=remaining;nearestCost=travelled;
        }
        if(node.key===finish)return trace(finish);
        for(const [dx,dy] of moves){
          const x=node.x+dx,y=node.y+dy,k=key(x,y);
          if(closed.has(k)||!walk(x,y))continue;
          if(dx&&dy&&(!walk(node.x+dx,node.y)||!walk(node.x,node.y+dy)))continue;
          const hazard=extraCost?Math.max(0,Number(extraCost({x,y}))||0):0;
          // Congestion heat is independently keyed by coordinate strings;
          // only A*'s internal node bookkeeping uses packed integer keys.
          const step=(dx&&dy?Math.SQRT2:1)+(traffic?.get(k)||0)+hazard;
          const candidate=travelled+step;
          if(candidate>=(costs.get(k)??Infinity))continue;
          costs.set(k,candidate);came.set(k,node.key);
          push({x,y,key:k,f:candidate+(useOctile?heuristic(x,y):Math.hypot(goal.x-x,goal.y-y))});
        }
      }
      return trace(nearest);
    }
    canOccupyUnit(e,x,y,ignoreUnits=false){
      // Aircraft operate in their own altitude layer, cross water, and do not block ground traffic.
      if(e.kind==='aircraft')return x>=.8&&y>=.8&&x<=WORLD_SIZE-.8&&y<=WORLD_SIZE-.8;
      const r=this.unitRadius(e);
      if(x<.8||y<.8||x>WORLD_SIZE-.8||y>WORLD_SIZE-.8||this.water(x,y))return false;
      // During a simulation tick, only inspect buildings near this unit.
      // Outside the tick, use live entities so editor/tests and new orders
      // observe changes immediately without retaining a stale spatial index.
      const buildings=this.buildingBuckets?.nearby(x,y)||this.entities;
      for(const b of buildings){
        if(b.hp<=0||b.id===e.id||b.type!=='building')continue;
        if(Math.abs(b.x-x)<1.27+r*.14&&Math.abs(b.y-y)<1.27+r*.14)return false;
      }
      if(!ignoreUnits){
        const nearby=this.unitBuckets?.nearby(x,y)||
          this.entities.filter(unit=>unit.type==='unit');
        for(const b of nearby){
          if(b.hp<=0||b.id===e.id||b.type!=='unit'||b.kind==='aircraft')continue;
          const margin=r+this.unitRadius(b);
          if((b.x-x)**2+(b.y-y)**2<margin*margin*.84)return false;
        }
      }
      return true;
    }
    setUnitPosition(e,x,y){
      if(this.unitBuckets)this.unitBuckets.move(e,x,y);
      else {e.x=x;e.y=y;}
      this.sensorBuckets?.[e.owner]?.move(e,x,y);
    }
    separateUnits(){
      // Only investigate adjacent spatial buckets, even in 100+ unit battles.
      // Reindex once per pass, including movements from the first pass.
      const ownGrid=!this.unitBuckets;
      if(ownGrid)this.unitBuckets=new UnitBuckets().rebuild(this.entities);
      for(let pass=0;pass<2;pass++){
        if(pass)this.unitBuckets.rebuild(this.entities);
        const units=this.entities.filter(e=>e.type==='unit'&&e.hp>0).sort((a,b)=>a.id-b.id);
        for(const a of units)for(const b of this.unitBuckets.nearby(a.x,a.y)){
          if(b.id<=a.id||b.hp<=0||b.type!=='unit'||a.kind==='aircraft'||b.kind==='aircraft')continue;
          const minimum=(this.unitRadius(a)+this.unitRadius(b))*.95;
          let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
          if(d>=minimum)continue;
          if(d<.001){
            const angle=((a.id*13+b.id*7)%360)*Math.PI/180;
            dx=Math.cos(angle);dy=Math.sin(angle);d=1;
          }
          const push=Math.min(.36,(minimum-d)*.5),ux=dx/d,uy=dy/d;
          const ax=a.x-ux*push,ay=a.y-uy*push,bx=b.x+ux*push,by=b.y+uy*push;
          const okA=this.canOccupyUnit(a,ax,ay,true),okB=this.canOccupyUnit(b,bx,by,true);
          if(okA)this.setUnitPosition(a,ax,ay);
          if(okB)this.setUnitPosition(b,bx,by);
        }
      }
      if(ownGrid)this.unitBuckets=null;
    }
    narrowLaneAt(x,y){
      // A lane has one walkable tile width, with walls or water on both
      // shoulders. Only straight corridors of two or more cells are reserved.
      const ix=Math.round(x),iy=Math.round(y);
      if(!this.walkable(ix,iy))return null;
      const h=!this.walkable(ix,iy-1)&&!this.walkable(ix,iy+1);
      const v=!this.walkable(ix-1,iy)&&!this.walkable(ix+1,iy);
      if(h===v)return null;
      const axis=h?'h':'v',coord=h?iy:ix,index=h?ix:iy;
      const narrow=n=>h?
        this.walkable(n,coord)&&!this.walkable(n,coord-1)&&!this.walkable(n,coord+1):
        this.walkable(coord,n)&&!this.walkable(coord-1,n)&&!this.walkable(coord+1,n);
      let low=index,high=index;
      while(low>1&&index-low<15&&narrow(low-1))low--;
      while(high<WORLD_SIZE-2&&high-index<15&&narrow(high+1))high++;
      if(high-low<1)return null;
      return {id:axis+':'+coord+':'+low+':'+high,axis,coord,low,high};
    }
    laneOccupied(lane){
      return this.entities.some(u=>u.hp>0&&u.type==='unit'&&u.lanePass?.id===lane.id&&
        (lane.axis==='h'?u.x>=lane.low-.65&&u.x<=lane.high+.65&&Math.abs(u.y-lane.coord)<.75:
          u.y>=lane.low-.65&&u.y<=lane.high+.65&&Math.abs(u.x-lane.coord)<.75));
    }
    checkLaneEntry(unit,x,y){
      if(!this.laneReservations)this.laneReservations=new Map();
      const lane=this.narrowLaneAt(x,y);
      if(!lane||unit.type!=='unit')return true;
      const inside=this.narrowLaneAt(unit.x,unit.y)?.id===lane.id;
      if(inside&&unit.lanePass?.id===lane.id)return true;
      const dir=Math.sign(lane.axis==='h'?x-unit.x:y-unit.y);
      if(!dir)return true;
      let state=this.laneReservations.get(lane.id);
      if(!state){
        state={dir,admitted:0,waiting:[],lastActive:this.time};
        this.laneReservations.set(lane.id,state);
      }
      state.waiting=state.waiting.filter(w=>
        this.entities.some(u=>u.id===w.id&&u.hp>0&&u.type==='unit'&&u.laneWaiting===lane.id));
      const occupied=this.laneOccupied(lane);
      if(!occupied&&state.waiting.length){
        state.dir=state.waiting[0].dir;state.admitted=0;
      }else if(!occupied&&this.time-state.lastActive>2){
        state.dir=dir;state.admitted=0;
      }
      const oppositeQueued=state.waiting.some(w=>w.dir!==state.dir);
      const canEnter=dir===state.dir&&!(oppositeQueued&&state.admitted>=3);
      if(!canEnter){
        if(!state.waiting.some(w=>w.id===unit.id))
          state.waiting.push({id:unit.id,dir,at:this.time});
        unit.laneWaiting=lane.id;
        return false;
      }
      state.waiting=state.waiting.filter(w=>w.id!==unit.id);
      unit.laneWaiting=null;
      unit.lanePass={id:lane.id,dir};
      state.admitted++;state.lastActive=this.time;
      return true;
    }
    advanceLaneReservations(){
      if(!this.laneReservations)return;
      for(const e of this.entities){
        if(!e.lanePass)continue;
        if(this.narrowLaneAt(e.x,e.y)?.id!==e.lanePass.id)e.lanePass=null;
      }
      for(const [id,state] of this.laneReservations){
        state.waiting=state.waiting.filter(w=>{
          const unit=this.entities.find(e=>e.id===w.id&&e.hp>0&&e.type==='unit');
          return !!unit&&unit.laneWaiting===id;
        });
        const occupied=this.entities.some(e=>e.hp>0&&e.lanePass?.id===id);
        if(!occupied&&state.waiting.length){
          state.dir=state.waiting[0].dir;state.admitted=0;
          state.lastActive=this.time;
        }else if(!occupied&&this.time-state.lastActive>3){
          this.laneReservations.delete(id);
        }
      }
    }
    trafficPriority(e){
      // The loaded harvester keeps right of way to prevent resource starvation.
      // Explicit Hold-position units never voluntarily yield.
      if(e.kind==='harvester')return e.load>0?320:240;
      return ({heavy:210,tank:175,recon:150,specialist:130,soldier:115})[e.kind]||100;
    }
    startTrafficYield(unit,approacher,dx,dy){
      if(unit.hp<=0||unit.type!=='unit'||unit.stance==='hold'||
          unit.yieldOrder||(unit.yieldRetryAt||0)>this.time||
          (unit.stunnedUntil||0)>this.time)return false;
      const d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
      // Check both shoulders before retreating. A pocket must be reachable
      // and remain clear of the approaching unit.
      // A yield must clear the lane laterally. Moving forward or backward
      // along a one-cell corridor is not a passing pocket.
      const offsets=[[-uy,ux],[uy,-ux],
        [-uy*.86-ux*.5,ux*.86-uy*.5],
        [uy*.86-ux*.5,-ux*.86-uy*.5]];
      let best=null,bestScore=Infinity;
      for(const scale of [1.15,1.75,2.35]){
        for(let i=0;i<offsets.length;i++){
          const [sx,sy]=offsets[i],x=unit.x+sx*scale,y=unit.y+sy*scale;
          if(!this.canOccupyUnit(unit,x,y))continue;
          const route=this.findPath(unit.x,unit.y,x,y);
          const final=route.at(-1);
          if(!final||Math.hypot(final.x-x,final.y-y)>.85)continue;
          const first=route[0];
          // Don't ask a unit to pass through another unit on its first step.
          if(first&&!this.canOccupyUnit(unit,
              unit.x+(first.x-unit.x)*.2,unit.y+(first.y-unit.y)*.2))continue;
          const nearest= this.unitBuckets?.nearby(x,y)||this.entities.filter(e=>e.type==='unit');
          const clearance=nearest.reduce((m,other)=>other.id===unit.id?m:
            Math.min(m,Math.hypot(other.x-x,other.y-y)),5);
          const score=route.length+scale*.35+(i>=2?3:0)+(2.7-clearance)*.15;
          if(score<bestScore){bestScore=score;best={x,y};}
        }
        if(best)break;
      }
      if(!best)return false;
      unit.yieldOrder={x:best.x,y:best.y,expires:this.time+4};
      unit.yieldRetryAt=this.time+2;
      unit.path=[];unit.pathTarget=null;unit.pathGoal=null;
      unit.pathRecheck=0;unit.trafficWait=0;unit.trafficRepath=false;
      this.trafficYieldCount=(this.trafficYieldCount||0)+1;
      return true;
    }
    tryTrafficYield(unit,dx,dy){
      if(unit.yieldOrder||(unit.yieldRetryAt||0)>this.time)return false;
      const length=Math.hypot(dx,dy)||1,vx=dx/length,vy=dy/length;
      const nearby=this.unitBuckets?.nearby(unit.x+vx*.55,unit.y+vy*.55)||
        this.entities.filter(e=>e.type==='unit');
      const blocker=nearby.filter(other=>other.hp>0&&other.owner===unit.owner&&
        other.id!==unit.id&&other.type==='unit'&&
        (other.x-unit.x)*vx+(other.y-unit.y)*vy>0&&
        Math.hypot(other.x-unit.x,other.y-unit.y)<
          this.unitRadius(unit)+this.unitRadius(other)+.75)
        .sort((a,b)=>Math.hypot(a.x-unit.x,a.y-unit.y)-
          Math.hypot(b.x-unit.x,b.y-unit.y))[0];
      if(!blocker)return false;
      const mine=this.trafficPriority(unit),theirs=this.trafficPriority(blocker);
      const higher=mine>theirs||(mine===theirs&&unit.id<blocker.id);
      // Only friendly units coordinate; enemies never yield to an attack.
      // A lower-priority mover can take the side pocket itself. A loaded
      // harvester may also detour around a friendly Hold sentry, which cannot
      // voluntarily yield. Ordinary moving traffic retains the original
      // priority behavior: broad fallback detours harmed ore deliveries.
      // Both attempts use the existing collision-checked lateral pockets.
      if(!higher)return this.startTrafficYield(unit,blocker,vx,vy);
      if(this.startTrafficYield(blocker,unit,vx,vy))return true;
      return unit.kind==='harvester'&&unit.load>=360&&blocker.stance==='hold'?
        this.startTrafficYield(unit,blocker,vx,vy):false;
    }
    finishYield(e){
      e.yieldOrder=null;e.yieldRetryAt=this.time+1.35;
      e.path=[];e.pathTarget=null;e.pathGoal=null;
      e.pathRecheck=0;e.trafficWait=0;e.trafficRepath=false;
    }
    move(e,tx,ty,dt){
      // Aircraft move directly through the air instead of consuming ground A* paths.
      if(e.kind==='aircraft'){
        const dx=tx-e.x,dy=ty-e.y,len=Math.hypot(dx,dy);
        if(len<.24)return true;
        const speed=this.stat(e,'speed'),step=Math.min(speed*dt,len);
        const nx=clamp(e.x+dx/len*step,.8,WORLD_SIZE-.8);
        const ny=clamp(e.y+dy/len*step,.8,WORLD_SIZE-.8);
        this.setUnitPosition(e,nx,ny);
        e.desiredHeading=Math.atan2(dy,dx);
        if(!e.engaging)e.desiredTurretHeading=e.desiredHeading;
        return Math.hypot(tx-e.x,ty-e.y)<.24;
      }
      let d=Math.hypot(tx-e.x,ty-e.y);
      if(d<.24){e.path=[];e.pathGoal=null;e.trafficWait=0;e.trafficRepath=false;return true;}
      const old=e.pathTarget;
      if(!old||!e.path||Math.hypot(old.x-tx,old.y-ty)>1.2||e.pathRecheck<=0){
        const scoutPatrol=e.owner===1&&e.kind==='recon'&&e.order?.type==='move';
        // Follow the same safe route chosen by patrol planning, including
        // emergency escape orders issued during retreat cooldowns.
        e.path=scoutPatrol?
          (this.scoutPath(e,{x:tx,y:ty},new Map(),e.trafficRepath?e:null)?.path||[]):
          this.findPath(e.x,e.y,tx,ty,e.trafficRepath?e:null,null,
            e.owner===0&&e.order?.type==='move'&&
            e.kind!=='harvester'&&e.kind!=='recon'&&!e.trafficRepath,
            e.owner===1&&e.order?.type==='move'&&
            e.kind!=='harvester'&&e.kind!=='recon'&&!e.trafficRepath);
        // Routine new move orders need an immediate first A* route, but
        // identical 1.6s refresh timers synchronize large formations. Spread
        // only the *first* non-urgent refresh by stable unit ID; subsequent
        // refreshes retain the existing 1.6s cadence. Traffic recovery,
        // changed destinations, AI orders, harvesters, recon and combat keep
        // their original prompt routing and timers. No new saved state is needed.
        const staggerRoutine=!old&&e.owner===0&&e.order?.type==='move'&&
          e.kind!=='harvester'&&e.kind!=='recon'&&!e.trafficRepath;
        e.trafficRepath=false;
        e.pathTarget={x:tx,y:ty};e.pathGoal=e.path.length?e.path[e.path.length-1]:null;
        e.pathRecheck=1.6+(staggerRoutine?(e.id%4)*.2:0);
      }
      e.pathRecheck-=dt;
      while(e.path?.length&&Math.hypot(e.x-e.path[0].x,e.y-e.path[0].y)<.37)e.path.shift();
      const point=e.path?.[0];
      if(!point){
        // Don't silently 'complete' impossible orders merely because the target
        // is blocked. We complete only at an actual reachable terminal waypoint.
        if(!e.pathGoal)return d<.36;
        return Math.hypot(e.x-e.pathGoal.x,e.y-e.pathGoal.y)<.5;
      }
      const dx=point.x-e.x,dy=point.y-e.y,len=Math.hypot(dx,dy);
      if(len<.001)return false;
      const beforeProgress=len;
      const move=Math.min(this.stat(e,'speed')*dt,len),vx=dx/len*move,vy=dy/len*move;
      const clear=(x,y)=>this.canOccupyUnit(e,x,y)&&this.checkLaneEntry(e,x,y);
      if(clear(e.x+vx,e.y+vy)){this.setUnitPosition(e,e.x+vx,e.y+vy);e.stuck=0;}
      // Only full-cargo harvesters skip zero-length axis fallbacks. A broad
      // all-unit change altered contested-match combat and damaged the AI
      // economy; retain legacy movement for other units.
      else if((Math.abs(vx)>1e-6||e.kind!=='harvester'||e.load<360)&&
          clear(e.x+vx,e.y)){
        this.setUnitPosition(e,e.x+vx,e.y);e.stuck=0;
      }
      else if((Math.abs(vy)>1e-6||e.kind!=='harvester'||e.load<360)&&
          clear(e.x,e.y+vy)){
        this.setUnitPosition(e,e.x,e.y+vy);e.stuck=0;
      }
      else {
        // Symmetric short sidesteps avoid simple head-on jams. No teleporting.
        const sign=e.id%2===0?1:-1;
        const sidestep=[[-vy*sign,vx*sign],[vy*sign,-vx*sign]];
        let moved=false;
        for(const [sx,sy] of sidestep)if(clear(e.x+sx,e.y+sy)){
          this.setUnitPosition(e,e.x+sx,e.y+sy);e.stuck=0;moved=true;break;
        }
        if(!moved){e.stuck=(e.stuck||0)+dt;if(e.stuck>.7){e.pathRecheck=0;e.stuck=0;}}
      }
      // A sideways step can be legal yet accomplish no forward progress.
      // Accumulate genuine waypoint stalls, then use a traffic-priced A*.
      const progress=beforeProgress-Math.hypot(point.x-e.x,point.y-e.y);
      e.trafficWait=progress>.008?Math.max(0,(e.trafficWait||0)-dt*2):(e.trafficWait||0)+dt;
      if(e.trafficWait>.25&&!e.yieldOrder){
        if(this.tryTrafficYield(e,dx,dy))e.trafficWait=0;
      }
      if(e.trafficWait>.65){
        e.trafficWait=0;e.trafficRepath=true;e.pathRecheck=0;
      }
      e.heading=Math.atan2(dy*TH,dx*TW);
      e.desiredHeading=Math.atan2(dy,dx);
      if(e.type==='unit'&&!e.engaging)e.desiredTurretHeading=e.desiredHeading;
      d=Math.hypot(tx-e.x,ty-e.y);
      return d<.24;
    }
    airReturnExposure(side,from,to){
      // Navigation uses only this faction's timestamped sensor reports.
      const reports=(this.intel?.[side]||[]).filter(r=>
        r.type==='building'&&['turret','beam','flak'].includes(r.kind)&&
        Number.isFinite(r.x)&&Number.isFinite(r.y)&&Number.isFinite(r.time)&&
        this.time>=r.time&&this.time-r.time<=180);
      if(!reports.length)return 0;
      const length=dist(from,to),samples=Math.max(2,Math.ceil(length));
      let exposure=0;
      for(let i=1;i<=samples;i++){
        const t=i/samples,point={x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t};
        for(const report of reports){
          const reach=report.kind==='flak'?8.3:report.kind==='beam'?7.4:6,gap=dist(point,report);
          if(gap<reach)exposure+=1+(reach-gap)/reach;
        }
      }
      return exposure/samples;
    }
    airReturnDetour(plane,pad){
      const length=dist(plane,pad);
      if(length<4)return null;
      const direct=this.airReturnExposure(plane.owner,plane,pad);
      if(direct<.16)return null;
      const vx=(pad.x-plane.x)/length,vy=(pad.y-plane.y)/length;
      const midpoint={x:(plane.x+pad.x)/2,y:(plane.y+pad.y)/2};
      let best=null,bestScore=Infinity;
      // Bounded lateral candidates, no ground pathfinding for aircraft.
      for(const offset of [5,8,11,14])for(const sign of [-1,1]){
        const point={x:clamp(midpoint.x-vy*offset*sign,1,WORLD_SIZE-1),
          y:clamp(midpoint.y+vx*offset*sign,1,WORLD_SIZE-1)};
        const first=dist(plane,point),second=dist(point,pad),total=first+second;
        if(first<2||second<2||total>length*1.85)continue;
        const exposure=(this.airReturnExposure(plane.owner,plane,point)*first+
          this.airReturnExposure(plane.owner,point,pad)*second)/total;
        const score=exposure+Math.max(0,total-length)*.012;
        if(exposure<direct*.65&&score<bestScore){
          best={x:point.x,y:point.y,padId:pad.id};bestScore=score;
        }
      }
      return best;
    }
    chooseAirfield(plane){
      // Threats come exclusively from this side's timestamped sensor reports.
      // This selection runs at sortie start or after a pad is destroyed.
      let best=null,bestScore=Infinity;
      for(const pad of this.entities){
        if(pad.owner!==plane.owner||pad.kind!=='airfield'||!pad.built||pad.hp<=0)continue;
        const flight=dist(plane,pad);
        const score=flight+Math.min(20,this.airReturnExposure(plane.owner,plane,pad)*5);
        if(score<bestScore-1e-6||
           (Math.abs(score-bestScore)<=1e-6&&pad.id<(best?.id??Infinity))){
          best=pad;bestScore=score;
        }
      }
      return best;
    }
    serviceAircraft(e,dt){
      if(e.kind!=='aircraft')return false;
      const capacity=UNITS.aircraft.ammo;
      // Historical saves predate ammunition. Treat missing values as a full load.
      e.ammo=Number.isFinite(e.ammo)?clamp(Math.floor(e.ammo),0,capacity):capacity;
      // Only the AI may proactively withdraw a critically damaged, armed plane.
      // The decision uses its own hull and friendly airfields, not enemy fog data.
      const critical=e.owner===1&&e.hp>0&&e.hp/e.maxHp<=.30&&
        (e.retreatCooldownAt||0)<=this.time;
      // After a prolonged outage, avoid sending the plane back to the same
      // unpowered pad every frame. A restored power grid cancels this holdoff.
      if(!e.rearming&&this.power(e.owner).low&&
         Number.isFinite(e.rearmRetryAt)&&e.rearmRetryAt>this.time)return false;
      if(e.ammo>=capacity&&!e.rearming&&!critical)return false;
      if(e.ammo>0&&!e.rearming&&!critical)return false;
      // Keep a stable airfield assignment during the flight to avoid
      // bouncing between pads as the aircraft changes position.
      if(!e.rearming)e.rearmPadId=null;
      const validPad=b=>b&&b.owner===e.owner&&b.kind==='airfield'&&b.built&&b.hp>0;
      let pad=this.entities.find(b=>b.id===e.rearmPadId&&validPad(b));
      if(!pad){
        pad=this.chooseAirfield(e);
        if(e.rearming&&e.rearmPadId!==pad?.id){
          e.rearmDetour=null;e.rearmDetourDoneFor=null;
        }
        e.rearmPadId=pad?.id??null;
      }
      if(!pad){
        // Losing the airfield must not permanently immobilize an aircraft.
        if(e.rearming){
          e.rearming=false;e.order=e.rearmResume||null;e.rearmResume=null;e.rearmProgress=0;
          if(e.repairRetreat)e.retreatCooldownAt=this.time+40;
        }
        e.repairRetreat=false;
        e.rearmPowerOutage=0;
        e.rearmDetour=null;e.rearmDetourDoneFor=null;e.rearmPadId=null;
        return false;
      }
      if(!e.rearming){
        e.rearming=true;
        e.repairRetreat=critical;
        e.rearmResume=e.order?{...e.order}:null;
        e.rearmProgress=0;
        e.rearmPowerOutage=0;e.rearmRetryAt=0;
        e.rearmDetour=null;e.rearmDetourDoneFor=null;
        e.order=null;
      }
      if(e.rearmDetour?.padId!==pad.id||
         (e.rearmDetour&&(!Number.isFinite(e.rearmDetour.x)||!Number.isFinite(e.rearmDetour.y))))
        e.rearmDetour=null;
      if(dist(e,pad)>1.7){
        if(!e.rearmDetour&&e.rearmDetourDoneFor!==pad.id)
          e.rearmDetour=this.airReturnDetour(e,pad);
        if(e.rearmDetour){
          if(dist(e,e.rearmDetour)>.55){
            this.move(e,e.rearmDetour.x,e.rearmDetour.y,dt);
            return true;
          }
          e.rearmDetour=null;e.rearmDetourDoneFor=pad.id;
        }
        this.move(e,pad.x,pad.y,dt);
        return true;
      }
      // Count outages only after arrival. A plane in flight is not trapped.
      // Long outages release its previous mission and postpone another visit.
      if(this.power(e.owner).low){
        e.rearmPowerOutage=(Number.isFinite(e.rearmPowerOutage)&&e.rearmPowerOutage>=0?
          e.rearmPowerOutage:0)+dt;
        if(e.rearmPowerOutage>=15){
          e.rearming=false;
          e.order=e.rearmResume||null;e.rearmResume=null;
          e.rearmProgress=0;
          e.rearmDetour=null;e.rearmDetourDoneFor=null;e.rearmPadId=null;
          if(e.repairRetreat)e.retreatCooldownAt=this.time+40;
          e.repairRetreat=false;
          e.rearmPowerOutage=0;
          e.rearmRetryAt=this.time+25;
          return false;
        }
        return true;
      }
      e.rearmPowerOutage=0;
      // Powered airfields retain existing paid repairs and ammunition timing.
      if(!this.power(e.owner).low){
        // Paid hull servicing happens only during the existing rearm visit.
        // This adds no save fields and never forces a full-ammo plane to return.
        const owner=this.players[e.owner];
        if(e.hp<e.maxHp&&owner?.credits>0){
          const repairCost=.75;
          const healed=Math.min(12*dt,e.maxHp-e.hp,owner.credits/repairCost);
          e.hp=Math.min(e.maxHp,e.hp+healed);
          owner.credits=Math.max(0,owner.credits-healed*repairCost);
        }
        e.rearmProgress=(Number.isFinite(e.rearmProgress)?e.rearmProgress:0)+dt;
        while(e.rearmProgress>=2.5&&e.ammo<capacity){
          e.ammo++;
          e.rearmProgress-=2.5;
        }
        // Emergency withdrawals wait for 75% hull, unless repairs are
        // unaffordable. Ordinary empty-magazine visits still end at full ammo.
        if(e.ammo>=capacity&&(!e.repairRetreat||
           e.hp/e.maxHp>=.75||owner.credits<.75)){
          if(e.repairRetreat)e.retreatCooldownAt=this.time+40;
          e.repairRetreat=false;
          e.rearming=false;
          e.rearmProgress=0;
          e.rearmDetour=null;e.rearmDetourDoneFor=null;e.rearmPadId=null;
          e.order=e.rearmResume||null;
          e.rearmResume=null;
        }
      }
      return true;
    }
    defenseTarget(defender){
      // Towers prioritise detected aircraft but never fire through fog of war.
      // Allied sensors can spot aircraft beyond a tower's own sight radius.
      const range=this.stat(defender,'range');
      const visible=b=>b.owner!==defender.owner&&b.type==='unit'&&b.built&&
        b.hp>0&&this.sideCanSee(defender.owner,b);
      const air=this.nearest(defender,b=>visible(b)&&b.kind==='aircraft',range);
      return air||(BUILD[defender.kind]?.antiAirOnly?null:
        this.nearest(defender,b=>visible(b)&&b.kind!=='aircraft',range));
    }
    shoot(source,target){
      const def=this.getDef(source),damage=this.stat(source,'damage');
      if(!damage||!target||source.hp<=0||target.hp<=0||source.owner===target.owner)return;
      if(def.antiAirOnly&&target.kind!=='aircraft')return;
      if(source.kind==='aircraft'&&(source.ammo??UNITS.aircraft.ammo)<=0)return;
      if(source.kind==='aircraft')source.ammo=Math.max(0,(source.ammo??UNITS.aircraft.ammo)-1);
      source.ready=Math.max(.2,(def.rate||1.2)*[1,.93,.85][this.veterancyRank(source)]);
      const faction=this.players[source.owner].faction;
      const bonus=source.kind==='specialist'&&faction==='federation'?1.3:1;
      const psychic=source.kind==='specialist'&&faction==='psionic';
      const antiAir=source.type==='building'&&target.kind==='aircraft'?(def.antiAirBonus||1):1;
      // A shot is now a moving projectile. Damage is resolved on impact, not firing.
      if(source.owner===0||this.sideCanSee(0,source))this.audio?.play('shot.'+source.kind,{kind:source.kind,faction});
      this.projectiles.push({
        x:source.x,y:source.y,prevX:source.x,prevY:source.y,
        targetId:target.id,owner:source.owner,sourceId:source.id,
        sourceKind:source.kind,damage:damage*bonus*antiAir,psychic,age:0,
        speed:source.kind==='soldier'?8.5:source.kind==='tank'?6.8:source.kind==='heavy'?5:psychic?7:10,
        color:psychic?'#bb78ff':faction==='psionic'?'#a3f5c8':source.type==='building'?'#77d9ff':'#f4b36c'
      });
      this.particles.push({x:source.x,y:source.y,life:.2,type:'muzzle',color:faction==='psionic'?'#ba84ee':'#ffd698'});
      // The launch itself is observable combat evidence. React while the
      // projectile is still in flight rather than waiting for the first hit.
      // The same sensor, escort and cooldown checks protect impact fallback.
      this.respondToAIHarvesterAttack(this.projectiles[this.projectiles.length-1],target);
      this.respondToAIRadarAttack(this.projectiles[this.projectiles.length-1],target);
    }
    respondToAIRadarAttack(shot,target){
      // A radar is the prerequisite for aviation. Any visible ground attacker
      // firing on it should not wait for the next strategic AI tick.
      // Only reuse the existing base-first tactical engagement planner; never
      // accelerate construction, recruitment or use hidden projectile intel.
      if(this.state!=='playing'||!target||target.owner!==1||
         target.kind!=='radar'||target.type!=='building'||!target.built||
         target.hp<=0||shot.owner!==0||
         !['tank','heavy','soldier','specialist'].includes(shot.sourceKind)||
         this.nextAI<=this.time||this.time<this.nextRadarResponseAt)return false;
      const attacker=this.entityById(shot.sourceId);
      if(!attacker||attacker.hp<=0||attacker.owner!==0||
         attacker.type!=='unit'||attacker.kind!==shot.sourceKind||
         !this.sideCanSee(1,attacker))return false;
      const base=this.entities.find(e=>e.owner===1&&e.kind==='hq'&&e.hp>0);
      if(!base)return false;
      const fighters=this.entities.filter(e=>e.owner===1&&e.type==='unit'&&
        e.hp>0&&e.built&&e.kind!=='harvester'&&e.kind!=='aircraft'&&
        e.kind!=='recon'&&(e.retreatUntil||0)<=this.time&&
        dist(e,attacker)<=8.5&&dist(e,target)<=9);
      if(!fighters.length)return false;
      const structures=this.entities.filter(e=>e.owner===1&&e.type==='building'&&
        e.hp>0&&e.built);
      const invaders=this.entities.filter(e=>e.owner===0&&e.type==='unit'&&
        e.hp>0&&e.kind!=='harvester'&&structures.some(b=>dist(b,e)<8)&&
        this.sideCanSee(1,e));
      const assignments=this.assignAIEngagements(fighters,invaders,base);
      const intercepted=[...assignments.values()].includes(attacker.id);
      // Failed or unreachable interceptions do not suppress another real shot.
      // Successful assignments are bounded to one response per four seconds.
      if(intercepted)this.nextRadarResponseAt=this.time+4;
      return intercepted;
    }
    respondToAIHarvesterAttack(shot,target){
      // A hostile ground unit can fire at a worker immediately after an
      // eight-second strategic decision. Respond on a confirmed visible shot,
      // or on impact if it only becomes visible later. Reuse only the
      // EXISTING tactical escort planner:
      // advancing the entire strategic AI tick changed production timing and
      // failed the natural-match economy regression on Desert.
      if(this.state!=='playing'||target.owner!==1||
         target.kind!=='harvester'||target.hp<=0||shot.owner!==0||
         !['tank','heavy','soldier','specialist'].includes(shot.sourceKind)||
         this.nextAI<=this.time||
         (this.time<this.nextHarvesterResponseAt&&
          (!this.unservedHarvesterShooterId||
           this.unservedHarvesterShooterId===shot.sourceId)))return false;
      const attacker=this.entityById(shot.sourceId);
      if(!attacker||attacker.hp<=0||attacker.owner!==0||
         attacker.type!=='unit'||attacker.kind!==shot.sourceKind||
         !this.sideCanSee(1,attacker))return false;
      // Only nearby ground escorts can help this worker. Never call the
      // strategic planner, recruit units, change income or invent a target
      // from the projectile's hidden coordinates.
      // The archived Verdant match lost a worker with an idle tank 8.47
      // tiles away. For a CONFIRMED, AI-visible shot only, allow a nearby
      // reserve escort slightly longer to respond. Ordinary strategic AI
      // decisions retain their tighter local engagement limits.
      const fighters=this.entities.filter(e=>e.owner===1&&e.type==='unit'&&
        e.hp>0&&e.built&&e.kind!=='harvester'&&e.kind!=='aircraft'&&
        e.kind!=='recon'&&(e.retreatUntil||0)<=this.time&&
        dist(e,attacker)<=11&&dist(e,target)<=11);
      if(!fighters.length)return false;
      const base=this.entities.find(e=>e.owner===1&&e.kind==='hq'&&e.hp>0);
      if(!base)return false;
      const structures=this.entities.filter(e=>e.owner===1&&e.type==='building'&&
        e.hp>0&&e.built);
      const invaders=this.entities.filter(e=>e.owner===0&&e.type==='unit'&&
        e.hp>0&&e.kind!=='harvester'&&structures.some(b=>dist(b,e)<8)&&
        this.sideCanSee(1,e));
      const assignments=this.assignAIEngagements(fighters,invaders,base,attacker.id,target.id);
      // Rate-limit repeated shots from the same unserved attacker, but
      // permit ONE different observed shooter during that four-second window.
      // A successful response (or the second attempt) closes the exception.
      const intercepted=[...assignments.values()].includes(attacker.id);
      const retrying=this.time<this.nextHarvesterResponseAt;
      this.nextHarvesterResponseAt=this.time+4;
      this.unservedHarvesterShooterId=!retrying&&!intercepted?attacker.id:0;
      return intercepted;
    }
    rescanThreatenedAIHarvesterOre(shot,worker){
      // Reuse the existing safe-deposit selector after actual damage rather
      // than waiting up to six seconds on a now-dangerous ore destination.
      // Never reroute a loaded delivery or react to a hidden shooter.
      if(worker.owner!==1||worker.type!=='unit'||worker.kind!=='harvester'||
         worker.hp<=0||worker.hp>=worker.maxHp*.7||worker.load>=360||
         shot.owner!==0||!['soldier','specialist','tank','heavy'].includes(shot.sourceKind)||
         (worker.oreScanAt||0)<=this.time)return false;
      const attacker=this.entityById(shot.sourceId);
      if(!attacker||attacker.owner!==0||attacker.type!=='unit'||
         attacker.hp<=0||attacker.kind!==shot.sourceKind||
         !this.sideCanSee(1,attacker)||
         dist(attacker,worker)>this.stat(attacker,'range')+.8)return false;
      // Impacts may arrive every second. Bound extra A* deposit searches to
      // one per six seconds per worker, without adding any saved entity fields.
      this.harvesterThreatRescanAt??=new WeakMap();
      if(this.time<(this.harvesterThreatRescanAt.get(worker)||0))return false;
      worker.oreScanAt=0;
      this.harvesterThreatRescanAt.set(worker,this.time+6);
      return true;
    }
    updateProjectiles(dt){
      for(const shot of this.projectiles){
        shot.prevX=shot.x;shot.prevY=shot.y;
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
          target.owner=shot.owner;target.order={type:'move',x:clamp(target.x+(shot.owner===0?1:-1),1,WORLD_SIZE-2),y:target.y+1};
          target.path=[];target.engaging=false;
          this.particles.push({x:target.x,y:target.y,life:.85,color:'#cd84fa',type:'control'});
          if(shot.owner===0)this.notify('Enemy unit captured');
          continue;
        }
        target.hp-=shot.damage;
        this.rescanThreatenedAIHarvesterOre(shot,target);
        this.respondToAIHarvesterAttack(shot,target);
        this.respondToAIRadarAttack(shot,target);
        if(target.owner===0&&target.type==='unit'&&this.time-(target.lastHurtVoiceAt??-100)>7){
          target.lastHurtVoiceAt=this.time;
          this.audio?.play('underFire',{kind:target.kind,faction:this.players[0]?.faction});
        }
        this.noteBuildingDamage(target,shot.owner);
        if(shot.owner===1&&target.type==='building')this.aiSiegeHits++;
        if(target.type==='building'&&
          (shot.sourceKind==='heavy'||shot.sourceKind==='tank'||target.hp<=0)){
          this.particles.push({x:target.x,y:target.y,life:.5,
            type:'shockwave',radius:shot.sourceKind==='heavy'?34:23,color:shot.color});
        }
        if(this.stats[shot.owner])this.stats[shot.owner].damageDealt+=Math.max(0,Math.min(shot.damage,target.hp+shot.damage));
        this.particles.push({x:target.x,y:target.y,life:.38,color:shot.color,type:'hit'});
        if(this.sideCanSee(0,target))this.audio?.play('impact.'+target.kind,{kind:target.kind});
        if(target.hp<=0){
          if(this.sideCanSee(0,target))this.audio?.play('explosion',{kind:target.kind});
          this.recordLoss(target,shot.owner);
          const killer=this.entityById(shot.sourceId);
          if(killer&&killer.owner===shot.owner)this.awardKill(killer);
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
        // Draw tracer along the actual projectile displacement.
        // Old save projectiles without previous coordinates remain valid.
        const previous=iso(shot.prevX??shot.x,shot.prevY??shot.y);
        c.globalAlpha=.7;c.beginPath();
        c.moveTo(previous.x,previous.y-12);c.lineTo(p.x,p.y-12);c.stroke();
        c.globalAlpha=1;c.beginPath();
        c.arc(p.x,p.y-12,3.3,0,Math.PI*2);c.fill();c.restore();
      }
    }
    productionBuilding(side,unitKind){
      const producerKind=UNITS[unitKind]?.from;
      if(!producerKind)return null;
      const home=side===0?{x:6,y:6}:{x:WORLD_SIZE-6,y:WORLD_SIZE-6};
      return this.nearest(home,b=>b.owner===side&&b.type==='building'&&
        b.kind===producerKind&&b.built);
    }
    findProductionExit(producer,unitKind,side){
      // Search the producer's surroundings rather than placing units at a
      // fixed offset that might be a lake, another building, or a parked tank.
      const probe={id:-1,kind:unitKind,type:'unit',hp:1};
      const sign=side===0?1:-1;
      const radius=this.unitRadius(probe);
      for(let ring=2;ring<=9;ring++){
        const choices=[];
        for(let dx=-ring;dx<=ring;dx++)for(let dy=-ring;dy<=ring;dy++){
          if(Math.max(Math.abs(dx),Math.abs(dy))!==ring)continue;
          const x=producer.x+dx,y=producer.y+dy;
          const forward=(dx+dy)*sign;
          choices.push({x,y,score:-forward*2+Math.abs(dx-dy)*.15});
        }
        choices.sort((a,b)=>a.score-b.score||a.x-b.x||a.y-b.y);
        for(const spot of choices){
          if(!this.canOccupyUnit(probe,spot.x,spot.y))continue;
          // Test the unit's actual footprint, not just its center tile.
          const edge=radius*.8;
          if([[edge,0],[-edge,0],[0,edge],[0,-edge]].some(([dx,dy])=>
              this.water(spot.x+dx,spot.y+dy)))continue;
          // Reject isolated pockets with no adjacent step to move out of.
          const exits=[[.75,0],[-.75,0],[0,.75],[0,-.75]];
          if(!exits.some(([dx,dy])=>this.canOccupyUnit(probe,
              spot.x+dx,spot.y+dy)))continue;
          return {x:spot.x,y:spot.y};
        }
      }
      return null;
    }
    advanceProduction(dt){
      // Finished queues wait safely at 100% until an actual clear exit is
      // available. A destroyed producer pauses progress instead of eating
      // credits and silently deleting the queued unit.
      for(let i=this.queues.length-1;i>=0;i--){
        const q=this.queues[i],unit=UNITS[q.key];
        if(!unit)continue;
        const producer=this.productionBuilding(q.side,q.key);
        if(!producer){q.blockedReason='producer';continue;}
        if(q.elapsed<q.total){
          q.elapsed=Math.min(q.total,q.elapsed+dt*(this.power(q.side).low?.55:1));
        }
        if(q.elapsed<q.total){q.blockedReason=null;continue;}
        if((q.nextDeployAt||0)>this.time)continue;
        let spot=this.findProductionExit(producer,q.key,q.side);
        if(!spot){
          // A blocked primary factory/airfield must not strand a paid order
          // when another completed, friendly producer has a safe exit.
          // Preserve the original producer preference whenever it can deploy.
          const home=q.side===0?{x:6,y:6}:{x:WORLD_SIZE-6,y:WORLD_SIZE-6};
          const backups=this.entities.filter(b=>b.hp>0&&b.built&&
            b.type==='building'&&b.owner===q.side&&b.kind===unit.from&&
            b.id!==producer.id).sort((a,b)=>dist(a,home)-dist(b,home)||a.id-b.id);
          for(const backup of backups){
            spot=this.findProductionExit(backup,q.key,q.side);
            if(spot)break;
          }
        }
        if(!spot){
          q.blockedReason='exit';
          q.nextDeployAt=this.time+.8;
          continue;
        }
        const spawned=this.add(q.side,q.key,spot.x,spot.y);
        if(q.key==='harvester')spawned.order={type:'harvest'};
        this.queues.splice(i,1);
        if(q.side===0){this.audio?.play('ready',{kind:q.key,faction:this.players[0]?.faction});this.notify(this.name(spawned)+' deployed');}
      }
    }
    chooseHarvestDeposit(e){
      // Deposits can overlap a newly constructed refinery or sit beyond a
      // lake. Never select a shiny but physically unreachable ore pile.
      const excluded=(e.oreSkipUntil||0)>this.time?e.oreSkipIndex:-1;
      const candidates=this.ores.map((ore,index)=>({ore,index,d:dist(e,ore)}))
        .filter(({ore,index})=>ore.amount>0&&index!==excluded&&
          this.canOccupyUnit(e,ore.x,ore.y,true))
        .sort((a,b)=>a.d-b.d||a.index-b.index);
      // A substantially wounded enemy ore truck under CURRENTLY visible fire
      // may try a nearby reachable deposit outside that firing envelope.
      // Ordinary harvesting and hidden enemies retain nearest-first routing.
      // Do not travel across the map or introduce persistent retreat state.
      const threats=e.owner===1&&e.hp<e.maxHp*.7?this.entities.filter(other=>
        other.owner!==e.owner&&other.hp>0&&other.type==='unit'&&
        other.kind!=='harvester'&&this.sideCanSee(e.owner,other)):[];
      const nearestDistance=candidates[0]?.d??Infinity;
      const underFire=threats.some(enemy=>dist(enemy,e)<=this.stat(enemy,'range')+.8);
      const safe=underFire?candidates.filter(({ore,d})=>
        d<=nearestDistance+2.5&&!threats.some(enemy=>
          dist(enemy,ore)<=Math.min(7,Math.max(3.5,this.stat(enemy,'range')+1.2)))):[];
      const ordered=safe.length?[...safe,...candidates.filter(c=>!safe.includes(c))]:candidates;
      for(const {ore,index} of ordered){
        const path=this.findPath(e.x,e.y,ore.x,ore.y);
        const landing=path.at(-1)||{x:e.x,y:e.y};
        if(Math.hypot(landing.x-ore.x,landing.y-ore.y)<=1.05)return index;
      }
      return -1;
    }
    chooseHarvesterReturn(e){
      const refineries=this.entities.filter(b=>b.owner===e.owner&&b.type==='building'&&
        b.kind==='refinery'&&b.hp>0&&b.built)
        .sort((a,b)=>dist(e,a)-dist(e,b)||a.id-b.id);
      if(!refineries.length)return null;
      const closest=refineries[0];
      const fallback={refinery:closest,x:closest.x+1.9,y:closest.y+1.3};
      // Preserve established single-refinery routes and their economy.
      if(refineries.length===1)return fallback;
      // A truck already in unload range should never leave for another depot.
      const inRange=refineries.find(b=>dist(e,b)<=3.6);
      if(inRange)return {refinery:inRange,x:inRange.x+1.9,y:inRange.y+1.3};
      // Cache route choice outside saved entities. Recheck destroyed depots
      // immediately, and refresh reachable approaches every six seconds.
      const cached=this.harvesterReturnRoutes?.get(e);
      if(cached&&this.time<cached.until){
        const live=refineries.find(b=>b.id===cached.refineryId);
        if(live)return {refinery:live,x:cached.x,y:cached.y};
      }
      let best=null;
      const approaches=[[2,0],[-2,0],[0,2],[0,-2],
        [2,2],[2,-2],[-2,2],[-2,-2]];
      for(const refinery of refineries)for(const [dx,dy] of approaches){
        const x=refinery.x+dx,y=refinery.y+dy;
        if(!this.canOccupyUnit(e,x,y,true))continue;
        // Static A* must actually reach the unload perimeter. A* returns
        // the nearest partial path when water/buildings cut off the goal.
        const route=this.findPath(e.x,e.y,x,y);
        const last=route.at(-1)||{x:e.x,y:e.y};
        if(Math.hypot(last.x-x,last.y-y)>.6)continue;
        const score=route.length+Math.hypot(e.x-x,e.y-y)*.02;
        if(!best||score<best.score)best={refinery,x,y,score};
      }
      if(!best)return fallback;
      this.harvesterReturnRoutes??=new WeakMap();
      this.harvesterReturnRoutes.set(e,{
        refineryId:best.refinery.id,x:best.x,y:best.y,until:this.time+6
      });
      return {refinery:best.refinery,x:best.x,y:best.y};
    }
    processHarvester(e,dt){
      e.work-=dt;
      const returnRoute=e.load>=360?this.chooseHarvesterReturn(e):null;
      const refinery=returnRoute?.refinery||this.nearest(e,b=>
        b.owner===e.owner&&b.type==='building'&&b.kind==='refinery'&&b.built);
      if(!refinery)return;
      if(e.load>=360){
        if(dist(e,refinery)>3.6)this.move(e,
          returnRoute?.x??refinery.x+1.9,returnRoute?.y??refinery.y+1.3,dt);
        else if(e.work<=0){
          this.players[e.owner].credits+=e.load;
          if(this.stats[e.owner])this.stats[e.owner].oreHarvested+=e.load;
          e.load=0;e.work=.6;
          e.oreScanAt=0;e.oreLastDistance=null;
          if(e.owner===0)this.particles.push({x:refinery.x,y:refinery.y,life:1,color:'#9fe29d',type:'cash'});
        }
        return;
      }
      let ore=this.ores[e.oreIndex];
      if(!ore||ore.amount<=0||(e.oreScanAt||0)<=this.time){
        const selected=this.chooseHarvestDeposit(e);
        e.oreIndex=selected;
        e.oreScanAt=this.time+6;
        e.oreLastDistance=null;
        ore=selected>=0?this.ores[selected]:null;
      }
      if(!ore)return;
      const d=dist(e,ore);
      if(d>.85){
        this.move(e,ore.x,ore.y,dt);
        if((e.oreProgressAt||0)<=this.time){
          if(Number.isFinite(e.oreLastDistance)&&d>=e.oreLastDistance-.18){
            // The landing may be almost accessible but obstructed by moving
            // vehicles or tight structures. Retry another deposit temporarily.
            e.oreSkipIndex=e.oreIndex;e.oreSkipUntil=this.time+16;
            e.oreIndex=-1;e.oreScanAt=0;
          }else e.oreLastDistance=d;
          e.oreProgressAt=this.time+7;
        }
      }else if(e.work<=0){
        const amount=Math.min(80,ore.amount,360-e.load);
        e.load+=amount;ore.amount-=amount;e.work=.8;
        e.oreLastDistance=null;e.oreProgressAt=this.time+7;
      }
    }
    deployRefineryHarvester(refinery){
      // A completed refinery includes one harvester. Prefer the historical
      // (+2,+1) position when it is safe to preserve normal opening routes.
      // If terrain or traffic blocks it, use the same collision-checked
      // exit search as paid production rather than spawning inside an obstacle.
      const probe={id:-1,kind:'harvester',type:'unit',hp:1};
      const x=refinery.x+2,y=refinery.y+1,r=this.unitRadius(probe)*.8;
      const preferred=this.canOccupyUnit(probe,x,y)&&
        [[r,0],[-r,0],[0,r],[0,-r]].every(([dx,dy])=>
          !this.water(x+dx,y+dy))&&
        [[.75,0],[-.75,0],[0,.75],[0,-.75]].some(([dx,dy])=>
          this.canOccupyUnit(probe,x+dx,y+dy));
      const spot=preferred?{x,y}:this.findProductionExit(refinery,'harvester',refinery.owner);
      if(!spot){
        // Do not lose the refinery's included worker or place it in water.
        // This pending flag lives on the building and survives v1 saves.
        refinery.pendingHarvester=true;
        refinery.harvesterDeployAt=this.time+.8;
        return false;
      }
      const worker=this.add(refinery.owner,'harvester',spot.x,spot.y);
      worker.order={type:'harvest'};
      refinery.pendingHarvester=false;
      refinery.harvesterDeployAt=0;
      return true;
    }
    step(dt){
      this.time+=dt;
      // Reset before movement; the previous tick's buildings are never reused.
      this._movementNavCache={blocked:null};
      this.unitBuckets=new UnitBuckets().rebuild(this.entities);
      // One building index for the movement/separation phase; collision
      // checks still read live HP and the index is discarded every tick.
      this.buildingBuckets=new UnitBuckets(2,'building').rebuild(this.entities);
      // Nine-tile buckets exceed the longest sight radius (recon: 8.1).
      // Adjacent cells therefore contain every possible live observer.
      this.sensorBuckets=[0,1].map(side=>new UnitBuckets(9,null).rebuild(
        this.entities.filter(e=>e.owner===side)));
      const pan=380*dt/this.camera.zoom;
      if(this.keys.has('w')||this.keys.has('arrowup'))this.camera.y-=pan;
      if(this.keys.has('s')||this.keys.has('arrowdown'))this.camera.y+=pan;
      if(this.keys.has('a')||this.keys.has('arrowleft'))this.camera.x-=pan;
      if(this.keys.has('d')||this.keys.has('arrowright'))this.camera.x+=pan;
      this.clampCamera();
      for(const e of this.entities){
        if(e.hp<=0)continue;
        if(!e.built){e.construction+=dt/e.buildTime;if(e.construction>=1){e.construction=1;e.built=true;if(e.kind==='refinery')this.deployRefineryHarvester(e);}continue;}
        if(e.kind==='refinery'&&e.pendingHarvester&&
            (e.harvesterDeployAt||0)<=this.time)this.deployRefineryHarvester(e);
        e.ready=Math.max(0,e.ready-dt);
        if((e.stunnedUntil||0)>this.time)continue;
        if(e.type==='unit'){
          if(e.yieldOrder){
            const destination=e.yieldOrder;
            if(this.time>=destination.expires||
               Math.hypot(e.x-destination.x,e.y-destination.y)<.34){
              this.finishYield(e);
            }else{
              this.move(e,destination.x,destination.y,dt);
              continue;
            }
          }
          if(e.kind==='harvester'){this.processHarvester(e,dt);continue;}
          if(this.serviceAircraft(e,dt))continue;
          if(e.owner===1&&(e.retreatUntil||0)>this.time&&e.order?.type==='move'){
            this.move(e,e.order.x,e.order.y,dt);
            continue;
          }
          const command=e.order,range=this.stat(e,'range'),stance=e.stance||'guard';
          let target=command?.type==='attack'?this.entityById(command.id):null;
          // The computer may not chase a unit after contact is lost in fog.
          // Player-issued attack orders retain their existing behaviour.
          if(e.owner===1&&target&&!this.sideCanSee(1,target)){
            e.order=null;target=null;
          }
          if(!target&&command?.type!=='move'){
            const detection=stance==='aggressive'?range+4.0:stance==='hold'?range:range+1.5;
            // Automatic targeting needs a live friendly sensor contact for BOTH
            // sides. Player-issued direct attack orders remain manually controlled.
            target=this.nearest(e,b=>b.owner!==e.owner&&b.built&&
              this.sideCanSee(e.owner,b),detection);
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
          const target=this.defenseTarget(e);
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
      this.advanceLaneReservations();
      // Projectiles can destroy buildings, and production can add them. Drop
      // the shared footprint before either phase so all later queries are live.
      this._movementNavCache=null;
      this.unitBuckets=null;this.buildingBuckets=null;this.sensorBuckets=null;
      this.updateProjectiles(dt);
      this.repairBuildings(dt);
      this.advanceProduction(dt);
      if(this.time>=this.nextAI){this.runAI();this.nextAI=this.time+(this.settings.difficulty==='veteran'?5:this.settings.difficulty==='recruit'?13:8);}
      this.particles=this.particles.filter(p=>(p.life-=dt)>0);
      if(this.time>this.nextFog){this.updateFog();this.updateAISurvey();this.updateIntel(0);this.checkPlayerThreats();this.nextFog=this.time+.3;}
      if(this.time>this.nextUi){this.updateUI();this.nextUi=this.time+.45;}
      this.entities=this.entities.filter(e=>e.hp>0);
      for(let side=0;side<2;side++){if(!this.entities.some(e=>e.owner===side&&e.type==='building'&&e.hp>0)){this.finish(side===1);break;}}
    }
    sideCanSee(side,location){
      // Game-wide unit sight shared by teammates, without revealing enemy
      // positions outside their sensor radius.
      const observers=this.sensorBuckets?.[side]?.nearby(location.x,location.y)||this.entities;
      for(const observer of observers){
        if(observer.owner!==side||observer.hp<=0||!observer.built)continue;
        const radius=observer.kind==='recon'?8.1:observer.type==='building'?5.8:4.8;
        if((observer.x-location.x)**2+(observer.y-location.y)**2<=radius*radius)return true;
      }
      return false;
    }
    updateIntel(side){
      const list=this.intel?.[side]||(this.intel[side]=[]);
      const incoming=this.entities.filter(e=>e.owner!==side&&e.hp>0&&this.sideCanSee(side,e));
      const byId=new Map(list.map(item=>[item.id,item]));
      for(const enemy of incoming){
        byId.set(enemy.id,{id:enemy.id,x:enemy.x,y:enemy.y,time:this.time,type:enemy.type,kind:enemy.kind});
      }
      this.intel[side]=[...byId.values()].filter(v=>{
        if(this.time-v.time>(v.type==='building'?180:28))return false;
        // An absent enemy can only be confirmed missing by looking at its
        // last-known position, never by consulting the hidden live entity list.
        if(!this.sideCanSee(side,v))return true;
        return this.entities.some(e=>e.id===v.id&&e.hp>0&&e.owner!==side&&
          Math.hypot(e.x-v.x,e.y-v.y)<1.5);
      }).slice(-150);
      return this.intel[side];
    }
    assaultReachableTiles(origin){
      // Flood-fill the same orthogonal/diagonal ground graph used by A*.
      // This is a terrain/physical-collision check, never enemy-intel discovery.
      const start={x:clamp(Math.round(origin.x),1,WORLD_SIZE-2),
        y:clamp(Math.round(origin.y),1,WORLD_SIZE-2)};
      const key=(x,y)=>x+','+y,visited=new Set([key(start.x,start.y)]);
      const queue=[start],steps=[[1,0],[-1,0],[0,1],[0,-1],
        [1,1],[1,-1],[-1,1],[-1,-1]];
      for(let i=0;i<queue.length;i++){
        const node=queue[i];
        for(const [dx,dy] of steps){
          const x=node.x+dx,y=node.y+dy,k=key(x,y);
          if(visited.has(k)||!this.walkable(x,y))continue;
          if(dx&&dy&&(!this.walkable(node.x+dx,node.y)||
            !this.walkable(node.x,node.y+dy)))continue;
          visited.add(k);queue.push({x,y});
        }
      }
      return visited;
    }
    chooseFlank(origin,report,side=0,reachable=null,reserved=[]){
      // Sample walkable firing approaches around the REPORTED objective,
      // rather than sending units into its (blocked) structure footprint.
      const access=reachable||this.assaultReachableTiles(origin);
      const vx=report.x-origin.x,vy=report.y-origin.y;
      const length=Math.max(.01,Math.hypot(vx,vy)),sign=side%2===0?1:-1;
      const candidates=[],seen=new Set();
      for(const radius of [3,4,5])for(let i=0;i<12;i++){
        const angle=i*Math.PI/6;
        const x=Math.round(report.x+Math.cos(angle)*radius);
        const y=Math.round(report.y+Math.sin(angle)*radius);
        const key=x+','+y;
        if(seen.has(key)||!access.has(key)||!this.walkable(x,y))continue;
        seen.add(key);
        const p={x,y},sideOffset=(-(p.x-report.x)*vy+(p.y-report.y)*vx)/length;
        const flank=Math.max(0,1.5-sign*sideOffset);
        const congestion=reserved.reduce((total,used)=>{
          const spacing=dist(p,used);
          return total+(spacing<2.4?32+(2.4-spacing)*8:spacing<3.5?5:0);
        },0);
        candidates.push({p,score:dist(origin,p)*.8+
          dist(p,report)*.4+flank*1.1+congestion});
      }
      candidates.sort((a,b)=>a.score-b.score||a.p.x-b.p.x||a.p.y-b.p.y);
      return candidates[0]?.p||null;
    }
    reachableAIObjective(knowledge,origin,base,avoidId=null){
      // One flood-fill per decision, then try at most six ranked reports.
      const reachable=this.assaultReachableTiles(origin);
      return this.rankAIObjectives(knowledge,base,avoidId).slice(0,6)
        .find(report=>this.chooseFlank(origin,report,0,reachable))||null;
    }
    recoverStalledAIAssault(plan,members){
      if(!plan||plan.phase!=='assault')return;
      if(!this.aiAssaultProgress)this.aiAssaultProgress=new Map();
      for(let i=0;i<members.length;i++){
        const unit=members[i],key=unit.id;
        if(unit.order?.type!=='attackMove'||dist(unit,plan.target)<5.4){
          this.aiAssaultProgress.delete(key);continue;
        }
        const old=this.aiAssaultProgress.get(key);
        if(!old||old.targetId!==plan.targetId||dist(unit,old)>1.15){
          this.aiAssaultProgress.set(key,{x:unit.x,y:unit.y,time:this.time,
            targetId:plan.targetId,retries:0});
          continue;
        }
        if(this.time-old.time<18)continue;
        // Rotate flank preference after a genuine 18-second movement stall.
        const next=this.chooseFlank(unit,plan.target,i+1+old.retries,
          null,[unit.order]);
        if(next&&dist(next,unit.order)>1.2){
          unit.order={type:'attackMove',x:next.x,y:next.y};
          unit.path=[];unit.pathTarget=null;unit.pathGoal=null;
          unit.pathRecheck=0;unit.yieldOrder=null;unit.laneWaiting=null;
          this.aiAssaultReroutes=(this.aiAssaultReroutes||0)+1;
        }
        this.aiAssaultProgress.set(key,{x:unit.x,y:unit.y,time:this.time,
          targetId:plan.targetId,retries:old.retries+1});
      }
    }
    restoreAIPlatoon(saved,entities){
      if(!saved||!['rally','assault'].includes(saved.phase)||!Array.isArray(saved.ids)||
         saved.ids.length<2||saved.ids.length>8||!Number.isFinite(saved.startedAt)||
         !Number.isFinite(saved.targetTime)||!Number.isInteger(saved.targetId)||
         !saved.target||!Number.isFinite(saved.target.x)||!Number.isFinite(saved.target.y)||
         saved.target.x<0||saved.target.x>WORLD_SIZE||saved.target.y<0||saved.target.y>WORLD_SIZE||
         !Array.isArray(saved.slots)||saved.slots.length!==saved.ids.length)return null;
      const ids=new Set(),slots=[];
      for(let i=0;i<saved.ids.length;i++){
        const id=saved.ids[i],slot=saved.slots[i];
        if(!Number.isInteger(id)||ids.has(id)||!entities.some(e=>e.id===id&&e.owner===1&&e.type==='unit')||
           !slot||!Number.isFinite(slot.x)||!Number.isFinite(slot.y)||
           slot.x<1||slot.y<1||slot.x>WORLD_SIZE-2||slot.y>WORLD_SIZE-2)return null;
        ids.add(id);slots.push({x:slot.x,y:slot.y});
      }
      return {phase:saved.phase,ids:[...ids],slots,startedAt:saved.startedAt,
        targetId:saved.targetId,targetTime:saved.targetTime,
        target:{x:saved.target.x,y:saved.target.y}};
    }
    rankAIObjectives(knowledge,base,avoidId=null){
      // Enemy locations come solely from the AI's observed sensor reports.
      // Never infer coordinates from hidden opponents or player fog.
      const value={hq:110,tech:87,factory:82,refinery:78,
        barracks:68,radar:60,generator:54,turret:32};
      return knowledge.filter(k=>k&&k.type==='building'&&
        Number.isInteger(k.id)&&Number.isFinite(k.x)&&Number.isFinite(k.y)&&
        Number.isFinite(k.time)&&this.time>=k.time&&this.time-k.time<=180)
        .map(k=>{
          const age=this.time-k.time;
          const danger=Math.min(25,this.scoutThreatPenalty(k)*.045);
          const duplicate=avoidId===k.id?38:0;
          return {report:k,score:(value[k.kind]??48)-dist(base,k)*.85-
            age*.12-danger-duplicate};
        })
        .sort((a,b)=>b.score-a.score||b.report.time-a.report.time||
          a.report.id-b.report.id).map(entry=>entry.report);
    }
    coordinateAIPlatoon(fighters,knowledge,base,threatened){
      // All targets are previously scouted *reports*, never invisible live
      // enemy objects. A platoon is a bounded, persistent squad of up to 5.
      if(threatened){this.aiPlatoon=null;return new Set();}
      const soldiers=fighters.filter(u=>u.kind!=='recon'&&u.hp>0&&u.built&&
        u.hp/u.maxHp>=.36&&(u.retreatUntil||0)<=this.time&&
        (u.retreatCooldownAt||0)<=this.time&&
        !this.aiSupportPlatoon?.ids.includes(u.id));
      const report=this.reachableAIObjective(knowledge,soldiers[0]||base,base);
      if(!report){this.aiPlatoon=null;return new Set();}
      const minimum=this.settings.difficulty==='recruit'?5:
        this.settings.difficulty==='veteran'?2:3;
      const earliest=this.settings.difficulty==='recruit'?85:
        this.settings.difficulty==='veteran'?38:57;
      let plan=this.aiPlatoon;
      if(plan){
        // A casualty must not reset the survivors' staging or assault orders.
        const survivors=plan.ids.map((id,i)=>({id,slot:plan.slots[i]}))
          .filter(member=>soldiers.some(u=>u.id===member.id));
        if(survivors.length>=2){
          plan.ids=survivors.map(member=>member.id);
          plan.slots=survivors.map(member=>member.slot);
        }else plan=null;
      }
      if(plan&&(this.time-plan.startedAt>125||
         plan.targetId!==report.id&&this.time-plan.targetTime>50))plan=null;
      if(this.time<earliest||(!plan&&soldiers.length<minimum)){
        this.aiPlatoon=null;return new Set();
      }
      this.aiPlatoon=plan;
      if(!plan){
        const units=[...soldiers].sort((a,b)=>
          Math.hypot(a.x-base.x,a.y-base.y)-Math.hypot(b.x-base.x,b.y-base.y)||a.id-b.id)
          .slice(0,Math.min(5,soldiers.length));
        const origin={x:units.reduce((sum,u)=>sum+u.x,0)/units.length,
          y:units.reduce((sum,u)=>sum+u.y,0)/units.length};
        const dx=report.x-origin.x,dy=report.y-origin.y;
        const length=Math.max(1,Math.hypot(dx,dy)),advance=Math.min(5,length*.35);
        const rally={x:origin.x+dx/length*advance,y:origin.y+dy/length*advance};
        const available=this.formationSlots(rally.x,rally.y,units.length,origin);
        if(available.length<units.length)return new Set();
        const slots=[];
        const remaining=[...units];
        for(const unit of units){
          let best=-1,bestDist=Infinity;
          for(let i=0;i<available.length;i++){
            if(slots.some(p=>p.x===available[i].x&&p.y===available[i].y))continue;
            const d=Math.hypot(unit.x-available[i].x,unit.y-available[i].y);
            if(d<bestDist){bestDist=d;best=i;}
          }
          if(best<0)return new Set();
          slots.push({...available[best]});
        }
        plan={phase:'rally',ids:units.map(u=>u.id),slots,
          targetId:report.id,targetTime:report.time,
          target:{x:report.x,y:report.y},startedAt:this.time};
        this.aiPlatoon=plan;
        units.forEach((unit,i)=>{
          unit.order={type:'move',x:slots[i].x,y:slots[i].y};
        });
      }
      const members=plan.ids.map(id=>soldiers.find(u=>u.id===id)).filter(Boolean);
      if(plan.phase==='rally'){
        this.resumeAIRallyOrders(plan,members);
        const ready=members.filter((unit,i)=>{
          const index=plan.ids.indexOf(unit.id),spot=plan.slots[index];
          return Math.hypot(unit.x-spot.x,unit.y-spot.y)<=1.8;
        }).length;
        // Do not send isolated first arrivals alone; allow a limited timeout
        // only when at least half the squad is already at the rally.
        if(ready>=Math.ceil(members.length*.7)||
          (this.time-plan.startedAt>22&&ready>=Math.ceil(members.length*.5))){
          plan.phase='assault';
          const claimed=[];
          members.forEach((unit,i)=>{
            const flank=this.chooseFlank(unit,plan.target,i,null,claimed);
            if(flank){claimed.push(flank);unit.order={type:'attackMove',x:flank.x,y:flank.y};}
          });
        }
      }
      this.resumeAISiegeAdvance(plan,members);
      this.recoverStalledAIAssault(plan,members);
      return new Set(plan.ids);
    }
    coordinateAISupport(fighters,knowledge,base,threatened,committed){
      // A second, smaller force can organize independently of the primary
      // platoon, without stealing already-committed attackers or scouts.
      if(threatened){this.aiSupportPlatoon=null;return new Set();}
      const minimum=this.settings.difficulty==='recruit'?4:2;
      const ready=fighters.filter(u=>u.hp>0&&u.built&&u.kind!=='recon'&&
        !committed.has(u.id)&&u.hp/u.maxHp>=.36&&
        (u.retreatUntil||0)<=this.time&&
        (u.retreatCooldownAt||0)<=this.time)
        .sort((a,b)=>a.id-b.id);
      const report=this.reachableAIObjective(knowledge,ready[0]||base,base,
        this.aiPlatoon?.targetId);
      if(!report){this.aiSupportPlatoon=null;return new Set();}
      let plan=this.aiSupportPlatoon;
      if(plan){
        const survivors=plan.ids.map((id,i)=>({id,slot:plan.slots[i]}))
          .filter(member=>ready.some(u=>u.id===member.id));
        if(survivors.length>=2){
          plan.ids=survivors.map(member=>member.id);
          plan.slots=survivors.map(member=>member.slot);
        }else plan=null;
      }
      if(plan&&this.time-plan.startedAt>105)plan=null;
      this.aiSupportPlatoon=plan;
      if(!plan){
        if(ready.length<minimum){this.aiSupportPlatoon=null;return new Set();}
        const units=ready.slice(0,Math.min(4,ready.length));
        const origin={x:units.reduce((sum,u)=>sum+u.x,0)/units.length,
          y:units.reduce((sum,u)=>sum+u.y,0)/units.length};
        const deltaX=report.x-origin.x,deltaY=report.y-origin.y;
        const length=Math.max(1,Math.hypot(deltaX,deltaY));
        // Support gathers to the flank of the forward rally, not directly
        // on top of the first platoon's formation slots.
        const rally={x:origin.x+deltaX/length*Math.min(4,length*.3)-deltaY/length*3,
          y:origin.y+deltaY/length*Math.min(4,length*.3)+deltaX/length*3};
        const slots=this.formationSlots(rally.x,rally.y,units.length,origin);
        if(slots.length<units.length){this.aiSupportPlatoon=null;return new Set();}
        plan={phase:'rally',ids:units.map(u=>u.id),
          slots:slots.slice(0,units.length).map(p=>({x:p.x,y:p.y})),
          targetId:report.id,targetTime:report.time,target:{x:report.x,y:report.y},
          startedAt:this.time};
        this.aiSupportPlatoon=plan;
        units.forEach((unit,i)=>unit.order={type:'move',...plan.slots[i]});
      }
      const members=plan.ids.map(id=>ready.find(u=>u.id===id)).filter(Boolean);
      if(plan.phase==='rally'){
        this.resumeAIRallyOrders(plan,members);
        const arrived=members.filter(u=>{
          const spot=plan.slots[plan.ids.indexOf(u.id)];
          return Math.hypot(u.x-spot.x,u.y-spot.y)<=1.8;
        }).length;
        if(arrived>=Math.ceil(members.length*.75)||
          (this.time-plan.startedAt>20&&arrived>=Math.ceil(members.length*.5))){
          plan.phase='assault';
          const claimed=[];
          members.forEach((u,i)=>{
            const flank=this.chooseFlank(u,plan.target,i+1,null,claimed);
            if(flank){claimed.push(flank);u.order={type:'attackMove',x:flank.x,y:flank.y};}
          });
        }
      }
      this.resumeAISiegeAdvance(plan,members);
      this.recoverStalledAIAssault(plan,members);
      return new Set(plan.ids);
    }
    retreatWoundedAI(fighters,base,side=1){
      // Retreat only from enemies the AI can actually see. Damaged units
      // travel to reachable shelter but do not receive free healing.
      const withdrawing=new Set();
      for(const unit of fighters){
        if((unit.retreatUntil||0)>this.time||
           ((unit.retreatCooldownAt||0)>this.time&&unit.hp/unit.maxHp<.36)){
          // After reaching safety, wounded troops remain in reserve through
          // the cooldown instead of immediately rejoining an assault.
          withdrawing.add(unit.id);
          continue;
        }
        if((unit.retreatCooldownAt||0)>this.time||unit.hp/unit.maxHp>.28)continue;
        const enemy=this.nearest(unit,u=>u.owner!==side&&u.hp>0&&u.type==='unit'&&
          this.sideCanSee(side,u),7);
        if(!enemy)continue;
        const shelters=this.entities.filter(e=>e.owner===side&&e.type==='building'&&
          e.hp>0&&e.built);
        shelters.sort((a,b)=>Math.hypot(a.x-unit.x,a.y-unit.y)-Math.hypot(b.x-unit.x,b.y-unit.y));
        const shelter=shelters.find(e=>Math.hypot(e.x-enemy.x,e.y-enemy.y)>=
          Math.hypot(unit.x-enemy.x,unit.y-enemy.y))||base;
        if(!shelter)continue;
        const candidates=this.formationSlots(shelter.x+1.8,shelter.y+2,8,unit);
        const destination=candidates.find(p=>{
          if(Math.hypot(p.x-enemy.x,p.y-enemy.y)<Math.hypot(unit.x-enemy.x,unit.y-enemy.y)+.8)return false;
          const path=this.findPath(unit.x,unit.y,p.x,p.y);
          return path.length&&Math.hypot(path.at(-1).x-p.x,path.at(-1).y-p.y)<.5;
        });
        if(!destination)continue;
        unit.retreatUntil=this.time+18;
        unit.retreatCooldownAt=this.time+44;
        unit.order={type:'move',x:destination.x,y:destination.y};
        unit.path=[];unit.pathTarget=null;unit.pathGoal=null;unit.pathRecheck=0;
        unit.yieldOrder=null;unit.laneWaiting=null;
        withdrawing.add(unit.id);
      }
      return withdrawing;
    }
    assignAIEngagements(fighters,invaders,base,urgentHarvesterShooterId=null,urgentHarvesterTargetId=null){
      // Build one assignment table per AI decision tick. Only observed units
      // are candidates: unseen enemies never become omniscient attack orders.
      const side=1,available=new Map(fighters.filter(u=>u.hp>0&&u.built&&
        u.kind!=='harvester'&&u.kind!=='recon'&&(u.retreatUntil||0)<=this.time)
        .map(u=>[u.id,u]));
      const assignments=new Map(),committed=new Map();
      const visible=this.entities.filter(e=>e.owner!==side&&e.hp>0&&e.type==='unit'&&
        this.sideCanSee(side,e)).sort((a,b)=>a.id-b.id);
      const assign=(unit,target)=>{
        assignments.set(unit.id,target.id);available.delete(unit.id);
        committed.set(target.id,(committed.get(target.id)||0)+this.stat(unit,'damage'));
      };
      const structures=this.entities.filter(e=>e.owner===side&&e.type==='building'&&e.hp>0);
      // A base assault takes precedence over a far-away field skirmish.
      const defenders=[...invaders].filter(e=>visible.some(t=>t.id===e.id)).sort((a,b)=>{
        const threatDistance=e=>Math.min(...structures.map(s=>dist(s,e)));
        return threatDistance(a)-threatDistance(b)||a.hp-b.hp||a.id-b.id;
      });
      for(const enemy of defenders){
        const defenders=[...available.values()].filter(u=>dist(u,enemy)<=9)
          .sort((a,b)=>dist(a,enemy)-dist(b,enemy)||a.id-b.id);
        const cap=Math.min(2,defenders.length);
        for(let i=0;i<cap;i++)assign(defenders[i],enemy);
      }
      // A distant ore truck is outside the HQ's invasion radius. Give up to
      // two nearby, uncommitted ground defenders a chance to intercept threats
      // the AI can CURRENTLY see near a living worker. Base defense above
      // always gets first claim; do not strip distant assault formations.
      const workers=this.entities.filter(e=>e.owner===side&&e.kind==='harvester'&&
        e.type==='unit'&&e.hp>0&&e.built);
      const oreThreats=visible.filter(enemy=>enemy.kind!=='harvester'&&
        enemy.kind!=='aircraft').map(enemy=>({
          // On a confirmed shot, defend the actual target worker, not
          // whichever other harvester happens to be closest to the shooter.
          // All candidates still require current AI sensor visibility.
          enemy,worker:(enemy.id===urgentHarvesterShooterId?
            workers.find(h=>h.id===urgentHarvesterTargetId):null)||
            workers.reduce((best,h)=>
              !best||dist(h,enemy)<dist(best,enemy)?h:best,null)
        })).filter(({enemy,worker})=>worker&&
          // An observed siege tank can fire from beyond the old fixed 4.5-tile
          // escort trigger. Intercept within its weapon reach plus a short
          // response margin, but never chase beyond the local ore corridor.
          dist(enemy,worker)<=Math.min(7,Math.max(4.5,this.stat(enemy,'range')+1.4)))
        .sort((a,b)=>{
          // Protect the worker from the most dangerous *observed* attack first.
          // A siege tank approaching firing range can be more dangerous than
          // a closer rifleman. No last-known or hidden contacts are considered.
          const danger=({enemy,worker})=>{
            const approach=Math.max(0,dist(enemy,worker)-this.stat(enemy,'range'));
            return this.stat(enemy,'damage')/Math.max(.5,this.stat(enemy,'rate'))-
              approach*6;
          };
          return danger(b)-danger(a)||dist(a.enemy,a.worker)-dist(b.enemy,b.worker)||
            a.enemy.id-b.enemy.id;
        });
      let escorts=0;
      for(const {enemy,worker} of oreThreats){
        if(escorts>=2)break;
        if(committed.has(enemy.id))continue;
        const siege=this.stat(enemy,'range')>=4.5;
        // Only an observed, actual shot at a worker may call in an escort
        // from the slightly wider reserve radius. The ordinary AI tick and
        // other ore threats keep the original 8.5/9-tile limits.
        const urgent=enemy.id===urgentHarvesterShooterId;
        const candidates=[...available.values()].filter(u=>
          dist(u,enemy)<=(urgent?11:8.5)&&dist(u,worker)<=(urgent?11:9)&&
          (u.order?.type!=='attackMove'||dist(u,enemy)<=4.5))
          .sort((a,b)=>{
            // Prioritise armour able to contest a siege firing line; retain
            // nearest-first selection against ordinary short-range threats.
            const score=u=>dist(u,enemy)-(siege?Math.min(3.5,
              Math.max(0,this.stat(u,'range')-3)*1.4+
              this.stat(u,'damage')/16):0);
            return score(a)-score(b)||dist(a,enemy)-dist(b,enemy)||a.id-b.id;
          });
        // A single long-range siege tank can kill a worker while its lone
        // escort trades shots. Concentrate up to two *already nearby* guards
        // on that one threat, without exceeding the existing global escort
        // budget or pulling units away from the base. A rifle threat still
        // receives one escort; neither case uses hidden enemy information.
        // Share the two-escort budget across distinct threats when several
        // workers or attackers are endangered. Preserve two-on-one siege
        // concentration when there is only one unassigned ore threat.
        // Reserve the second escort only for another threat that a remaining
        // defender can actually reach. An observed attacker across the map
        // must not prevent two nearby guards from stopping a lone siege tank.
        const otherCandidates=oreThreats.filter(({enemy:other})=>
          other.id!==enemy.id&&!committed.has(other.id))
          .map(({enemy:other,worker:otherWorker})=>
            [...available.values()].filter(u=>
              dist(u,other)<=8.5&&dist(u,otherWorker)<=9&&
              (u.order?.type!=='attackMove'||dist(u,other)<=4.5)))
          .filter(list=>list.length);
        // If one defender is the ONLY eligible escort for another visible
        // ore threat, avoid consuming it on this threat when another local
        // guard can handle the current one. Otherwise a second tank can
        // remain idle while a different harvester goes undefended.
        const uniqueOther=otherCandidates.find(list=>list.length===1&&
          candidates.some(u=>u.id===list[0].id))?.[0];
        const preferred=uniqueOther&&candidates.length>1?
          candidates.filter(u=>u.id!==uniqueOther.id):candidates;
        const needed=siege&&!otherCandidates.length?2:1;
        for(const escort of preferred.slice(0,Math.min(needed,2-escorts))){
          assign(escort,enemy);escorts++;
        }
      }
      // Remaining combatants share target intentions. Prefer vulnerable,
      // threatening contacts while penalising projected overkill and the
      // number of assigned attackers. Never replace a completed squad rally
      // with an enemy outside local tactical detection.
      for(const fighter of [...available.values()].sort((a,b)=>a.id-b.id)){
        const detection=Math.max(6.5,this.stat(fighter,'range')+1.5);
        const targets=visible.filter(enemy=>dist(fighter,enemy)<=detection);
        if(!targets.length)continue;
        const rank=enemy=>{
          const already=committed.get(enemy.id)||0;
          const future=already+this.stat(fighter,'damage');
          const excess=Math.max(0,future-enemy.hp);
          const baseThreat=structures.some(b=>dist(b,enemy)<7)?2.8:0;
          return baseThreat+Math.min(2.5,this.stat(enemy,'damage')/15)+
            (1-enemy.hp/enemy.maxHp)*2.0-dist(fighter,enemy)*.32-
            excess/Math.max(25,enemy.maxHp)*5.0-
            Math.max(0,already-enemy.hp*.75)/Math.max(25,enemy.maxHp)*4.0;
        };
        targets.sort((a,b)=>rank(b)-rank(a)||a.id-b.id);
        assign(fighter,targets[0]);
      }
      // Apply all assignments after planning, rather than overwriting orders
      // once for every nearby intruder in a loop.
      for(const [id,targetId] of assignments){
        const unit=this.entityById(id);
        if(unit&&unit.hp>0)unit.order={type:'attack',id:targetId};
      }
      return assignments;
    }
    resumeAIRallyOrders(plan,members){
      // Tactical defense may interrupt a squad's rally order. Once combat
      // ends, resume the ORIGINAL assigned slot instead of waiting until the
      // entire staging plan expires. Never interrupt an observed engagement.
      if(plan?.phase!=='rally')return;
      for(const unit of members){
        const index=plan.ids.indexOf(unit.id),spot=plan.slots[index];
        if(!spot||dist(unit,spot)<=1.8||unit.engaging)continue;
        const order=unit.order;
        if(order?.type==='attack'){
          const enemy=this.entityById(order.id);
          if(enemy&&enemy.hp>0&&this.sideCanSee(1,enemy))continue;
        }
        if(order?.type==='move'&&dist(order,spot)<.5)continue;
        unit.order={type:'move',x:spot.x,y:spot.y};
        unit.path=[];unit.pathTarget=null;unit.pathGoal=null;
        unit.pathRecheck=0;unit.yieldOrder=null;unit.laneWaiting=null;
        this.aiRallyResumes=(this.aiRallyResumes||0)+1;
      }
    }
    resumeAISiegeAdvance(plan,members){
      // Direct-fire orders become unusable when a structure leaves AI sight
      // or dies. Rejoin the last *reported* objective, not hidden live data.
      if(plan?.phase!=='assault')return;
      const claimed=[];
      for(let i=0;i<members.length;i++){
        const unit=members[i],order=unit.order;
        if(order?.type==='attackMove'){
          claimed.push(order);continue;
        }
        if(order?.type==='attack'){
          const target=this.entityById(order.id);
          if(target&&this.sideCanSee(1,target))continue;
        }
        const flank=this.chooseFlank(unit,plan.target,i,null,claimed);
        if(!flank)continue;
        claimed.push(flank);
        unit.order={type:'attackMove',x:flank.x,y:flank.y};
        unit.path=[];unit.pathTarget=null;unit.pathGoal=null;
        unit.pathRecheck=0;
      }
    }
    coordinateAISiegeFocus(fighters,engagements=new Map(),threatened=false){
      // Direct siege orders require ACTUAL AI line of sight. Remembered
      // reports permit navigation only, not magically attacking hidden objects.
      const assigned=new Map();
      if(threatened)return assigned;
      const targets=this.entities.filter(e=>e.owner===0&&e.type==='building'&&
        e.hp>0&&e.built&&this.sideCanSee(1,e));
      if(!targets.length)return assigned;
      const incoming=new Map(),planned=new Map();
      for(const shot of this.projectiles){
        if(shot.owner===1&&!shot.expired)
          incoming.set(shot.targetId,(incoming.get(shot.targetId)||0)+shot.damage);
      }
      const squads=[this.aiPlatoon,this.aiSupportPlatoon].filter(p=>p?.phase==='assault');
      for(const squad of squads){
        const members=squad.ids.map(id=>fighters.find(u=>u.id===id))
          .filter(u=>u&&u.hp>0&&u.built&&u.kind!=='recon'&&
            u.kind!=='harvester'&&!engagements.has(u.id)&&
            (u.retreatUntil||0)<=this.time&&
            (u.retreatCooldownAt||0)<=this.time);
        for(const unit of members){
          const range=this.stat(unit,'range');
          const options=targets.filter(b=>dist(unit,b)<=Math.max(6,range+1.8));
          if(!options.length)continue;
          const score=b=>{
            const pending=(planned.get(b.id)||0)+(incoming.get(b.id)||0);
            const waste=Math.max(0,pending+this.stat(unit,'damage')-b.hp);
            const priority=['turret','beam','flak'].includes(b.kind)?48:
              b.id===squad.targetId?30:
              ['factory','refinery','tech'].includes(b.kind)?22:15;
            return priority+(b.id===squad.targetId?10:0)-
              dist(unit,b)*1.8+(1-b.hp/b.maxHp)*8-
              waste/Math.max(20,b.maxHp)*75;
          };
          options.sort((a,b)=>score(b)-score(a)||a.id-b.id);
          const target=options[0];
          planned.set(target.id,(planned.get(target.id)||0)+this.stat(unit,'damage'));
          assigned.set(unit.id,target.id);
          if(unit.order?.type!=='attack'||unit.order.id!==target.id){
            unit.order={type:'attack',id:target.id};
            this.aiSiegeOrders=(this.aiSiegeOrders||0)+1;
          }
        }
      }
      return assigned;
    }
    scoutWaypoints(){
      // Public terrain landmarks only: no opponent entity coordinates or
      // hidden-world state. A reconnaissance loop visits distant sectors so
      // a passive ore-only patrol cannot leave the opposing base unscouted.
      const sectors=[[21,21],[13,13],[7,7],[8,26],[26,8],[26,26],[13,22],[22,13]];
      const ore=(MAPS[this.settings.map]||MAPS.verdant).ore;
      const scale=WORLD_SIZE/34;
      return [...sectors.map(([x,y])=>[Math.round(x*scale),Math.round(y*scale)]),...ore]
        .map(([x,y])=>({x,y}));
    }
    updateAISurvey(){
      // Separate AI map memory. Never access the player's fog, hidden enemy
      // coordinates, or last-seen opponent data while updating exploration.
      if(!this.aiExplored)this.aiExplored=new Set();
      for(const scout of this.entities){
        if(scout.owner!==1||scout.hp<=0||!scout.built)continue;
        const radius=scout.kind==='recon'?8.1:scout.type==='building'?5.8:4.8;
        for(let x=Math.max(0,Math.floor(scout.x-radius));x<=Math.min(WORLD_SIZE-1,Math.ceil(scout.x+radius));x++){
          for(let y=Math.max(0,Math.floor(scout.y-radius));y<=Math.min(WORLD_SIZE-1,Math.ceil(scout.y+radius));y++){
            if((x-scout.x)**2+(y-scout.y)**2<=radius*radius)this.aiExplored.add(x+','+y);
          }
        }
      }
    }
    scoutSurveyValue(point){
      if(!this.aiExplored)this.aiExplored=new Set();
      // Estimate how many passable unsurveyed cells an observer would reveal.
      // This calculation depends only on terrain and the AI's own memory.
      let unseen=0;
      const rad=7;
      for(let x=Math.max(1,Math.floor(point.x-rad));x<=Math.min(WORLD_SIZE-2,Math.ceil(point.x+rad));x++){
        for(let y=Math.max(1,Math.floor(point.y-rad));y<=Math.min(WORLD_SIZE-2,Math.ceil(point.y+rad));y++){
          if((x-point.x)**2+(y-point.y)**2>rad*rad)continue;
          if(!this.aiExplored.has(x+','+y)&&!this.water(x,y))unseen++;
        }
      }
      return unseen;
    }
    scoutThreatPenalty(point){
      // Use ONLY the AI's own timestamped sensor reports, never the live
      // positions of unseen player units or the player's explored map.
      let penalty=0;
      for(const report of this.intel?.[1]||[]){
        if(!Number.isFinite(report.time)||!Number.isFinite(report.x)||!Number.isFinite(report.y))continue;
        const age=this.time-report.time;
        if(age<0||age>(report.type==='building'?180:12))continue;
        if(report.type==='building'&&!['turret','beam'].includes(report.kind))continue;
        if(report.type==='unit'&&['harvester','recon'].includes(report.kind))continue;
        const radius=report.type==='building'?(report.kind==='beam'?8:7):5;
        const separation=dist(point,report);
        if(separation<radius)penalty+=200+(radius-separation)*25;
        else if(separation<radius+2)penalty+=(radius+2-separation)*20;
      }
      return penalty;
    }
    scoutPath(scout,point,cache=new Map(),avoidUnit=null){
      // Path and movement A* use the same sensor-only risk weights.
      const risk=p=>{
        const k=p.x+','+p.y;
        if(!cache.has(k))cache.set(k,this.scoutThreatPenalty(p));
        return cache.get(k);
      };
      const startRisk=risk(scout);
      let path=this.findPath(scout.x,scout.y,point.x,point.y,avoidUnit,
        p=>risk(p)/25);
      if(!path.length||dist(path.at(-1),point)>1)return null;
      // A cheap weighted route may cross a known defended tile despite a
      // longer safe detour. Retry once with a prohibitive hazard cost.
      if(startRisk<200&&path.some(p=>risk(p)>=200)){
        const safe=this.findPath(scout.x,scout.y,point.x,point.y,avoidUnit,
          p=>risk(p)>=200?10000:risk(p)/25);
        if(!safe.length||dist(safe.at(-1),point)>1||
           safe.some(p=>risk(p)>=200))return null;
        path=safe;
      }
      let exposure=0,worst=0;
      for(const p of path){
        const value=risk(p);
        exposure+=value/25;
        worst=Math.max(worst,value);
      }
      // Avoid known defended corridors, but permit escape from danger.
      if(startRisk<200&&worst>=200)return null;
      if(startRisk>=200&&(worst>startRisk+40||
        risk(path.at(-1))>=startRisk))return null;
      return {path,exposure,worst};
    }
    scoutEscape(scout){
      // Retreat only from threats in AI-owned sensor reports.
      const danger=this.scoutThreatPenalty(scout);
      if(danger<200)return false;
      if(scout.order?.type==='move'&&this.scoutThreatPenalty(scout.order)<danger&&
         this.scoutPath(scout,scout.order))return true;
      const hq=this.entities.find(e=>e.owner===1&&e.kind==='hq'&&e.hp>0);
      const seen=new Set(),possibilities=[];
      // Bound radial escape sampling and path computations.
      for(const radius of [4,7,10,13])for(let bearing=0;bearing<12;bearing++){
        const theta=bearing*Math.PI/6;
        const x=Math.round(scout.x+Math.cos(theta)*radius);
        const y=Math.round(scout.y+Math.sin(theta)*radius);
        const key=x+','+y;
        if(seen.has(key)||!this.walkable(x,y))continue;
        seen.add(key);
        const point={x,y},risk=this.scoutThreatPenalty(point);
        if(risk>=danger-35)continue;
        possibilities.push({point,risk,
          guess:risk*2+dist(point,scout)*2+(hq?dist(point,hq)*.2:0)});
      }
      possibilities.sort((a,b)=>a.guess-b.guess||
        a.point.x-b.point.x||a.point.y-b.point.y);
      let best=null,bestScore=-Infinity;
      const cache=new Map();
      for(const option of possibilities.slice(0,12)){
        const route=this.scoutPath(scout,option.point,cache);
        if(!route)continue;
        const score=(danger-option.risk)*1.5-route.path.length*2-
          route.exposure-(hq?dist(option.point,hq)*.2:0);
        if(score>bestScore){best=option.point;bestScore=score;}
      }
      if(!best)return false;
      scout.order={type:'move',x:best.x,y:best.y};
      scout.path=[];scout.pathTarget=null;scout.pathGoal=null;
      scout.pathRecheck=0;scout.yieldOrder=null;scout.laneWaiting=null;
      scout.retreatUntil=Math.max(scout.retreatUntil||0,this.time+8);
      scout.retreatCooldownAt=Math.max(scout.retreatCooldownAt||0,this.time+14);
      return true;
    }
    scoutAdvanceScore(point,unseen){
      // Search beyond friendly territory before the first enemy building
      // is actually seen. Only our own HQ and survey memory influence it.
      if(unseen<5||(this.intel?.[1]||[]).some(r=>
        r.type==='building'&&Number.isFinite(r.time)&&
        this.time>=r.time&&this.time-r.time<=180))return 0;
      const home=this.entities.find(e=>e.owner===1&&e.kind==='hq'&&e.hp>0);
      if(!home)return 0;
      return Math.min(65,Math.max(0,dist(home,point)-8)*2.8)*
        Math.min(1,unseen/20);
    }
    scoutFrontiers(scout,reservations=[]){
      // Generate potential survey positions from this AI's own explored cells,
      // not static mission waypoints or hidden player entity coordinates.
      if(!this.aiExplored?.size)return [];
      const candidates=[];
      for(let x=2;x<=WORLD_SIZE-2;x+=2)for(let y=2;y<=WORLD_SIZE-2;y+=2){
        const p={x,y};
        if(!this.aiExplored.has(x+','+y)||this.water(x,y))continue;
        if(dist(scout,p)<2.5||reservations.some(q=>dist(q,p)<4.1))continue;
        if(!this.walkable(x,y))continue;
        const risk=this.scoutThreatPenalty(p);
        if(risk>=200)continue;
        const unseen=this.scoutSurveyValue(p);
        if(unseen<5)continue;
        candidates.push({point:p,unseen,estimate:unseen*1.7+this.scoutAdvanceScore(p,unseen)-dist(scout,p)*.85-risk});
      }
      // Bounded A* cost: pathcheck only the 14 best sightline opportunities.
      return candidates.sort((a,b)=>b.estimate-a.estimate||
        a.point.x-b.point.x||a.point.y-b.point.y).slice(0,14);
    }
    assignScoutPatrol(scout){
      const waypoints=this.scoutWaypoints();
      const preferred=waypoints.length?
        ((scout.patrolIndex||0)%waypoints.length+waypoints.length)%waypoints.length:0;
      const reservations=this.entities.filter(u=>u.id!==scout.id&&u.owner===1&&
        u.kind==='recon'&&u.hp>0&&u.order?.type==='move').map(u=>u.order);
      const options=[],riskCache=new Map();
      for(let offset=0;offset<waypoints.length;offset++){
        const index=(preferred+offset)%waypoints.length,point=waypoints[index];
        if(!this.walkable(point.x,point.y))continue;
        if(dist(scout,point)<2)continue;
        if(reservations.some(goal=>dist(goal,point)<4.1))continue;
        const risk=this.scoutThreatPenalty(point);
        if(risk>=200)continue;
        const route=this.scoutPath(scout,point,riskCache);
        if(!route)continue;
        const unseen=this.scoutSurveyValue(point);
        const score=unseen*1.5+this.scoutAdvanceScore(point,unseen)-
          route.path.length*.95-offset*.08-risk-route.exposure;
        options.push({index,point,score,unseen});
      }
      for(const frontier of this.scoutFrontiers(scout,reservations)){
        const route=this.scoutPath(scout,frontier.point,riskCache);
        if(!route)continue;
        options.push({index:null,point:frontier.point,unseen:frontier.unseen,
          score:frontier.unseen*1.7+this.scoutAdvanceScore(frontier.point,frontier.unseen)-
            route.path.length*.9+1-
            this.scoutThreatPenalty(frontier.point)-route.exposure});
      }
      if(!options.length){scout.order=null;return false;}
      options.sort((a,b)=>b.score-a.score||b.unseen-a.unseen||
        (a.index??999)-(b.index??999));
      const chosen=options[0];
      scout.patrolIndex=waypoints.length?
        ((chosen.index===null?preferred:chosen.index)+1)%waypoints.length:0;
      scout.order={type:'move',x:chosen.point.x,y:chosen.point.y};
      return true;
    }
    coordinateAIAirWing(aircraft,knowledge,base,invaders=[]){
      // Air strikes use the AI's own sensor reports, never unseen live enemy positions.
      // Aircraft patrol unexplored terrain only when no reported objective exists.
      const planes=aircraft.filter(e=>e.hp>0&&e.built&&!e.rearming&&
        (e.ammo??UNITS.aircraft.ammo)>0);
      const threats=invaders.filter(e=>e.hp>0&&this.sideCanSee(1,e));
      const objectives=this.rankAIObjectives(knowledge,base);
      const claimed=[];
      for(let i=0;i<planes.length;i++){
        const plane=planes[i];
        const threat=threats.length?[...threats].sort((a,b)=>
          dist(plane,a)-dist(plane,b)||a.id-b.id)[0]:null;
        if(threat){
          if(plane.order?.type!=='attack'||plane.order.id!==threat.id)
            plane.order={type:'attack',id:threat.id};
          continue;
        }
        if(objectives.length){
          const report=objectives[i%objectives.length];
          // A report is navigation intel, not permission to fire at a hidden entity.
          const visible=this.entities.find(e=>e.id===report.id&&e.hp>0&&
            e.owner===0&&this.sideCanSee(1,e));
          const order=visible?{type:'attack',id:visible.id}:
            {type:'attackMove',x:report.x,y:report.y};
          if(plane.order?.type!==order.type||
             (order.type==='attack'?plane.order.id!==order.id:
              Math.hypot(plane.order.x-order.x,plane.order.y-order.y)>.5))
            plane.order=order;
          continue;
        }
        // Retain useful patrols; reassign only after reaching them or when
        // they become unsafe. No enemy-base coordinates are consulted.
        if(plane.order?.type==='move'&&dist(plane,plane.order)>1.2&&
          this.scoutThreatPenalty(plane.order)<200&&
          this.scoutSurveyValue(plane.order)>3){
          claimed.push(plane.order);continue;
        }
        let best=null,bestScore=-Infinity;
        for(let x=3;x<WORLD_SIZE-2;x+=4)for(let y=3;y<WORLD_SIZE-2;y+=4){
          const point={x,y},unseen=this.scoutSurveyValue(point);
          if(unseen<5||claimed.some(p=>dist(p,point)<5))continue;
          const risk=this.scoutThreatPenalty(point);
          if(risk>=200)continue;
          const score=unseen*1.8+this.scoutAdvanceScore(point,unseen)-
            dist(plane,point)*.75-risk;
          if(score>bestScore){best=point;bestScore=score;}
        }
        if(best){
          plane.order={type:'move',x:best.x,y:best.y};
          claimed.push(best);
        }else plane.order=null;
      }
    }
    runAI(){
      const side=1,me=this.players[side],base=this.entities.find(e=>e.owner===side&&e.kind==='hq'&&e.hp>0);
      if(!base)return;
      const knowledge=this.updateIntel(side);
      // The enemy now earns resources through the same refinery/harvester loop
      // as the player. Difficulty changes timing and priorities, not free income.
      const owned=kind=>this.entities.filter(e=>e.owner===side&&e.kind===kind&&e.hp>0);
      const built=kind=>owned(kind).filter(e=>e.built).length;
      const myBuildings=this.entities.filter(e=>e.owner===side&&e.type==='building'&&e.hp>0&&e.built);
      const invaders=this.entities.filter(e=>e.owner===0&&e.type==='unit'&&e.hp>0&&e.kind!=='harvester'&&myBuildings.some(b=>dist(b,e)<8)&&this.sideCanSee(side,e));
      const threatened=invaders.length>0;
      for(const b of myBuildings){
        if(b.hp/b.maxHp<.58&&me.credits>550)b.repairing=true;
      }
      const shortage=this.power(side).low;
      // Distinct, recent, faction-observed aircraft only; no omniscient intel.
      const airThreatCount=new Set(knowledge.filter(r=>
        r.type==='unit'&&r.kind==='aircraft'&&Number.isInteger(r.id)&&
        Number.isFinite(r.time)&&r.time<=this.time&&this.time-r.time<=28
      ).map(r=>r.id)).size;
      const skyguardGoal=Math.min(2,airThreatCount);
      // A refinery without a living ore truck has no sustainable income.
      // Reserve the next affordable production slot for a paid replacement
      // before buying optional technology, factory, radar or aviation.
      // Brownout recovery and observed base defense still take precedence.
      const oreRecoveryNeeded=built('refinery')&&!owned('harvester').length;
      // If the last ore truck dies while another unit is still in a PAID
      // production queue, the AI can be stranded below the 900-credit
      // replacement cost. Only cancel an optional queued unit if its exact
      // prepaid cost makes one replacement affordable. Do not cancel under
      // observed base attack, brownout, or when a harvester is already queued.
      // No free credits, new save fields, or changes to player queues.
      if(oreRecoveryNeeded&&!threatened&&!shortage&&
         me.credits<UNITS.harvester.cost&&
         !this.queues.some(q=>q.side===side&&q.key==='harvester')){
        const index=this.queues.findIndex(q=>q.side===side&&
          q.key!=='harvester'&&UNITS[q.key]&&
          me.credits+UNITS[q.key].cost>=UNITS.harvester.cost);
        if(index>=0){
          const [cancelled]=this.queues.splice(index,1);
          const refund=UNITS[cancelled.key].cost;
          me.credits+=refund;
          this.stats[side].creditsSpent-=refund;
        }
      }
      // A fully stranded ore economy can liquidate ONE completed, optional
      // AI structure at the same 50% resale rate offered to the player.
      // Only do so if that single sale can fully fund a real replacement
      // harvester, after any paid-queue recovery opportunity has passed.
      // Preserve refineries, generators, HQ, defenses, and active production;
      // never sell during a visible attack or power shortage.
      if(oreRecoveryNeeded&&!threatened&&!shortage&&
         me.credits<UNITS.harvester.cost&&
         !this.queues.some(q=>q.side===side)){
        const disposable=['tech','airfield','factory'];
        const asset=disposable.map(kind=>owned(kind).find(b=>b.built))
          .find(b=>b&&me.credits+Math.floor(BUILD[b.kind].cost*.5)>=UNITS.harvester.cost);
        if(asset){
          const refund=Math.floor(BUILD[asset.kind].cost*.5);
          me.credits+=refund;
          this.recordLoss(asset,null,true);
          asset.hp=0;asset.repairing=false;
        }
      }
      // A critically damaged last worker risks total income loss. When safe
      // and solvent, buy one paid backup even after the early expansion window.
      // Preserve the emergency generator reserve and all threat priorities.
      const soleHarvester=owned('harvester');
      const criticalHarvester=built('refinery')&&soleHarvester.length===1&&
        soleHarvester[0].hp/soleHarvester[0].maxHp<.45&&
        !threatened&&!shortage&&
        me.credits>=UNITS.harvester.cost+BUILD.generator.cost;
      const aviationReady=!oreRecoveryNeeded&&!criticalHarvester&&!owned('airfield').length&&built('factory')&&
        built('radar')&&this.time>130;
      // Once an airfield is purchased, keep the aviation budget intact until
      // the first two planes are deployed. Never bank at the expense of a
      // harvester, basic ground cover, radar recovery or immediate defense.
      // An Air Command was purchased behind a two-tank screen. If one tank
      // falls before the first sortie, keep banking for air support instead
      // of draining the budget on optional scouts, turrets or specialists.
      // A completely lost ground screen still permits normal recruitment.
      const aviationInvestment=!criticalHarvester&&owned('airfield').length>0&&built('radar')&&
        owned('aircraft').length<2&&owned('harvester').length>0&&
        owned('tank').length+owned('heavy').length>=1&&!threatened;
      // An unfinished generator already represents paid brownout recovery.
      // Wait for it to come online rather than buying duplicate generators.
      const generatorPending=owned('generator').some(b=>!b.built);
      let choice=null;
      if(!owned('generator').length||shortage){
        if(!generatorPending)choice='generator';
      }else if(!owned('refinery').length)choice='refinery';
      else if(threatened&&built('turret')<2&&me.credits>=BUILD.turret.cost+300)choice='turret';
      // Do not strand a lost harvester behind an optional building purchase:
      // an Air Command would leave only 650 of the 900 credits needed to
      // restore ore income at the usual 2,400-credit investment threshold.
      else if(oreRecoveryNeeded||criticalHarvester)choice=null;
      else if(!owned('factory').length)choice='factory';
      // Radar costs 900; a 2,600-credit gate stranded otherwise solvent AI
      // bases after the second harvester purchase. Keep a generator reserve.
      else if(!owned('radar').length&&
        me.credits>=BUILD.radar.cost+BUILD.generator.cost)choice='radar';
      else if(skyguardGoal>0&&built('radar')&&owned('flak').length<skyguardGoal&&
        me.credits>=BUILD.flak.cost+500)choice='flak';
      // Air Command requires factory + radar, not optional Technology Lab.
      // Keep enough cash for an emergency generator after buying aviation.
      // A detected invasion must never be answered with optional aviation
      // construction. Preserve the credits for immediate base defense and
      // resume normal Air Command investment once the threat is gone.
      else if(aviationReady&&!threatened&&
        me.credits>=BUILD.airfield.cost+BUILD.generator.cost)choice='airfield';
      else if(!owned('tech').length&&this.prereq(side,'tech')&&
        me.credits>4000&&!aviationInvestment)choice='tech';
      else if(built('factory')&&built('turret')<(this.settings.difficulty==='veteran'?2:1)&&
        me.credits>2200&&!aviationReady&&!aviationInvestment)choice='turret';
      if(choice&&this.prereq(side,choice)&&me.credits>=BUILD[choice].cost){
        const anchor=choice==='turret'&&threatened?
          (this.nearest(base,b=>b.owner===0&&b.type==='unit'&&b.kind!=='harvester'&&this.sideCanSee(side,b))||base):base;
        // Try the HQ first, then established outposts. The old HQ-only search
        // stalled all later tech construction once its local ring filled up.
        // Threatened turret placement keeps its nearest-frontline anchor.
        const origins=anchor===base?[base,...myBuildings.filter(b=>b.id!==base.id)]:
          [myBuildings.reduce((p,b)=>dist(anchor,b)<dist(anchor,p)?b:p,base)];
        construction: for(const origin of origins){
          for(let j=0;j<48;j++){
            const angle=j*2.39996,radius=4.2+Math.floor(j/8)*.85;
            const x=Math.round(origin.x+Math.cos(angle)*radius),y=Math.round(origin.y+Math.sin(angle)*radius);
            if(!this.canPlace(x,y,side))continue;
            me.credits-=BUILD[choice].cost;this.stats[side].creditsSpent+=BUILD[choice].cost;
            const b=this.add(side,choice,x,y,false);b.buildTime=3.5+BUILD[choice].cost/650;
            break construction;
          }
        }
      }
      // Keep a small defensive army, then bank for aviation instead of
      // spending every income delivery on another tank or optional turret.
      // Under a visible local attack, unit recruitment resumes immediately.
      // A single surviving tank is enough to keep a safe, radar-equipped
      // economy saving for its first Air Command. Requiring two permanently
      // restarted cheap recruitment after ordinary front-line attrition.
      // Zero armour or a visible invasion still releases the reserve.
      const savingForAirfield=aviationReady&&!threatened&&
        me.credits<BUILD.airfield.cost+BUILD.generator.cost&&
        owned('harvester').length>0&&
        owned('tank').length+owned('heavy').length>=1;
      // Rebuilding a lost radar is a prerequisite for aviation. While a
      // powered, defended economy is saving its 900-credit radar cost plus
      // the 650-credit generator reserve, defer optional unit purchases.
      // Continue banking through construction; release the reserve when
      // threatened, short of power, without income or without ground cover.
      // Radar unlocks Air Command after 130 seconds; banking only after
      // 240 left a 110-second window for optional recruitment to drain
      // otherwise viable radar funding. Keep the same defensive overrides.
      const savingForRadar=!criticalHarvester&&this.time>130&&!built('radar')&&
        built('factory')&&built('refinery')&&
        owned('harvester').length>0&&
        owned('tank').length+owned('heavy').length>0&&
        !threatened&&!shortage&&
        (owned('radar').length>0||
          me.credits<BUILD.radar.cost+BUILD.generator.cost);
      const savingForAircraft=aviationInvestment&&
        (!built('airfield')||shortage||
          me.credits<UNITS.aircraft.cost+BUILD.generator.cost);
      // A second *paid* early harvester improves sustainable income instead
      // of leaving the AI dependent on one ore truck for the whole match.
      // Never interrupt an aviation reserve, emergency defense or brownout,
      // and stop at two to avoid a runaway economy/traffic loop.
      const expandingOreEconomy=this.time<=120&&!threatened&&!shortage&&
        !owned('airfield').length&&!savingForAirfield&&
        built('refinery')&&owned('harvester').length===1&&
        me.credits>=UNITS.harvester.cost+BUILD.generator.cost;
      if(!this.queues.some(q=>q.side===side)&&
        !savingForAirfield&&!savingForAircraft&&!savingForRadar){
        let unit='soldier';
        if(!owned('harvester').length&&built('refinery'))unit='harvester';
        else if(criticalHarvester)unit='harvester';
        else if(expandingOreEconomy)unit='harvester';
        else if(aviationInvestment&&built('airfield')&&!shortage&&
          me.credits>=UNITS.aircraft.cost+BUILD.generator.cost)unit='aircraft';
        else if(built('factory')&&!owned('recon').length&&me.credits>=UNITS.recon.cost+650)unit='recon';
        else if(built('radar')&&built('barracks')&&!owned('specialist').length&&me.credits>=1400)unit='specialist';
        // Retain the older late-game purchase path for depleted ground armies:
        // those bases cannot bank safely, but may still buy a plane once rich.
        else if(built('airfield')&&owned('aircraft').length<2&&
          me.credits>=UNITS.aircraft.cost+BUILD.generator.cost&&
          this.time>240&&!threatened&&!shortage)unit='aircraft';
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
        const threat=this.nearest(specialist,u=>u.owner===0&&u.type==='unit'&&u.hp>0&&this.sideCanSee(side,u),8);
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
        // Wounded reconnaissance units must not be reassigned while their
        // existing retreat / recovery cooldown is still active.
        if((scout.retreatUntil||0)>this.time||
           (scout.retreatCooldownAt||0)>this.time)continue;
        const endangered=this.entities.filter(u=>u.owner===side&&u.kind==='harvester'&&u.hp>0)
          .map(h=>({h,threat:this.nearest(h,e=>e.owner===0&&e.type==='unit'&&e.hp>0&&this.sideCanSee(side,e),5.5)}))
          .find(pair=>pair.threat);
        if(endangered){
          scout.order={type:'attack',id:endangered.threat.id};
          continue;
        }
        if(scout.order?.type==='attack'&&this.entityById(scout.order.id))continue;
        // Harvester defense and active combat orders take priority over evasion.
        if(this.scoutEscape(scout))continue;
        // Explore distant map sectors, skipping lakes and disconnected
        // routes. Patrol destinations are map data, never unseen enemies.
        if(scout.order?.type==='move'&&dist(scout,scout.order)>1.5){
          // New sensor contacts can invalidate a once-safe destination.
          // Preserve orders only when the endpoint is still reasonably safe.
          if(this.scoutThreatPenalty(scout.order)<200&&
            this.scoutPath(scout,scout.order))continue;
          scout.order=null;scout.path=[];scout.pathTarget=null;
          scout.pathRecheck=0;
        }
        this.assignScoutPatrol(scout);
        // Contact is recorded only after actual line-of-sight discovery.
        const spotted=this.nearest(scout,e=>e.owner===0&&e.type==='unit'&&e.hp>0&&this.sideCanSee(side,e),8);
        if(spotted)scout.lastContact={x:spotted.x,y:spotted.y,time:this.time,kind:spotted.kind};
      }
      // Local defense takes precedence; only platoons that have assembled
      // receive an offensive order. Scouts continue their own ore patrols.
      this.coordinateAIAirWing(owned('aircraft'),knowledge,base,invaders);
      // Airborne units have independent orders; never assign them ground-only rally slots.
      const fighters=this.entities.filter(e=>e.owner===side&&e.type==='unit'&&e.hp>0&&
        e.kind!=='harvester'&&e.kind!=='aircraft');
      const wounded=this.retreatWoundedAI(fighters,base,side);
      const active=fighters.filter(e=>!wounded.has(e.id));
      const oldAttackers=threatened?new Set([...(this.aiPlatoon?.ids||[]),...(this.aiSupportPlatoon?.ids||[])]):new Set();
      const platoonIds=this.coordinateAIPlatoon(active,knowledge,base,threatened);
      const supportIds=this.coordinateAISupport(active,knowledge,base,threatened,platoonIds);
      const responders=[...active].filter(e=>e.kind!=='recon').sort((a,b)=>a.id-b.id);
      if(threatened){
        for(const fighter of responders){
          if(oldAttackers.has(fighter.id)&&fighter.order?.type==='attackMove')
            fighter.order={type:'move',x:base.x+1.5,y:base.y+1.5};
        }
      }
      const engagements=this.assignAIEngagements(active,invaders,base);
      this.coordinateAISiegeFocus(active,engagements,threatened);
      for(const fighter of active){
        if(engagements.has(fighter.id))continue;
        if(fighter.order?.type==='attack'){
          // Clear expired/out-of-sight direct targets, but leave rally and
          // attack-move orders to the coordinated platoon controllers.
          const enemy=this.entityById(fighter.order.id);
          if(!enemy||enemy.hp<=0||!this.sideCanSee(side,enemy))fighter.order=null;
        }
        if(fighter.kind==='recon'&&fighter.order?.type==='attackMove')continue;
        if(platoonIds.has(fighter.id)||supportIds.has(fighter.id))continue;
        // Unassigned reserves wait for the next genuine scouting contact.
      }
    }
    updateFog(){
      if(!this.fog.length)this.fog=Array.from({length:WORLD_SIZE},()=>Array.from({length:WORLD_SIZE},()=>({seen:false,visible:false})));
      for(const row of this.fog)for(const c of row)c.visible=false;
      for(const e of this.entities){if(e.owner!==0||e.hp<=0||!e.built)continue;const radius=e.kind==='recon'?8.1:e.type==='building'?5.8:4.8;
        const minX=clamp(Math.floor(e.x-radius),0,WORLD_SIZE-1),maxX=clamp(Math.ceil(e.x+radius),0,WORLD_SIZE-1);
        const minY=clamp(Math.floor(e.y-radius),0,WORLD_SIZE-1),maxY=clamp(Math.ceil(e.y+radius),0,WORLD_SIZE-1);
        for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++)if(Math.hypot(x-e.x,y-e.y)<=radius){this.fog[x][y].seen=true;this.fog[x][y].visible=true;}
      }
    }
    isVisible(x,y){const ix=clamp(Math.floor(x),0,WORLD_SIZE-1),iy=clamp(Math.floor(y),0,WORLD_SIZE-1);return !!this.fog[ix]?.[iy]?.visible;}
    playerCanSeeEntity(e){
      // Fog tiles are sampled on an integer grid. At the edge of sight a
      // visible tile may contain an enemy outside the actual sensor radius.
      // Never reveal or allow selection of that hidden enemy.
      return e.owner===0||(this.isVisible(e.x,e.y)&&this.sideCanSee(0,e));
    }
    playerReconSummary(){
      // Player reconnaissance only reads their own fog and sensor reports.
      let seen=0,visible=0,total=0;
      for(const row of this.fog)for(const cell of row){
        total++;if(cell.seen)seen++;if(cell.visible)visible++;
      }
      const contacts=(this.intel?.[0]||[]).filter(c=>Number.isFinite(c.time)&&
        this.time-c.time<=(c.type==='building'?180:28));
      const live=contacts.filter(c=>this.time-c.time<=.65&&this.sideCanSee(0,c));
      const latest=contacts.length?[...contacts].sort((a,b)=>b.time-a.time)[0]:null;
      return {seen,visible,total,percent:total?Math.floor(seen/total*100):0,
        live:live.length,tracked:contacts.length,latest};
    }
    centerIntelContact(id){
      // Jump to the saved report, never the current hidden entity position.
      const report=(this.intel?.[0]||[]).find(c=>c.id===id);
      if(!report||this.state!=='playing')return false;
      const p=iso(report.x,report.y);
      this.camera.x=p.x;this.camera.y=p.y;this.clampCamera();
      this.notify('Camera at last reported position, not live tracking');
      return true;
    }
    checkPlayerThreats(){
      if(this.state!=='playing')return;
      const base=this.entities.find(e=>e.owner===0&&e.kind==='hq'&&e.hp>0);
      if(!base)return;
      if(!this.reconAlerts)this.reconAlerts=new Map();
      const threats=(this.intel?.[0]||[]).filter(c=>c.type==='unit'&&
        this.time-c.time<.4&&dist(c,base)<9&&this.sideCanSee(0,c));
      for(const threat of threats){
        if(this.time-(this.reconAlerts.get(threat.id)??-999)<18)continue;
        this.reconAlerts.set(threat.id,this.time);
        this.pushBattleEvent('alert','Hostile unit spotted near headquarters',threat.x,threat.y,threat.id);
        this.notify('BASE ALERT: hostile unit spotted near headquarters');this.audio?.announce('baseUnderAttack');
        break;
      }
      if(this.reconAlerts.size>40)for(const [id,at] of this.reconAlerts){
        if(this.time-at>60)this.reconAlerts.delete(id);
      }
    }
    pushBattleEvent(kind,message,x,y,refId=null){
      if(!['alert','damage','critical','loss'].includes(kind)||
         !Number.isFinite(x)||!Number.isFinite(y))return false;
      if(!this.battleEvents)this.battleEvents=[];
      const event={id:this.nextBattleEventId++,time:Math.max(0,this.time||0),
        kind,text:String(message).slice(0,100),x:clamp(x,0,WORLD_SIZE),y:clamp(y,0,WORLD_SIZE),
        refId:Number.isInteger(refId)&&refId>0?refId:null};
      this.battleEvents.unshift(event);
      this.battleEvents.length=Math.min(this.battleEvents.length,12);
      return true;
    }
    noteBuildingDamage(building,attackerOwner){
      // Friendly structures are always known. Never reveal the attacker's
      // position or hidden units through a damage notification.
      if(building.owner!==0||building.type!=='building'||attackerOwner===0||building.hp<=0)return;
      if(!this.damageAlerts)this.damageAlerts=new Map();
      const critical=building.hp/building.maxHp<=.3;
      const previous=this.damageAlerts.get(building.id);
      if(previous&&this.time-previous.time<18&&(!critical||previous.critical))return;
      this.damageAlerts.set(building.id,{time:this.time,critical});
      const label=this.name(building);
      this.pushBattleEvent(critical?'critical':'damage',
        label+(critical?' critically damaged':' under attack'),building.x,building.y,building.id);
      this.notify((critical?'CRITICAL: ':'UNDER ATTACK: ')+label);this.audio?.announce('structureUnderAttack');
      if(this.damageAlerts.size>120)for(const [id,entry] of this.damageAlerts){
        if(this.time-entry.time>60)this.damageAlerts.delete(id);
      }
    }
    centerBattleEvent(id){
      const event=this.battleEvents?.find(e=>e.id===id);
      if(!event||this.state!=='playing')return false;
      const p=iso(event.x,event.y);
      this.camera.x=p.x;this.camera.y=p.y;this.clampCamera();
      return true;
    }
    updateBattleEvents(){
      const list=$('battleEventList'),count=$('battleEventCount');
      if(!list||!count)return;
      count.textContent=String(this.battleEvents?.length||0);
      if(!this.battleEvents?.length){
        list.innerHTML='<p class="battleEventQuiet">No tactical events yet.</p>';return;
      }
      list.innerHTML=this.battleEvents.slice(0,8).map(event=>{
        const t=Math.max(0,Math.floor(event.time));
        const clock=String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');
        return '<button type="button" class="battleEventRow '+event.kind+
          '" data-event-id="'+event.id+'" title="Center camera on recorded event position">'+
          '<time>'+clock+'</time><span>'+this.escape(event.text)+'</span><b>⌖</b></button>';
      }).join('');
    }
    updateReconPanel(){
      const panel=$('reconStatus');
      if(!panel||!this.fog.length)return;
      const info=this.playerReconSummary(),report=info.latest;
      let html='<div class="reconTotals"><span>SCOUTED <b>'+info.percent+'%</b></span>'+
        '<span>VISIBLE <b>'+Math.floor(info.visible/Math.max(1,info.total)*100)+'%</b></span></div>'+
        '<div class="reconContacts">ENEMY CONTACTS: <b>'+info.live+' LIVE</b> · '+info.tracked+' RECORDED</div>';
      if(report){
        const age=Math.max(0,Math.floor(this.time-report.time));
        const label=NAMES[this.players[1]?.faction]?.[report.kind]||'Hostile '+report.type;
        html+='<button class="reconContactJump" type="button" data-contact-id="'+report.id+
          '" title="Center camera on last seen position, not live tracking">'+
          this.escape(label)+' · '+(age<1?'NOW':age+'s AGO')+' ⌖</button>';
      }else html+='<span class="reconQuiet">NO ENEMY CONTACT RECORDED</span>';
      panel.innerHTML=html;
    }
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
      if(e.type==='unit'&&e.kind!=='harvester')
        html+='<p class="veterancyInfo">'+this.veterancyName(e)+' · '+(e.kills||0)+
          ' KILLS'+(this.veterancyRank(e)?' · COMBAT BONUSES ACTIVE':'')+'</p>';
      if(e.kind==='recon')html+='<p class="scoutInfo">RECON · extended vision · fast scouting</p>';
      if(e.kind==='aircraft')html+='<p class="scoutInfo">ORDNANCE '+(e.ammo??UNITS.aircraft.ammo)+' / '+UNITS.aircraft.ammo+
        (e.rearming?' · RETURNING / REARMING'+(e.hp<e.maxHp?' · HULL SERVICE AT AIRFIELD':''):'')+'</p>';
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
      $('cancelMode').classList.toggle('hidden',this.state!=='playing'||!(this.placing||this.abilityArmedId||this.attackMoveArmed));
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
      this.updateReconPanel();this.updateBattleEvents();
      for(const b of $('tabs').querySelectorAll('button'))b.classList.toggle('active',b.dataset.tab===this.tab);
      let keys=this.tab==='structures'?['generator','refinery','barracks','factory','radar','tech','airfield']:this.tab==='defenses'?['turret','beam','flak']:this.tab==='infantry'?['soldier','specialist']:['tank','heavy','recon','harvester','aircraft'];
      $('production').innerHTML=keys.map(key=>{const d=BUILD[key]||UNITS[key],ready=this.prereq(0,key),rich=me.credits>=d.cost,q=this.queues.find(q=>q.side===0&&q.key===key);
        const label=NAMES[me.faction][key]||d.name;const available=ready&&rich&&!q;let reason=!ready?'Requires tech':!rich?'Not enough credits':q?'In production':'';
        const preview=(key==='generator'||key==='turret')?'./art/pilot/'+me.faction+'-'+(key==='generator'?'power':'turret')+'.svg':(key==='soldier'||key==='specialist')?'./art/pilot/'+me.faction+'-'+(key==='soldier'?'infantry':'specialist')+'.svg':key==='tank'?'./art/pilot/'+({coalition:'coalition-lynx',federation:'federation-bull',psionic:'psionic-viper'}[me.faction])+'.svg':key==='recon'?'./art/pilot/'+me.faction+'-recon.svg':null;
        const artwork=preview?'<img class="itemAsset" loading="lazy" alt="" src="'+preview+'">':'<span class="itemIcon">'+d.icon+'</span>';
        return '<button class="buildItem '+(!available?'locked ':'')+(this.placing===key?'selectedBuild':'')+'" data-key="'+key+'" '+(!available?'disabled':'')+' title="'+this.escape(label)+' '+this.escape(reason)+'">'+artwork+'<span class="itemTitle">'+this.escape(label)+'</span><span class="itemCost">¤ '+d.cost+'</span>'+(q?'<span class="progress" style="width:'+(q.elapsed/q.total*100)+'%"></span>':'')+'</button>';
      }).join('');
      $('queueList').innerHTML='<div class="queueHeader">ACTIVE PRODUCTION</div>'+this.queues.filter(q=>q.side===0).slice(0,6).map(q=>{
        const pct=Math.min(100,Math.max(0,Math.round(q.elapsed/q.total*100)));const name=this.escape(this.name({owner:0,kind:q.key}));
        const label=q.blockedReason==='producer'?' · PRODUCER OFFLINE':q.blockedReason==='exit'?' · EXIT BLOCKED':'';
        return '<div class="queueEntry"><span class="name">'+name+label+'</span><span class="percent">'+pct+'%</span><button data-cancel-key="'+q.key+'" title="Cancel and refund full production cost">×</button><div class="track"><div class="bar" style="width:'+pct+'%"></div></div></div>';
      }).join('')+(this.queues.some(q=>q.side===0)?'':'<div class="queueEmpty">No units in production</div>');
      this.updateSelection();
    }
    newStats(){
      return {oreHarvested:0,creditsSpent:0,unitsDeployed:0,buildingsConstructed:0,unitsLost:0,buildingsLost:0,enemyUnitsDestroyed:0,enemyBuildingsDestroyed:0,damageDealt:0,buildingsSold:0};
    }
    recordLoss(entity,attackerOwner=null,sold=false){
      if(!entity||entity.lossRecorded)return;
      entity.lossRecorded=true;
      if(entity.owner===0&&entity.type==='building'&&!sold){
        this.pushBattleEvent('loss',this.name(entity)+' destroyed',entity.x,entity.y,entity.id);
        this.damageAlerts?.delete(entity.id);
        this.notify('STRUCTURE LOST: '+this.name(entity));this.audio?.announce('structureLost');
      }
      if(entity.type==='building'&&!sold){
        const palette=COLORS[this.players[entity.owner]?.faction]?.top||'#7e8790';
        for(let i=0;i<7;i++){
          const a=i*Math.PI*2/7+entity.id*.07;
          this.particles.push({type:'debris',x:entity.x,y:entity.y,life:1.2,
            dx:Math.cos(a),dy:Math.sin(a),spin:i%2?1.7:-1.4,color:i%3?'#66717a':palette});
        }
      }
      if(entity.owner===0&&entity.type==='unit'&&!sold)
        this.audio?.announce(entity.kind==='harvester'?'harvesterLost':'unitLost');
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
      this.state='finished';this.audio?.setScene(win?'victory':'defeat');
      this.audio?.play(win?'win':'defeat');this.audio?.announce(win?'victory':'defeat');
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
      const c=this.ctx,palette=terrain[(MAPS[this.settings.map]||MAPS.verdant).theme||this.settings.map]||terrain.verdant;
      for(let x=0;x<WORLD_SIZE;x++)for(let y=0;y<WORLD_SIZE;y++){
        const r=rand(x,y),water=this.water(x+.5,y+.5);
        this.drawDiamond(x+.5,y+.5,water?(MAPS[this.settings.map]||MAPS.verdant).waterColor:palette[Math.floor(r*palette.length)],'#091e243b');
        if(water&&r>.7){const p=iso(x+.5,y+.5);c.strokeStyle='#77b9c580';c.beginPath();c.moveTo(p.x-9,p.y);c.lineTo(p.x+6,p.y-3);c.stroke();}
        else if(!water&&r>.965){const p=iso(x+.5,y+.5);c.fillStyle='#223c34';c.beginPath();c.ellipse(p.x,p.y-3,4,2,0,0,Math.PI*2);c.fill();c.fillStyle=(MAPS[this.settings.map]?.theme||this.settings.map)==='snow'?'#d7dfe0':'#294f3e';c.beginPath();c.moveTo(p.x-5,p.y-4);c.lineTo(p.x,p.y-16);c.lineTo(p.x+6,p.y-4);c.fill();}
      }
      for(const o of this.ores){if(o.amount<=0)continue;const p=iso(o.x,o.y),n=Math.min(4,Math.ceil(o.amount/350));
        for(let k=0;k<n;k++){const dx=(rand(k,o.x,11)-.5)*17,dy=(rand(k,o.y,12)-.5)*8;c.fillStyle=k%3===0?'#bdf0d1':'#dfab65';c.strokeStyle='#604b30';c.lineWidth=.6;c.beginPath();c.moveTo(p.x+dx,p.y+dy-11);c.lineTo(p.x+dx+7,p.y+dy-2);c.lineTo(p.x+dx,p.y+dy+2);c.lineTo(p.x+dx-5,p.y+dy-3);c.closePath();c.fill();c.stroke();}
      }
    }
    drawBuildingCondition(e,height,span){
      const c=this.ctx,condition=Math.max(0,e.hp/e.maxHp);
      // Staged construction overlay visible for original vector and SVG art.
      if(!e.built){
        c.save();c.strokeStyle='#e9c38b';c.lineWidth=2;c.globalAlpha=.85;
        for(const dx of [-26,26]){
          c.beginPath();c.moveTo(dx,0);c.lineTo(dx,-height-15);c.stroke();
          for(let i=0;i<3;i++){c.beginPath();c.moveTo(dx-5,-height*.25-i*13);c.lineTo(dx+5,-height*.25-i*13);c.stroke();}
        }
        c.strokeStyle='#96d9e5';c.beginPath();c.moveTo(-span/2,-height-20);c.lineTo(span/2,-height-20);c.stroke();
        c.fillStyle='#93e5de';c.fillRect(-span/2,-height-24,span*e.construction,4);
        c.restore();
      }
      if(condition<.72){
        // Persistent cracked armour on every damaged structure.
        c.save();c.strokeStyle=condition<.3?'#f8b781':'#26303b';
        c.lineWidth=condition<.3?2.8:2;c.globalAlpha=.95;
        c.beginPath();c.moveTo(-16,-height*.36);c.lineTo(-4,-height*.58);c.lineTo(5,-height*.52);
        c.lineTo(12,-height*.76);c.lineTo(21,-height*.69);c.stroke();
        const phase=this.time*1.4+e.id*.4;
        for(let i=0;i<(condition<.3?4:2);i++){
          const x=-12+i*9+Math.sin(phase+i)*3;
          const y=-height-19-i*10-(phase*9)%17;
          c.fillStyle=i%2?'#62707a88':'#97a0a477';
          c.beginPath();c.ellipse(x,y,7+i%3,5+i%2,0,0,Math.PI*2);c.fill();
        }
        if(condition<.3){
          c.fillStyle='#ffae57';c.beginPath();
          c.moveTo(-10,-height+6);c.quadraticCurveTo(-5,-height-17-Math.sin(phase)*6,2,-height-6);
          c.quadraticCurveTo(12,-height-23+Math.cos(phase)*6,12,-height+7);c.closePath();c.fill();
          c.fillStyle='#ffeb8a';c.fillRect(-1,-height,4,7);
        }
        c.restore();
      }
      if(e.repairing&&e.hp<e.maxHp){
        c.save();c.strokeStyle='#85f4ca';c.lineWidth=2.3;
        for(let i=0;i<3;i++){
          const x=Math.sin(this.time*6+i*2.1)*24,y=-height*.55+Math.cos(this.time*4+i)*12;
          c.beginPath();c.moveTo(x-4,y);c.lineTo(x+4,y);c.moveTo(x,y-4);c.lineTo(x,y+4);c.stroke();
        }
        c.restore();
      }
    }
    drawBuilding(e){
      const c=this.ctx,pal=COLORS[this.players[e.owner].faction],p=iso(e.x,e.y),h=(e.kind==='hq'?44:e.kind==='radar'?36:e.kind==='generator'?27:24)*Math.max(.25,e.construction);
      const shape=(pts,color)=>{c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.closePath();c.fillStyle=color;c.fill();};
      c.save();c.translate(p.x,p.y);
      // Prefer packed Blender sprites once validated and decoded; never hide the procedural fallback.
      const baked=window.ChronoBakedArt;
      if(baked?.drawBuilding(c,e,{faction:this.players[e.owner].faction,time:this.time})){
        if(this.selected.includes(e.id))this.drawRing(0,2,53,pal.color);
        this.drawBuildingCondition(e,103,66);
        this.health(e,0,-114,64);c.restore();return;
      }
      const animated=window.ChronoAnimatedArt;
      if(animated?.drawBuilding(c,e,{faction:this.players[e.owner].faction,time:this.time})){
        if(this.selected.includes(e.id))this.drawRing(0,2,53,pal.color);
        this.drawBuildingCondition(e,103,66);
        this.health(e,0,-114,64);c.restore();return;
      }
      const powerImage=e.kind==='generator'?this.buildingSprites[this.players[e.owner].faction]:e.kind==='turret'?this.defenseSprites[this.players[e.owner].faction]:null;
      if(powerImage&&powerImage.complete&&powerImage.naturalWidth>0){
        if(this.selected.includes(e.id))this.drawRing(0,2,51,pal.color);
        c.save();c.globalAlpha=e.built?1:Math.max(.25,e.construction*.85);c.drawImage(powerImage,-72,-131,144,144);c.restore();
        if(!e.built){c.fillStyle=pal.color;c.fillRect(-32,-9,64*e.construction,4);}
        this.drawBuildingCondition(e,102,62);
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
      else if(e.kind==='flak'){c.fillStyle=pal.trim;c.fillRect(-17,-h-13,34,8);c.strokeStyle=pal.trim;c.lineWidth=4;c.beginPath();c.moveTo(-12,-h-12);c.lineTo(-22,-h-32);c.moveTo(12,-h-12);c.lineTo(22,-h-32);c.stroke();}
      else{c.fillStyle=pal.trim;c.fillRect(-15,-h-9,29,5);}
      if(!e.built){c.fillStyle='#0a1524ab';c.fillRect(-33,-h-8,66,22);c.fillStyle=pal.trim;c.fillRect(-30,-h,60*e.construction,3);}
      if(this.selected.includes(e.id))this.drawRing(0,3,50,pal.color);
      this.drawBuildingCondition(e,h+30,62);
      this.health(e,0,-h-51,62);
      c.restore();
    }
    drawRing(x,y,r,color){const c=this.ctx;c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.ellipse(x,y,r,r*.44,0,0,Math.PI*2);c.stroke();}
    health(e,x,y,width){if(e.hp>=e.maxHp*.99)return;const c=this.ctx;c.fillStyle='#0e1622';c.fillRect(x-width/2,y,width,5);c.fillStyle=e.hp/e.maxHp>.4?'#77d381':'#e7776a';c.fillRect(x-width/2+1,y+1,(width-2)*Math.max(0,e.hp/e.maxHp),3);}
    drawRankBadge(e,x,y){
      const rank=this.veterancyRank(e);
      if(!rank)return;
      const c=this.ctx;
      c.save();c.textAlign='center';c.font='bold 13px sans-serif';
      c.lineWidth=2.8;c.strokeStyle='#15222c';c.fillStyle=rank===2?'#ffd47c':'#a8e7ef';
      const mark=rank===2?'★★':'★';
      c.strokeText(mark,x,y);c.fillText(mark,x,y);c.restore();
    }
    aircraftServiceVisual(e){
      const pad=e.rearming?this.entityById(e.rearmPadId):null;
      const docked=!!(pad&&pad.hp>0&&pad.built&&pad.owner===e.owner&&
        pad.kind==='airfield'&&dist(e,pad)<=1.7);
      const previous=airServiceVisuals.get(e)||{blend:0,time:this.time};
      // Smooth touchdown and takeoff across both baked and vector art paths.
      // Cap elapsed time to avoid jumping after tab suspension or fog reveal.
      const elapsed=clamp(this.time-previous.time,0,.12);
      const blend=clamp(previous.blend+(docked?elapsed/1.1:-elapsed/.8),0,1);
      airServiceVisuals.set(e,{blend,time:this.time});
      return {blend,docked,returning:!!e.rearming};
    }
    drawUnit(e){
      const c=this.ctx,p=iso(e.x,e.y),pal=COLORS[this.players[e.owner].faction];c.save();c.translate(p.x,p.y);
      const service=e.kind==='aircraft'?this.aircraftServiceVisual(e):null;
      if(service?.blend>.01){
        c.save();c.globalAlpha=.22+.3*service.blend;
        this.drawRing(0,3,25+Math.sin(this.time*5)*2,pal.trim);
        c.restore();
      }
      if((e.stunnedUntil||0)>this.time){this.drawRing(0,-8,26,'#bd93e8');}
      if(e.yieldOrder&&e.owner===0)this.drawRing(0,0,21,'#eac278');
      else if(e.laneWaiting&&e.owner===0)this.drawRing(0,0,23,'#75bafa');
      const artFaction=this.players[e.owner].faction;
      const baked=window.ChronoBakedArt;
      if(baked?.drawUnit(c,e,{faction:artFaction,time:this.time,service})){
        if(this.selected.includes(e.id))this.drawRing(0,1,e.kind==='aircraft'?33:e.kind==='heavy'?29:24,pal.color);
        const offset=e.kind==='aircraft'?-103:(e.kind==='soldier'||e.kind==='specialist'?-58:-73);
        this.health(e,0,offset,e.kind==='heavy'?47:36);
        this.drawRankBadge(e,23,offset-12);c.restore();return;
      }
      const animated=window.ChronoAnimatedArt;
      if(animated?.drawUnit(c,e,{faction:artFaction,time:this.time,service})){
        if(this.selected.includes(e.id))this.drawRing(0,1,e.kind==='aircraft'?33:e.kind==='heavy'?29:24,pal.color);
        const offset=e.kind==='aircraft'?-104:(e.kind==='soldier'||e.kind==='specialist'?-58:-73);
        this.health(e,0,offset,e.kind==='heavy'?47:36);
        this.drawRankBadge(e,23,offset-12);
        c.restore();return;
      }
      const atlas=(e.kind==='tank')?this.vehicleAtlases?.[this.players[e.owner].faction]:null;
      if(atlas?.hull&&atlas?.turret){
        const art=window.ChronoVehicleArt,srcSize=art.frameSize,cols=art.columns;
        const hullFrame=art.frameIndex(e.worldHeading),turretFrame=art.frameIndex(e.turretHeading??e.worldHeading);
        const drawLayer=(sheet,frame)=>c.drawImage(sheet,(frame%cols)*srcSize,Math.floor(frame/cols)*srcSize,srcSize,srcSize,-49,-63,98,98);
        if(this.selected.includes(e.id))this.drawRing(0,0,28,pal.color);
        drawLayer(atlas.hull,hullFrame);drawLayer(atlas.turret,turretFrame);
        animated?.tankOverlay(c,e,{faction:artFaction,time:this.time});
        this.health(e,0,-59,43);this.drawRankBadge(e,24,-69);c.restore();return;
      }
      const inf=e.kind==='soldier'?this.infantrySprites[this.players[e.owner].faction]:e.kind==='specialist'?this.specialistSprites[this.players[e.owner].faction]:null;
      if(inf&&inf.complete&&inf.naturalWidth>0){
        if(this.selected.includes(e.id))this.drawRing(0,1,22,pal.color);
        c.drawImage(inf,-24,-48,48,48);this.health(e,0,-51,27);this.drawRankBadge(e,19,-55);c.restore();return;
      }
      const recon=e.kind==='recon'?this.reconSprites[this.players[e.owner].faction]:null;
      if(recon&&recon.complete&&recon.naturalWidth>0){
        if(this.selected.includes(e.id))this.drawRing(0,0,24,pal.color);
        c.drawImage(recon,-42,-73,84,84);this.health(e,0,-66,38);this.drawRankBadge(e,27,-77);c.restore();return;
      }
      const pilot=e.kind==='tank'?this.sprites[this.players[e.owner].faction]:null;
      if(pilot&&pilot.complete&&pilot.naturalWidth>0){
        if(this.selected.includes(e.id))this.drawRing(0,0,28,pal.color);
        c.drawImage(pilot,-47,-78,94,94);
        this.health(e,0,-76,43);this.drawRankBadge(e,25,-83);c.restore();return;
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
      this.drawRankBadge(e,20,e.kind==='soldier'||e.kind==='specialist'?-38:-35);
      c.restore();
    }
    drawEffects(){
      const c=this.ctx;
      for(const p of this.particles){
        if(this.fog.length&&!this.isVisible(p.x,p.y))continue;
        const a=iso(p.x,p.y);c.save();c.translate(a.x,a.y);c.globalAlpha=clamp(p.life,0,1);
        if(p.type==='marker'){this.drawRing(0,0,20*(1.5-p.life),p.color);}
        else if(p.type==='boom'){c.fillStyle=p.color;c.beginPath();c.arc(0,-13,22*(1.1-p.life),0,7);c.fill();}
        else if(p.type==='shockwave'){
          const progress=1-p.life/.5;
          c.strokeStyle=p.color;c.lineWidth=Math.max(.7,3*(1-progress));
          c.globalAlpha=clamp(p.life/.5,0,1)*.8;
          c.beginPath();c.ellipse(0,-11,Math.max(2,(p.radius||23)*progress),
            Math.max(1,(p.radius||23)*progress*.5),0,0,Math.PI*2);c.stroke();
        }
        else if(p.type==='abilityPulse'){
          const fraction=1-p.life/.85;
          const size=(p.radius||90)*fraction;
          c.strokeStyle=p.color;c.lineWidth=3.5;c.globalAlpha=clamp(p.life/.85,0,1);
          c.beginPath();c.ellipse(0,0,Math.max(2,size),Math.max(1,size*.47),0,0,Math.PI*2);c.stroke();
          c.beginPath();c.ellipse(0,-11,Math.max(1,size*.36),Math.max(1,size*.18),0,0,Math.PI*2);c.stroke();
        }
        else if(p.type==='debris'){
          const elapsed=1.2-p.life;
          c.fillStyle=p.color;c.globalAlpha=Math.max(0,p.life/1.2);
          c.save();c.translate(p.dx*elapsed*24,-14+p.dy*elapsed*21+elapsed*elapsed*19);
          c.rotate(elapsed*(p.spin||1));c.fillRect(-3,-3,6,6);c.restore();
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
    drawRadar(visibleEnemies=null){
      const c=this.rctx,w=this.radar.width,h=this.radar.height;c.clearRect(0,0,w,h);c.fillStyle='#0b2028';c.fillRect(0,0,w,h);
      for(let x=0;x<WORLD_SIZE;x++)for(let y=0;y<WORLD_SIZE;y++){const cell=this.fog[x]?.[y];c.fillStyle=!cell?.seen?'#061019':this.water(x+.5,y+.5)?'#36617a':cell.visible?'#466449':'#294037';c.fillRect(x*w/WORLD_SIZE,y*h/WORLD_SIZE,Math.ceil(w/WORLD_SIZE),Math.ceil(h/WORLD_SIZE));}
      c.fillStyle='#c0a45b';for(const o of this.ores){if(o.amount>0&&this.fog[Math.floor(o.x)]?.[Math.floor(o.y)]?.seen)c.fillRect(o.x*w/WORLD_SIZE,o.y*h/WORLD_SIZE,3,3);}
      for(const e of this.entities){if(e.hp<=0||e.owner===1&&!(visibleEnemies?visibleEnemies.has(e.id):this.playerCanSeeEntity(e)))continue;c.fillStyle=e.owner===0?'#6bd7ec':'#ed7e6a';c.fillRect(e.x*w/WORLD_SIZE-2,e.y*h/WORLD_SIZE-2,e.type==='building'?5:3,e.type==='building'?5:3);}
      const {x:cx,y:cy}=this.worldToGrid(this.camera.x,this.camera.y);c.strokeStyle='#9ddbe99c';c.lineWidth=1;c.strokeRect(clamp(cx-6,0,WORLD_SIZE)*w/WORLD_SIZE,clamp(cy-8,0,WORLD_SIZE)*h/WORLD_SIZE,12*w/WORLD_SIZE,16*h/WORLD_SIZE);
    }
    worldToGrid(wx,wy){return{x:wx/TW+wy/TH,y:wy/TH-wx/TW};}
    draw(){
      const c=this.ctx,d=this.dpr;c.setTransform(d,0,0,d,0,0);c.fillStyle='#081821';c.fillRect(0,0,this.w,this.h);
      c.translate(this.w/2-this.camera.x*this.camera.zoom,this.h/2-this.camera.y*this.camera.zoom);c.scale(this.camera.zoom,this.camera.zoom);
      this.drawTerrain();
      // Share one sensor-verified enemy roster between battlefield and radar.
      // Do not mistake a lit fog tile for permission to reveal a hidden unit.
      const visibleEnemies=new Set(this.entities.filter(e=>e.owner===1&&e.hp>0&&
        this.playerCanSeeEntity(e)).map(e=>e.id));
      const entities=this.entities.filter(e=>e.hp>0&&(e.owner===0||visibleEnemies.has(e.id))).sort((a,b)=>(a.x+a.y)-(b.x+b.y));
      for(const e of entities)e.type==='building'?this.drawBuilding(e):this.drawUnit(e);
      this.drawProjectiles();this.drawEffects();this.drawFog();
      if(this.placing&&this.state==='playing'){
        const x=Math.round(this.mouse.worldX),y=Math.round(this.mouse.worldY),
          ok=this.prereq(0,this.placing)&&this.canPlace(x,y,0);
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
      this.drawRadar(visibleEnemies);
    }
    frame(now){
      const dt=Math.min(.06,(now-this.last)/1000||0);this.last=now;
      if(this.state==='playing')this.step(dt);
      this.draw();
      if(this.lastPerfAt===null)this.lastPerfAt=now;
      this.perfFrames++;
      if(now-this.lastPerfAt>=1100){
        const fps=Math.round(this.perfFrames*1000/Math.max(1,now-this.lastPerfAt));
        const units=this.entities.filter(e=>e.hp>0&&e.type==='unit').length;
        const waiting=this.entities.filter(e=>e.hp>0&&e.owner===0&&e.laneWaiting).length;
        $('perfStatus').textContent=fps+' FPS · '+units+' UNITS'+(this.trafficYieldCount?' · '+this.trafficYieldCount+' YIELDS':'')+(waiting?' · '+waiting+' QUEUED':'');
        $('perfStatus').title='Approximate rendered frames per second and living units on both teams';
        this.lastPerfAt=now;this.perfFrames=0;
      }
      requestAnimationFrame(t=>this.frame(t));
    }
  }
  window.ChronoDominion={version:'2.42.0',build:'original-blender-atlas-pipeline'};
  new Game();
})();
