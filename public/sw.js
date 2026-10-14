// Never cache accounts, chats, listing APIs or OAuth responses.
const RELEASE='__APP_RELEASE__';
const CACHE='kosrent-offline-'+RELEASE;
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/offline.html','/offline.js'])))});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('kosrent-offline-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(u.origin!==self.location.origin||event.request.method!=='GET'||u.pathname.startsWith('/api/')||u.pathname.startsWith('/auth/'))return;if(u.pathname==='/offline.js'){event.respondWith(caches.match('/offline.js').then(cached=>cached||fetch(event.request)));return}if(event.request.mode==='navigate')event.respondWith(fetch(event.request).catch(()=>caches.match('/offline.html')))});

self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
