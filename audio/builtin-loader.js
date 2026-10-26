/* Chrono Dominion original built-in sound bank.
   The manifest is generated at deployment from authored original dialogue.
   Only short MP3 URLs are resolved; the 473 files are loaded on demand. */
(function(root){
  'use strict';
  const PREFIX='./audio/builtin/';
  const validPath=p=>typeof p==='string'&&p.length<190&&
    /^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9._-]+\.mp3$/.test(p)&&
    !p.split('/').includes('..')&&!p.startsWith('/');
  const validKey=s=>typeof s==='string'&&/^[a-zA-Z0-9._-]{1,110}$/.test(s);
  const events=new Map(),music=new Map();
  let status='loading',inflight=null,fileCount=0,error=null;
  const sanitize=(data,map,field)=>{
    if(!data||typeof data!=='object'||Array.isArray(data))return;
    for(const [key,raw] of Object.entries(data).slice(0,500)){
      if(!validKey(key)||!Array.isArray(raw))continue;
      const files=raw.slice(0,8).filter(validPath).map(path=>PREFIX+path);
      if(files.length)map.set(key,files);
    }
  };
  const pick=arr=>arr?.length?arr[Math.floor(Math.random()*arr.length)]:null;
  const api={
    get status(){return status;},
    get fileCount(){return fileCount;},
    get error(){return error;},
    get eventCount(){return events.size;},
    load(){
      if(inflight)return inflight;
      if(typeof root.fetch!=='function'){status='unavailable';return Promise.resolve(false);}
      inflight=root.fetch(PREFIX+'audio-map.json',{cache:'no-cache'})
        .then(response=>{
          if(!response.ok)throw new Error('manifest HTTP '+response.status);
          return response.json();
        }).then(manifest=>{
          if(manifest?.schema!=='chrono-dominion-builtin-audio-v1')throw new Error('unsupported audio manifest');
          events.clear();music.clear();
          sanitize(manifest.events,events,'events');
          sanitize(manifest.music,music,'music');
          fileCount=[...events.values(),...music.values()].reduce((sum,files)=>sum+files.length,0);
          if(fileCount<400||fileCount>1500)throw new Error('incomplete built-in audio pack');
          status='ready';error=null;
          return true;
        }).catch(err=>{status='unavailable';error=String(err.message||err);return false;});
      return inflight;
    },
    find(name,meta={}){
      if(status!=='ready')return null;
      const faction=String(meta.faction||'').toLowerCase(),kind=String(meta.kind||'').toLowerCase();
      const candidates=[];
      if(faction&&kind)candidates.push('voice.'+name+'.'+faction+'.'+kind);
      if(kind)candidates.push('voice.'+name+'.'+kind);
      if(faction)candidates.push('voice.'+name+'.'+faction);
      candidates.push('voice.'+name);
      if(faction&&kind)candidates.push(name+'.'+faction+'.'+kind);
      if(kind)candidates.push(name+'.'+kind);
      if(faction)candidates.push(name+'.'+faction);
      candidates.push(name);
      if(name.includes('.'))candidates.push(name.split('.')[0]);
      for(const key of candidates){const value=pick(events.get(key));if(value)return value;}
      return null;
    },
    music(scene){
      if(status!=='ready')return null;
      return music.get('music.'+scene)||music.get('music.battle')||null;
    }
  };
  root.ChronoBuiltin=api;
  // Loading the tiny manifest requires no autoplay permission or audio download.
  api.load();
})(typeof window!=='undefined'?window:globalThis);
