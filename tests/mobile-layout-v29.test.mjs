import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
const coarse=css.slice(css.indexOf('/* v2.9 compact-screen'));
assert.ok(coarse.includes('@media (pointer:coarse)'), 'touch rules are restricted to coarse pointers');
for(const selector of ['#topbar button','.tabs button','.buildActions button','.unitActions button','.specialAction','.reconContactJump','.battleEventRow','.queueEntry button'])
  assert.ok(coarse.includes(selector), 'missing touch target: '+selector);
assert.match(coarse,/min-height:44px/, 'touch targets should be at least 44 CSS pixels high');
assert.match(coarse,/@media \(max-width:550px\) and \(pointer:coarse\)/);
assert.match(coarse,/@media \(max-height:500px\) and \(pointer:coarse\)/);
assert.match(coarse,/overscroll-behavior:contain/);
assert.ok(!css.slice(0,css.indexOf('/* v2.9 compact-screen')).includes('v2.9'), 'do not rewrite earlier styles');
console.log('v2.9 compact touch layout checks passed');
