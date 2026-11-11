import test from 'node:test';
import assert from 'node:assert/strict';
import {generateTranslatedImageOAI,setOpenAIApiKey} from '../src/lib/openai.js';
test('translation and refinement preserve failures without calling a retired image model',async t=>{
  const OriginalImage=globalThis.Image;
  globalThis.Image=class {set src(_value){this.naturalWidth=1024;this.naturalHeight=1536;this.onload();}};
  setOpenAIApiKey('test-only');t.after(()=>{globalThis.Image=OriginalImage;setOpenAIApiKey('');});
  for(const [status,isRefinement] of [[404,false],[429,false],[500,false],[404,true],[429,true],[500,true]]){
    const requests=[];
    const send=t.mock.method(globalThis,'fetch',async (_url,init)=>{
      requests.push(init.body.get('model'));
      return new Response(JSON.stringify({error:{message:'provider unavailable'}}),{status});
    });
    await assert.rejects(generateTranslatedImageOAI('c291cmNl',[{original:'朝',translated:'Morning',type:'dialogue'}],undefined,undefined,[],'','en','auto',isRefinement),/provider unavailable/);
    assert.deepEqual(requests,['gpt-image-2.6-sunburst']);send.mock.restore();
  }
});
