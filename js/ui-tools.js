// ============================================================
// 📦 ui-tools.js — المعلومات + الأدوات + الإعدادات
// ============================================================
// ⚠️ يجب تحميله بعد core.js و ui-pages.js و ui-dashboard.js و ui-work.js
// ============================================================

// ============ 🎯 INFO HUB ============
let currentInfoTab = 'transactions';

function switchInfoTab(t, b) {
  currentInfoTab = t;
  document.querySelectorAll('.info-hub-tab').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  renderInfoHub();
}

function renderInfoHub() {
  const c = document.getElementById('info-content');
  if (!c) return;
  if (currentInfoTab === 'transactions') renderInfoTransactions(c);
  else if (currentInfoTab === 'people') renderInfoPeople(c);
  else if (currentInfoTab === 'work') renderInfoWork(c);
  else if (currentInfoTab === 'reports') renderReportsSection(c);
  else if (currentInfoTab === 'budget') renderBudgetSection(c);
  else if (currentInfoTab === 'goals') renderFinancialGoalsSection(c);
}

function renderInfoTransactions(c) {
  const bc = {};
  state.transactions.forEach(t => {
    const ct = state.categories.find(x => x.id === t.category);
    const cn = ct ? ct.name : 'غير مصنف';
    if (!bc[cn]) bc[cn] = { income: 0, expense: 0, count: 0 };
    bc[cn][t.type] += Number(t.amount);
    bc[cn].count++;
  });
  const e = Object.entries(bc);
  if (e.length === 0) {
    c.innerHTML = '<div class="empty"><span class="material-icons">category</span><p>لا توجد معاملات</p></div>';
    return;
  }
  c.innerHTML = e.map(([n, d]) => {
    const nt = d.income - d.expense;
    return `<div class="info-card"><div class="info-card-header"><div class="info-card-title"><span class="material-icons">category</span>${escapeHtml(n)}</div><div class="info-card-badge recurring">${d.count}</div></div><div class="info-card-body"><div class="info-stat"><div class="label">💰 الدخل</div><div class="value" style="color:var(--green)">${fmt(d.income)}</div></div><div class="info-stat"><div class="label">💸 المصروف</div><div class="value" style="color:var(--red)">${fmt(d.expense)}</div></div><div class="info-stat" style="grid-column:span 2"><div class="label">📊 الصافي</div><div class="value" style="color:${nt >= 0 ? 'var(--green)' : 'var(--red)'}">${fmt(nt)}</div></div></div></div>`;
  }).join('');
}

function renderInfoPeople(c) {
  if (state.people.length === 0) {
    c.innerHTML = '<div class="empty"><span class="material-icons">people</span><p>لا يوجد أشخاص</p></div>';
    return;
  }
  c.innerHTML = state.people.map(p => {
    const r = calcPersonReport(p.id);
    return `<div class="info-card"><div class="info-card-header"><div class="info-card-title"><span class="material-icons">person</span>${escapeHtml(p.name)}</div><div class="info-card-badge recurring">${state.debts.filter(d => d.personId === p.id).length}</div></div><div class="info-card-body"><div class="info-stat"><div class="label">🔴 ديون</div><div class="value" style="color:var(--red)">${fmt(r.rD)}</div></div><div class="info-stat"><div class="label">🟢 مستحقات</div><div class="value" style="color:var(--green)">${fmt(r.rR)}</div></div><div class="info-stat" style="grid-column:span 2"><div class="label">💎 الصافي</div><div class="value" style="color:${r.n > 0.01 ? 'var(--green)' : r.n < -0.01 ? 'var(--red)' : 'var(--muted)'}">${fmt(Math.abs(r.n))} ${cur()}</div></div></div></div>`;
  }).join('');
}

