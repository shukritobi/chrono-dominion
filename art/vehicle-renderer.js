/* Chrono Dominion original vector vehicle source, v0.3.
 * Deterministic orthographic mesh rendering: 32 separate hull and turret facings.
 * The runtime atlases are generated once per session, no commercial sprites used.
 * Replace this module with Blender-exported atlas frames when approved.
 */
(function (root) {
  'use strict';
  const FRAMES=32, SIZE=128, COLS=8, ROWS=4;
  const THEMES={
    coalition:{deck:'#577995',bright:'#9dbece',shadow:'#243d58',track:'#192c3c',trim:'#74e6ed',turret:'#537c9e',barrel:'#b5cbd3',accent:'#3772a7'},
    federation:{deck:'#7d5248',bright:'#c48a71',shadow:'#48302e',track:'#23272c',trim:'#fbb16a',turret:'#98564b',barrel:'#99918c',accent:'#bc523c'},
    psionic:{deck:'#775891',bright:'#b493cd',shadow:'#322545',track:'#262137',trim:'#68ffc3',turret:'#7654a0',barrel:'#7d67af',accent:'#5e387e'}
  };
  function renderFrame(c,theme,angle,part){
    const cos=Math.cos(angle),sin=Math.sin(angle);
    function rot(x,y){return{x:x*cos-y*sin,y:x*sin+y*cos};}
    function project(x,y,z){const p=rot(x,y);return{x:64+(p.x-p.y)*22,y:81+(p.x+p.y)*11-z*24,depth:p.x+p.y-z*.05};}
    function polygon(points,color,stroke='#12202b',lineWidth=1){
      c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();
      c.fillStyle=color;c.fill();
      if(stroke){c.strokeStyle=stroke;c.lineWidth=lineWidth;c.stroke();}
    }
    function line(points,color,w=2){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.stroke();}
    function box(x,y,z,dx,dy,dz,material){
      const v=[
        project(x-dx,y-dy,z),project(x+dx,y-dy,z),
        project(x+dx,y+dy,z),project(x-dx,y+dy,z),
        project(x-dx,y-dy,z+dz),project(x+dx,y-dy,z+dz),
        project(x+dx,y+dy,z+dz),project(x-dx,y+dy,z+dz)
      ];
      const faces=[
        {ids:[0,1,5,4],color:material.shadow},
        {ids:[1,2,6,5],color:material.side||material.shadow},
        {ids:[2,3,7,6],color:material.shadow},
        {ids:[3,0,4,7],color:material.side||material.shadow},
        {ids:[4,5,6,7],color:material.top}
      ];
      // Painter's order from the projected centreline, with top painted last.
      faces.slice(0,4).sort((a,b)=>{
        const avg=face=>face.ids.reduce((s,i)=>s+v[i].depth,0)/4;
        return avg(b)-avg(a);
      }).forEach(f=>polygon(f.ids.map(i=>v[i]),f.color,'#1b2734',1));
      polygon(faces[4].ids.map(i=>v[i]),faces[4].color,'#273241',1.1);
      return v;
    }
    function disc(x,y,z,r,color){const p=project(x,y,z);c.beginPath();c.ellipse(p.x,p.y,r,r*.48,0,0,Math.PI*2);c.fillStyle=color;c.fill();return p;}
    const metal={top:theme.deck,shadow:theme.shadow,side:theme.accent};
    if(part==='hull'){
      const center=project(0,0,0);
      c.fillStyle='#020a16a0';c.beginPath();c.ellipse(center.x+4,center.y+5,47,17,0,0,Math.PI*2);c.fill();
      // Heavy independent treads with the front rollers and top grips.
      for(const side of [-1,1]){
        box(0,side*.77,.11,1.36,.27,.31,{top:theme.track,side:'#171d28',shadow:'#0d1921'});
        for(let i=-3;i<=3;i++){
          const p=project(i*.32,side*(.78+(side>0?.08:0)),.2);
          c.beginPath();c.ellipse(p.x,p.y,3.3,4.6,0,0,Math.PI*2);c.fillStyle='#56616b';c.fill();c.strokeStyle='#18212b';c.stroke();
        }
        for(let i=-4;i<=4;i++){
          const p=project(i*.32,side*.77,.44);
          c.strokeStyle='#5a6570';c.lineWidth=1.6;c.beginPath();c.moveTo(p.x-2,p.y);c.lineTo(p.x+3,p.y+1);c.stroke();
        }
      }
      box(0,0,.42,1.2,.63,.36,metal);
      box(-.17,0,.78,.61,.45,.12,{top:theme.bright,side:theme.deck,shadow:theme.shadow});
      const nose=project(1.12,0,.84),front=project(.86,0,.83);
      line([front,nose],theme.trim,2.5);
      for(const side of [-1,1]){const p=project(.84,side*.43,.81);disc(.84,side*.43,.81,3.0,theme.trim);}
      const p=project(-1.03,0,.83);disc(-1.03,0,.83,3,theme.trim);
      // Top hatches and armor panels
      const hatch=project(-.55,-.15,.96);c.fillStyle='#162a3e';c.fillRect(hatch.x-7,hatch.y-3,14,5);
      if(theme===THEMES.psionic){
        const x=project(.33,-.44,1.05);line([x,project(.6,-.52,1.36)],theme.trim,2);
        const y=project(.33,.44,1.05);line([y,project(.6,.52,1.36)],theme.trim,2);
      }
    } else if(part==='turret'){
      const platform={top:theme.turret,side:theme.shadow,shadow:'#252c38'};
      box(-.08,0,1.02,.57,.43,.27,platform);
      box(.05,0,1.30,.41,.32,.12,{top:theme.bright,side:theme.deck,shadow:theme.shadow});
      if(theme===THEMES.psionic){
        disc(.01,0,1.48,6,theme.trim);
        const p=project(-.28,-.25,1.43),q=project(-.43,-.31,1.93);
        line([p,q],theme.trim,2.4);
      }else{
        const hatch=project(-.20,.06,1.47);disc(-.20,.06,1.47,5,'#283f4c');
        if(theme===THEMES.federation){line([project(-.43,-.28,1.4),project(-.48,-.28,1.99)],theme.trim,1.7);}
      }
      box(.90,0,1.24,.62,.088,.105,{top:theme.barrel,side:theme.accent,shadow:theme.shadow});
      box(1.47,0,1.24,.14,.123,.14,{top:theme.bright,side:theme.shadow,shadow:theme.shadow});
      const muzzle=project(1.63,0,1.39);c.beginPath();c.arc(muzzle.x,muzzle.y,2,0,7);c.fillStyle='#071822';c.fill();
      const lens=project(.38,-.28,1.51);c.fillStyle=theme.trim;c.fillRect(lens.x-2,lens.y-2,4,3);
    }
  }
  function makeAtlas(faction,part){
    if(!root.document||typeof root.document.createElement!=='function')return null;
    const theme=THEMES[faction];if(!theme)return null;
    const canvas=root.document.createElement('canvas');
    canvas.width=COLS*SIZE;canvas.height=ROWS*SIZE;
    const c=canvas.getContext('2d');if(!c)return null;
    for(let dir=0;dir<FRAMES;dir++){
      c.save();c.translate((dir%COLS)*SIZE,Math.floor(dir/COLS)*SIZE);
      renderFrame(c,theme,2*Math.PI*dir/FRAMES,part);c.restore();
    }
    return canvas;
  }
  function createAtlases(){
    const out={};
    for(const faction of Object.keys(THEMES)){
      out[faction]={hull:makeAtlas(faction,'hull'),turret:makeAtlas(faction,'turret')};
    }
    return out;
  }
  function frameIndex(angle){
    return ((Math.round((Number.isFinite(angle)?angle:0)*FRAMES/(Math.PI*2))%FRAMES)+FRAMES)%FRAMES;
  }
  root.ChronoVehicleArt={version:'0.3.0',frameCount:FRAMES,frameSize:SIZE,columns:COLS,createAtlases,frameIndex};
})(typeof window==='object'?window:globalThis);
