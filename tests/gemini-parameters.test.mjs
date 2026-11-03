import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

test('Gemini OCR fallback preserves translations with the supported stable model chain',async()=>{
  const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
  const saved=globalThis.fetch,attempted=[];
  const expected=['gemini-3.8-flash','gemini-3.6-flash','gemini-3.5-flash-lite','gemini-3.1-flash-lite'];
  try {
    const client=await server.ssrLoadModule('/src/lib/gemini.js');client.setApiKey('test-only');
    globalThis.fetch=async(url)=>{
      attempted.push(String(url).match(/models\/([^:]+):/)[1]);
      return new Response(JSON.stringify(attempted.length<expected.length
        ? {error:{message:'model unavailable',code:404}}
        : {candidates:[{content:{parts:[{text:JSON.stringify({layout:{type:'4koma',panels:['1コマ目']},texts:[{original:'こんにちは',translated:'Hello',type:'dialogue'}]})}]}}]}));
    };
    const output=await client.extractTranslations('aGVsbG8=');
    assert.deepEqual(attempted,expected);
    assert.equal(output.texts[0].translated,'Hello');
  } finally {globalThis.fetch=saved;await server.close();}
});

test('Gemini extraction retains image and translation output without deprecated parameters',async()=>{
  const server=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
  const saved=globalThis.fetch,calls=[];
  try {
    const client=await server.ssrLoadModule('/src/lib/gemini.js');client.setApiKey('test-only');
    globalThis.fetch=async(url,init)=>{calls.push(JSON.parse(init.body));return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({layout:{type:'4koma',panels:['1コマ目']},texts:[{original:'こんにちは',translated:'Hello',type:'dialogue'}]})}]}}]}));};
    const result=await client.extractTranslations('aGVsbG8=',()=>{});
    assert.ok(result);
    assert.equal(calls.length,1);
    assert.equal(calls[0].contents[0].parts[0].inlineData.data,'aGVsbG8=');
    for(const field of ['temperature','topP','topK','thinkingBudget'])assert.equal(Object.hasOwn(calls[0].generationConfig,field),false,field);
    assert.equal(calls[0].generationConfig.maxOutputTokens,8192);
  } finally {globalThis.fetch=saved;await server.close();}
});
