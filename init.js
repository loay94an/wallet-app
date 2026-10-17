// ============================================================
// 📦 init.js — التهيئة + القفل + الحاسبة + الأحداث
// ============================================================
// ⚠️ يجب أن يُحمّل آخر ملف (بعد core.js و ui.js)
// ⚠️ يحتوي على initApp() التي تُشغّل التطبيق
// ============================================================

// ============ 🔒 SECURITY (PIN/PATTERN) ============
let lockMode = 'pin';
let enteredPin = '';
let enteredPattern = [];
let isDrawingPattern = false;
let setupPattern = [];

function initLockScreen() {
  const p = document.getElementById('pin-pad');
  if (p) {
    const k = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
    p.innerHTML = k.map(x =>
      x === '' ? '<div></div>' :
      x === '⌫' ? `<button class="pin-key action" onclick="pinBackspace()"><span class="material-icons">backspace</span></button>` :
      `<button class="pin-key" onclick="pinInput('${x}')">${x}</button>`
    ).join('');
  }

  const g = document.getElementById('pattern-grid');
  const sg = document.getElementById('setup-pattern-grid');
  let h = '';
  for (let i = 0; i < 9; i++) h += `<div class="pattern-dot" data-index="${i}"></div>`;
  if (g) { g.innerHTML = h; setupPatternEvents(g, 'unlock'); }
  if (sg) { sg.innerHTML = h; setupPatternEvents(sg, 'setup'); }
  updatePinDots();
}

function setupPatternEvents(grid, mode) {
  const s = e => {
    e.preventDefault();
    isDrawingPattern = true;
    if (mode === 'setup') { setupPattern = []; updateSetupPatternSvg(); }
    else { enteredPattern = []; updatePatternSvg(); }
  };
  const m = e => {
    if (!isDrawingPattern) return;
    e.preventDefault();
    const t = e.touches ? e.touches[0] : e;
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (el && el.classList.contains('pattern-dot')) {
      const i = parseInt(el.dataset.index);
      if (mode === 'setup') {
        if (!setupPattern.includes(i)) {
          setupPattern.push(i);
          el.classList.add('active');
          updateSetupPatternSvg();
        }
      } else {
        if (!enteredPattern.includes(i)) {
          enteredPattern.push(i);
          el.classList.add('active');
          updatePatternSvg();
        }
      }
    }
  };
  const en = () => {
    if (!isDrawingPattern) return;
    isDrawingPattern = false;
    if (mode !== 'setup') verifyPattern();
  };
  grid.addEventListener('touchstart', s, { passive: false });
  grid.addEventListener('touchmove', m, { passive: false });
  grid.addEventListener('touchend', en);
  grid.addEventListener('mousedown', s);
  grid.addEventListener('mousemove', m);
  grid.addEventListener('mouseup', en);
  grid.addEventListener('mouseleave', en);
}

function getPC(g, i) {
  const d = g.querySelectorAll('.pattern-dot')[i];
  const gr = g.getBoundingClientRect();
  const dr = d.getBoundingClientRect();
  return { x: dr.left + dr.width / 2 - gr.left, y: dr.top + dr.height / 2 - gr.top };
}

function updatePatternSvg() {
  const s = document.getElementById('pattern-svg');
  const g = document.getElementById('pattern-grid');
  if (!s || !g) return;
  let l = '';
  for (let i = 1; i < enteredPattern.length; i++) {
    const a = getPC(g, enteredPattern[i - 1]);
    const b = getPC(g, enteredPattern[i]);
    l += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
  }
  s.innerHTML = l;
}

function updateSetupPatternSvg() {
  const s = document.getElementById('setup-pattern-svg');
  const g = document.getElementById('setup-pattern-grid');
  if (!s || !g) return;
  let l = '';
  for (let i = 1; i < setupPattern.length; i++) {
    const a = getPC(g, setupPattern[i - 1]);
    const b = getPC(g, setupPattern[i]);
    l += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
  }
  s.innerHTML = l;
}

function switchLockMode(m) {
  lockMode = m;
  document.getElementById('tab-pin').classList.toggle('active', m === 'pin');
  document.getElementById('tab-pattern').classList.toggle('active', m === 'pattern');
  document.getElementById('pin-mode').style.display = m === 'pin' ? 'block' : 'none';
  document.getElementById('pattern-mode').style.display = m === 'pattern' ? 'block' : 'none';
  enteredPin = '';
  enteredPattern = [];
  updatePinDots();
  document.querySelectorAll('#pattern-grid .pattern-dot').forEach(d => d.classList.remove('active'));
  document.getElementById('pattern-svg').innerHTML = '';
  document.getElementById('pin-error').textContent = '';
  document.getElementById('pattern-error').textContent = '';
}

function pinInput(n) {
  if (enteredPin.length >= 6) return;
  enteredPin += n;
  updatePinDots();
  const r = state.security.pin ? state.security.pin.length : 4;
  if (enteredPin.length === r) setTimeout(verifyPin, 200);
}

