import React, { useEffect, useMemo, useState } from 'react'
import LiveTracker from '../components/LiveTracker.jsx'
import ChatWindow from '../components/ChatWindow.jsx'
import { useApi } from '../components/dataApi.js'

const std = s => (s||'').toString().toLowerCase()

export default function Courier(){
  const api = useApi()
  const [orders,setOrders]=useState([]),[q,setQ]=useState(''),[chat,setChat]=useState(null)

  async function load(){ setOrders(await api.courierOrders()) }
  useEffect(()=>{ load() },[])

  const groups=useMemo(()=>{
    const inb=[], act=[], done=[]
    for(const o of orders){
      const s=std(o.status)
      if(['completed','abgeschlossen','done','delivered'].includes(s)) done.push(o)
      else if(['open','offen','pending','bestätigt','angenommen'].includes(s) && !o.mine) inb.push(o)
      else act.push(o)
    }
    const f=t=>t?x=>String(x.id).includes(t)||String(x.customer||'').toLowerCase().includes(t.toLowerCase()):x=>true
    return {inb:inb.filter(f(q)), act:act.filter(f(q)), done:done.filter(f(q))}
  },[orders,q])

  const accept = async(id)=>{ const ok = await api.postAny([`/api/courier/orders/${id}/assign`,`/api/orders/${id}/accept`,`/api/courier/claim?id=${id}`],{}); if(ok) load(); }
  const setStatus = async(id,status)=>{ const ok=await api.postAny([`/api/courier/orders/${id}/status`,`/api/orders/${id}/status`],{status}); if(ok) load(); }
  const setEta = async(id,mins)=>{ const ok=await api.postAny([`/api/courier/orders/${id}/eta`,`/api/orders/${id}/eta`],{eta_minutes:mins}); if(ok) load(); }
  const sendGPS = async(id)=>{ if(!navigator.geolocation) return alert('Kein GPS'); navigator.geolocation.getCurrentPosition(async p=>{ const ok=await api.postAny([`/api/courier/orders/${id}/location`,`/api/orders/${id}/location`,`/api/orders/${id}/loc`],{lat:p.coords.latitude,lng:p.coords.longitude}); if(ok) load(); }) }

  const Row = ({o,actions})=>(
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-semibold">#{o.id} • {o.customer||'Kunde'}</div>
        <LiveTracker orderId={o.id}/>
      </div>
      <div className="text-xs opacity-70">{(o.created_at||'').replace('T',' ').slice(0,16)} • {o.status}</div>
      <div className="flex gap-2 flex-wrap">{actions}</div>
    </div>
  )

  return (
    <div className="pf-pt-safe pf-pb-safe p-3 space-y-4">
      <div className="rounded-2xl p-4 border border-slate-800 bg-gradient-to-r from-cyan-600/10 via-blue-600/10 to-indigo-600/10">
        <div className="text-xl font-extrabold">Kurier</div>
        <div className="text-xs opacity-70 mt-1">Aufträge annehmen, Status, ETA, GPS, Live & Chat</div>
      </div>

      <div className="flex items-center gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Suche (ID/Name)…" className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm flex-1"/>
        <button className="btn-ghost" onClick={load}>Aktualisieren</button>
      </div>

      <div className="space-y-2">
        <div className="text-sm opacity-80">Eingehend</div>
        {groups.inb.length===0 ? <div className="text-xs opacity-60">Keine offenen Bestellungen.</div> :
          groups.inb.map(o=><Row key={o.id} o={o} actions={
            <>
              <button className="btn" onClick={()=>accept(o.id)}>Annehmen</button>
              <button className="btn-ghost" onClick={()=>setChat(o.id)}>Chat</button>
            </>
          }/>)}
      </div>

      <div className="space-y-2">
        <div className="text-sm opacity-80">Aktiv</div>
        {groups.act.length===0 ? <div className="text-xs opacity-60">Nichts aktiv.</div> :
          groups.act.map(o=><Row key={o.id} o={o} actions={
            <>
              <button className="btn" onClick={()=>setStatus(o.id,'unterwegs')}>Unterwegs</button>
              <button className="btn" onClick={()=>setStatus(o.id,'abgeschlossen')}>Abgeschlossen</button>
              <button className="btn-ghost" onClick={()=>setEta(o.id,15)}>ETA +15</button>
              <button className="btn-ghost" onClick={()=>sendGPS(o.id)}>GPS</button>
              <button className="btn-ghost" onClick={()=>setChat(o.id)}>Chat</button>
            </>
          }/>)}
      </div>

      <div className="space-y-2">
        <div className="text-sm opacity-80">Abgeschlossen</div>
        {groups.done.length===0 ? <div className="text-xs opacity-60">Noch keine erledigt.</div> :
          groups.done.map(o=><Row key={o.id} o={o} actions={<button className="btn-ghost" onClick={()=>setChat(o.id)}>Chat</button>}/>)}
      </div>

      {chat && <ChatWindow orderId={chat} onClose={()=>setChat(null)}/>}
    </div>
  )
}
