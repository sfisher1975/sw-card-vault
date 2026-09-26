// Cloudflare Worker for SW Card Vault v19.
// Deploy this file as a Worker, then paste its workers.dev URL into Tools in the app.
const ALLOWED_HOST = 'www.pricecharting.com';
function cors(headers={}) { return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS','Access-Control-Allow-Headers':'Content-Type',...headers}; }
function dollars(s){ if(!s) return null; const n=Number(String(s).replace(/[^0-9.]/g,'')); return Number.isFinite(n)?n:null; }
export default {
 async fetch(request){
  if(request.method==='OPTIONS') return new Response(null,{headers:cors()});
  try{
   const req=new URL(request.url), target=req.searchParams.get('url');
   if(!target) return Response.json({error:'Missing url'},{status:400,headers:cors()});
   const u=new URL(target);
   if(u.protocol!=='https:' || u.hostname!==ALLOWED_HOST || !u.pathname.startsWith('/game/')) return Response.json({error:'Only PriceCharting game pages are allowed'},{status:400,headers:cors()});
   const r=await fetch(u.toString(),{headers:{'User-Agent':'Mozilla/5.0 (compatible; SWCardVault/18; +personal collection price lookup)','Accept':'text/html'}});
   if(!r.ok) return Response.json({error:'PriceCharting returned '+r.status},{status:502,headers:cors()});
   const html=await r.text();
   // PriceCharting exposes current prices in the main price table. Capture only the first four columns:
   // Ungraded, Grade 7, Grade 8, Grade 9. PSA 10 is intentionally ignored.
   const text=html.replace(/<script[\\s\\S]*?<\\/script>/gi,' ').replace(/<style[\\s\\S]*?<\\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\\s+/g,' ');
   const marker=text.search(/Ungraded\\s*Grade 7\\s*Grade 8\\s*Grade 9/i);
   if(marker<0) return Response.json({error:'Could not find the PriceCharting grade table'},{status:502,headers:cors()});
   const chunk=text.slice(marker,marker+1500);
   const vals=[...chunk.matchAll(/\\$[0-9][0-9,]*(?:\\.[0-9]{1,2})?/g)].slice(0,4).map(m=>dollars(m[0]));
   if(vals.length<4) return Response.json({error:'Could not read all four requested price columns'},{status:502,headers:cors()});
   return Response.json({raw:vals[0],psa7:vals[1],psa8:vals[2],psa9:vals[3],updated:new Date().toISOString().slice(0,10),url:u.toString()},{headers:cors({'Cache-Control':'no-store'})});
  }catch(e){return Response.json({error:e.message||'Lookup failed'},{status:500,headers:cors()});}
 }
};