function pinBackspace() {
  enteredPin = enteredPin.slice(0, -1);
  updatePinDots();
}

function updatePinDots() {
  const d = document.getElementById('pin-dots');
  if (!d) return;
  const r = state.security.pin ? state.security.pin.length : 4;
  let h = '';
  for (let i = 0; i < r; i++) h += `<div class="pin-dot ${i < enteredPin.length ? 'filled' : ''}"></div>`;
  d.innerHTML = h;
}

function verifyPin() {
  if (enteredPin === state.security.pin) {
    unlockApp();
  } else {
    const e = document.getElementById('pin-error');
    e.textContent = '❌ الرمز غير صحيح';
    e.classList.add('shake');
    setTimeout(() => { e.classList.remove('shake'); e.textContent = ''; }, 2000);
    enteredPin = '';
    updatePinDots();
  }
}

function verifyPattern() {
  if (enteredPattern.length < 4) {
    const e = document.getElementById('pattern-error');
    e.textContent = '❌ ارسم 4 نقاط على الأقل';
    e.classList.add('shake');
    setTimeout(() => { e.classList.remove('shake'); e.textContent = ''; }, 2000);
    enteredPattern = [];
    document.querySelectorAll('#pattern-grid .pattern-dot').forEach(d => d.classList.remove('active'));
    document.getElementById('pattern-svg').innerHTML = '';
    return;
  }
  const s = state.security.pattern;
  if (s && JSON.stringify(enteredPattern) === JSON.stringify(s)) {
    unlockApp();
  } else {
    const e = document.getElementById('pattern-error');
    e.textContent = '❌ النمط غير صحيح';
    e.classList.add('shake');
    setTimeout(() => { e.classList.remove('shake'); e.textContent = ''; }, 2000);
    enteredPattern = [];
    document.querySelectorAll('#pattern-grid .pattern-dot').forEach(d => d.classList.remove('active'));
    document.getElementById('pattern-svg').innerHTML = '';
  }
}

function unlockApp() {
  isAppLocked = false;
  document.getElementById('lock-screen').classList.remove('active');
  toast('✅ تم الفتح');
}

function lockApp() {
  if (!state.security.enabled) { toast('⚠️ القفل غير مفعّل', 'error'); return; }
  isAppLocked = true;
  enteredPin = '';
  enteredPattern = [];
  updatePinDots();
  document.querySelectorAll('#pattern-grid .pattern-dot').forEach(d => d.classList.remove('active'));
  document.getElementById('pattern-svg').innerHTML = '';
  document.getElementById('lock-screen').classList.add('active');
}

function checkLock() {
  if (state.security.enabled) {
    isAppLocked = true;
    document.getElementById('lock-screen').classList.add('active');
  }
}

function selectSecurityType(el) {
  document.querySelectorAll('#security-type-group .radio-option').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  const v = el.dataset.value;
  document.getElementById('pin-setup').style.display = v === 'pin' ? 'block' : 'none';
  document.getElementById('pattern-setup').style.display = v === 'pattern' ? 'block' : 'none';
}

function saveSecurity() {
  const s = document.querySelector('#security-type-group .radio-option.active');
  if (!s) { toast('اختر نوع القفل', 'error'); return; }
  const t = s.dataset.value;
  if (t === 'off') {
    state.security = { enabled: false, type: 'off', pin: '', pattern: [] };
  } else if (t === 'pin') {
    const p = document.getElementById('new-pin').value;
    const c = document.getElementById('confirm-pin').value;
    if (p.length < 4 || p.length > 6) { toast('الرمز 4-6 أرقام', 'error'); return; }
    if (!/^\d+$/.test(p)) { toast('أرقام فقط', 'error'); return; }
    if (p !== c) { toast('الرمزان غير متطابقين', 'error'); return; }
    state.security = { enabled: true, type: 'pin', pin: p, pattern: [] };
  } else if (t === 'pattern') {
    if (setupPattern.length < 4) { toast('ارسم 4 نقاط على الأقل', 'error'); return; }
    state.security = { enabled: true, type: 'pattern', pin: '', pattern: [...setupPattern] };
  }
  save();
  closeModal('security');
  toast('✅ تم الحفظ');
}

function initSecurityModal() {
  const c = state.security.enabled ? state.security.type : 'off';
  document.querySelectorAll('#security-type-group .radio-option').forEach(o => o.classList.toggle('active', o.dataset.value === c));
  document.getElementById('pin-setup').style.display = c === 'pin' ? 'block' : 'none';
  document.getElementById('pattern-setup').style.display = c === 'pattern' ? 'block' : 'none';
  document.getElementById('new-pin').value = '';
  document.getElementById('confirm-pin').value = '';
  setupPattern = [];
  document.querySelectorAll('#setup-pattern-grid .pattern-dot').forEach(d => d.classList.remove('active'));
  document.getElementById('setup-pattern-svg').innerHTML = '';
}

