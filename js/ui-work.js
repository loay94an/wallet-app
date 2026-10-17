// ============================================================
// 📦 ui-work.js — قسم العمل الكامل (Timer + Management + PDF)
// ============================================================
// ⚠️ يجب تحميله بعد core.js و ui-pages.js و ui-dashboard.js
// ============================================================

// ============ ⏱️ WORK — TIMER CONTROLS ============
function startWorkTimer(wid) {
  const st = getTimerState(wid);
  if (st.running) { toast('المؤقت يعمل بالفعل', 'error'); return; }
  st.running = true;
  st.startedAt = new Date().toISOString();
  startWorkTimerInterval(wid);
  updateWorkTimerDisplay(wid);
  saveTimerStatesToStorage();
  if (wid === currentWorkId) renderWorkTimerCards();
  toast('▶️ بدأ المؤقت');
}

function pauseWorkTimer(wid) {
  const st = getTimerState(wid);
  if (!st.running) return;
  if (st.startedAt) {
    st.seconds += Math.floor((Date.now() - new Date(st.startedAt).getTime()) / 1000);
  }
  st.running = false;
  st.startedAt = null;
  stopWorkTimerInterval(wid);
  updateWorkTimerDisplay(wid);
  saveTimerStatesToStorage();
  if (wid === currentWorkId) renderWorkTimerCards();
  toast('⏸️ تم إيقاف المؤقت');
}

