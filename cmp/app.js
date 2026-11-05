(() => {
  'use strict';

  const API = '/cmp-api';
  const STORE = 'cmp_session';
  const THEME_KEY = 'cmp_theme';
  const HORIZON = '/home/';

  const session = { token: null, expires: 0, user: '', roles: [], project: null, projects: [] };
  let refreshTimer = null;
  let viewSeq = 0;
  let searchBox = null;

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

  // ── Icons (24x24, filled) ──────────────────────
  const ICONS = {
    overview: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
    instances: 'M4 4h16v6H4V4zm0 10h16v6H4v-6zm2-8v2h2V6H6zm0 10v2h2v-2H6z',
    volumes: 'M12 3C7.6 3 4 4.3 4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6c0-1.7-3.6-3-8-3zm0 2c3.900 0 6 .9 6 1s-2.100 1-6 1-6-.9-6-1 2.100-1 6-1zm0 14c-3.900 0-6-.9-6-1v-2.200c1.500.8 3.700 1.200 6 1.200s4.500-.4 6-1.200V18c0 .1-2.100 1-6 1zm0-5c-3.900 0-6-.9-6-1V9.800C7.500 10.600 9.700 11 12 11s4.500-.4 6-1.200V13c0 .1-2.100 1-6 1z',
    network: 'M12 2a3 3 0 00-1 5.800V11H6a2 2 0 00-2 2v3.200A3 3 0 105 22a3 3 0 001-5.800V13h12v3.200A3 3 0 1019 22a3 3 0 001-5.800V13a2 2 0 00-2-2h-5V7.800A3 3 0 0012 2z',
    images: 'M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm2 10l3-4 2.500 3 3.500-5 4 6H6z',
    admin: 'M12 1l9 4v6c0 5.500-3.800 10.700-9 12-5.200-1.300-9-6.500-9-12V5l9-4zm0 6a3 3 0 100 6 3 3 0 000-6z',
    play: 'M8 5v14l11-7z',
    stop: 'M6 6h12v12H6z',
    reboot: 'M12 5V1L7 6l5 5V7c3.300 0 6 2.700 6 6s-2.700 6-6 6-6-2.700-6-6H4c0 4.400 3.600 8 8 8s8-3.600 8-8-3.600-8-8-8z',
    refresh: 'M17.650 6.350A7.960 7.960 0 0012 4a8 8 0 108 8h-2a6 6 0 11-1.760-4.240L13 11h7V4l-2.350 2.350z',
    sun: 'M12 7a5 5 0 100 10 5 5 0 000-10zM2 13h2a1 1 0 100-2H2a1 1 0 100 2zm18 0h2a1 1 0 100-2h-2a1 1 0 100 2zM11 2v2a1 1 0 102 0V2a1 1 0 10-2 0zm0 18v2a1 1 0 102 0v-2a1 1 0 10-2 0zM5.990 4.580a1 1 0 10-1.410 1.410l1.060 1.060a1 1 0 101.410-1.410L5.990 4.580zm12.370 12.370a1 1 0 10-1.410 1.410l1.060 1.060a1 1 0 101.410-1.410l-1.060-1.060zm1.060-10.960a1 1 0 10-1.410-1.410l-1.060 1.060a1 1 0 101.410 1.410l1.060-1.060zM7.050 18.360a1 1 0 10-1.410-1.410l-1.060 1.060a1 1 0 101.410 1.410l1.060-1.060z',
    moon: 'M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.360a5.389 5.389 0 01-4.400 2.260 5.403 5.403 0 01-3.140-9.800c-.44-.06-.9-.1-1.360-.1z',
    search: 'M15.500 14h-.79l-.28-.27A6.471 6.471 0 0016 9.500 6.500 6.500 0 109.500 16c1.610 0 3.090-.59 4.230-1.570l.27.28v.79l5 4.990L20.490 19l-4.990-5zm-6 0C7.010 14 5 11.990 5 9.500S7.010 5 9.500 5 14 7.010 14 9.500 11.990 14 9.500 14z',
    external: 'M14 3v2h3.590l-9.830 9.830 1.410 1.410L19 6.410V10h2V3h-7zM5 5h5V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-5h-2v5H5V5z',
    cpu: 'M9 2v2H7a2 2 0 00-2 2v2H3v2h2v2H3v2h2v2a2 2 0 002 2h2v2h2v-2h2v2h2v-2h2a2 2 0 002-2v-2h2v-2h-2v-2h2V8h-2V6a2 2 0 00-2-2h-2V2h-2v2h-2V2H9zM7 6h10v12H7V6zm2 2v8h6V8H9z',
    ram: 'M4 7v10h16V7H4zm2 2h2v6H6V9zm4 0h2v6h-2V9zm4 0h2v6h-2V9zm4 0h0v6h0V9z',
    ip: 'M12 2a10 10 0 100 20 10 10 0 000-20zm6.920 6h-2.950a15.650 15.650 0 00-1.380-3.560A8.030 8.030 0 0118.920 8zM12 4.040c.830 1.200 1.480 2.530 1.910 3.960h-3.820c.430-1.430 1.080-2.760 1.910-3.960zM4.260 14a8.200 8.200 0 010-4h3.380a16.500 16.500 0 000 4H4.260zm.820 2h2.950c.320 1.250.780 2.450 1.380 3.560A7.987 7.987 0 015.080 16zm2.950-8H5.080a7.987 7.987 0 014.330-3.560A15.650 15.650 0 008.030 8zM12 19.960c-.830-1.200-1.480-2.530-1.910-3.960h3.820c-.430 1.430-1.080 2.760-1.910 3.960zM14.340 14H9.660a14.700 14.700 0 010-4h4.680a14.700 14.700 0 010 4zm.250 5.560c.600-1.110 1.060-2.310 1.380-3.560h2.950a8.030 8.030 0 01-4.330 3.560zM16.360 14a16.500 16.500 0 000-4h3.380a8.200 8.200 0 010 4h-3.380z',
    lb: 'M12 2L4 6v2h16V6l-8-4zM6 10v8H4v2h16v-2h-2v-8h-2v8h-3v-8h-2v8H8v-8H6z',
    stack: 'M12 2L1 7l11 5 9-4.090V17h2V7L12 2zM5 13.180v4L12 21l7-3.820v-4L12 17l-7-3.820z',
    cloud: 'M9 25a6 6 0 01-.7-12A8 8 0 0123.600 11 6.500 6.500 0 0123 25H9z',
  };

  function icon(name, size) {
    const s = size ? { width: size, height: size } : {};
    return svg('svg', { viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': 'true', ...s }, svg('path', { d: ICONS[name] }));
  }

  function logo(size = 28) {
    return svg('svg', { width: size, height: size, viewBox: '0 0 32 32', 'aria-hidden': 'true' },
      svg('defs', {}, svg('linearGradient', { id: 'lg', x1: 0, y1: 0, x2: 1, y2: 1 },
        svg('stop', { offset: '0', 'stop-color': '#8cc4ff' }), svg('stop', { offset: '1', 'stop-color': '#4d93ff' }))),
      svg('path', { fill: 'url(#lg)', d: ICONS.cloud }));
  }

  // ── Theme ──────────────────────────────────────
  function storedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function applyTheme(t) { document.documentElement.dataset.theme = t; }
  function initTheme() {
    const t = storedTheme() || (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    applyTheme(t);
  }
  function themeButton() {
    const btn = h('button', { class: 'btn icon ghost', title: 'Đổi giao diện sáng/tối', 'aria-label': 'Đổi giao diện sáng/tối' });
    const paint = () => btn.replaceChildren(icon(document.documentElement.dataset.theme === 'light' ? 'moon' : 'sun', 18));
    btn.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage unavailable */ }
      paint();
    });
    paint();
    return btn;
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
    const color = pct >= 0.9 ? 'var(--red)' : pct >= 0.75 ? 'var(--orange)' : 'var(--accent)';
    const f = fmt || String;
    return h('div', { class: 'ring' },
      svg('svg', { viewBox: '0 0 84 84', width: 84, height: 84, role: 'img', 'aria-label': `${label}: ${unlimited ? 'không giới hạn' : `${Math.round(pct * 100)}%`}` },
        svg('circle', { cx: 42, cy: 42, r, fill: 'none', 'stroke-width': 8, class: 'ring-track' }),
        svg('circle', {
          cx: 42, cy: 42, r, fill: 'none', stroke: color, 'stroke-width': 8, 'stroke-linecap': 'round',
          'stroke-dasharray': `${c * pct} ${c}`, transform: 'rotate(-90 42 42)',
        }),
        svg('text', { x: 42, y: 47, 'text-anchor': 'middle', class: 'ring-pct' }, unlimited ? '∞' : `${Math.round(pct * 100)}%`)),
      h('div', { class: 'ring-label' }, label),
      h('div', { class: 'ring-sub' }, `${f(used)} / ${unlimited ? 'không giới hạn' : f(max)}`));
  }

  function table(headers, rows, emptyText) {
    if (!rows.length) return empty(emptyText || 'Không có dữ liệu');
    return h('div', { class: 'table-wrap' }, h('table', {},
      h('thead', {}, h('tr', {}, headers.map((x) => h('th', { scope: 'col' }, x)))),
      h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c) => (c && c.nodeName === 'TD' ? c : h('td', {}, c))))))));
  }

  function empty(text) {
    return h('div', { class: 'table-wrap' }, h('div', { class: 'empty' }, icon('instances'), h('div', {}, text)));
  }

  function skeleton() {
    return h('div', { class: 'skel', 'aria-label': 'Đang tải', role: 'status' },
      h('i', { style: 'width:220px;height:30px' }), h('i', { style: 'width:340px' }),
      h('div', { class: 'row' }, h('i', { class: 'lg' }), h('i', { class: 'lg' }), h('i', { class: 'lg' }), h('i', { class: 'lg' })),
      h('i', { class: 'lg', style: 'height:220px' }));
  }

  function toast(msg, bad) {
    const t = h('div', { class: `toast ${bad ? 'bad' : ''}`, role: 'status' }, msg);
    document.body.append(t);
    setTimeout(() => t.remove(), 4200);
  }

  function confirmDialog({ title, message, confirmText, danger }) {
    return new Promise((resolve) => {
      const previous = document.activeElement;
      const onKey = (e) => { if (e.key === 'Escape') close(false); };
      const close = (value) => {
        overlay.remove();
        document.removeEventListener('keydown', onKey);
        if (previous && previous.focus) previous.focus();
        resolve(value);
      };
      const ok = h('button', { class: `btn ${danger ? 'danger-solid' : 'primary'}`, onclick: () => close(true) }, confirmText || 'Xác nhận');
      const cancel = h('button', { class: 'btn', onclick: () => close(false) }, 'Hủy');
      const overlay = h('div', { class: 'overlay', onclick: (e) => { if (e.target === overlay) close(false); } },
        h('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
          h('h3', {}, title), h('p', {}, message),
          h('div', { class: 'dialog-actions' }, cancel, ok)));
      document.body.append(overlay);
      document.addEventListener('keydown', onKey);
      // Never pre-select a destructive action: a stray Enter must not shut a VM down
      (danger ? cancel : ok).focus();
    });
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
    document.title = 'Đăng nhập · Test Cloud';
    const root = document.getElementById('app');
    const err = h('div', { class: 'error-box', role: 'alert', hidden: !message }, message || '');
    const user = h('input', { id: 'u', autocomplete: 'username', required: true, autofocus: true, placeholder: 'admin' });
    const pass = h('input', { id: 'p', type: 'password', autocomplete: 'current-password', required: true, placeholder: '••••••••' });
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

    const feature = (ic, title, text) => h('li', {}, h('span', { class: 'dot' }, icon(ic)), h('div', {}, h('b', {}, title), h('span', {}, text)));

    root.replaceChildren(h('div', { class: 'login' },
      h('section', { class: 'login-hero' },
        h('div', {},
          h('div', { class: 'brand' }, logo(), 'Test Cloud'),
          h('h1', {}, 'Quản lý hạ tầng đám mây của bạn trong một nơi.'),
          h('p', { class: 'lead' }, 'Cloud Management Platform trên nền OpenStack và Ceph: theo dõi tài nguyên, điều khiển máy ảo, ổ đĩa và mạng.'),
          h('ul', { class: 'feature-list' },
            feature('instances', 'Máy ảo', 'Bật, tắt, khởi động lại và theo dõi trạng thái theo thời gian thực'),
            feature('volumes', 'Lưu trữ Ceph', 'Ổ đĩa và image nhân bản 3 bản, dung lượng hiển thị rõ ràng'),
            feature('network', 'Mạng ảo', 'Network, router và floating IP của project'),
            feature('lb', 'Quản trị nâng cao', 'Chuyển sang Horizon khi cần tạo máy ảo hoặc cấu hình sâu'))),
        h('div', { class: 'login-foot' }, 'OpenStack 2025.1 · Ceph 19.2 · Kolla-Ansible')),
      h('section', { class: 'login-form' },
        h('div', { class: 'corner' }, themeButton()),
        h('div', { class: 'login-card' },
          h('h2', {}, 'Đăng nhập'),
          h('p', { class: 'sub' }, 'Dùng tài khoản OpenStack của bạn.'),
          form))));
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
      : h('strong', {}, session.project.name);

    root.replaceChildren(h('div', { class: 'shell' },
      h('aside', { class: 'sidebar' },
        h('div', { class: 'brand' }, logo(), 'Test Cloud'),
        h('nav', { class: 'nav', 'aria-label': 'Điều hướng chính' },
          h('div', { class: 'nav-label' }, 'Tài nguyên'),
          Object.entries(VIEWS).map(([key, v]) =>
            h('a', { href: `#/${key}`, class: key === active ? 'active' : '', 'aria-current': key === active ? 'page' : null }, icon(key), v.title)),
          h('div', { class: 'nav-label ext-label' }, 'Quản trị'),
          h('a', { href: HORIZON, target: '_blank', rel: 'noopener', class: 'ext' }, icon('admin'), 'Horizon'))),
      h('div', { class: 'main' },
        h('header', { class: 'topbar' },
          h('div', { class: 'crumb' }, 'Project', projectSwitch),
          h('div', { class: 'top-actions' },
            themeButton(),
            h('div', { class: 'who' },
              h('div', { class: 'avatar', 'aria-hidden': 'true' }, (session.user || '?').slice(0, 1).toUpperCase()),
              h('div', {}, h('div', { class: 'name' }, session.user), h('span', { class: `role ${isAdmin() ? '' : 'user'}` }, isAdmin() ? 'ADMIN' : 'USER'))),
            h('button', { class: 'btn sm', onclick: () => logout() }, 'Đăng xuất'))),
        h('main', { class: 'content', id: 'view' }))));
  }

  async function renderView() {
    clearInterval(refreshTimer);
    searchBox = null;
    const name = currentView();
    document.title = `${VIEWS[name].title} · Test Cloud`;
    document.querySelectorAll('.nav a:not(.ext)').forEach((a) => {
      const on = a.getAttribute('href') === `#/${name}`;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const box = document.getElementById('view');
    if (!box) return;
    const seq = ++viewSeq;
    box.replaceChildren(skeleton());
    try {
      const node = await VIEWS[name].render(() => seq === viewSeq);
      if (seq === viewSeq) box.replaceChildren(node);
    } catch (ex) {
      if (seq === viewSeq && ex.message !== 'unauthorized') {
        box.replaceChildren(h('div', { class: 'error-box', role: 'alert' }, `Không tải được dữ liệu: ${ex.message}`));
      }
    }
  }

  function head(title, sub, ...actions) {
    return h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, title), sub && h('p', {}, sub)), h('div', { class: 'head-actions' }, actions));
  }

  function refreshButton() {
    return h('button', { class: 'btn', onclick: () => renderView() }, icon('refresh'), 'Làm mới');
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
    const hv = hyper?.hypervisors || [];
    const pl = pools?.pools || [];

    const stat = (ic, value, small, label) => h('div', { class: 'card stat' },
      h('div', { class: 'stat-top' }, h('div', { class: 'chip-icon' }, icon(ic))),
      h('div', { class: 'value' }, value, small && h('small', {}, ` ${small}`)),
      h('div', { class: 'label' }, label));

    const stats = h('div', { class: 'grid stats' },
      stat('instances', active, `/ ${list.length}`, 'Máy ảo đang chạy'),
      stat('cpu', nl.totalCoresUsed ?? '—', nl.maxTotalCores > 0 ? `/ ${nl.maxTotalCores}` : '', 'vCPU đang dùng'),
      stat('ram', nl.totalRAMUsed != null ? mb(nl.totalRAMUsed) : '—', '', 'RAM đang dùng'),
      stat('volumes', cl.totalVolumesUsed ?? '—', cl.totalGigabytesUsed != null ? `· ${gb(cl.totalGigabytesUsed)}` : '', 'Ổ đĩa'),
      stat('ip', fips ? (fips.floatingips || []).length : '—', '', 'Floating IP'));

    const sections = [];

    if (isAdmin() && (hv.length || pl.length)) {
      const up = hv.filter((n) => String(n.state).toLowerCase() === 'up').length;
      const cap = pl.reduce((a, p) => a + (Number(p.capabilities?.total_capacity_gb) || 0), 0);
      const free = pl.reduce((a, p) => a + (Number(p.capabilities?.free_capacity_gb) || 0), 0);
      const pct = cap > 0 ? Math.round(((cap - free) / cap) * 100) : 0;
      sections.push(h('div', { class: 'health' },
        hv.length ? h('span', { class: `pill ${up === hv.length ? '' : 'bad'}` }, `Compute: ${up}/${hv.length} node hoạt động`) : null,
        pl.length ? h('span', { class: `pill ${pct >= 90 ? 'bad' : pct >= 75 ? 'warn' : ''}` }, `Ceph: ${pct}% dung lượng đã dùng`) : null,
        h('span', { class: `pill ${active === list.length ? '' : 'warn'}` }, `${active}/${list.length} máy ảo đang chạy`)));
    }

    const quota = h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', {}, `Hạn mức · ${session.project.name}`)),
      nova || cinder
        ? h('div', { class: 'rings' },
          ring(nl.totalInstancesUsed ?? 0, nl.maxTotalInstances, 'Máy ảo'),
          ring(nl.totalCoresUsed ?? 0, nl.maxTotalCores, 'vCPU'),
          ring(nl.totalRAMUsed ?? 0, nl.maxTotalRAMSize, 'RAM', mb),
          ring(cl.totalGigabytesUsed ?? 0, cl.maxTotalVolumeGigabytes, 'Ổ đĩa', gb))
        : h('div', { class: 'empty' }, 'Không đọc được hạn mức.'));

    const recent = h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', {}, 'Máy ảo gần đây'), h('a', { href: '#/instances' }, 'Xem tất cả →')),
      list.length
        ? h('div', {}, list.slice().sort((a, b) => new Date(b.created) - new Date(a.created)).slice(0, 6).map((s) =>
          h('div', { class: 'mini-row' }, h('span', {}, s.name), statusEl(s.status))))
        : h('div', { class: 'empty' }, 'Chưa có máy ảo nào.'));

    sections.push(stats, h('div', { class: 'grid two' }, quota, recent));

    if (isAdmin()) {
      sections.push(h('div', { class: 'section' }, h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', {}, 'Hạ tầng · Compute node')),
        hv.length ? table(['Node', 'Trạng thái', 'vCPU', 'RAM', 'VM'], hv.map((n) => [
          h('strong', {}, n.hypervisor_hostname), statusEl(n.state),
          h('div', { style: 'min-width:140px' }, `${n.vcpus_used} / ${n.vcpus}`, bar(n.vcpus_used, n.vcpus)),
          h('div', { style: 'min-width:170px' }, `${mb(n.memory_mb_used)} / ${mb(n.memory_mb)}`, bar(n.memory_mb_used, n.memory_mb)),
          n.running_vms,
        ])) : h('div', { class: 'empty' }, 'Không đọc được thông tin hypervisor.'))));

      sections.push(h('div', { class: 'section' }, h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', {}, 'Hạ tầng · Lưu trữ Ceph RBD')),
        pl.length ? table(['Backend', 'Giao thức', 'Đã dùng', 'Tổng dung lượng'], pl.map((p) => {
          const c = p.capabilities || {};
          const total = Number(c.total_capacity_gb) || 0;
          const used = total - (Number(c.free_capacity_gb) || 0);
          return [h('strong', {}, c.volume_backend_name || p.name), c.storage_protocol || '—', h('div', { style: 'min-width:200px' }, gb(used), bar(used, total)), gb(total)];
        })) : h('div', { class: 'empty' }, 'Không đọc được thông tin lưu trữ.'))));
    }

    const links = [
      ['instances', 'Máy ảo', 'Tạo máy ảo mới, mở console', '/project/instances/'],
      ['network', 'Mạng', 'Network, router, security group', '/project/networks/'],
      ['volumes', 'Ổ đĩa', 'Volume, snapshot, backup', '/project/volumes/'],
      ['lb', 'Cân bằng tải', 'Load balancer (Octavia)', '/project/load_balancer/'],
      ['stack', 'Orchestration', 'Stack Heat', '/project/stacks/'],
    ];
    if (isAdmin()) links.push(['admin', 'Quản trị hệ thống', 'Toàn bộ project, người dùng, hạ tầng', '/admin/']);

    sections.push(h('div', { class: 'section' }, h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', {}, 'Tính năng nâng cao trong Horizon')),
      h('div', { class: 'grid services' }, links.map(([ic, t, d, href]) =>
        h('a', { class: `service ${href === '/admin/' ? 'admin' : ''}`, href, target: '_blank', rel: 'noopener' },
          h('div', { class: 'chip-icon' }, icon(ic)), h('div', {}, h('b', {}, `${t} ↗`), h('span', { class: 'd' }, d))))),
      h('p', { class: 'muted', style: 'margin-top:12px;font-size:12px' }, 'Horizon dùng phiên đăng nhập riêng, bạn sẽ cần đăng nhập lại ở đó.'))));

    return h('div', {}, head('Tổng quan', `Xin chào ${session.user}, đây là tình trạng project ${session.project.name}.`, refreshButton()), sections);
  }

  // ── Instances ──────────────────────────────────
  const instState = { text: '', status: 'all' };

  async function viewInstances(alive) {
    const wrap = h('div', {});
    const results = h('div', {});
    const chipBox = h('div', { class: 'chips', role: 'group', 'aria-label': 'Lọc theo trạng thái' });
    let all = [];
    let flavors = new Map();

    const search = h('input', {
      type: 'search', placeholder: 'Tìm theo tên, IP, cấu hình…', 'aria-label': 'Tìm máy ảo', value: instState.text,
      oninput: (e) => { instState.text = e.target.value; paint(); },
    });
    searchBox = search;

    const matches = (s) => {
      const q = instState.text.trim().toLowerCase();
      if (!q) return true;
      const ips = Object.values(s.addresses || {}).flat().map((a) => a.addr).join(' ');
      const f = flavors.get(s.flavor?.id);
      return `${s.name} ${ips} ${f ? f.name : ''}`.toLowerCase().includes(q);
    };
    const byStatus = (s) => {
      if (instState.status === 'all') return true;
      if (instState.status === 'active') return s.status === 'ACTIVE';
      if (instState.status === 'off') return s.status === 'SHUTOFF';
      return s.status === 'ERROR';
    };

    const act = (s, label, ic, body, ask, tone) => h('button', {
      class: `btn icon sm ${tone || ''}`, title: `${label}: ${s.name}`, 'aria-label': `${label} ${s.name}`,
      onclick: async () => {
        if (ask && !(await confirmDialog({ title: `${label} máy ảo?`, message: `${ask} ${s.name}.`, confirmText: label, danger: tone === 'tone-danger' }))) return;
        try {
          await api(`/compute/v2.1/servers/${s.id}/action`, { method: 'POST', body });
          toast(`${label}: ${s.name}`);
          setTimeout(() => draw(), 1500);
        } catch (ex) { toast(`${label} thất bại: ${ex.message}`, true); }
      },
    }, icon(ic));

    function paint() {
      const counts = {
        all: all.length,
        active: all.filter((s) => s.status === 'ACTIVE').length,
        off: all.filter((s) => s.status === 'SHUTOFF').length,
        error: all.filter((s) => s.status === 'ERROR').length,
      };
      chipBox.replaceChildren(...[['all', 'Tất cả'], ['active', 'Đang chạy'], ['off', 'Đã tắt'], ['error', 'Lỗi']].map(([key, label]) =>
        h('button', { class: `fchip ${instState.status === key ? 'on' : ''}`, 'aria-pressed': instState.status === key ? 'true' : 'false', onclick: () => { instState.status = key; paint(); } },
          label, h('b', {}, counts[key]))));

      const rows = all.filter(byStatus).filter(matches).map((s) => {
        const ips = Object.values(s.addresses || {}).flat();
        const f = flavors.get(s.flavor?.id);
        return [
          h('strong', {}, s.name), statusEl(s.status),
          f ? `${f.name} · ${f.vcpus} vCPU · ${mb(f.ram)}` : '—',
          h('div', {}, ips.map((a) => h('span', { class: `chip ${a['OS-EXT-IPS:type'] === 'floating' ? 'float' : ''}` }, a.addr))),
          when(s.created),
          h('td', { class: 'actions' },
            s.status === 'SHUTOFF' ? act(s, 'Bật', 'play', { 'os-start': null }, null, 'tone-ok') : null,
            s.status === 'ACTIVE' ? act(s, 'Khởi động lại', 'reboot', { reboot: { type: 'SOFT' } }, 'Khởi động lại máy ảo') : null,
            s.status === 'ACTIVE' ? act(s, 'Tắt', 'stop', { 'os-stop': null }, 'Tắt máy ảo', 'tone-danger') : null,
            h('a', { class: 'btn icon sm', href: `/project/instances/${s.id}/`, target: '_blank', rel: 'noopener', title: `Chi tiết trong Horizon: ${s.name}`, 'aria-label': `Chi tiết ${s.name}` }, icon('external'))),
        ];
      });
      results.replaceChildren(table(['Tên', 'Trạng thái', 'Cấu hình', 'Địa chỉ IP', 'Tạo lúc', ''], rows,
        all.length ? 'Không có máy ảo nào khớp bộ lọc.' : 'Project này chưa có máy ảo nào.'));
    }

    async function draw() {
      const [servers, fl] = await settled([api('/compute/v2.1/servers/detail'), api('/compute/v2.1/flavors/detail')]);
      if (!alive()) return;
      flavors = new Map((fl?.flavors || []).map((f) => [f.id, f]));
      all = (servers?.servers || []).slice().sort((a, b) => a.name.localeCompare(b.name));
      paint();
    }

    wrap.append(
      head('Máy ảo', `Project ${session.project.name}`, refreshButton(),
        h('a', { class: 'btn primary', href: '/project/instances/', target: '_blank', rel: 'noopener' }, '+ Tạo máy ảo')),
      h('div', { class: 'toolbar' }, h('div', { class: 'search' }, icon('search'), search), chipBox),
      results);
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
      head('Ổ đĩa', `${list.length} ổ đĩa · ${gb(total)} dung lượng`, refreshButton(),
        h('a', { class: 'btn primary', href: '/project/volumes/', target: '_blank', rel: 'noopener' }, '+ Tạo ổ đĩa')),
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
    const sub = (t) => h('h2', { class: 'muted', style: 'margin:0 0 10px;font-size:12px;letter-spacing:.08em' }, t);
    return h('div', {},
      head('Mạng', 'Network, router và floating IP của project', refreshButton(),
        h('a', { class: 'btn primary', href: '/project/networks/', target: '_blank', rel: 'noopener' }, 'Quản lý mạng ↗')),
      sub('NETWORK'),
      table(['Tên', 'Trạng thái', 'Subnet', 'Loại'], (nets.networks || []).map((n) => [
        h('strong', {}, n.name), statusEl(n.status),
        (n.subnets || []).map((id) => h('span', { class: 'chip' }, subMap.get(id)?.cidr || id.slice(0, 8))),
        n['router:external'] ? 'External' : n.shared ? 'Shared' : 'Riêng tư',
      ])),
      h('div', { class: 'section' }, sub('ROUTER'),
        table(['Tên', 'Trạng thái', 'Gateway ngoài'], (routers?.routers || []).map((r) => [
          h('strong', {}, r.name), statusEl(r.status), r.external_gateway_info ? 'Có' : '—',
        ]), 'Không có router.')),
      h('div', { class: 'section' }, sub('FLOATING IP'),
        table(['Địa chỉ', 'Gắn với', 'Trạng thái'], (fips?.floatingips || []).map((f) => [
          h('strong', {}, f.floating_ip_address), f.fixed_ip_address || '—', statusEl(f.status),
        ]), 'Không có floating IP.')));
  }

  // ── Images ─────────────────────────────────────
  async function viewImages() {
    const { data } = await api('/image/v2/images');
    const list = (data.images || []).slice().sort((a, b) => a.name.localeCompare(b.name));
    return h('div', {},
      head('Hình ảnh', `${list.length} image có thể dùng để tạo máy ảo`, refreshButton()),
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

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && searchBox && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) {
      e.preventDefault();
      searchBox.focus();
    }
  });

  initTheme();
  if (load()) startApp();
  else renderLogin();
})();
