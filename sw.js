self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>self.clients.claim());
self.addEventListener('fetch',e=>{});
/* Android + installed PWA only: periodic background check of the gates. */
self.addEventListener('periodicsync',e=>{
  if(e.tag==='studio-check') e.waitUntil(checkGates());
});
async function checkGates(){
  try{
    const r=await fetch('https://ekecci.github.io/studio/data.enc?t='+Date.now(),{cache:'reload'});
    if(!r.ok) return;
    const txt=await r.text();
    /* cannot decrypt here without the key in SW scope; compare payload hash instead */
    const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(txt));
    const hex=Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
    const cache=await caches.open('studio-meta');
    const prev=await cache.match('last-hash');
    const prevHex=prev?await prev.text():'';
    await cache.put('last-hash',new Response(hex));
    if(prevHex&&prevHex!==hex&&self.registration.showNotification){
      await self.registration.showNotification('Studio updated',{body:'New report or gate — open to see what needs you.',icon:'icon-192.png',tag:'studio-sync'});
    }
  }catch(e){}
}
