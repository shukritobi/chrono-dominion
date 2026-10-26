#!/usr/bin/env node
/* Export all scripted Chrono Dominion audio voice cues to CSV and JSON.
   Generates catalog metadata only; no proprietary or synthesized recordings. */
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const window={};
runInNewContext(readFileSync(resolve(root,'audio/voices.js'),'utf8'),{window});
const {records,announcements}=window.ChronoVoices;
const folder=process.argv.includes('--out')?process.argv[process.argv.indexOf('--out')+1]:resolve(root,'audio/catalog-export');
mkdirSync(folder,{recursive:true});
const extra=[
  ['shot.soldier','rifle impulse','weapons'],['shot.tank','tank cannon','weapons'],
  ['shot.heavy','heavy siege shell','weapons'],['shot.recon','scout gun','weapons'],
  ['shot.specialist','specialist weapon','weapons'],['shot.aircraft','aerial weapon','weapons'],
  ['shot.turret','turret volley','weapons'],['shot.beam','energy tower','weapons'],
  ['impact.soldier','body/armour hit','impacts'],['impact.tank','armoured hull hit','impacts'],
  ['impact.heavy','heavy plate impact','impacts'],['impact.structure','building impact','impacts'],
  ['explosion.vehicle','vehicle destruction','explosions'],
  ['explosion.structure','building collapse','explosions'],
  ['explosion','general blast','explosions'],['radar.ping','tactical ping','interface'],
  ['power.down','brownout','interface'],['power.up','power restored','interface'],
  ['cash.deposit','mineral transfer','economy'],['harvest.loop','mining machinery','economy'],
  ['repair.loop','repair tools','economy'],['missile.launch','strategic launch','weapons'],
  ['shield.hit','shield ricochet','psionic'],['chrono.jump','phase transition','coalition'],
  ['psi.pulse','mental wave','psionic'],['airship.engine','airship turbines','vehicles'],
  ['aircraft.flyby','aircraft flyover','vehicles'],['tank.tread','tank treads','vehicles'],
  ['infantry.steps','walking infantry','infantry'],['ui','click','interface'],
  ['queue','production queue','interface'],['build','construction confirmed','interface'],
  ['alert','urgent alert','interface'],['ready','unit deployment','interface'],
  ['ability','special power','powers'],['win','victory sting','result'],
  ['defeat','defeat sting','result'],['select','unit click','interface'],
  ['move','destination click','interface'],['attack','attack order','interface']
];
const music=[
  'Command Horizon','Steel Frontier','Neural Eclipse','Ore Fields at Dawn',
  'The Long Siege','Operation Black Sky','Last Signal','Reactor Pulse',
  'Iron Tide','Silent Recon','Radiant Counterstrike','After the Uplink'
];
const rows=[
  ...records.map(r=>({id:r.id,type:r.kind==='announcer'?'announcer':'voice',
    faction:r.faction||'',unit:r.unit||'',kind:r.kind||'',cue:r.cue||'',text:r.text,
    voice:r.voice,status:r.status})),
  ...extra.flatMap(([id,name,type])=>[1,2,3].map(n=>({
    id:'sfx.'+id+'.'+String(n).padStart(2,'0'),type:'sound effect',
    faction:'',unit:'',kind:type,cue:id,text:name+' variation '+n,voice:'procedural',status:'planned'
  }))),
  ...music.flatMap((name,i)=>[1,2].map(v=>({
    id:'music.track.'+String(i+1).padStart(2,'0')+'.'+v,type:'music',faction:'',
    unit:'',kind:'soundtrack',cue:'music.'+(i%3===0?'menu':i%3===1?'battle':'victory'),
    text:name+' variation '+v,voice:'original composition',status:'planned'
  })))
];
const keys=['id','type','faction','unit','kind','cue','text','voice','status'];
const csv=[keys.join(','),...rows.map(r=>keys.map(k=>'"'+String(r[k]??'').replaceAll('"','""')+'"').join(','))].join('\n')+'\n';
writeFileSync(resolve(folder,'full-audio-asset-register.csv'),csv,'utf8');
writeFileSync(resolve(folder,'full-audio-asset-register.json'),JSON.stringify({
  version:'2.22.0',source:'Original Chrono Dominion scripts',count:rows.length,entries:rows
},null,2)+'\n','utf8');
console.log('Exported '+rows.length+' planned and scripted assets; '+records.length+
  ' original spoken lines; '+Object.keys(announcements).length+' announcer event types.');
