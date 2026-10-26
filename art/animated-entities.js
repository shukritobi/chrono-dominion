/* Chrono Dominion: original high-detail, animated, scale-independent RTS art.
 * All geometry is drawn as vector paths under the game's HiDPI canvas transform.
 * No copied commercial sprites, textures, or model assets.
 */
(function(root){
  'use strict';
  const TAU=Math.PI*2;
  const THEMES={
    coalition:{body:'#527d96',light:'#b1d6e4',dark:'#1c354d',side:'#34566e',metal:'#253c50',accent:'#61dce9',glass:'#8bd7ff',ground:'#1a2c3d'},
    federation:{body:'#94604e',light:'#dfaa86',dark:'#3c292b',side:'#6e4139',metal:'#403d3a',accent:'#ffae65',glass:'#ffc58b',ground:'#352826'},
    psionic:{body:'#79569b',light:'#c6a6e0',dark:'#30223f',side:'#553c76',metal:'#342c4c',accent:'#7fffd1',glass:'#a98eff',ground:'#271e36'}
  };
  const motion=new Map();
  const limit=(v,a,b)=>Math.max(a,Math.min(b,v));
  function state(e,t){
    const prev=motion.get(e.id),changed=!!prev&&Math.hypot(e.x-prev.x,e.y-prev.y)>.002;
    const moving=changed||!!(prev?.moving&&t-(prev.lastMoved||0)<.13);
    motion.set(e.id,{x:e.x,y:e.y,moving,lastMoved:changed?t:prev?.lastMoved||0});
    if(motion.size>1200)motion.clear();
    return {moving,phase:t*(e.kind==='aircraft'?14:8.5)+e.id*.73,
      firing:!!e.engaging&&e.ready>.02,
      damaged:e.hp<e.maxHp*.43};
  }
  function poly(c,pts,fill,stroke='#17232e',width=1){
    c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));
    c.closePath();c.fillStyle=fill;c.fill();
    if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
  }
  function line(c,pts,stroke,width=1){
    c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));
    c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke();
  }
  function ellipse(c,x,y,rx,ry,fill,stroke=null){
    c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);
    c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
  }
  function box2(c,x,y,w,h,color,stroke=null){
    c.fillStyle=color;c.fillRect(x,y,w,h);
    if(stroke){c.strokeStyle=stroke;c.lineWidth=.8;c.strokeRect(x,y,w,h);}
  }
  function glow(c,x,y,r,color,alpha=.32){
    c.save();c.globalAlpha=alpha;const g=c.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();
  }
  function grid(c,t){
    // Brushed-metal floor grate that remains registered beneath animations.
    c.strokeStyle=t.metal;c.lineWidth=.8;
    for(let x=-27;x<=27;x+=9)line(c,[[x,-9],[x+8,-5]],'#162b38',.8);
  }
  function projectFactory(yaw,scale=18){
    const cs=Math.cos(yaw),sn=Math.sin(yaw);
    return (x,y,z=0)=>{
      const a=x*cs-y*sn,b=x*sn+y*cs;
      return [(a-b)*scale,-4+(a+b)*scale*.46-z*scale];
    };
  }
  function modelBox(c,P,x,y,z,dx,dy,dz,t,light=t.light){
    const corners=[
      P(x-dx,y-dy,z),P(x+dx,y-dy,z),P(x+dx,y+dy,z),P(x-dx,y+dy,z),
      P(x-dx,y-dy,z+dz),P(x+dx,y-dy,z+dz),P(x+dx,y+dy,z+dz),P(x-dx,y+dy,z+dz)
    ];
    const faces=[[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]];
    // Sort side planes back-to-front by projected centroid, roof drawn last.
    faces.map(ids=>({ids,depth:ids.reduce((s,i)=>s+corners[i][1],0)/4}))
      .sort((a,b)=>a.depth-b.depth)
      .forEach((f,i)=>poly(c,f.ids.map(j=>corners[j]),i%2?t.side:t.dark,'#15222f',.95));
    poly(c,[4,5,6,7].map(j=>corners[j]),light,'#233747',1);
    return corners;
  }
  function strokeModel(c,P,pts,color,width=1.5){
    line(c,pts.map(v=>P(...v)),color,width);
  }
  function shadow(c,rx,ry=12,y=5){
    ellipse(c,5,y,rx,ry,'rgba(1,8,17,.52)');
    ellipse(c,0,y-3,rx*.76,ry*.68,'rgba(8,21,32,.24)');
  }
  function windowPanel(c,P,x,y,z,w,h,t){
    poly(c,[P(x-w,y,z),P(x+w,y,z),P(x+w,y,z+h),P(x-w,y,z+h)],t.glass,t.dark,.75);
    strokeModel(c,P,[[x-w,y,z+h*.55],[x+w,y,z+h*.55]],t.light,1);
  }
  function infantry(c,e,t,s){
    shadow(c,13,5,1);
    const face=Math.cos((e.worldHeading||0)-Math.PI/4);
    const side=face>=0?1:-1,depth=Math.sin((e.worldHeading||0)-Math.PI/4);
    const stride=s.moving?Math.sin(s.phase)*4.9:Math.sin(s.phase*.25)*.45;
    const bob=s.moving?Math.abs(Math.sin(s.phase))*2.2:Math.sin(s.phase*.4)*.55;
    c.save();c.translate(0,-bob);
    // Articulated hip/boot joints, independently animated with marching stride.
    for(const sign of [-1,1]){
      const y=-8+(sign===1?1:0),footX=sign*4+stride*sign;
      line(c,[[sign*3,-15],[footX*.8,-7],[footX,-1+(sign===1?stride*.32:-stride*.32)]],t.dark,4);
      line(c,[[footX-2,-2],[footX+side*5,-1]],'#15212b',3.5);
      box2(c,footX-1,-6,3,3,t.metal);
    }
    // Torso silhouette: shoulder pads, vest plate, belt and energy insignia.
    poly(c,[[-9,-29],[-6,-34],[7,-34],[10,-29],[8,-15],[-8,-15]],t.dark);
    poly(c,[[-7,-32],[0,-36],[8,-32],[6,-20],[-6,-20]],t.body,'#132130',1);
    poly(c,[[-5,-29],[0,-31],[5,-29],[4,-24],[-4,-24]],t.light);
    box2(c,-7,-19,14,3,t.metal);box2(c,-1,-28,3,3,t.accent);
    poly(c,[[-11,-32],[-7,-37],[-2,-33],[-4,-27]],t.side);
    poly(c,[[4,-33],[8,-37],[12,-32],[8,-27]],t.side);
    // Helmet, earcom, mask and illuminated faction visor.
    ellipse(c,0,-40,7,8,t.dark,'#101924');
    poly(c,[[-7,-42],[-5,-48],[3,-49],[8,-43],[7,-39],[-6,-39]],t.body);
    poly(c,[[-5,-44],[5,-45],[6,-42],[-5,-40]],t.glass,null);
    box2(c,side*5-2,-41,4,4,t.accent);
    line(c,[[-4,-47],[4,-48]],t.light,1.6);
    // Shoulder / hand motion follows leg phase, weapon stays aimed.
    const armSwing=s.moving?stride*.3:0,weaponY=-27+(s.firing?1:0);
    line(c,[[-8,-30],[-10-side*armSwing,-25],[-4,-23]],t.side,3.8);
    line(c,[[8,-31],[9+side*armSwing,-26],[side*12,-25]],t.light,3.4);
    if(e.kind==='specialist'){
      const pulse=.5+.5*Math.sin(s.phase*.65);
      glow(c,side*11,-27,12,t.accent,.1+.16*pulse);
      ellipse(c,side*12,-27,5,5,t.metal,t.accent);
      ellipse(c,side*12,-27,2.2,2.2,t.accent);
      strokeModel(c,(x,y)=>[x,y],[[-7,-37],[-12,-41],[-9,-47]],t.accent,1.2);
      if(t===THEMES.psionic){
        c.strokeStyle=t.accent;c.lineWidth=1.7;
        c.beginPath();c.ellipse(0,-41,10,13,0,Math.PI*.95,Math.PI*1.9);c.stroke();
      }
    }else{
      const startX=side*3,endX=side*19;
      line(c,[[startX,weaponY],[endX,weaponY+depth*3]],'#101a24',4);
      line(c,[[side*9,weaponY-1],[endX,weaponY+depth*3]],t.light,1.4);
      box2(c,side*13-2,weaponY-4,5,3,t.metal);
      if(s.firing&&Math.sin(s.phase*3)>-.3){
        glow(c,endX,weaponY+depth*3,9,t.accent,.32);
        poly(c,[[endX,weaponY-3],[endX+side*9,weaponY],[endX,weaponY+3]],'#fff0bd',null);
      }
    }
    c.restore();
  }
  function wheels(c,P,xs,halfY,z,t,phase,move,heavy=false){
    for(const side of [-1,1])for(const x of xs){
      const p=P(x,halfY*side,z);
      ellipse(c,p[0],p[1],heavy?5.3:4.2,heavy?5.3:4.2,'#111a24','#526173');
      ellipse(c,p[0],p[1],heavy?2.3:1.7,heavy?2.3:1.7,t.metal);
      if(move){const a=phase*1.45+x;line(c,[[p[0],p[1]],[p[0]+Math.sin(a)*2,p[1]+Math.cos(a)*2]],t.light,1.2);}
    }
  }
  function vehicle(c,e,t,s){
    const kind=e.kind,heavy=kind==='heavy',harvest=kind==='harvester',scout=kind==='recon';
    const yaw=e.worldHeading||0,P=projectFactory(yaw,heavy?17:16.5),pitch=s.moving?Math.sin(s.phase*2)*.6:0;
    shadow(c,heavy?40:harvest?36:31,14,4);
    c.save();c.translate(0,pitch);
    const half=heavy?1.04:harvest?.99:scout?.72:.86;
    const len=heavy?1.7:harvest?1.62:scout?1.37:1.5;
    const z=heavy?.35:.28;
    // Deep treads, armored skirts and rotating road wheel hubs.
    for(const side of [-1,1]){
      modelBox(c,P,0,side*half,z,len,.23,.42,
        {dark:'#111c26',side:'#1d2731',light:'#364651'});
      wheels(c,P,[-1.14,-.62,0,.62,1.14],side*(half+.04),z+.1,t,s.phase,s.moving,heavy);
    }
    modelBox(c,P,0,0,z+.21,len*.92,half*.87,.47,t);
    // V-shaped frontal armor slopes distinguish armoured silhouettes.
    poly(c,[P(len*.92,-half*.75,z+.52),P(len*1.15,0,z+.45),
      P(len*.92,half*.75,z+.52),P(len*.76,0,z+.94)],t.light,t.dark,1);
    for(const side of [-1,1]){
      const p=P(len*.91,side*half*.57,z+.72);
      glow(c,p[0],p[1],5,t.accent,.20);
      ellipse(c,p[0],p[1],2.2,1.5,t.accent);
    }
    strokeModel(c,P,[[-len*.67,-half*.79,z+.71],[len*.67,-half*.79,z+.71]],t.accent,2);
    if(scout){
      // Recon buggies get a glass cabin, spare wheel, sensor boom, and antenna.
      modelBox(c,P,-.1,0,1.0,.58,.54,.24,{...t,light:t.side});
      poly(c,[P(.52,-.5,1),P(.74,0,1.16),P(.52,.5,1),P(-.3,.5,1.37),P(-.3,-.5,1.37)],t.glass,t.dark);
      const p=P(-.82,-.24,1.07),q=P(-.9,-.24,1.96);
      line(c,[p,q],t.light,1.4);ellipse(c,q[0],q[1],2.8,2.8,t.accent);
      const d=P(-1.13,.0,.85);ellipse(c,d[0],d[1],5.8,6,'#172333',t.light);
      modelBox(c,P,.42,0,1.18,.25,.24,.13,t);
    }else if(harvest){
      modelBox(c,P,-.38,0,.99,.75,.69,.61,t);
      for(const side of [-1,1]){
        const p=P(.25,side*.58,1.67);
        line(c,[p,P(1.0,side*.58,1.13)],t.accent,2);
      }
      modelBox(c,P,.66,0,.77,.49,.53,.20,{...t,light:e.load?'#dbb971':t.side});
      for(let i=0;i<4;i++){
        const p=P(-.89+i*.34,0,1.65);
        poly(c,[[p[0]-5,p[1]],[p[0],p[1]-3],[p[0]+5,p[1]],[p[0],p[1]+3]],
          i%2?t.metal:t.light,null);
      }
      if(e.load>0){
        const ores=Math.min(5,Math.ceil(e.load/75));
        for(let i=0;i<ores;i++){
          const p=P(-.4+(i%3)*.28,.18+(i%2)*.24,1.7);
          ellipse(c,p[0],p[1]-2,4,3,'#dec083',t.dark);
        }
      }
    }else{
      // Heavy siege chassis carries twin artillery barrels and reactive armor.
      modelBox(c,P,-.14,0,1.0,heavy?.83:.62,heavy?.68:.52,heavy?.44:.29,t);
      const barrelAngle=e.turretHeading??e.worldHeading??0;
      const Q=projectFactory(barrelAngle,heavy?17:16.5);
      modelBox(c,Q,-.08,0,1.46,.59,.49,.27,{...t,light:t.side});
      for(const offset of (heavy?[-.28,.28]:[0])){
        const from=Q(.5,offset,1.59),to=Q(2.25,offset,1.59);
        line(c,[from,to],t.dark,heavy?7:6);
        line(c,[from,to],t.light,heavy?4:3);
        const muzzle=Q(2.37,offset,1.59);
        ellipse(c,muzzle[0],muzzle[1],4,3,t.metal,t.light);
      }
      const hatch=Q(-.32,-.1,1.76);
      ellipse(c,hatch[0],hatch[1],5.5,3.3,t.dark,t.light);
      if(s.firing){const muzzle=Q(2.42,heavy?-.28:0,1.59);
        glow(c,muzzle[0],muzzle[1],16,t.accent,.29);}
      if(heavy)for(const sign of [-1,1]){
        strokeModel(c,P,[[-1.22,sign*.76,1.08],[.7,sign*.76,1.08]],t.accent,2);
        for(let i=-2;i<3;i++){
          const p=P(i*.43,sign*.89,1.0);
          box2(c,p[0]-2,p[1]-2,4,4,t.metal,t.dark);
        }
      }
    }
    if(s.moving&&Math.sin(s.phase*1.5)>.1&&kind!=='recon'){
      const exhaust=P(-len*.9,0,.7);glow(c,exhaust[0],exhaust[1],7,'#9ba9ab',.14);
    }
    c.restore();
  }
  function aircraft(c,e,t,s){
    const yaw=e.worldHeading||0,P=projectFactory(yaw,20);
    const bank=s.moving?Math.sin(s.phase*.23+e.id)*2:0;
    const altitude=70+Math.sin(s.phase*.23)*3;
    shadow(c,30,12,4);
    c.save();c.translate(bank,-altitude);
    // Contrasting jet silhouette, cockpit glazing, swept wings, twin stabilizers.
    const wings=[P(-.55,-1.9,.1),P(.7,-.42,.1),P(.7,.42,.1),P(-.55,1.9,.1),P(-1.0,.9,.1),P(-1.0,-.9,.1)];
    poly(c,wings,t.body,t.dark,1.3);
    poly(c,[P(1.87,0,.14),P(-1.5,-.33,.14),P(-1.5,.33,.14)],t.light,t.dark,1.2);
    poly(c,[P(1.12,0,.28),P(.34,-.32,.35),P(-.5,-.25,.3),P(-.5,.25,.3),P(.34,.32,.35)],t.glass,t.dark);
    for(const side of [-1,1]){
      poly(c,[P(-1.25,side*.3,.16),P(-1.88,side*.87,.17),P(-.88,side*.68,.17)],t.side,t.dark);
      line(c,[P(.1,side*1.22,.17),P(-.48,side*1.7,.17)],t.accent,2);
      const nozzle=P(-1.76,side*.18,.18);
      glow(c,nozzle[0],nozzle[1],11,t.accent,.28+Math.sin(s.phase)*.12);
      ellipse(c,nozzle[0],nozzle[1],3.8,2.6,t.accent);
    }
    if(s.firing&&Math.sin(s.phase*2)>.1){
      const n=P(2.0,0,.16);glow(c,n[0],n[1],16,'#fff2c6',.4);
    }
    c.restore();
  }
  function building(c,e,t,time){
    const kind=e.kind,phase=time*1.2+e.id*.17,damaged=e.hp/e.maxHp<.4;
    const P=projectFactory(0,20);
    shadow(c,57,22,7);
    // Reinforced three-tile foundations, ventilation louvers and corner nodes.
    modelBox(c,P,0,0,.10,1.67,1.67,.34,{...t,light:'#303f4c'});
    modelBox(c,P,0,0,.44,1.53,1.48,.22,t);
    for(const x of [-1.35,1.35])for(const y of [-1.2,1.2]){
      const q=P(x,y,.77);ellipse(c,q[0],q[1],2.7,2.7,t.metal,t.accent);
    }
    const pulse=.5+.5*Math.sin(time*2.5+e.id);
    const spin=time*(kind==='radar'?1.2:.65);
    if(kind==='hq'){
      modelBox(c,P,-.22,.0,.67,1.1,1.11,2.6,t);
      modelBox(c,P,.08,.0,3.27,.91,.85,.35,{...t,light:t.side});
      for(const side of [-1,1]){
        windowPanel(c,P,.45,side*1.14,1.37,.37,.42,t);
        windowPanel(c,P,-.43,side*1.14,2.35,.25,.46,t);
      }
      modelBox(c,P,.92,-.2,1.05,.4,.43,.65,{...t,light:t.dark});
      const beacon=P(0,0,4.05);glow(c,beacon[0],beacon[1],15,t.accent,.1+.2*pulse);
      ellipse(c,beacon[0],beacon[1],4.5,4.5,t.accent);
      strokeModel(c,P,[[0,0,3.63],[0,0,4.27]],t.light,2.3);
    }else if(kind==='generator'){
      modelBox(c,P,-.08,0,.74,.86,.99,1.12,t);
      for(const y of [-.68,.68]){
        const b=P(0,y,2.02);glow(c,b[0],b[1],19,t.accent,.20+.12*pulse);
        modelBox(c,P,0,y,1.85,.34,.27,.72,{...t,light:t.metal});
        for(let j=0;j<5;j++){
          const z=1.95+j*.12;
          strokeModel(c,P,[[-.28,y-.30,z],[.28,y-.30,z]],t.accent,1.6);
        }
      }
      modelBox(c,P,-.9,.0,1.02,.3,.3,1.52,{...t,light:t.dark});
      const p=P(-.9,0,2.7);
      ellipse(c,p[0],p[1],5,2.5,t.accent);
    }else if(kind==='refinery'){
      modelBox(c,P,-.57,.08,.7,.72,.99,1.8,t);
      modelBox(c,P,.62,.1,.72,.57,1.14,.7,{...t,light:t.side});
      for(let i=0;i<3;i++){
        const x=-.97+i*.35,p=P(x,-.63,2.61);
        ellipse(c,p[0],p[1],9,5,'#a87a4c',t.dark);
        ellipse(c,p[0],p[1]-1,5,3,'#e6bd75');
      }
      const active=((time*.7)%1);
      strokeModel(c,P,[[.1,-1.2,1.18],[1.27,-1.2,1.18]],t.accent,4);
      const p=P(.16+active,-1.2,1.23);ellipse(c,p[0],p[1],4,4,'#ffcc81');
    }else if(kind==='barracks'){
      modelBox(c,P,0,0,.73,1.15,.85,1.37,t);
      modelBox(c,P,.0,.05,2.1,1.2,.93,.22,{...t,light:t.side});
      for(let i=-1;i<=1;i++)windowPanel(c,P,i*.54,-.87,1.21,.17,.27,t);
      const mast=P(-.91,.49,3.05),base=P(-.91,.49,2.23);
      line(c,[base,mast],t.light,2);
      poly(c,[mast,[mast[0]+16,mast[1]+3+Math.sin(phase*2)*2],[mast[0],mast[1]+9]],t.accent,null);
      modelBox(c,P,.79,.0,.77,.3,.5,.29,{...t,light:t.metal});
    }else if(kind==='factory'){
      modelBox(c,P,-.27,.0,.73,1.22,1.21,1.56,t);
      modelBox(c,P,-.27,.0,2.29,1.37,1.27,.22,{...t,light:t.metal});
      modelBox(c,P,1.03,.0,.72,.39,.83,.9,{...t,light:t.dark});
      for(let i=-1;i<=1;i++){
        strokeModel(c,P,[[-1.25,i*.53,1.48],[-1.25,i*.53,2.04]],t.accent,2.4);
      }
      strokeModel(c,P,[[-.9,-1.1,3.04],[1.12,-1.1,3.04]],t.light,3);
      strokeModel(c,P,[[.59,-1.1,3.04],[.59,-1.1,1.57]],t.accent,1.5);
      const p=P(.59,-1.1,1.57);
      poly(c,[[p[0]-5,p[1]-2],[p[0],p[1]+5],[p[0]+5,p[1]-2]],t.metal);
    }else if(kind==='radar'){
      modelBox(c,P,0,.0,.7,.9,.9,1.49,t);
      modelBox(c,P,0,0,2.19,.45,.45,.18,{...t,light:t.side});
      const bottom=P(0,0,2.37),top=P(0,0,3.61);
      line(c,[bottom,top],t.light,3.5);
      // Sweeping parabolic dish with rotating scan line.
      const dish=P(Math.cos(spin)*.34,Math.sin(spin)*.34,3.6);
      ellipse(c,dish[0],dish[1],20,8.5,t.metal,t.accent);
      line(c,[[dish[0]-17,dish[1]-1],[dish[0]+17,dish[1]+1]],t.light,2);
      line(c,[[dish[0],dish[1]],[dish[0]+Math.cos(spin)*19,dish[1]+Math.sin(spin)*8]],t.accent,2.4);
      glow(c,dish[0],dish[1],18,t.accent,.07+.08*pulse);
    }else if(kind==='tech'){
      modelBox(c,P,-.45,.15,.67,.68,1.05,2.15,t);
      modelBox(c,P,.65,-.25,.67,.47,.51,1.63,{...t,light:t.side});
      const core=P(0,0,3.03);
      glow(c,core[0],core[1],30,t.accent,.20+.09*pulse);
      poly(c,[[core[0],core[1]-18],[core[0]+13,core[1]],
        [core[0],core[1]+15],[core[0]-13,core[1]]],t.glass,t.accent,1.8);
      for(let i=0;i<3;i++){
        c.beginPath();c.ellipse(core[0],core[1],15+i*5,6+i*3,time*.25+i,0,TAU);
        c.strokeStyle=t.accent;c.lineWidth=1.1;c.stroke();
      }
    }else if(kind==='turret'||kind==='beam'){
      modelBox(c,P,0,0,.74,.7,.7,1.55,t);
      modelBox(c,P,0,0,2.29,.51,.51,.3,{...t,light:t.side});
      if(kind==='turret'){
        const H=projectFactory(time*.3+e.id,20);
        modelBox(c,H,0,0,2.58,.55,.44,.28,t);
        strokeModel(c,H,[[.25,-.17,2.62],[1.39,-.17,2.62]],t.light,5);
        strokeModel(c,H,[[.25,.17,2.62],[1.39,.17,2.62]],t.dark,5);
        const p=H(1.4,-.17,2.62);ellipse(c,p[0],p[1],3,3,t.accent);
      }else{
        strokeModel(c,P,[[0,0,2.59],[0,0,3.89]],t.accent,4);
        for(let i=0;i<3;i++){
          const b=P(0,0,2.9+i*.35);
          ellipse(c,b[0],b[1],12-i*2,4,t.metal,t.accent);
        }
        const p=P(0,0,3.93);
        glow(c,p[0],p[1],21,t.accent,.2+.2*pulse);
        ellipse(c,p[0],p[1],6,6,t.glass,t.accent);
      }
    }else if(kind==='airfield'){
      // Wide landing pad with animated approach beacon and hangar roof.
      modelBox(c,P,-.46,.33,.73,.98,.91,1.4,t);
      modelBox(c,P,-.46,.33,2.13,1.1,1.02,.16,{...t,light:t.side});
      poly(c,[P(.45,-1.27,.83),P(1.38,-1.27,.83),P(1.38,.96,.83),P(.45,.96,.83)],t.metal,t.light);
      for(let i=-2;i<=2;i++)strokeModel(c,P,[[.91,i*.35,.85],[.91,i*.35+.18,.85]],i%2?t.accent:'#d5dfde',2);
      const beacon=P(1.4,-1.3,1.5);
      glow(c,beacon[0],beacon[1],12,t.accent,.12+.28*(Math.sin(time*5)>0?1:0));
      ellipse(c,beacon[0],beacon[1],3,3,t.accent);
    }
    if(e.built&&damaged){
      const x=Math.sin(e.id*2)*10,y=-48-(time*11)%18;
      ellipse(c,x,y,8+Math.sin(time*3)*2,4,'rgba(88,99,109,.40)');
    }
  }
  function drawUnit(c,e,options={}){
    if(!e||!THEMES[options.faction]||!['soldier','specialist','heavy','recon','harvester','aircraft'].includes(e.kind))return false;
    const t=THEMES[options.faction],s=state(e,options.time||0);
    c.save();
    if(e.kind==='soldier'||e.kind==='specialist')infantry(c,e,t,s);
    else if(e.kind==='aircraft')aircraft(c,e,t,s);
    else vehicle(c,e,t,s);
    c.restore();return true;
  }
  function drawBuilding(c,e,options={}){
    if(!e||!THEMES[options.faction])return false;
    c.save();c.globalAlpha=e.built?1:limit(e.construction||0,.28,.95);
    building(c,e,THEMES[options.faction],options.time||0);
    c.restore();return true;
  }
  function tankOverlay(c,e,options={}){
    if(!THEMES[options.faction])return;
    const t=THEMES[options.faction],s=state(e,options.time||0);
    if(s.moving){
      for(const sign of [-1,1]){
        const x=sign*17+Math.sin(s.phase)*3;
        ellipse(c,x,3,3.5,1.5,'rgba(174,167,150,.3)');
      }
    }
    if(s.firing){
      const angle=e.turretHeading??e.worldHeading??0;
      const P=projectFactory(angle,16.5),p=P(2.45,0,1.61);
      glow(c,p[0],p[1],11,t.accent,.27);
    }
  }
  root.ChronoAnimatedArt={version:'1.0.0',themes:THEMES,drawUnit,drawBuilding,tankOverlay,
    /** non-visual hook for smoke-test validation */ availableKinds:['soldier','specialist','heavy','recon','harvester','aircraft']};
})(typeof window==='object'?window:globalThis);
