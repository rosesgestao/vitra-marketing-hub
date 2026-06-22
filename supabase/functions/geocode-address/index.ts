// Edge Function: geocode-address — converte um ENDEREÇO em coordenadas (lat/lng) para o conjunto de
// anúncios "Região do imóvel" (raio ≤ 2 km) no Tráfego Pago. Usa o Nominatim (OpenStreetMap): gratuito,
// sem chave. Server-side (não expõe nada no browser); read-only; mesmo gate das demais edges de IA.
//
// Política do Nominatim: User-Agent identificável + ~1 req/s (uso manual do operador respeita). Enviesa
// para Porto Alegre/RS/Brasil quando o operador não detalha. O operador confere o pino e pode ajustar
// lat/lng manualmente no painel (override) — então pequenas imprecisões não bloqueiam.

import { authorizeAiEdge } from "../_shared/edgeAuth.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-copilot-gate",
  "Content-Type": "application/json",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "metodo nao permitido" }, 405);

  const auth = authorizeAiEdge(req);
  if (!auth.ok) return json({ error: auth.error, message: auth.message }, auth.status);

  let body: any = {};
  try { body = await req.json(); } catch { /* vazio */ }
  const raw = String(body.address || "").trim();
  if (!raw) return json({ error: "missing_address", message: "Informe o endereço do imóvel." }, 400);

  // Enviesa o resultado: se o operador não citou a cidade/UF/país, completa com Porto Alegre/RS/Brasil.
  let query = raw;
  if (!/porto\s*alegre/i.test(query)) query += ", Porto Alegre, RS";
  if (!/bras[ií]l|brazil/i.test(query)) query += ", Brasil";

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&addressdetails=1&q=${encodeURIComponent(query)}`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": "VitraMarketingHub/1.0 (operacional@vitraimobiliaria.com.br)",
        "Accept-Language": "pt-BR",
      },
    });
    if (!r.ok) return json({ error: "geocoder_error", status: r.status, message: "Serviço de geocodificação indisponível. Tente de novo ou informe lat/lng manualmente." }, 502);
    const data = await r.json().catch(() => []);
    const hit = Array.isArray(data) && data[0];
    if (!hit) {
      return json({ ok: true, found: false, message: "Endereço não encontrado. Refine (rua + número + bairro) ou ajuste o pino/coordenadas manualmente.", query });
    }
    const lat = Number(hit.lat), lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return json({ ok: true, found: false, message: "Coordenadas inválidas no resultado. Ajuste manualmente.", query });
    }
    return json({ ok: true, found: true, lat, lng, label: hit.display_name || raw, type: hit.type || null, query });
  } catch (e) {
    return json({ error: "exception", message: String((e as Error)?.message || e) }, 500);
  }
});
