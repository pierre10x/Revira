/* ReVira — painel administrativo: login, listagem e atualização de status. */
const STATUS_LABELS = { recebida: 'Recebida', em_andamento: 'Em andamento', resolvida: 'Resolvida' };
const CATEGORY_LABELS = {
  buraco: 'Buraco na via', lixo: 'Lixo acumulado', bueiro: 'Bueiro entupido ou aberto',
  luz: 'Iluminação pública', outro: 'Outro problema'
};
const categoryName = key => CATEGORY_LABELS[key] || key;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const truncate = (s, n) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n).trimEnd() + '…' : s; };

document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  let currentUser = null;
  let loaded = [];          // ocorrências carregadas (já filtradas por status/categoria no servidor)
  let searchTimer = null;

  $('menuToggle').onclick = () => document.querySelector('nav').classList.toggle('open');

  if (window.supabaseConfigMissing) {
    $('loginMessage').textContent = 'Configure a URL e a chave pública em js/config.js.';
    $('loginMessage').className = 'alert';
    return;
  }

  /* ---------- Login ---------- */
  async function isAdmin(userId) {
    const { data, error } = await sb.from('admins').select('user_id').eq('user_id', userId).maybeSingle();
    return !error && !!data;
  }

  $('loginForm').onsubmit = async e => {
    e.preventDefault();
    const msg = $('loginMessage');
    msg.className = 'result-box';
    msg.textContent = 'Verificando acesso...';
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email: $('email').value.trim(), password: $('password').value });
      if (error) throw error;
      if (!(await isAdmin(data.user.id))) {
        await sb.auth.signOut();
        msg.textContent = 'Este usuário não foi autorizado como administrador.';
        msg.className = 'alert';
        return;
      }
      currentUser = data.user;
      msg.textContent = '';
      await showDashboard();
    } catch (err) {
      console.error(err);
      msg.textContent = 'Não foi possível entrar. Confira e-mail e senha.';
      msg.className = 'alert';
    }
  };

  async function showDashboard() {
    $('loginView').hidden = true;
    $('dashboard').hidden = false;
    $('welcome').textContent = 'Conectado como ' + (currentUser.email || 'administrador');
    await Promise.all([loadReports(), loadStats()]);
  }

  /* ---------- Estatísticas (totais reais, independentes dos filtros) ---------- */
  async function loadStats() {
    const count = async status => {
      const { count: n, error } = await sb.from('reports').select('protocol', { count: 'exact', head: true }).eq('status', status);
      return error ? 0 : (n || 0);
    };
    const [recebida, andamento, resolvida] = await Promise.all([count('recebida'), count('em_andamento'), count('resolvida')]);
    const cards = [['Total', recebida + andamento + resolvida], ['Recebidas', recebida], ['Em andamento', andamento], ['Resolvidas', resolvida]];
    $('stats').innerHTML = cards.map(([k, v]) => `<div><strong>${v}</strong><span>${k}</span></div>`).join('');
  }

  /* ---------- Listagem ---------- */
  async function loadReports() {
    const body = $('reportsBody');
    body.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';
    let q = sb.from('reports').select('*').order('created_at', { ascending: false }).limit(200);
    if ($('statusFilter').value) q = q.eq('status', $('statusFilter').value);
    if ($('categoryFilter').value) q = q.eq('category', $('categoryFilter').value);
    if ($('stateFilter').value) q = q.eq('state', $('stateFilter').value);
    const { data, error } = await q;
    if (error) {
      console.error(error);
      body.innerHTML = '<tr><td colspan="5">Não foi possível carregar as ocorrências. Entre novamente ou confirme o acesso de administrador.</td></tr>';
      return;
    }
    loaded = data || [];
    renderRows();
  }

  function renderRows() {
    const body = $('reportsBody');
    const term = $('search').value.trim().toLowerCase();
    const rows = term
      ? loaded.filter(r => [r.protocol, r.address, r.city, r.state, r.description].join(' ').toLowerCase().includes(term))
      : loaded;

    body.innerHTML = rows.length ? rows.map(r => `
      <tr>
        <td><b>${esc(r.protocol)}</b></td>
        <td>${esc(categoryName(r.category))}<br><span class="muted">${esc(r.address)}</span><br><span class="muted">${esc(r.city)}${r.city && r.state ? ' / ' : ''}${esc(r.state)}</span></td>
        <td>${esc(truncate(r.description, 130)) || '—'}</td>
        <td>${new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
        <td><select class="status-select" data-protocol="${esc(r.protocol)}" data-current="${esc(r.status)}">
          ${Object.entries(STATUS_LABELS).map(([v, l]) => `<option value="${v}"${r.status === v ? ' selected' : ''}>${l}</option>`).join('')}
        </select></td>
      </tr>`).join('') : '<tr><td colspan="5">Nenhuma ocorrência encontrada.</td></tr>';

    $('tableMessage').textContent = `Exibindo ${rows.length} de ${loaded.length} ocorrência(s) carregada(s) (máximo de 200 mais recentes por consulta).`;
    body.querySelectorAll('select').forEach(sel => { sel.onchange = () => updateStatus(sel); });
  }

  /* ---------- Atualização de status (as datas são definidas pelo banco de dados) ---------- */
  async function updateStatus(sel) {
    sel.disabled = true;
    const { error } = await sb.from('reports').update({ status: sel.value }).eq('protocol', sel.dataset.protocol);
    if (error) {
      console.error(error);
      alert('Não foi possível atualizar o status.');
      sel.value = sel.dataset.current;
      sel.disabled = false;
      return;
    }
    await Promise.all([loadReports(), loadStats()]);
  }

  /* ---------- Eventos ---------- */
  $('refresh').onclick = () => Promise.all([loadReports(), loadStats()]);
  $('statusFilter').onchange = loadReports;
  $('categoryFilter').onchange = loadReports;
  $('stateFilter').onchange = loadReports;
  $('search').oninput = () => { clearTimeout(searchTimer); searchTimer = setTimeout(renderRows, 200); };
  $('logout').onclick = async () => {
    await sb.auth.signOut();
    currentUser = null; loaded = [];
    $('dashboard').hidden = true;
    $('loginView').hidden = false;
  };

  sb.auth.getSession().then(async ({ data }) => {
    if (data.session && (await isAdmin(data.session.user.id))) {
      currentUser = data.session.user;
      showDashboard();
    }
  });
});
