// ============================================================
// 📦 ui-dashboard.js — الرئيسية + المحفظة + الأشخاص
// ============================================================
// ⚠️ يجب تحميله بعد core.js و ui-pages.js
// ============================================================

// ============ 📊 DASHBOARD ============
function renderDashboard() {
  const now = new Date(), m = now.getMonth(), y = now.getFullYear();
  const mTx = state.transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === m && d.getFullYear() === y;
  });
  const inc = mTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const exp = mTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const tInc = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const tExp = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const debt = calcTotalDebt('debt'), rec = calcTotalDebt('receivable'), wi = calcWorkIncome();

  const el1 = document.getElementById('stat-balance');
  if (el1) el1.textContent = fmt(tInc - tExp) + ' ' + cur();
  const el2 = document.getElementById('stat-income');
  if (el2) el2.textContent = fmt(inc) + ' ' + cur();
  const el3 = document.getElementById('stat-expense');
  if (el3) el3.textContent = fmt(exp) + ' ' + cur();
  const el4 = document.getElementById('stat-net');
  if (el4) el4.textContent = fmt(inc - exp) + ' ' + cur();
  const el5 = document.getElementById('stat-debt');
  if (el5) el5.textContent = fmt(debt) + ' ' + cur();
  const el6 = document.getElementById('stat-receivable');
  if (el6) el6.textContent = fmt(rec) + ' ' + cur();
  const el7 = document.getElementById('stat-work');
  if (el7) el7.textContent = fmt(wi) + ' ' + cur();
  const el8 = document.getElementById('stat-count');
  if (el8) el8.textContent = state.transactions.length;

  renderSmartCircle();
  renderInsights(mTx, inc, exp);
  renderRecentTransactions();
}

function renderSmartCircle() {
  const sg = document.getElementById('smart-circle-segments');
  const lg = document.getElementById('smart-circle-legend');
  if (!sg || !lg) return;

  const tI = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const tE = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const wI = calcWorkIncome(), d = calcTotalDebt('debt'), r = calcTotalDebt('receivable');

  const data = [
    { n: '💰 الدخل', v: tI, c: '#10b981' },
    { n: '💸 المصروفات', v: tE, c: '#ef4444' },
    { n: '💼 العمل', v: wI, c: '#7c3aed' },
    { n: '🔴 الديون', v: d, c: '#f59e0b' },
    { n: '🟢 المستحقات', v: r, c: '#3b82f6' }
  ].filter(x => x.v > 0);

  const tot = data.reduce((s, x) => s + x.v, 0);
  const totalEl = document.getElementById('circle-total');
  if (totalEl) totalEl.textContent = fmt(tot);
  const curEl = document.getElementById('circle-currency');
  if (curEl) curEl.textContent = cur();

  if (tot === 0) {
    sg.innerHTML = '';
    lg.innerHTML = '<div class="empty" style="padding:20px"><p>لا توجد بيانات</p></div>';
    return;
  }

  const rad = 80, cir = 2 * Math.PI * rad;
  let off = 0, sH = '', lH = '';
  data.forEach((x, i) => {
    const p = x.v / tot, dl = p * cir;
    sH += `<circle class="smart-circle-segment" cx="100" cy="100" r="${rad}" stroke="${x.c}" stroke-dasharray="${dl} ${cir - dl}" stroke-dashoffset="-${off}" style="color:${x.c}"/>`;
    off += dl;
    lH += `<div class="legend-item" onclick="highlightSegment(${i})"><div class="legend-dot" style="background:${x.c}"></div><div class="legend-info"><div class="legend-name">${x.n}</div><div class="legend-value" style="color:${x.c}">${fmt(x.v)} ${cur()}</div></div><div class="legend-percent">${(p * 100).toFixed(1)}%</div></div>`;
  });
  sg.innerHTML = sH;
  lg.innerHTML = lH;
}

function highlightSegment(i) {
  document.querySelectorAll('.legend-item').forEach((e, j) => e.classList.toggle('active', j === i));
  document.querySelectorAll('.smart-circle-segment').forEach((e, j) => {
    if (j === i) {
      e.style.strokeWidth = '18';
      e.style.filter = 'drop-shadow(0 0 10px currentColor)';
    } else {
      e.style.strokeWidth = '14';
      e.style.filter = 'none';
    }
  });
}

