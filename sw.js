/* WORK MANAGER — ऑफलाइन चलाने के लिए Service Worker
   ऐप की फाइलें बदलें तो नीचे VERSION का नंबर बढ़ा दें (wm-v2, wm-v3 ...) */
const VERSION="wm-v1";
const SHELL=["./","./index.html","./manifest.webmanifest","./logo.png","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./apple-touch-icon.png"];
const CDN=[
 "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js",
 "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js",
 "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js",
 "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js"
];
const CDN_HOSTS=["cdnjs.cloudflare.com","www.gstatic.com"];

self.addEventListener("install",e=>{
 e.waitUntil((async()=>{
  const c=await caches.open(VERSION);
  await Promise.allSettled(SHELL.map(u=>c.add(new Request(u,{cache:"reload"}))));
  await Promise.allSettled(CDN.map(u=>fetch(u,{mode:"no-cors"}).then(r=>c.put(u,r))));
 })());
 self.skipWaiting();
});
self.addEventListener("activate",e=>{
 e.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
function timeout(ms){return new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),ms))}
async function networkFirst(req,fallbackKey){
 const c=await caches.open(VERSION);
 try{
  const res=await Promise.race([fetch(req),timeout(4000)]);
  if(res&&res.ok)c.put(req,res.clone());
  return res;
 }catch(err){
  const hit=await c.match(req,{ignoreSearch:true})||(fallbackKey&&await c.match(fallbackKey));
  if(hit)return hit;
  throw err;
 }
}
async function cacheFirst(req){
 const c=await caches.open(VERSION);
 const hit=await c.match(req);
 if(hit)return hit;
 const res=await fetch(req);
 if(res&&(res.ok||res.type==="opaque"))c.put(req,res.clone());
 return res;
}
self.addEventListener("fetch",e=>{
 const req=e.request;
 if(req.method!=="GET")return;
 const url=new URL(req.url);
 if(url.origin===location.origin){
  if(url.pathname.startsWith("/__/"))return; // Firebase Hosting के Auth रास्ते
  e.respondWith(networkFirst(req,req.mode==="navigate"?"./index.html":null));
 }else if(CDN_HOSTS.includes(url.hostname)){
  e.respondWith(cacheFirst(req));
 }
});
