#!/usr/bin/env python3
"""Build the original 473-file Chrono Dominion MP3 bank into a deployable site.
Requires Python 3, Node >=20, espeak and ffmpeg (provided by GitHub Actions).
All input dialogue is original: audio/voices.js; no external game recordings.
"""
import argparse
import json
import math
from pathlib import Path
import random
import shutil
import struct
import subprocess
import tempfile
import wave

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT = ROOT / "audio" / "builtin"
RATE = 22050
VOICE_EVENTS = ("ready", "select", "move", "attack", "underFire")
FACTIONS = ("coalition", "federation", "psionic")
KINDS = ("soldier", "specialist", "tank", "heavy", "harvester", "recon")
SFX = {
    "shot.soldier": (195, .13, "crack"), "shot.tank": (102, .43, "boom"),
    "shot.heavy": (75, .72, "boom"), "shot.recon": (310, .11, "laser"),
    "shot.specialist": (450, .27, "laser"), "impact": (95, .20, "noise"),
    "impact.soldier": (170, .19, "noise"), "impact.tank": (85, .29, "metal"),
    "impact.heavy": (58, .38, "metal"), "explosion": (60, .85, "boom"),
    "build": (430, .42, "laser"), "queue": (475, .18, "laser"),
    "ready": (740, .33, "laser"), "ability": (360, .72, "laser"),
    "alert": (540, .45, "laser"), "select": (690, .11, "laser"),
    "move": (390, .14, "laser"), "attack": (220, .20, "metal"),
    "ui": (740, .08, "laser"), "win": (560, 1.10, "chord"),
    "defeat": (250, 1.15, "chord"), "shot.aircraft": (205, .26, "noise"),
    "shot.turret": (230, .28, "metal"), "shot.beam": (660, .50, "laser"),
    "impact.structure": (92, .42, "metal"), "explosion.structure": (47, 1.1, "boom"),
    "explosion.vehicle": (68, .76, "boom"), "radar.ping": (990, .30, "laser"),
    "power.down": (165, .62, "laser"), "power.up": (480, .48, "laser"),
    "cash.deposit": (680, .30, "laser"), "harvest.loop": (75, .46, "metal"),
    "repair.loop": (520, .28, "metal"), "missile.launch": (200, .68, "noise"),
    "shield.hit": (550, .37, "laser"), "chrono.jump": (790, .82, "laser"),
    "psi.pulse": (370, .83, "laser"), "airship.engine": (48, 1.60, "metal"),
    "aircraft.flyby": (330, .84, "noise"), "tank.tread": (110, .38, "metal"),
    "infantry.steps": (250, .15, "noise"),
}

def run(*args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL,
                   stderr=subprocess.PIPE)

def dialogue():
    js = """const fs=require('fs'),vm=require('vm'),w={};
vm.runInNewContext(fs.readFileSync('audio/voices.js','utf8'),{window:w});
process.stdout.write(JSON.stringify(w.ChronoVoices.records));"""
    records = json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT))
    groups = {}
    for entry in records:
        if entry.get("kind") == "announcer":
            key = "announce." + entry["cue"]
        else:
            key = "voice." + entry.get("cue", "") + "." + entry.get("faction", "") + "." + entry.get("kind", "")
        groups.setdefault(key, []).append(entry["text"])
    selected = {}
    for faction in FACTIONS:
        for kind in KINDS:
            for cue in VOICE_EVENTS:
                key = f"voice.{cue}.{faction}.{kind}"
                selected[key] = groups[key][:3]
        for cue in ("ready", "select", "move", "attack"):
            key = f"voice.{cue}.{faction}.airship"
            selected[key] = groups[key][:2 if cue in ("ready", "move") else 1]
    for key, lines in groups.items():
        if key.startswith("announce."):
            selected[key] = lines[:2]
    return selected

def speech(text, dest, faction, kind):
    if dest.exists() and dest.stat().st_size > 250:
        return
    voice = {"coalition":"en-us","federation":"en-uk-north",
             "psionic":"en-uk-rp","announcer":"en-us"}[faction]
    speed = {"coalition":177,"federation":151,"psionic":145,"announcer":159}[faction]
    pitch = {"coalition":48,"federation":26,"psionic":55,"announcer":37}[faction]
    if kind in ("heavy", "airship"):
        speed -= 14
        pitch -= 11
    with tempfile.TemporaryDirectory() as td:
        wave_path = Path(td) / "speech.wav"
        run("espeak", "-v", voice, "-s", str(speed), "-p", str(max(12,pitch)),
            "-a", "130", "-w", str(wave_path), text)
        filters = ["highpass=f=180", "lowpass=f=3700"]
        if faction == "federation":
            filters += ["equalizer=f=600:t=q:w=1:g=2", "aecho=0.85:0.45:54:0.13"]
        if faction == "psionic":
            filters += ["aecho=0.8:0.4:125:0.20", "equalizer=f=2100:t=q:w=1:g=2"]
        if faction == "announcer":
            filters += ["equalizer=f=850:t=q:w=1:g=2"]
        run("ffmpeg","-nostdin","-y","-loglevel","error","-i",str(wave_path),
            "-af",",".join(filters),"-ar",str(RATE),"-ac","1",
            "-c:a","libmp3lame","-q:a","6",str(dest))