function renderInfoWork(c) {
  if (state.works.length === 0) {
    c.innerHTML = '<div class="empty"><span class="material-icons">work</span><p>لا توجد أعمال</p></div>';
    return;
  }
  c.innerHTML = state.works.map(w => {
    const ls = state.workLogs.filter(l => l.workId === w.id);
    const ps = state.workPayments.filter(p => p.workId === w.id);
    const ip = w.calculationType === 'piece';
    const ul = w.unitName || (ip ? 'قطعة' : 'ساعة');
    const tA = ls.reduce((s, l) => s + (ip ? Number(l.quantity || 0) : Number(l.hours || 0)), 0);
    const tI = tA * Number(w.rate);
    const pI = ps.reduce((s, p) => s + Number(p.amount), 0);
    const st = WS[w.status] || WS.active;
    return `<div class="info-card"><div class="info-card-header"><div class="info-card-title"><span class="material-icons">work</span>${escapeHtml(w.name)}</div><div class="info-card-badge recurring">${st.i} ${st.n}</div></div><div class="info-card-body"><div class="info-stat"><div class="label">${ip ? '📦 القطع' : '⏱️ الساعات'}</div><div class="value">${fmt(tA)} ${ul}</div></div><div class="info-stat"><div class="label">💵 السعر</div><div class="value">${fmt(w.rate)}</div></div><div class="info-stat"><div class="label">💼 المستحق</div><div class="value" style="color:var(--primary)">${fmt(tI)}</div></div><div class="info-stat"><div class="label">💰 المدفوع</div><div class="value" style="color:var(--accent)">${fmt(pI)}</div></div><div class="info-stat" style="grid-column:span 2;background:linear-gradient(135deg,rgba(16,185,129,.15),rgba(52,211,153,.1));border:1px solid var(--green)"><div class="label">🏆 المتبقي</div><div class="value" style="color:var(--green)">${fmt(tI - pI)}</div></div></div></div>`;
  }).join('');
}

// ============ 📈 REPORTS ============
function renderReportsSection(c) {
  const now = new Date(), m = now.getMonth(), y = now.getFullYear();
  const monthTx = state.transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === m && d.getFullYear() === y;
  });
  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const net = income - expense;
  c.innerHTML = `<div class="analytics-card"><div class="analytics-title"><span class="material-icons">analytics</span>📊 تقرير الشهر</div><div class="analytics-grid"><div class="analytics-item"><div class="label">💰 الدخل</div><div class="value green">${fmt(income)} ${cur()}</div></div><div class="analytics-item"><div class="label">💸 المصروفات</div><div class="value" style="color:var(--red)">${fmt(expense)} ${cur()}</div></div><div class="analytics-item"><div class="label">📊 الصافي</div><div class="value" style="color:${net >= 0 ? 'var(--green)' : 'var(--red)'}">${fmt(net)} ${cur()}</div></div><div class="analytics-item"><div class="label">📈 المعاملات</div><div class="value primary">${monthTx.length}</div></div></div></div>`;
}

// ============ 💰 BUDGET ============
function initBudgetModal() {
  const budgetedCategories = state.budgets.map(b => b.categoryId);
  const availableCategories = state.categories.filter(c => c.type === 'expense' && !budgetedCategories.includes(c.id));
  const sel = document.getElementById('budget-category');
  sel.innerHTML = '<option value="">-- اختر الفئة --</option>' + availableCategories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  document.getElementById('budget-amount').value = '';
}

function getCategoryMonthlySpent(categoryId) {
  const now = new Date(), m = now.getMonth(), y = now.getFullYear();
  return state.transactions.filter(t => {
    if (t.type !== 'expense') return false;
    if (t.category !== categoryId) return false;
    const d = new Date(t.date);
    return d.getMonth() === m && d.getFullYear() === y;
  }).reduce((s, t) => s + Number(t.amount), 0);
}

function renderBudgetSection(c) {
  if (state.budgets.length === 0) {
    c.innerHTML = `<div class="budget-card"><div class="budget-title"><span class="material-icons">account_balance_wallet</span>💰 ميزانية الشهر</div><div class="empty" style="padding:20px"><p>لم تحدد ميزانية بعد</p><button class="btn btn-primary btn-sm" style="margin-top:10px;width:auto" onclick="openModal('budget')"><span class="material-icons">add</span>إضافة أول ميزانية</button></div></div>`;
    return;
  }
  let h = `<div class="budget-card"><div class="budget-title"><span class="material-icons">account_balance_wallet</span>💰 ميزانية الشهر</div>`;
  state.budgets.forEach(b => {
    const cat = state.categories.find(c => c.id === b.categoryId);
    const catName = cat ? cat.name : b.categoryName || 'غير معروف';
    const spent = getCategoryMonthlySpent(b.categoryId);
    const percent = Math.min(100, (spent / b.amount) * 100);
    const color = percent >= 100 ? 'var(--red)' : percent >= 80 ? 'var(--orange)' : 'var(--green)';
    const fillClass = percent >= 100 ? 'low' : percent >= 80 ? 'medium' : 'high';
    h += `<div class="budget-item"><div class="budget-item-header"><div class="budget-item-name">🏷️ ${escapeHtml(catName)}</div><div class="budget-item-amount" style="color:${color}">${fmt(spent)} / ${fmt(b.amount)} ${cur()}</div></div><div class="budget-progress"><div class="budget-progress-fill ${fillClass}" style="width:${percent}%;background:${color}"></div></div><div style="display:flex;justify-content:space-between;margin-top:6px"><span style="font-size:11px;color:var(--muted)">${percent.toFixed(0)}%</span><button onclick="deleteBudget('${b.id}')" style="color:var(--red);background:none;border:none;cursor:pointer;font-size:11px;font-weight:700">🗑️ حذف</button></div></div>`;
  });
  h += `<button class="btn btn-primary btn-sm" style="margin-top:14px;width:100%" onclick="openModal('budget')"><span class="material-icons">add</span>إضافة ميزانية</button></div>`;
  c.innerHTML = h;
}

