#!/usr/bin/env python3
"""Strict 160px/80px comparison of one changed Federation wreck, no other renders."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

EXPECTED_SOURCE_SHA="78758cb231e0f4c41f68a986f2d142ea65f0bc26d08a1eb0f44c1ad169da096e"
EXPECTED_DESTROYED_SHA="4952e83ea7c4ca60616d92338ae7f66237b3a32dbb55f75053c571f1498f1608"
EXPECTED_ATLAS_SHA="b0dde06c0e7793b577b10d7561765b184d2a6c07a48e6c140ff53fc3b9a0f60f"
THRESHOLDS={"changed_rgba_80_min":150,"changed_alpha_80_min":35,
            "changed_rgba_160_min":500,"destroyed_vs_idle_alpha_80_min":350,
            "critical_vs_destroyed_rgba_80_min":150}

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def load(p):
    with Image.open(p) as im:
        im.load()
        assert im.mode=="RGBA" and im.size==(160,160),(p,im.mode,im.size)
        return im.copy()

def rgba(a,b):
    return sum(x!=y for x,y in zip(a.getdata(),b.getdata()))

def alpha(a,b):
    return sum((x>=32)!=(y>=32) for x,y in zip(a.getchannel("A").tobytes(),b.getchannel("A").tobytes()))

def frame(bg,im,x,y,size):
    panel=Image.new("RGBA",(size,size),(39,47,61,255))
    panel.alpha_composite(im.resize((size,size),Image.Resampling.LANCZOS))
    bg.paste(panel.convert("RGB"),(x,y))

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--stage",type=Path,required=True)
    args=p.parse_args()
    stage=args.stage
    extra=stage/"extra"/"federation"
    baseline=extra/"destroyed-original.png"
    source=extra/"federation-airfield-extended-states.blend"
    atlas=stage/"packed"/"federation-airfield.png"
    assert sha(source)==EXPECTED_SOURCE_SHA,("unexpected saved source",sha(source))
    assert sha(baseline)==EXPECTED_DESTROYED_SHA,("unexpected original wreck",sha(baseline))
    assert sha(atlas)==EXPECTED_ATLAS_SHA,("unexpected atlas",sha(atlas))
    old=load(baseline)
    new=load(extra/"destroyed.png")
    critical=load(extra/"critical.png")
    with Image.open(atlas) as im:
        im.load()
        assert im.mode=="RGBA" and im.size==(160,800)
        idle=im.crop((0,0,160,160)).copy()
    bounds=new.getchannel("A").getbbox()
    assert bounds and min(bounds[0],bounds[1],160-bounds[2],160-bounds[3])>=2,bounds
    metrics={}
    for size in (160,80):
        o=old.resize((size,size),Image.Resampling.LANCZOS)
        n=new.resize((size,size),Image.Resampling.LANCZOS)
        i=idle.resize((size,size),Image.Resampling.LANCZOS)
        c=critical.resize((size,size),Image.Resampling.LANCZOS)
        metrics[str(size)]={"old_to_mk2_rgba":rgba(o,n),
                            "old_to_mk2_alpha":alpha(o,n),
                            "idle_to_mk2_destroyed_alpha":alpha(i,n),
                            "critical_to_mk2_destroyed_rgba":rgba(c,n)}
        board=Image.new("RGB",(3*(size+15)+24,size+83),(18,25,38))
        d=ImageDraw.Draw(board)
        d.text((12,8),f"FEDERATION AIRFIELD MK-II / {size}px / PREVIEW ONLY",fill=(245,187,121))
        for j,(label,im) in enumerate((("INTACT",idle),("OLD WRECK",old),("BREACHED MK-II",new))):
            x=12+j*(size+15)
            frame(board,im,x,32,size)
            d.text((x,size+40),label,fill=(233,237,241))
        board.save(extra/(f"federation-breach-before-after-{size}.png"),optimize=True)
    assert metrics["80"]["old_to_mk2_rgba"]>=THRESHOLDS["changed_rgba_80_min"],metrics
    assert metrics["80"]["old_to_mk2_alpha"]>=THRESHOLDS["changed_alpha_80_min"],metrics
    assert metrics["160"]["old_to_mk2_rgba"]>=THRESHOLDS["changed_rgba_160_min"],metrics
    assert metrics["80"]["idle_to_mk2_destroyed_alpha"]>=THRESHOLDS["destroyed_vs_idle_alpha_80_min"],metrics
    assert metrics["80"]["critical_to_mk2_destroyed_rgba"]>=THRESHOLDS["critical_vs_destroyed_rgba_80_min"],metrics
    proof=json.loads((extra/"raycast-proof.json").read_text())
    assert proof["new_meshes"]==10
    assert proof["front_aperture_first_hit"]["world_xyz"][0]<-1.20
    assert proof["near_side_aperture_first_hit"]["world_xyz"][1]>1.02
    report={"asset":"experimental Federation airfield wreck MK-II", "preview_only":True,
            "thresholds":THRESHOLDS,"metrics":metrics,"bbox_160":bounds,
            "source_baseline_sha256":sha(source),"old_destroyed_sha256":sha(baseline),
            "new_destroyed_sha256":sha(extra/"destroyed.png"),
            "original_atlas_sha256":sha(atlas),"raycast":proof}
    (extra/"mk2-pixel-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps(report,indent=2),flush=True)
    print("PASS: targeted Federation wreck only; 160px/80px, open-raycast and source hashes")

if __name__=="__main__":
    main()
