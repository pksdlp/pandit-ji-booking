/* WORK MANAGER service worker — v2.0.0
   index.html हमेशा पहले नेटवर्क से (नया कोड), न मिले तो cache से। पुरानी cache अपने-आप हटती है। */
const VER="wm-v2.0.0";
const SHELL=["./","./index.html","./manifest.webmanifest","./logo.png","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];
self.addEventListener("install",e=>{
 e.waitUntil(caches.open(VER).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:"reload"})).catch(()=>{})))));
});
self.addEventListener("activate",e=>{
 e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VER).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("message",e=>{if(e.data==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("fetch",e=>{
 const req=e.request;if(req.method!=="GET")return;
 const url=new URL(req.url);
 // Firebase / Google API कॉल कभी cache नहीं होतीं
 if(/googleapis\.com|firestore|firebaseio|identitytoolkit|securetoken|accounts\.google|google\.com\/(?!.*fonts)/.test(url.host+url.pathname)&&!/gstatic\.com$/.test(url.host))return;
 if(req.mode==="navigate"||url.pathname.endsWith("/index.html")||url.pathname.endsWith("/")){
  e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(VER).then(c=>c.put("./index.html",cp));return r}).catch(()=>caches.match("./index.html").then(r=>r||caches.match("./"))));
  return;
 }
 e.respondWith(caches.match(req).then(hit=>{
  const net=fetch(req).then(r=>{if(r&&(r.status===200||r.type==="opaque")){const cp=r.clone();caches.open(VER).then(c=>c.put(req,cp))}return r}).catch(()=>hit);
  return hit||net;
 }));
});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:"window"}).then(l=>l.length?l[0].focus():self.clients.openWindow("./#/reminders")))});
