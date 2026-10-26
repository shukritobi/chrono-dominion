/* Chrono Dominion v2.22 · original scripted voice library.
   All dialogue is written for Chrono Dominion, not transcribed from C&C. */
(function(root){
  'use strict';
  const factionNames={coalition:'Coalition',federation:'Iron Federation',psionic:'Psionic Order'};
  const kinds=['soldier','specialist','tank','heavy','harvester','recon','airship'];
  const activeKinds=new Set(['soldier','specialist','tank','heavy','harvester','recon']);
  const profiles={
    coalition:{
      soldier:['Ranger','field infantry','clear-radio'],
      specialist:['Chrono Operative','phase operative','clear-radio'],
      tank:['Lynx Tank','armour crew','vehicle-radio'],
      heavy:['Bulwark MBT','siege crew','vehicle-radio'],
      harvester:['Alloy Harvester','ore crew','industrial-radio'],
      recon:['Lynx Scout','recon patrol','clear-radio'],
      airship:['Aegis Skycruiser','airship bridge','airship-radio']
    },
    federation:{
      soldier:['Rifleman','frontline infantry','grit-radio'],
      specialist:['Arc Trooper','storm unit','grit-radio'],
      tank:['Bull Tank','armoured division','vehicle-radio'],
      heavy:['Mammoth Tank','heavy division','deep-radio'],
      harvester:['Ore Carrier','mining crew','industrial-radio'],
      recon:['Iron Patrol','scout division','grit-radio'],
      airship:['Iron Leviathan','airship command','airship-radio']
    },
    psionic:{
      soldier:['Acolyte','mindguard','psionic-echo'],
      specialist:['Neural Disciple','signal adept','psionic-echo'],
      tank:['Viper Tank','synaptic armour','psionic-echo'],
      heavy:['Mindbreaker','neural siege unit','deep-radio'],
      harvester:['Psi Collector','resource vessel','industrial-radio'],
      recon:['Shade Runner','shadow patrol','psionic-echo'],
      airship:['Eclipse Ark','skyborne nexus','psionic-echo']
    }
  };
  const unitBanks={
    ready:[
      '{unit} standing by.','{unit} operational.','Command, {role} is ready.',
      '{unit} reports systems green.','{role} awaiting deployment.','Unit online. Awaiting orders.'
    ],
    select:[
      '{unit} here.','Your orders, commander?','{role} receiving.',
      'Command link clear.','Standing by for instruction.','Ready for your signal.'
    ],
    move:[
      'Advancing to the marker.','Route acknowledged.','{unit} moving out.',
      'Repositioning now.','Heading to new coordinates.','Rolling toward the objective.'
    ],
    attack:[
      'Target acquired.','Weapons released.','Engaging hostile position.',
      'Opening fire on your mark.','Hostiles in sight. Moving to engage.','Suppressing enemy contact.'
    ],
    guard:[
      'Holding this perimeter.','Securing the assigned zone.','Guard pattern established.',
      'Eyes on the approaches.','Standing watch.','We will defend this ground.'
    ],
    hold:[
      'Position locked.','Remaining at station.','No forward movement.',
      'Holding fire until contact.','Defensive formation set.','We stay here.'
    ],
    underFire:[
      'Incoming fire!','Taking hits, commander!','We have hostile contact!',
      'Armour is being struck!','Returning defensive fire!','Under sustained attack!'
    ],
    retreat:[
      'Breaking contact!','Falling to the rear.','Pulling clear of the danger zone.',
      'Withdrawing to a safer position.','Disengaging now.','Backing away from contact.'
    ],
    lowHealth:[
      'Systems critical!','We need support immediately!','Damage is severe.',
      'Crew is under pressure!','Not much protection left!','Warning: critical damage!'
    ],
    kill:[
      'Target neutralized.','Hostile eliminated.','Contact destroyed.',
      'Enemy formation broken.','Another threat down.','Clear. Target removed.'
    ],
    death:[
      'We are going down!','Signal fading!','Command, we cannot hold!',
      'Losing structural integrity!','Abandoning position!','Unit connection lost!'
    ],
    ability:[
      'Special system charging.','Activating mission equipment.','Power routed to the array.',
      'Stand clear of the field.','Executing special protocol.','System engaged.'
    ]
  };
  const factionBanks={
    coalition:{
      ready:['Coalition command, all channels check.','Ready to keep the line secure.'],
      select:['Copy, commander.','Coalition unit listening.'],
      move:['Keeping formation.','Clean approach, moving.'],
      attack:['Clear the threat!','Precision fire authorized.'],
      guard:['Establishing a defensive cordon.'],
      ability:['Phase control on your signal.','Field systems synchronized.']
    },
    federation:{
      ready:['Iron division, reporting for duty.','The front holds. We are ready.'],
      select:['Speak, commander.','Iron command, we hear you.'],
      move:['Tracks forward. No delay.','Forward for the Federation.'],
      attack:['Crush their position!','Heavy fire, now!'],
      guard:['No enemy crosses this line.'],
      ability:['Overload coils primed.','Power surge prepared.']
    },
    psionic:{
      ready:['The signal awakens.','The order is already understood.'],
      select:['The channel is open.','We are listening through the veil.'],
      move:['The path is revealed.','Following the hidden current.'],
      attack:['Unmake their resistance.','Their defences will unravel.'],
      guard:['Our minds form the perimeter.'],
      ability:['Neural patterns converging.','The field answers our will.']
    }
  };
  const kindBanks={
    soldier:{
      ready:['Infantry section formed.','Boots on the ground.'],
      select:['Rifle team ready to receive.'],
      move:['On foot, moving through.'],
      attack:['Infantry opening fire.','Rifles up!'],
      underFire:['Infantry pinned down!']
    },
    specialist:{
      ready:['Special equipment secured.','Operative cleared to deploy.'],
      select:['Specialist receiving orders.'],
      move:['Taking the covert route.'],
      attack:['Precision strike commencing.'],
      ability:['Advanced system initiated.']
    },
    tank:{
      ready:['Turret drive online.','Armoured chassis ready.'],
      select:['Main gun standing by.'],
      move:['Treads engaged.','Crossing to the waypoint.'],
      attack:['Turret on target.','Cannon loaded, firing.'],
      underFire:['Hull armour compromised!']
    },
    heavy:{
      ready:['Siege platform in fighting condition.','Heavy armour standing by.'],
      select:['Heavy weapons listening.'],
      move:['Rolling with full tonnage.'],
      attack:['Siege batteries firing!','Bring down their walls.'],
      lowHealth:['Heavy plating has failed!']
    },
    harvester:{
      ready:['Extraction systems calibrated.','Cargo bays empty and ready.'],
      select:['Harvest crew listening.'],
      move:['Proceeding to the ore field.'],
      attack:['Mining vehicle under emergency threat!'],
      underFire:['Protect the cargo!'],
      ability:['Extraction cycle started.']
    },
    recon:{
      ready:['Recon feed established.','Long-range sensors online.'],
      select:['Scout patrol checking in.'],
      move:['Running ahead of the column.'],
      attack:['Marking the hostile patrol.'],
      guard:['Watching the access routes.'],
      ability:['Scanning the grid now.']
    },
    airship:{
      ready:['{unit} checking in from above.','Airship bridge connected to command.','Heavy-lift systems ready.'],
      select:['The sky is ours, commander.','Flight deck listening.','Bridge reporting.'],
      move:['Adjusting heading and altitude.','Slow and steady toward the target.'],
      attack:['Bomb bays open.','Payload inbound.','Enemy defences below. Beginning run.'],
      underFire:['Anti-aircraft fire on the hull!','Bridge is taking damage!'],
      lowHealth:['Altitude falling! Emergency power!'],
      death:['We are losing lift!','Evacuate the bridge!'],
      ability:['Atmospheric charge complete.']
    }
  };
  const announcements={
    commandOnline:['Command uplink established.','Strategic network online.','Commander, your forces are standing by.'],
    unitReady:['New unit ready for deployment.','Reinforcement ready.','Training complete. Unit available.'],
    unitLost:['Unit lost.','We have lost a unit.','Friendly unit no longer responding.'],
    squadLost:['Squad eliminated.','Infantry formation lost.','We have lost the entire squad.'],
    constructionStarted:['Construction initiated.','Building crews deployed.','Foundation work underway.'],
    constructionComplete:['Construction complete.','New structure operational.','Building systems activated.'],
    structureUnderAttack:['Our structure is under attack.','Hostile fire detected at our facility.','Warning. Building taking damage.'],
    structureLost:['Structure lost.','A friendly building has been destroyed.','Facility connection terminated.'],
    baseUnderAttack:['Warning. Our base is under attack.','Enemy forces are striking the command zone.','Base perimeter compromised.'],
    powerLow:['Insufficient power.','Grid overload. Additional power required.','Power demand exceeds generation.'],
    powerRestored:['Power restored.','Grid capacity nominal.','Electrical output stabilized.'],
    creditsLow:['Credits running low.','Resource reserves are critically low.','Additional income required.'],
    creditsReceived:['Ore delivery processed.','Resource transfer complete.','New credits available.'],
    oreDepleted:['Ore field depleted.','Local mineral deposit exhausted.','Resource node empty.'],
    harvesterLost:['Harvester lost.','Resource collection vehicle destroyed.','Mining convoy has been lost.'],
    harvesterIdle:['Harvester awaiting tasking.','Ore crew without assignment.','Extraction vehicle standing by.'],
    refineryReady:['Refinery operational.','Ore processing systems ready.','Extraction pipeline online.'],
    barracksReady:['Infantry production online.','Barracks personnel ready.','Training facility operational.'],
    factoryReady:['Vehicle factory operational.','Armour production line ready.','War factory online.'],
    radarOnline:['Radar online.','Tactical scan established.','Long-range sensors available.'],
    radarOffline:['Radar offline.','Sensor network interrupted.','Tactical coverage lost.'],
    technologyReady:['New technology available.','Research facilities operational.','Advanced systems unlocked.'],
    researchComplete:['Research complete.','Technology upgrade available.','New system authorized.'],
    enemySpotted:['Enemy contact detected.','Hostile movement on the tactical display.','New threat identified.'],
    enemyInfantry:['Hostile infantry sighted.','Enemy foot patrol detected.','Infantry contact confirmed.'],
    enemyArmor:['Enemy armour detected.','Hostile vehicles approaching.','Armoured contact on radar.'],
    enemyAir:['Hostile aircraft detected.','Air contact approaching.','Warning. Enemy airborne units.'],
    enemyPsionic:['Unusual neural activity detected.','Psionic signatures on the battlefield.','Hostile mindfield presence confirmed.'],
    defensesReady:['Defensive emplacement ready.','Perimeter weapons online.','Turret systems activated.'],
    defensesDisabled:['Defence grid impaired.','Perimeter coverage reduced.','Defensive emplacement offline.'],
    repairStarted:['Repair crews dispatched.','Restoration underway.','Structural maintenance initiated.'],
    repairComplete:['Repairs complete.','Structural integrity restored.','Maintenance teams standing down.'],
    repairUnavailable:['Unable to repair.','Insufficient resources for repairs.','Maintenance request denied.'],
    productionStarted:['Production queue started.','Manufacturing order acknowledged.','Production in progress.'],
    productionCancelled:['Production cancelled.','Manufacturing order withdrawn.','Construction order aborted.'],
    productionPaused:['Production suspended.','Manufacturing on hold.','Production pipeline paused.'],
    abilityReady:['Special ability ready.','Advanced system charged.','Tactical ability available.'],
    abilityActivated:['Special ability activated.','Tactical protocol initiated.','Advanced system deployed.'],
    abilityUnavailable:['Ability not ready.','Special system on cooldown.','Tactical charge incomplete.'],
    reinforcementArrived:['Reinforcements have arrived.','Friendly reserve units entering the field.','Support group deployed.'],
    outpostCaptured:['Forward position secured.','Outpost is now under friendly control.','Tactical ground acquired.'],
    objectiveCompleted:['Objective achieved.','Mission target secured.','Strategic objective complete.'],
    objectiveFailed:['Objective failed.','Mission target has been lost.','Strategic requirement unmet.'],
    enemyCommander:['Enemy command signal identified.','Hostile headquarters located.','Enemy control network detected.'],
    missileIncoming:['Missile launch detected.','Warning. Incoming warhead.','Projectile alert. Seek cover.'],
    airstrikeIncoming:['Airstrike detected.','Hostile attack flight inbound.','Warning. Bombing run approaching.'],
    navalContact:['Enemy naval contact.','Hostile ships detected.','Surface threat approaching.'],
    superweaponReady:['Strategic weapon charged.','High-energy system ready.','Superweapon available.'],
    superweaponLaunched:['Strategic launch confirmed.','High-energy payload released.','Superweapon in motion.'],
    victory:['Victory confirmed.','The battlefield is ours.','Enemy resistance has collapsed.'],
    defeat:['Defeat confirmed.','Our command network has fallen.','All friendly positions have been lost.']
  };
  const records=[],banks=new Map();
  const add=(id,text,voice,meta={})=>{
    const record={id,text,voice,...meta};
    records.push(record);const key=id.replace(/\.\d{2}$/,'');
    const group=banks.get(key)||[];group.push(record);banks.set(key,group);
  };
  function format(template,unit,role,faction){
    return template.replace(/\{unit\}/g,unit).replace(/\{role\}/g,role)
      .replace(/\{faction\}/g,faction);
  }
  for(const [faction,groups] of Object.entries(profiles)){
    for(const [kind,[unit,role,voice]] of Object.entries(groups)){
      for(const [cue,core] of Object.entries(unitBanks)){
        const unique=[...new Set([...core,...(factionBanks[faction][cue]||[]),...(kindBanks[kind]?.[cue]||[])])];
        unique.forEach((text,index)=>add('voice.'+cue+'.'+faction+'.'+kind+'.'+String(index+1).padStart(2,'0'),
          format(text,unit,role,factionNames[faction]),voice,
          {faction,kind,cue,unit,status:activeKinds.has(kind)?'implemented':'future'}));
      }
    }
  }
  for(const [event,lines] of Object.entries(announcements)){
    lines.forEach((line,index)=>add('announce.'+event+'.'+String(index+1).padStart(2,'0'),
      line,'announcer',{cue:event,kind:'announcer',status:'implemented'}));
  }
  const last=new Map(),styles={
    'announcer':{rate:.93,pitch:.91},
    'clear-radio':{rate:1.06,pitch:1.04},
    'grit-radio':{rate:.94,pitch:.75},
    'vehicle-radio':{rate:.90,pitch:.85},
    'deep-radio':{rate:.82,pitch:.64},
    'industrial-radio':{rate:.97,pitch:.84},
    'airship-radio':{rate:.83,pitch:.71},
    'psionic-echo':{rate:.86,pitch:1.16}
  };
  function choose(key){
    const group=banks.get(key);if(!group?.length)return null;
    const previous=last.get(key)??-1;
    const next=group.length<=1?0:(previous+1+Math.floor(Math.random()*(group.length-1)))%group.length;
    last.set(key,next);return group[next];
  }
  function get(cue,meta={}){
    const faction=String(meta.faction||'').toLowerCase(),kind=String(meta.kind||'').toLowerCase();
    if(cue.startsWith('announce.'))return choose(cue);
    return choose('voice.'+cue+'.'+faction+'.'+kind)||
      (faction?choose('voice.'+cue+'.'+faction+'.soldier'):null);
  }
  let lastSpeech=0;
  const api={
    profiles,announcements,records,styles,
    count:records.length,
    get,
    announce:(event)=>choose('announce.'+event),
    stop(){try{root.speechSynthesis?.cancel?.();}catch(e){}},
    speak(cue,meta={},volume=.8,urgent=false){
      const engine=root.speechSynthesis,U=root.SpeechSynthesisUtterance;
      if(!engine?.speak||typeof U!=='function')return false;
      const now=typeof root.performance?.now==='function'?root.performance.now():Date.now();
      if(!urgent&&now-lastSpeech<520)return false;
      const selected=cue.startsWith('announce.')?this.announce(cue.slice(9)):get(cue,meta);
      if(!selected)return false;
      try{
        const utter=new U(selected.text),style=styles[selected.voice]||styles.announcer;
        utter.rate=style.rate;utter.pitch=style.pitch;utter.volume=Math.max(0,Math.min(1,volume));
        const available=engine.getVoices?.()||[];
        const english=available.filter(v=>/^en([-_]|$)/i.test(v.lang||''));
        if(english.length){
          const index=selected.voice==='announcer'?0:
            selected.faction==='federation'?Math.min(english.length-1,1):
            selected.faction==='psionic'?Math.min(english.length-1,2):0;
          utter.voice=english[index];
        }
        engine.cancel();engine.speak(utter);lastSpeech=now;
        return true;
      }catch(err){return false;}
    }
  };
  root.ChronoVoices=api;
})(typeof window!=='undefined'?window:globalThis);
