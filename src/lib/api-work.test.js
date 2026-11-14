import test from 'node:test';
import assert from 'node:assert/strict';
import {beginApiWork,cancelApiWork,isCurrentApiWork,isApiWorkCancelled,apiFetch} from './api-work.js';

test('emergency stop aborts transport and blocks old body/next request without poisoning a new run',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;cancelApiWork();});
 let captured;globalThis.fetch=async(_url,init)=>{captured=init.signal;return new Promise(()=>{});};
 const old=beginApiWork();const pending=apiFetch('https://example.invalid');cancelApiWork();
 await assert.rejects(pending,e=>e.code==='CANCELLED');assert.equal(captured.aborted,true);assert.equal(isCurrentApiWork(old),false);
 const fresh=beginApiWork();globalThis.fetch=async()=>new Response('{"ok":true}');assert.deepEqual(await(await apiFetch('https://example.invalid')).json(),{ok:true});assert.equal(isCurrentApiWork(fresh),true);
});
test('stop during body reception settles even an uncooperative body and preserves ordinary HTTP errors',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;cancelApiWork();});
 beginApiWork();globalThis.fetch=async()=>({ok:true,status:200,json:()=>new Promise(()=>{})});const response=await apiFetch('https://example.invalid');const pending=response.json();cancelApiWork();await assert.rejects(pending,e=>e.code==='CANCELLED');
 beginApiWork();globalThis.fetch=async()=>new Response('{"error":"normal"}',{status:429});const failed=await apiFetch('https://example.invalid');assert.equal(failed.status,429);assert.deepEqual(await failed.json(),{error:'normal'});
});

test('real provider routes propagate user cancellation without fallback or a successful backup result',async t=>{
 const oai=await import('./openai.js');const gem=await import('./gemini.js');
 oai.setOpenAIApiKey('unit-test-not-secret');gem.setApiKey('unit-test-not-secret');
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;cancelApiWork();oai.setOpenAIApiKey('');gem.setApiKey('');});
 const calls=[()=>oai.extractTranslationsOAI('aGVsbG8='),()=>oai.translateSingleTextOAI('hello'),()=>gem.extractTranslations('aGVsbG8='),()=>gem.translateSingleText('hello'),()=>gem.generateTranslatedImage('aGVsbG8=',[{original:'hello',translated:'hello',type:'dialogue'}],'gemini-nano-banana-2.1')];
 for(const run of calls){
  let started;const ready=new Promise(resolve=>{started=resolve;});let count=0;
  beginApiWork();globalThis.fetch=async()=>{count++;started();return new Promise(()=>{});};
  const pending=run();await ready;cancelApiWork();
  const outcome=await Promise.race([pending.then(()=> 'unexpected success',e=>e.code),new Promise(resolve=>setTimeout(()=>resolve('still waiting'),100))]);
  assert.equal(outcome,'CANCELLED');assert.equal(count,1,'cancel does not request a fallback or diagnosis');
 }
});

test('late UI result and finally from a stopped action cannot overwrite or unlock the next action',async()=>{
 const {readFile}=await import('node:fs/promises');const source=await readFile(new URL('../App.jsx',import.meta.url),'utf8');
 const start=source.indexOf('  const handleSingleTranslate =');const body=source.slice(start,source.indexOf('\n  };',start)+5).replace('const handleSingleTranslate =','return');
 let deliver;let writes=0,finishes=0;const pending=new Promise(resolve=>{deliver=resolve;});
 const values={translations:[{original:'hello'}],startAiWork:()=>beginApiWork(),setTranslatingRow:()=>{},showStatus:()=>{},getLanguageInfo:()=>({nativeName:'English'}),targetLanguage:'en',sourceLanguage:'auto',translateSingleTextAI:()=>pending,engineMode:'gemini',setTextModelStatus:()=>{},getOpenAITextModelStatus:()=>({}),updateTranslation:()=>{writes++;},setErrorMessage:()=>{},isCurrentApiWork,isApiWorkCancelled,setApiBusy:()=>{finishes++;}};
 const runAction=new Function(...Object.keys(values),body)(...Object.values(values));
 const old=runAction(0);cancelApiWork();const fresh=beginApiWork();deliver('late answer');await old;
 assert.equal(writes,0);assert.equal(finishes,0);assert.equal(isCurrentApiWork(fresh),true);
});

test('actual stop UI lifecycle is idle-disabled, running-enabled, stopped-disabled and restartable',async()=>{
 const {readFile}=await import('node:fs/promises');const source=await readFile(new URL('../App.jsx',import.meta.url),'utf8');
 let busy=false;const noop=()=>{};
 const values={beginApiWork,cancelApiWork,setApiBusy:v=>{busy=v;},setIsGenerating:noop,setIsImageGenerating:noop,setIsAnalyzingImage:noop,setFieldGenerating:noop,setIsExtracting:noop,setTranslatingRow:noop,imageImportRequestRef:{current:0},extractionSessionRef:{current:0},showStatus:noop};
 const action=name=>{const start=source.indexOf('  const '+name+' =');const body=source.slice(start,source.indexOf('\n  };',start)+5).replace('const '+name+' =','return');return new Function(...Object.keys(values),body)(...Object.values(values));};
 const start=action('startAiWork'),stop=action('stopAiWork');
 assert.equal(busy,false);const old=start();assert.equal(busy,true);assert.equal(isCurrentApiWork(old),true);stop();assert.equal(busy,false);assert.equal(isCurrentApiWork(old),false);const fresh=start();assert.equal(busy,true);assert.equal(isCurrentApiWork(fresh),true);stop();assert.equal(busy,false);
 assert.match(source, /id="ai-emergency-stop"[^>]*disabled=\{!apiBusy\}/);
});

test('a request captured before async preprocessing stays cancelled after a new run starts',async t=>{
 const {createApiWorkFetch}=await import('./api-work.js');const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;cancelApiWork();});let calls=0;globalThis.fetch=async()=>{calls++;return new Response('{}');};
 beginApiWork();const oldFetch=createApiWorkFetch();cancelApiWork();beginApiWork();await assert.rejects(oldFetch('https://example.invalid'),e=>e.code==='CANCELLED');assert.equal(calls,0);assert.deepEqual(await(await apiFetch('https://example.invalid')).json(),{});
});

test('cancel during OpenAI image preparation cannot send a late request under the next run',async t=>{
 const oai=await import('./openai.js');const originalFetch=globalThis.fetch,OriginalImage=globalThis.Image;let image,requests=0;
 globalThis.Image=class {constructor(){image=this;this.naturalWidth=1024;this.naturalHeight=1536;}set src(_value){}};
 globalThis.fetch=async()=>{requests++;return new Response('{}');};oai.setOpenAIApiKey('unit-test-not-secret');t.after(()=>{globalThis.fetch=originalFetch;globalThis.Image=OriginalImage;oai.setOpenAIApiKey('');cancelApiWork();});
 beginApiWork();const pending=oai.generateTranslatedImageOAI('aGVsbG8=',[{original:'hello',translated:'hello',type:'dialogue'}]);assert.ok(image);cancelApiWork();const fresh=beginApiWork();image.onload();await assert.rejects(pending,e=>e.code==='CANCELLED');assert.equal(requests,0);assert.equal(isCurrentApiWork(fresh),true);
});
