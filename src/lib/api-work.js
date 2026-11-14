// A user action owns one signal across transport, response bodies and provider fallback.
let current = new AbortController();
export const cancelledError = () => Object.assign(new Error('AI通信を緊急停止しました。送信済み処理の課金は取り消せません。'), {name:'AbortError',code:'CANCELLED',terminal:true});
export const isApiWorkCancelled = error => error?.code === 'CANCELLED';
export function beginApiWork(){current.abort();current=new AbortController();return current;}
export function cancelApiWork(){current.abort();}
export const isCurrentApiWork = run => current === run && !run.signal.aborted;
export function throwIfApiWorkCancelled(error){if(isApiWorkCancelled(error))throw error;}
function waitFor(request,signal){
 if(signal.aborted)return Promise.reject(cancelledError());
 return new Promise((resolve,reject)=>{
  const stop=()=>reject(cancelledError());signal.addEventListener('abort',stop,{once:true});
  Promise.resolve(request).then(value=>{if(signal.aborted)reject(cancelledError());else resolve(value);},error=>reject(signal.aborted?cancelledError():error)).finally(()=>signal.removeEventListener('abort',stop));
 });
}
export const createApiWorkFetch = (signal=current.signal) => (url,options={}) => apiFetch(url,{...options,workSignal:signal});
export async function apiFetch(url,{workSignal,...options}={}){
 const work=workSignal || current.signal;
 if(work.aborted)throw cancelledError();
 const signal=options.signal?AbortSignal.any([work,options.signal]):work;
 const response=await waitFor(fetch(url,{...options,signal}),work);
 return new Proxy(response,{get(target,key){
  if(['json','text','blob','arrayBuffer','formData'].includes(key))return (...args)=>waitFor(target[key](...args),work);
  const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
 }});
}
