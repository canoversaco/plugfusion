import React from "react";
import { useCart } from "../cart/CartContext.jsx";

export default function Checkout() {
  const cart = useCart();
  return (
    <div className="max-w-2xl mx-auto px-3 py-4">
      <h1 className="text-xl font-semibold mb-3">Zur Kasse</h1>
      {cart.items.length === 0 ? (
        <div className="text-zinc-400">Dein Warenkorb ist leer.</div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {cart.items.map(it => (
              <div key={it.id} className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800">
                {it.image && <img src={it.image} className="w-12 h-12 rounded-md object-cover" />}
                <div className="flex-1">
                  <div className="font-medium">{it.title}</div>
                  <div className="text-xs text-zinc-400">{it.price.toFixed(2)} € · Menge
                    <input type="number" min="1" value={it.qty}
                      onChange={e=>cart.setQty(it.id, Number(e.target.value))}
                      className="ml-2 w-16 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-sm" />
                  </div>
                </div>
                <button onClick={()=>cart.remove(it.id)} className="text-xs px-2 py-1 rounded bg-rose-700 hover:bg-rose-600">Entfernen</button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 mb-3">
            <div>Zwischensumme</div><div className="font-semibold">{cart.total.toFixed(2)} €</div>
          </div>
          <button onClick={()=>alert("Checkout-Flow an Backend anbinden")}
            className="w-full px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 font-semibold">
            Bestellung abschließen
          </button>
        </>
      )}
    </div>
  );
}
