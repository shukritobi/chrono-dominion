import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../game.js', import.meta.url), 'utf8')
  .replace('  new Game();', '  window.__debugGame = new Game();');
assert.ok(source.includes('window.__debugGame'), 'Game entrypoint is present');

const canvasContext = new Proxy({}, {
  get(target, name) { return target[name] ?? (() => {}); },
  set(target, name, value) { target[name] = value; return true; }
});
const elements = new Map();
function getElementById(id) {
  if (!elements.has(id)) elements.set(id, {
    style: {},
    width: 256,
    height: 190,
    value: '',
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {},
    querySelectorAll() { return []; },
    getContext() { return canvasContext; },
    getBoundingClientRect() {
      return { width: id === 'world' ? 1000 : 256, height: id === 'world' ? 680 : 190, left: 0, top: 0 };
    },
    set innerHTML(value) { this._html = value; },
    get innerHTML() { return this._html ?? ''; },
    set textContent(value) { this._text = value; },
    get textContent() { return this._text ?? ''; }
  });
  return elements.get(id);
}
const window = { addEventListener() {} };
runInNewContext(source, {
  document: { getElementById },
  window,
  performance: { now: () => 0 },
  requestAnimationFrame() {},
  devicePixelRatio: 1,
  setTimeout: () => 1,
  clearTimeout() {}
}, { timeout: 3000 });

const game = window.__debugGame;
assert.ok(game, 'game initializes');
game.newMatch({ playerFaction: 'coalition', enemyFaction: 'federation', map: 'verdant', difficulty: 'standard' });
assert.equal(game.players.length, 2);
assert.equal(game.entities.length, 16);
assert.ok(game.ores.length >= 30, 'map has harvestable ore');

game.chooseProduction('factory');
assert.equal(game.placing, 'factory');
game.placeBuilding(11, 6);
assert.equal(game.placing, null);
assert.equal(game.players[0].credits, 3300, 'construction charges credits');

for (let i = 0; i < 1500; i++) game.step(0.05);
game.draw();
assert.equal(game.count(0, 'factory'), 1, 'construction completes');
assert.ok(game.players[0].credits > 3300, 'harvester unloads ore into credit economy');
assert.ok(game.entities.some(e => e.owner === 1 && e.type === 'unit'), 'AI has units');

game.chooseProduction('tank');
assert.ok(game.queues.some(q => q.side === 0 && q.key === 'tank'), 'player can queue tanks');
const before = Math.max(...game.entities.map(e => e.id));
for (let i = 0; i < 240; i++) game.step(0.05);
assert.ok(game.entities.some(e => e.owner === 0 && e.kind === 'tank' && e.id > before), 'factory builds a tank');
console.log('PASS: game initialization, two sides, ore, construction, harvesting, AI, tank production and rendering');
