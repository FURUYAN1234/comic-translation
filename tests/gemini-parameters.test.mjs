import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

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