// ============ 🧮 CALCULATOR ============
function calcInput(v) {
  if (calcExpression === '0' || calcExpression === '') calcExpression = '';
  calcExpression += v;
  document.getElementById('calc-display').textContent = calcExpression.replace(/\*/g, '×').replace(/\//g, '÷');
}

function calcClear() {
  calcExpression = '';
  document.getElementById('calc-display').textContent = '0';
}

function calcBack() {
  calcExpression = calcExpression.slice(0, -1);
  document.getElementById('calc-display').textContent = calcExpression ? calcExpression.replace(/\*/g, '×').replace(/\//g, '÷') : '0';
}

function calcEqual() {
  try {
    let e = calcExpression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
    if (!/^[\d+\-*/().%\s]+$/.test(e)) throw new Error();
    const r = Function('"use strict";return (' + e + ')')();
    if (!isFinite(r)) throw new Error();
    document.getElementById('calc-display').textContent = r;
    calcExpression = String(r);
  } catch (e) {
    document.getElementById('calc-display').textContent = 'خطأ';
    calcExpression = '';
  }
}

function calcQuick() {
  const a = Number(document.getElementById('quick-amount').value) || 0;
  const p = Number(document.getElementById('quick-percent').value) || 0;
  const v = a * p / 100;
  document.getElementById('quick-result').innerHTML = `<div class="quick-row"><span>المبلغ</span><span>${fmt(a)}</span></div><div class="quick-row"><span>النسبة</span><span>${p}%</span></div><div class="quick-row"><span>القيمة</span><span>${fmt(v)}</span></div><div class="quick-row"><span>➕ إضافة</span><span style="color:var(--green)">${fmt(a + v)}</span></div><div class="quick-row"><span>➖ خصم</span><span style="color:var(--red)">${fmt(a - v)}</span></div>`;
}

// ============ 🎯 GLOBAL EVENTS ============
document.addEventListener('click', e => {
  document.querySelectorAll('.modal.active').forEach(m => {
    if (e.target === m) m.classList.remove('active');
  });
  if (!e.target.closest('.nb-dropdown') && !e.target.closest('.nb-menu-btn') && !e.target.closest('#nb-global-btn')) {
    if (typeof nbCloseAllDropdowns === 'function') nbCloseAllDropdowns();
  }

  // ✅ معالجة اختيار نوع تقرير PDF (custom range)
  const option = e.target.closest('#modal-workreport .radio-option');
  if (option) {
    setTimeout(() => {
      const selected = document.querySelector('#modal-workreport .radio-option.active');
      if (selected) {
        const customRange = document.getElementById('report-custom-range');
        if (customRange) {
          if (selected.dataset.type === 'custom') {
            customRange.style.display = 'block';
            const today = new Date().toISOString().slice(0, 10);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            document.getElementById('report-date-to').value = today;
            document.getElementById('report-date-from').value = weekAgo.toISOString().slice(0, 10);
          } else {
            customRange.style.display = 'none';
          }
        }
      }
    }, 10);
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (typeof nbCloseAllDropdowns === 'function') nbCloseAllDropdowns();
    document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    if (document.getElementById('confirm-dialog').classList.contains('active')) closeConfirm();
  }
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  if (!document.getElementById('page-notebook').classList.contains('active')) return;
  if (e.key === 'n' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); nbHandleAdd(); }
  if (e.key === 'f' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); nbOpenSearch(); }
});

window.addEventListener('beforeunload', () => {
  if (typeof nbFlushAutoSave === 'function') nbFlushAutoSave();
  save();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (typeof nbFlushAutoSave === 'function') nbFlushAutoSave();
    save();
  }
});

// ============ 🚀 INIT APP ============
async function initApp() {
  const overlay = document.getElementById('loading-overlay');
  const title = document.getElementById('loading-title');
  try {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang && (savedLang === 'ar' || savedLang === 'en')) currentLang = savedLang;

    if (overlay && title) title.textContent = 'جاري بناء الواجهة...';
    buildPages();
    buildModals();

    if (overlay && title) title.textContent = 'جاري تهيئة قاعدة البيانات...';
    await storage.init();

    if (overlay && title) title.textContent = 'جاري تحميل البيانات...';
    await load();

    applyTranslations();
    setLanguage(currentLang);
    setTheme(currentTheme);
    initLockScreen();
    renderDashboard();
    updateAllWorkTimerDisplays();
    checkLock();

    if (searchFiltersOpen) {
      setTimeout(() => {
        searchFiltersOpen = false;
        toggleSearchFilters();
      }, 100);
    }

    console.log('🚀 التطبيق جاهز');
  } catch (e) {
    console.error('❌ فشل التهيئة:', e);
    try {
      initLockScreen();
      renderDashboard();
      updateAllWorkTimerDisplays();
      checkLock();
    } catch (err) { console.error('فشل كامل:', err); }
  } finally {
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 500);
    }
  }
}

// ============ ✅ تشغيل التطبيق ============
initApp();
console.log('✅ init.js loaded — app started');