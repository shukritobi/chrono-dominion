import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const loaderSource=readFileSync(new URL('../audio/builtin-loader.js',import.meta.url),'utf8');
const soundSource=readFileSync(new URL('../audio/sfx.js',import.meta.url),'utf8');
const manifest=(()=>{
  const events={
    'voice.select.federation.soldier':['voices/federation/soldier/select/01.mp3'],
    'shot.tank':['sfx/shot.tank/01.mp3','sfx/shot.tank/02.mp3'],
    'announce.unitLost':['announcer/unitLost/01.mp3']
  };
  for(let i=0;i<466;i++)events['extra'+i]=['sfx/extra'+i+'/01.mp3'];
  return {schema:'chrono-dominion-builtin-audio-v1',events,music:{
    'music.battle':['music/music-battle.mp3'],
    'music.menu':['music/music-menu.mp3'],
    'music.victory':['music/music-victory.mp3']
  }};
})();

function harness(responseData=manifest){
  const audioElements=[],tones=[],store=new Map();
  let time=2000,requests=0;
  class Audio {
    constructor(src){this.src=src;this.volume=1;this.loop=false;this.paused=false;audioElements.push(this);}
    play(){this.started=true;return Promise.resolve();}
    pause(){this.paused=true;}
  }
  class AudioContext {
    constructor(){this.state='running';this.currentTime=22;this.destination={};}
    createOscillator(){return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},
      connect(){},start(){tones.push('start');},stop(){}};}
    createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
  }
  const root={
    Audio,AudioContext,
    performance:{now:()=>time},
    localStorage:{getItem:k=>store.get(k)??null,setItem:(k,value)=>store.set(k,String(value))},
    URL:{createObjectURL:f=>'blob:local/'+f.name,revokeObjectURL(){}},
    fetch:async path=>{
      requests++;
      assert.equal(path,'./audio/builtin/audio-map.json');
      return {ok:true,json:async()=>responseData};
    },
    setInterval:()=>99,clearInterval:()=>{},
  };
  runInNewContext(loaderSource,{window:root});
  runInNewContext(soundSource,{window:root});
  return {root,bank:root.ChronoBuiltin,sfx:root.ChronoAudio,audioElements,tones,
    advance:()=>time+=1000,requests:()=>requests};
}
test('built-in 473-asset manifest loads automatically without fetching any MP3',async()=>{
  const h=harness();
  assert.equal(await h.bank.load(),true);
  assert.equal(h.bank.status,'ready');
  assert.equal(h.bank.fileCount,473);
  assert.equal(h.requests(),1);
  assert.equal(h.audioElements.length,0);
  assert.equal(h.bank.find('select',{faction:'federation',kind:'soldier'}),
    './audio/builtin/voices/federation/soldier/select/01.mp3');
  assert.equal(h.bank.find('announce.unitLost'),'./audio/builtin/announcer/unitLost/01.mp3');
  assert.equal(h.bank.music('battle')[0],'./audio/builtin/music/music-battle.mp3');
});
test('playing built-in clips uses hosted MP3 URLs and starts battle score',async()=>{
  const h=harness();await h.bank.load();
  h.sfx.setEnabled(true);h.sfx.setScene('battle');
  h.advance();assert.equal(h.sfx.play('select',{faction:'federation',kind:'soldier'}),true);
  assert.ok(h.audioElements.some(a=>a.src.includes('voices/federation/soldier/select/01.mp3')));
  h.advance();assert.equal(h.sfx.play('shot.tank',{kind:'tank'}),true);
  assert.ok(h.audioElements.some(a=>a.src.includes('sfx/shot.tank/')));
  h.advance();assert.equal(h.sfx.announce('unitLost'),true);
  assert.ok(h.audioElements.some(a=>a.src.includes('announcer/unitLost/01.mp3')));
  assert.ok(h.audioElements.some(a=>a.src.includes('music/music-battle.mp3')&&a.loop));
});
test('locally imported recordings override built-in audio without deleting it',async()=>{
  const h=harness();await h.bank.load();h.sfx.setEnabled(true);
  await h.sfx.importFiles([{name:'select.mp3',webkitRelativePath:'my-sounds/select.mp3',size:1200}]);
  h.advance();assert.equal(h.sfx.play('select'),true);
  assert.ok(h.audioElements.some(a=>a.src==='blob:local/select.mp3'));
  h.sfx.clearLocalPack();
  assert.equal(h.bank.status,'ready');
  h.advance();assert.equal(h.sfx.play('shot.tank'),true);
  assert.ok(h.audioElements.some(a=>a.src.includes('sfx/shot.tank/')));
});
test('invalid manifest fails gracefully with browser synthesis fallback',async()=>{
  const h=harness({schema:'unknown',events:{},music:{}});
  assert.equal(await h.bank.load(),false);
  assert.equal(h.bank.status,'unavailable');
  h.sfx.setEnabled(true);
  const before=h.tones.length;
  h.advance();assert.equal(h.sfx.play('shot.tank'),true);
  assert.ok(h.tones.length>before);
});
