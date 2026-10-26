"""Preview-only physically fractured Radar/Technology Lab damaged geometry.

All wreckage is editable original mesh geometry. It is deliberately hidden in
idle/construction, and intact signature equipment is hidden ONLY in damaged.
Do not use this module to publish any game texture or manifest.
"""
import math

SIGNATURES={
    ("coalition","radar"):(
        "Dish receiver emitter","Hydraulic telemetry tower",
        "Reflector yaw spindle","Dish azimuth turntable"),
    ("federation","radar"):(
        "Phased-array drive shaft","Heavy corner relay mast",
        "Tall communications whip","Relay signal bulb"),
    ("psionic","radar"):(
        "Tall opposing scanner horn","Inner luminous horn conductor",
        "Horn tip antenna","Floating neural sensor pupil"),
    ("coalition","tech"):(
        "Reinforced science roof","Research pod cap","Quantum probe"),
    ("federation","tech"):(
        # The MK-II silhouette failure: the intact 2.04m furnace tower
        # remained vertical even after the crown and clamp were broken.
        # Remove its whole upper shaft in the damaged pose, and retain the
        # separately editable fallen cylinder on the visible near side.
        "Industrial experimental furnace",
        "Furnace hazard rim","Furnace plasma aperture",
        "Test ram bearing"),
    ("psionic","tech"):(
        "Floating knowledge spire","Oracle data beacon",
        "Research knowledge nucleus","Central dimensional core"),
}

