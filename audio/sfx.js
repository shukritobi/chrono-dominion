/* Chrono Dominion v1.3 original synthesized effects. No audio assets. */
(function(root){
  'use strict';
  const KEY='chrono-dominion-sound-enabled-v1';
  const presets={
    shot:{frequency:170,end:82,duration:.075,type:'sawtooth',gain:.034,gap:.095},
    impact:{frequency:80,end:43,duration:.14,type:'triangle',gain:.035,gap:.14},
    build:{frequency:320,end:470,duration:.22,type:'sine',gain:.055,gap:.16},
    ability:{frequency:290,end:790,duration:.36,type:'sine',gain:.065,gap:.15},
    win:{frequency:360,end:620,duration:.55,type:'triangle',gain:.07,gap:.3},
    defeat:{frequency:260,end:85,duration:.52,type:'sawtooth',gain:.05,gap:.3}
  };
  let enabled=false;
  try{enabled=root.localStorage?.getItem(KEY)==='true';}catch(err){}
  let context=null;
  const last=new Map();
  const api={
    get enabled(){return enabled;},
    unlock(){
      if(!enabled)return false;
      const Class=root.AudioContext||root.webkitAudioContext;
      if(!Class)return false;
      try{
        context??=new Class();
        if(context.state==='suspended')context.resume()?.catch?.(()=>{});
        return true;
      }catch(err){return false;}
    },
    setEnabled(next){
      enabled=!!next;
      try{root.localStorage?.setItem(KEY,String(enabled));}catch(err){}
      if(enabled)this.unlock();
      return enabled;
    },
    play(name){
      const spec=presets[name];
      if(!enabled||!spec||!context||context.state==='closed'||context.state==='suspended')return false;
      try{
        const now=context.currentTime;
        if(now-(last.get(name)??-Infinity)<spec.gap)return false;
        last.set(name,now);
        const osc=context.createOscillator(),vol=context.createGain();
        osc.type=spec.type;
        osc.frequency.setValueAtTime(spec.frequency,now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(1,spec.end),now+spec.duration);
        vol.gain.setValueAtTime(.0001,now);
        vol.gain.exponentialRampToValueAtTime(spec.gain,now+.012);
        vol.gain.exponentialRampToValueAtTime(.0001,now+spec.duration);
        osc.connect(vol);vol.connect(context.destination);
        osc.start(now);osc.stop(now+spec.duration+.02);
        return true;
      }catch(err){return false;}
    }
  };
  root.ChronoAudio=api;
})(typeof window!=='undefined'?window:globalThis);
