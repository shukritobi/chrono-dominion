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
            # AEGIS MK-II COMMAND CITADEL: stepped, symmetrical aerospace HQ.
            # Broad three-tier silhouette, guarded glass bridge and clear signal crown.
            box("Titanium strategic podium",(0,0,1.01),(2.86,2.52,.82),"armor",.16)
            box("Aerospace logistics overhang",(-.12,0,1.58),(2.70,2.42,.23),"light",.09)
            box("Central command bridge",(-.24,0,2.06),(1.77,1.68,.91),"glass",.11)
            box("Upper citadel armor roof",(-.24,0,2.63),(2.02,1.93,.24),"armor",.09)
            box("Raised operations deck",(-.32,0,3.03),(1.31,1.27,.57),"light",.10)
            box("Periscope telemetry upper cap",(-.31,0,3.40),(1.51,1.49,.17),"dark",.055)
            cyl("Aegis signal transmitter",(-.31,0,3.86),.19,.88,"light",vertices=12)
            sphere("HQ signal beacon",(-.31,0,4.35),(.20,.20,.23),"glow")
            for side in (-1,1):
                y=side*1.13
                box("Reinforced command wing",(.27,y,1.34),(1.42,.56,.93),"armor",.085)
                box("Armored outer parapet",(.17,y,1.91),(1.55,.59,.19),"light",.042)
                tower("Independent optical sensor",.18,side*1.00,2.12,1.01,"dark",.14)
                sphere("Optical sensor eye",(.18,side*1.00,3.16),(.11,.12,.12),"glow")
                for x in (-.84,-.15,.54):
                    box("Aegis blue window slit",(x,side*1.44,1.47),(.28,.06,.13),"glass",.015)
                box("Structural lateral duct",(1.26,side*.67,.84),(.26,.39,.37),"dark",.03)
            # Raised entry framing, visible in the game's 3/4 orthographic view.
            box("Command entry landing",(1.20,0,.79),(.71,1.08,.19),"light",.04)
            box("Hardened access door",(1.48,0,1.15),(.07,.76,.61),"dark",.018)
            for y in (-.31,.31):
                box("Entry cyan direction strip",(1.55,y,1.16),(.028,.055,.52),"glow",.006)
            box("Bridge-wide communications illumination",(.68,0,2.22),(.06,1.21,.11),"glow",.015)
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
            # AEGIS MK-II ENCLOSED ORE SORTER: a low processing line rather than
            # another HQ/tower; a visible stepped conveyor makes its function obvious.
            box("Hermetic ore sorter chassis",(-.38,0,1.20),(2.23,2.33,1.19),"armor",.12)
            box("Clean inspection deck",(-.39,0,1.87),(2.38,2.45,.19),"light",.075)
            box("Glazed quality-control office",(-.87,-.69,2.24),(.79,.70,.58),"glass",.045)
            box("Office reinforced canopy",(-.87,-.69,2.61),(.91,.84,.13),"dark",.028)
            for j in range(3):
                x=-.85+j*.68
                cyl("Isolated mineral centrifuge",(x,.70,2.35),.25,.99,"light",vertices=16)
                cyl("Transparent separation window",(x,.70,2.37),.20,.71,"glass",vertices=16)
                cyl("Bottom blue induction collar",(x,.70,2.04),.27,.09,"glow",vertices=16)
                cyl("Top pressure ring",(x,.70,2.90),.30,.14,"dark",vertices=16)
                sphere("Laser mass detector",(x,.70,3.04),(.12,.12,.13),"glow")
            box("Sealed front belt housing",(1.02,-.06,.96),(.86,1.08,.43),"dark",.03)
            box("Active extraction conveyor",(1.42,-.06,1.20),(.93,.72,.08),"bronze",.017)
            for j in range(4):
                box("Separated mineral parcel",(1.15+j*.16,-.06,1.29),
                    (.11,.36,.13),"light",.012)
            for side in (-1,1):
                tower("Belt side gantry",1.14,side*.59,1.33,1.05,"light",.11)
                box("Ventilated sorter shield",(-.53,side*1.17,1.44),(1.54,.13,.59),"dark",.018)
                for i in range(4):
                    box("External inspection LED",(-1.04+i*.33,side*1.25,1.55),
                        (.19,.05,.12),"glow",.009)
            box("Overhead programmable sensor beam",(1.14,0,2.48),(.20,1.43,.16),"glass",.022)
            box("Ore approach ramp",(1.67,-.06,.76),(.69,.80,.12),"light",.03)
        elif kind=="barracks":
            # AEGIS MK-II TRAINING CAMP. Long twin accommodation wings,
            # lower than headquarters, with an identifiable central entrance.
            box("Modular Aegis campus hall",(-.24,0,1.17),(2.17,1.47,1.06),"armor",.12)
            box("Broad reinforced drill-field deck",(.20,0,.70),(2.73,2.77,.18),"dark",.075)
            for side in (-1,1):
                y=side*1.01
                box("Paired training dormitory wing",(-.41,y,1.13),(1.70,.73,.95),"light",.075)
                box("Stepped corridor roof",(-.49,y,1.73),(1.89,.86,.17),"armor",.035)
                box("Raised radio-mast footing",(-1.04,y,1.88),(.34,.35,.16),"dark",.025)
                tower("Field communication antenna",-1.04,y,1.96,1.28,"light",.085)
                sphere("Tactical signal tip",(-1.04,y,3.31),(.14,.14,.15),"glow")
                for i in range(3):
                    box("Dormitory entrance glass",(0.01+i*.32,side*1.37,1.16),
                        (.20,.045,.22),"glass",.011)
                box("Dormitory roof induction rail",(-.40,y,1.84),(1.45,.06,.06),"glow",.009)
            box("Training instruction terrace",(.74,0,1.88),(.79,1.08,.22),"dark",.035)
            box("Recruit access portal",(1.21,0,1.20),(.07,.83,.84),"glass",.013)
            box("Lit structural arch",(1.31,0,1.71),(.07,.99,.10),"glow",.015)
            for step in range(3):
                box("Ceramic barracks entrance step",(1.40+step*.13,0,.76-step*.055),
                    (.22,1.05,.08),"light",.014)
        elif kind=="factory":
            # AEGIS MK-IV OPEN-BAY ASSEMBLY YARD.
            # Camera faces +X and -Y. No full facade, curtain or front plane:
            # the near-side wall and front roof are cut away to expose a
            # physical vehicle workcell, robot gantry and drive-out rails.
            box("Open assembly floor",(-.28,0,.78),(2.54,2.58,.18),"dark",.028)
            box("Rear load-bearing hangar wall",(-1.36,0,1.47),
                (.20,2.58,1.55),"armor",.045)
            box("Far enclosed hangar sidewall",(-.49,1.23,1.46),
                (1.94,.16,1.54),"armor",.035)
            box("Near partial maintenance bulkhead",(-1.01,-1.23,1.43),
                (.89,.16,1.48),"armor",.035)
            box("Rear sheltered roof",(-.98,0,2.28),
                (1.12,2.72,.20),"light",.065)
            box("Rear raised roof sensor housing",(-1.00,.22,2.47),
                (.73,.91,.18),"dark",.035)
            # Four open gantry posts rather than an opaque roll-up door.
            for side in (-1,1):
                y=side*1.12
                box("Exposed front portal stanchion",(1.10,y,1.51),
                    (.22,.23,1.57),"light",.032)
                box("Cyan portal vertical status bar",(1.24,y,1.55),
                    (.045,.07,1.14),"glow",.006)
                box("Overhead traveling crane track",(-.04,y,2.40),
                    (2.35,.12,.17),"dark",.023)
                box("Exterior steel crane brace",(.64,y,2.21),
                    (.40,.19,.18),"armor",.019)
                box("Inside floor safety runner",(.15,side*.63,.89),
                    (1.79,.075,.06),"glow",.007)
            box("Open bay crosshead lintel",(1.10,0,2.35),
                (.24,2.44,.24),"light",.034)
            box("Hanging gantry spine",(-.05,0,2.36),
                (.19,1.97,.15),"armor",.025)
            box("Automated welding column",(-.15,-.65,1.45),
                (.22,.20,.79),"light",.021)
            box("Visible hydraulic welding boom",(.18,-.59,1.69),
                (.66,.15,.15),"armor",.019)
            sphere("Blue welding torch",(.56,-.59,1.59),
                   (.12,.12,.12),"glow")
            # Unfinished low-profile armored chassis in the open workcell.
            box("Visible unfinished vehicle undercarriage",(.30,.09,1.08),
                (1.24,.84,.21),"dark",.033)
            box("Incomplete light vehicle armor shell",(.16,.09,1.30),
                (.70,.58,.29),"armor",.042)
            box("Exposed engine assembly",(-.21,.09,1.48),
                (.24,.32,.17),"bronze",.018)
            for side in (-1,1):
                y=.09+side*.46
                box("Vehicle crawler under repair",(.34,y,1.04),
                    (1.17,.18,.24),"light",.035)
                for x in (-.05,.27,.59):
                    cyl("Suspension drive roller",(x,y,1.04),.085,.20,
                        "dark",axis="Y",vertices=12)
            box("Production bay moving carriage",(.01,0,2.08),
                (.42,.43,.24),"light",.021)
            parts["radar"]=box("Traveling robot lift hook",(.01,0,1.83),
                                (.23,.34,.31),"bronze",.021)
            parts["damage_breakable"]=box("Detachable crane control hood",
                (.01,0,2.55),(.63,.56,.15),"glass",.025)
            # A physical ramp opens directly to the exterior +X.
            box("Open vehicle launch ramp",(1.49,0,.76),
                (.89,2.24,.17),"dark",.024)
            for y in (-.69,-.35,0,.35,.69):
                box("Exit alignment marker",(1.58,y,.87),
                    (.53,.065,.04),"glow",.005)
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
            # RED BASTION MK-II SIEGE COMMAND: low, massive and intimidating.
            # Tiered armored red keep and offset smoke defense tower, not glass.
            box("Bastion reinforced ground bunker",(0,0,1.10),(3.07,2.98,1.02),"armor",.042)
            box("Sloped blast proof parapet",(-.27,.04,1.79),(2.88,2.64,.45),"dark",.025)
            box("Elevated heavy central keep",(-.44,.18,2.52),(1.98,1.73,1.16),"armor",.042)
            box("Top command shell",(-.48,.18,3.18),(2.17,1.91,.17),"light",.023)
            box("Command central heat shield",(.63,-.13,2.44),(.07,.83,.60),"dark",.018)
            for z in (2.18,2.37,2.56):
                box("Amber hardened bridge slit",(.69,-.13,z),(.026,.66,.075),"glow",.008)
            for side in (-1,1):
                y=side*1.04
                box("Outer artillery bastion",( .76,y,1.55),(1.05,.61,1.09),"dark",.034)
                box("Crimson angled bunker glacis",(.97,y,1.83),(.76,.66,.47),"armor",.023)
                cyl("Armored bastion observation cupola",(.66,y,2.38),.37,.36,"light",vertices=12)
                cyl("Cupola armored roof",(.66,y,2.64),.39,.16,"dark",vertices=12)
                for x in (-1.28,-.56,.16):
                    box("Vertical ferrocrete wall ribs",(x,side*1.51,1.30),(.16,.08,.83),"light",.019)
            # A single towering irregular signal chimney prevents Aegis symmetry.
            cyl("Bastion strategic signal chimney",(-1.10,.49,3.22),.33,1.80,"dark",vertices=14)
            cyl("Command antenna smoked socket",(-1.10,.49,4.13),.38,.22,"bronze",vertices=14)
            cyl("Amber unshielded communication core",(-1.10,.49,4.34),.16,.23,"glow",vertices=12)
            tower("Second lower comms stack",-1.29,-.72,2.92,.71,"dark",.23)
            box("Bastion access port",(1.57,0,1.20),(.09,1.01,.99),"dark",.018)
            box("Industrial gate threshold",(1.76,0,.67),(.53,1.27,.12),"light",.028)
            for side in (-1,1):
                for z in (1.03,1.23,1.45):
                    box("Heavy gate running lights",(1.68,side*.46,z),(.04,.08,.07),"glow",.006)
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
            # RED BASTION MK-II ORE CRUSHER AND FURNACE.
            # Open exposed hopper, staggered rotary drums and industrial stack.
            box("Iron ore furnace block",(-.26,0,1.10),(2.55,2.45,1.03),"armor",.045)
            box("Riveted cast-iron roof",(-.35,.10,1.74),(2.58,2.43,.22),"dark",.02)
            box("Crushing jaw open central hopper",(-.87,-.36,2.26),(1.03,1.23,.82),"bronze",.04)
            box("Hopper lower recess",(-.87,-.36,2.72),(.81,1.01,.16),"dark",.014)
            for x in (-1.13,-.82,-.52):
                box("Industrial crusher tooth",(x,-.37,2.78),(.15,.69,.18),"light",.018)
            for side in (-1,1):
                y=side*.86
                cyl("Ore-bearing separator drum",(.52,y,1.64),.42,1.16,"dark",axis="X",vertices=14)
                cyl("Red turbine crank collar",(1.10,y,1.64),.50,.15,"armor",axis="X",vertices=14)
                cyl("Glowing furnace drum portal",(1.22,y,1.64),.30,.04,"bronze",axis="X")
                for n in range(4):
                    box("Crank cage interlock",(.30+n*.21,y,2.08),(.11,.62,.08),"light",.014)
                box("Platform side blast shield",(-.31,side*1.22,1.26),(1.70,.16,.74),"dark",.035)
            cyl("Central ore smelting exhaust shaft",(-.80,.68,3.08),.33,2.00,"dark",vertices=16)
            cyl("Exhaust heated collar",(-.80,.68,4.10),.39,.21,"bronze",vertices=16)
            cylinder_wall=0
            for height in (2.40,2.74,3.18):
                cyl("Stack clamping ring",(-.80,.68,height),.38,.10,"armor",vertices=16)
            box("Open belt transfer bed",(1.20,-.16,.90),(.78,1.38,.22),"dark",.028)
            for index in range(5):
                box("Packed raw mineral chunk",(1.05+index*.13,-.18,.99),
                    (.10,.44,.13),"bronze",.01)
            box("Glowing furnace refuse outlet",(1.43,0,1.37),(.08,1.11,.33),"glow",.012)
            box("Industrial front belt lip",(1.58,0,.73),(.51,1.44,.08),"armor",.011)
        elif kind=="barracks":
            # RED BASTION MK-II MILITARY BARRACKS.
            # Opposed fortified firing towers and squat armored roll-door.
            box("Massive reinforced troop bunker",(0,0,1.16),(2.87,2.66,1.18),"armor",.055)
            box("Recessed barracks thermal roof",(-.16,0,1.87),(2.83,2.48,.28),"dark",.032)
            for side in (-1,1):
                y=side*.92
                box("Corbeled corner watchtower",(.58,y,1.90),(.93,.74,.94),"dark",.024)
                box("Red painted flak parapet",(.72,y,2.42),(.88,.78,.18),"armor",.019)
                cyl("Flak viewing cupola",(.53,y,2.61),.24,.28,"light",vertices=12)
                box("Orange fortified gun slit",(1.11,y,2.13),(.045,.46,.10),"glow",.009)
                box("Hardened troop housing wing",(-.66,y,1.19),(1.03,.65,.85),"dark",.026)
                for x in (-1.03,-.73,-.43):
                    box("Slotted garrison window",(x,side*1.32,1.36),
                        (.10,.05,.28),"glow",.009)
                box("Hatchback defensive rail",(1.07,y,1.27),(.17,.57,.35),"light",.022)
            box("Fortress troops bulkhead",(1.44,0,1.13),(.11,1.03,.89),"dark",.014)
            for i in range(5):
                box("Fortress portal grille",(1.50,-.45+i*.225,1.12),(.045,.085,.75),"light",.008)
            box("External recruitment platform",(1.60,0,.66),(.54,1.43,.15),"armor",.024)
            for side in (-1,1):
                tower("Low brutalist sentry antenna",-1.12,side*.74,2.04,.58,"light",.09)
                sphere("Bunker signal lamp",(-1.12,side*.74,2.65),(.10,.10,.11),"glow")
        elif kind=="factory":
            # RED BASTION MK-IV OPEN-THROAT FORGE.
            # The production bay is a genuine U-shell. Camera-visible
            # negative-Y wall is removed over its forward half, with a
            # suspended forging hammer and hot unfinished tracked hull.
            box("Exposed heavy foundry floor",(-.25,0,.79),
                (2.66,2.69,.19),"dark",.025)
            box("Massive rear foundry bulkhead",(-1.40,0,1.46),
                (.22,2.73,1.54),"armor",.021)
            box("Full far foundry sidewall",(-.45,1.29,1.44),
                (2.10,.19,1.48),"armor",.022)
            box("Near rear furnace masonry",(-1.05,-1.29,1.46),
                (.79,.19,1.49),"armor",.025)
            box("Rear foundry roof canopy",(-.99,0,2.28),
                (1.26,2.90,.26),"dark",.022)
            box("Raised furnace heat-shield",(-1.02,0,2.47),
                (1.15,2.67,.15),"armor",.016)
            for side in (-1,1):
                y=side*1.15
                box("Front blast portal pier",(1.10,y,1.49),
                    (.35,.36,1.57),"armor",.025)
                box("Riveted portal vertical guard",(1.30,y,1.51),
                    (.085,.18,1.27),"bronze",.012)
                box("Exposed gantry track",(-.12,y,2.48),
                    (2.47,.16,.20),"light",.016)
                box("Lower foundry guide channel",(.30,side*.71,.89),
                    (1.60,.13,.08),"bronze",.009)
                for x in (-.78,-.39):
                    box("Thermal wall vent",(x,side*1.39,1.62),
                        (.21,.045,.14),"glow",.007)
            box("Open blast-gate crosshead",(1.09,0,2.38),
                (.40,2.66,.30),"dark",.019)
            box("Amber inner furnace grate",(-1.25,.31,1.33),
                (.065,.88,.84),"bronze",.009)
            for y in (-.02,.28,.58):
                box("Furnace burning vertical slit",(-1.20,y,1.37),
                    (.04,.09,.60),"glow",.006)
            # Asymmetric roof stacks reinforce the industrial silhouette.
            for side,height in ((-1,1.40),(1,1.91)):
                y=side*.89
                cyl("Blackened foundry smoke stack",(-1.00,y,2.37),
                    .30,height,"dark",vertices=14)
                cyl("Hot stack outlet",(-1.00,y,2.37+height*.50),
                    .28,.10,"glow",vertices=14)
            # Physical production line is seen through the missing wall.
            box("Unfinished tracked siege chassis",(.27,.02,1.06),
                (1.35,.89,.23),"dark",.026)
            box("Unpainted front glacis",(.51,.02,1.27),
                (.52,.72,.22),"light",.019)
            box("Engine block on open hull",(-.21,.02,1.37),
                (.38,.48,.28),"bronze",.018)
            for side in (-1,1):
                y=.02+side*.49
                box("Exposed heavy vehicle track",(.27,y,1.04),
                    (1.38,.20,.28),"armor",.025)
                for x in (-.20,.11,.42,.73):
                    cyl("Visible drive idler",(x,y,1.01),
                        .10,.21,"dark",axis="Y",vertices=12)
            cyl("Forging hydraulic piston",(-.08,0,2.38),
                .18,.53,"bronze",vertices=12)
            box("Suspended forge carriage",(-.08,0,2.21),
                (.58,.72,.19),"armor",.014)
            parts["radar"]=box("Animated heavy forging die",(-.08,0,1.91),
                                (.48,.54,.38),"dark",.012)
            parts["damage_breakable"]=box("Removable forge hoist armor",
                (-.08,0,2.58),(.80,.89,.16),"light",.012)
            box("External armor loading ramp",(1.55,0,.78),
                (.91,2.51,.17),"dark",.022)
            for y in (-.91,-.46,0,.46,.91):
                box("Hazard chevron launch marking",(1.65,y,.89),
                    (.46,.10,.045),"glow",.005)
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
            # AETHER SYNOD MK-II NEURAL CITADEL: triangular gothic spires,
            # tall levitating command crystal, staggered orbiting shield ring.
            prism("Six-wing alien command plinth",0,0,.88,1.46,.95,"armor",6)
            prism("Obsidian command circuit tier",0,0,1.82,1.11,.60,"dark",6)
            prism("Crystal hollow upper sanctum",0,0,2.44,.92,1.16,"light",6)
            spire("Ascending neural command obelisk",0,0,3.48,.60,1.14,"armor",6)
            spire("Inner psionic government core",0,0,3.68,.34,.83,"glass",6)
            sphere("Citadel sovereign beacon",(0,0,4.69),(.24,.24,.27),"glow")
            for i in range(4):
                a=i*math.tau/4+math.pi/4
                x,y=math.cos(a)*1.31,math.sin(a)*1.31
                prism("Anchor of the Four Synods",x,y,.76,.36,.63,"dark",4)
                spire("Psi sentry crescent",x,y,1.36,.33,1.93,"armor",3)
                spire("Glazed sentry blade",x*.96,y*.96,1.61,.17,1.42,"glass",3)
                sphere("Neural upper crest",(x,y,3.36),(.12,.14,.14),"glow")
                box("Nexus control conduit",(x*.69,y*.69,1.24),(.24,.13,.12),"glow",.018)
            torus("Lower sovereign energy seal",(0,0,2.15),.95,.07,"glow")
            parts["radar"]=torus("Orbiting Aether command shield",(0,0,3.44),1.03,.11,"light",True)
            sphere("Telepathic core stabilization",(0,0,3.43),(.39,.40,.36),"glass")
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
            # AETHER SYNOD MK-II CRYSTAL EXTRACTOR: ore pods and a horizontal
            # mineral beam distinguish it from the vertical HQ/generator towers.
            prism("Quartz psychic sorting podium",0,0,.87,1.38,.97,"armor",6)
            prism("Dark suspended ore processor",-.21,0,1.73,1.08,.61,"dark",6)
            for i in range(3):
                angle=i*math.tau/3
                x,y=math.cos(angle)*1.23,math.sin(angle)*1.23
                prism("Crystalline storage pod",x,y,.78,.39,.62,"light",5)
                spire("Raw violet ore shard",x,y,1.39,.31,.95,"glass",5)
                sphere("Green ore scanner",(x,y,2.37),(.15,.15,.17),"glow")
                torus("Crystal-grade sorting ring",(x,y,1.59),.34,.047,"glow")
            # Horizontal controlled intake conveyor to show ore-handling purpose.
            box("Biomorphic extraction belt",(1.17,-.10,1.05),(.78,.84,.17),"dark",.035)
            for i in range(4):
                spire("Conveyed mineral",1.0+i*.18,-.10,1.16,.09,.24,"glass",4)
            prism("Mining containment interface",-.11,0,2.40,.86,.30,"armor",6)
            spire("Sorting crystal resonator",-.11,0,2.70,.48,.91,"glass",5)
            sphere("Mineral discrimination core",(-.11,0,3.61),(.18,.17,.19),"glow")
            torus("Sorting-level base halo",(-.11,0,2.47),.86,.082,"glow")
            parts["radar"]=torus("Rotating psionic extraction hoop",(-.11,0,3.03),.64,.082,"light",True)
            for side in (-1,1):
                box("Material guide fin",(.61,side*.80,1.47),(.95,.18,.20),"armor",.025)
                box("Green guide nerve",(.63,side*.78,1.63),(.69,.065,.09),"glow",.015)
        elif kind=="barracks":
            # AETHER SYNOD MK-III / HORIZONTAL INITIATION SANCTUARY.
            # Deliberately LOW and WIDE. No central vertical ring or tall
            # floating core: the high obelisk/hoop belongs to tech and factory.
            # Twin crescent wings surround an open ritual training court.
            prism("Low six-sided induction courtyard",0,0,.84,1.40,.38,"dark",6)
            prism("Sunken initiation basin",.05,0,1.17,.92,.16,"glass",6)
            for side in (-1,1):
                y=side*.99
                prism("Outward cantilevered student dorm wing",-.30,y,.90,.80,.76,
                      "armor",6)
                wing_roof=box("Low faceted sanctuary wing roof",(-.36,y,1.73),
                    (1.70,.78,.16),"light",.046)
                if side==1:
                    parts["damage_breakable"]=wing_roof
                box("Wing roof open-sky skylight",(-.29,y,1.84),
                    (1.02,.29,.06),"glass",.015)
                box("Mint transverse initiation inlay",(.31,y,1.61),
                    (.10,.51,.08),"glow",.008)
                # Two stepped, horizontally projecting petals are
                # intentionally much broader than they are tall.
                mesh("Outspread neural petal",[
                    (-1.43,y-side*.10,.82),(-.74,y-side*.43,.85),
                    (.02,y-side*.51,.89),(.20,y-side*.16,1.33),
                    (-.78,y-side*.16,1.46),(-1.38,y-side*.12,1.25)
                ],[(0,1,2,3,4,5)],"light")
                sphere("Lateral student telemetry orb",(-1.20,y,1.66),
                       (.13,.13,.15),"glow")
            # Three low rear fins distinguish a communal training hall
            # from the factory's high, opposing portal horns.
            for y in (-.70,0,.70):
                spire("Short rear thought-collecting fin",-1.12,y,1.47,
                      .23,.66,"armor",3)
            sphere("Ground-level memory crystal",(.05,0,1.46),
                   (.36,.37,.23),"glass")
            sphere("Training consciousness spark",(.05,0,1.50),
                   (.17,.17,.13),"glow")
            torus("Horizontal courtyard induction track",(.05,0,1.32),
                  .62,.055,"glow")
            box("Wide front trainee embarkation terrace",(1.25,0,.84),
                (.79,1.74,.15),"dark",.025)
            for y in (-.56,-.28,0,.28,.56):
                box("Five visible training floor lanes",(1.33,y,.96),
                    (.55,.065,.04),"glow",.008)
            box("Short broad recruitment portal",(1.53,0,1.26),
                (.12,1.08,.46),"armor",.015)
            box("Recessed ritual entry",(1.60,0,1.17),
                (.06,.79,.28),"dark",.005)
        elif kind=="factory":
            # AETHER SYNOD MK-III / TWIN-HORN MATTER SHIPYARD.
            # Intentionally TALL, FRONT-OPEN and RECTILINEAR in silhouette.
            # Twin elevated forks flank a luminous fabrication portal,
            # unlike the low twin-wing Barracks or the HQ central obelisk.
            prism("Wide matter foundry foundation",-.28,0,.84,1.34,.72,
                  "armor",6)
            box("Long dark vehicle synthesis slipway",(.60,0,.94),
                (2.30,1.77,.23),"dark",.035)
            for side in (-1,1):
                y=side*.88
                box("Projecting portal buttress",(.43,y,1.39),
                    (1.76,.36,.78),"armor",.055)
                box("Long mint guided fabrication rail",(.58,y,1.86),
                    (1.62,.11,.085),"glow",.011)
                fork=box("Tall vertical fabrication fork",(-.43,side*1.17,2.13),
                    (.58,.55,2.36),"light",.065)
                tip=spire("Asymmetric fork spearhead",-.43,side*1.17,3.27,
                          .35,.58,"armor",3)
                if side==1:
                    parts["damage_breakable"]=fork
                    parts["damage_secondary"]=tip
                fork_slit=box("Fork internal reactor slit",
                              (-.09,side*1.17,2.48),
                              (.055,.13,.97),"glow",.009)
                if side==1:
                    parts["damage_quaternary"]=fork_slit
                top_light=sphere("Matter-stabilizer light",
                                 (-.43,side*1.17,3.82),
                                 (.13,.14,.16),"glow")
                if side==1:
                    parts["damage_tertiary"]=top_light
                for x in (-.42,.06,.54,1.02):
                    box("Suspended transport channel",(x,side*.56,1.11),
                        (.22,.055,.06),"glass",.009)
            # The visible production bay faces the +X game camera.
            box("Dark recessed synthesis opening",(1.23,0,1.60),
                (.10,1.47,1.13),"dark",.006)
            box("Bright matter transfer portal",(1.31,0,1.57),
                (.045,1.19,.84),"glass",.005)
            for y in (-.50,-.25,0,.25,.50):
                box("Five aperture energy ribs",(1.35,y,1.62),
                    (.045,.07,.67),"glow",.005)
            box("Overhead open portal lintel",(1.24,0,2.31),
                (.31,1.94,.26),"armor",.025)
            box("Forecourt hover-vehicle ramp",(1.57,0,.74),
                (.58,1.83,.17),"dark",.023)
            for y in (-.60,-.30,0,.30,.60):
                box("Glowing outward launch guidance",(1.61,y,.85),
                    (.43,.075,.04),"glow",.007)
            # A real separately movable object, animated by the common
            # building 'radar' pivot during idle poses.
            parts["radar"]=box("Oscillating levitation gripper",(.50,0,2.35),
                                (.43,.65,.19),"light",.02)
            sphere("Held assembly nucleus",(.49,0,2.14),
                   (.32,.32,.28),"glass")
            sphere("Matter synthesis flash",(.49,0,2.15),
                   (.12,.13,.14),"glow")
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
