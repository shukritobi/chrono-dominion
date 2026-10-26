"""Original, faction-specific RTS building architecture authored as Blender meshes.

The common interface deliberately receives mesh operators from animated_assets.py.
This keeps material definitions, source .blend exports and transparent sprite
rendering consistent. No commercial game source geometry is used.
"""
import math
import bpy

BUILDING_KINDS = ("hq","generator","refinery","barracks","factory","radar",
                  "tech","turret","beam","airfield")
BUILDING_SHAPES = {
  "coalition":("stepped command","paired fusion","enclosed sorter","modular barracks",
               "robotic hangar","telemetry dish","glass tower","twin cannon",
               "quadruple emitter","runway hangar"),
  "federation":("armored bunker","furnaces","open crushers","defense bastion",
                "heavy foundry","bar array","siege laboratory","artillery cannon",
                "arc furnace","aviation bunker"),
  "psionic":("neural citadel","containment orb","crystal extractor","mind sanctuary",
             "fabricator","scanner ring","psi spire","energy turret",
             "neural obelisk","levitating launchpad")
}

def build(faction,kind,box,cyl,sphere,mesh,parts,mats,root):
    if faction not in BUILDING_SHAPES or kind not in BUILDING_KINDS:
        raise ValueError("Invalid faction/building: %s/%s"%(faction,kind))

    def prism(name,x,y,z,width,height,material="armor",sides=6):
        verts=[(x+width*math.cos(i*math.tau/sides),
                y+width*math.sin(i*math.tau/sides),z) for i in range(sides)]
        verts += [(vx,vy,z+height) for vx,vy,_ in verts]
        faces=[tuple(range(sides-1,-1,-1)),tuple(range(sides,sides*2))]
        faces += [(i,(i+1)%sides,(i+1)%sides+sides,i+sides) for i in range(sides)]
        return mesh(name,verts,faces,material)

    def spire(name,x,y,z,w,height,material="armor",sides=4):
        bottom=[(x+w*math.cos(i*math.tau/sides),y+w*math.sin(i*math.tau/sides),z)
                for i in range(sides)]
        vertices=bottom+[(x,y,z+height)]
        faces=[tuple(range(sides-1,-1,-1))]
        faces += [(i,(i+1)%sides,sides) for i in range(sides)]
        return mesh(name,vertices,faces,material)

    def torus(name,location,radius,tube,material="glow",vertical=False):
        bpy.ops.mesh.primitive_torus_add(
            major_segments=24,minor_segments=8,
            location=location,major_radius=radius,minor_radius=tube)
        o=bpy.context.object
        o.name=name
        if vertical:o.rotation_euler.x=math.pi/2
        o.data.materials.append(mats[material])
        o.parent=root
        return o

    def light_stripe(x,y,z,length=1.1,vertical=False):
        box("Visible navigation strip",(x,y,z),
            (.07,.07,length) if vertical else (length,.07,.08),"glow",.009)

    def tower(name,x,y,z,h,material="armor",width=.3):
        return box(name,(x,y,z+h/2),(width,width,h),material,.04)

    def barrel(name,x,y,z,depth=1.4,radius=.16,material="light"):
        return cyl(name,(x,y,z),radius,depth,material,axis="X")

    # Ground-hugging base skirt: faction's large identifiable footprint.
    if faction=="coalition":
        box("Aegis engineered foundation",(0,0,.23),(3.44,3.42,.46),"dark",.15)
        box("Clean chamfered technical deck",(0,0,.50),(3.13,3.14,.19),"light",.10)
        for y in (-1.43,1.43):
            for x in (-1.15,1.15):
                box("Foundation beacon",(x,y,.64),(.24,.19,.15),"glow",.03)
        for side in (-1,1):
            light_stripe(-1.50,side*.78,.65,.85)
    elif faction=="federation":
        box("Industrial ferrocrete base",(0,0,.26),(3.62,3.55,.52),"dark",.06)
        box("Blunt reinforced plinth",(0,0,.60),(3.31,3.25,.24),"armor",.045)
        for side in (-1,1):
            box("Front blast buttress",(1.55,side*.99,.79),(.29,.66,.47),"dark",.025)
            box("Heat guide strip",(1.72,side*.99,.77),(.07,.42,.08),"glow",.005)
    else:
        prism("Hexagonal abyssal foundation",0,0,.13,1.84,.35,"dark",6)
        prism("Glowing six-sided energy well",0,0,.48,1.62,.18,"glow",6)
        prism("Floating violet stone dais",0,0,.67,1.55,.15,"armor",6)
        for i in range(6):
            a=i*math.tau/6
            spire("Neural foundation needle",math.cos(a)*1.56,math.sin(a)*1.56,.69,
                  .13,.40,"light",3)

    if faction=="coalition":
        # Aegis Accord architecture: paired, disciplined, and mechanically symmetrical.
        if kind=="hq":
            box("Central command block",(0,0,1.23),(2.65,2.20,1.12),"armor",.14)
            box("Layered command deck",(0,0,1.91),(2.35,2.05,.30),"light",.09)
            box("Observation glazed tower",(-.25,0,2.62),(1.32,1.28,1.25),"glass",.14)
            box("Upper antenna control roof",(-.25,0,3.33),(1.50,1.51,.23),"armor",.07)
            spire("Command beacon",-.25,0,3.43,.24,.89,"light",6)
            sphere("Citadel secure link",(-.25,0,4.33),(.20,.20,.20),"glow")
            for side in (-1,1):
                tower("Paired roof telemetry",.57,side*.62,2.12,1.25,"light",.10)
                box("Defence side wing",(-.88,side*.88,1.15),(.70,.58,.82),"dark")
            light_stripe(-.25,-.68,3.11,1.03)
        elif kind=="generator":
            # AEGIS MK-II DOUBLE-CONTAINMENT FUSION STATION
            # Three explicit masses ensure a clear silhouette at ~150px:
            #  (1) two tall mirrored glass reactors, (2) low control bridge,
            #  (3) horizontal luminous distribution rails at ground level.
            box("Central Fusion Supervisory Housing",(.05,0,1.34),(1.28,1.25,1.17),"armor",.15)
            box("Protected Reactor Access Fascia",(.70,-.08,1.18),(.14,1.08,.79),"dark",.025)
            box("Recessed Status Display",(.79,-.08,1.41),(.05,.75,.30),"glass",.018)
            box("Upper Instrumentation Bridge",(-.10,0,2.06),(1.54,2.34,.25),"light",.075)
            box("Telemetry Light Rail",(.00,-1.09,2.03),(1.18,.08,.08),"glow",.012)
            for side in (-1,1):
                y=side*1.03
                # Two distinct reactor towers on a shared containment foundation.
                cyl("Octagonal Reactor Footing",(-.29,y,.91),.51,.44,"dark",vertices=12)
                cyl("Reactor Base Clamp",(-.29,y,1.14),.47,.18,"light",vertices=16)
                cyl("Inner Cyan Fusion Plasma",(-.29,y,2.09),.23,1.72,"glow",vertices=24)
                cyl("Translucent Containment Shell",(-.29,y,2.11),.34,1.70,"glass",vertices=24)
                # Circumferential armored clamps and separated cyan bands.
                for level in (1.28,1.68,2.48,2.91):
                    cyl("Visible Outer Support Collar",(-.29,y,level),.45,.105,"light",vertices=24)
                for level in (1.48,2.08,2.67):
                    torus("Pulsing Magnetic Confinement Ring",(-.29,y,level),.39,.045,"glow")
                cyl("Turbine Vent Crown",(-.29,y,3.13),.45,.27,"dark",vertices=20)
                cyl("Top Turbine Finial",(-.29,y,3.31),.26,.19,"light",vertices=20)
                sphere("Status Beacon",(-.29,y,3.50),(.16,.16,.17),"glow")
                # Paired side maintenance outriggers keep towers mechanically grounded.
                box("Reinforced Lateral Side Foot",(.19,side*1.32,1.03),(.82,.23,.37),"armor",.045)
                for level in (1.40,2.48):
                    box("Pressure Service Link",(.26,side*.71,level),(.69,.20,.15),"dark",.02)
                    box("Cooling Light Conduit",(.28,side*.70,level+.11),(.59,.08,.075),"glow",.011)
                for index in range(3):
                    box("Reactor Instrument Ribs",(-.66,side*.99,1.57+index*.44),
                        (.10,.14,.25),"light",.025)
            # Main control cab and reactor distribution manifold.
            box("Armored Precision Control Roof",(.11,0,2.39),(1.17,1.04,.20),"armor",.055)
            box("Central Cyan Operational Indicator",(.68,0,2.30),(.065,.75,.085),"glow",.012)
            for side in (-1,1):
                box("Forward Heat Sink Grating",(1.01,side*.40,1.06),(.10,.23,.48),"dark",.015)
                for z in (1.00,1.13,1.27):
                    box("Heat Sink Display Strip",(1.08,side*.40,z),(.04,.16,.055),"light",.009)
            # Active toroidal gyro is deliberately offset and becomes animated
            # via the existing PARTS['radar'] animation controller.
            parts["radar"]=torus("Rotating Blue Reactor Gyroscope",(.14,0,2.75),.43,.077,"glow",True)
            sphere("Fusion Control Focal Point",(.14,0,2.77),(.14,.14,.15),"glass")
        elif kind=="refinery":
            box("Sealed ore sorting factory",(-.28,0,1.24),(2.08,2.32,1.37),"armor",.12)
            box("Inspection booth",(-.76,-.76,2.18),(.74,.66,.58),"glass",.06)
            for i in range(3):
                cyl("Sealed separator vessel",(-.73+i*.63,.66,2.33),.22,1.05,"light")
                sphere("Sensor beacon",(-.73+i*.63,.66,2.92),(.12,.13,.15),"glow")
            box("Material conveyer",(1.13,-.02,.95),(.71,.89,.40),"dark")
            box("Sorting gantry",(.30,-.23,2.60),(.12,1.77,.19),"glow",.025)
        elif kind=="barracks":
            box("Modular recruitment building",(0,0,1.18),(2.45,2.18,1.12),"armor",.13)
            for side in (-1,1):
                box("Symmetric dorm wing",(-.28,side*.93,1.14),(1.50,.53,1.02),"light",.05)
                tower("Field antenna",-1.02,side*.75,1.90,1.07,"light",.09)
            box("Command training balcony",(.58,-.15,1.93),(.85,1.25,.26),"dark")
            box("Blue entrance",(1.27,-.02,1.08),(.08,.82,.91),"glass",.02)
            light_stripe(1.37,-.02,1.79,.76)
        elif kind=="factory":
            box("Precision assembly hangar",(-.22,0,1.34),(2.30,2.57,1.51),"armor",.14)
            box("High-strength hangar roof",(-.28,0,2.24),(2.53,2.78,.23),"light")
            box("Open production bay",(.97,0,1.17),(.11,1.38,1.20),"dark",.025)
            for y in (-.55,.55):
                tower("Robot line support",.88,y,1.43,1.0,"light",.14)
            parts["radar"]=box("Bridge gantry crossbeam",(.15,0,2.73),(.26,2.45,.20),"glow",.035)
            box("Survey crane carriage",(.15,-.50,2.48),(.43,.38,.18),"dark",.03)
        elif kind=="radar":
            box("Blue telemetry mast",(0,0,1.77),(1.48,1.52,2.14),"armor",.15)
            box("Tower receiver collar",(0,0,2.95),(1.76,1.74,.18),"light",.06)
            cyl("Dish rotor pedestal",(0,0,3.50),.14,.99,"dark")
            parts["radar"]=sphere("Rotating parabolic sensor",(0,0,3.89),(.98,.30,.31),"light")
            sphere("Dish transceiver",(0,-.37,3.94),(.23,.11,.18),"glow")
            for side in (-1,1):tower("Support antenna",side*.77,.60,2.98,.55,"light",.07)
        elif kind=="tech":
            box("Aegis research laboratories",(0,0,1.17),(2.51,2.23,1.04),"armor",.12)
            box("Glazed research tower",(-.27,.05,2.35),(1.24,1.30,1.78),"glass",.14)
            box("Reinforced roof",(-.27,.05,3.29),(1.42,1.45,.21),"light",.06)
            cyl("Secure science transmitter",(-.27,.05,3.81),.15,.95,"light")
            sphere("Laboratory light",(-.27,.05,4.34),(.25,.25,.25),"glow")
            for x in (-1.05,.83):box("Module wing",(x,.38,1.43),(.44,1.45,.71),"light")
        elif kind=="turret":
            box("Compact tactical fort",(0,0,1.16),(1.78,1.73,1.09),"armor",.16)
            box("Optical turret housing",(0,0,2.02),(1.30,1.23,.68),"light",.18)
            for y in (-.30,.30):
                barrel("Paired railgun",.86,y,2.04,1.70,.10,"dark")
                cyl("Heat shielding", (1.65,y,2.04),.17,.26,"light","X")
            sphere("Weapon acquisition lens",(.44,-.42,2.43),(.21,.14,.14),"glow")
        elif kind=="beam":
            box("Accelerator housing",(0,0,1.35),(1.50,1.48,1.39),"armor",.14)
            for x in (-.50,.50):
                for y in (-.50,.50):
                    tower("Paired emitter guide",x,y,1.52,1.64,"light",.17)
                    sphere("Rail terminus",(x,y,3.24),(.16,.16,.18),"glow")
            parts["radar"]=torus("Emitter focus", (0,0,3.30),.60,.09,"glow")
            sphere("Charged target point",(0,0,3.62),(.24,.25,.28),"glass")
        elif kind=="airfield":
            box("Wide aerospace hangar",(-.49,0,1.18),(2.02,2.55,1.25),"armor",.15)
            box("Aerodynamic shelter roof",(-.52,0,1.94),(2.24,2.69,.24),"light",.08)
            box("Aircraft loading mouth",(.55,0,1.15),(.09,1.56,1.04),"dark",.025)
            box("Lit flight apron",(1.29,0,.72),(.78,2.87,.11),"dark",.025)
            for y in (-1.05,-.52,0,.52,1.05):
                box("Apron precision marker",(1.57,y,.80),(.21,.10,.04),"glow",.01)
            box("Flight control tower",(-1.13,.55,2.40),(.60,.63,.92),"glass",.075)

    elif faction=="federation":
        # Iron Federation: architectural mass, offset machinery, red-hot industrial cores.
        if kind=="hq":
            box("Red Bastion tier one",(0,0,1.23),(3.06,2.70,1.13),"armor",.07)
            box("Reinforced brutalist podium",(-.25,0,2.03),(2.55,2.31,.62),"dark",.035)
            box("Armored central keep",(-.35,.15,2.81),(1.64,1.59,1.19),"armor",.06)
            box("Muzzle-window slit",(.51,-.58,2.64),(.09,.43,.16),"glow",.02)
            for i in range(4):
                box("Bunker battlement",(-1.02+i*.65,-1.22,2.38),(.41,.22,.41),"light",.02)
            for side in (-1,1):
                cyl("Asymmetrical smoke mast",(-.95,side*.75,3.56),.23,.9+(side+1)*.43,"dark")
                cyl("Glowing stack outlet",(-.95,side*.75,4.00+(side+1)*.21),.23,.06,"glow")
        elif kind=="generator":
            # RED BASTION MK-II FURNACE PLANT. Horizontal mass and offset heavy
            # chimneys, no symmetric glass reactor tubes from the Coalition kit.
            box("Bastion furnace chassis",(0,0,1.20),(2.72,2.28,1.14),"armor",.075)
            box("Reinforced pig-iron machine deck",(-.28,-.02,1.84),(2.20,2.13,.21),"dark",.04)
            box("Armored combustion hood",(-.48,0,2.34),(1.48,1.65,.85),"armor",.045)
            box("Glowing open combustion throat",(.88,0,1.30),(.10,1.08,.49),"glow",.012)
            for side in (-1,1):
                # Deliberately asymmetric tall/short smoke shafts at the rear.
                height=2.55 if side==1 else 1.88
                y=side*.77
                cyl("Exhaust smoke shaft",(-.79,y,2.14),.33,height,"dark",vertices=16)
                cyl("Outer steel shaft collar",(-.79,y,2.02),.42,.16,"light")
                cyl("Heat-scorched outlet",(-.79,y,2.14+height*.5),.32,.11,"bronze")
                cyl("Visible inner stack fire",(-.79,y,2.14+height*.5+.065),.21,.08,"glow")
                box("Emergency coolant pod",(.59,side*.81,1.08),(.80,.43,.74),"dark",.06)
                for i in range(4):
                    box("Radiator grille",(.73,side*.83,.90+i*.17),(.35,.07,.07),"glow",.015)
                box("High pressure intake bracing",(-.36,side*1.14,1.46),(1.11,.20,.26),"light",.04)
            cyl("Internal axial turbine",(0,0,2.62),.47,.32,"bronze",vertices=20)
            cyl("Turbine iron grating",(0,0,2.85),.56,.12,"dark",vertices=20)
            parts["radar"]=cyl("Exposed industrial rotor",(0,0,2.93),.28,.085,"light",vertices=12)
            for i in range(8):
                a=i*math.tau/8
                box("Turbine radial blade",(math.cos(a)*.31,math.sin(a)*.31,2.95),(.25,.09,.045),"dark",.008)
            for x in (-.98,-.55,.12,.69):
                box("Lower heat channels",(1.34,x,1.22),(.07,.10,.59),"dark",.012)
                box("Inner incandescent grille",(1.39,x,1.22),(.035,.065,.41),"glow",.006)
            box("Overhung soot-rated service walkway",(1.48,0,.68),(.53,2.40,.12),"dark",.015)
        elif kind=="refinery":
            box("Open ore smelter",(0,0,1.16),(2.43,2.24,1.16),"dark",.10)
            box("Crushing hopper",(-.53,-.34,2.02),(1.43,1.35,.74),"armor",.09)
            for side in (-1,1):
                cyl("External smelter drum",(.72,side*.77,1.52),.42,1.43,"bronze",axis="X")
                cyl("Industrial silo",(-.93,side*.94,2.47),.34,1.49,"light")
            box("Furnace exit slot",(1.23,0,1.17),(.07,.94,.31),"glow",.015)
        elif kind=="barracks":
            box("Fortified garrison bunker",(0,0,1.10),(2.70,2.54,1.08),"armor",.065)
            box("Sloped bunker roof",(0,0,1.81),(2.94,2.72,.36),"dark",.045)
            for side in (-1,1):
                box("Machine-gun bastion",(.70,side*.93,1.95),(.87,.66,.84),"light",.04)
                box("Defensive firing slit",(1.18,side*.93,2.09),(.07,.39,.11),"glow",.015)
            box("Garrison bulkhead",(1.36,0,1.10),(.08,.91,.82),"dark",.01)
            for i in range(4):box("Reinforced blast rib",(1.43,-.45+i*.3,1.10),(.05,.12,.76),"light",.01)
        elif kind=="factory":
            box("Broad weapons foundry",(0,0,1.27),(2.86,2.60,1.47),"armor",.08)
            box("Riveted thermal roof",(-.13,0,2.19),(2.95,2.73,.30),"dark",.02)
            box("Forge blast gate",(1.47,0,1.33),(.08,1.53,1.15),"dark",.015)
            for i in range(5):
                box("Vertical hardened ribs",(1.53,-.67+i*.33,1.37),(.04,.12,1.10),"light",.009)
            for side in (-1,1):
                cyl("Forge exhaust",(-.92,side*.73,2.64),.33,1.31,"dark")
                cyl("Industrial heat signature",(-.92,side*.73,3.30),.30,.09,"glow")
            parts["radar"]=box("Overhead forging ram",(.2,0,2.55),(.28,.77,.43),"bronze",.04)
        elif kind=="radar":
            box("Electronics blast tower",(0,0,1.52),(1.71,1.82,1.79),"armor",.06)
            box("Signal bunker top",(0,0,2.59),(2.02,2.11,.40),"dark",.03)
            for side in (-1,1):
                tower("Comms radio pole",side*.72,0,2.69,1.56,"light",.09)
            cyl("Heavy scanner rotor",(0,0,3.19),.33,.64,"light")
            parts["radar"]=box("Sweeping radar crossbar",(0,0,3.57),(2.55,.24,.23),"bronze",.02)
            for x in (-1.17,1.17):
                box("Array antenna cap",(x,0,3.61),(.23,.39,.41),"glow",.025)
        elif kind=="tech":
            box("Fortified ballistic science bunker",(0,0,1.27),(2.63,2.47,1.36),"armor",.08)
            box("Heavy containment roof",(0,0,2.16),(2.88,2.67,.40),"dark",.03)
            cyl("Unstable furnace stack",(-.53,.35,3.11),.40,1.76,"bronze")
            cyl("Vent inductor",(-.53,.35,4.00),.35,.11,"glow")
            for side in (-1,1):
                cyl("Capacitor enclosure",(.68,side*.76,2.62),.32,.89,"light")
                cyl("Capacitor heat",(.68,side*.76,3.06),.22,.09,"glow")
            box("Secure reinforced research door",(1.31,-.18,1.2),(.08,.8,.86),"dark",.01)
        elif kind=="turret":
            box("Heavy artillery bunker",(0,0,1.25),(2.35,2.23,1.27),"armor",.07)
            box("Armored recoil hood",(.30,0,2.07),(1.90,1.75,.65),"dark",.035)
            barrel("Oversized cannon",1.29,0,2.27,2.07,.28,"bronze")
            cyl("Recoiling muzzle",(2.38,0,2.27),.37,.42,"light","X")
            for side in (-1,1):
                box("Slanted front blast shield",(1.25,side*.63,1.83),(.23,.36,1.01),"armor",.025)
        elif kind=="beam":
            box("Furnace-grade siege converter",(0,0,1.25),(2.17,2.07,1.41),"armor",.07)
            cyl("Exposed copper induction barrel",(0,0,2.52),.54,1.57,"bronze")
            for i in range(5):
                torus("Exposed glowing voltage coil",(0,0,1.89+i*.31),.66,.085,"glow")
            for x in (-.79,.79):
                tower("Forked arc rod",x,-.23,2.41,1.01,"light",.18)
                sphere("Charged rod tip",(x,-.23,3.55),(.16,.16,.20),"glow")
            parts["radar"]=cyl("Hot power converter",(0,0,3.45),.26,.19,"glow")
        elif kind=="airfield":
            box("Hardened aircraft bunker",(-.46,0,1.23),(2.36,2.83,1.43),"armor",.075)
            box("Layered anti-air roof",(-.48,0,2.17),(2.64,3.01,.32),"dark",.03)
            box("Aircraft blast bay",(.77,0,1.15),(.09,1.75,1.12),"dark",.009)
            box("Apron armour",(1.35,0,.80),(.73,2.95,.20),"dark",.025)
            for y in (-1.15,-.65,0,.65,1.15):
                box("Caution approach lights",(1.61,y,.93),(.20,.10,.06),"glow",.009)
            cyl("Roof flak cupola",(-.80,0,2.55),.29,.65,"light")
            barrel("Rooftop anti-air barrel",-.38,0,2.69,.80,.09,"dark")
    else:
        # Psionic Order: floating toroids, faceted polygons and mint neural apertures.
        if kind=="hq":
            prism("Citadel neural foundation",0,0,1.02,1.40,1.14,"armor",6)
            prism("Translucent citadel upper tier",0,0,2.21,.94,1.48,"light",6)
            spire("Aether command needle",0,0,3.54,.57,1.05,"armor",6)
            sphere("Floating command nexus",(0,0,4.65),(.36,.34,.36),"glow")
            parts["radar"]=torus("Orbiting neural shield",(0,0,3.53),1.16,.09,"glow",True)
            for i in range(4):
                a=i*math.tau/4
                spire("Citadel petal",math.cos(a)*1.25,math.sin(a)*1.25,.83,
                      .35,2.05,"light",3)
        elif kind=="generator":
            # AETHER SYNOD MK-II CRYSTAL LEVITATION WELL.
            # Triangular vertical fins and an elevated hovering crystal differentiate
            # this from both Coalition paired towers and Federation furnaces.
            prism("Obsidian crystalline capacitor",0,0,.75,1.22,1.11,"armor",6)
            prism("Recessed inner energy altar",0,0,1.78,.78,.34,"dark",6)
            torus("Luminous primary induction channel",(0,0,1.79),.73,.065,"glow")
            for i in range(3):
                a=i*math.tau/3
                x,y=math.cos(a)*1.26,math.sin(a)*1.26
                prism("Three-stage neural foot anchor",x,y,.72,.38,.35,"dark",3)
                prism("Lower crystalline socket",x,y,1.05,.28,.42,"light",3)
                spire("Blade of the Triple Mind",x,y,1.41,.35,1.82,"armor",3)
                spire("Violet inner antenna",x*.96,y*.96,2.01,.14,1.29,"glass",3)
                sphere("Mental synchronization receptor",(x,y,3.33),
                       (.17,.17,.19),"glow")
                box("Conductor tether",(x*.55,y*.55,1.59),(.17,.12,.12),"glow",.018)
            # A suspended energy pearl under a multi-layer faceted crystal spire.
            sphere("Suspended neural seed",(0,0,2.51),(.41,.41,.43),"glass")
            spire("Pointed crystalline psionic heart",0,0,2.51,.47,1.25,"light",6)
            spire("Bright crystal fire inside obelisk",0,0,2.65,.21,1.03,"glow",6)
            torus("Lower electromagnetic halo",(0,0,2.30),.60,.065,"glow")
            parts["radar"]=torus("Rotating psi constellation",(0,0,2.83),.87,.085,"light",True)
            for a in (0,math.pi*.5,math.pi,math.pi*1.5):
                xx,yy=math.cos(a)*.93,math.sin(a)*.93
                sphere("Orbiting guardian focus",(xx,yy,2.83),(.11,.11,.14),"glass")
        elif kind=="refinery":
            prism("Mineral morphing chamber",0,0,.91,1.30,1.05,"armor",6)
            spire("Suspended ore crystal",0,0,1.81,.71,2.09,"bronze",5)
            for i in range(3):
                a=i*math.tau/3
                sphere("Orbiting ore analyzer",(math.cos(a)*1.25,math.sin(a)*1.25,2.31),
                       (.28,.28,.30),"glow")
                spire("Mineral extruder",math.cos(a)*1.25,math.sin(a)*1.25,.89,
                      .27,1.19,"light",3)
            parts["radar"]=torus("Resonance sorting halo",(0,0,2.81),.86,.085,"glow",True)
        elif kind=="barracks":
            prism("Neural training sanctuary",0,0,1.06,1.47,1.08,"armor",6)
            sphere("Sanctuary thought chamber",(0,0,2.13),(1.11,1.11,.45),"dark")
            sphere("Mind control seed",(0,0,2.51),(.39,.39,.40),"glow")
            for i in range(5):
                a=i*math.tau/5
                spire("Neural initiation petal",math.cos(a)*1.14,math.sin(a)*1.14,1.12,
                      .34,1.49,"light",3)
            parts["radar"]=torus("Meditation field",(0,0,2.38),.92,.083,"glow")
        elif kind=="factory":
            prism("Psi fabrication crucible",0,0,.87,1.44,1.44,"armor",6)
            for i in range(4):
                a=i*math.tau/4
                spire("Fabrication focusing pylon",math.cos(a)*1.25,math.sin(a)*1.25,1.00,
                      .38,2.12,"light",3)
            parts["radar"]=torus("Fabrication accelerator",(0,0,2.65),.93,.13,"glow",True)
            sphere("Suspended quantum matter",(0,0,2.59),(.54,.52,.57),"glass")
            sphere("Foundry fabrication heart",(0,0,2.59),(.21,.19,.21),"glow")
        elif kind=="radar":
            prism("Neural radar plinth",0,0,.92,1.03,1.13,"armor",6)
            for side in (-1,1):
                spire("Opposed guide spire",side*1.02,0,1.00,.43,2.75,"light",3)
                sphere("Scanner guide tip",(side*1.02,0,3.90),(.17,.19,.20),"glow")
            parts["radar"]=torus("Rotating vertical psychic scanner",(0,0,2.56),1.11,.14,"glow",True)
            sphere("Psi tracking pupil",(0,0,2.58),(.24,.24,.29),"glass")
        elif kind=="tech":
            prism("Mind science laboratory",0,0,1.03,1.20,1.29,"armor",6)
            spire("Needle of arcane science",0,0,2.22,.72,2.14,"light",6)
            sphere("Dimensional research nucleus",(0,0,4.45),(.27,.30,.33),"glow")
            for h,r in ((2.42,.85),(2.95,.70),(3.45,.52)):
                torus("Orbital knowledge resonator",(0,0,h),r,.09,"glow",True)
            for i in range(3):
                a=i*math.tau/3
                spire("Research sentry",math.cos(a)*1.18,math.sin(a)*1.18,.95,
                      .28,1.34,"light",3)
        elif kind=="turret":
            prism("Floating cannon emplacement",0,0,1.00,1.13,1.05,"armor",6)
            sphere("Focused siege aperture",(0,0,2.23),(.56,.56,.60),"glow")
            for i in range(3):
                a=i*math.tau/3
                spire("Neural turret guard",math.cos(a)*.78,math.sin(a)*.78,1.72,
                      .32,1.00,"light",3)
            torus("Aperture lens",(0,0,2.27),.70,.13,"light",True)
            sphere("Tip projectile",(0,-.70,2.22),(.15,.16,.17),"glass")
        elif kind=="beam":
            prism("Psionic focusing core",0,0,1.05,1.15,1.24,"armor",6)
            spire("Aether beam monolith",0,0,2.18,.53,2.07,"light",5)
            sphere("Beam tip",(0,0,4.33),(.33,.34,.38),"glow")
            for h,r in ((2.48,.79),(3.32,.61)):
                torus("Vertical neural focusing ring",(0,0,h),r,.12,"glow",True)
            parts["radar"]=torus("Oscillating vector field",(0,0,2.82),1.01,.08,"light")
        elif kind=="airfield":
            prism("Raised aircraft launch platform",0,0,.96,1.54,.39,"armor",6)
            box("Levitating central deck",(.28,0,1.21),(2.19,2.34,.18),"dark",.03)
            for side in (-1,1):
                spire("Landing arc guide",-.36,side*.95,1.10,.33,1.67,"light",3)
                sphere("Focusing landing orb",(-.36,side*.95,2.74),(.23,.24,.26),"glow")
                for x in (-.05,.45,.95):
                    box("Airborne approach marker",(x,side*.74,1.38),
                        (.17,.12,.055),"glow",.01)
            parts["radar"]=torus("Psionic flight field",(0,0,1.74),1.09,.095,"glow",True)
            sphere("Aircraft locator",(0,0,2.05),(.23,.23,.24),"glass")

    # Common class identification stripe, unobtrusive at small zoom levels.
    if faction=="coalition":
        box("Aegis side identity strip",(0,-1.62,.68),(1.18,.055,.075),"glow",.01)
    elif faction=="federation":
        for x in (-.65,0,.65):
            box("Federation furnace indicator",(x,-1.68,.79),(.22,.07,.095),"glow",.01)
    else:
        sphere("Aether entrance light",(0,-1.46,.78),(.23,.12,.14),"glow")
    return BUILDING_SHAPES[faction][BUILDING_KINDS.index(kind)]