function saveBudget() {
  const catId = document.getElementById('budget-category').value;
  const amount = Number(document.getElementById('budget-amount').value);
  if (!catId || !amount || amount <= 0) { toast('أكمل البيانات', 'error'); return; }
  const cat = state.categories.find(c => c.id === catId);
  if (!cat) return;
  state.budgets = state.budgets.filter(b => b.categoryId !== catId);
  state.budgets.push({ id: genId(), categoryId: catId, categoryName: cat.name, amount });
  save();
  closeModal('budget');
  renderInfoHub();
  toast('✅ تم الحفظ');
}

function deleteBudget(id) {
  showConfirm('حذف', 'هل تريد حذف هذه الميزانية؟', () => {
    state.budgets = state.budgets.filter(b => b.id !== id);
    save();
    renderInfoHub();
    toast('تم الحذف');
  });
}

// ============ 🎯 FINANCIAL GOALS ============
function renderFinancialGoalsSection(c) {
  if (state.financialGoals.length === 0) {
    c.innerHTML = `<div class="empty"><span class="material-icons">flag</span><p>لا توجد أهداف مالية</p><button class="btn btn-primary btn-sm" style="margin-top:10px;width:auto" onclick="openModal('financialgoal')"><span class="material-icons">add</span>إضافة هدف</button></div>`;
    return;
  }
  let h = `<div class="financial-goal-card"><div class="financial-goal-title"><span class="material-icons">flag</span>🎯 الأهداف المالية</div>`;
  state.financialGoals.forEach(g => {
    const saved = g.savedAmount || 0;
    const percent = Math.min(100, (saved / g.target) * 100);
    h += `<div class="financial-goal-item"><div class="financial-goal-header"><div class="financial-goal-name">${g.icon || '🎯'} ${escapeHtml(g.name)}</div><div class="financial-goal-amount">${fmt(saved)} / ${fmt(g.target)} ${cur()}</div></div><div class="progress-bar"><div class="progress-fill high" style="width:${percent}%"></div></div><div style="display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:var(--muted)"><span>${percent.toFixed(0)}%</span><span>متبقي: ${fmt(g.target - saved)} ${cur()}</span></div><button class="btn btn-danger btn-sm" onclick="deleteFinancialGoal('${g.id}')" style="margin-top:8px;width:auto;padding:6px 12px"><span class="material-icons" style="font-size:14px">delete</span></button></div>`;
  });
  h += `<button class="btn btn-primary btn-sm" style="margin-top:10px;width:100%" onclick="openModal('financialgoal')"><span class="material-icons">add</span>إضافة هدف</button></div>`;
  c.innerHTML = h;
}

function initFinancialGoalModal() {
  document.getElementById('fg-id').value = '';
  document.getElementById('fg-name').value = '';
  document.getElementById('fg-target').value = '';
  document.getElementById('fg-deadline').value = '';
  document.getElementById('fg-icon').value = '🎯';
}

function saveFinancialGoal() {
  const name = document.getElementById('fg-name').value.trim();
  const target = Number(document.getElementById('fg-target').value);
  const deadline = document.getElementById('fg-deadline').value;
  const icon = document.getElementById('fg-icon').value || '🎯';
  const id = document.getElementById('fg-id').value;
  if (!name || !target || target <= 0) { toast('أكمل البيانات', 'error'); return; }
  const data = { name, target, deadline, icon };
  if (id) {
    const i = state.financialGoals.findIndex(g => g.id === id);
    if (i >= 0) state.financialGoals[i] = { ...state.financialGoals[i], ...data };
  } else state.financialGoals.push({ id: genId(), ...data, savedAmount: 0 });
  save();
  closeModal('financialgoal');
  renderInfoHub();
  toast('✅ تم الحفظ');
}