def add_wreckage(faction,kind,box,cyl,sphere,mesh,parts,root):
    """Add visible real damage, keeping the original mesh fully editable."""
    if kind not in ("radar","tech"):
        return
    if "radar" not in parts:
        raise ValueError("No physically animated radar/tech scanner: "+faction+"/"+kind)

    # The complete original rotating hardware is deliberately removed in the
    # damaged pose, not merely tilted or dimmed. Separate broken hardware
    # replaces it on the near-side apron and breached roof.
    parts["damage_hide_primary_scanner"]=parts["radar"]
    for selector in SIGNATURES[(faction,kind)]:
        matching=[o for o in root.children if o.name.startswith(selector)]
        if not matching:
            raise ValueError("Missing damage signature "+faction+"/"+kind+": "+selector)
        for o in matching:
            parts["damage_hide_signature_"+str(len(parts))]=o

    def damaged(key,obj):
        obj.hide_render=True
        parts["damage_only_rt_"+key]=obj
        return obj

    # Broken silhouette is visible outside the roof at an 80px RTS scale.
    # The roof hole is a black fractured inset; the wreckage itself extends
    # toward +X / -Y (the camera-facing apron).
    roof_z=2.65 if kind=="radar" else 2.55
    breach=damaged("roof_breach",box(
        "Damage-only radar tech breached equipment deck",
        (.34,-.42,roof_z),(1.17,.97,.21),"dark",.015))
    breach.rotation_euler.y=-.18
    beam=damaged("fallen_mast",box(
        "Damage-only radar tech fallen mast",
        (1.43,-1.34,1.47),(.29,.28,1.88),"light",.02))
    beam.rotation_euler.y=.86
    beam.rotation_euler.x=-.21
    damaged("sparking_cable",box(
        "Damage-only severed power cable",
        (1.63,-1.53,.95),(.58,.12,.11),"glow",.008))
    for i,(x,y,z) in enumerate(((1.23,-1.48,.78),
                                 (1.79,-1.18,.86),
                                 (.86,-1.62,.90))):
        slab=damaged("steel_fragment_"+str(i),box(
            "Damage-only bent antenna mounting plate",
            (x,y,z),(.43,.34,.16),"armor" if i==0 else "dark",.012))
        slab.rotation_euler.y=.23+i*.32

    if faction=="coalition" and kind=="radar":
        # A fallen open polygonal reflector, visibly asymmetric and separate
        # from the missing intact round scanner. Real non-coplanar mesh.
        verts=[(.75,-1.71,1.00),(1.32,-1.82,.86),(1.93,-1.72,1.12),
               (2.09,-1.17,1.52),(1.68,-.91,1.47),
               (1.20,-1.12,1.22),(1.43,-1.48,1.11)]
        faces=[(0,1,6),(1,2,6),(2,3,6),(3,4,6),(4,5,6),(5,0,6)]
        damaged("fallen_dish",mesh("Damage-only broken SkyScan dish half",
                                   verts,faces,"light"))
        damaged("dish_broken_receiver",box(
            "Damage-only detached radar receiver",
            (1.83,-1.76,1.32),(.36,.21,.34),"dark",.012))
    elif faction=="federation" and kind=="radar":
        fallen=damaged("phased_array",box(
            "Damage-only broken IronWatch array spar",
            (1.16,-1.63,1.60),(2.10,.28,.31),"light",.018))
        fallen.rotation_euler.y=.49
        for side in (-1,1):
            plate=damaged("array_panel_"+str(side),box(
                "Damage-only torn phased array panel",
                (1.08+side*.73,-1.67,1.50+side*.39),
                (.49,.22,.67),"dark",.012))
            plate.rotation_euler.y=side*.43
    elif faction=="psionic" and kind=="radar":
        _broken_arc(mesh,damaged,"scanner",(.85,-1.46,1.38),
                    .82,.16,0.17*math.pi,1.26*math.pi,"glass")
        for i,(x,y,z) in enumerate(((1.63,-1.42,.81),
                                     (.32,-1.68,.87),
                                     (-.83,-1.39,.80))):
            _crystal(mesh,damaged,"scanner_crystal_"+str(i),
                     (x,y,z),(x+.31,-.96,1.90-i*.18),
                     .24,"light")
    elif faction=="coalition" and kind=="tech":
        torn=damaged("science_roof",box(
            "Damage-only collapsed cleanroom gantry",
            (1.12,-1.19,1.68),(1.47,.32,.30),"light",.017))
        torn.rotation_euler.y=.49
        for i in range(3):
            shard=damaged("glass_"+str(i),box(
                "Damage-only shattered laboratory glazing",
                (1.30+i*.28,-1.51,1.06+i*.22),
                (.20,.13,.57),"glass",.009))
            shard.rotation_euler.y=.34+i*.23
    elif faction=="federation" and kind=="tech":
        furnace=damaged("furnace_pipe",cyl(
            "Damage-only snapped siege furnace chimney",
            (-.47,-1.32,2.21),.37,1.29,"dark",vertices=12))
        furnace.rotation_euler.y=.91
        clamp=damaged("test_cradle",box(
            "Damage-only shattered ballistic test cradle",
            (1.48,-1.49,1.37),(1.27,.34,.28),"bronze",.013))
        clamp.rotation_euler.y=.62
        for side in (-1,1):
            damaged("hydraulic_jaw_"+str(side),box(
                "Damage-only torn test jaw",
                (1.78,-1.49+side*.24,1.03),(.32,.18,.66),"light",.012))
    elif faction=="psionic" and kind=="tech":
        _broken_arc(mesh,damaged,"oracle",(.88,-1.45,1.36),
                    .90,.19,-.08*math.pi,1.23*math.pi,"light")
        for i,(x,y,z) in enumerate(((1.66,-1.37,.84),
                                     (.45,-1.64,.82),
                                     (-.85,-1.36,.81))):
            _crystal(mesh,damaged,"oracle_crystal_"+str(i),
                     (x,y,z),(x+.44,-1.00,1.98-i*.16),
                     .29,"armor" if i else "glass")

def _broken_arc(mesh,damaged,key,center,radius,width,start,end,material):
    # Actual jagged open arc, NOT a complete torus with a dimmed material.
    # Positioned in the XZ plane for readable camera-facing fracture.
    cx,cy,cz=center
    vertices=[]
    steps=8
    for i in range(steps+1):
        angle=start+(end-start)*i/steps
        radius_mod=radius*(.94 if i%3==0 else 1.0)
        for r in (radius_mod-width*.5,radius_mod+width*.5):
            vertices.append((cx+math.cos(angle)*r,cy,
                             cz+math.sin(angle)*r))
    faces=[(2*i,2*i+1,2*i+3,2*i+2) for i in range(steps)]
    damaged("broken_arc_"+key,mesh(
        "Damage-only physically fractured "+key+" gyre",vertices,faces,material))

def _crystal(mesh,damaged,key,base,tip,width,material):
    x,y,z=base
    tx,ty,tz=tip
    vertices=[(x-width,y-width*.7,z),(x+width,y-width*.4,z+.08),
              (x+width*.6,y+width*.7,z),
              (x-width*.5,y+width*.7,z-.04),(tx,ty,tz)]
    faces=[(0,3,2,1),(0,1,4),(1,2,4),(2,3,4),(3,0,4)]
    damaged("fallen_"+key,mesh("Damage-only shattered "+key,
                               vertices,faces,material))
