(() => {
  'use strict';

  const API = '/cmp-api';
  const STORE = 'cmp_session';
  const HORIZON = '/home/';

  const session = { token: null, expires: 0, user: '', roles: [], project: null, projects: [] };
  let refreshTimer = null;
  let viewSeq = 0;

  // ── Tiny DOM helpers (no innerHTML, so API data can never inject markup) ──
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }

  function svg(tag, attrs, ...kids) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
    for (const kid of kids.flat(Infinity)) if (kid != null) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  }

  const ICONS = {
    overview: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
    instances: 'M4 4h16v6H4V4zm0 10h16v6H4v-6zm2-8v2h2V6H6zm0 10v2h2v-2H6z',
    volumes: 'M12 3C7.6 3 4 4.3 4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6c0-1.7-3.6-3-8-3zm0 2c3.9 0 6 .9 6 1s-2.1 1-6 1-6-.9-6-1 2.1-1 6-1zm0 14c-3.9 0-6-.9-6-1v-2.2c1.5.8 3.7 1.2 6 1.2s4.5-.4 6-1.2V18c0 .1-2.1 1-6 1zm0-5c-3.9 0-6-.9-6-1V9.8C7.5 10.6 9.700 11 12 11s4.500-.4 6-1.200V13c0 .1-2.100 1-6 1z',
    network: 'M12 2a3 3 0 00-1 5.800V11H6a2 2 0 00-2 2v3.200A3 3 0 105 22a3 3 0 001-5.800V13h12v3.200A3 3 0 1019 22a3 3 0 001-5.800V13a2 2 0 00-2-2h-5V7.800A3 3 0 0012 2z',
    images: 'M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm2 10l3-4 2.500 3 3.500-5 4 6H6z',
    admin: 'M12 1l9 4v6c0 5.500-3.800 10.700-9 12-5.200-1.300-9-6.500-9-12V5l9-4zm0 6a3 3 0 100 6 3 3 0 000-6z',
  };

  function icon(name) {
    return svg('svg', { viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': 'true' }, svg('path', { d: ICONS[name] }));
  }

  function logo() {
    return svg('svg', { width: 28, height: 28, viewBox: '0 0 32 32', 'aria-hidden': 'true' },
      svg('defs', {}, svg('linearGradient', { id: 'lg', x1: 0, y1: 0, x2: 1, y2: 1 },
        svg('stop', { offset: '0', 'stop-color': '#7cc0ff' }), svg('stop', { offset: '1', 'stop-color': '#4da8ff' }))),
      svg('path', { fill: 'url(#lg)', d: 'M9 25a6 6 0 01-.7-12A8 8 0 0123.600 11 6.500 6.500 0 0123 25H9z' }));
  }

  // ── Formatting ─────────────────────────────────
  const gb = (n) => (n >= 1024 ? `${(n / 1024).toFixed(1)} TB` : `${Math.round(n * 10) / 10} GB`);
  const mb = (n) => (n >= 1024 ? `${(n / 1024).toFixed(1)} GB` : `${n} MB`);
  const when = (s) => {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  };

  function statusEl(status) {
    const s = String(status || '').toUpperCase();
    const ok = ['ACTIVE', 'AVAILABLE', 'IN-USE', 'UP', 'ENABLED', 'RUNNING'];
    const bad = ['ERROR', 'DOWN', 'DISABLED', 'KILLED'];
    return h('span', { class: `status ${ok.includes(s) ? 'ok' : bad.includes(s) ? 'bad' : s === 'SHUTOFF' ? '' : 'warn'}` }, s || '—');
  }

  function bar(used, max) {
    const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
    return h('div', { class: 'bar' }, h('i', { class: pct >= 90 ? 'crit' : pct >= 75 ? 'warn' : '', style: `width:${pct}%` }));
  }

  function ring(used, max, label, fmt) {
    const unlimited = !(max > 0);
    const r = 34;
    const c = 2 * Math.PI * r;
    const pct = unlimited ? 0 : Math.min(used / max, 1);
    const color = pct >= 0.9 ? 'var(--red)' : pct >= 0.75 ? 'var(--orange)' : 'var(--blue)';
    const f = fmt || String;
    return h('div', { class: 'ring' },
      svg('svg', { viewBox: '0 0 84 84', width: 84, height: 84 },
        svg('circle', { cx: 42, cy: 42, r, fill: 'none', stroke: 'rgba(255,255,255,.08)', 'stroke-width': 8 }),
        svg('circle', {
          cx: 42, cy: 42, r, fill: 'none', stroke: color, 'stroke-width': 8, 'stroke-linecap': 'round',
          'stroke-dasharray': `${c * pct} ${c}`, transform: 'rotate(-90 42 42)',
        }),
        svg('text', { x: 42, y: 47, 'text-anchor': 'middle', class: 'ring-pct' }, unlimited ? '∞' : `${Math.round(pct * 100)}%`)),
      h('div', { class: 'ring-label' }, label),
      h('div', { class: 'ring-sub' }, `${f(used)} / ${unlimited ? 'không giới hạn' : f(max)}`));
  }

  function table(headers, rows, emptyText) {
    if (!rows.length) return h('div', { class: 'table-wrap' }, h('div', { class: 'empty' }, emptyText || 'Không có dữ liệu'));
    return h('div', { class: 'table-wrap' }, h('table', {},
      h('thead', {}, h('tr', {}, headers.map((x) => h('th', {}, x)))),
      h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c) => (c && c.nodeName === 'TD' ? c : h('td', {}, c))))))));
  }

  function toast(msg, bad) {
    const t = h('div', { class: `toast ${bad ? 'bad' : ''}` }, msg);
    document.body.append(t);
    setTimeout(() => t.remove(), 4000);
  }

  // ── API ────────────────────────────────────────
  async function api(path, opts = {}) {
    const headers = { Accept: 'application/json' };
    if (opts.body) headers['Content-Type'] = 'application/json';
    const authToken = opts.token === false ? null : (opts.token || session.token);
    if (authToken) headers['X-Auth-Token'] = authToken;
    const res = await fetch(API + path, { method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
    if (res.status === 401 && session.token && !opts.noLogout) {
      logout('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
      throw new Error('unauthorized');
    }
    if (res.status === 429) throw new Error('Quá nhiều yêu cầu, vui lòng thử lại sau ít phút.');
    let data = null;
    if (res.status !== 204) {
      try { data = await res.json(); } catch (e) { data = null; }
    }
    if (!res.ok) {
      const msg = data && (data.error?.message || data.message || Object.values(data)[0]?.message);
      throw new Error(msg || `Lỗi ${res.status}`);
    }
    return { res, data };
  }

  const pid = () => session.project.id;

  // ── Session ────────────────────────────────────
  function save() {
    try { sessionStorage.setItem(STORE, JSON.stringify(session)); } catch (e) { /* storage unavailable */ }
  }

  function load() {
    try {
      const s = JSON.parse(sessionStorage.getItem(STORE) || 'null');
      if (s && s.token && s.expires > Date.now() + 30000 && s.project) { Object.assign(session, s); return true; }
    } catch (e) { /* ignore */ }
    return false;
  }

  function logout(message) {
    try { sessionStorage.removeItem(STORE); } catch (e) { /* ignore */ }
    Object.assign(session, { token: null, expires: 0, user: '', roles: [], project: null, projects: [] });
    clearInterval(refreshTimer);
    renderLogin(message);
  }

  async function scope(tokenValue, projectId) {
    const { res, data } = await api('/identity/v3/auth/tokens', {
      method: 'POST',
      token: false,
      body: { auth: { identity: { methods: ['token'], token: { id: tokenValue } }, scope: { project: { id: projectId } } } },
    });
    const t = data.token;
    Object.assign(session, {
      token: res.headers.get('X-Subject-Token'),
      expires: new Date(t.expires_at).getTime(),
      user: t.user.name,
      roles: (t.roles || []).map((r) => r.name),
      project: { id: t.project.id, name: t.project.name },
    });
    save();
  }

  async function login(username, password) {
    let first;
    try {
      first = await api('/identity/v3/auth/tokens', {
        method: 'POST',
        token: false,
        body: { auth: { identity: { methods: ['password'], password: { user: { name: username, domain: { name: 'Default' }, password } } } } },
      });
    } catch (ex) {
      if (/authenticat/i.test(ex.message)) throw new Error('Sai tên đăng nhập hoặc mật khẩu.');
      throw ex;
    }
    const unscoped = first.res.headers.get('X-Subject-Token');
    const { data } = await api('/identity/v3/auth/projects', { token: unscoped, noLogout: true });
    const projects = (data.projects || []).filter((p) => p.enabled);
    if (!projects.length) throw new Error('Tài khoản này chưa thuộc project nào.');
    session.projects = projects.map((p) => ({ id: p.id, name: p.name }));
    const pick = projects.find((p) => p.name === 'admin') || projects[0];
    await scope(unscoped, pick.id);
  }

  const isAdmin = () => session.roles.includes('admin');

  // ── Login screen ───────────────────────────────
  function renderLogin(message) {
    const root = document.getElementById('app');
    const err = h('div', { class: 'error-box', hidden: !message }, message || '');
    const user = h('input', { id: 'u', autocomplete: 'username', required: true, autofocus: true });
    const pass = h('input', { id: 'p', type: 'password', autocomplete: 'current-password', required: true });
    const btn = h('button', { class: 'btn primary block', type: 'submit' }, 'Đăng nhập');

    const form = h('form', {
      onsubmit: async (e) => {
        e.preventDefault();
        err.hidden = true;
        btn.disabled = true;
        btn.textContent = 'Đang đăng nhập…';
        try {
          await login(user.value.trim(), pass.value);
          pass.value = '';
          startApp();
        } catch (ex) {
          err.textContent = ex.message === 'Failed to fetch' ? 'Không kết nối được tới cụm OpenStack.' : (ex.message || 'Đăng nhập thất bại.');
          err.hidden = false;
          btn.disabled = false;
          btn.textContent = 'Đăng nhập';
        }
      },
    },
      err,
      h('label', { class: 'field' }, h('span', {}, 'Tên đăng nhập'), user),
      h('label', { class: 'field' }, h('span', {}, 'Mật khẩu'), pass),
      btn);

    root.replaceChildren(h('div', { class: 'login-wrap' }, h('div', { class: 'login-card' },
      h('div', { class: 'brand' }, logo(), 'Test Cloud'),
      h('p', { class: 'tagline' }, 'Cloud Management Platform · OpenStack + Ceph'),
      form)));
  }

  // ── Shell ──────────────────────────────────────
  const VIEWS = {
    overview: { title: 'Tổng quan', render: viewOverview },
    instances: { title: 'Máy ảo', render: viewInstances },
    volumes: { title: 'Ổ đĩa', render: viewVolumes },
    network: { title: 'Mạng', render: viewNetwork },
    images: { title: 'Hình ảnh', render: viewImages },
  };

  function currentView() {
    const name = location.hash.replace(/^#\/?/, '') || 'overview';
    return VIEWS[name] ? name : 'overview';
  }

  function startApp() {
    if (!location.hash) location.hash = '#/overview';
    renderShell();
    renderView();
  }

  function renderShell() {
    const root = document.getElementById('app');
    const active = currentView();

    const projectSwitch = session.projects.length > 1
      ? h('select', {
        'aria-label': 'Project',
        onchange: async (e) => {
          try { await scope(session.token, e.target.value); renderShell(); renderView(); } catch (ex) { toast(ex.message, true); }
        },
      }, session.projects.map((p) => h('option', { value: p.id, selected: p.id === session.project.id }, p.name)))
      : h('span', { class: 'muted' }, session.project.name);

    root.replaceChildren(h('div', { class: 'shell' },
      h('aside', { class: 'sidebar' },
        h('div', { class: 'brand' }, logo(), 'Test Cloud'),
        h('nav', { class: 'nav' }, Object.entries(VIEWS).map(([key, v]) =>
          h('a', { href: `#/${key}`, class: key === active ? 'active' : '' }, icon(key), v.title))),
        h('div', { class: 'spacer' }),
        h('nav', { class: 'nav' },
          h('a', { href: HORIZON, target: '_blank', rel: 'noopener' }, icon('admin'), 'Quản trị (Horizon)'))),
      h('div', { class: 'main' },
        h('header', { class: 'topbar' },
          h('div', { class: 'who' }, 'Project:', projectSwitch),
          h('div', { class: 'who' },
            h('span', { class: `badge-role ${isAdmin() ? '' : 'user'}` }, isAdmin() ? 'ADMIN' : 'USER'),
            h('strong', {}, session.user),
            h('button', { class: 'btn sm', onclick: () => logout() }, 'Đăng xuất'))),
        h('main', { class: 'content', id: 'view' }))));
  }

  async function renderView() {
    clearInterval(refreshTimer);
    const name = currentView();
    document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#/${name}`));
    const box = document.getElementById('view');
    if (!box) return;
    const seq = ++viewSeq;
    box.replaceChildren(h('div', { class: 'loading' }, 'Đang tải…'));
    try {
      const node = await VIEWS[name].render(() => seq === viewSeq);
      if (seq === viewSeq) box.replaceChildren(node);
    } catch (ex) {
      if (seq === viewSeq && ex.message !== 'unauthorized') box.replaceChildren(h('div', { class: 'error-box' }, `Không tải được dữ liệu: ${ex.message}`));
    }
  }

  function head(title, sub, extra) {
    return h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, title), sub && h('p', {}, sub)), extra);
  }

  const settled = (p) => Promise.allSettled(p).then((r) => r.map((x) => (x.status === 'fulfilled' ? x.value.data : null)));

  // ── Overview ───────────────────────────────────
  async function viewOverview() {
    const [nova, cinder, servers, fips, hyper, pools] = await settled([
      api('/compute/v2.1/limits'),
      api(`/volume/v3/${pid()}/limits`),
      api('/compute/v2.1/servers/detail'),
      api('/network/v2.0/floatingips'),
      isAdmin() ? api('/compute/v2.1/os-hypervisors/detail') : Promise.reject(),
      isAdmin() ? api(`/volume/v3/${pid()}/scheduler-stats/get_pools?detail=True`) : Promise.reject(),
    ]);

    const nl = nova?.limits?.absolute || {};
    const cl = cinder?.limits?.absolute || {};
    const list = servers?.servers || [];
    const active = list.filter((s) => s.status === 'ACTIVE').length;

    const stats = h('div', { class: 'grid stats' },
      h('div', { class: 'card stat' }, h('div', { class: 'value' }, active, h('small', {}, ` / ${list.length}`)), h('div', { class: 'label' }, 'Máy ảo đang chạy')),
      h('div', { class: 'card stat' }, h('div', { class: 'value' }, nl.totalCoresUsed ?? '—'), h('div', { class: 'label' }, 'vCPU đang dùng')),
      h('div', { class: 'card stat' }, h('div', { class: 'value' }, nl.totalRAMUsed != null ? mb(nl.totalRAMUsed) : '—'), h('div', { class: 'label' }, 'RAM đang dùng')),
      h('div', { class: 'card stat' }, h('div', { class: 'value' }, cl.totalVolumesUsed ?? '—'), h('div', { class: 'label' }, 'Ổ đĩa')),
      h('div', { class: 'card stat' }, h('div', { class: 'value' }, fips ? (fips.floatingips || []).length : '—'), h('div', { class: 'label' }, 'Floating IP')));

    const quota = h('div', { class: 'card' }, h('h2', {}, `Hạn mức của project ${session.project.name}`),
      nova || cinder
        ? h('div', { class: 'rings' },
          ring(nl.totalInstancesUsed ?? 0, nl.maxTotalInstances, 'Máy ảo'),
          ring(nl.totalCoresUsed ?? 0, nl.maxTotalCores, 'vCPU'),
          ring(nl.totalRAMUsed ?? 0, nl.maxTotalRAMSize, 'RAM', mb),
          ring(cl.totalGigabytesUsed ?? 0, cl.maxTotalVolumeGigabytes, 'Dung lượng đĩa', gb))
        : h('div', { class: 'notice' }, 'Không đọc được hạn mức.'));

    const recent = h('div', { class: 'card' }, h('h2', {}, 'Máy ảo gần đây'),
      list.length
        ? h('div', {}, list.slice().sort((a, b) => new Date(b.created) - new Date(a.created)).slice(0, 6).map((s) =>
          h('div', { style: 'display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)' }, h('span', {}, s.name), statusEl(s.status))))
        : h('div', { class: 'notice' }, 'Chưa có máy ảo nào.'));

    const sections = [stats, h('div', { class: 'grid two' }, quota, recent)];

    if (isAdmin()) {
      const hv = hyper?.hypervisors || [];
      sections.push(h('div', { class: 'section' }, h('div', { class: 'card' }, h('h2', {}, 'Hạ tầng · Compute node'),
        hv.length ? table(['Node', 'Trạng thái', 'vCPU', 'RAM', 'VM'], hv.map((n) => [
          n.hypervisor_hostname, statusEl(n.state),
          h('div', {}, `${n.vcpus_used} / ${n.vcpus}`, bar(n.vcpus_used, n.vcpus)),
          h('div', {}, `${mb(n.memory_mb_used)} / ${mb(n.memory_mb)}`, bar(n.memory_mb_used, n.memory_mb)),
          n.running_vms,
        ])) : h('div', { class: 'notice' }, 'Không đọc được thông tin hypervisor.'))));

      const pl = pools?.pools || [];
      sections.push(h('div', { class: 'section' }, h('div', { class: 'card' }, h('h2', {}, 'Hạ tầng · Lưu trữ (Ceph RBD)'),
        pl.length ? table(['Backend', 'Giao thức', 'Đã dùng', 'Tổng dung lượng'], pl.map((p) => {
          const c = p.capabilities || {};
          const total = Number(c.total_capacity_gb) || 0;
          const used = total - (Number(c.free_capacity_gb) || 0);
          return [c.volume_backend_name || p.name, c.storage_protocol || '—', h('div', {}, gb(used), bar(used, total)), gb(total)];
        })) : h('div', { class: 'notice' }, 'Không đọc được thông tin lưu trữ.'))));
    }

    const links = [
      ['Máy ảo', 'Tạo máy ảo mới, mở console', '/project/instances/'],
      ['Mạng', 'Network, router, security group', '/project/networks/'],
      ['Ổ đĩa', 'Volume, snapshot, backup', '/project/volumes/'],
      ['Cân bằng tải', 'Load balancer (Octavia)', '/project/load_balancer/'],
      ['Orchestration', 'Stack Heat', '/project/stacks/'],
    ];
    if (isAdmin()) links.push(['Quản trị hệ thống', 'Toàn bộ project, người dùng, hạ tầng', '/admin/']);

    sections.push(h('div', { class: 'section' }, h('div', { class: 'card' }, h('h2', {}, 'Tính năng nâng cao trong Horizon'),
      h('div', { class: 'grid services' }, links.map(([t, d, href]) =>
        h('a', { class: `service ${href === '/admin/' ? 'admin' : ''}`, href, target: '_blank', rel: 'noopener' }, h('b', {}, `${t} ↗`), h('span', {}, d)))),
      h('p', { class: 'muted', style: 'margin-top:12px;font-size:12px' }, 'Horizon dùng phiên đăng nhập riêng, bạn sẽ cần đăng nhập lại ở đó.'))));

    return h('div', {}, head('Tổng quan', `Xin chào ${session.user}`), sections);
  }

  // ── Instances ──────────────────────────────────
  async function viewInstances(alive) {
    const wrap = h('div', {});
    async function draw() {
      const [servers, flavors] = await settled([api('/compute/v2.1/servers/detail'), api('/compute/v2.1/flavors/detail')]);
      if (!alive()) return;
      const fl = new Map((flavors?.flavors || []).map((f) => [f.id, f]));
      const list = (servers?.servers || []).slice().sort((a, b) => a.name.localeCompare(b.name));

      const act = (s, label, body, confirmText) => h('button', {
        class: 'btn sm', onclick: async () => {
          if (confirmText && !confirm(confirmText.replace('{name}', s.name))) return;
          try {
            await api(`/compute/v2.1/servers/${s.id}/action`, { method: 'POST', body });
            toast(`${label}: ${s.name}`);
            setTimeout(draw, 1500);
          } catch (ex) { toast(`${label} thất bại: ${ex.message}`, true); }
        },
      }, label);

      const rows = list.map((s) => {
        const ips = Object.values(s.addresses || {}).flat();
        const f = fl.get(s.flavor?.id);
        return [
          h('strong', {}, s.name), statusEl(s.status),
          f ? `${f.name} (${f.vcpus} vCPU · ${mb(f.ram)})` : '—',
          h('div', {}, ips.map((a) => h('span', { class: `chip ${a['OS-EXT-IPS:type'] === 'floating' ? 'float' : ''}` }, a.addr))),
          when(s.created),
          h('td', { class: 'actions' },
            s.status === 'SHUTOFF' ? act(s, 'Bật', { 'os-start': null }) : null,
            s.status === 'ACTIVE' ? act(s, 'Khởi động lại', { reboot: { type: 'SOFT' } }, 'Khởi động lại máy ảo {name}?') : null,
            s.status === 'ACTIVE' ? act(s, 'Tắt', { 'os-stop': null }, 'Tắt máy ảo {name}?') : null,
            h('a', { class: 'btn sm', href: `/project/instances/${s.id}/`, target: '_blank', rel: 'noopener' }, 'Chi tiết ↗')),
        ];
      });

      wrap.replaceChildren(
        head('Máy ảo', `${list.length} máy ảo trong project ${session.project.name}`,
          h('a', { class: 'btn primary', href: '/project/instances/', target: '_blank', rel: 'noopener' }, '+ Tạo máy ảo (Horizon)')),
        table(['Tên', 'Trạng thái', 'Cấu hình', 'Địa chỉ IP', 'Tạo lúc', ''], rows, 'Project này chưa có máy ảo nào.'));
    }
    await draw();
    refreshTimer = setInterval(() => draw().catch(() => {}), 15000);
    return wrap;
  }

  // ── Volumes ────────────────────────────────────
  async function viewVolumes() {
    const [vols, servers] = await settled([api(`/volume/v3/${pid()}/volumes/detail`), api('/compute/v2.1/servers/detail')]);
    if (!vols) throw new Error('không đọc được danh sách ổ đĩa');
    const names = new Map((servers?.servers || []).map((s) => [s.id, s.name]));
    const list = vols.volumes || [];
    const total = list.reduce((a, v) => a + v.size, 0);
    return h('div', {},
      head('Ổ đĩa', `${list.length} ổ đĩa · ${gb(total)}`,
        h('a', { class: 'btn primary', href: '/project/volumes/', target: '_blank', rel: 'noopener' }, '+ Tạo ổ đĩa (Horizon)')),
      table(['Tên', 'Trạng thái', 'Dung lượng', 'Gắn vào', 'Bootable', 'Tạo lúc'], list.map((v) => [
        h('strong', {}, v.name || v.id.slice(0, 8)), statusEl(v.status), gb(v.size),
        (v.attachments || []).map((a) => names.get(a.server_id) || a.server_id.slice(0, 8)).join(', ') || '—',
        v.bootable === 'true' ? 'Có' : 'Không', when(v.created_at),
      ]), 'Project này chưa có ổ đĩa nào.'));
  }

  // ── Network ────────────────────────────────────
  async function viewNetwork() {
    const [nets, subs, routers, fips] = await settled([
      api('/network/v2.0/networks'), api('/network/v2.0/subnets'), api('/network/v2.0/routers'), api('/network/v2.0/floatingips'),
    ]);
    if (!nets) throw new Error('không đọc được danh sách mạng');
    const subMap = new Map((subs?.subnets || []).map((s) => [s.id, s]));
    return h('div', {},
      head('Mạng', 'Network, router và floating IP của project',
        h('a', { class: 'btn primary', href: '/project/networks/', target: '_blank', rel: 'noopener' }, 'Quản lý mạng (Horizon) ↗')),
      h('h2', { class: 'muted', style: 'margin-bottom:10px;font-size:13px' }, 'NETWORK'),
      table(['Tên', 'Trạng thái', 'Subnet', 'Loại'], (nets.networks || []).map((n) => [
        h('strong', {}, n.name), statusEl(n.status),
        (n.subnets || []).map((id) => h('span', { class: 'chip' }, subMap.get(id)?.cidr || id.slice(0, 8))),
        n['router:external'] ? 'External' : n.shared ? 'Shared' : 'Riêng tư',
      ])),
      h('div', { class: 'section' }, h('h2', { class: 'muted', style: 'margin-bottom:10px;font-size:13px' }, 'ROUTER'),
        table(['Tên', 'Trạng thái', 'Gateway ngoài'], (routers?.routers || []).map((r) => [
          h('strong', {}, r.name), statusEl(r.status), r.external_gateway_info ? 'Có' : '—',
        ]), 'Không có router.')),
      h('div', { class: 'section' }, h('h2', { class: 'muted', style: 'margin-bottom:10px;font-size:13px' }, 'FLOATING IP'),
        table(['Địa chỉ', 'Gắn với', 'Trạng thái'], (fips?.floatingips || []).map((f) => [
          h('strong', {}, f.floating_ip_address), f.fixed_ip_address || '—', statusEl(f.status),
        ]), 'Không có floating IP.')));
  }

  // ── Images ─────────────────────────────────────
  async function viewImages() {
    const { data } = await api('/image/v2/images');
    const list = (data.images || []).slice().sort((a, b) => a.name.localeCompare(b.name));
    return h('div', {},
      head('Hình ảnh', `${list.length} image có thể dùng để tạo máy ảo`),
      table(['Tên', 'Trạng thái', 'Dung lượng', 'Định dạng', 'Hiển thị', 'Tạo lúc'], list.map((i) => [
        h('strong', {}, i.name), statusEl(i.status), i.size ? mb(Math.round(i.size / 1048576)) : '—',
        i.disk_format || '—', i.visibility, when(i.created_at),
      ])));
  }

  // ── Boot ───────────────────────────────────────
  window.addEventListener('hashchange', () => {
    if (!session.token) return;
    renderShell();
    renderView();
  });

  if (load()) startApp();
  else renderLogin();
})();