function deleteFinancialGoal(id) {
  showConfirm('حذف', 'هل تريد حذف هذا الهدف؟', () => {
    state.financialGoals = state.financialGoals.filter(g => g.id !== id);
    save();
    renderInfoHub();
    toast('تم الحذف');
  });
}

// ============ 🆕 SIMPLE TOOLS ============
function updatePercentCalc() {
  const type = document.querySelector('#modal-percentcalc .radio-option.active').dataset.type;
  const c = document.getElementById('percent-inputs');
  if (type === 'of') c.innerHTML = `<div class="form-group"><label>النسبة %</label><input type="number" id="pc-p" step="0.01" min="0" oninput="calcPercent()" placeholder="15"></div><div class="form-group"><label>من الرقم</label><input type="number" id="pc-n" step="0.01" min="0" oninput="calcPercent()" placeholder="200"></div>`;
  else if (type === 'is') c.innerHTML = `<div class="form-group"><label>الرقم الأول</label><input type="number" id="pc-a" step="0.01" min="0" oninput="calcPercent()" placeholder="30"></div><div class="form-group"><label>من الرقم الثاني</label><input type="number" id="pc-b" step="0.01" min="0" oninput="calcPercent()" placeholder="200"></div>`;
  else c.innerHTML = `<div class="form-group"><label>القيمة القديمة</label><input type="number" id="pc-old" step="0.01" min="0" oninput="calcPercent()" placeholder="100"></div><div class="form-group"><label>القيمة الجديدة</label><input type="number" id="pc-new" step="0.01" min="0" oninput="calcPercent()" placeholder="120"></div>`;
  document.getElementById('percent-result').style.display = 'none';
}

function calcPercent() {
  const type = document.querySelector('#modal-percentcalc .radio-option.active').dataset.type;
  const r = document.getElementById('percent-result');
  const v = document.getElementById('percent-result-value');
  const s = document.getElementById('percent-result-sub');
  if (type === 'of') {
    const p = Number(document.getElementById('pc-p').value) || 0;
    const n = Number(document.getElementById('pc-n').value) || 0;
    if (!p || !n) { r.style.display = 'none'; return; }
    v.textContent = fmt((p / 100) * n);
    s.textContent = `${p}% من ${n}`;
  } else if (type === 'is') {
    const a = Number(document.getElementById('pc-a').value) || 0;
    const b = Number(document.getElementById('pc-b').value) || 0;
    if (!b) { r.style.display = 'none'; return; }
    v.textContent = fmt((a / b) * 100) + '%';
    s.textContent = `${a} من ${b}`;
  } else {
    const o = Number(document.getElementById('pc-old').value) || 0;
    const n = Number(document.getElementById('pc-new').value) || 0;
    if (!o) { r.style.display = 'none'; return; }
    const res = ((n - o) / o) * 100;
    v.textContent = (res >= 0 ? '+' : '') + fmt(res) + '%';
    s.textContent = res >= 0 ? 'زيادة' : 'نقصان';
  }
  r.style.display = 'block';
}

function calcVat() {
  const rate = Number(document.getElementById('vat-rate').value) || 0;
  const amt = Number(document.getElementById('vat-amount').value) || 0;
  const type = document.querySelector('#modal-vatcalc .radio-option.active').dataset.type;
  const r = document.getElementById('vat-result');
  const v = document.getElementById('vat-result-value');
  const s = document.getElementById('vat-result-sub');
  const l = document.getElementById('vat-result-label');
  if (!amt) { r.style.display = 'none'; return; }
  let total, tax, net;
  if (type === 'add') {
    tax = amt * (rate / 100);
    total = amt + tax;
    net = amt;
    l.textContent = 'المبلغ مع الضريبة';
    v.textContent = fmt(total) + ' ' + cur();
    s.innerHTML = `الضريبة: <strong>${fmt(tax)} ${cur()}</strong>`;
  } else {
    net = amt / (1 + rate / 100);
    tax = amt - net;
    total = amt;
    l.textContent = 'المبلغ بدون ضريبة';
    v.textContent = fmt(net) + ' ' + cur();
    s.innerHTML = `الضريبة: <strong>${fmt(tax)} ${cur()}</strong>`;
  }
  r.style.display = 'block';
}

