(function(){
  const cfg=window.REVIRA_CONFIG||{};
  if(!window.supabase||!cfg.SUPABASE_URL||cfg.SUPABASE_URL.includes('COLE_AQUI')||!cfg.SUPABASE_ANON_KEY||cfg.SUPABASE_ANON_KEY.includes('COLE_AQUI')){
    window.sb=null; window.supabaseConfigMissing=true; return;
  }
  window.sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
})();
