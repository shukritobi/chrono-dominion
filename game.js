/* Chrono Dominion v0.4 — original browser RTS vertical slice. No third-party game assets. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const WORLD_SIZE = 34, TW = 64, TH = 32;
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
    harvester:{name:'Ore Harvester',icon:'◈',cost:900,hp:310,speed:1.23,range:0,damage:0,from:'refinery'}
  };
  const NAMES = {
    coalition:{hq:'Field Command',generator:'Fusion Array',refinery:'Ore Processor',barracks:'Training Centre',factory:'Vehicle Assembly',radar:'Tactical Radar',tech:'Chrono Laboratory',turret:'Auto Cannon',beam:'Prism Array',soldier:'Ranger',specialist:'Chrono Operative',tank:'Lynx Tank',heavy:'Bulwark MBT',harvester:'Alloy Harvester'},
    federation:{hq:'Iron Command',generator:'Thermal Reactor',refinery:'Industrial Refinery',barracks:'Garrison',factory:'Armour Foundry',radar:'Signal Tower',tech:'Weapons Institute',turret:'Gun Nest',beam:'Arc Coil',soldier:'Rifleman',specialist:'Arc Trooper',tank:'Bull Tank',heavy:'Mammoth Tank',harvester:'Ore Carrier'},
    psionic:{hq:'Neural Nexus',generator:'Bio Reactor',refinery:'Neural Refinery',barracks:'Initiation Chamber',factory:'Mind Forge',radar:'Psi Scanner',tech:'Ascension Spire',turret:'Neural Sentinel',beam:'Psychic Spire',soldier:'Acolyte',specialist:'Neural Disciple',tank:'Viper Tank',heavy:'Mindbreaker',harvester:'Psi Collector'}
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
      this.selected=[];this.groups={};this.dragStart=null;this.dragEnd=null;this.touchPointer=null;this.placing=null;this.tab='structures';
      this.players=[];this.state='menu';this.last=performance.now();this.time=0;this.nextAI=0;this.nextUi=0;this.nextFog=0;this.fog=[];
      this.mouse={x:0,y:0,worldX:0,worldY:0};this.toastTimer=null;
      this.sprites={};this.buildingSprites={};this.infantrySprites={};this.loadPilotSprites();
      this.vehicleAtlases=null;
      if(window.ChronoVehicleArt){try{this.vehicleAtlases=window.ChronoVehicleArt.createAtlases();}catch(err){console.warn('Directional atlas fallback:',err);}}
      this.settings={playerFaction:'coalition',enemyFaction:'federation',map:'verdant',difficulty:'standard'};
      this.setupEvents();this.resize();requestAnimationFrame(t=>this.frame(t));
    }
    loadPilotSprites(){
      if(typeof Image==='undefined')return;
      const files={coalition:'coalition-lynx',federation:'federation-bull',psionic:'psionic-viper'};
      for(const [faction,file] of Object.entries(files)){
        const img=new Image();img.decoding='async';img.src='./art/pilot/'+file+'.svg';
        this.sprites[faction]=img;
        const power=new Image();power.decoding='async';power.src='./art/pilot/'+faction+'-power.svg';
        this.buildingSprites[faction]=power;
        const infantry=new Image();infantry.decoding='async';infantry.src='./art/pilot/'+faction+'-infantry.svg';
        this.infantrySprites[faction]=infantry;
      }
    }
    setupEvents(){
      window.addEventListener('resize',()=>this.resize());
      window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(e.target?.closest?.('input,select,textarea'))return;
        if(this.state==='playing'&&/^[1-9]$/.test(k)){
          e.preventDefault();
          if(e.ctrlKey){this.groups[k]=this.selected.filter(id=>{const unit=this.entityById(id);return unit&&unit.owner===0&&unit.type==='unit';});this.notify('Group '+k+' assigned ('+this.groups[k].length+' units)');}
          else {this.selected=(this.groups[k]||[]).filter(id=>{const unit=this.entityById(id);return unit&&unit.owner===0;});this.updateSelection();if(e.shiftKey)this.centerSelection();}
          return;
        }
        if(this.state==='playing'&&k==='h'){this.centerHQ();return;}
        if(this.state==='playing'&&k===' '){e.preventDefault();this.centerSelection();return;}
        this.keys.add(k);if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='escape'){if(this.placing){this.placing=null;this.updateUI(true);}else if(this.state==='playing'||this.state==='paused')this.pause();}});
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
      $('selection').addEventListener('click',e=>{const b=e.target.closest?.('button[data-action]');if(b)this.buildingAction(b.dataset.action);});
      $('openSkirmish').onclick=()=>this.showMenu('skirmishMenu');
      $('backMenu').onclick=()=>this.showMenu('mainMenu');
      $('openHow').onclick=()=>this.showMenu('howMenu');
      $('backHow').onclick=()=>this.showMenu('mainMenu');
      $('start').onclick=()=>{const get=id=>$(id).value;this.newMatch({playerFaction:get('playerFaction'),enemyFaction:get('enemyFaction'),map:get('mapSelect'),difficulty:get('difficulty')});};
      $('pauseBtn').onclick=()=>this.pause();$('resume').onclick=()=>this.pause();
      $('zoomIn').onclick=()=>{this.camera.zoom=clamp(this.camera.zoom*1.15,.65,1.8);};
      $('zoomOut').onclick=()=>{this.camera.zoom=clamp(this.camera.zoom/1.15,.65,1.8);};
      $('restart').onclick=()=>this.newMatch(this.settings);
      $('quit').onclick=()=>this.returnMenu();$('resultQuit').onclick=()=>this.returnMenu();
      $('playAgain').onclick=()=>this.newMatch(this.settings);
    }
    showMenu(which){['mainMenu','skirmishMenu','howMenu','pauseMenu','resultMenu'].forEach(id=>$(id).classList.toggle('hidden',id!==which));$('overlay').classList.remove('hidden');}
    returnMenu(){this.state='menu';this.selected=[];this.placing=null;this.showMenu('mainMenu');this.updateUI(true);}
    pause(){if(this.state==='playing'){this.state='paused';this.showMenu('pauseMenu');}else if(this.state==='paused'){this.state='playing';$('overlay').classList.add('hidden');}}
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
      const def=BUILD[kind]||UNITS[kind];const e={id:this.nextId++,owner,kind,type:BUILD[kind]?'building':'unit',x,y,hp:def.hp,maxHp:def.hp,built,construction:built?1:0,ready:0,heading:0,order:null,load:0,work:0,kills:0};
      if(e.type==='unit'){e.worldHeading=owner===0?0:Math.PI;e.turretHeading=e.worldHeading;e.desiredHeading=e.worldHeading;e.desiredTurretHeading=e.worldHeading;}
      this.entities.push(e);return e;
    }
    newMatch(s){
      this.settings={...s};this.state='playing';this.time=0;this.nextAI=6;this.nextUi=0;this.nextFog=0;this.nextId=1;
      this.entities=[];this.ores=[];this.particles=[];this.projectiles=[];this.queues=[];this.selected=[];this.groups={};this.placing=null;this.tab='structures';
      this.players=[{faction:s.playerFaction,credits:5000},{faction:s.enemyFaction,credits:5000}];
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
      this.updateFog();$('overlay').classList.add('hidden');this.updateUI(true);this.notify('Command established. Construct a War Factory to build tanks.');
    }
    initMap(){
      const oreSites=[[10,12],[13,15],[18,17],[23,21],[25,24],[19,11],[12,21]];
      for(const [x,y] of oreSites){for(let i=0;i<8;i++){const ox=x+(rand(i,x,10)-.5)*3.3,oy=y+(rand(i,y,20)-.5)*3.3;if(this.water(ox,oy))continue;this.ores.push({x:ox,y:oy,amount:900+Math.floor(rand(i,x+y)*450),max:1350});}}
    }
    water(x,y){return (x>22&&x<32&&y>2&&y<8)||(x>2&&x<9&&y>22&&y<28);}
    buildingAt(x,y){return this.entities.find(e=>e.type==='building'&&e.hp>0&&Math.abs(e.x-x)<1.7&&Math.abs(e.y-y)<1.7);}
    canPlace(x,y,side){
      if(x<2||y<2||x>WORLD_SIZE-3||y>WORLD_SIZE-3||this.water(x,y))return false;
      for(const e of this.entities){if(e.type==='building'&&Math.abs(e.x-x)<2.7&&Math.abs(e.y-y)<2.7)return false;}
      return this.entities.some(e=>e.owner===side&&e.type==='building'&&e.built&&dist(e,{x,y})<8.2);
    }
    getDef(e){return BUILD[e.kind]||UNITS[e.kind];}
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
      else{if(this.queues.some(q=>q.side===0&&q.key===key)){this.notify('Already producing '+this.name({owner:0,kind:key}));return;}this.players[0].credits-=def.cost;this.queues.push({side:0,key,elapsed:0,total:Math.max(2,def.cost/250)});this.notify('Training '+this.name({owner:0,kind:key}));}
      this.updateUI(true);
    }
    placeBuilding(x,y){
      const key=this.placing,def=BUILD[key];if(!key||!this.canPlace(x,y,0))return this.notify('Invalid placement: keep structures near your base.');
      if(this.players[0].credits<def.cost)return this.notify('Insufficient credits');
      this.players[0].credits-=def.cost;const e=this.add(0,key,Math.round(x),Math.round(y),false);e.buildTime=3.5+def.cost/650;
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
        this.players[0].credits+=refund;
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
      const chosen=this.entities.filter(e=>this.selected.includes(e.id)&&e.owner===0&&e.type==='unit'&&e.hp>0);if(!chosen.length)return;
      const enemy=this.pick(p.gx,p.gy);const target=enemy&&enemy.owner===1?enemy:null;
      for(let i=0;i<chosen.length;i++){const e=chosen[i],offset=(i-(chosen.length-1)/2)*.65;
        e.order=target?{type:'attack',id:target.id}:{type:event?.shiftKey?'attackMove':'move',x:clamp(p.gx+offset,1,32),y:clamp(p.gy+offset*.55,1,32)};
      }
      this.particles.push({x:p.gx,y:p.gy,life:.65,color:target?'#ff7c7c':'#80dbee',type:'marker'});
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
      const move=Math.min(UNITS[e.kind].speed*dt,len),vx=dx/len*move,vy=dy/len*move;
      const clear=(x,y)=>x>.7&&y>.7&&x<WORLD_SIZE-.7&&y<WORLD_SIZE-.7&&!this.water(x,y)&&!this.entities.some(b=>b.hp>0&&b.type==='building'&&Math.abs(b.x-x)<1.28&&Math.abs(b.y-y)<1.28);
      if(clear(e.x+vx,e.y+vy)){e.x+=vx;e.y+=vy;e.stuck=0;}
      else if(clear(e.x+vx,e.y)){e.x+=vx;e.stuck=0;}
      else if(clear(e.x,e.y+vy)){e.y+=vy;e.stuck=0;}
      else {e.stuck=(e.stuck||0)+dt;if(e.stuck>.45){e.pathRecheck=0;e.stuck=0;}}
      e.heading=Math.atan2(dy*TH,dx*TW);
      e.desiredHeading=Math.atan2(dy,dx);
      if(e.type==='unit'&&!e.engaging)e.desiredTurretHeading=e.desiredHeading;
      d=Math.hypot(tx-e.x,ty-e.y);
      return d<.24;
    }
    shoot(source,target){
      const def=this.getDef(source),damage=def.damage||0;
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
        this.particles.push({x:target.x,y:target.y,life:.38,color:shot.color,type:'hit'});
        if(target.hp<=0){
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
        else if(e.work<=0){this.players[e.owner].credits+=e.load;e.load=0;e.work=.6;if(e.owner===0)this.particles.push({x:refinery.x,y:refinery.y,life:1,color:'#9fe29d',type:'cash'});}return;}
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
        if(e.type==='unit'){
          if(e.kind==='harvester'){this.processHarvester(e,dt);continue;}
          const command=e.order;
          let target=command?.type==='attack'?this.entityById(command.id):null;
          if(!target)target=this.nearest(e,b=>b.owner!==e.owner&&b.built,UNITS[e.kind].range+2.0);
          const range=UNITS[e.kind].range;
          e.engaging=!!target;
          if(target)e.desiredTurretHeading=Math.atan2(target.y-e.y,target.x-e.x);
          if(target){if(dist(e,target)>range)this.move(e,target.x,target.y,dt);else if(e.ready<=0)this.shoot(e,target);}
          else if(command?.type==='move'||command?.type==='attackMove'){if(this.move(e,command.x,command.y,dt))e.order=null;}
          else if(e.owner===1){const home=this.nearest(e,b=>b.owner===0&&b.type==='building');if(home)this.move(e,home.x,home.y,dt);}
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
      const side=1;const me=this.players[side];const difficulty=this.settings.difficulty;
      me.credits+=difficulty==='veteran'?380:difficulty==='recruit'?80:190;
      const base=this.entities.find(e=>e.owner===side&&e.kind==='hq');
      if(!base)return;
      const priorities=['factory','turret','generator','radar','tech','beam'];
      for(const key of priorities){if(!this.count(side,key)&&this.prereq(side,key)&&me.credits>=BUILD[key].cost){for(let j=0;j<24;j++){const angle=j*.9,radius=4+Math.floor(j/5)*2;const x=Math.round(base.x+Math.cos(angle)*radius),y=Math.round(base.y+Math.sin(angle)*radius);if(this.canPlace(x,y,side)){me.credits-=BUILD[key].cost;const e=this.add(side,key,x,y,false);e.buildTime=4+BUILD[key].cost/700;break;}}break;}}
      let key=this.count(side,'factory')?'tank':'soldier';
      if(this.count(side,'tech')&&rand(Math.floor(this.time),12)>.66)key='heavy';
      if(this.queues.some(q=>q.side===side))return;
      const cost=UNITS[key].cost;if(this.prereq(side,key)&&me.credits>=cost){me.credits-=cost;this.queues.push({side,key,elapsed:0,total:Math.max(2,cost/250)});}
      const enemy=this.entities.find(e=>e.owner===0&&e.kind==='hq');
      if(enemy){for(const u of this.entities.filter(e=>e.owner===side&&e.type==='unit'&&e.kind!=='harvester')){if(!u.order||u.order.type==='move')u.order={type:'attack',id:enemy.id};}}
    }
    updateFog(){
      if(!this.fog.length)this.fog=Array.from({length:WORLD_SIZE},()=>Array.from({length:WORLD_SIZE},()=>({seen:false,visible:false})));
      for(const row of this.fog)for(const c of row)c.visible=false;
      for(const e of this.entities){if(e.owner!==0||e.hp<=0)continue;const radius=e.type==='building'?5.8:4.8;
        const minX=clamp(Math.floor(e.x-radius),0,WORLD_SIZE-1),maxX=clamp(Math.ceil(e.x+radius),0,WORLD_SIZE-1);
        const minY=clamp(Math.floor(e.y-radius),0,WORLD_SIZE-1),maxY=clamp(Math.ceil(e.y+radius),0,WORLD_SIZE-1);
        for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++)if(Math.hypot(x-e.x,y-e.y)<=radius){this.fog[x][y].seen=true;this.fog[x][y].visible=true;}
      }
    }
    isVisible(x,y){const ix=clamp(Math.floor(x),0,WORLD_SIZE-1),iy=clamp(Math.floor(y),0,WORLD_SIZE-1);return !!this.fog[ix]?.[iy]?.visible;}
    updateSelection(){
      const targets=this.selected.map(id=>this.entityById(id)).filter(Boolean),box=$('selection');
      if(!targets.length){box.innerHTML='<strong>NO SELECTION</strong><p>Click a unit or building to inspect it.</p>';return;}
      if(targets.length>1){box.innerHTML='<strong>'+targets.length+' UNITS SELECTED</strong><p>Right-click to move or attack. Shift + right-click to attack-move.</p>';return;}
      const e=targets[0];
      let html='<strong>'+this.escape(this.name(e)).toUpperCase()+'</strong><p>'+Math.max(0,Math.ceil(e.hp))+' / '+e.maxHp+' HP · '+(e.owner===0?'FRIENDLY':'HOSTILE')+(e.built?'':' · CONSTRUCTING '+Math.round(e.construction*100)+'%')+'</p>';
      if(e.owner===0&&e.type==='building'){
        const canRepair=e.built&&e.hp<e.maxHp;
        const disabledRepair=(!canRepair||!e.repairing&&this.players[0].credits<1)?' disabled':'';
        html+='<div class="buildActions"><button data-action="repair"'+disabledRepair+' title="Repair consumes credits over time">'+(e.repairing?'STOP REPAIR':'🔧 REPAIR')+'</button>';
        if(e.kind!=='hq')html+='<button data-action="sell" title="Sell this structure for a partial refund">¤ SELL</button>';
        html+='</div>';
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
      let keys=this.tab==='structures'?['generator','refinery','barracks','factory','radar','tech']:this.tab==='defenses'?['turret','beam']:this.tab==='infantry'?['soldier','specialist']:['tank','heavy','harvester'];
      $('production').innerHTML=keys.map(key=>{const d=BUILD[key]||UNITS[key],ready=this.prereq(0,key),rich=me.credits>=d.cost,q=this.queues.find(q=>q.side===0&&q.key===key);
        const label=NAMES[me.faction][key]||d.name;const available=ready&&rich&&!q;let reason=!ready?'Requires tech':!rich?'Not enough credits':q?'In production':'';
        const preview=key==='generator'?'./art/pilot/'+me.faction+'-power.svg':key==='soldier'?'./art/pilot/'+me.faction+'-infantry.svg':key==='tank'?'./art/pilot/'+({coalition:'coalition-lynx',federation:'federation-bull',psionic:'psionic-viper'}[me.faction])+'.svg':null;
        const artwork=preview?'<img class="itemAsset" loading="lazy" alt="" src="'+preview+'">':'<span class="itemIcon">'+d.icon+'</span>';
        return '<button class="buildItem '+(!available?'locked ':'')+(this.placing===key?'selectedBuild':'')+'" data-key="'+key+'" '+(!available?'disabled':'')+' title="'+this.escape(label)+' '+this.escape(reason)+'">'+artwork+'<span class="itemTitle">'+this.escape(label)+'</span><span class="itemCost">¤ '+d.cost+'</span>'+(q?'<span class="progress" style="width:'+(q.elapsed/q.total*100)+'%"></span>':'')+'</button>';
      }).join('');
      this.updateSelection();
    }
    finish(win){this.state='finished';$('resultText').textContent=win?'Enemy command neutralized. The battlefield is yours.':'Your command structure has fallen. Rebuild your strategy and try again.';this.showMenu('resultMenu');}
    notify(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>el.classList.remove('show'),2500);}
    drawDiamond(x,y,fill,stroke){
      const p=iso(x,y),c=this.ctx;c.beginPath();c.moveTo(p.x,p.y-TH/2);c.lineTo(p.x+TW/2,p.y);c.lineTo(p.x,p.y+TH/2);c.lineTo(p.x-TW/2,p.y);c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=.55;c.stroke();}
    }
    drawTerrain(){
      const c=this.ctx,palette=terrain[this.settings.map]||terrain.verdant;
      for(let x=0;x<WORLD_SIZE;x++)for(let y=0;y<WORLD_SIZE;y++){
        const r=rand(x,y),water=this.water(x+.5,y+.5);
        this.drawDiamond(x+.5,y+.5,water?(this.settings.map==='snow'?'#618c98':'#2d6179'):palette[Math.floor(r*palette.length)],'#091e243b');
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
      const powerImage=e.kind==='generator'?this.buildingSprites[this.players[e.owner].faction]:null;
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
      const atlas=(e.kind==='tank')?this.vehicleAtlases?.[this.players[e.owner].faction]:null;
      if(atlas?.hull&&atlas?.turret){
        const art=window.ChronoVehicleArt,srcSize=art.frameSize,cols=art.columns;
        const hullFrame=art.frameIndex(e.worldHeading),turretFrame=art.frameIndex(e.turretHeading??e.worldHeading);
        const drawLayer=(sheet,frame)=>c.drawImage(sheet,(frame%cols)*srcSize,Math.floor(frame/cols)*srcSize,srcSize,srcSize,-49,-63,98,98);
        if(this.selected.includes(e.id))this.drawRing(0,0,28,pal.color);
        drawLayer(atlas.hull,hullFrame);drawLayer(atlas.turret,turretFrame);
        this.health(e,0,-59,43);c.restore();return;
      }
      const inf=e.kind==='soldier'?this.infantrySprites[this.players[e.owner].faction]:null;
      if(inf&&inf.complete&&inf.naturalWidth>0){
        if(this.selected.includes(e.id))this.drawRing(0,1,22,pal.color);
        c.drawImage(inf,-24,-48,48,48);this.health(e,0,-51,27);c.restore();return;
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
        const big=e.kind==='heavy',harvest=e.kind==='harvester';
        const sz=big?1.27:1;c.scale(sz,sz);
        c.fillStyle='#111b25';c.fillRect(-18,-12,36,7);c.fillRect(-18,5,36,7);
        c.fillStyle=pal.side;c.fillRect(-17,-9,34,18);
        c.fillStyle=pal.top;c.beginPath();c.moveTo(-17,-8);c.lineTo(11,-8);c.lineTo(18,-1);c.lineTo(11,8);c.lineTo(-17,8);c.closePath();c.fill();
        c.strokeStyle=pal.trim;c.lineWidth=2;c.beginPath();c.moveTo(-13,-7);c.lineTo(-13,7);c.stroke();
        c.fillStyle=pal.color;c.fillRect(-13,-7,7,4);
        if(harvest){c.fillStyle='#d5ad68';c.fillRect(5,-6,11,12);c.fillStyle=e.load?'#b1e4cb':'#253b39';c.fillRect(-5,-5,9,10);}
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
      if(this.placing&&this.state==='playing'){const x=Math.round(this.mouse.worldX),y=Math.round(this.mouse.worldY),ok=this.canPlace(x,y,0);const p=iso(x,y);c.fillStyle=ok?'#71e5a55c':'#f370765c';c.beginPath();c.ellipse(p.x,p.y,50,25,0,0,7);c.fill();c.strokeStyle=ok?'#9afed0':'#ff9696';c.lineWidth=3;c.stroke();}
      if(this.dragStart&&this.dragEnd&&Math.hypot(this.dragStart.x-this.dragEnd.x,this.dragStart.y-this.dragEnd.y)>12){
        c.setTransform(d,0,0,d,0,0);const a=this.dragStart,b=this.dragEnd;c.fillStyle='#8bceef29';c.strokeStyle='#98d9f2';c.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);c.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);}
      this.drawRadar();
    }
    frame(now){const dt=Math.min(.06,(now-this.last)/1000||0);this.last=now;if(this.state==='playing')this.step(dt);this.draw();requestAnimationFrame(t=>this.frame(t));}
  }
  window.ChronoDominion={version:'0.4.0',build:'combat-and-economy'};
  new Game();
})();
