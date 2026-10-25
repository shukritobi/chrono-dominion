import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const makeStorage=()=>{
  const memory=new Map();
  return {memory,getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),
    removeItem:k=>memory.delete(k)};
};
const store=makeStorage(),window={localStorage:store};
runInNewContext(read('maps/catalog.js'),{window,console});
runInNewContext(read('maps/map-core.js'),{window,console});
const core=window.ChronoMaps;
const template=window.ChronoMapCatalog.verdant;
const create=name=>core.fromTemplate(template,name);

// A v1 single-map record becomes the first library item, without being lost.
store.setItem(core.STORAGE_KEY,JSON.stringify(create('Original Legacy Battlefield')));
const migration=core.list(store);
assert.equal(migration.maps.length,1,'legacy slot migrated in read model');
assert.equal(migration.maps[0].name,'Original Legacy Battlefield');
assert.equal(migration.activeId,'map-1');
assert.equal(store.getItem(core.LIBRARY_KEY),null,'migration is not written before first user action');
const second=core.saveAs(create('Western Ridge'),store);
assert.ok(second.valid,'save-as creates another entry and persists migration');
assert.equal(core.list(store).maps.length,2);
assert.equal(core.list(store).activeId,second.slotId);
assert.equal(core.load(store).name,'Western Ridge');
assert.ok(store.getItem(core.LIBRARY_KEY),'library v2 persisted');
assert.equal(JSON.parse(store.getItem(core.STORAGE_KEY)).name,'Western Ridge',
  'legacy active map is kept compatible with the game');

// Selection changes active custom map without losing other edits.
const selectOld=core.select('map-1',store);
assert.ok(selectOld.valid);
assert.equal(core.load(store).name,'Original Legacy Battlefield');
const altered=core.load(store);altered.name='Original Legacy Edited';
assert.ok(core.save(altered,store).valid);
assert.equal(core.loadSlot('map-1',store).name,'Original Legacy Edited');
assert.equal(core.loadSlot(second.slotId,store).name,'Western Ridge','other slots not overwritten');

const duplicate=core.duplicate('map-1',store);
assert.ok(duplicate.valid);
assert.notEqual(duplicate.slotId,'map-1','each copy has a stable ID');
assert.ok(core.load(store).name.endsWith(' Copy'));
assert.equal(core.list(store).maps.length,3);
const copyId=duplicate.slotId;
assert.ok(core.remove(copyId,store).valid);
assert.equal(core.loadSlot(copyId,store),null);
assert.equal(core.list(store).maps.length,2);
assert.ok(core.load(store),'deleting active map selects another saved slot');

// Mutation failure cannot destroy valid existing library.
const before=JSON.stringify(core.list(store));
const invalid=create('X');
assert.equal(core.saveAs(invalid,store).valid,false);
assert.equal(JSON.stringify(core.list(store)),before,'invalid edits leave the library intact');
const full=makeStorage();
for(let i=1;i<=core.MAX_MAPS;i++){
  const r=core.saveAs(create('Library Map '+i),full);
  assert.ok(r.valid,'slot '+i+' added');
}
assert.equal(core.list(full).maps.length,12);
assert.equal(core.saveAs(create('Overflow Map'),full).valid,false,'hard cap prevents overflow');
assert.equal(core.list(full).maps.length,12);
assert.equal(core.duplicate(core.list(full).maps[0].slotId,full).valid,false);
assert.equal(core.select('map-99999',full).valid,false);
assert.equal(core.remove('map-99999',full).valid,false);

// Removing all slots cannot resurrect the old v1 map.
for(const item of core.list(full).maps)assert.ok(core.remove(item.slotId,full).valid);
assert.equal(core.list(full).maps.length,0);
assert.equal(core.load(full),null);

// Malformed storage is handled safely without crashing game startup.
const broken=makeStorage();broken.setItem(core.LIBRARY_KEY,'{{garbage}');
assert.equal(core.list(broken).maps.length,0);
assert.equal(core.load(broken),null);
console.log('PASS: legacy migration, 12 slots, save/select/duplicate/delete, data isolation, malformed storage');
