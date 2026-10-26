import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../audio/sfx.js',import.meta.url),'utf8');
function harness(){
  const played=[],revoked=[],tones=[];
  const store=new Map();
  let clock=1200;
  class Audio {
    constructor(src){this.src=src;this.volume=1;this.loop=false;played.push(this);}
    play(){this.started=true;return Promise.resolve();}
    pause(){this.paused=true;}
  }
  class AudioContext {
    constructor(){this.state='running';this.currentTime=10;this.destination={};}
    createOscillator(){
      return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},
        connect(){},start(){tones.push('start');},stop(){},type:''};
    }
    createGain(){
      return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};
    }
  }
  const root={
    Audio,AudioContext,
    performance:{now:()=>clock},
    localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},
    URL:{createObjectURL:file=>'blob:local/'+file.name,revokeObjectURL:url=>revoked.push(url)},
    setInterval:()=>99,clearInterval:()=>{}
  };
  runInNewContext(source,{window:root});
  return {api:root.ChronoAudio,played,revoked,tones,clock:()=>clock+=1000,store};
}
const file=(name,path=name)=>({name,webkitRelativePath:'my-sounds/'+path,size:192,text:async()=>''});

test('audio starts muted and remembers opt-in',()=>{
  const {api,store}=harness();
  assert.equal(api.enabled,false);
  assert.equal(api.play('shot'),false);
  assert.equal(api.setEnabled(true),true);
  assert.equal(store.get('chrono-dominion-sound-enabled-v1'),'true');
  assert.equal(api.play('shot'),true);
  assert.equal(api.setEnabled(false),false);
  assert.equal(api.play('shot'),false);
});

test('volume controls clamp and music scenes work',()=>{
  const {api,store}=harness();
  api.setEnabled(true);
  assert.equal(api.setSfxVolume(2),1);
  assert.equal(api.setMusicVolume(-8),0);
  assert.equal(store.get('chrono-dominion-music-volume-v1'),'0');
  assert.equal(api.setScene('battle'),'battle');
  assert.equal(api.setScene('pause'),'pause');
  assert.equal(api.setMusicEnabled(false),false);
  assert.equal(api.setScene('menu'),'menu');
});

test('local pack maps private filenames without uploading or persistence',async()=>{
  const {api,played,revoked,clock}=harness();
  api.setEnabled(true);
  api.setScene('battle');
  const config={
    name:'audio-map.json',size:250,text:async()=>JSON.stringify({
      events:{
        'voice.select.coalition.soldier':['ra2/infantry-yes-01.wav'],
        'shot.tank':['ra2/cannon.wav']
      },
      music:{'music.battle':['tracks/war-loop.ogg']}
    })
  };
  const stats=await api.importFiles([
    file('infantry-yes-01.wav','ra2/infantry-yes-01.wav'),
    file('cannon.wav','ra2/cannon.wav'),
    file('war-loop.ogg','tracks/war-loop.ogg'),
    file('explosion.wav'),
    config
  ]);
  assert.equal(stats.loaded,4);
  assert.equal(stats.matched,4);
  assert.equal(stats.tracks,1);
  assert.ok(played.some(x=>x.src==='blob:local/war-loop.ogg'&&x.loop));
  clock();
  assert.equal(api.play('select',{kind:'soldier',faction:'coalition'}),true);
  assert.ok(played.some(x=>x.src==='blob:local/infantry-yes-01.wav'&&x.started));
  clock();
  assert.equal(api.play('shot.tank',{kind:'tank'}),true);
  assert.ok(played.some(x=>x.src==='blob:local/cannon.wav'));
  api.clearLocalPack();
  assert.equal(api.imported.loaded,0);
  assert.ok(revoked.includes('blob:local/cannon.wav'));
  assert.equal(api.imported.unmapped,0);
});

test('unmapped audio falls back to original synthesized cue',async()=>{
  const {api,tones}=harness();
  api.setEnabled(true);
  api.setScene('pause');
  const before=tones.length;
  assert.equal(api.play('shot.heavy',{kind:'heavy'}),true);
  assert.ok(tones.length>before);
  const skipped=await api.importFiles([{name:'notes.txt',size:15}]);
  assert.equal(skipped.loaded,0);
});
