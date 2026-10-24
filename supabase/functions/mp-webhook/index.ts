// Recebe o aviso do Mercado Pago e marca o pedido como pago.
// Deploy:  supabase functions deploy mp-webhook --no-verify-jwt
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  let id = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  let type = url.searchParams.get("type") ?? url.searchParams.get("topic");
  try { const b = await req.json(); id ??= b?.data?.id; type ??= b?.type; } catch (_) { /* sem corpo */ }
  if (type !== "payment" || !id) return new Response("ignorado", { status: 200 });

  // Confere o pagamento direto na API (não confia no corpo do aviso)
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: { Authorization: `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}` } });
  if (!r.ok) return new Response("erro ao consultar", { status: 502 });
  const pay = await r.json();

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: order } = await admin.from("orders").select("total").eq("id", pay.external_reference ?? "").maybeSingle();
  if (!order) return new Response("pedido não encontrado", { status: 200 });
  let status = pay.status === "approved" ? "pago" : (pay.status === "rejected" || pay.status === "cancelled") ? "cancelado" : null;
  if (status === "pago" && Number(pay.transaction_amount) + 0.01 < Number(order.total)) status = null; // valor não confere
  if (status && pay.external_reference) {
    await admin.from("orders").update({ status, payment_provider: "mercadopago", payment_id: String(pay.id) })
      .eq("id", pay.external_reference).eq("status", "aguardando_pagamento");
  }
  return new Response("ok", { status: 200 });
});
