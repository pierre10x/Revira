-- REVIRA | Execute tudo no SQL Editor do Supabase.
-- O script é idempotente: pode ser executado de novo em um projeto já existente (atualização v6 ou v7).
-- Depois de criar um usuário em Authentication > Users, torne-o administrador
-- usando o comando indicado no README (não habilite cadastro público de admins).

-- =====================================================================
-- 1. Administradores
-- =====================================================================
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_revira_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()); $$;
revoke all on function public.is_revira_admin() from public;
grant execute on function public.is_revira_admin() to authenticated;

-- =====================================================================
-- 2. Ocorrências e histórico
-- =====================================================================
create table if not exists public.reports (
  protocol text primary key check (protocol ~ '^RV-[A-Z0-9-]+$'),
  category text not null check (category in ('buraco','lixo','bueiro','luz','outro')),
  department text not null,
  description text not null default '' check (char_length(description) <= 1000),
  address text not null default '' check (char_length(address) <= 300),
  lat double precision,
  lng double precision,
  photo_path text,
  status text not null default 'recebida' check (status in ('recebida','em_andamento','resolvida')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint valid_coordinates check ((lat is null and lng is null) or (lat between -90 and 90 and lng between -180 and 180)),
  constraint has_details check (description <> '' or photo_path is not null),
  constraint has_location check (address <> '' or (lat is not null and lng is not null))
);
create index if not exists reports_created_at_idx on public.reports(created_at desc);
create index if not exists reports_status_idx on public.reports(status);
create index if not exists reports_category_idx on public.reports(category);

-- v7: estado (UF) e cidade em cada ocorrência.
-- As ocorrências que já existem foram registradas quando o site só aceitava Campos Belos-GO,
-- por isso recebem esses valores. O "default" só preenche as linhas antigas (sem UPDATE, então
-- updated_at não muda) e é removido em seguida: a função create_report passa a informar sempre.
alter table public.reports add column if not exists state text not null default 'GO';
alter table public.reports add column if not exists city  text not null default 'Campos Belos';
alter table public.reports alter column state drop default;
alter table public.reports alter column city  drop default;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.reports'::regclass and conname = 'reports_state_check') then
    alter table public.reports add constraint reports_state_check check (state in
      ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.reports'::regclass and conname = 'reports_city_check') then
    alter table public.reports add constraint reports_city_check check (char_length(city) between 2 and 80);
  end if;
end $$;
create index if not exists reports_state_city_idx on public.reports(state, city);
-- Cada foto pertence a uma única ocorrência.
create unique index if not exists reports_photo_path_uidx on public.reports(photo_path) where photo_path is not null;

create table if not exists public.status_history (
  id bigint generated always as identity primary key,
  protocol text not null references public.reports(protocol) on delete cascade,
  status text not null check (status in ('recebida','em_andamento','resolvida')),
  note text not null default '',
  author text not null default 'Sistema',
  created_at timestamptz not null default now()
);
create index if not exists status_history_protocol_idx on public.status_history(protocol, created_at);

-- Controle de abuso: guarda apenas um hash do IP, por no máximo 2 dias (apagado automaticamente).
create table if not exists public.report_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists report_attempts_ip_idx on public.report_attempts(ip_hash, created_at);
create index if not exists report_attempts_created_idx on public.report_attempts(created_at);

alter table public.admins enable row level security;
alter table public.reports enable row level security;
alter table public.status_history enable row level security;
alter table public.report_attempts enable row level security; -- sem políticas: ninguém acessa pela API

-- =====================================================================
-- 3. Políticas de acesso (RLS)
-- =====================================================================
drop policy if exists "Admins read own admin record" on public.admins;
create policy "Admins read own admin record" on public.admins for select to authenticated using (user_id = auth.uid());

-- v6: o envio de ocorrências passa SOMENTE pela função create_report (seção 5).
-- O insert direto na tabela deixa de existir para visitantes.
drop policy if exists "Anyone can submit a report" on public.reports;
revoke insert, update, delete on public.reports from anon;
revoke insert, delete on public.reports from authenticated;
revoke all on public.report_attempts from anon, authenticated;

drop policy if exists "Admins read reports" on public.reports;
create policy "Admins read reports" on public.reports for select to authenticated using (public.is_revira_admin());
drop policy if exists "Admins update reports" on public.reports;
create policy "Admins update reports" on public.reports for update to authenticated using (public.is_revira_admin()) with check (public.is_revira_admin());
drop policy if exists "Admins read status history" on public.status_history;
create policy "Admins read status history" on public.status_history for select to authenticated using (public.is_revira_admin());

-- =====================================================================
-- 4. Triggers
-- =====================================================================
-- Datas controladas pelo banco (o painel não envia mais updated_at/resolved_at).
create or replace function public.set_report_timestamps()
returns trigger language plpgsql
as $$
begin
  new.protocol   := old.protocol;
  new.created_at := old.created_at;
  new.updated_at := now();
  if new.status = 'resolvida' then
    new.resolved_at := case when old.status = 'resolvida' then coalesce(old.resolved_at, now()) else now() end;
  else
    new.resolved_at := null;
  end if;
  return new;
end; $$;
drop trigger if exists report_timestamps on public.reports;
create trigger report_timestamps before update on public.reports
for each row execute function public.set_report_timestamps();

-- Registra automaticamente o histórico na criação e em cada mudança de status.
create or replace function public.record_report_status()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.status_history(protocol,status,note,author) values(new.protocol,new.status,'Ocorrência registrada.','Sistema');
  elsif new.status is distinct from old.status then
    insert into public.status_history(protocol,status,note,author)
    values(new.protocol,new.status,'Status atualizado no painel.','Equipe ReVira');
  end if;
  return new;
end; $$;
drop trigger if exists report_status_history on public.reports;
create trigger report_status_history after insert or update of status on public.reports
for each row execute function public.record_report_status();

-- =====================================================================
-- 5. Envio de ocorrências (protocolo, validações e limite de envios no servidor)
-- =====================================================================
-- Erros devolvidos (message): spam_detected, invalid_category, description_too_long,
-- address_too_long, details_required, location_required, invalid_location,
-- outside_country, invalid_state, city_required, city_too_long, invalid_photo, rate_limit.

-- v7: a assinatura mudou (novos parâmetros p_state e p_city). Remove a versão antiga para que
-- não fiquem duas funções com o mesmo nome (o PostgREST não saberia qual chamar).
drop function if exists public.create_report(text, text, text, double precision, double precision, text, text);

create or replace function public.create_report(
  p_category    text,
  p_description text,
  p_address     text,
  p_lat         double precision default null,
  p_lng         double precision default null,
  p_photo_path  text default null,
  p_website     text default '',         -- campo isca (honeypot): deve vir vazio
  p_state       text default null,       -- UF (ex.: 'GO'). Se vier nulo, usa c_default_state
  p_city        text default null        -- cidade. Se vier nula, usa c_default_city
) returns text
language plpgsql security definer set search_path = public
as $$
declare
  -- Caixa geográfica aproximada do Brasil (inclui ilhas oceânicas). Barra pontos claramente fora do país;
  -- por ser uma caixa, ainda inclui trechos de países vizinhos.
  c_lat_min constant double precision := -33.76;
  c_lat_max constant double precision := 5.28;
  c_lng_min constant double precision := -74.00;
  c_lng_max constant double precision := -28.80;
  -- Valores usados quando um navegador com a versão antiga do site (sem estado/cidade) envia a ocorrência.
  c_default_state constant text := 'GO';
  c_default_city  constant text := 'Campos Belos';
  c_states constant text[] := array['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
  -- Limites por IP (generosos: várias pessoas podem compartilhar o mesmo IP de operadora).
  c_max_per_hour constant int := 15;
  c_max_per_day  constant int := 60;

  v_dept     text;
  v_desc     text := btrim(coalesce(p_description, ''));
  v_addr     text := btrim(coalesce(p_address, ''));
  v_state    text := upper(btrim(coalesce(p_state, c_default_state)));
  v_city     text := regexp_replace(btrim(coalesce(p_city, c_default_city)), '\s+', ' ', 'g');
  v_protocol text;
  v_headers  json;
  v_claims   json;
  v_ip       text;
  v_hash     text;
  v_tries    int := 0;
begin
  if coalesce(p_website, '') <> '' then raise exception 'spam_detected'; end if;

  v_dept := case p_category
    when 'buraco' then 'Secretaria de Obras'
    when 'lixo'   then 'Limpeza Urbana e Coleta'
    when 'bueiro' then 'Drenagem e Saneamento'
    when 'luz'    then 'Serviços Urbanos'
    when 'outro'  then 'Ouvidoria da prefeitura'
    else null end;
  if v_dept is null then raise exception 'invalid_category'; end if;

  if not (v_state = any (c_states)) then raise exception 'invalid_state'; end if;
  if v_city = '' or char_length(v_city) < 2 then raise exception 'city_required'; end if;
  if char_length(v_city) > 80 then raise exception 'city_too_long'; end if;

  if char_length(v_desc) > 1000 then raise exception 'description_too_long'; end if;
  if char_length(v_addr) > 300  then raise exception 'address_too_long'; end if;

  if p_photo_path is not null and p_photo_path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$' then
    raise exception 'invalid_photo';
  end if;
  if v_desc = '' and p_photo_path is null then raise exception 'details_required'; end if;

  if (p_lat is null) <> (p_lng is null) then raise exception 'invalid_location'; end if;
  if p_lat is not null then
    if p_lat not between c_lat_min and c_lat_max or p_lng not between c_lng_min and c_lng_max then
      raise exception 'outside_country';
    end if;
  end if;
  if v_addr = '' and p_lat is null then raise exception 'location_required'; end if;

  -- Limite de envios por IP. Só confiamos em x-client-ip quando a chamada vem da Edge Function (service_role).
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::json;
    v_claims  := nullif(current_setting('request.jwt.claims', true), '')::json;
  exception when others then
    v_headers := null; v_claims := null;
  end;
  v_ip := nullif(btrim(coalesce(
    case when v_claims->>'role' = 'service_role' then v_headers->>'x-client-ip' end,
    v_headers->>'cf-connecting-ip',
    v_headers->>'x-real-ip',
    split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1),
    '')), '');
  -- Sem IP identificável, não limitamos (evita que todos os visitantes dividam o mesmo contador).
  if v_ip is not null then
    v_hash := md5(v_ip || ':revira');
    delete from public.report_attempts where created_at < now() - interval '2 days';
    if (select count(*) from public.report_attempts where ip_hash = v_hash and created_at > now() - interval '1 hour') >= c_max_per_hour
       or (select count(*) from public.report_attempts where ip_hash = v_hash and created_at > now() - interval '1 day') >= c_max_per_day then
      raise exception 'rate_limit';
    end if;
  end if;

  -- Protocolo gerado aqui: RV-AAAAMMDD-XXXXXX (6 caracteres hexadecimais aleatórios).
  loop
    v_protocol := 'RV-' || to_char(now() at time zone 'America/Sao_Paulo', 'YYYYMMDD') || '-'
                  || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    begin
      insert into public.reports(protocol, category, department, description, address, state, city, lat, lng, photo_path, status)
      values (v_protocol, p_category, v_dept, v_desc, v_addr, v_state, v_city, p_lat, p_lng, p_photo_path, 'recebida');
      exit;
    exception when unique_violation then
      v_tries := v_tries + 1;
      if v_tries >= 5 then raise; end if;
    end;
  end loop;

  if v_hash is not null then insert into public.report_attempts(ip_hash) values (v_hash); end if;
  return v_protocol;
end; $$;

revoke all on function public.create_report(text, text, text, double precision, double precision, text, text, text, text) from public;
grant execute on function public.create_report(text, text, text, double precision, double precision, text, text, text, text) to anon, authenticated;

-- OPCIONAL (modo Turnstile): depois de publicar a Edge Function "submit-report" (ver README),
-- descomente as duas linhas abaixo para que SOMENTE ela possa criar ocorrências:
-- revoke execute on function public.create_report(text, text, text, double precision, double precision, text, text, text, text) from anon, authenticated;
-- grant  execute on function public.create_report(text, text, text, double precision, double precision, text, text, text, text) to service_role;

-- =====================================================================
-- 6. Consulta pública por protocolo (não retorna descrição, endereço, coordenadas ou fotos)
-- =====================================================================
-- v7: devolve também a chave da categoria ("category"), para o site traduzir o nome no idioma
-- escolhido. category_name continua em português. Como o formato do retorno mudou, a função
-- antiga precisa ser removida antes de recriar.
drop function if exists public.track_report(text);
create function public.track_report(p_protocol text)
returns table(protocol text, category text, category_name text, department text, status text, created_at timestamptz, updated_at timestamptz, history jsonb)
language sql stable security definer set search_path = public
as $$
  select r.protocol, r.category,
    case r.category when 'buraco' then 'Buraco na via' when 'lixo' then 'Lixo acumulado'
      when 'bueiro' then 'Bueiro entupido ou aberto' when 'luz' then 'Iluminação pública' else 'Outro problema' end,
    r.department, r.status, r.created_at, r.updated_at,
    coalesce((select jsonb_agg(jsonb_build_object('status',h.status,'note',h.note,'created_at',h.created_at) order by h.created_at)
      from public.status_history h where h.protocol = r.protocol), '[]'::jsonb)
  from public.reports r where upper(r.protocol) = upper(trim(p_protocol)) limit 1;
$$;
revoke all on function public.track_report(text) from public;
grant execute on function public.track_report(text) to anon, authenticated;

-- =====================================================================
-- 7. Fotos (bucket privado)
-- =====================================================================
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('report-photos','report-photos',false,6291456,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=6291456,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

-- v6: só é possível enviar um arquivo cujo nome já foi registrado por create_report.
create or replace function public.photo_is_registered(p_name text)
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.reports where photo_path = p_name); $$;
revoke all on function public.photo_is_registered(text) from public;
grant execute on function public.photo_is_registered(text) to anon, authenticated;

drop policy if exists "Public can upload report photos" on storage.objects;
create policy "Public can upload report photos" on storage.objects for insert to anon, authenticated
with check (bucket_id = 'report-photos' and public.photo_is_registered(name));
drop policy if exists "Admins can view report photos" on storage.objects;
create policy "Admins can view report photos" on storage.objects for select to authenticated
using (bucket_id = 'report-photos' and public.is_revira_admin());

-- Faz a API do Supabase enxergar de imediato as funções recriadas (create_report e track_report).
notify pgrst, 'reload schema';