function calcDiscount() {
  const o = Number(document.getElementById('discount-original').value) || 0;
  const p = Number(document.getElementById('discount-percent').value) || 0;
  document.getElementById('discount-percent-display').textContent = p + '%';
  const r = document.getElementById('discount-result');
  if (!o) { r.style.display = 'none'; return; }
  const saved = o * (p / 100);
  document.getElementById('discount-result-value').textContent = fmt(o - saved) + ' ' + cur();
  document.getElementById('discount-result-sub').innerHTML = `وفرت: <strong style="color:var(--green)">${fmt(saved)} ${cur()}</strong>`;
  r.style.display = 'block';
}

function comparePrices() {
  const p1 = Number(document.getElementById('pc1-price').value) || 0;
  const q1 = Number(document.getElementById('pc1-qty').value) || 0;
  const p2 = Number(document.getElementById('pc2-price').value) || 0;
  const q2 = Number(document.getElementById('pc2-qty').value) || 0;
  const r = document.getElementById('compare-result');
  const vd = document.getElementById('compare-verdict');
  if (!p1 || !q1 || !p2 || !q2) { r.style.display = 'none'; vd.style.display = 'none'; return; }
  const u1 = p1 / q1, u2 = p2 / q2;
  document.getElementById('compare-unit-1').textContent = fmt(u1) + ' ' + cur();
  document.getElementById('compare-unit-2').textContent = fmt(u2) + ' ' + cur();
  const i1 = document.getElementById('compare-item-1');
  const i2 = document.getElementById('compare-item-2');
  i1.classList.remove('winner');
  i2.classList.remove('winner');
  document.getElementById('crown-1').textContent = '';
  document.getElementById('crown-2').textContent = '';
  if (u1 < u2) {
    i1.classList.add('winner');
    document.getElementById('crown-1').textContent = '🏆';
    document.getElementById('compare-winner').textContent = '🅰️ الأول';
    document.getElementById('compare-saving').textContent = `أوفر بـ ${fmt(((u2 - u1) / u2) * 100)}%`;
  } else if (u2 < u1) {
    i2.classList.add('winner');
    document.getElementById('crown-2').textContent = '🏆';
    document.getElementById('compare-winner').textContent = '🅱️ الثاني';
    document.getElementById('compare-saving').textContent = `أوفر بـ ${fmt(((u1 - u2) / u1) * 100)}%`;
  } else {
    document.getElementById('compare-winner').textContent = '🤝 متساويان';
    document.getElementById('compare-saving').textContent = 'نفس السعر';
  }
  r.style.display = 'grid';
  vd.style.display = 'block';
}

function calcLoan() {
  const P = Number(document.getElementById('loan-amount').value) || 0;
  const rA = Number(document.getElementById('loan-rate').value) || 0;
  const n = Number(document.getElementById('loan-months').value) || 0;
  const res = document.getElementById('loan-result');
  if (!P || !n) { res.style.display = 'none'; return; }
  const r = rA / 100 / 12;
  let monthly;
  if (r === 0) monthly = P / n;
  else monthly = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const total = monthly * n;
  document.getElementById('loan-monthly').textContent = fmt(monthly) + ' ' + cur();
  document.getElementById('loan-details').innerHTML = `إجمالي: <strong>${fmt(total)} ${cur()}</strong><br>فوائد: <strong style="color:var(--red)">${fmt(total - P)} ${cur()}</strong>`;
  res.style.display = 'block';
}

function calcSavings() {
  const target = Number(document.getElementById('sav-target').value) || 0;
  const n = Number(document.getElementById('sav-months').value) || 0;
  const rA = Number(document.getElementById('sav-rate').value) || 0;
  const res = document.getElementById('sav-result');
  if (!target || !n) { res.style.display = 'none'; return; }
  const r = rA / 100 / 12;
  let monthly;
  if (r === 0) monthly = target / n;
  else monthly = target * r / (Math.pow(1 + r, n) - 1);
  document.getElementById('sav-monthly').textContent = fmt(monthly) + ' ' + cur();
  document.getElementById('sav-details').innerHTML = `إجمالي: <strong>${fmt(monthly * n)} ${cur()}</strong>`;
  res.style.display = 'block';
}

