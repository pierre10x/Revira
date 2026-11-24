# ReVira — site com Supabase (v7)

Site estático (página inicial com formulário de ocorrência, consulta de protocolo e painel administrativo) ligado ao Supabase Database, Auth e Storage.

## O que mudou na v7

- **Mapa.** Os blocos da CARTO passaram a responder com uma imagem com a marca d'água "API KEY REQUIRED" (ou seja, o provedor agora cobra uma chave; isso não foi conferido na documentação deles). Como é uma imagem normal e não um erro, o plano B antigo nunca era acionado. O site agora usa os blocos do **OpenStreetMap**, que não exigem chave, com a atribuição visível. Para trocar de provedor mais tarde, mude `MAP_TILE_URL` e `MAP_ATTRIBUTION` em `js/config.js`. Se o site passar a ter muito acesso, siga a [política de uso dos blocos do OSM](https://operations.osmfoundation.org/policies/tiles/) ou contrate um provedor.
- **Estado e cidade.** O formulário tem os campos **Estado (UF)** e **Cidade**, já preenchidos com `GO` e `Campos Belos` (valores de `DEFAULT_STATE` e `CITY_NAME` em `js/config.js`). Os dois são validados no servidor e gravados em `reports.state` e `reports.city`; o painel mostra a cidade/UF de cada ocorrência e ganhou filtro por estado. As ocorrências antigas foram marcadas como `GO` / `Campos Belos`.
- **Localização em todo o Brasil.** O ponto no mapa agora só precisa estar dentro de uma caixa aproximada do Brasil (antes era uma caixa de ~28 km ao redor de Campos Belos). O mapa continua abrindo em Campos Belos. Atenção: o banco **não confere** se o ponto realmente está na cidade informada.
- **Três idiomas.** Seletor **PT / EN / ES** na barra superior (a escolha fica salva no navegador; na primeira visita vale o idioma do navegador). Traduzidos: página inicial, formulário, mapa, mensagens de erro, consulta de protocolo e o painel Aparência. **Continuam só em português:** o painel administrativo e a política de privacidade (a página avisa isso em inglês e espanhol, pois a versão que vale juridicamente é a em português).
- **Consulta de protocolo.** `track_report` agora também devolve a chave da categoria (`category`), para o nome e o setor serem mostrados no idioma escolhido. Observações livres escritas pela equipe aparecem exatamente como foram escritas.

### Atualizando da v6 para a v7

1. Abra o **SQL Editor**, cole todo o novo `supabase.sql` e clique em **Run**. É seguro repetir. Ele adiciona as colunas, **recria** `create_report` (agora com `p_state` e `p_city`) e `track_report`, e remove a versão antiga de `create_report`. Publique os arquivos novos do site **logo em seguida**: o site antigo ainda consegue enviar ocorrências (usa `GO` / `Campos Belos`), mas só o novo mostra os campos.
2. Se você usa o **Turnstile**: publique a Edge Function de novo (`supabase functions deploy submit-report --no-verify-jwt`) e descomente outra vez o bloco "OPCIONAL (modo Turnstile)" do `supabase.sql`, que agora tem a assinatura nova de `create_report`.
3. Em `js/config.js`, `CITY_BOUNDS` foi substituído por `COUNTRY_BOUNDS`, e `MAP_FALLBACK`/CARTO deixaram de existir. Se você tinha personalizações, copie só a URL e a chave do Supabase para o novo arquivo.

## O que mudou na v6

