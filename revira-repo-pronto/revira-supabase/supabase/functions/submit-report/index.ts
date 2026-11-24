// Edge Function OPCIONAL: valida o desafio Cloudflare Turnstile e só então cria a ocorrência.
// Deploy:  supabase functions deploy submit-report --no-verify-jwt
// Segredo: supabase secrets set TURNSTILE_SECRET=<chave secreta do Turnstile>
// (opcional) supabase secrets set ALLOWED_ORIGIN=https://seu-dominio.gov.br
// Depois, no supabase.sql, descomente o bloco "OPCIONAL (modo Turnstile)" para que
// somente esta função (service_role) consiga chamar create_report.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*';
const cors = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'invalid_json' }, 400); }

  const ip = (req.headers.get('cf-connecting-ip')
    ?? req.headers.get('x-forwarded-for')?.split(',')[0]
    ?? '').trim();

  // 1) Verifica o desafio no Cloudflare.
  const secret = Deno.env.get('TURNSTILE_SECRET');
  if (!secret) return json({ error: 'server_misconfigured' }, 500);
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', String(body.turnstile_token ?? ''));
  if (ip) form.append('remoteip', ip);
  const check = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
    .then((r) => r.json()).catch(() => ({ success: false }));
  if (!check.success) return json({ error: 'captcha_failed' }, 400);

  // 2) Cria a ocorrência. O IP real segue no cabeçalho x-client-ip (confiável só para service_role).
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    global: { headers: { 'x-client-ip': ip } },
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc('create_report', {
    p_category: body.p_category,
    p_description: body.p_description,
    p_address: body.p_address,
    p_lat: body.p_lat ?? null,
    p_lng: body.p_lng ?? null,
    p_photo_path: body.p_photo_path ?? null,
    p_website: body.p_website ?? '',
    p_state: body.p_state ?? null,
    p_city: body.p_city ?? null,
  });
  if (error) {
    const code = error.message || 'send_failed';
    return json({ error: code }, code === 'rate_limit' ? 429 : 400);
  }
  return json({ protocol: data });
});