function calcDays() {
  const f = document.getElementById('day-from').value;
  const t = document.getElementById('day-to').value;
  const res = document.getElementById('day-result');
  if (!f || !t) { res.style.display = 'none'; return; }
  const diff = Math.round((new Date(t) - new Date(f)) / (1000 * 60 * 60 * 24));
  const abs = Math.abs(diff);
  document.getElementById('day-days').textContent = abs + ' يوم';
  document.getElementById('day-details').innerHTML = `${Math.floor(abs / 7)} أسبوع • ${Math.floor(abs / 30.44)} شهر`;
  res.style.display = 'block';
}

function convertTime() {
  const v = Number(document.getElementById('time-value').value) || 0;
  const from = document.getElementById('time-from').value;
  const toSeconds = { seconds: 1, minutes: 60, hours: 3600, days: 86400, weeks: 604800 };
  const secs = v * toSeconds[from];
  const conv = [
    { n: '⏱️ ثواني', v: secs },
    { n: '🕐 دقائق', v: secs / 60 },
    { n: '🕰️ ساعات', v: secs / 3600 },
    { n: '📅 أيام', v: secs / 86400 },
    { n: '📆 أسابيع', v: secs / 604800 }
  ];
  document.getElementById('time-conversions').innerHTML = conv.map(x => `<div style="display:flex;justify-content:space-between;padding:8px 10px;background:var(--bg2);border-radius:8px;margin-bottom:6px;border:1px solid var(--border)"><span style="font-size:12px;color:var(--muted);font-weight:700">${x.n}</span><strong style="color:var(--primary)">${fmt(x.v)}</strong></div>`).join('');
}

// ============ 💱 CURRENCY ============
function convertCurrency() {
  const a = Number(document.getElementById('currency-amount').value) || 0;
  const from = document.getElementById('currency-from').value;
  const to = document.getElementById('currency-to').value;
  const fromRate = state.exchangeRates[from] || 1;
  const toRate = state.exchangeRates[to] || 1;
  const usd = a / fromRate;
  const result = usd * toRate;
  document.getElementById('currency-result').innerHTML = `<div style="font-size:24px;font-weight:800;color:var(--green);margin-bottom:10px">${fmt(result)} ${to}</div><div style="font-size:12px;color:var(--muted)">1 ${from} = ${fmt(toRate / fromRate)} ${to}</div>`;
}

// ============ ⚙️ SETTINGS ============
function saveSetting(k, v) {
  state.settings[k] = v;
  save();
  renderDashboard();
  if (k === 'currency') document.getElementById('circle-currency').textContent = v;
  toast('تم الحفظ');
}

function exportJSON() {
  const b = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'wallet-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  toast('تم التصدير');
}

function importJSON(e) {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      const i = JSON.parse(ev.target.result);
      showConfirm('استيراد', 'سيتم استبدال البيانات. هل تريد المتابعة؟', () => {
        state = { ...state, ...i };
        save();
        renderDashboard();
        renderTransactions();
        renderPeople();
        renderWork();
        toast('تم الاستيراد');
      });
    } catch (err) {
      toast('ملف غير صالح', 'error');
    }
  };
  r.readAsText(f);
  e.target.value = '';
}

async function confirmReset() {
  showConfirm('حذف البيانات', 'سيتم حذف جميع البيانات نهائياً. هل أنت متأكد؟', () => {
    showConfirm('تأكيد نهائي', 'هذا الإجراء لا يمكن التراجع عنه!', async () => {
      await storage.clear();
      location.reload();
    });
  });
}

async function showStorageInfo() {
  const info = await storage.getStorageInfo();
  const storageType = info.usingIndexedDB ? '✅ IndexedDB (سريع)' : '⚠️ localStorage (احتياطي)';
  const message = `<div style="text-align:right;line-height:2"><div><strong>نوع التخزين:</strong> ${storageType}</div><div><strong>حجم IndexedDB:</strong> ${info.indexedDBSize}</div><div><strong>حجم localStorage:</strong> ${info.localStorageSize}</div><div style="margin-top:10px;padding:10px;background:rgba(124,58,237,.1);border-radius:8px;font-size:12px">💡 IndexedDB يدعم حتى 500+ MB</div></div>`;
  showConfirm('🗄️ معلومات التخزين', message, () => {});
}

// ============ 📝 SIMPLE NOTEBOOKS ============
function qnGetAll() { try { return JSON.parse(localStorage.getItem('quick_notes') || '[]'); } catch (e) { return []; } }
function qnSaveAll(arr) { localStorage.setItem('quick_notes', JSON.stringify(arr)); }

