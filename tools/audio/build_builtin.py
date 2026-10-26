#!/usr/bin/env python3
"""Bake 473 original Chrono Dominion radio voices, effects and music to MP3.
Requires Python 3, Node.js, espeak and ffmpeg; no downloaded/commercial audio.
Source dialogue: audio/voices.js. Regenerate with: python3 tools/audio/build_builtin.py
"""
from pathlib import Path
import json, math, random, shutil, struct, subprocess, tempfile, wave, argparse

ROOT=Path(__file__).resolve().parents[2]
RATE=22050
KINDS=('soldier','specialist','tank','heavy','harvester','recon')
FACTIONS=('coalition','federation','psionic')
CUES=('ready','select','move','attack','underFire')
# Frequency Hz / seconds / envelope. Exactly two variations per family.
SFX={
'shot.soldier':(195,.13,'crack'),'shot.tank':(102,.43,'boom'),'shot.heavy':(75,.72,'boom'),
'shot.recon':(310,.11,'laser'),'shot.specialist':(450,.27,'laser'),'impact':(95,.20,'noise'),
'impact.soldier':(170,.19,'noise'),'impact.tank':(85,.29,'metal'),'impact.heavy':(58,.38,'metal'),
'explosion':(60,.85,'boom'),'build':(430,.42,'laser'),'queue':(475,.18,'laser'),
'ready':(740,.33,'laser'),'ability':(360,.72,'laser'),'alert':(540,.45,'laser'),
'select':(690,.11,'laser'),'move':(390,.14,'laser'),'attack':(220,.20,'metal'),
'ui':(740,.08,'laser'),'win':(560,1.10,'chord'),'defeat':(250,1.15,'chord'),
'shot.aircraft':(205,.26,'noise'),'shot.turret':(230,.28,'metal'),'shot.beam':(660,.50,'laser'),
'impact.structure':(92,.42,'metal'),'explosion.structure':(47,1.1,'boom'),
'explosion.vehicle':(68,.76,'boom'),'radar.ping':(990,.30,'laser'),'power.down':(165,.62,'laser'),
'power.up':(480,.48,'laser'),'cash.deposit':(680,.30,'laser'),'harvest.loop':(75,.46,'metal'),
'repair.loop':(520,.28,'metal'),'missile.launch':(200,.68,'noise'),'shield.hit':(550,.37,'laser'),
'chrono.jump':(790,.82,'laser'),'psi.pulse':(370,.83,'laser'),'airship.engine':(48,1.60,'metal'),
'aircraft.flyby':(330,.84,'noise'),'tank.tread':(110,.38,'metal'),'infantry.steps':(250,.15,'noise')
}
def run(*args):
    subprocess.run(args,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
def script_records():
    js="""const fs=require('fs'),vm=require('vm'),window={};
vm.runInNewContext(fs.readFileSync('audio/voices.js','utf8'),{window});
process.stdout.write(JSON.stringify(window.ChronoVoices.records));"""
    return json.loads(subprocess.check_output(['node','-e',js],cwd=ROOT))
def scripted_events():
    groups={}
    for entry in script_records():
        if entry.get('kind')=='announcer':
            key='announce.'+entry['cue']
        else:
            key='voice.'+entry.get('cue','')+'.'+entry.get('faction','')+'.'+entry.get('kind','')
        groups.setdefault(key,[]).append(entry['text'])
    chosen={}
    for faction in FACTIONS:
        for kind in KINDS:
            for cue in CUES:
                key=f'voice.{cue}.{faction}.{kind}'
                chosen[key]=groups[key][:3]
        for cue in ('ready','select','move','attack'):
            key=f'voice.{cue}.{faction}.airship'
            chosen[key]=groups[key][:2 if cue in ('ready','move') else 1]
    for key,lines in groups.items():
        if key.startswith('announce.'):chosen[key]=lines[:2]
    return chosen
def encode_wav(wav,dest,filters=None):
    args=['ffmpeg','-nostdin','-loglevel','error','-y','-i',str(wav)]
    if filters:args+=['-af',','.join(filters)]
    run(*args,'-ar',str(RATE),'-ac','1','-c:a','libmp3lame','-q:a','6',str(dest))
def speech(text,dest,faction,kind):
    voice={'coalition':'en-us','federation':'en-uk-north','psionic':'en-uk-rp','announcer':'en-us'}[faction]
    speed={'coalition':177,'federation':151,'psionic':145,'announcer':159}[faction]
    pitch={'coalition':48,'federation':26,'psionic':55,'announcer':37}[faction]
    if kind in ('heavy','airship'):speed-=14;pitch-=11
    with tempfile.TemporaryDirectory() as td:
        wav=Path(td)/'speech.wav'
        run('espeak','-v',voice,'-s',str(speed),'-p',str(max(12,pitch)),
            '-a','130','-w',str(wav),text)
        filters=['highpass=f=180','lowpass=f=3700']
        if faction=='federation':filters+=['equalizer=f=600:t=q:w=1:g=2','aecho=0.85:0.45:54:0.13']
        if faction=='psionic':filters+=['aecho=0.8:0.4:125:0.20','equalizer=f=2100:t=q:w=1:g=2']
        if faction=='announcer':filters+=['equalizer=f=850:t=q:w=1:g=2']
        encode_wav(wav,dest,filters)
def pcm_mp3(samples,dest):
    with tempfile.TemporaryDirectory() as td:
        wav=Path(td)/'samples.wav'
        with wave.open(str(wav),'wb') as out:
            out.setnchannels(1);out.setsampwidth(2);out.setframerate(RATE)
            out.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,v))*32767)) for v in samples))
        encode_wav(wav,dest)
