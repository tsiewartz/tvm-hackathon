/* TVM Hands-on Lab site – shared behaviour (no dependencies) */
(function () {
  const PAGES = [
    { id: 'home',       title: 'Home',                     href: 'index.html',                   group: null },
    { id: 'hackathon',  title: 'The day',                  href: 'index.html#agenda',               group: 'Start here' },
    { id: 'prework',    title: 'Before you arrive',        href: 'prework.html',                 group: 'Start here' },
    { id: 'golden',     title: '0 · Golden path',          href: 'build/golden-path.html',   group: 'Build path' },
    { id: 'discover',   title: '1 · Discover your data',   href: 'build/discover.html',          group: 'Build path' },
    { id: 'gq',         title: 'Golden questions sheet',   href: 'build/golden-questions.html', group: 'Build path' },
    { id: 'semantic',   title: '2 · Semantic view in dbt', href: 'build/semantic-view.html',     group: 'Build path' },
    { id: 'agent',      title: '3 · Cortex Agent in dbt',  href: 'build/agent.html',             group: 'Build path' },
    { id: 'mcp',        title: '4 · MCP + Claude Code',    href: 'build/mcp.html',               group: 'Build path' },
    { id: 'bestpractices', title: 'Best practices',        href: 'best-practices.html',          group: 'Knowledge' },
    { id: 'ideas',      title: 'Idea bank',                href: 'ideas.html',                   group: 'Knowledge' },
    { id: 'resources',  title: 'Resources & docs',         href: 'resources.html',               group: 'Knowledge' },
    { id: 'next',       title: 'MVP handoff',              href: 'mvp-handoff.html',             group: 'Finish' },
    { id: 'cheatsheet', title: 'Cheat sheet',              href: 'cheatsheet.html',              group: 'Finish' },
    { id: 'faq',        title: 'Troubleshooting',          href: 'troubleshooting.html',         group: 'Finish' },
  ];
  const body = document.body;
  const root = body.dataset.root || '';
  const current = body.dataset.page || 'home';
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem('tvm:' + k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('tvm:' + k, JSON.stringify(v)); } catch (e) {} },
  };

  /* theme */
  const theme = store.get('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;

  const FLAKE = `<img class="flake" src="${root}assets/snowflake-mark.svg" alt="Snowflake">`;
  const PARTNER = `<span class="partner"><img src="${root}assets/logos/tv4.png" alt="TV4"><img src="${root}assets/logos/mtv.png" alt="MTV"></span>`;

  /* top bar */
  const top = document.createElement('header');
  top.className = 'topbar';
  const navIds = ['hackathon', 'golden', 'bestpractices', 'resources'];
  top.innerHTML = `
    <button class="icon-btn menu-btn" id="menuBtn" aria-label="Menu">☰</button>
    <a class="brand" href="${root}index.html">${FLAKE}${PARTNER}<span>Snowflake × TVM <small>Hackathon</small></span></a>
    <nav class="topnav">${navIds.map(id => {
      const p = PAGES.find(x => x.id === id);
      const label = id === 'golden' ? 'Build path' : p.title;
      const active = (id === current || (id === 'golden' && ['golden','discover','gq','semantic','agent','mcp'].includes(current))) ? 'active' : '';
      return `<a class="${active}" href="${root}${p.href}">${label}</a>`;
    }).join('')}</nav>
    <button class="icon-btn" id="themeBtn" aria-label="Toggle theme">${theme === 'dark' ? '☀' : '☾'}</button>`;
  body.prepend(top);
  document.getElementById('themeBtn').addEventListener('click', e => {
    const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t; store.set('theme', t);
    e.currentTarget.textContent = t === 'dark' ? '☀' : '☾';
  });
  document.getElementById('menuBtn').addEventListener('click', () => body.classList.toggle('nav-open'));

  /* sidebar */
  const sb = document.querySelector('.sidebar');
  const done = store.get('done', {});
  function renderSidebar() {
    if (!sb) return;
    const docPages = PAGES.filter(p => p.group);
    const buildPages = docPages.filter(p => p.group === 'Build path');
    const pct = Math.round(100 * buildPages.filter(p => done[p.id]).length / buildPages.length);
    let html = `<h5>Build path progress</h5><div class="progress"><i style="width:${pct}%"></i></div><small>${pct}% complete</small>`;
    let g = null;
    docPages.forEach(p => {
      if (p.group !== g) { g = p.group; html += `<h5>${g}</h5>`; }
      html += `<a class="${p.id === current ? 'active' : ''} ${p.group === 'Build path' && done[p.id] ? 'done' : ''}" href="${root}${p.href}"><span class="dot"></span>${p.title}</a>`;
    });
    sb.innerHTML = html;
  }
  renderSidebar();

  /* pager + "mark complete" */
  const content = document.querySelector('.content');
  const docIdx = PAGES.filter(p => p.group).findIndex(p => p.id === current);
  if (content && current !== 'home' && docIdx >= 0) {
    const docPages = PAGES.filter(p => p.group);
    const i = docIdx;
    const prev = docPages[i - 1], next = docPages[i + 1];
    const mark = document.createElement('div');
    mark.style.marginTop = '48px';
    if (docPages[i].group === 'Build path') {
    mark.innerHTML = `<button class="btn ${done[current] ? 'btn-outline' : 'btn-primary'}" id="markBtn">${done[current] ? '✓ Completed' : 'Mark this page complete'}</button>`;
    content.appendChild(mark);
    document.getElementById('markBtn').addEventListener('click', e => {
      done[current] = !done[current]; store.set('done', done); renderSidebar();
      e.currentTarget.textContent = done[current] ? '✓ Completed' : 'Mark this page complete';
      e.currentTarget.className = 'btn ' + (done[current] ? 'btn-outline' : 'btn-primary');
    });
    }
    const pager = document.createElement('nav');
    pager.className = 'pager';
    pager.innerHTML = (prev ? `<a href="${root}${prev.href}"><small>← Previous</small>${prev.title}</a>` : '<span></span>') +
                      (next ? `<a class="next" href="${root}${next.href}"><small>Next →</small>${next.title}</a>` : '');
    content.appendChild(pager);
  }

  /* footer */
  const f = document.createElement('footer');
  f.innerHTML = `<img class="foot-logo" src="${root}assets/snowflake-logo.svg" alt="Snowflake"> <span class="partner big"><img src="${root}assets/logos/tv4.png" alt="TV4"><img src="${root}assets/logos/mtv.png" alt="MTV"></span><br>Snowflake × TVM Hackathon · 6 November 2026 · TV4 Media, Stockholm<br>4 teams · real data · one MVP each · built with dbt, Semantic Views, Cortex Agents &amp; MCP`;
  body.appendChild(f);

  /* copy buttons */
  document.querySelectorAll('pre').forEach(pre => {
    const b = document.createElement('button');
    b.className = 'copy'; b.textContent = 'Copy';
    b.addEventListener('click', () => {
      const text = pre.querySelector('code') ? pre.querySelector('code').innerText : pre.innerText;
      navigator.clipboard.writeText(text).then(() => { b.textContent = 'Copied ✓'; setTimeout(() => b.textContent = 'Copy', 1500); });
    });
    pre.appendChild(b);
  });

  /* persistent checklists */
  document.querySelectorAll('ul.check').forEach((ul, li_i) => {
    const key = 'chk:' + (ul.dataset.key || (current + ':' + li_i));
    const state = store.get(key, {});
    ul.querySelectorAll('li').forEach((li, i) => {
      const cb = li.querySelector('input');
      if (!cb) return;
      cb.checked = !!state[i]; li.classList.toggle('on', cb.checked);
      cb.addEventListener('change', () => { state[i] = cb.checked; store.set(key, state); li.classList.toggle('on', cb.checked); });
    });
  });

  /* tabs */
  document.querySelectorAll('.tabs').forEach(t => {
    const btns = t.querySelectorAll('.tab-btns button'), panels = t.querySelectorAll('.tab-panel');
    btns.forEach((b, i) => b.addEventListener('click', () => {
      btns.forEach(x => x.classList.remove('on')); panels.forEach(x => x.classList.remove('on'));
      b.classList.add('on'); panels[i].classList.add('on');
    }));
  });

  /* TVM's names for the day. Leave empty: each person fills them in once in the "Your setup" box
     (golden path, step 1), saved in their browser. A value set here wins for everyone. */
  const CONFIG = {
    DEV_DB:       '',   // database the team schemas go in (preflight row 6)
    DEV_ROLE:     '',   // dev role (preflight row 1)
    DEV_WH:       '',   // dev warehouse (preflight row 2)
    MARTS_DB:     '',   // database with TVM's marts
    MARTS_SCHEMA: '',   // schema with TVM's marts
  };
  const SETUP_LABELS = { DEV_ROLE: 'Dev role', DEV_WH: 'Dev warehouse', DEV_DB: 'Dev database',
                         MARTS_DB: 'Marts database', MARTS_SCHEMA: 'Marts schema' };
  const cfgValue = k => CONFIG[k] || (JSON.parse(localStorage.getItem('tvm:cfg') || '{}')[k] || '').trim().toUpperCase();
  const CFG_TOKENS = Object.keys(CONFIG).map(k => '{{' + k + '}}');

  /* team picker: fills {{N}}, {{SCHEMA}}, {{FOLDER}}, {{TARGET}} and the setup values in code everywhere */
  const TOKENS = ['{{N}}', '{{SCHEMA}}', '{{FOLDER}}', '{{TARGET}}', ...CFG_TOKENS];
  function teamValues(n) {
    const cfg = Object.fromEntries(Object.keys(CONFIG).map(k => ['{{' + k + '}}', cfgValue(k) || '<' + k + '>']));
    return n ? { ...cfg, '{{N}}': n, '{{SCHEMA}}': 'HACK_TEAM_' + n,
                 '{{FOLDER}}': 'team_' + n + '/models', '{{TARGET}}': 'team_' + n }
             : { ...cfg, '{{N}}': 'n', '{{SCHEMA}}': 'HACK_TEAM_n',
                 '{{FOLDER}}': 'team_n/models', '{{TARGET}}': 'team_n' };
  }
  document.querySelectorAll('code, .tpl').forEach(c => { if (TOKENS.some(t => c.textContent.includes(t))) c.dataset.tpl = c.textContent; });
  function applyTeam(n) {
    const v = teamValues(n);
    document.querySelectorAll('[data-tpl]').forEach(el => {
      el.textContent = TOKENS.reduce((s, t) => s.replaceAll(t, v[t]), el.dataset.tpl);
    });
    document.querySelectorAll('a[data-href]').forEach(a => { a.href = a.dataset.href.replaceAll('{{N}}', n || '1'); });
    document.querySelectorAll('.team-select').forEach(s => { s.value = n || ''; });
    document.querySelectorAll('[data-team-label]').forEach(el => { el.textContent = n ? 'Team ' + n : 'Pick your team'; });
  }
  /* "Your setup" box: <div data-setup></div> */
  document.querySelectorAll('[data-setup]').forEach(box => {
    const saved = JSON.parse(localStorage.getItem('tvm:cfg') || '{}');
    box.className = 'setup-box';
    box.innerHTML = Object.entries(SETUP_LABELS).map(([k, l]) =>
      `<label><span>${l}</span><input data-cfg="${k}" spellcheck="false" autocomplete="off" placeholder="${k}"` +
      (CONFIG[k] ? ` value="${CONFIG[k]}" disabled` : '') + `></label>`).join('');
    box.querySelectorAll('input').forEach(i => {
      if (!CONFIG[i.dataset.cfg]) i.value = saved[i.dataset.cfg] || '';
      i.addEventListener('input', () => {
        const cur = JSON.parse(localStorage.getItem('tvm:cfg') || '{}');
        cur[i.dataset.cfg] = i.value; localStorage.setItem('tvm:cfg', JSON.stringify(cur));
        applyTeam(store.get('team'));
      });
    });
  });
  const picker = document.createElement('select');
  picker.className = 'team-select'; picker.setAttribute('aria-label', 'Your team');
  picker.innerHTML = '<option value="">Your team…</option>' + [1, 2, 3, 4].map(n => `<option value="${n}">Team ${n}</option>`).join('');
  top.insertBefore(picker, document.getElementById('themeBtn'));
  document.querySelectorAll('.team-select').forEach(s => s.addEventListener('change', e => {
    store.set('team', e.target.value); applyTeam(e.target.value);
  }));
  applyTeam(store.get('team', ''));

  /* live "now" bar: current block + next checkpoint, Stockholm time, on the day only.
     Preview any time with ?now=10:40 */
  const AGENDA = [
    ['09:30', '09:50', 'Kick-off + preflight', 'build/golden-path.html#s1', 'Team picked, preflight green, setup filled in'],
    ['09:50', '10:30', 'Golden path', 'build/golden-path.html', 'All teams have an agent that answers in CoWork'],
    ['10:30', '11:15', 'Sprint 1 · Discover', 'build/discover.html', 'Golden questions sheet filled in, tables chosen'],
    ['11:15', '12:15', 'Sprint 2 · Semantic view', 'build/semantic-view.html', '3+ metrics, 5+ verified queries, clean build'],
    ['12:15', '13:15', 'Lunch + stand-up', 'index.html#agenda', 'One minute per team: works, blocked, next'],
    ['13:15', '14:10', 'Sprint 3 · Agent & MCP', 'build/agent.html', '7/10 golden questions in CoWork, Claude Code connected'],
    ['14:10', '14:45', 'Demos', 'index.html#agenda', '8 minutes per team'],
    ['14:45', '15:00', 'MVP handoff', 'mvp-handoff.html', 'Owner named, project zip downloaded'],
  ];
  const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  function stockholmNow() {
    const q = new URLSearchParams(location.search);
    if (q.get('now')) return { day: true, m: mins(q.get('now')) };
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).map(x => [x.type, x.value]));
    return { day: `${p.year}-${p.month}-${p.day}` === '2026-11-06', m: +p.hour * 60 + +p.minute };
  }
  function renderNow() {
    const { day, m } = stockholmNow();
    let bar = document.getElementById('nowbar');
    const idx = AGENDA.findIndex(a => m >= mins(a[0]) && m < mins(a[1]));
    document.querySelectorAll('.tl-item').forEach((el, i) => el.classList.toggle('now', day && i === idx));
    if (!day || m < mins('09:00') || m >= mins('15:30')) { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement('div'); bar.id = 'nowbar'; bar.className = 'nowbar'; top.after(bar); }
    if (idx < 0) {
      bar.innerHTML = m < mins('09:30') ? `<span class="nb-now">NOW</span> <a href="${root}index.html#agenda"><b>Starting soon</b></a> <span class="nb-time">kick-off at 09:30 · in ${mins('09:30') - m} min</span><span class="nb-goal">Open this site and pick your team in the top menu</span>`
                                       : `<b>That's a wrap!</b> · thank you, see you at the follow-up`;
      return;
    }
    const [s, e, name, href, goal] = AGENDA[idx];
    const left = mins(e) - m, total = mins(e) - mins(s);
    const next = AGENDA[idx + 1];
    bar.innerHTML = `<span class="nb-now">NOW</span> <a href="${root}${href}"><b>${name}</b></a> <span class="nb-time">until ${e} · ${left} min left</span>`
      + `<span class="nb-goal"><b>Checkpoint:</b> ${goal}</span>`
      + (next ? `<span class="nb-next">Next ${next[0]}: ${next[2]}</span>` : '')
      + `<i style="width:${Math.round(100 * (total - left) / total)}%"></i>`;
    bar.classList.toggle('soon', left <= 5);
  }
  renderNow(); setInterval(renderNow, 30000);

  /* countdown */
  const cd = document.getElementById('countdown');
  if (cd) {
    const target = new Date('2026-11-06T09:30:00+01:00').getTime();
    const tick = () => {
      let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
      const d = Math.floor(s / 86400); s -= d * 86400; const h = Math.floor(s / 3600); s -= h * 3600; const m = Math.floor(s / 60); s -= m * 60;
      cd.innerHTML = [['days', d], ['hours', h], ['min', m], ['sec', s]].map(([l, v]) => `<div><b>${String(v).padStart(2, '0')}</b><span>${l}</span></div>`).join('');
    };
    tick(); setInterval(tick, 1000);
  }

  /* typing chat demo */
  const chat = document.getElementById('chat');
  if (chat) {
    const script = JSON.parse(document.getElementById('chat-script').textContent);
    let idx = 0;
    const next = () => {
      if (idx >= script.length) { setTimeout(() => { chat.innerHTML = ''; idx = 0; next(); }, 6000); return; }
      const m = script[idx++];
      const row = document.createElement('div');
      row.className = 'row ' + m.who;
      row.innerHTML = `<div class="who">${m.who === 'u' ? 'You' : 'AI'}</div><div class="${m.tool ? 'tool' : ''}"></div>`;
      chat.appendChild(row);
      const target = row.lastChild; let c = 0;
      const t = setInterval(() => {
        target.textContent = m.text.slice(0, ++c);
        if (c >= m.text.length) { clearInterval(t); setTimeout(next, m.tool ? 500 : 1100); }
      }, m.who === 'u' ? 28 : 12);
    };
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { next(); io.disconnect(); } });
    io.observe(chat);
  }

  /* animated bars */
  document.querySelectorAll('.bars').forEach(b => {
    const io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      b.querySelectorAll('div').forEach(d => d.style.height = d.dataset.h + '%'); io.disconnect();
    });
    b.querySelectorAll('div').forEach(d => d.style.height = '2%');
    io.observe(b);
  });

  /* scroll reveal */
  const ro = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => ro.observe(el));
})();