function renderInsights(mTx, inc, exp) {
  const ic = document.getElementById('insights-container');
  if (!ic) return;
  if (state.transactions.length === 0 && state.workPayments.length === 0) {
    ic.innerHTML = '<div class="empty"><span class="material-icons">auto_awesome</span><p>أضف معاملاتك لتظهر الرؤى</p></div>';
    return;
  }
  let h = '';
  if (inc > exp && inc > 0) {
    h += `<div class="insight-card"><div class="title"><span class="material-icons">trending_up</span>أداء ممتاز</div><div>دخل الشهر أعلى من المصروفات بـ <strong>${fmt(inc - exp)} ${cur()}</strong></div></div>`;
  } else if (exp > inc && exp > 0) {
    h += `<div class="insight-card"><div class="title"><span class="material-icons">warning</span>انتبه للمصروفات</div><div>مصروفاتك أعلى من دخلك بـ <strong>${fmt(exp - inc)} ${cur()}</strong></div></div>`;
  }
  ic.innerHTML = h || '<div class="empty"><p>لا توجد رؤى</p></div>';
}

function renderRecentTransactions() {
  const rc = document.getElementById('recent-transactions');
  if (!rc) return;
  const r = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  if (r.length === 0) {
    rc.innerHTML = '<div class="empty"><span class="material-icons">receipt_long</span><p>لا توجد معاملات</p></div>';
    return;
  }
  rc.innerHTML = r.map(t => {
    const c = state.categories.find(x => x.id === t.category);
    return `<div class="list-item"><div class="icon-box ${t.type}"><span class="material-icons">${t.type === 'income' ? 'arrow_downward' : 'arrow_upward'}</span></div><div class="info"><div class="title">${escapeHtml(t.desc || (c ? c.name : ''))}</div><div class="sub">${new Date(t.date).toLocaleDateString('ar')}</div></div><div class="amount ${t.type}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</div></div>`;
  }).join('');
}

