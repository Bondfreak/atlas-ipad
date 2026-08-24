const CACHE = "atlas-ipad-alpha-v0.3.33";
const ASSETS = ["./","./index.html","./manifest.json","./Hero-v2.png","./motor-system.png","./cooling-system.png","./shaka-core-client.js","./core-live-integration.js","./m07-deterministic-flow.js","./m07-version.js","./m08-kai-info.js","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];
const SERVER_ORIGIN = "https://shaka-server.onrender.com";
const CORE_CLIENT = '<script src="./shaka-core-client.js"></script>';
const CORE_INTEGRATION = '<script src="./core-live-integration.js"></script>';
const M07_FLOW = '<script src="./m07-deterministic-flow.js"></script>';
const M07_VERSION = '<script src="./m07-version.js"></script>';
const M08_KAI = '<script src="./m08-kai-info.js"></script>';

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

function isAtlasDocument(request){
  if(request.mode!=="navigate")return false;
  const url=new URL(request.url);
  return url.pathname.endsWith("/")||url.pathname.endsWith("/index.html");
}

async function injectCoreIntegration(response){
  let body=await response.text();
  const scripts=[];
  if(!body.includes('shaka-core-client.js'))scripts.push(CORE_CLIENT);
  if(!body.includes('core-live-integration.js'))scripts.push(CORE_INTEGRATION);
  if(!body.includes('m07-deterministic-flow.js'))scripts.push(M07_FLOW);
  if(!body.includes('m07-version.js'))scripts.push(M07_VERSION);
  if(!body.includes('m08-kai-info.js'))scripts.push(M08_KAI);
  if(scripts.length)body=body.replace("</body>",`${scripts.join('')}\n</body>`);
  const headers=new Headers(response.headers);
  headers.delete("content-length");
  return new Response(body,{status:response.status,statusText:response.statusText,headers});
}

async function atlasDocument(request){
  let response=await caches.match(request);
  if(!response)response=await caches.match("./index.html");
  if(!response)response=await fetch(request);
  return injectCoreIntegration(response);
}

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin===SERVER_ORIGIN){event.respondWith(fetch(event.request));return;}
  if(isAtlasDocument(event.request)){event.respondWith(atlasDocument(event.request));return;}
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response})));
});
