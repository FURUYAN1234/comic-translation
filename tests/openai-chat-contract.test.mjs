import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OPENAI_TEXT_MODELS, OPENAI_MODEL_OPTIONS, DEFAULT_OPENAI_MODEL, fallbackModels, chatOptions, completedText, terminalOpenAIError } from '../src/lib/openai-chat-contract.js';
test('Sol first and compatible request with unchanged legacy options',()=>{
 assert.equal(OPENAI_TEXT_MODELS.length,11);
 assert.equal(OPENAI_TEXT_MODELS[0],'gpt-6-astra');
 assert.equal(DEFAULT_OPENAI_MODEL,'gpt-6.1-sol');
 assert.equal(fallbackModels()[0],DEFAULT_OPENAI_MODEL);
 assert.equal(OPENAI_MODEL_OPTIONS.length,11);
 for(const model of OPENAI_TEXT_MODELS.filter(id=>/^gpt-(6|5\.6)/.test(id))) assert.deepEqual(chatOptions(model),{max_completion_tokens:32768});
 assert.deepEqual(chatOptions('gpt-6.1-sol'),{max_completion_tokens:32768});
 assert.deepEqual(chatOptions('gpt-4.1',{temperature:0.1}),{temperature:0.1});
});
test('complete response accepted; length, empty and refusal fail closed',()=>{
 const data=(finish_reason,content,refusal)=>({choices:[{finish_reason,message:{content,refusal}}]});
 assert.equal(completedText(data('stop','valid')),'valid');
 assert.throws(()=>completedText(data('length','partial')),error=>terminalOpenAIError(error));
 for(const reason of ['tool_calls',undefined]) assert.throws(()=>completedText(data(reason,'partial')));
 for(const content of ['', ' ',null]) assert.throws(()=>completedText(data('stop',content)));
 assert.throws(()=>completedText(data('stop','text','refused')),error=>terminalOpenAIError(error));
 assert.throws(()=>completedText(data('content_filter','')),error=>terminalOpenAIError(error));
});
test('terminal account/policy errors stop; temporary/model errors permit fallback',()=>{
 for(const status of [401,403]) assert.ok(terminalOpenAIError({status}));
 for(const code of ['insufficient_quota','billing_hard_limit_reached','invalid_api_key','content_policy_violation']) assert.ok(terminalOpenAIError({code,status:429}));
 for(const status of [404,429,500]) assert.ok(!terminalOpenAIError({status,code:'model_not_found'}));
});

import { setOpenAIApiKey, setOpenAITextModel, getOpenAITextModelStatus, translateSingleTextOAI } from '../src/lib/openai.js';
test('real translation caller sends Sol first and stops on truncation', async () => {
 const originalFetch=globalThis.fetch;
 const calls=[];
 setOpenAIApiKey('test-only-placeholder');
 globalThis.fetch=async (_url, options)=>{
  calls.push(JSON.parse(options.body));
  return {ok:true,json:async()=>({choices:[{finish_reason:calls.length===1?'length':'stop',message:{content:'translated'}}]})};
 };
 try {
  await assert.rejects(()=>translateSingleTextOAI('sample'),/length/);
  assert.deepEqual(calls.map(c=>c.model),['gpt-6.1-sol']);
  assert.equal(calls[0].max_completion_tokens,32768);
  assert.ok(!('temperature' in calls[0]));
 } finally {globalThis.fetch=originalFetch;setOpenAIApiKey('');}
});
test('real translation caller stops after terminal quota failure', async () => {
 const originalFetch=globalThis.fetch;
 let calls=0;
 setOpenAIApiKey('test-only-placeholder');
 globalThis.fetch=async ()=>{calls++;return {ok:false,status:429,json:async()=>({error:{code:'insufficient_quota',message:'quota'}})}};
 try { await assert.rejects(()=>translateSingleTextOAI('sample'),/quota/);assert.equal(calls,1); }
 finally {globalThis.fetch=originalFetch;setOpenAIApiKey('');}
});

test('selection strictly limits fallback to lower models and rejects unknown IDs',()=>{
 for(const model of OPENAI_TEXT_MODELS) assert.deepEqual(fallbackModels(model),OPENAI_TEXT_MODELS.slice(OPENAI_TEXT_MODELS.indexOf(model)));
 for(const invalid of ['unknown','',null,{},'gpt-image-2.5-sunburst']) assert.throws(()=>fallbackModels(invalid));
 assert.deepEqual(fallbackModels('gpt-4o'),['gpt-4o']);
});

test('real lower-model selection never calls a higher model',async()=>{
 const originalFetch=globalThis.fetch; const calls=[];
 setOpenAIApiKey('test-only-placeholder');setOpenAITextModel('gpt-4.1-nano');
 globalThis.fetch=async (_url,options)=>{calls.push(JSON.parse(options.body).model);return calls.length===1
  ? {ok:false,status:404,json:async()=>({error:{code:'model_not_found',message:'unavailable'}})}
  : {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'translated'}}]})};};
 try {assert.equal(await translateSingleTextOAI('sample'),'translated');assert.deepEqual(calls,['gpt-4.1-nano','gpt-4o']);assert.deepEqual(getOpenAITextModelStatus(),{selected:'gpt-4.1-nano',attempted:calls,adopted:'gpt-4o'});}
 finally {globalThis.fetch=originalFetch;setOpenAIApiKey('');setOpenAITextModel(DEFAULT_OPENAI_MODEL);}
 assert.throws(()=>setOpenAITextModel('unknown'));
});
