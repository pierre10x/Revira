/* CONFIGURAÇÃO: preencha com os dados do seu projeto Supabase.
   Use a chave publishable (ou anon antiga). NUNCA coloque service_role/secret aqui. */
window.REVIRA_CONFIG = {
  SUPABASE_URL: 'https://rpiknbfzluuimlwnewjy.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_kqW77igS_qHsPuaS2zjkGA_iZ-wHRAl',
  /* Estado (UF) e cidade que já vêm preenchidos no formulário. O visitante pode trocar. */
  DEFAULT_STATE: 'GO',
  CITY_NAME: 'Campos Belos',
  /* Onde o mapa abre. */
  CITY_CENTER: [-13.0369, -46.7719],
  CITY_ZOOM: 15,
  /* Caixa aproximada do Brasil [[lat mínima, lng mínima], [lat máxima, lng máxima]]: pontos fora dela são recusados.
     Mantenha igual aos valores c_lat_min/c_lat_max/c_lng_min/c_lng_max da função create_report em supabase.sql. */
  COUNTRY_BOUNDS: [[-33.76, -74.00], [5.28, -28.80]],
  /* Anti-spam OPCIONAL (Cloudflare Turnstile). Deixe vazio para não usar.
     Se preencher, publique também a Edge Function "submit-report" (veja o README). */
  TURNSTILE_SITE_KEY: '',
  /* Mapa: tiles do OpenStreetMap (sem chave). Respeite a política de uso: https://operations.osmfoundation.org/policies/tiles/
     Se o site passar a ter muito acesso, troque por um provedor próprio/comercial: basta mudar MAP_TILE_URL e MAP_ATTRIBUTION.
     Atenção: provedores que exigem chave costumam devolver uma IMAGEM de aviso (e não um erro) quando a chave falta,
     então o site não consegue detectar isso sozinho. */
  MAP_TILE_URL: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  MAP_MAX_ZOOM: 19,
  MAP_ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
};