- **Envio seguro no servidor.** O protocolo (`RV-AAAAMMDD-XXXXXX`, 6 caracteres aleatórios), o departamento e as datas agora são definidos pela função `create_report` no banco. O visitante não consegue mais inserir linhas direto na tabela.
- **Anti-spam.** Campo isca (honeypot), limite de envios por IP (15 por hora e 60 por dia, ajustável em `supabase.sql`) e suporte opcional ao Cloudflare Turnstile.
- **Fotos.** São reduzidas (máx. 1600 px, WebP) e saem **sem EXIF/GPS**. O upload acontece depois do registro e só é aceito para o nome de arquivo registrado pelo servidor, então não sobram arquivos soltos no bucket.
- **Localização validada.** Pontos fora de Campos Belos são recusados no navegador e no banco (caixa de ~28 km ao redor da cidade).
- **Painel.** Os cards mostram os totais reais (não mudam com os filtros), a busca é local (sem nova consulta a cada tecla), a descrição longa é cortada corretamente e quem não é administrador recebe uma mensagem clara. `updated_at` e `resolved_at` passaram a ser controlados pelo banco.
- **Mapa mais confiável.** O Leaflet agora vem dentro do projeto (`vendor/leaflet`), sem depender de CDN. Se as imagens do mapa não carregarem, aparece um aviso explicando o motivo em vez de um quadro cinza, e o mapa recalcula o tamanho sozinho quando a página muda de layout.
- **Scripts externos.** `supabase-js` fixado na versão 2.118.0.

### Se você já tinha a v5 funcionando

1. Abra o **SQL Editor**, cole todo o novo `supabase.sql` e clique em **Run**. O script é idempotente: não apaga dados e pode ser executado mais de uma vez.
2. Publique os arquivos novos do site. Não é preciso trocar a URL nem a chave em `js/config.js`.
3. Faça os ajustes da seção **Checklist de segurança** abaixo.

## 1. Criar e configurar o Supabase

1. Entre em https://supabase.com e crie um projeto.
2. No projeto, abra **SQL Editor** > **New query**.
3. Copie todo o conteúdo de `supabase.sql`, cole no editor e clique em **Run**.
4. Abra **Project Settings** > **API** e copie a **Project URL** e a chave pública **publishable** (ou a chave antiga `anon`). Não use `service_role` nem `secret` no site.
5. Preencha `js/config.js` com os dois valores.

## 2. Criar o acesso de administrador

1. No Supabase, abra **Authentication** > **Users** > **Add user** e crie o e-mail e a senha.
2. No **SQL Editor**, execute (trocando pelo e-mail cadastrado):

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'admin@seudominio.com';
```

Só usuários nessa tabela veem e atualizam as ocorrências. Nunca crie uma tela de cadastro público para administradores.

## 3. Checklist de segurança (no painel do Supabase)

- [ ] **Authentication > Sign In / Providers > Email:** desative **"Allow new users to sign up"**. Como a chave pública fica no navegador, sem isso qualquer pessoa poderia criar usuários.
- [ ] **Authentication > MFA:** ative o fator TOTP e use-o nas contas de administrador.
- [ ] **Authentication > URL Configuration:** cadastre o domínio final do site.
- [ ] Confirme que `js/config.js` contém apenas a chave `publishable`/`anon`.

## 4. Abrir o site no computador

Não abra os arquivos com duplo clique (`file://`): os servidores de mapa (inclusive o do OpenStreetMap) recusam pedidos que não vêm de um site com endereço, e o navegador restringe alguns recursos. No VS Code, instale a extensão **Live Server**, clique com o botão direito em `index.html` e escolha **Open with Live Server**. Sem VS Code, rode `python -m http.server` dentro da pasta e abra http://localhost:8000. Para testar, registre uma ocorrência, copie o protocolo e abra `acompanhar.html`. O painel fica em `painel.html`.

## 5. Anti-spam com Cloudflare Turnstile (opcional, recomendado antes de divulgar)

O limite por IP já protege contra abuso simples. O Turnstile adiciona uma verificação "não sou um robô" gratuita. Ele exige a Supabase CLI (`npm i -g supabase`).

1. Em https://dash.cloudflare.com > **Turnstile**, crie um widget para o seu domínio. Guarde a **Site Key** e a **Secret Key**.
2. Publique a Edge Function (dentro da pasta do projeto, já vinculada ao seu projeto com `supabase link`):

```bash
supabase secrets set TURNSTILE_SECRET=SUA_SECRET_KEY
supabase secrets set ALLOWED_ORIGIN=https://seu-dominio.gov.br   # opcional
supabase functions deploy submit-report --no-verify-jwt
```

