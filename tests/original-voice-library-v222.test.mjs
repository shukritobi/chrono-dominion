import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const voiceSource=readFileSync(new URL('../audio/voices.js',import.meta.url),'utf8');
const audioSource=readFileSync(new URL('../audio/sfx.js',import.meta.url),'utf8');
function setup(){
  const spoken=[],store=new Map(),cancelled=[],started=[];
  let now=5000;
  class SpeechSynthesisUtterance{constructor(text){this.text=text;}}
  const speechSynthesis={
    speak:u=>spoken.push(u),cancel:()=>cancelled.push(1),
    getVoices:()=>[{name:'A',lang:'en-US'},{name:'B',lang:'en-GB'},{name:'C',lang:'en-US'}]
  };
  class AudioContext{
    constructor(){this.state='running';this.currentTime=25;this.destination={};}
    createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
    createOscillator(){return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},
      connect(){},start(){started.push(1);},stop(){}};}
  }
  const window={
    SpeechSynthesisUtterance,speechSynthesis,AudioContext,
    performance:{now:()=>now},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))},
    setInterval:()=>1,clearInterval:()=>{}
  };
  runInNewContext(voiceSource,{window});
  runInNewContext(audioSource,{window});
  return {voices:window.ChronoVoices,audio:window.ChronoAudio,spoken,cancelled,started,store,time:()=>now+=1200};
}

test('large catalog has unique original voice and announcer IDs',()=>{
  const {voices}=setup();
  assert.ok(voices.count>1600,'expected at least 1600 catalog entries, saw '+voices.count);
  const all=voices.records;
  assert.equal(new Set(all.map(r=>r.id)).size,all.length);
  assert.ok(all.every(r=>r.text&&r.text.length<130));
  for(const faction of ['coalition','federation','psionic']){
    for(const kind of ['soldier','specialist','tank','heavy','harvester','recon','airship']){
      assert.ok(all.some(r=>r.id.startsWith('voice.ready.'+faction+'.'+kind+'.')));
      assert.ok(all.some(r=>r.id.startsWith('voice.attack.'+faction+'.'+kind+'.')));
    }
  }
  assert.ok(all.some(r=>r.text.includes('Iron Leviathan')));
  assert.ok(all.some(r=>r.text==='Unit lost.'));
  assert.ok(all.some(r=>r.id.startsWith('announce.structureUnderAttack.')));
});

test('spoken responses vary by faction and register without network requests',()=>{
  const {voices,spoken,time}=setup();
  assert.equal(voices.speak('ready',{faction:'federation',kind:'soldier'},.6),true);
  assert.equal(spoken.length,1);
  assert.ok(spoken[0].voice);
  assert.equal(spoken[0].volume,.6);
  time();
  assert.equal(voices.speak('ready',{faction:'psionic',kind:'airship'},.7),true);
  assert.equal(spoken.length,2);
  assert.ok(spoken[1].text.length>4);
  assert.equal(voices.speak('announce.unitLost',{},.8,true),true);
  assert.equal(spoken.length,3);
});

test('sound engine prioritizes imported sounds, voice synthesis, and tone fallback',()=>{
  const {audio,spoken,started,store,time}=setup();
  assert.equal(audio.enabled,false);
  audio.setEnabled(true);
  audio.setScene('battle');
  assert.equal(audio.voiceEnabled,true);
  time();
  assert.equal(audio.play('select',{faction:'coalition',kind:'soldier'}),true);
  assert.equal(spoken.length,1);
  time();
  assert.equal(audio.announce('unitLost'),true);
  assert.equal(spoken.length,2);
  audio.setVoiceEnabled(false);
  time();
  const before=started.length;
  assert.equal(audio.play('shot.soldier',{kind:'soldier'}),true);
  assert.ok(started.length>before);
  assert.equal(store.get('chrono-dominion-voice-enabled-v1'),'false');
});

test('unknown announcements and missing browser TTS are safe',()=>{
  const {voices,audio}=setup();
  assert.equal(voices.speak('announce.nonexistent',{},.8,true),false);
  audio.setEnabled(false);
  assert.equal(audio.announce('unitLost'),false);
  assert.equal(audio.play('ready'),false);
});