function qnSave() {
  const t = document.getElementById('qn-title').value.trim();
  const c = document.getElementById('qn-content').value.trim();
  if (!c) { toast('اكتب محتوى', 'error'); return; }
  const arr = qnGetAll();
  arr.unshift({ id: genId(), title: t || 'بدون عنوان', content: c, date: new Date().toISOString() });
  qnSaveAll(arr);
  document.getElementById('qn-title').value = '';
  document.getElementById('qn-content').value = '';
  toast('✅ تم الحفظ');
  qnList();
}

function qnList() {
  const arr = qnGetAll();
  const c = document.getElementById('qn-list');
  if (arr.length === 0) {
    c.innerHTML = '<div class="empty" style="padding:20px"><p>لا توجد ملاحظات</p></div>';
    return;
  }
  c.innerHTML = arr.map(n => `<div class="list-item" style="margin-bottom:8px"><div class="icon-box neutral"><span class="material-icons">note</span></div><div class="info"><div class="title">${escapeHtml(n.title)}</div><div class="sub">${escapeHtml(n.content.substring(0, 60))}</div></div><div class="actions"><button class="delete-btn" onclick="qnDelete('${n.id}')"><span class="material-icons">delete</span></button></div></div>`).join('');
}

function qnDelete(id) {
  showConfirm('حذف', 'حذف الملاحظة؟', () => {
    qnSaveAll(qnGetAll().filter(x => x.id !== id));
    qnList();
    toast('تم الحذف');
  });
}

function qnClear() {
  showConfirm('مسح الكل', 'حذف جميع الملاحظات؟', () => {
    qnSaveAll([]);
    qnList();
    toast('🗑️ تم المسح');
  });
}

function tdGetAll() { try { return JSON.parse(localStorage.getItem('todo_list') || '[]'); } catch (e) { return []; } }
function tdSaveAll(arr) { localStorage.setItem('todo_list', JSON.stringify(arr)); }

function tdAdd() {
  const input = document.getElementById('td-input');
  const t = input.value.trim();
  if (!t) return;
  const arr = tdGetAll();
  arr.unshift({ id: genId(), text: t, done: false, date: new Date().toISOString() });
  tdSaveAll(arr);
  input.value = '';
  tdRender();
}

function tdToggle(id) {
  const arr = tdGetAll();
  const it = arr.find(x => x.id === id);
  if (it) it.done = !it.done;
  tdSaveAll(arr);
  tdRender();
}

function tdDelete(id) {
  tdSaveAll(tdGetAll().filter(x => x.id !== id));
  tdRender();
}

function tdClearDone() {
  tdSaveAll(tdGetAll().filter(x => !x.done));
  tdRender();
  toast('🗑️ تم');
}

function tdRender() {
  const arr = tdGetAll();
  const c = document.getElementById('td-list');
  const done = arr.filter(x => x.done).length;
  document.getElementById('td-stats').textContent = `${done} من ${arr.length} مكتملة`;
  if (arr.length === 0) {
    c.innerHTML = '<div class="empty" style="padding:20px"><p>لا توجد مهام</p></div>';
    return;
  }
  c.innerHTML = arr.map(t => `<div class="list-item" style="margin-bottom:8px;${t.done ? 'opacity:.6' : ''}"><button onclick="tdToggle('${t.id}')" style="width:32px;height:32px;border-radius:8px;background:${t.done ? 'var(--green)' : 'var(--bg3)'};color:${t.done ? '#fff' : 'var(--muted)'};display:flex;align-items:center;justify-content:center;border:2px solid ${t.done ? 'var(--green)' : 'var(--border)'};flex-shrink:0"><span class="material-icons" style="font-size:18px">${t.done ? 'check' : 'radio_button_unchecked'}</span></button><div class="info" style="${t.done ? 'text-decoration:line-through' : ''}"><div class="title">${escapeHtml(t.text)}</div></div><div class="actions"><button class="delete-btn" onclick="tdDelete('${t.id}')"><span class="material-icons">delete</span></button></div></div>`).join('');
}

function ibGetAll() { try { return JSON.parse(localStorage.getItem('idea_box') || '[]'); } catch (e) { return []; } }
function ibSaveAll(arr) { localStorage.setItem('idea_box', JSON.stringify(arr)); }