function saveWorkTimer(wid) {
  const w = state.works.find(x => x.id === wid);
  if (!w) return;
  const st = getTimerState(wid);
  let totalSeconds = st.seconds;
  if (st.running && st.startedAt) {
    totalSeconds += Math.floor((Date.now() - new Date(st.startedAt).getTime()) / 1000);
  }
  const d = st.startedAt ? new Date(st.startedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const h = (totalSeconds / 3600).toFixed(2);
  const startTime = st.startedAt ? new Date(st.startedAt).toTimeString().slice(0, 5) : '';
  const endTime = new Date().toTimeString().slice(0, 5);
  let data;
  if (w.calculationType === 'piece') {
    const q = Number(st.pieces) || 0;
    if (q <= 0 && totalSeconds === 0) { toast('لا يوجد بيانات للحفظ', 'error'); return; }
    data = {
      id: genId(),
      workId: wid,
      date: d,
      start: startTime,
      end: endTime,
      hours: Number(h),
      quantity: q,
      desc: `من المؤقت - ${q} ${w.unitName || 'قطعة'}${totalSeconds > 0 ? ' في ' + h + ' ساعة' : ''}`
    };
  } else {
    if (totalSeconds === 0) { toast('لا يوجد وقت', 'error'); return; }
    data = {
      id: genId(),
      workId: wid,
      date: d,
      start: startTime,
      end: endTime,
      hours: Number(h),
      quantity: 0,
      desc: 'من المؤقت المباشر'
    };
  }
  state.workLogs.push(data);
  stopWorkTimerInterval(wid);
  timerStates[wid] = { seconds: 0, running: false, startedAt: null, pieces: 0 };
  saveTimerStatesToStorage();
  save();
  renderWork();
  renderDashboard();
  toast('✅ تم حفظ سجل العمل');
}

function addPieces(wid, amount) {
  const st = getTimerState(wid);
  const add = Number(amount);
  if (!add || add <= 0) { toast('أدخل كمية صحيحة', 'error'); return; }
  st.pieces = (st.pieces || 0) + add;
  saveTimerStatesToStorage();
  updatePieceCounter(wid);
  toast(`+${add} ✅ المجموع: ${st.pieces}`);
}

function addPiecesFromInput(wid) {
  const input = document.getElementById('piece-input-' + wid);
  if (!input) return;
  const val = Number(input.value);
  if (!val || val <= 0) { toast('أدخل كمية', 'error'); return; }
  addPieces(wid, val);
  input.value = '';
}

function resetPieces(wid) {
  showConfirm('تصفير القطع', 'هل تريد تصفير عدد القطع لهذا العمل؟', () => {
    const st = getTimerState(wid);
    st.pieces = 0;
    saveTimerStatesToStorage();
    updatePieceCounter(wid);
    toast('🔄 تم التصفير');
  });
}

function updatePieceCounter(wid) {
  const el = document.getElementById('piece-total-' + wid);
  const earningsEl = document.getElementById('piece-earnings-' + wid);
  if (!el && !earningsEl) return;
  const st = getTimerState(wid);
  const w = state.works.find(x => x.id === wid);
  const pieces = st.pieces || 0;
  if (el) el.textContent = fmt(pieces);
  if (earningsEl && w) earningsEl.textContent = fmt(pieces * Number(w.rate));
}

// ============ 💼 WORK — MANAGEMENT ============
function toggleWorkTypeUI() {
  const tp = document.querySelector('#modal-work .radio-group .radio-option.active').dataset.type;
  const rl = document.getElementById('work-rate-label');
  const ug = document.getElementById('work-unit-group');
  if (tp === 'piece') {
    rl.textContent = 'سعر القطعة / الوحدة *';
    ug.style.display = 'block';
  } else {
    rl.textContent = 'سعر الساعة *';
    ug.style.display = 'none';
  }
}

function initWorkModal() {
  document.getElementById('work-id').value = '';
  document.getElementById('work-modal-title').textContent = 'إضافة عمل';
  ['work-name', 'work-client', 'work-rate', 'work-desc', 'work-unit'].forEach(i => document.getElementById(i).value = '');
  document.getElementById('work-unit').value = 'قطعة';
  document.getElementById('work-status').value = 'active';
  document.getElementById('work-start-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('work-end-date').value = '';
  document.querySelectorAll('#modal-work .radio-group .radio-option').forEach((o, i) => o.classList.toggle('active', i === 0));
  toggleWorkTypeUI();
}

function saveWork() {
  const n = document.getElementById('work-name').value.trim();
  const r = document.getElementById('work-rate').value;
  if (!n || !r || Number(r) <= 0) { toast('أكمل البيانات', 'error'); return; }
  const id = document.getElementById('work-id').value;
  const ct = document.querySelector('#modal-work .radio-group .radio-option.active').dataset.type;
  const d = {
    id: id || genId(),
    name: n,
    client: document.getElementById('work-client').value.trim(),
    calculationType: ct,
    rate: Number(r),
    unitName: ct === 'piece' ? (document.getElementById('work-unit').value.trim() || 'قطعة') : 'ساعة',
    status: document.getElementById('work-status').value,
    startDate: document.getElementById('work-start-date').value || null,
    endDate: document.getElementById('work-end-date').value || null,
    desc: document.getElementById('work-desc').value.trim()
  };
  if (id) {
    const i = state.works.findIndex(w => w.id === id);
    state.works[i] = d;
  } else {
    state.works.push(d);
    if (!currentWorkId) currentWorkId = d.id;
  }
  save();
  closeModal('work');
  renderWork();
  toast('تم الحفظ');
}

function renderWork() {
  const t = document.getElementById('work-tabs');
  if (!t) return;

  if (state.works.length === 0) {
    t.innerHTML = '<div class="empty" style="width:100%;padding:12px"><p>لا توجد أعمال</p></div>';
    currentWorkId = null;
  } else {
    if (!currentWorkId || !state.works.find(w => w.id === currentWorkId)) currentWorkId = state.works[0].id;
    localStorage.setItem('currentWorkId', currentWorkId);
    t.innerHTML = state.works.map(w => {
      const s = WS[w.status] || WS.active, ti = w.calculationType === 'piece' ? '📦' : '⏱️';
      const st = timerStates[w.id];
      const timerActive = st && (st.running || st.seconds > 0);
      const timerBadge = timerActive ? `<span style="background:var(--green);color:#fff;padding:1px 6px;border-radius:8px;font-size:9px;margin-right:4px">⏱️</span>` : '';
      return `<button class="tab ${w.id === currentWorkId ? 'active' : ''}" onclick="selectWork('${w.id}')">${s.i} ${escapeHtml(w.name)} ${timerBadge}<span style="font-size:10px;opacity:.7">(${ti})</span><span class="close" onclick="event.stopPropagation();deleteWork('${w.id}')">×</span></button>`;
    }).join('');
  }

  renderWorkTimerCards();
  renderWorkInfoCard();
  renderWorkGoals();
  renderWorkAnalytics();
  renderWorkPaymentCard();
  renderWorkSummary();
  renderWorkLogs();

  const w = document.getElementById('work-stats-wrapper');
  if (w) w.style.display = workStatsVisible ? 'block' : 'none';
  const txt = document.getElementById('toggle-stats-text');
  const icon = document.querySelector('#toggle-stats-btn .material-icons');
  if (workStatsVisible) {
    if (txt) txt.textContent = 'إخفاء التفاصيل';
    if (icon) icon.textContent = 'visibility';
  } else {
    if (txt) txt.textContent = 'إظهار التفاصيل';
    if (icon) icon.textContent = 'visibility_off';
  }
  if (!workStatsVisible && typeof renderNetSummary === 'function') renderNetSummary();
}

function renderWorkTimerCards() {
  const container = document.getElementById('work-timer-cards');
  if (!container) return;
  if (state.works.length === 0) {
    container.innerHTML = '<div class="empty"><span class="material-icons">timer</span><p>أضف عملاً لبدء المؤقت</p></div>';
    return;
  }
  const w = state.works.find(x => x.id === currentWorkId);
  if (!w) {
    container.innerHTML = '<div class="empty"><p>اختر عملاً من الأعلى</p></div>';
    return;
  }
  const st = getTimerState(w.id);
  const isPiece = w.calculationType === 'piece';
  const s = WS[w.status] || WS.active;
  let displaySecs = st.seconds || 0;
  if (st.running && st.startedAt) {
    displaySecs += Math.floor((Date.now() - new Date(st.startedAt).getTime()) / 1000);
  }
  const hh = Math.floor(displaySecs / 3600);
  const mm = Math.floor((displaySecs % 3600) / 60);
  const ss = displaySecs % 60;
  const timeStr = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  const pieces = st.pieces || 0;
  const earnings = pieces * Number(w.rate);

  container.innerHTML = `
    <div class="work-timer-card ${st.running ? 'running' : ''}" id="work-timer-card-${w.id}">
      <div class="work-timer-card-header">
        <div class="work-timer-name">
          <span style="font-size:20px">${isPiece ? '📦' : '⏱️'}</span>
          <span class="work-timer-name-text">${escapeHtml(w.name)}</span>
        </div>
        <span class="work-status-badge ${s.c}">${s.i} ${s.n}</span>
      </div>
      <div class="work-timer-display ${st.running ? 'running' : ''}" id="timer-${w.id}">${timeStr}</div>
      <div class="work-timer-controls">
        <button class="btn btn-success" onclick="startWorkTimer('${w.id}')" ${st.running ? 'disabled' : ''}><span class="material-icons">play_arrow</span>بدء</button>
        <button class="btn btn-warning" onclick="pauseWorkTimer('${w.id}')" ${!st.running ? 'disabled' : ''}><span class="material-icons">pause</span>إيقاف</button>
        <button class="btn btn-danger" onclick="saveWorkTimer('${w.id}')"><span class="material-icons">save</span>حفظ</button>
      </div>
      ${isPiece ? `
        <div class="work-timer-piece-section">
          <div class="piece-input-row">
            <input type="number" id="piece-input-${w.id}" min="1" placeholder="الكمية" value="1">
            <button class="btn" onclick="addPiecesFromInput('${w.id}')"><span class="material-icons">add</span></button>
          </div>
          <div class="piece-quick-btns">
            <button onclick="addPieces('${w.id}',1)">+1</button>
            <button onclick="addPieces('${w.id}',5)">+5</button>
            <button onclick="addPieces('${w.id}',10)">+10</button>
            <button onclick="addPieces('${w.id}',25)">+25</button>
            <button class="reset" onclick="resetPieces('${w.id}')">🔄</button>
          </div>
          <div class="piece-totals">
            <div class="piece-total-box">
              <div class="label">📊 المجموع</div>
              <div class="value pieces" id="piece-total-${w.id}">${fmt(pieces)}</div>
            </div>
            <div class="piece-total-box">
              <div class="label">💰 الأرباح</div>
              <div class="value" id="piece-earnings-${w.id}">${fmt(earnings)} ${cur()}</div>
            </div>
          </div>
        </div>
      ` : `<div class="work-timer-hours-info">💵 ${fmt(w.rate)} ${cur()} / ساعة</div>`}
    </div>`;

  if (st.running && !timerIntervals[w.id]) startWorkTimerInterval(w.id);
}

function renderWorkInfoCard() {
  const c = document.getElementById('work-info-card');
  if (!c) return;
  if (!currentWorkId) { c.innerHTML = ''; return; }
  const w = state.works.find(x => x.id === currentWorkId);
  if (!w) { c.innerHTML = ''; return; }
  const s = WS[w.status] || WS.active, ti = w.calculationType === 'piece' ? '📦' : '⏱️';
  const tn = w.calculationType === 'piece' ? 'حساب بالقطعة' : 'حساب ساعي';
  const rl = w.calculationType === 'piece' ? 'سعر القطعة' : 'سعر الساعة';
  c.innerHTML = `<div style="background:linear-gradient(135deg,rgba(124,58,237,.1),rgba(236,72,153,.05));border:2px solid var(--primary);border-radius:16px;padding:16px;margin-bottom:14px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px">${ti}</span><div><div style="font-size:16px;font-weight:800">${escapeHtml(w.name)}</div><div style="font-size:12px;color:var(--muted)">${tn}${w.client ? ' • ' + escapeHtml(w.client) : ''}</div></div></div><span class="work-status-badge ${s.c}">${s.i} ${s.n}</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div style="background:var(--bg2);padding:10px;border-radius:10px;text-align:center;border:1px solid var(--border)"><div style="font-size:11px;color:var(--muted);margin-bottom:4px">${rl}</div><div style="font-size:16px;font-weight:800;color:var(--green)">${fmt(w.rate)} ${cur()}</div></div><div style="background:var(--bg2);padding:10px;border-radius:10px;text-align:center;border:1px solid var(--border)"><div style="font-size:11px;color:var(--muted);margin-bottom:4px">الوحدة</div><div style="font-size:16px;font-weight:800;color:var(--primary)">${escapeHtml(w.unitName)}</div></div></div><button class="btn btn-ghost btn-sm" onclick="editWork('${w.id}')" style="margin-top:10px"><span class="material-icons">edit</span> تعديل</button></div>`;
}

function editWork(id) {
  const w = state.works.find(x => x.id === id);
  if (!w) return;
  openModal('work');
  document.getElementById('work-id').value = w.id;
  document.getElementById('work-modal-title').textContent = 'تعديل عمل';
  document.getElementById('work-name').value = w.name;
  document.getElementById('work-client').value = w.client || '';
  document.querySelectorAll('#modal-work .radio-group .radio-option').forEach(o => o.classList.toggle('active', o.dataset.type === w.calculationType));
  document.getElementById('work-rate').value = w.rate;
  document.getElementById('work-unit').value = w.unitName || 'قطعة';
  document.getElementById('work-status').value = w.status || 'active';
  document.getElementById('work-start-date').value = w.startDate || '';
  document.getElementById('work-end-date').value = w.endDate || '';
  document.getElementById('work-desc').value = w.desc || '';
  toggleWorkTypeUI();
}

function selectWork(id) {
  currentWorkId = id;
  localStorage.setItem('currentWorkId', id);
  renderWork();
  setTimeout(() => {
    updateWorkTimerDisplay(id);
    updatePieceCounter(id);
  }, 50);
}

function deleteWork(id) {
  const w = state.works.find(x => x.id === id);
  showConfirm('حذف العمل', `سيتم حذف "${w ? escapeHtml(w.name) : ''}" وجميع سجلاته.`, () => {
    state.works = state.works.filter(x => x.id !== id);
    state.workLogs = state.workLogs.filter(l => l.workId !== id);
    state.workPayments = state.workPayments.filter(p => p.workId !== id);
    state.workGoals = state.workGoals.filter(g => g.workId !== id);
    stopWorkTimerInterval(id);
    delete timerStates[id];
    saveTimerStatesToStorage();
    if (currentWorkId === id) currentWorkId = state.works[0]?.id || null;
    localStorage.setItem('currentWorkId', currentWorkId || '');
    save();
    renderWork();
    renderDashboard();
    toast('تم الحذف');
  });
}

// ============ 🎯 WORK — GOALS ============
function renderWorkGoals() {
  const s = document.getElementById('work-goals-section');
  if (!s) return;
  if (!currentWorkId) { s.innerHTML = ''; return; }
  const g = state.workGoals.filter(x => x.workId === currentWorkId);
  if (g.length === 0) { s.innerHTML = ''; return; }

  const n = new Date(), td = n.toDateString();
  const ws = new Date(n);
  ws.setDate(n.getDate() - n.getDay());
  const m = n.getMonth(), y = n.getFullYear();
  let h = '<div class="goal-card"><div class="goal-title"><span class="material-icons">flag</span>🎯 الأهداف</div>';

  g.forEach(x => {
    let a = 0, l = '';
    const ls = state.workLogs.filter(l => l.workId === currentWorkId);
    const w = state.works.find(w => w.id === currentWorkId);
    const ip = w && w.calculationType === 'piece';

    if (x.type === 'daily') {
      a = ls.filter(l => new Date(l.date).toDateString() === td)
        .reduce((s, l) => s + (ip ? Number(l.quantity) : Number(l.hours)), 0);
      l = 'اليوم';
    } else if (x.type === 'weekly') {
      a = ls.filter(l => { const d = new Date(l.date); return d >= ws && d <= n; })
        .reduce((s, l) => s + (ip ? Number(l.quantity) : Number(l.hours)), 0);
      l = 'الأسبوع';
    } else if (x.type === 'monthly') {
      a = ls.filter(l => { const d = new Date(l.date); return d.getMonth() === m && d.getFullYear() === y; })
        .reduce((s, l) => s + (ip ? Number(l.quantity) : Number(l.hours)), 0);
      l = 'الشهر';
    }

    const p = Math.min(100, (a / x.target) * 100);
    const fc = p < 33 ? 'low' : p < 66 ? 'medium' : 'high';
    const ul = w ? w.unitName : (ip ? 'قطعة' : 'ساعة');

    h += `<div style="margin-bottom:12px;padding:10px;background:var(--bg2);border-radius:10px;border:1px solid var(--border)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div style="font-size:13px;font-weight:700">هدف ${l}: ${x.target} ${ul}</div><button class="delete-btn" style="width:28px;height:28px;border-radius:8px" onclick="deleteWorkGoal('${x.id}')"><span class="material-icons" style="font-size:16px">close</span></button></div><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:4px"><span>المنجز: ${fmt(a)} ${ul}</span><span>${p.toFixed(0)}%</span></div><div class="progress-bar"><div class="progress-fill ${fc}" style="width:${p}%"></div></div></div>`;
  });
  h += '</div>';
  s.innerHTML = h;
}

function initWorkGoalModal() {
  document.getElementById('workgoal-work').innerHTML = state.works.map(w => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join('');
  if (currentWorkId) document.getElementById('workgoal-work').value = currentWorkId;
  document.getElementById('workgoal-target').value = '';
  document.querySelectorAll('#modal-workgoal .radio-group .radio-option').forEach((o, i) => o.classList.toggle('active', i === 0));
}

function saveWorkGoal() {
  const wid = document.getElementById('workgoal-work').value;
  const t = Number(document.getElementById('workgoal-target').value);
  if (!wid || !t || t <= 0) { toast('أكمل البيانات', 'error'); return; }
  const tp = document.querySelector('#modal-workgoal .radio-group .radio-option.active').dataset.type;
  state.workGoals.push({ id: genId(), workId: wid, type: tp, target: t });
  save();
  closeModal('workgoal');
  renderWork();
  toast('✅ تم إضافة الهدف');
}

function deleteWorkGoal(id) {
  showConfirm('حذف', 'هل تريد حذف هذا الهدف؟', () => {
    state.workGoals = state.workGoals.filter(g => g.id !== id);
    save();
    renderWork();
    toast('تم الحذف');
  });
}

// ============ 📊 WORK — ANALYTICS ============
function renderWorkAnalytics() {
  const s = document.getElementById('work-analytics-section');
  if (!s) return;
  if (!currentWorkId) { s.innerHTML = ''; return; }
  const w = state.works.find(x => x.id === currentWorkId);
  if (!w) { s.innerHTML = ''; return; }

  const ls = state.workLogs.filter(l => l.workId === currentWorkId);
  const ip = w.calculationType === 'piece';
  let tH = 0, tQ = 0;
  ls.forEach(l => {
    tH += Number(l.hours || 0);
    tQ += Number(l.quantity || 0);
  });
  const tI = ls.reduce((s, l) => {
    const a = ip ? Number(l.quantity || 0) : Number(l.hours || 0);
    return s + a * Number(w.rate);
  }, 0);

  s.innerHTML = `<div class="analytics-card"><div class="analytics-title"><span class="material-icons">analytics</span>📊 تحليل الإنتاجية</div><div class="analytics-grid">${ip ? `
    <div class="analytics-item"><div class="label">⚡ متوسط القطع/ساعة</div><div class="value primary">${tH > 0 ? fmt(tQ / tH) : '--'}</div></div>
    <div class="analytics-item"><div class="label">💰 الأجر الفعلي/ساعة</div><div class="value green">${tH > 0 ? fmt(tI / tH) + ' ' + cur() : '--'}</div></div>
    <div class="analytics-item"><div class="label">📈 إجمالي القطع</div><div class="value primary">${fmt(tQ)}</div></div>
    <div class="analytics-item"><div class="label">💰 إجمالي الأرباح</div><div class="value green">${fmt(tI)} ${cur()}</div></div>
  ` : `
    <div class="analytics-item"><div class="label">⏱️ إجمالي الساعات</div><div class="value primary">${fmt(tH)} ساعة</div></div>
    <div class="analytics-item"><div class="label">💰 إجمالي الأرباح</div><div class="value green">${fmt(tI)} ${cur()}</div></div>
    <div class="analytics-item"><div class="label">💰 أجر الساعة</div><div class="value primary">${fmt(w.rate)} ${cur()}</div></div>
    <div class="analytics-item"><div class="label">📊 عدد السجلات</div><div class="value primary">${ls.length}</div></div>
  `}</div></div>`;
}

// ============ 💰 WORK — PAYMENTS ============
function renderWorkPaymentCard() {
  const p = currentWorkId ? state.workPayments.filter(x => x.workId === currentWorkId) : [];
  const t = p.reduce((s, x) => s + Number(x.amount), 0);
  const tEl = document.getElementById('work-total-payments');
  const cEl = document.getElementById('work-payments-count');
  if (tEl) tEl.textContent = fmt(t) + ' ' + cur();
  if (cEl) cEl.textContent = p.length;
}

function initWorkPaymentModal() {
  document.getElementById('workpayment-work').innerHTML = state.works.map(w => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join('');
  if (currentWorkId) document.getElementById('workpayment-work').value = currentWorkId;
  document.getElementById('workpayment-amount').value = '';
  document.getElementById('workpayment-desc').value = '';
  const n = new Date();
  document.getElementById('workpayment-date').value = new Date(n.getTime() - n.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  document.querySelectorAll('#modal-workpayment .radio-group .radio-option').forEach((o, i) => o.classList.toggle('active', i === 0));
}

function saveWorkPayment() {
  const wid = document.getElementById('workpayment-work').value;
  const a = document.getElementById('workpayment-amount').value;
  if (!wid) { toast('اختر العمل', 'error'); return; }
  if (!a || Number(a) <= 0) { toast('المبلغ غير صحيح', 'error'); return; }
  const w = state.works.find(x => x.id === wid);
  const tp = document.querySelector('#modal-workpayment .radio-group .radio-option.active').dataset.type;
  const tn = { salary: 'راتب', payment: 'دفعة', bonus: 'مكافأة' };
  const mt = document.getElementById('workpayment-method').value;
  const ds = document.getElementById('workpayment-desc').value.trim();
  const paymentId = genId();

  const d = {
    id: paymentId,
    workId: wid,
    type: tp,
    amount: Number(a),
    date: document.getElementById('workpayment-date').value,
    method: mt,
    desc: ds || `${tn[tp]} - ${w.name}`,
    createdAt: new Date().toISOString()
  };
  state.workPayments.push(d);

  const ic = state.categories.find(c => c.type === 'income');
  if (ic) {
    state.transactions.push({
      id: genId(),
      date: d.date,
      type: 'income',
      category: ic.id,
      amount: Number(a),
      desc: `💼 ${tn[tp]} - ${w.name}${ds ? ' - ' + ds : ''}`,
      workPaymentId: paymentId
    });
  }

  save();
  closeModal('workpayment');
  renderWork();
  renderDashboard();
  toast('✅ تم الحفظ وإضافة الدخل');
}

function renderWorkPaymentsList() {
  const c = document.getElementById('workpayments-list');
  if (!c) return;
  const p = currentWorkId ? state.workPayments.filter(x => x.workId === currentWorkId) : state.workPayments;
  if (p.length === 0) {
    c.innerHTML = '<div class="empty"><span class="material-icons">payments</span><p>لا توجد دفعات</p></div>';
    return;
  }
  const ti = { salary: '💼', payment: '💰', bonus: '🎁' };
  const tn = { salary: 'راتب', payment: 'دفعة', bonus: 'مكافأة' };
  const mn = { cash: '💵 نقداً', bank: '🏦 تحويل', card: '💳 بطاقة' };
  c.innerHTML = [...p].sort((a, b) => new Date(b.date) - new Date(a.date)).map(x => {
    const w = state.works.find(y => y.id === x.workId);
    return `<div class="list-item"><div class="icon-box accent"><span class="material-icons">payments</span></div><div class="info"><div class="title">${ti[x.type]} ${tn[x.type]} - ${w ? escapeHtml(w.name) : '--'}</div><div class="sub">${new Date(x.date).toLocaleString('ar')} • ${mn[x.method] || x.method}</div></div><div class="amount income">+${fmt(x.amount)}</div><div class="actions"><button class="delete-btn" onclick="deleteWorkPayment('${x.id}')"><span class="material-icons">delete</span></button></div></div>`;
  }).join('');
}

function deleteWorkPayment(id) {
  showConfirm('حذف', 'سيتم حذف الدفعة ومعاملة الدخل المرتبطة.', () => {
    state.workPayments = state.workPayments.filter(x => x.id !== id);
    state.transactions = state.transactions.filter(t => t.workPaymentId !== id);
    save();
    renderWorkPaymentsList();
    renderWork();
    renderDashboard();
    toast('تم الحذف');
  });
}

// ============ 📈 WORK — SUMMARY ============
function renderWorkSummary() {
  const grid = document.getElementById('work-stats-grid');
  if (!grid) return;
  if (!currentWorkId) { grid.innerHTML = ''; return; }
  const ls = state.workLogs.filter(l => l.workId === currentWorkId);
  const w = state.works.find(x => x.id === currentWorkId);
  if (!w) { grid.innerHTML = ''; return; }

  const n = new Date(), td = n.toDateString(), m = n.getMonth(), y = n.getFullYear();
  const ws = new Date(n);
  ws.setDate(n.getDate() - n.getDay());
  ws.setHours(0, 0, 0, 0);

  const ip = w.calculationType === 'piece';
  const ul = w.unitName || (ip ? 'قطعة' : 'ساعة');
  const ui = ip ? '📦' : '⏱️';

  const tA = ls.filter(l => new Date(l.date).toDateString() === td)
    .reduce((s, l) => s + (ip ? Number(l.quantity) : Number(l.hours)), 0);
  const wA = ls.filter(l => { const d = new Date(l.date); return d >= ws && d <= n; })
    .reduce((s, l) => s + (ip ? Number(l.quantity) : Number(l.hours)), 0);
  const mA = ls.filter(l => { const d = new Date(l.date); return d.getMonth() === m && d.getFullYear() === y; })
    .reduce((s, l) => s + (ip ? Number(l.quantity) : Number(l.hours)), 0);
  const ttA = ls.reduce((s, l) => s + (ip ? Number(l.quantity) : Number(l.hours)), 0);

  const r = Number(w.rate);
  const mP = state.workPayments.filter(p => p.workId === currentWorkId && new Date(p.date).getMonth() === m && new Date(p.date).getFullYear() === y).reduce((s, p) => s + Number(p.amount), 0);
  const ttP = state.workPayments.filter(p => p.workId === currentWorkId).reduce((s, p) => s + Number(p.amount), 0);

  const tE = tA * r, wE = wA * r, mE = mA * r - mP, ttE = ttA * r - ttP;

  grid.innerHTML = `
    <div class="work-stat"><div class="label">${ui} اليوم</div><div class="value">${fmt(tA)} ${ul}</div></div>
    <div class="work-stat"><div class="label">${ui} الأسبوع</div><div class="value">${fmt(wA)} ${ul}</div></div>
    <div class="work-stat"><div class="label">${ui} الشهر</div><div class="value">${fmt(mA)} ${ul}</div></div>
    <div class="work-stat"><div class="label">${ui} الإجمالي</div><div class="value primary">${fmt(ttA)} ${ul}</div></div>
    <div class="work-stat"><div class="label">💵 أرباح اليوم</div><div class="value green">${fmt(tE)} ${cur()}</div></div>
    <div class="work-stat"><div class="label">💵 أرباح الأسبوع</div><div class="value green">${fmt(wE)} ${cur()}</div></div>
    <div class="work-stat"><div class="label">💰 مستحقات الشهر</div><div class="value green">${fmt(mE)} ${cur()}</div></div>
    <div class="work-stat"><div class="label">🏆 الصافي الإجمالي</div><div class="value primary">${fmt(ttE)} ${cur()}</div></div>`;
}

function renderNetSummary() {
  const card = document.getElementById('net-summary-card');
  const grid = document.getElementById('net-summary-grid');
  if (!currentWorkId || !card || !grid) {
    if (card) card.classList.remove('visible');
    return;
  }
  const work = state.works.find(w => w.id === currentWorkId);
  if (!work) { card.classList.remove('visible'); return; }
  const logs = state.workLogs.filter(l => l.workId === currentWorkId);
  const payments = state.workPayments.filter(p => p.workId === currentWorkId);
  const isPiece = work.calculationType === 'piece';
  const unitLabel = work.unitName || (isPiece ? 'قطعة' : 'ساعة');
  const totalAmount = logs.reduce((s, l) => s + (isPiece ? Number(l.quantity || 0) : Number(l.hours || 0)), 0);
  const totalIncome = totalAmount * Number(work.rate);
  const totalPayments = payments.reduce((s, p) => s + Number(p.amount), 0);
  const netRemaining = totalIncome - totalPayments;
  const remainingAmount = netRemaining / Number(work.rate);
  grid.innerHTML = `<div class="net-summary-item net-summary-total"><div class="label">🏆 المتبقي</div><div class="value">${fmt(netRemaining)} ${cur()}</div><div class="sub">مقابل ${fmt(remainingAmount)} ${unitLabel}</div></div>`;
}

function toggleWorkStats() {
  workStatsVisible = !workStatsVisible;
  const w = document.getElementById('work-stats-wrapper');
  const netCard = document.getElementById('net-summary-card');
  if (w) w.style.display = workStatsVisible ? 'block' : 'none';
  if (netCard) {
    if (workStatsVisible) netCard.classList.remove('visible');
    else { renderNetSummary(); netCard.classList.add('visible'); }
  }
  const txt = document.getElementById('toggle-stats-text');
  const icon = document.querySelector('#toggle-stats-btn .material-icons');
  if (workStatsVisible) {
    if (txt) txt.textContent = 'إخفاء التفاصيل';
    if (icon) icon.textContent = 'visibility';
  } else {
    if (txt) txt.textContent = 'إظهار التفاصيل';
    if (icon) icon.textContent = 'visibility_off';
  }
  localStorage.setItem('workStatsVisible', workStatsVisible ? '1' : '0');
}

// ============ 📋 WORK — LOGS ============
function renderWorkLogs() {
  const c = document.getElementById('work-logs-list');
  if (!c) return;
  const ls = currentWorkId ? state.workLogs.filter(l => l.workId === currentWorkId) : [];
  if (ls.length === 0) {
    c.innerHTML = '<div class="empty"><span class="material-icons">edit_note</span><p>لا توجد سجلات</p></div>';
    return;
  }
  c.innerHTML = [...ls].sort((a, b) => new Date(b.date) - new Date(a.date)).map(l => {
    const w = state.works.find(x => x.id === l.workId);
    const ip = w.calculationType === 'piece';
    const ul = w.unitName || (ip ? 'قطعة' : 'ساعة');
    let st = `${new Date(l.date).toLocaleDateString('ar')}`;
    if (ip) {
      st += ` • 📦 ${fmt(Number(l.quantity))} ${ul}`;
      if (Number(l.hours) > 0) {
        const pr = Number(l.quantity) / Number(l.hours);
        st += ` • ⏱️ ${fmt(Number(l.hours))} ساعة (⚡ ${fmt(pr)} ${ul}/ساعة)`;
      }
    } else {
      st += ` • ⏱️ ${fmt(Number(l.hours))} ساعة`;
      if (l.start) st += ` • ${l.start} → ${l.end}`;
    }
    const e = w ? Number(w.rate) * (ip ? Number(l.quantity) : Number(l.hours)) : 0;
    return `<div class="list-item"><div class="icon-box income"><span class="material-icons">${ip ? 'inventory_2' : 'schedule'}</span></div><div class="info"><div class="title">${escapeHtml(l.desc || (ip ? 'إنجاز قطع' : 'ساعات عمل'))}</div><div class="sub">${st}</div></div><div class="amount income">+${fmt(e)}</div><div class="actions"><button onclick="editWorkLog('${l.id}')"><span class="material-icons">edit</span></button><button class="delete-btn" onclick="deleteWorkLog('${l.id}')"><span class="material-icons">delete</span></button></div></div>`;
  }).join('');
}

function deleteWorkLog(id) {
  showConfirm('حذف', 'هل تريد حذف سجل العمل؟', () => {
    state.workLogs = state.workLogs.filter(l => l.id !== id);
    save();
    renderWork();
    renderDashboard();
    toast('تم الحذف');
  });
}

function updateWorkLogUI(wid) {
  const w = state.works.find(x => x.id === wid);
  if (!w) return;
  const hs = document.getElementById('worklog-hours-section');
  const qs = document.getElementById('worklog-quantity-section');
  const ql = document.getElementById('worklog-quantity-label');
  const hl = document.querySelector('#worklog-hours-section label');
  if (!hs || !qs) return;

  if (w.calculationType === 'piece') {
    qs.style.display = 'block';
    ql.textContent = `عدد ${w.unitName || 'القطع'} المنجزة *`;
    document.getElementById('worklog-quantity').value = '';
    hs.style.display = 'block';
    if (hl) hl.textContent = '⏱️ الوقت المستغرق (اختياري)';
    document.getElementById('worklog-hours').value = '';
    document.getElementById('worklog-start').value = '';
    document.getElementById('worklog-end').value = '';
  } else {
    hs.style.display = 'block';
    qs.style.display = 'none';
    if (hl) hl.textContent = 'الساعات *';
    document.getElementById('worklog-hours').value = '';
    document.getElementById('worklog-start').value = '';
    document.getElementById('worklog-end').value = '';
  }
}

function initWorkLogModal() {
  document.getElementById('worklog-id').value = '';
  document.getElementById('worklog-modal-title').textContent = 'تسجيل إنجاز';
  document.getElementById('worklog-work').innerHTML = state.works.map(w => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join('');
  if (currentWorkId) document.getElementById('worklog-work').value = currentWorkId;
  document.getElementById('worklog-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('worklog-desc').value = '';
  document.getElementById('worklog-live-stats').style.display = 'none';
  updateWorkLogUI(document.getElementById('worklog-work').value);
}

function calcWorkHours() {
  const s = document.getElementById('worklog-start').value;
  const e = document.getElementById('worklog-end').value;
  if (s && e) {
    const [sh, sm] = s.split(':').map(Number);
    const [eh, em] = e.split(':').map(Number);
    let d = (eh * 60 + em) - (sh * 60 + sm);
    if (d < 0) d += 24 * 60;
    document.getElementById('worklog-hours').value = (d / 60).toFixed(2);
  }
}

function updateLiveStats() {
  const wid = document.getElementById('worklog-work').value;
  const work = state.works.find(w => w.id === wid);
  const box = document.getElementById('worklog-live-stats');
  if (!box || !work) return;
  const q = Number(document.getElementById('worklog-quantity').value) || 0;
  const h = Number(document.getElementById('worklog-hours').value) || 0;
  if (work.calculationType === 'piece' && q > 0 && h > 0) {
    box.style.display = 'block';
    const rate = q / h, eph = (q * Number(work.rate)) / h;
    document.getElementById('live-pieces').textContent = fmt(q);
    document.getElementById('live-hours').textContent = fmt(h);
    document.getElementById('live-rate').textContent = fmt(rate);
    document.getElementById('live-earning').textContent = fmt(eph);
  } else {
    box.style.display = 'none';
  }
}

function saveWorkLog() {
  const wid = document.getElementById('worklog-work').value;
  const w = state.works.find(x => x.id === wid);
  if (!w) { toast('اختر العمل', 'error'); return; }
  const id = document.getElementById('worklog-id').value;
  let h = 0, q = 0;
  if (w.calculationType === 'piece') {
    q = Number(document.getElementById('worklog-quantity').value);
    if (!q || q <= 0) { toast('أدخل عدد القطع', 'error'); return; }
    const hi = document.getElementById('worklog-hours').value;
    if (hi && Number(hi) > 0) h = Number(hi);
  } else {
    h = Number(document.getElementById('worklog-hours').value);
    if (!h || h <= 0) { toast('أدخل عدد ساعات صحيح', 'error'); return; }
  }
  const d = {
    id: id || genId(),
    workId: wid,
    date: document.getElementById('worklog-date').value || new Date().toISOString().slice(0, 10),
    start: document.getElementById('worklog-start').value,
    end: document.getElementById('worklog-end').value,
    hours: h,
    quantity: q,
    desc: document.getElementById('worklog-desc').value.trim()
  };
  if (id) {
    const i = state.workLogs.findIndex(l => l.id === id);
    state.workLogs[i] = d;
  } else state.workLogs.push(d);
  save();
  closeModal('worklog');
  renderWork();
  renderDashboard();
  toast('✅ تم الحفظ');
}

function editWorkLog(id) {
  const l = state.workLogs.find(x => x.id === id);
  if (!l) return;
  openModal('worklog');
  document.getElementById('worklog-id').value = l.id;
  document.getElementById('worklog-modal-title').textContent = 'تعديل سجل';
  document.getElementById('worklog-work').value = l.workId;
  document.getElementById('worklog-date').value = l.date.slice(0, 10);
  document.getElementById('worklog-desc').value = l.desc || '';
  updateWorkLogUI(l.workId);
  setTimeout(() => {
    const w = state.works.find(x => x.id === l.workId);
    if (w && w.calculationType === 'piece') {
      document.getElementById('worklog-quantity').value = l.quantity || '';
      document.getElementById('worklog-hours').value = l.hours || '';
      document.getElementById('worklog-start').value = l.start || '';
      document.getElementById('worklog-end').value = l.end || '';
      updateLiveStats();
    } else {
      document.getElementById('worklog-hours').value = l.hours || '';
      document.getElementById('worklog-start').value = l.start || '';
      document.getElementById('worklog-end').value = l.end || '';
    }
  }, 50);
}

// ============ 📊 WORK — STATUS ============
function initWorkStatusModal() {
  if (!currentWorkId) { toast('اختر عمل أولاً', 'error'); return; }
  const w = state.works.find(x => x.id === currentWorkId);
  if (w) document.getElementById('workstatus-status').value = w.status || 'active';
}

function updateWorkStatus() {
  if (!currentWorkId) { toast('اختر عمل أولاً', 'error'); return; }
  const s = document.getElementById('workstatus-status').value;
  const w = state.works.find(x => x.id === currentWorkId);
  if (w) {
    w.status = s;
    save();
    closeModal('workstatus');
    renderWork();
    toast('✅ تم تحديث الحالة');
  }
}

// ============ 📄 PDF REPORT ============
function initWorkReportModal() {
  if (!currentWorkId) { closeModal('workreport'); toast('⚠️ اختر عمل أولاً', 'error'); return; }
  document.querySelectorAll('#modal-workreport .radio-option').forEach((o, i) => o.classList.toggle('active', i === 0));
  const cr = document.getElementById('report-custom-range');
  if (cr) cr.style.display = 'none';
  ['report-include-summary', 'report-include-logs', 'report-include-payments'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = true;
  });
}

async function generateWorkReport() {
  if (!currentWorkId) { toast('⚠️ اختر عمل أولاً', 'error'); return; }
  const work = state.works.find(w => w.id === currentWorkId);
  if (!work) { toast('⚠️ العمل غير موجود', 'error'); return; }

  const reportType = document.querySelector('#modal-workreport .radio-option.active').dataset.type;
  const now = new Date();
  let fromDate, toDate, periodName;

  if (reportType === 'daily') {
    fromDate = new Date(now); fromDate.setHours(0, 0, 0, 0);
    toDate = new Date(now); toDate.setHours(23, 59, 59, 999);
    periodName = `تقرير يومي - ${now.toLocaleDateString('ar', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
  } else if (reportType === 'weekly') {
    fromDate = new Date(now); fromDate.setDate(now.getDate() - now.getDay()); fromDate.setHours(0, 0, 0, 0);
    toDate = new Date(fromDate); toDate.setDate(fromDate.getDate() + 6); toDate.setHours(23, 59, 59, 999);
    periodName = `تقرير أسبوعي - من ${fromDate.toLocaleDateString('ar')} إلى ${toDate.toLocaleDateString('ar')}`;
  } else if (reportType === 'monthly') {
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); toDate.setHours(23, 59, 59, 999);
    periodName = `تقرير شهري - ${now.toLocaleDateString('ar', { month: 'long', year: 'numeric' })}`;
  } else {
    const df = document.getElementById('report-date-from').value;
    const dt = document.getElementById('report-date-to').value;
    if (!df || !dt) { toast('⚠️ حدد النطاق الزمني', 'error'); return; }
    fromDate = new Date(df); fromDate.setHours(0, 0, 0, 0);
    toDate = new Date(dt); toDate.setHours(23, 59, 59, 999);
    periodName = `تقرير مخصص - من ${fromDate.toLocaleDateString('ar')} إلى ${toDate.toLocaleDateString('ar')}`;
  }

  const logs = state.workLogs.filter(l => {
    if (l.workId !== currentWorkId) return false;
    const d = new Date(l.date);
    return d >= fromDate && d <= toDate;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const payments = state.workPayments.filter(p => {
    if (p.workId !== currentWorkId) return false;
    const d = new Date(p.date);
    return d >= fromDate && d <= toDate;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const isPiece = work.calculationType === 'piece';
  const totalAmount = logs.reduce((s, l) => s + (isPiece ? Number(l.quantity || 0) : Number(l.hours || 0)), 0);
  const totalHours = logs.reduce((s, l) => s + Number(l.hours || 0), 0);
  const totalEarning = totalAmount * Number(work.rate);
  const totalPayments = payments.reduce((s, p) => s + Number(p.amount), 0);
  const netEarning = totalEarning - totalPayments;

  const reportHtml = buildReportHtml({
    work, periodName, logs, payments,
    stats: { isPiece, totalAmount, totalHours, totalEarning, totalPayments, netEarning }
  });

  toast('⏳ جاري إنشاء التقرير...');
  try {
    await createPdfFromHtml(reportHtml, `Report_${work.name}_${reportType}_${now.toISOString().slice(0, 10)}.pdf`);
    closeModal('workreport');
    toast('✅ تم إنشاء التقرير');
  } catch (err) {
    console.error(err);
    toast('❌ حدث خطأ', 'error');
  }
}

function buildReportHtml(data) {
  const { work, periodName, logs, payments, stats } = data;
  const { isPiece, totalAmount, totalHours, totalEarning, totalPayments, netEarning } = stats;
  const unitLabel = work.unitName || (isPiece ? 'قطعة' : 'ساعة');
  const statusInfo = WS[work.status] || WS.active;

  let html = `<div class="pdf-report-container">`;
  html += `<div class="pdf-header"><h1>💼 ${escapeHtml(work.name)}</h1><p>${periodName}</p><p style="margin-top:5px;font-size:11px">تاريخ الإصدار: ${new Date().toLocaleString('ar')}</p></div>`;
  html += `<div class="pdf-section"><div class="pdf-section-title">📋 معلومات العمل</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px"><div><strong>العميل:</strong> ${escapeHtml(work.client) || '--'}</div><div><strong>النوع:</strong> ${isPiece ? '📦 حساب بالقطعة' : '⏱️ حساب ساعي'}</div><div><strong>${isPiece ? 'سعر القطعة' : 'سعر الساعة'}:</strong> ${fmt(work.rate)} ${cur()}</div><div><strong>الحالة:</strong> <span class="pdf-badge ${statusInfo.c}">${statusInfo.i} ${statusInfo.n}</span></div></div></div>`;

  html += `<div class="pdf-section"><div class="pdf-section-title">📊 الملخص المالي</div><div class="pdf-stats-grid"><div class="pdf-stat-item"><div class="pdf-stat-label">${isPiece ? '📦 إجمالي القطع' : '⏱️ إجمالي الساعات'}</div><div class="pdf-stat-value primary">${fmt(totalAmount)} ${unitLabel}</div></div>${isPiece ? `<div class="pdf-stat-item"><div class="pdf-stat-label">⏱️ إجمالي الساعات</div><div class="pdf-stat-value">${fmt(totalHours)} ساعة</div></div>` : ''}<div class="pdf-stat-item"><div class="pdf-stat-label">💼 إجمالي المستحق</div><div class="pdf-stat-value green">${fmt(totalEarning)} ${cur()}</div></div><div class="pdf-stat-item"><div class="pdf-stat-label">💰 إجمالي المدفوع</div><div class="pdf-stat-value">${fmt(totalPayments)} ${cur()}</div></div><div class="pdf-stat-item" style="grid-column:span 2;background:linear-gradient(135deg,rgba(16,185,129,.1),rgba(52,211,153,.05));border:2px solid #10b981"><div class="pdf-stat-label">🏆 صافي المستحق</div><div class="pdf-stat-value ${netEarning >= 0 ? 'green' : 'red'}" style="font-size:20px">${fmt(netEarning)} ${cur()}</div></div></div></div>`;

  if (logs.length > 0) {
    html += `<div class="pdf-section"><div class="pdf-section-title">📋 سجلات العمل (${logs.length})</div><table class="pdf-table"><thead><tr><th>التاريخ</th><th>${isPiece ? 'القطع' : 'الساعات'}</th><th>الأجر</th></tr></thead><tbody>`;
    logs.forEach(l => {
      const amount = isPiece ? Number(l.quantity || 0) : Number(l.hours || 0);
      const earning = amount * Number(work.rate);
      html += `<tr><td>${new Date(l.date).toLocaleDateString('ar')}</td><td>${fmt(amount)} ${unitLabel}</td><td style="color:#10b981;font-weight:700">+${fmt(earning)} ${cur()}</td></tr>`;
    });
    html += `</tbody></table></div>`;
  }

  if (payments.length > 0) {
    const mn = { cash: '💵 نقداً', bank: '🏦 تحويل', card: '💳 بطاقة' };
    const tn = { salary: '💼 راتب', payment: '💰 دفعة', bonus: '🎁 مكافأة' };
    html += `<div class="pdf-section"><div class="pdf-section-title">💰 الدفعات (${payments.length})</div><table class="pdf-table"><thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>الطريقة</th></tr></thead><tbody>`;
    payments.forEach(p => {
      html += `<tr><td>${new Date(p.date).toLocaleDateString('ar')}</td><td>${tn[p.type] || p.type}</td><td style="color:#10b981;font-weight:700">+${fmt(p.amount)} ${cur()}</td><td>${mn[p.method] || p.method}</td></tr>`;
    });
    html += `</tbody></table></div>`;
  }

  html += `<div class="pdf-footer"><p>💼 تم إنشاء هذا التقرير بواسطة تطبيق المحفظة المالية v15.4</p><p>📅 ${new Date().toLocaleString('ar')}</p></div></div>`;
  return html;
}

async function createPdfFromHtml(html, filename) {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:800px;background:#fff;';
  container.innerHTML = html;
  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
    const { jsPDF } = window.jspdf;
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = 210, pdfHeight = 297;
    const imgWidth = pdfWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight, position = 10;
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight - 20;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;
    }
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

// ============ ✅ تحقق من نجاح التحميل ============
console.log('✅ ui-work.js loaded');