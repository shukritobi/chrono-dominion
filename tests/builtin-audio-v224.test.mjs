import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../audio/sfx.js',import.meta.url),'utf8');

function sandbox() {
  const media=[],requests=[],spoken=[],store=new Map(),revoked=[];
  class Audio {
    constructor(src){this.src=src;this.volume=1;this.loop=false;media.push(this);}
    play(){this.played=true;return Promise.resolve();}
    pause(){this.paused=true;}
  }
  class AudioContext {
    constructor(){this.state='running';this.currentTime=10;this.destination={};}
    createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
    createOscillator(){return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},start(){},stop(){}};}
  }
  const root={
    Audio,AudioContext,performance:{now:()=>100000},
    fetch:async url=>{
      requests.push(url);
      return {ok:true,json:async()=>({
        schema:'chrono-dominion-builtin-audio-v1',
        events:{
          'voice.select.coalition.soldier':['voices/coalition/soldier/select/01.mp3'],
          'voice.ready.federation.soldier':['voices/federation/soldier/ready/01.mp3'],
          'announce.unitLost':['announcer/unitLost/01.mp3'],
          'shot.tank':['sfx/shot.tank/01.mp3'],
          'bad':['../secrets.mp3']
        },
        music:{'music.battle':['music/music-battle.mp3']}
      })}
    },
    localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},
    URL:{createObjectURL:f=>'blob:local/'+f.name,revokeObjectURL:u=>revoked.push(u)},
    ChronoVoices:{speak:(...args)=>{spoken.push(args);return true;},stop(){}},
    setInterval:()=>42,clearInterval:()=>{}
  };
  runInNewContext(source,{window:root});
  return {api:root.ChronoAudio,media,requests,spoken,store,revoked};
}

test('automatically indexes shipped recordings and ignores traversal',async()=>{
  const {api,requests}=sandbox();
  assert.equal(api.enabled,false);
  assert.equal(await api.loadBuiltins(),5);
  assert.equal(api.builtinCount,5);
  assert.equal(requests.length,1);
  assert.equal(requests[0],'./audio/builtin/audio-map.json');
});

test('built-in unit voices and mission announcements play without an imported folder',async()=>{
  const {api,media,spoken}=sandbox();
  await api.loadBuiltins();
  api.setEnabled(true);
  api.setScene('battle');
  assert.equal(api.play('select',{faction:'coalition',kind:'soldier'}),true);
  assert.ok(media.some(x=>x.played&&x.src.endsWith('voices/coalition/soldier/select/01.mp3')));
  assert.equal(api.announce('unitLost'),true);
  assert.ok(media.some(x=>x.played&&x.src.endsWith('announcer/unitLost/01.mp3')));
  assert.equal(api.play('shot.tank',{kind:'tank'}),true);
  assert.ok(media.some(x=>x.played&&x.src.endsWith('sfx/shot.tank/01.mp3')));
  assert.equal(spoken.length,0,'pack should play before browser TTS fallback');
  assert.ok(media.some(x=>x.loop&&x.src.endsWith('music/music-battle.mp3')));
});

test('local overrides and voice mute do not delete built-in pack',async()=>{
  const {api,media}=sandbox();
  await api.loadBuiltins();
  api.setEnabled(true);
  api.setScene('pause');
  const mock={
    name:'custom.mp3',webkitRelativePath:'my-pack/custom.mp3',size:1200
  };
  const map={name:'audio-map.json',size:100,
    text:async()=>JSON.stringify({events:{'voice.select.coalition.soldier':'custom.mp3'}})};
  await api.importFiles([mock,map]);
  assert.equal(api.imported.matched,1);
  assert.equal(api.play('select',{faction:'coalition',kind:'soldier'}),true);
  assert.ok(media.some(x=>x.src==='blob:local/custom.mp3'));
  api.clearLocalPack();
  assert.equal(api.builtinCount,5);
  api.setVoiceEnabled(false);
  assert.equal(api.announce('unitLost'),true);
});
