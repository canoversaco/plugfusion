import React,{useEffect,useMemo,useState} from "react";
import LiveTracker from "../components/LiveTracker.jsx"; import ChatWindow from "../components/ChatWindow.jsx";
const map=s=>({ "offen":"open","akzeptiert":"accepted","in arbeit":"in_progress","unterwegs":"en_route","abgeschlossen":"completed","open":"open","accepted":"accepted","in_progress":"in_progress","en_route":"en_route","completed":"completed" }[String(s||"").toLowerCase()]||s);
const isDone=s=>map(s)==="completed"; const isActive=s=>["open","accepted","in_progress","en_route"].includes(map(s||""));
async function j(u,m="GET",b){ const r=await fetch(u,{method:m,headers:{"Content-Type":"application/json"},body:b?JSON.stringify(b):undefined}); if(!r.ok) throw new Error(await r.text().catch(()=>r.statusText)); try{return await r.json();}catch{return {};} }
async function acceptOrder(id,courierId){ const p={order_id:id,courier_id:courierId,status:"accepted"}; for(const t of [()=>j("/api/courier/accept","POST",p),()=>j(`/api/orders/${id}/accept`,"POST",{courier_id:courierId}),()=>j("/api/orders/status","POST",{id,status:"accepted",courier_id:courierId})]){ try{ return await t(); }catch{} } throw new Error("Annehmen fehlgeschlagen"); }
async function completeOrder(id){ for(const t of [()=>j(`/api/orders/${id}/complete`,"POST"),()=>j("/api/orders/status","POST",{id,status:"completed"})]){ try{ return await t(); }catch{} } throw new Error("Abschließen fehlgeschlagen"); }
async function fetchMine(){ for(const t of [()=>j("/api/courier/orders"),()=>j("/api/orders?scope=courier"),()=>j("/api/orders")]){ try{ return await t(); }catch{} } return {orders:[]}; }
export default function CourierPanel(){ const [orders,setOrders]=useState([]),[me,setMe]=useState(null),[busy,setBusy]=useState(false),[err,setErr]=useState(""),[chatFor,setChatFor]=useState(null);
  useEffect(()=>{ (async()=>{ for(const u of ["/api/me","/api/auth/me","/api/profile"]){ try{ setMe(await j(u)); break; }catch{} } try{ const r=await fetchMine(); setOrders(r.orders||r||[]);}catch(e){setErr(String(e.message||e));} })(); },[]);
  const active=useMemo(()=>orders.filter(o=>isActive(o.status)),[orders]); const done=useMemo(()=>orders.filter(o=>isDone(o.status)),[orders]);
  async function onAccept(o){ if(busy) return; setBusy(true); setErr(""); try{ await acceptOrder(o.id||o.order_id, me?.id||me?.user_id||"me"); const r=await fetchMine(); setOrders(r.orders||r||[]);}catch(e){setErr(String(e.message||e));} setBusy(false); }
  async function onDone(o){ if(busy) return; setBusy(true); setErr(""); try{ await completeOrder(o.id||o.order_id); const r=await fetchMine(); setOrders(r.orders||r||[]);}catch(e){setErr(String(e.message||e));} setBusy(false); }
  return (<div className="max-w-3xl mx-auto px-3 py-4">
    <h1 className="text-xl font-semibold mb-3">Kurier Panel</h1>
    {err && <div className="mb-3 p-2 rounded bg-rose-900/20 border border-rose-700 text-rose-300 text-sm">{err}</div>}
    <section className="mb-8">
      <h2 className="text-lg mb-2">Aktiv</h2>
      {active.length===0 ? <div className="text-sm text-zinc-400">Keine aktiven Bestellungen</div> :
        <div className="space-y-3">{active.map(o=>(<div key={o.id||o.order_id} className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center gap-2 mb-2"><div className="text-sm text-zinc-200">#{o.id||o.order_id}</div><div className="text-xs text-zinc-500">• {map(o.status)}</div>
            <button onClick={()=>setChatFor(o.id||o.order_id)} className="ml-auto text-xs px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600">Chat</button>
            <button onClick={()=>onDone(o)} className="text-xs px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50" disabled={busy}>Abschließen</button>
            <button onClick={()=>onAccept(o)} className="text-xs px-3 py-1 rounded bg-violet-600 hover:bg-violet-500 disabled:opacity-50" disabled={busy}>Annehmen</button>
          </div>
          <LiveTracker orderId={o.id||o.order_id} courierId={me?.id||me?.user_id} canPublish={true}/>
        </div>))}</div>}
    </section>
    <section className="mb-8">
      <h2 className="text-lg mb-2">Abgeschlossen</h2>
      {done.length===0 ? <div className="text-sm text-zinc-400">Noch keine abgeschlossenen Bestellungen</div> :
        <div className="space-y-3">{done.map(o=>(<div key={o.id||o.order_id} className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/70">
          <div className="flex items-center gap-2"><div className="text-sm text-zinc-200">#{o.id||o.order_id}</div><div className="text-xs text-zinc-500">• completed</div></div>
        </div>))}</div>}
    </section>
    {chatFor && (<div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center p-2" onClick={()=>setChatFor(null)}>
      <div onClick={e=>e.stopPropagation()} className="w-full md:w-[640px] h-[70vh] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <ChatWindow roomId={`order-${chatFor}`} onClose={()=>setChatFor(null)} />
      </div>
    </div>)}
  </div>);
}