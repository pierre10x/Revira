/* ReVira — consulta pública de protocolo. */
const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const T = (key, vars) => (window.reviraI18n ? window.reviraI18n.t(key, vars) : key);
  const locale = () => (window.reviraI18n ? window.reviraI18n.locale() : 'pt-BR');
  const formatDate = d => new Date(d).toLocaleString(locale());

  // O banco guarda estas duas observações em português; aqui elas são traduzidas. Outras notas aparecem como foram escritas.
  const KNOWN_NOTES = { 'Ocorrência registrada.': 'note.registered', 'Status atualizado no painel.': 'note.updated' };
  const hasKey = (prefix, value) => ['buraco', 'lixo', 'bueiro', 'luz', 'outro'].includes(value) ? `${prefix}.${value}` : null;
  const statusLabel = st => ['recebida', 'em_andamento', 'resolvida'].includes(st) ? T(`status.${st}`) : escapeHtml(st);

  $('menuToggle').onclick = () => document.querySelector('nav').classList.toggle('open');

  // Último conteúdo exibido: guardado para ser redesenhado quando o idioma mudar.
  let view = null;   // { text: 'chave' } ou { report: {...} }

  function render() {
    const box = $('result');
    if (!view) { box.textContent = ''; return; }
    if (view.text) { box.textContent = T(view.text); return; }
    const r = view.report;
    const catKey = hasKey('cat', r.category), deptKey = hasKey('dept', r.category);
    const category = catKey ? T(catKey) : r.category_name;       // category vem do servidor v7; category_name serve de reserva
    const department = deptKey ? T(deptKey) : r.department;
    const history = (r.history || []).map(h => {
      const noteKey = KNOWN_NOTES[h.note];
      const note = noteKey ? T(noteKey) : (h.note || T('note.default'));
      return `
        <div class="history-item"><b>${statusLabel(h.status)}</b>
        <small>${formatDate(h.created_at)} · ${escapeHtml(note)}</small></div>`;
    }).join('');
    box.innerHTML = `
      <div class="protocol">${escapeHtml(r.protocol)}</div>
      <p><span class="status-pill">${statusLabel(r.status)}</span></p>
      <p><b>${escapeHtml(category)}</b><br><span class="muted">${escapeHtml(department)}</span></p>
      <p class="muted">${escapeHtml(T('trk.registered'))} ${formatDate(r.created_at)}</p>
      <h3 style="font:700 14px Manrope;color:var(--heading)">${escapeHtml(T('trk.history'))}</h3>
      <div class="history">${history}</div>`;
  }
  const show = v => { view = v; render(); };
  document.addEventListener('revira:langchange', render);

  $('trackForm').onsubmit = async e => {
    e.preventDefault();
    show({ text: 'trk.checking' });
    if (window.supabaseConfigMissing) return show({ text: 'trk.cfg' });
    try {
      const { data, error } = await sb.rpc('track_report', { p_protocol: $('protocol').value.trim().toUpperCase() });
      if (error) throw error;
      if (!data || !data.length) return show({ text: 'trk.notfound' });
      show({ report: data[0] });
    } catch (err) {
      console.error(err);
      show({ text: 'trk.error' });
    }
  };
});
