/* Chrono Dominion v2.21: original browser audio + local bring-your-own sound packs.
   No retail recordings are hosted, downloaded, cached in storage, or committed. */
(function(root){
  'use strict';
  const KEY='chrono-dominion-sound-enabled-v1';
  const SFX_KEY='chrono-dominion-sfx-volume-v1';
  const MUSIC_KEY='chrono-dominion-music-volume-v1';
  const MUSIC_ON_KEY='chrono-dominion-music-enabled-v1';
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,Number(v)||0));
  const read=(k,f)=>{try{return root.localStorage?.getItem(k)??f;}catch(e){return f;}};
  const write=(k,v)=>{try{root.localStorage?.setItem(k,String(v));}catch(e){}};
  const normalize=p=>String(p||'').replace(/\\/g,'/').toLowerCase().replace(/^\.\//,'').replace(/^\/+/, '');
  const stem=p=>normalize(p).split('/').pop().replace(/\.(wav|ogg|mp3|m4a|webm)$/i,'');
  const kinds=['select','move','attack','ready','queue','build','shot','impact','explosion','ability','alert','win','defeat','ui'];
  const tones={
    select:{frequency:380,end:540,duration:.11,type:'triangle',gain:.040,gap:.16},
    move:{frequency:280,end:360,duration:.12,type:'sine',gain:.040,gap:.32},
    attack:{frequency:250,end:140,duration:.17,type:'sawtooth',gain:.043,gap:.31},
    ready:{frequency:440,end:680,duration:.18,type:'sine',gain:.045,gap:.38},
    queue:{frequency:440,end:360,duration:.08,type:'triangle',gain:.034,gap:.16},
    shot:{frequency:170,end:82,duration:.075,type:'sawtooth',gain:.034,gap:.08},
    impact:{frequency:80,end:43,duration:.14,type:'triangle',gain:.035,gap:.12},
    explosion:{frequency:65,end:24,duration:.35,type:'sawtooth',gain:.038,gap:.16},
    build:{frequency:320,end:470,duration:.22,type:'sine',gain:.055,gap:.16},
    ability:{frequency:290,end:790,duration:.36,type:'sine',gain:.065,gap:.15},
    alert:{frequency:560,end:420,duration:.22,type:'triangle',gain:.05,gap:.55},
    ui:{frequency:440,end:340,duration:.065,type:'sine',gain:.025,gap:.07},
    win:{frequency:360,end:620,duration:.55,type:'triangle',gain:.07,gap:.3},
    defeat:{frequency:260,end:85,duration:.52,type:'sawtooth',gain:.05,gap:.3}
  };
  let enabled=read(KEY,'false')==='true';
  let sfxVolume=clamp(read(SFX_KEY,'.8'));
  let musicVolume=clamp(read(MUSIC_KEY,'.35'));
  let musicEnabled=read(MUSIC_ON_KEY,'true')!=='false';
  let context=null,scene='menu',musicTimer=null,musicElement=null,nextBeat=0,step=0;
  const last=new Map(),urls=new Map(),loaded=new Map(),active=[];
  let lastImport={loaded:0,matched:0,tracks:0,unmapped:0};
  const AudioClass=()=>root.Audio;
  function osc(frequency,end,duration,type,gain,at){
    if(!context)return false;
    const a=context.createOscillator(),v=context.createGain();
    a.type=type;a.frequency.setValueAtTime(Math.max(1,frequency),at);
    a.frequency.exponentialRampToValueAtTime(Math.max(1,end),at+duration);
    v.gain.setValueAtTime(.0001,at);
    v.gain.exponentialRampToValueAtTime(Math.max(.00011,gain),at+.012);
    v.gain.exponentialRampToValueAtTime(.0001,at+duration);
    a.connect(v);v.connect(context.destination);a.start(at);a.stop(at+duration+.03);
    return true;
  }
  function find(name,meta={}){
    const faction=String(meta.faction||'').toLowerCase(),kind=String(meta.kind||'').toLowerCase();
    const choices=[];
    if(faction&&kind)choices.push('voice.'+name+'.'+faction+'.'+kind);
    if(kind)choices.push('voice.'+name+'.'+kind);
    if(faction)choices.push('voice.'+name+'.'+faction);
    choices.push('voice.'+name);
    if(faction&&kind)choices.push(name+'.'+faction+'.'+kind);
    if(kind)choices.push(name+'.'+kind);
    if(faction)choices.push(name+'.'+faction);
    choices.push(name);
    if(name.includes('.'))choices.push(name.split('.')[0]);
    for(const key of choices){const entries=loaded.get(key);if(entries?.length)return entries[Math.floor(Math.random()*entries.length)];}
    return null;
  }
  function fileUrl(file){
    if(urls.has(file))return urls.get(file);
    if(!root.URL?.createObjectURL)return null;
    const url=root.URL.createObjectURL(file);urls.set(file,url);return url;
  }
  function startClip(file,volume){
    const C=AudioClass();if(typeof C!=='function'||active.length>=16)return false;
    const src=fileUrl(file);if(!src)return false;
    try{
      const a=new C(src);a.volume=clamp(volume);a.preload='auto';
      active.push(a);
      const remove=()=>{const i=active.indexOf(a);if(i>=0)active.splice(i,1);};
      a.onended=remove;a.onerror=remove;
      const p=a.play();if(p?.catch)p.catch(remove);
      return true;
    }catch(e){return false;}
  }
  function stopMusic(){
    if(musicTimer!==null){root.clearInterval?.(musicTimer);musicTimer=null;}
    if(musicElement){musicElement.pause?.();musicElement.src='';musicElement=null;}
  }
  function musicNote(freq,dur,at,level=.004){
    osc(freq,freq*.995,dur,'triangle',level*musicVolume,at);
  }
  function scheduleMusic(){
    if(!context||!enabled||!musicEnabled||context.state!=='running')return;
    const beat=60/110/2;
    while(nextBeat<context.currentTime+.32){
      const i=step%16;
      // Original generated industrial ambience, not a transcription of game music.
      const bass=scene==='battle'?[55,55,65.406,49,55,73.416,65.406,49]:
        [65.406,65.406,73.416,82.407,65.406,73.416,61.735,55];
      if(i%2===0)musicNote(bass[Math.floor(step/2)%bass.length],beat*1.8,nextBeat,scene==='battle'?.008:.0035);
      if(scene==='battle'&&i%4===2)musicNote(110,beat*.36,nextBeat,.0021);
      if(i===0||i===8){
        const rootFreq=scene==='battle'?110:130.813;
        musicNote(rootFreq,beat*7.5,nextBeat,.0025);
        musicNote(rootFreq*1.5,beat*7.5,nextBeat,.0018);
      }
      step++;nextBeat+=beat;
    }
  }
  function resumeMusic(){
    stopMusic();
    if(!enabled||!musicEnabled||!context||context.state!=='running')return;
    const files=loaded.get('music.'+scene)||loaded.get('music.battle')||loaded.get('music');
    const C=AudioClass();
    if(files?.length&&typeof C==='function'){
      const file=files[Math.floor(Math.random()*files.length)],src=fileUrl(file);
      if(src){
        const a=new C(src);
        a.volume=clamp(musicVolume*.48);a.loop=true;a.preload='metadata';
        musicElement=a;
        a.onerror=()=>{if(musicElement===a){musicElement=null;startSynthMusic();}};
        const p=a.play();if(p?.catch)p.catch(()=>{if(musicElement===a){musicElement=null;startSynthMusic();}});
        return;
      }
    }
    startSynthMusic();
  }
  function startSynthMusic(){
    if(musicTimer!==null)root.clearInterval?.(musicTimer);
    nextBeat=context.currentTime+.05;step=0;
    scheduleMusic();
    musicTimer=root.setInterval?.(scheduleMusic,160)??null;
  }
  const api={
    get enabled(){return enabled;},
    get musicEnabled(){return musicEnabled;},
    get sfxVolume(){return sfxVolume;},
    get musicVolume(){return musicVolume;},
    get imported(){return {...lastImport};},
    get scene(){return scene;},
    unlock(){
      if(!enabled)return false;
      const C=root.AudioContext||root.webkitAudioContext;
      if(typeof C!=='function')return false;
      try{
        context??=new C();
        if(context.state==='suspended'){
          const p=context.resume();
          if(p?.then)p.then(()=>resumeMusic()).catch(()=>{});
        }else if(musicEnabled&&!musicElement&&musicTimer===null)resumeMusic();
        return true;
      }catch(e){return false;}
    },
    setEnabled(next){
      enabled=!!next;write(KEY,enabled);
      if(enabled)this.unlock();
      else{stopMusic();for(const a of active.splice(0)){try{a.pause();}catch(e){}}}
      return enabled;
    },
    setSfxVolume(value){sfxVolume=clamp(value);write(SFX_KEY,sfxVolume);return sfxVolume;},
    setMusicVolume(value){
      musicVolume=clamp(value);write(MUSIC_KEY,musicVolume);
      if(musicElement)musicElement.volume=clamp(musicVolume*.48);
      return musicVolume;
    },
    setMusicEnabled(value){
      musicEnabled=!!value;write(MUSIC_ON_KEY,musicEnabled);
      if(musicEnabled){this.unlock();if(context?.state==='running')resumeMusic();}
      else stopMusic();
      return musicEnabled;
    },
    setScene(next){
      const name=['menu','battle','victory','defeat','pause'].includes(next)?next:'menu';
      if(name===scene)return scene;
      scene=name;
      if(name==='pause'||name==='victory'||name==='defeat')stopMusic();
      else if(enabled&&context?.state==='running')resumeMusic();
      return scene;
    },
    play(name,meta={}){
      if(!enabled)return false;
      const base=String(name).split('.')[0],spec=tones[base]||tones.ui;
      // Prevent repeated barks, especially when commanding big formations.
      const now=typeof root.performance?.now==='function'?root.performance.now()/1000:Date.now()/1000;
      const gap=(base==='select'||base==='move'||base==='attack')?.35:spec.gap;
      if(now-(last.get(base)??-Infinity)<gap)return false;
      last.set(base,now);
      const f=find(String(name),meta);
      if(f&&startClip(f,sfxVolume*.88))return true;
      if(!context||context.state!=='running'||sfxVolume<=0)return false;
      try{return osc(spec.frequency,spec.end,spec.duration,spec.type,spec.gain*sfxVolume,context.currentTime);}
      catch(e){return false;}
    },
    clearLocalPack(){
      stopMusic();
      for(const a of active.splice(0)){try{a.pause();}catch(e){}}
      for(const url of urls.values()){try{root.URL?.revokeObjectURL(url);}catch(e){}}
      urls.clear();loaded.clear();lastImport={loaded:0,matched:0,tracks:0,unmapped:0};
      if(enabled&&context?.state==='running'&&musicEnabled)resumeMusic();
      return true;
    },
    async importFiles(fileList){
      const files=Array.from(fileList||[]).filter(f=>/\.(wav|ogg|mp3|m4a|webm)$/i.test(f.name||'')&&f.size<=32*1024*1024);
      const json=Array.from(fileList||[]).find(f=>/^(sound-map|audio-map|chrono-audio-map)\.json$/i.test(f.name||''));
      let mappings={};
      if(json&&json.size<=128*1024){
        try{
          const data=JSON.parse(await json.text());
          if(data&&typeof data==='object')mappings={...(data.events||{}),...(data.music||{})};
        }catch(e){/* Invalid mapping is ignored and convention-based names are used. */}
      }
      const index=new Map(),next=new Map();
      for(const file of files){
        const path=normalize(file.webkitRelativePath||file.name).replace(/^[^/]+\//,'');
        index.set(path,file);index.set(normalize(file.name),file);
        const short=stem(file.name);
        const name=short.replace(/[-_ ]+/g,'.');
        if(kinds.includes(name)||name.startsWith('music.')||
           /^(select|move|attack|shot|impact|explosion|ready|queue|build|ability)\./.test(name)){
          const arr=next.get(name)||[];arr.push(file);next.set(name,arr);
        }
      }
      for(const [event,raw] of Object.entries(mappings)){
        if(!/^[a-z0-9._-]{1,70}$/i.test(event))continue;
        const paths=Array.isArray(raw)?raw:[raw];
        const picks=paths.filter(v=>typeof v==='string'&&v.length<300).map(p=>index.get(normalize(p))).filter(Boolean);
        if(picks.length)next.set(event.toLowerCase(),picks);
      }
      stopMusic();
      for(const a of active.splice(0)){try{a.pause();}catch(e){}}
      for(const url of urls.values()){try{root.URL?.revokeObjectURL(url);}catch(e){}}
      urls.clear();loaded.clear();
      for(const [name,picks] of next)loaded.set(name,picks);
      const matched=new Set([...loaded.values()].flat());
      const tracks=[...loaded.keys()].filter(n=>n.startsWith('music')).length;
      lastImport={loaded:files.length,matched:matched.size,tracks,unmapped:files.length-matched.size};
      if(enabled&&context?.state==='running'&&musicEnabled)resumeMusic();
      return {...lastImport};
    }
  };
  root.ChronoAudio=api;
})(typeof window!=='undefined'?window:globalThis);