def encode(samples, dest):
    with tempfile.TemporaryDirectory() as td:
        wav_path = Path(td) / "tone.wav"
        with wave.open(str(wav_path),"wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(RATE)
            wav.writeframes(b"".join(struct.pack("<h",int(max(-1,min(1,v))*32767)) for v in samples))
        run("ffmpeg","-nostdin","-y","-loglevel","error","-i",str(wav_path),
            "-ar",str(RATE),"-ac","1","-c:a","libmp3lame","-q:a","6",str(dest))

def effect(freq, duration, form, seed):
    rng=random.Random(seed)
    samples=[]
    phase=0
    for i in range(int((duration+.08)*RATE)):
        t=i/RATE
        phase+=2*math.pi*freq*math.exp(-2*t/max(.05,duration))/RATE
        env=min(1,t/.009)*max(0,min(1,(duration-t)/max(.08,duration*.5)))**1.5
        noise=rng.uniform(-1,1)
        if form=="crack":
            value=.55*noise+.3*math.sin(phase*2)+.1*math.copysign(1,math.sin(phase))
        elif form=="boom":
            value=.5*math.sin(phase)+.33*noise*math.exp(-10*t)+.2*math.sin(phase/2)
        elif form=="laser":
            value=math.sin(phase)+.19*math.sin(phase*2.6)+.1*noise
        elif form=="metal":
            value=.48*math.sin(phase*1.8)+.28*math.sin(phase*3.12)+.38*noise*math.exp(-10*t)
        elif form=="chord":
            value=math.sin(phase)+.3*math.sin(phase*1.5)+.22*math.sin(phase*2)
        else:
            value=noise*.4+math.sin(phase)*.4
        samples.append(math.tanh(value*1.6)*env*.68)
    return samples

def soundtrack(scene, seed):
    rng=random.Random(seed)
    total=8
    samples=[0.0]*(RATE*total)
    notes={"menu":[43,50,55,48,43,60,50,48],
           "battle":[38,38,45,41,38,50,45,33],
           "victory":[48,55,60,55,52,60,64,67]}[scene]
    for beat in range(16):
        begin=int(beat*RATE*.5)
        count=min(int(RATE*.49),len(samples)-begin)
        root=440*2**((notes[(beat//2)%len(notes)]-69)/12)
        for j in range(count):
            t=j/RATE
            envelope=min(1,t/.025)*math.exp(-3*t)
            samples[begin+j]+=(.28*math.sin(2*math.pi*root*t)+
                                .08*math.sin(4*math.pi*root*t))*envelope
        if beat%4==0:
            for j in range(min(int(RATE*.28),len(samples)-begin)):
                t=j/RATE
                samples[begin+j]+=.19*math.sin(2*math.pi*(52*t+28*math.exp(-30*t))*t)*math.exp(-16*t)
        if beat%2:
            for j in range(min(int(RATE*.14),len(samples)-begin)):
                t=j/RATE
                samples[begin+j]+=.032*rng.uniform(-1,1)*math.exp(-31*t)
    fade=int(.05*RATE)
    for i in range(fade):
        samples[i]*=i/fade
        samples[-i-1]*=i/fade
    return samples

def build(out,check=False):
    if not check:
        out.mkdir(parents=True,exist_ok=True)
        if not shutil.which("espeak") or not shutil.which("ffmpeg"):
            raise RuntimeError("Install espeak and ffmpeg first")
    manifest={"schema":"chrono-dominion-builtin-audio-v1","events":{},"music":{}}
    count=0
    for cue,lines in dialogue().items():
        bits=cue.split(".")
        if bits[0]=="announce":
            relbase=Path("announcer")/bits[1]
            faction=kind="announcer"
        else:
            _,action,faction,kind=bits
            relbase=Path("voices")/faction/kind/action
        paths=[]
        for n,line in enumerate(lines,1):
            rel=relbase/f"{n:02}.mp3"
            paths.append(rel.as_posix())
            if not check:
                dest=out/rel
                dest.parent.mkdir(parents=True,exist_ok=True)
                speech(line,dest,faction,kind)
            count+=1
        manifest["events"][cue]=paths
    for index,(cue,(freq,length,form)) in enumerate(SFX.items()):
        paths=[]
        for variation in (1,2):
            rel=Path("sfx")/cue/f"{variation:02}.mp3"
            paths.append(rel.as_posix())
            if not check:
                dest=out/rel
                dest.parent.mkdir(parents=True,exist_ok=True)
                encode(effect(freq*(.90+.07*variation),length*(.95+.06*variation),
                              form,index*3+variation),dest)
            count+=1
        manifest["events"][cue]=paths
    for index,scene in enumerate(("menu","battle","victory")):
        rel=Path("music")/f"music-{scene}.mp3"
        manifest["music"]["music."+scene]=[rel.as_posix()]
        if not check:
            dest=out/rel
            dest.parent.mkdir(parents=True,exist_ok=True)
            encode(soundtrack(scene,22+index),dest)
        count+=1
    if count!=473:
        raise RuntimeError(f"Expected 473 original tracks, got {count}")
    if not check:
        (out/"audio-map.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"assets":count,"events":len(manifest["events"]),
                      "music":len(manifest["music"]),"output":str(out),"check":check}))
    return manifest

if __name__=="__main__":
    cli=argparse.ArgumentParser()
    cli.add_argument("--out",type=Path,default=DEFAULT_OUT)
    cli.add_argument("--check",action="store_true")
    arguments=cli.parse_args()
    build(arguments.out,arguments.check)
