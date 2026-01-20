const CACHE_NAME='vsa-ms211-v1';
const CORE=['./','./ms211.html','./manifest.webmanifest'];
self.addEventListener('install', (event)=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    try{ await cache.addAll(CORE); }catch(e){}
    self.skipWaiting();
  })());
});
self.addEventListener('activate', (event)=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.map(k=>k===CACHE_NAME?null:caches.delete(k)));
    self.clients.claim();
  })());
});
self.addEventListener('fetch', (event)=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  // only same-origin
  if(url.origin!==self.location.origin) return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const cached=await cache.match(req);
    if(cached) return cached;
    try{
      const res=await fetch(req);
      // cache successful basic responses
      if(res && res.ok && (res.type==='basic' || res.type==='cors')){
        cache.put(req, res.clone()).catch(()=>{});
      }
      return res;
    }catch(e){
      // fallback to cached app shell
      return (await cache.match('./ms211.html')) || new Response('Offline', {status:503, headers:{'Content-Type':'text/plain'}});
    }
  })());
});
