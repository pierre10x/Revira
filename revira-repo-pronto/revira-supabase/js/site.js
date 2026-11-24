/* ReVira — página inicial: formulário de ocorrência, mapa, foto e envio. */
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const cfg = window.REVIRA_CONFIG || {};

  const T = (key, vars) => (window.reviraI18n ? window.reviraI18n.t(key, vars) : key);

  $('year').textContent = new Date().getFullYear();
  $('menuToggle').addEventListener('click', () => document.querySelector('nav').classList.toggle('open'));
  $('description').addEventListener('input', () => { $('charCount').textContent = $('description').value.length; });

  /* ---------- Estado (UF) e cidade ---------- */
  const STATES = [
    ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'], ['CE', 'Ceará'],
    ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'], ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'],
    ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
    ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
    ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'],
    ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins']
  ];
  const defaultState = STATES.some(([uf]) => uf === cfg.DEFAULT_STATE) ? cfg.DEFAULT_STATE : 'GO';
  const defaultCity = cfg.CITY_NAME || '';
  // defaultSelected/defaultValue fazem o reset() do formulário voltar ao estado e à cidade padrão.
  STATES.forEach(([uf, name]) => $('state').add(new Option(`${uf} — ${name}`, uf, uf === defaultState, uf === defaultState)));
  $('city').defaultValue = defaultCity;
  $('city').value = defaultCity;

  /* ---------- Limites do Brasil (mesmos valores de create_report no SQL) ---------- */
  const bounds = Array.isArray(cfg.COUNTRY_BOUNDS) && cfg.COUNTRY_BOUNDS.length === 2
    ? cfg.COUNTRY_BOUNDS : [[-33.76, -74.00], [5.28, -28.80]];
  const insideCountry = (lat, lng) =>
    lat >= bounds[0][0] && lat <= bounds[1][0] && lng >= bounds[0][1] && lng <= bounds[1][1];

  /* ---------- Mapa e localização ---------- */
  const defaultCenter = Array.isArray(cfg.CITY_CENTER) && cfg.CITY_CENTER.length === 2 ? cfg.CITY_CENTER : [-13.0369, -46.7719];
  const defaultZoom = Number(cfg.CITY_ZOOM) || 15;
  let map = null, marker = null;

  /* O texto de status da localização é guardado como {chave, coordenadas} para ser reescrito ao trocar de idioma. */
  let locStatus = { key: 'loc.none', coords: null };
  function renderLocStatus() {
    const { key, coords } = locStatus;
    $('locationStatus').textContent = coords ? `${T(key)} (${coords.la}, ${coords.ln}) ✓` : T(key);
  }
  function setLocStatus(key, coords) { locStatus = { key, coords: coords || null }; renderLocStatus(); }
  renderLocStatus();

  function setCoordinates(lat, lng, sourceLabel, panToPoint) {
    lat = Number(lat); lng = Number(lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !insideCountry(lat, lng)) {
      setLocStatus('loc.outside');
      // Se o marcador foi arrastado para fora, ele volta ao último ponto válido.
      if (marker && $('lat').value) marker.setLatLng([Number($('lat').value), Number($('lng').value)]);
      return false;
    }
    const la = lat.toFixed(6), ln = lng.toFixed(6);
    $('lat').value = la; $('lng').value = ln;
    setLocStatus(sourceLabel, { la, ln });
    if ($('clearLocation')) $('clearLocation').hidden = false;
    if (map && window.L) {
      if (!marker) {
        marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        marker.on('dragend', () => { const p = marker.getLatLng(); setCoordinates(p.lat, p.lng, 'loc.adjusted', false); });
      } else {
        marker.setLatLng([lat, lng]);
      }
      if (panToPoint) map.setView([lat, lng], Math.max(map.getZoom(), 17));
    }
    return true;
  }

  function clearCoordinates() {
    $('lat').value = ''; $('lng').value = '';
    setLocStatus('loc.none');
    if ($('clearLocation')) $('clearLocation').hidden = true;
    if (map && marker) { map.removeLayer(marker); marker = null; }
    if (map) map.setView(defaultCenter, defaultZoom);
  }

  const mapEl = $('locationMap');

  /* Aviso visível quando o mapa não carrega (em vez de sumir ou ficar cinza sem explicação).
     Guardamos a chave da mensagem para reescrevê-la ao trocar de idioma. */
  let mapNoticeKeys = null;
  const noticeText = () => mapNoticeKeys.map(k => T(k)).join('');
  function showMapNotice(...keys) {
    if (!mapEl) return;
    let n = $('mapNotice');
    if (!n) {
      n = document.createElement('p');
      n.id = 'mapNotice';
      n.className = 'map-notice';
      n.setAttribute('role', 'status');
      mapEl.parentNode.insertBefore(n, mapEl.nextSibling);
    }
    mapNoticeKeys = keys;
    n.textContent = noticeText();
    n.hidden = false;
  }
  const hideMapNotice = () => { const n = $('mapNotice'); if (n) n.hidden = true; mapNoticeKeys = null; };
  const fileKeys = location.protocol === 'file:' ? ['map.file'] : [];

  if (mapEl && window.L) {
    map = L.map(mapEl).setView(defaultCenter, defaultZoom);
    const tileUrl = cfg.MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileAttr = cfg.MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
    const MAX_TILE_ERRORS = 4;   // um bloco isolado com erro não gera aviso

    const layer = L.tileLayer(tileUrl, { maxZoom: Number(cfg.MAP_MAX_ZOOM) || 19, attribution: tileAttr }).addTo(map);
    let errors = 0, loaded = false;
    layer.on('tileload', () => { loaded = true; hideMapNotice(); });
    layer.on('tileerror', () => {
      errors += 1;
      if (!loaded && errors >= MAX_TILE_ERRORS) showMapNotice('map.tiles', ...fileKeys, 'map.fallback');
    });

    map.on('click', e => setCoordinates(e.latlng.lat, e.latlng.lng, 'loc.marked', false));

    // O mapa é criado antes de fontes/imagens terminarem de carregar: recalcula o tamanho sempre que o quadro mudar.
    const refresh = () => map.invalidateSize();
    setTimeout(refresh, 250);
    window.addEventListener('load', refresh);
    window.addEventListener('resize', refresh);
    if (window.ResizeObserver) new ResizeObserver(refresh).observe(mapEl);
  } else if (mapEl) {
    mapEl.style.display = 'none';
    showMapNotice('map.nolib', ...fileKeys, 'map.fallback');
  }

  if ($('clearLocation')) $('clearLocation').addEventListener('click', clearCoordinates);

  $('getLocation').addEventListener('click', () => {
    if (!navigator.geolocation) { setLocStatus('loc.nogeo'); return; }
    setLocStatus('loc.getting');
    navigator.geolocation.getCurrentPosition(
      p => { setCoordinates(p.coords.latitude, p.coords.longitude, 'loc.gps', true); },
      () => { setLocStatus('loc.fail'); },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  });

  /* ---------- Foto: reduz e remove metadados (EXIF/GPS) antes de enviar ---------- */
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_INPUT_BYTES = 25 * 1024 * 1024;   // foto original aceita no seletor
  const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;   // limite do bucket no Supabase
  const MAX_SIDE = 1600;

  const toBlob = (canvas, type, quality) => new Promise(resolve => canvas.toBlob(resolve, type, quality));

  async function loadBitmap(file) {
    if (window.createImageBitmap) {
      try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { /* tenta o método antigo */ }
    }
    return await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image_decode')); };
      img.src = url;
    });
  }

  async function prepareImage(file) {
    const bmp = await loadBitmap(file);
    const w0 = bmp.width, h0 = bmp.height;
    const scale = Math.min(1, MAX_SIDE / Math.max(w0, h0));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w0 * scale));
    canvas.height = Math.max(1, Math.round(h0 * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';                    // fundo branco para PNG com transparência
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    if (bmp.close) bmp.close();
    // O canvas não carrega EXIF: a foto sai sem GPS, câmera ou data.
    for (const [type, ext] of [['image/webp', 'webp'], ['image/jpeg', 'jpg']]) {
      for (const q of [0.82, 0.65, 0.5]) {
        const blob = await toBlob(canvas, type, q);
        if (!blob || blob.type !== type) break;   // navegador sem suporte a esse formato
        if (blob.size <= MAX_UPLOAD_BYTES) return { blob, ext, type };
      }
    }
    throw new Error('image_too_large');
  }

  /* ---------- Turnstile (opcional) ---------- */
  const siteKey = (cfg.TURNSTILE_SITE_KEY || '').trim();
  let turnstileWidget = null;
  if (siteKey) {
    const box = $('turnstileBox');
    if (box) {
      box.hidden = false;
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.onload = () => { turnstileWidget = window.turnstile.render(box, { sitekey: siteKey, language: 'pt-BR' }); };
      document.head.appendChild(s);
    }
  }

  /* ---------- Mensagens de erro (textos em js/i18n.js) ---------- */
  const ERROR_CODES = new Set(['rate_limit', 'outside_country', 'invalid_state', 'city_required', 'city_too_long',
    'invalid_location', 'location_required', 'details_required', 'invalid_category', 'description_too_long',
    'address_too_long', 'invalid_photo', 'spam_detected', 'captcha_failed']);
  const errorKey = err => {
    let code = (err && err.message) || '';
    if (code === 'outside_city') code = 'outside_country';   // código antigo (v6)
    return ERROR_CODES.has(code) ? `err.${code}` : 'err.generic';
  };

  /* ---------- Mensagem do formulário (guardada para ser reescrita ao trocar de idioma) ---------- */
  let formMsg = null;
  function showMessage(m) {
    formMsg = m;
    const msg = $('formMessage');
    msg.className = 'form-message';
    msg.textContent = '';
    if (!m) return;
    if (m.error) { msg.textContent = T(m.error); msg.classList.add('error'); return; }
    // Sucesso: o protocolo entra como texto (nunca como HTML).
    const strong = document.createElement('strong');
    strong.textContent = m.success.protocol;
    const link = document.createElement('a');
    link.href = 'acompanhar.html';
    link.textContent = T('ok.link');
    msg.append(T('ok.before'), strong, T('ok.after') + (m.success.photoWarning ? T('ok.photo') : '') + ' ', link);
    msg.classList.add('success');
  }

  /* ---------- Envio ---------- */
  async function createReport(args) {
    if (siteKey) {
      // Modo Turnstile: o envio passa pela Edge Function, que valida o desafio antes de gravar.
      const token = window.turnstile && turnstileWidget !== null ? window.turnstile.getResponse(turnstileWidget) : '';
      if (!token) throw new Error('captcha_failed');
      const res = await fetch(`${cfg.SUPABASE_URL}/functions/v1/submit-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: cfg.SUPABASE_ANON_KEY, Authorization: `Bearer ${cfg.SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ ...args, turnstile_token: token })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.protocol) throw new Error(body.error || 'send_failed');
      return body.protocol;
    }
    const { data, error } = await sb.rpc('create_report', args);
    if (error) throw error;
    return data;
  }

  $('reportForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('submitBtn'), btnLabel = btn.querySelector('span');
    showMessage(null);

    if (window.supabaseConfigMissing) return showMessage({ error: 'form.cfg' });

    const file = $('photo').files[0];
    if (file && (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_INPUT_BYTES)) {
      return showMessage({ error: 'form.photo.type' });
    }

    btn.disabled = true; btnLabel.textContent = T('form.sending');
    try {
      let photo = null, photoPath = null;
      if (file) {
        try {
          photo = await prepareImage(file);
          photoPath = `${crypto.randomUUID()}.${photo.ext}`;
        } catch (imgErr) {
          console.error(imgErr);
          throw new Error('invalid_photo');
        }
      }

      const protocol = await createReport({
        p_category: $('category').value,
        p_description: $('description').value.trim(),
        p_address: $('address').value.trim(),
        p_state: $('state').value,
        p_city: $('city').value.trim().replace(/\s+/g, ' '),
        p_lat: $('lat').value ? Number($('lat').value) : null,
        p_lng: $('lng').value ? Number($('lng').value) : null,
        p_photo_path: photoPath,
        p_website: $('website') ? $('website').value : ''
      });

      // A ocorrência já está registrada; a foto sobe depois (só aceita o nome registrado no servidor).
      let photoWarning = false;
      if (photo) {
        const up = await sb.storage.from('report-photos').upload(photoPath, photo.blob, { contentType: photo.type, upsert: false });
        if (up.error) { console.error(up.error); photoWarning = true; }
      }

      showMessage({ success: { protocol, photoWarning: !!photoWarning } });
      $('reportForm').reset(); $('charCount').textContent = '0'; clearCoordinates();
    } catch (err) {
      console.error(err);
      showMessage({ error: errorKey(err) });
    } finally {
      if (siteKey && window.turnstile && turnstileWidget !== null) window.turnstile.reset(turnstileWidget);
      btn.disabled = false; btnLabel.textContent = T('form.submit');
    }
  });

  /* ---------- Troca de idioma: reescreve os textos que o JavaScript gerou ---------- */
  document.addEventListener('revira:langchange', () => {
    renderLocStatus();
    if (mapNoticeKeys && $('mapNotice')) $('mapNotice').textContent = noticeText();
    if (formMsg) showMessage(formMsg);
  });
});
