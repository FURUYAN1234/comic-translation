import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../src/App.css',import.meta.url),'utf8');
const rule=selector=>{const matches=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(x=>x[1].trim()===selector);assert.ok(matches.length,selector);return matches.at(-1)[2];};
const color=(body,key)=>{const m=body.match(new RegExp('(?:^|;)\\s*'+key+':\\s*(#[0-9a-fA-F]{6})'));assert.ok(m,key);return [1,3,5].map(i=>parseInt(m[1].slice(i,i+2),16));};
const lum=rgb=>rgb.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
test('disabled stop is neutral gray with a gray border, active is red and contrast stays readable',()=>{
 const inactive=rule('.ai-emergency-stop:disabled'),active=rule('.ai-emergency-stop');const bg=color(inactive,'background');
 assert.ok(Math.max(...bg)-Math.min(...bg)<=8,'disabled background must be neutral gray');
 const border=color(inactive,'border-color');assert.ok(Math.max(...border)-Math.min(...border)<=8,'disabled border must also be gray');
 const red=color(active,'background');assert.ok(red[0]>red[1]*1.8&&red[0]>red[2]*1.8,'enabled stop remains red');
 for(const value of [bg,red])assert.ok(1.05/(lum(value)+.05)>=4.5,'white text readable');
 assert.match(css,/\.ai-emergency-stop:hover:enabled/,'hover red is enabled only');
});
