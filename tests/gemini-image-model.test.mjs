import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('translation and refinement use Nano Banana 2.1 Interactions, preserving the source and instructions', async () => {
  const server = await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
  const savedFetch = globalThis.fetch;
  try {
    const client = await server.ssrLoadModule('/src/lib/gemini.js');
    client.setApiKey('test-only');
    assert.equal(client.IMAGE_MODEL_OPTIONS[0].value, 'gemini-nano-banana-2.1');
    const calls=[];
    globalThis.fetch=async (url, options) => {
      calls.push({url,body:JSON.parse(options.body)});
      return new Response(JSON.stringify({status:'completed',steps:[{content:[{type:'image',data:'cmVzdWx0',mime_type:'image/jpeg'}]}]}));
    };
    for (const refine of [false,true]) {
      const result = await client.generateTranslatedImage('c291cmNl',[{type:'dialogue',original:'おはよう',translated:'Good morning'}],client.IMAGE_MODEL_OPTIONS[0].value,()=>{},[],'Keep the border','en','ja',refine);
      assert.equal(result.usedModel,'gemini-nano-banana-2.1');
      assert.equal(result.base64Img,'cmVzdWx0');
    }
    for (const {url,body} of calls) {
      assert.match(url,/\/v1beta\/interactions$/);
      assert.equal(body.model,'gemini-nano-banana-2.1');
      assert.deepEqual(body.input[0],{type:'image',mime_type:'image/png',data:'c291cmNl'});
      assert.match(body.input[1].text,/Keep the border/);
      assert.equal(body.generationConfig,undefined);
    }
    let imageCalls=0;
    globalThis.fetch=async url => {
      if(url.endsWith('/interactions')) imageCalls++;
      return new Response(JSON.stringify({status:'completed',steps:[]}));
    };
    await assert.rejects(client.generateTranslatedImage('c291cmNl',[], 'gemini-3.1-flash-image'));
    assert.equal(imageCalls,1,'obsolete selections migrate to the current model; missing output cannot succeed');
  } finally {globalThis.fetch=savedFetch;await server.close();}
});