// ============ 💼 WALLET ============
function initTransactionModal() {
  document.getElementById('transaction-id').value = '';
  document.getElementById('transaction-modal-title').textContent = 'إضافة معاملة';
  const n = new Date();
  document.getElementById('transaction-date').value = new Date(n.getTime() - n.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  document.getElementById('transaction-amount').value = '';
  document.getElementById('transaction-desc').value = '';
  document.querySelectorAll('#modal-transaction .radio-group .radio-option').forEach((o, i) => o.classList.toggle('active', i === 0));
  document.getElementById('transaction-category').innerHTML = state.categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
}

function filterWallet(f, b) {
  walletFilter = f;
  document.querySelectorAll('#wallet-tabs .tab').forEach(t => t.classList.remove('active'));
  b.classList.add('active');
  renderTransactions();
}

function toggleSearchFilters() {
  searchFiltersOpen = !searchFiltersOpen;
  const f = document.getElementById('search-filters-advanced');
  const btn = document.getElementById('search-toggle-btn');
  if (searchFiltersOpen) { f.classList.add('open'); btn.classList.add('active'); }
  else { f.classList.remove('open'); btn.classList.remove('active'); }
  localStorage.setItem('searchFiltersOpen', searchFiltersOpen ? '1' : '0');
}

function clearSearch() {
  document.getElementById('wallet-search').value = '';
  searchTransactions();
}

function resetSearchFilters() {
  ['wallet-search', 'search-date-from', 'search-date-to', 'search-amount-min', 'search-amount-max', 'search-category', 'search-type'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  searchTransactions();
  toast('🔄 تم إعادة تعيين الفلاتر');
}

function searchTransactions() {
  const q = (document.getElementById('wallet-search')?.value || '').toLowerCase().trim();
  const df = document.getElementById('search-date-from')?.value || '';
  const dt = document.getElementById('search-date-to')?.value || '';
  const amin = document.getElementById('search-amount-min')?.value || '';
  const amax = document.getElementById('search-amount-max')?.value || '';
  const cat = document.getElementById('search-category')?.value || '';
  const type = document.getElementById('search-type')?.value || '';
  const cb = document.getElementById('search-clear-btn');
  if (cb) { if (q) cb.classList.add('visible'); else cb.classList.remove('visible'); }

  let f = [...state.transactions];
  if (walletFilter !== 'all') f = f.filter(x => x.type === walletFilter);
  if (q) f = f.filter(x => {
    const c = state.categories.find(y => y.id === x.category);
    const cn = c ? c.name.toLowerCase() : '';
    return (x.desc || '').toLowerCase().includes(q) || cn.includes(q);
  });
  if (df) f = f.filter(x => x.date.slice(0, 10) >= df);
  if (dt) f = f.filter(x => x.date.slice(0, 10) <= dt);
  if (amin) f = f.filter(x => Number(x.amount) >= Number(amin));
  if (amax) f = f.filter(x => Number(x.amount) <= Number(amax));
  if (cat) f = f.filter(x => x.category === cat);
  if (type) f = f.filter(x => x.type === type);
  f.sort((a, b) => new Date(b.date) - new Date(a.date));

  const ce = document.getElementById('search-results-count');
  const hf = q || df || dt || amin || amax || cat || type;
  if (ce) ce.textContent = hf ? `📊 ${f.length} معاملة` : '';

  renderTransactionsList(f);
}

function renderTransactionsList(txs) {
  const c = document.getElementById('transactions-list');
  if (!c) return;
  if (!txs) txs = [...state.transactions];
  txs.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (txs.length === 0) {
    c.innerHTML = '<div class="empty"><span class="material-icons">receipt_long</span><p>لا توجد معاملات</p></div>';
    return;
  }
  c.innerHTML = txs.map(x => {
    const ct = state.categories.find(y => y.id === x.category);
    return `<div class="list-item"><div class="icon-box ${x.type}"><span class="material-icons">${x.type === 'income' ? 'arrow_downward' : 'arrow_upward'}</span></div><div class="info"><div class="title">${escapeHtml(x.desc || (ct ? ct.name : ''))}</div><div class="sub">${new Date(x.date).toLocaleString('ar')}</div></div><div class="amount ${x.type}">${x.type === 'income' ? '+' : '-'}${fmt(x.amount)}</div><div class="actions"><button onclick="editTransaction('${x.id}')"><span class="material-icons">edit</span></button><button class="delete-btn" onclick="deleteTransaction('${x.id}')"><span class="material-icons">delete</span></button></div></div>`;
  }).join('');
}

function renderTransactions() {
  const cs = document.getElementById('search-category');
  if (cs) {
    const cv = cs.value;
    cs.innerHTML = '<option value="">🏷️ جميع الفئات</option>' + state.categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    cs.value = cv;
  }
  searchTransactions();
}

function saveTransaction() {
  const a = document.getElementById('transaction-amount').value;
  if (!a || Number(a) <= 0) { toast('المبلغ غير صحيح', 'error'); return; }
  const id = document.getElementById('transaction-id').value;
  const tp = document.querySelector('#modal-transaction .radio-group .radio-option.active').dataset.type;
  const d = {
    id: id || genId(),
    date: document.getElementById('transaction-date').value,
    type: tp,
    category: document.getElementById('transaction-category').value,
    amount: Number(a),
    desc: document.getElementById('transaction-desc').value.trim()
  };
  if (id) {
    const i = state.transactions.findIndex(x => x.id === id);
    state.transactions[i] = d;
  } else state.transactions.push(d);
  save();
  closeModal('transaction');
  renderTransactions();
  renderDashboard();
  toast('تم الحفظ');
}

function editTransaction(id) {
  const t = state.transactions.find(x => x.id === id);
  if (!t) return;
  openModal('transaction');
  document.getElementById('transaction-id').value = t.id;
  document.getElementById('transaction-modal-title').textContent = 'تعديل معاملة';
  document.getElementById('transaction-date').value = t.date;
  document.getElementById('transaction-amount').value = t.amount;
  document.getElementById('transaction-desc').value = t.desc || '';
  document.querySelectorAll('#modal-transaction .radio-group .radio-option').forEach(o => o.classList.toggle('active', o.dataset.type === t.type));
  setTimeout(() => document.getElementById('transaction-category').value = t.category, 50);
}

function deleteTransaction(id) {
  showConfirm('حذف', 'هل تريد حذف هذه المعاملة؟', () => {
    state.transactions = state.transactions.filter(t => t.id !== id);
    save();
    renderTransactions();
    renderDashboard();
    toast('تم الحذف');
  });
}

// ============ 🏷️ CATEGORIES ============
function renderCategories() {
  const c = document.getElementById('categories-list');
  if (!c) return;
  if (state.categories.length === 0) {
    c.innerHTML = '<div class="empty"><p>لا توجد فئات</p></div>';
    return;
  }
  c.innerHTML = state.categories.map(x => `<div class="list-item"><div class="icon-box ${x.type}"><span class="material-icons">category</span></div><div class="info"><div class="title">${escapeHtml(x.name)}</div><div class="sub">${x.type === 'income' ? '💰 دخل' : '💸 مصروف'}</div></div><button class="delete-btn" onclick="deleteCategory('${x.id}')"><span class="material-icons">delete</span></button></div>`).join('');
}

function saveCategory() {
  const n = document.getElementById('category-name').value.trim();
  if (!n) { toast('أدخل اسم الفئة', 'error'); return; }
  const tp = document.querySelector('#modal-category .radio-group .radio-option.active').dataset.type;
  state.categories.push({ id: genId(), name: n, type: tp });
  save();
  document.getElementById('category-name').value = '';
  renderCategories();
  toast('تمت الإضافة');
}

function deleteCategory(id) {
  showConfirm('حذف', 'هل تريد حذف هذه الفئة؟', () => {
    state.categories = state.categories.filter(c => c.id !== id);
    save();
    renderCategories();
    toast('تم الحذف');
  });
}

// ============ 👥 PEOPLE ============
function initPersonModal() {
  document.getElementById('person-id').value = '';
  document.getElementById('person-modal-title').textContent = 'إضافة شخص';
  ['person-name', 'person-phone', 'person-email', 'person-notes'].forEach(i => document.getElementById(i).value = '');
}

function savePerson() {
  const n = document.getElementById('person-name').value.trim();
  if (!n) { toast('أدخل الاسم', 'error'); return; }
  const id = document.getElementById('person-id').value;
  const d = {
    id: id || genId(),
    name: n,
    phone: document.getElementById('person-phone').value.trim(),
    email: document.getElementById('person-email').value.trim(),
    notes: document.getElementById('person-notes').value.trim()
  };
  if (id) {
    const i = state.people.findIndex(x => x.id === id);
    state.people[i] = d;
  } else state.people.push(d);
  save();
  closeModal('person');
  renderPeople();
  toast('تم الحفظ');
}

function renderPeople() {
  const dEl = document.getElementById('people-debt');
  const rEl = document.getElementById('people-receivable');
  if (dEl) dEl.textContent = fmt(calcTotalDebt('debt')) + ' ' + cur();
  if (rEl) rEl.textContent = fmt(calcTotalDebt('receivable')) + ' ' + cur();

  const n = calcTotalDebt('receivable') - calcTotalDebt('debt');
  const e = document.getElementById('people-net');
  if (e) {
    e.textContent = fmt(n) + ' ' + cur();
    e.style.color = n >= 0 ? 'var(--green)' : 'var(--red)';
  }

  const c = document.getElementById('people-list');
  if (!c) return;
  if (state.people.length === 0) {
    c.innerHTML = '<div class="empty"><span class="material-icons">people</span><p>لا يوجد أشخاص</p></div>';
    return;
  }
  c.innerHTML = state.people.map(p => {
    const r = calcPersonReport(p.id);
    return `<div class="list-item"><div class="icon-box neutral"><span class="material-icons">person</span></div><div class="info" onclick="openPersonDetail('${p.id}')" style="cursor:pointer"><div class="title">${escapeHtml(p.name)}</div><div class="sub" style="color:${r.sc};font-weight:700">${r.st}</div></div><div class="actions"><button onclick="openPersonDetail('${p.id}')"><span class="material-icons">visibility</span></button><button onclick="editPerson('${p.id}')"><span class="material-icons">edit</span></button><button class="delete-btn" onclick="deletePerson('${p.id}')"><span class="material-icons">delete</span></button></div></div>`;
  }).join('');
}

function calcPersonReport(pid) {
  const pd = state.debts.filter(d => d.personId === pid);
  const tD = pd.filter(d => d.type === 'debt').reduce((s, d) => s + Number(d.amount), 0);
  const tR = pd.filter(d => d.type === 'receivable').reduce((s, d) => s + Number(d.amount), 0);
  const pM = state.payments
    .filter(p => {
      const d = state.debts.find(x => x.id === p.debtId);
      return d && d.type === 'debt' && d.personId === pid;
    })
    .reduce((s, p) => s + Number(p.amount), 0);
  const pT = state.payments
    .filter(p => {
      const d = state.debts.find(x => x.id === p.debtId);
      return d && d.type === 'receivable' && d.personId === pid;
    })
    .reduce((s, p) => s + Number(p.amount), 0);
  const rD = Math.max(0, tD - pM);
  const rR = Math.max(0, tR - pT);
  const n = rR - rD;
  let s = 'clear', st = '✅ الحساب مغلق', sc = 'var(--muted)';
  if (n > 0.01) { s = 'owed-to-me'; st = `🟢 مدين لك بـ ${fmt(n)} ${cur()}`; sc = 'var(--green)'; }
  else if (n < -0.01) { s = 'i-owe'; st = `🔴 أنت مدين له بـ ${fmt(Math.abs(n))} ${cur()}`; sc = 'var(--red)'; }
  return { tD, tR, pM, pT, rD, rR, n, s, st, sc };
}

function openPersonDetail(id) {
  currentPersonId = id;
  document.getElementById('people-list-view').style.display = 'none';
  document.getElementById('person-detail-view').classList.add('active');
  renderPersonDetail();
  window.scrollTo(0, 0);
}

function closePersonDetail() {
  currentPersonId = null;
  const lv = document.getElementById('people-list-view');
  const dv = document.getElementById('person-detail-view');
  if (lv) lv.style.display = 'block';
  if (dv) dv.classList.remove('active');
}

function renderPersonDetail() {
  const p = state.people.find(x => x.id === currentPersonId);
  if (!p) { closePersonDetail(); return; }
  const r = calcPersonReport(p.id);
  const pd = state.debts.filter(d => d.personId === p.id);

  const nr = `<div class="net-report"><div class="net-report-title"><span class="material-icons">account_balance</span>📊 تقرير الصافي</div><div class="net-report-grid"><div class="net-report-item"><div class="label">🔴 إجمالي الديون</div><div class="value" style="color:var(--red)">${fmt(r.tD)} ${cur()}</div></div><div class="net-report-item"><div class="label">🟢 إجمالي المستحقات</div><div class="value" style="color:var(--green)">${fmt(r.tR)} ${cur()}</div></div><div class="net-report-item"><div class="label">💸 دفعاتك له</div><div class="value" style="color:var(--orange)">${fmt(r.pM)} ${cur()}</div></div><div class="net-report-item"><div class="label">💰 دفعاته لك</div><div class="value" style="color:var(--primary)">${fmt(r.pT)} ${cur()}</div></div><div class="net-report-item"><div class="label">📉 المتبقي من ديونك</div><div class="value" style="color:var(--red)">${fmt(r.rD)} ${cur()}</div></div><div class="net-report-item"><div class="label">📈 المتبقي من مستحقاتك</div><div class="value" style="color:var(--green)">${fmt(r.rR)} ${cur()}</div></div></div><div class="net-final"><div class="label"><span class="material-icons" style="font-size:18px">balance</span>الصافي النهائي</div><div class="value ${r.n > 0.01 ? 'positive' : r.n < -0.01 ? 'negative' : ''}">${r.n > 0.01 ? '+' : ''}${r.n < -0.01 ? '-' : ''}${fmt(Math.abs(r.n))} ${cur()}</div><div class="status ${r.s === 'clear' ? 'clear' : r.s === 'owed-to-me' ? 'paid' : 'owed'}">${r.st}</div></div></div>`;

  const dh = pd.length ? pd.map(d => {
    const paid = state.payments.filter(x => x.debtId === d.id).reduce((s, x) => s + Number(x.amount), 0);
    const rem = Math.max(0, Number(d.amount) - paid);
    const is = rem <= 0.01;
    return `<div class="list-item" style="${is ? 'opacity:.5' : ''}"><div class="icon-box ${d.type === 'debt' ? 'expense' : 'income'}"><span class="material-icons">${d.type === 'debt' ? 'arrow_upward' : 'arrow_downward'}</span></div><div class="info"><div class="title">${escapeHtml(d.desc || (d.type === 'debt' ? 'دين عليك' : 'مستحق لك'))} ${is ? '✅' : ''}</div><div class="sub">${new Date(d.date).toLocaleDateString('ar')} • المتبقي: <strong>${fmt(rem)} ${cur()}</strong></div></div><div class="actions">${!is ? `<button class="settle-btn" onclick="settleDebt('${d.id}')"><span class="material-icons">check_circle</span></button><button onclick="openPaymentFor('${d.id}')"><span class="material-icons" style="color:var(--accent)">payments</span></button>` : ''}<button class="delete-btn" onclick="deleteDebt('${d.id}')"><span class="material-icons">delete</span></button></div></div>`;
  }).join('') : '<div class="empty"><p>لا توجد ديون</p></div>';

  document.getElementById('person-detail-content').innerHTML = `<div class="person-header"><div class="person-avatar"><span class="material-icons">person</span></div><div class="person-info"><div class="name">${escapeHtml(p.name)}</div><div class="contact">${escapeHtml(p.phone || '')} ${p.email ? '• ' + escapeHtml(p.email) : ''}</div></div><div style="display:flex;gap:6px"><button class="icon-btn" onclick="editPerson('${p.id}')"><span class="material-icons">edit</span></button><button class="icon-btn delete-btn" onclick="deletePerson('${p.id}')"><span class="material-icons">delete</span></button></div></div>${nr}<div class="btn-row" style="margin-bottom:14px"><button class="btn btn-ghost" onclick="openDebtFor('${p.id}','debt')"><span class="material-icons">add</span>🔴 دين عليك</button><button class="btn btn-ghost" onclick="openDebtFor('${p.id}','receivable')"><span class="material-icons">add</span>🟢 مستحق لك</button></div>${p.notes ? `<div style="background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.3);border-radius:12px;padding:12px;font-size:13px;color:var(--primary);margin-bottom:14px"><strong>📝 ملاحظات:</strong> ${escapeHtml(p.notes)}</div>` : ''}<div class="section"><div class="section-title"><span class="material-icons">handshake</span>الديون والمستحقات (${pd.length})</div>${dh}</div>`;
}

function editPerson(id) {
  const p = state.people.find(x => x.id === id);
  if (!p) return;
  openModal('person');
  document.getElementById('person-id').value = p.id;
  document.getElementById('person-modal-title').textContent = 'تعديل شخص';
  document.getElementById('person-name').value = p.name;
  document.getElementById('person-phone').value = p.phone || '';
  document.getElementById('person-email').value = p.email || '';
  document.getElementById('person-notes').value = p.notes || '';
}

function deletePerson(id) {
  const p = state.people.find(x => x.id === id);
  showConfirm('حذف الشخص', `سيتم حذف "${p ? escapeHtml(p.name) : ''}" وجميع ديونه.`, () => {
    state.people = state.people.filter(x => x.id !== id);
    const di = state.debts.filter(d => d.personId === id).map(d => d.id);
    state.debts = state.debts.filter(d => d.personId !== id);
    state.payments = state.payments.filter(x => !di.includes(x.debtId));
    save();
    closePersonDetail();
    renderPeople();
    renderDashboard();
    toast('تم الحذف');
  });
}

function openDebtFor(pid, tp) {
  openModal('debt');
  document.getElementById('debt-person-id').value = pid;
  document.querySelectorAll('#modal-debt .radio-group .radio-option').forEach(o => o.classList.toggle('active', o.dataset.type === tp));
}

function initDebtModal() {
  document.getElementById('debt-person-id').value = '';
  document.getElementById('debt-amount').value = '';
  document.getElementById('debt-desc').value = '';
  document.querySelectorAll('#modal-debt .radio-group .radio-option').forEach((o, i) => o.classList.toggle('active', i === 0));
}

function saveDebt() {
  const p = document.getElementById('debt-person-id').value;
  const a = document.getElementById('debt-amount').value;
  if (!p || !a || Number(a) <= 0) { toast('أكمل البيانات', 'error'); return; }
  state.debts.push({
    id: genId(),
    personId: p,
    type: document.querySelector('#modal-debt .radio-group .radio-option.active').dataset.type,
    amount: Number(a),
    desc: document.getElementById('debt-desc').value.trim(),
    date: new Date().toISOString()
  });
  save();
  closeModal('debt');
  renderPersonDetail();
  renderPeople();
  renderDashboard();
  toast('تم الحفظ');
}

function deleteDebt(id) {
  showConfirm('حذف', 'هل تريد حذف هذا الدين؟', () => {
    state.debts = state.debts.filter(d => d.id !== id);
    state.payments = state.payments.filter(p => p.debtId !== id);
    save();
    renderPersonDetail();
    renderPeople();
    renderDashboard();
    toast('تم الحذف');
  });
}

function settleDebt(id) {
  const d = state.debts.find(x => x.id === id);
  if (!d) return;
  const paid = state.payments.filter(p => p.debtId === id).reduce((s, p) => s + Number(p.amount), 0);
  const rem = Math.max(0, Number(d.amount) - paid);
  if (rem <= 0.01) { toast('مسدد بالفعل', 'error'); return; }
  showConfirm('✅ تم السداد', `سداد بمبلغ <strong>${fmt(rem)} ${cur()}</strong>`, () => {
    const n = new Date();
    state.payments.push({
      id: genId(),
      debtId: id,
      amount: rem,
      date: new Date(n.getTime() - n.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      method: 'cash',
      notes: '[سداد كامل] ' + d.desc
    });
    save();
    renderPersonDetail();
    renderPeople();
    renderDashboard();
    toast('✅ تم السداد');
  });
}

function initPaymentModal() {
  document.getElementById('payment-id').value = '';
  document.getElementById('payment-modal-title').textContent = 'تسجيل دفعة';
  document.getElementById('payment-save-text').textContent = 'حفظ';
  document.getElementById('payment-amount').value = '';
  document.getElementById('payment-notes').value = '';
  const n = new Date();
  document.getElementById('payment-date').value = new Date(n.getTime() - n.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function openPaymentFor(id) {
  const d = state.debts.find(x => x.id === id);
  if (!d) return;
  const paid = state.payments.filter(p => p.debtId === id).reduce((s, p) => s + Number(p.amount), 0);
  const rem = Math.max(0, Number(d.amount) - paid);
  openModal('payment');
  document.getElementById('payment-debt-id').value = id;
  document.getElementById('payment-amount').value = rem.toFixed(2);
  const t = d.type === 'debt' ? '💸 دفع دين' : '💰 تحصيل مستحق';
  document.getElementById('payment-modal-title').textContent = t + ' (' + fmt(rem) + ' ' + cur() + ')';
}

function savePayment() {
  const a = document.getElementById('payment-amount').value;
  if (!a || Number(a) <= 0) { toast('المبلغ غير صحيح', 'error'); return; }
  const id = document.getElementById('payment-id').value;
  const di = document.getElementById('payment-debt-id').value;
  const d = {
    id: id || genId(),
    debtId: di,
    amount: Number(a),
    date: document.getElementById('payment-date').value,
    method: document.getElementById('payment-method').value,
    notes: document.getElementById('payment-notes').value.trim()
  };
  if (id) {
    const i = state.payments.findIndex(p => p.id === id);
    state.payments[i] = d;
  } else state.payments.push(d);
  save();
  closeModal('payment');
  if (currentPersonId) renderPersonDetail();
  renderPeople();
  renderDashboard();
  toast('تم الحفظ');
}

// ============ ✅ تحقق من نجاح التحميل ============
console.log('✅ ui-dashboard.js loaded');