3. Preencha `TURNSTILE_SITE_KEY` em `js/config.js`. O site passa a enviar as ocorrências pela função.
4. No `supabase.sql`, descomente o bloco **"OPCIONAL (modo Turnstile)"** e execute-o. Assim só a Edge Function consegue criar ocorrências.

> A Edge Function foi escrita seguindo a documentação do Supabase e do Cloudflare, mas **não foi executada em um projeto real**. Teste um envio completo depois do deploy.

## 6. Ajustes comuns

- **Limites geográficos (Brasil):** `COUNTRY_BOUNDS` em `js/config.js` e `c_lat_min`/`c_lat_max`/`c_lng_min`/`c_lng_max` em `create_report` (`supabase.sql`). Mantenha os dois iguais.
- **Estado e cidade padrão:** `DEFAULT_STATE` e `CITY_NAME` em `js/config.js` (valor inicial do formulário e centro do mapa em `CITY_CENTER`). Para ocorrências enviadas por um site antigo, o banco usa `c_default_state`/`c_default_city` em `create_report`.
- **Idiomas:** todos os textos traduzidos ficam em `js/i18n.js`. Para mudar um texto em inglês ou espanhol, edite lá; o texto em português fica no próprio HTML (e, para mensagens geradas pelo JavaScript, no bloco `pt` do `i18n.js`). Um idioma novo exige acrescentar o código em `LANGS`, `LOCALES` e `FULL` e um bloco de tradução.
- **Limite de envios:** `c_max_per_hour` e `c_max_per_day` em `create_report`. Em cidades pequenas muitas pessoas compartilham o mesmo IP de operadora móvel, por isso os valores são generosos.
- **Categorias e secretarias:** o `case` em `create_report` e `track_report` (`supabase.sql`), `CATEGORY_LABELS` em `js/admin.js`, o `<select>` em `index.html` e as chaves `cat.*` / `dept.*` em `js/i18n.js` (e a lista de categorias em `js/track.js`).

## Arquivos

- `index.html`: página inicial e formulário.
- `acompanhar.html`: consulta pública por protocolo.
- `painel.html`: login e painel de administração.
- `privacidade.html`: política de privacidade (LGPD).
- `css/style.css`: estilos responsivos e temas.
- `js/config.js`: URL, chave pública, estado/cidade padrão, limites do Brasil, mapa e chave do Turnstile.
- `js/i18n.js`: seletor de idioma (PT/EN/ES) e todas as traduções.
- `js/site.js`: estado/cidade, mapa, compressão da foto e envio.
- `js/track.js`: consulta do protocolo.
- `js/admin.js`: autenticação e gestão das ocorrências.
- `js/theme.js`: tema, cor, tamanho do texto e animações (Aparência).
- `vendor/leaflet/`: biblioteca do mapa (Leaflet 1.9.4, licença BSD-2).
- `supabase.sql`: tabelas, regras de acesso (RLS), funções `create_report` e `track_report`, triggers e bucket de fotos.
- `supabase/functions/submit-report/index.ts`: Edge Function opcional do Turnstile.

## Segurança e observações

- A chave `publishable`/`anon` é própria para uso no navegador; a segurança depende das políticas RLS e das funções do `supabase.sql`.
- Nunca coloque chave `service_role`/`secret` no `config.js`, HTML, JavaScript ou repositório público.
- A consulta por protocolo mostra apenas categoria, setor, status e histórico: não revela endereço, descrição, coordenadas ou fotos.
- As fotos ficam em bucket privado; somente administradores podem lê-las.
- Para controle de abuso guardamos só um hash do IP por até 2 dias (tabela `report_attempts`, apagada automaticamente). A `privacidade.html` já descreve isso.
- O `supabase-js` está com versão fixa, mas sem SRI: confira o hash com o CDN antes de adicioná-lo, pois um hash errado bloquearia o site. Se preferir não depender do CDN, copie o arquivo `dist/umd/supabase.js` do pacote npm para `vendor/` e aponte os HTMLs para ele.
- O painel carrega até 200 registros por consulta. Não há envio de e-mail automático, mapa de ocorrências no painel nem exibição das fotos no painel nesta versão.
