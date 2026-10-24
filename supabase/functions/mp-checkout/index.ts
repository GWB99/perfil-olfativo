// Cria a preferência do Mercado Pago (Checkout Pro) para um pedido já registrado por place_order.
// Deploy:  supabase functions deploy mp-checkout
// Segredos: supabase secrets set MP_ACCESS_TOKEN=TEST-xxxx   (use o token de TESTE primeiro)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { order_id, back_url } = await req.json();
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    // RLS garante que o usuário só enxerga o próprio pedido
    const { data: order, error } = await userClient.from("orders").select("*").eq("id", order_id).single();
    if (error || !order) return new Response(JSON.stringify({ error: "Pedido não encontrado" }), { status: 404, headers: cors });
    if (order.status !== "aguardando_pagamento") return new Response(JSON.stringify({ error: "Pedido já processado" }), { status: 400, headers: cors });

    const items = (order.items as any[]).map((i) => ({ id: i.id, title: `${i.name} · ${i.house}`, quantity: i.qty, unit_price: Number(i.price), currency_id: "BRL" }));
    if (Number(order.shipping) > 0) items.push({ id: "frete", title: "Frete", quantity: 1, unit_price: Number(order.shipping), currency_id: "BRL" });

    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        external_reference: order.id,
        back_urls: { success: `${back_url}#perfil`, pending: `${back_url}#perfil`, failure: `${back_url}#carrinho` },
        auto_return: "approved",
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`
      })
    });
    const pref = await r.json();
    if (!r.ok) return new Response(JSON.stringify({ error: pref }), { status: 502, headers: cors });
    return new Response(JSON.stringify({ init_point: pref.init_point, sandbox_init_point: pref.sandbox_init_point }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