def synth_effect(freq,duration,kind,seed):
    rnd=random.Random(seed);n=int((duration+.08)*RATE);phase=0;result=[]
    for i in range(n):
        t=i/RATE;phase+=2*math.pi*freq*math.exp(-2*t/max(.05,duration))/RATE
        env=min(1,t/.009)*max(0,min(1,(duration-t)/max(.08,duration*.5)))**1.5
        noise=rnd.uniform(-1,1)
        if kind=='crack':x=.55*noise+.3*math.sin(phase*2)+.1*math.copysign(1,math.sin(phase))
        elif kind=='boom':x=.5*math.sin(phase)+.33*noise*math.exp(-t*10)+.2*math.sin(phase*.5)
        elif kind=='laser':x=math.sin(phase)+.19*math.sin(phase*2.6)+.1*noise
        elif kind=='metal':x=.48*math.sin(phase*1.8)+.28*math.sin(phase*3.12)+.38*noise*math.exp(-t*10)
        elif kind=='chord':x=math.sin(phase)+.3*math.sin(phase*1.5)+.22*math.sin(phase*2)
        else:x=.4*noise+.4*math.sin(phase)
        result.append(math.tanh(x*1.6)*env*.68)
    return result
def synth_music(scene,seed):
    rnd=random.Random(seed);n=RATE*8;result=[0.0]*n
    notes={'menu':[43,50,55,48,43,60,50,48],
           'battle':[38,38,45,41,38,50,45,33],
           'victory':[48,55,60,55,52,60,64,67]}[scene]
    for beat in range(16):
        start=int(beat*RATE*.5);key=notes[(beat//2)%len(notes)]
        hz=440*2**((key-69)/12)
        for j in range(min(int(.49*RATE),n-start)):
            t=j/RATE;env=min(1,t/.025)*math.exp(-t*3)
            result[start+j]+=(.28*math.sin(2*math.pi*hz*t)+.08*math.sin(4*math.pi*hz*t))*env
        if beat%4==0:
            for j in range(min(int(.28*RATE),n-start)):
                t=j/RATE
                result[start+j]+=.19*math.sin(2*math.pi*(52*t+28*math.exp(-t*30))*t)*math.exp(-t*16)
        if beat%2:
            for j in range(min(int(.14*RATE),n-start)):
                t=j/RATE
                result[start+j]+=.032*rnd.uniform(-1,1)*math.exp(-t*31)
    fade=int(.05*RATE)
    for j in range(fade):
        result[j]*=j/fade;result[-1-j]*=j/fade
    return result
def build(out,check=False):
    voices=scripted_events()
    mapping={'schema':'chrono-dominion-builtin-audio-v1',
             'description':'Original Chrono Dominion procedural voice and sound library; no third-party recordings.',
             'events':{},'music':{}}
    count=0
    if not check:
        if not shutil.which('espeak') or not shutil.which('ffmpeg'):
            raise RuntimeError('Install espeak and ffmpeg to generate audio.')
        out.mkdir(parents=True,exist_ok=True)
    for event,lines in voices.items():
        bits=event.split('.')
        if bits[0]=='announce':prefix=Path('announcer')/bits[1];faction=kind='announcer'
        else:
            _,cue,faction,kind=bits
            prefix=Path('voices')/faction/kind/cue
        mapping['events'][event]=[]
        for idx,text in enumerate(lines,1):
            rel=prefix/f'{idx:02}.mp3'
            mapping['events'][event].append(rel.as_posix())
            if not check:
                file=out/rel;file.parent.mkdir(parents=True,exist_ok=True)
                if not file.is_file() or file.stat().st_size<200:speech(text,file,faction,kind)
            count+=1
    for index,(event,(freq,dur,typ)) in enumerate(SFX.items()):
        mapping['events'][event]=[]
        for variation in (1,2):
            rel=Path('sfx')/event/f'{variation:02}.mp3'
            mapping['events'][event].append(rel.as_posix())
            if not check:
                file=out/rel;file.parent.mkdir(parents=True,exist_ok=True)
                if not file.is_file() or file.stat().st_size<200:
                    pcm_mp3(synth_effect(freq*(.9+.07*variation),dur*(.95+.06*variation),
                                         typ,index*3+variation),file)
            count+=1
    for index,scene in enumerate(('menu','battle','victory')):
        rel=Path('music')/f'music-{scene}.mp3'
        mapping['music']['music.'+scene]=[rel.as_posix()]
        if not check:
            file=out/rel;file.parent.mkdir(parents=True,exist_ok=True)
            if not file.is_file() or file.stat().st_size<200:
                pcm_mp3(synth_music(scene,index+22),file)
        count+=1
    assert count==473,f'Expected 473 audio clips; got {count}'
    if not check:
        (out/'audio-map.json').write_text(json.dumps(mapping,indent=2)+'\n')
    print(json.dumps({'assets':count,'event_groups':len(mapping['events']),
                      'music_groups':len(mapping['music']),'check_only':check}))
if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--out',type=Path,default=ROOT/'audio'/'builtin')
    p.add_argument('--check',action='store_true')
    opt=p.parse_args()
    build(opt.out,opt.check)