function ibAdd() {
  const input = document.getElementById('ib-input');
  const cat = document.getElementById('ib-category').value;
  const t = input.value.trim();
  if (!t) return;
  const arr = ibGetAll();
  arr.unshift({ id: genId(), idea: t, category: cat, date: new Date().toISOString() });
  ibSaveAll(arr);
  input.value = '';
  ibRender();
  toast('💡 تم الحفظ');
}

function ibDelete(id) {
  showConfirm('حذف', 'حذف الفكرة؟', () => {
    ibSaveAll(ibGetAll().filter(x => x.id !== id));
    ibRender();
    toast('تم الحذف');
  });
}

function ibRender() {
  const arr = ibGetAll();
  const c = document.getElementById('ib-list');
  if (arr.length === 0) {
    c.innerHTML = '<div class="empty" style="padding:20px"><p>لا توجد أفكار</p></div>';
    return;
  }
  c.innerHTML = arr.map(i => `<div class="list-item" style="margin-bottom:8px"><div class="icon-box accent"><span class="material-icons">lightbulb</span></div><div class="info"><div class="title">${i.category}</div><div class="sub">${escapeHtml(i.idea)}</div></div><div class="actions"><button class="delete-btn" onclick="ibDelete('${i.id}')"><span class="material-icons">delete</span></button></div></div>`).join('');
}

function pwGetAll() { try { return JSON.parse(localStorage.getItem('passwords_vault') || '[]'); } catch (e) { return []; } }
function pwSaveAll(arr) { localStorage.setItem('passwords_vault', JSON.stringify(arr)); }

function pwToggle() {
  const inp = document.getElementById('pw-pass');
  const eye = document.getElementById('pw-eye');
  if (inp.type === 'password') { inp.type = 'text'; eye.textContent = 'visibility_off'; }
  else { inp.type = 'password'; eye.textContent = 'visibility'; }
}

function pwGenerate() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let p = '';
  for (let i = 0; i < 16; i++) p += chars[Math.floor(Math.random() * chars.length)];
  document.getElementById('pw-pass').value = p;
  document.getElementById('pw-pass').type = 'text';
  document.getElementById('pw-eye').textContent = 'visibility_off';
  toast('🔑 تم إنشاء كلمة مرور');
}

function pwSave() {
  const site = document.getElementById('pw-site').value.trim();
  const user = document.getElementById('pw-user').value.trim();
  const pass = document.getElementById('pw-pass').value.trim();
  if (!site || !pass) { toast('أدخل الموقع وكلمة المرور', 'error'); return; }
  const arr = pwGetAll();
  arr.unshift({ id: genId(), site, user, pass, date: new Date().toISOString() });
  pwSaveAll(arr);
  document.getElementById('pw-site').value = '';
  document.getElementById('pw-user').value = '';
  document.getElementById('pw-pass').value = '';
  toast('✅ تم الحفظ');
  pwList();
}

function pwDelete(id) {
  showConfirm('حذف', 'حذف البيانات؟', () => {
    pwSaveAll(pwGetAll().filter(x => x.id !== id));
    pwList();
    toast('تم الحذف');
  });
}

function pwCopy(id, field) {
  const p = pwGetAll().find(x => x.id === id);
  if (!p) return;
  navigator.clipboard.writeText(p[field]).then(() => toast('📋 تم النسخ'));
}

function pwList() {
  const arr = pwGetAll();
  const c = document.getElementById('pw-list');
  if (arr.length === 0) {
    c.innerHTML = '<div class="empty" style="padding:20px"><p>لا توجد بيانات</p></div>';
    return;
  }
  c.innerHTML = arr.map(p => `<div class="list-item" style="margin-bottom:8px"><div class="icon-box neutral"><span class="material-icons">vpn_key</span></div><div class="info"><div class="title">${escapeHtml(p.site)}</div><div class="sub">👤 ${escapeHtml(p.user || '--')}</div><div class="sub" style="font-family:monospace">🔑 ${'•'.repeat(Math.min(p.pass.length, 12))}</div></div><div class="actions"><button onclick="pwCopy('${p.id}','user')"><span class="material-icons">person</span></button><button onclick="pwCopy('${p.id}','pass')"><span class="material-icons">vpn_key</span></button><button class="delete-btn" onclick="pwDelete('${p.id}')"><span class="material-icons">delete</span></button></div></div>`).join('');
}

// ============ ✅ تحقق من نجاح التحميل ============
console.log('✅ ui-tools.js loaded');