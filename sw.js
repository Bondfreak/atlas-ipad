const CACHE = "atlas-ipad-alpha-v0.3.19";
const ASSETS = ["./","./index.html","./manifest.json","./Hero-v2.png","./motor-system.png","./cooling-system.png","./shaka-core-client.js","./core-live-integration.js","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];
const CORE_ORIGIN = "https://shaka-core-app.onrender.com";
const CORE_SCRIPTS = '<script src="./shaka-core-client.js"></script><script src="./core-live-integration.js"></script>';

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));
  self.clients.claim();
});

function isAtlasDocument(request){
  if(request.mode!=="navigate")return false;
  const url=new URL(request.url);
  return url.pathname.endsWith("/")||url.pathname.endsWith("/index.html");
}

async function injectCoreIntegration(response){
  const text=await response.text();
  const body=text.includes('core-live-integration.js')?text:text.replace("</body>",`${CORE_SCRIPTS}\n</body>`);
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

  if(url.origin===CORE_ORIGIN){
    event.respondWith(fetch(event.request));
    return;
  }

  if(isAtlasDocument(event.request)){
    event.respondWith(atlasDocument(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      return response;
    }))
  );
});
