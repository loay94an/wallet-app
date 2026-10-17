// ============================================================
// 📦 core.js — الأساس (State + Storage + Helpers + Timer States)
// ============================================================
// ⚠️ هذا الملف يجب أن يُحمّل أولًا قبل ui.js و init.js
// ============================================================

// ============ 🗄️ STORAGE MANAGER ============
class StorageManager {
  constructor() {
    this.dbName = 'WalletFinanceDB';
    this.storeName = 'appData';
    this.dbVersion = 1;
    this.db = null;
    this.useIndexedDB = true;
    this.fallbackKey = 'wallet_v15_4';
  }
  async init() {
    if (!('indexedDB' in window)) { this.useIndexedDB = false; return; }
    return new Promise((resolve) => {
      const req = indexedDB.open(this.dbName, this.dbVersion);
      req.onerror = () => { this.useIndexedDB = false; resolve(); };
      req.onsuccess = () => { this.db = req.result; resolve(); };
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) db.createObjectStore(this.storeName, { keyPath: 'key' });
      };
    });
  }
  async save(data) {
    if (this.useIndexedDB && this.db) {
      try { await this._set('state', data); return true; } catch (e) { this.useIndexedDB = false; }
    }
    try { localStorage.setItem(this.fallbackKey, JSON.stringify(data)); return true; } catch (e) { return false; }
  }
  async load() {
    if (this.useIndexedDB && this.db) {
      try { const d = await this._get('state'); if (d !== null) return d; } catch (e) { this.useIndexedDB = false; }
    }
    try { const r = localStorage.getItem(this.fallbackKey); if (r) return JSON.parse(r); } catch (e) {}
    return null;
  }
  async clear() {
    if (this.useIndexedDB && this.db) {
      try {
        const tx = this.db.transaction([this.storeName], 'readwrite');
        const st = tx.objectStore(this.storeName);
        await new Promise((res, rej) => { const r = st.clear(); r.onsuccess = () => res(); r.onerror = () => rej(r.error); });
      } catch (e) {}
    }
    [this.fallbackKey, 'wallet_v15_3', 'wallet_v15_2', 'currentWorkId', 'timer_state', 'timer_states_v2', 'workStatsVisible', 'appLanguage', 'appTheme', 'nb_viewMode', 'quick_notes', 'todo_list', 'idea_box', 'passwords_vault'].forEach(k => localStorage.removeItem(k));
  }
  _set(k, v) {
    return new Promise((res, rej) => {
      const tx = this.db.transaction([this.storeName], 'readwrite');
      const st = tx.objectStore(this.storeName);
      const r = st.put({ key: k, value: v, updatedAt: Date.now() });
      r.onsuccess = () => res();
      r.onerror = () => rej(r.error);
    });
  }
  _get(k) {
    return new Promise((res, rej) => {
      const tx = this.db.transaction([this.storeName], 'readonly');
      const st = tx.objectStore(this.storeName);
      const r = st.get(k);
      r.onsuccess = () => { if (r.result && r.result.value) res(r.result.value); else res(null); };
      r.onerror = () => rej(r.error);
    });
  }
  async getStorageInfo() {
    let idbSize = 0, lsSize = 0;
    if (this.useIndexedDB && this.db) {
      try { const d = await this._get('state'); if (d) idbSize = new Blob([JSON.stringify(d)]).size; } catch (e) {}
    }
    const old = localStorage.getItem(this.fallbackKey);
    if (old) lsSize = new Blob([old]).size;
    return {
      usingIndexedDB: this.useIndexedDB && this.db !== null,
      indexedDBSize: (idbSize / 1024).toFixed(2) + ' KB',
      localStorageSize: (lsSize / 1024).toFixed(2) + ' KB'
    };
  }
}
const storage = new StorageManager();

// ============ 🌍 TRANSLATIONS ============
const T = {
  ar: {
    appTitle: 'المحفظة المالية',
    wallet: 'المحفظة',
    workManagement: 'إدارة الأعمال',
    infoCenter: '🎯 مركز المعلومات',
    finTools: 'الأدوات المالية',
    calculator: '🧮 الحاسبة',
    currencyConverter: '💱 محول العملات',
    quickCalc: '⚡ حسابات سريعة',
    notebook: '📝 المفكرة',
    home: 'الرئيسية',
    work: 'العمل',
    info: 'المعلومات',
    tools: 'الأدوات'
  },
  en: {
    appTitle: 'Financial Wallet',
    wallet: 'Wallet',
    workManagement: 'Work Management',
    infoCenter: '🎯 Info Center',
    finTools: 'Financial Tools',
    calculator: '🧮 Calculator',
    currencyConverter: '💱 Currency',
    quickCalc: '⚡ Quick Calc',
    notebook: '📝 Notebook',
    home: 'Home',
    work: 'Work',
    info: 'Info',
    tools: 'Tools'
  }
};

let currentLang = 'ar', currentTheme = 'purple';

function t(k) { return (T[currentLang] && T[currentLang][k]) || k; }

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    const tr = t(k);
    if (tr && tr !== k) el.textContent = tr;
  });
  const html = document.documentElement;
  if (currentLang === 'ar') { html.setAttribute('dir', 'rtl'); html.setAttribute('lang', 'ar'); }
  else { html.setAttribute('dir', 'ltr'); html.setAttribute('lang', 'en'); }
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('appLanguage', lang);
  document.querySelectorAll('.lang-option').forEach(o => o.classList.toggle('active', o.dataset.lang === lang));
  applyTranslations();
  if (typeof renderDashboard === 'function') renderDashboard();
  toast(lang === 'ar' ? '✅ تم تغيير اللغة' : '✅ Language changed');
}

function setTheme(theme) {
  currentTheme = theme;
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('appTheme', theme);
  document.querySelectorAll('.theme-option').forEach(o => o.classList.toggle('active', o.dataset.theme === theme));
  const colors = { purple: '#7c3aed', blue: '#3b82f6', green: '#22c55e', orange: '#f97316', gray: '#6366f1' };
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors[theme]);
  toast(currentLang === 'ar' ? '✅ تم تغيير اللون' : '✅ Theme changed');
}

// ============ 📦 STATE ============
let state = {
  transactions: [],
  categories: [],
  people: [],
  debts: [],
  payments: [],
  works: [],
  workLogs: [],
  workPayments: [],
  workGoals: [],
  budgets: [],
  financialGoals: [],
  exchangeRates: {},
  settings: { currency: 'ر.س' },
  security: { enabled: false, type: 'off', pin: '', pattern: [] },
  notebooks: []
};

let currentWorkId = null;
let currentPersonId = null;
let walletFilter = 'all';
let calcExpression = '';
let isAppLocked = false;
let workStatsVisible = true;
let searchFiltersOpen = false;

const STORAGE_KEY = 'wallet_v15_4';

const WS = {
  active:    { n: 'نشط',   i: '🟢', c: 'active' },
  pending:   { n: 'معلق',  i: '🟡', c: 'pending' },
  delayed:   { n: 'متأخر', i: '🔴', c: 'delayed' },
  completed: { n: 'مكتمل', i: '✅', c: 'completed' },
  cancelled: { n: 'ملغي',  i: '⚫', c: 'cancelled' }
};

const CURRENCY_NAMES = {
  SAR: '🇸🇦 ريال', AED: '🇦🇪 درهم', EGP: '🇪🇬 جنيه', USD: '🇺🇸 دولار',
  EUR: '🇪🇺 يورو', GBP: '🇬🇧 جنيه', KWD: '🇰🇼 دينار', QAR: '🇶🇦 ريال',
  JOD: '🇯🇴 دينار', BHD: '🇧🇭 دينار', OMR: '🇴🇲 ريال', TND: '🇹🇳 دينار',
  MAD: '🇲🇦 درهم', DZD: '🇩🇿 دينار'
};

const DEFAULT_RATES = {
  SAR: 3.75, AED: 3.67, EGP: 50, USD: 1, EUR: 0.92, GBP: 0.79,
  KWD: 0.31, QAR: 3.64, JOD: 0.71, BHD: 0.38, OMR: 0.38,
  TND: 3.15, MAD: 10, DZD: 135
};

// ============ ⏱️ MULTI-TIMER STATES ============
// { workId: { seconds, running, startedAt, pieces } }
let timerStates = {};
// { workId: intervalId }
let timerIntervals = {};

function loadTimerStatesFromStorage() {
  try {
    const saved = localStorage.getItem('timer_states_v2');
    if (saved) {
      timerStates = JSON.parse(saved);
      Object.keys(timerStates).forEach(wid => {
        const st = timerStates[wid];
        if (st.running && st.startedAt) {
          const elapsed = Math.floor((Date.now() - new Date(st.startedAt).getTime()) / 1000);
          st.seconds = (st.seconds || 0) + elapsed;
          st.startedAt = new Date().toISOString();
          startWorkTimerInterval(wid);
        }
      });
    }
  } catch (e) { console.warn('فشل تحميل حالات المؤقت:', e); }
}

function saveTimerStatesToStorage() {
  try {
    const toSave = {};
    Object.keys(timerStates).forEach(wid => {
      const st = timerStates[wid];
      toSave[wid] = {
        seconds: st.seconds,
        running: st.running,
        startedAt: st.startedAt,
        pieces: st.pieces || 0
      };
    });
    localStorage.setItem('timer_states_v2', JSON.stringify(toSave));
  } catch (e) { console.warn('فشل حفظ حالات المؤقت:', e); }
}

function getTimerState(workId) {
  if (!timerStates[workId]) {
    timerStates[workId] = { seconds: 0, running: false, startedAt: null, pieces: 0 };
  }
  if (!timerStates[workId].pieces) timerStates[workId].pieces = 0;
  return timerStates[workId];
}

function startWorkTimerInterval(wid) {
  if (timerIntervals[wid]) clearInterval(timerIntervals[wid]);
  timerIntervals[wid] = setInterval(() => {
    updateWorkTimerDisplay(wid);
    saveTimerStatesToStorage();
  }, 1000);
}

function stopWorkTimerInterval(wid) {
  if (timerIntervals[wid]) {
    clearInterval(timerIntervals[wid]);
    delete timerIntervals[wid];
  }
}

function updateWorkTimerDisplay(wid) {
  const el = document.getElementById('timer-' + wid);
  if (!el) return;
  const st = getTimerState(wid);
  let totalSeconds = st.seconds;
  if (st.running && st.startedAt) {
    totalSeconds += Math.floor((Date.now() - new Date(st.startedAt).getTime()) / 1000);
  }
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  el.textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  el.classList.toggle('running', st.running);
  const card = document.getElementById('work-timer-card-' + wid);
  if (card) card.classList.toggle('running', st.running);
}

function updateAllWorkTimerDisplays() {
  if (!state.works) return;
  state.works.forEach(w => updateWorkTimerDisplay(w.id));
}

// ============ 💾 STORAGE (save/load) ============
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  storage.save(state).catch(e => console.warn('فشل IndexedDB:', e));
}

async function load() {
  let data = await storage.load();
  if (!data) {
    const d = localStorage.getItem(STORAGE_KEY);
    if (d) try { data = JSON.parse(d); } catch (e) {}
  }
  if (data) state = { ...state, ...data };

  if (!state.workPayments) state.workPayments = [];
  if (!state.workGoals) state.workGoals = [];
  if (!state.budgets) state.budgets = [];
  if (!state.financialGoals) state.financialGoals = [];
  if (!state.notebooks) state.notebooks = [];
  if (!state.security) state.security = { enabled: false, type: 'off', pin: '', pattern: [] };
  if (!state.settings.currency || typeof state.settings.currency !== 'string') state.settings.currency = 'ر.س';
  if (!state.exchangeRates) state.exchangeRates = { ...DEFAULT_RATES };

  if (state.works) {
    state.works = state.works.map(w => ({
      ...w,
      calculationType: w.calculationType || 'hourly',
      unitName: w.unitName || 'ساعة',
      status: w.status || 'active',
      startDate: w.startDate || null,
      endDate: w.endDate || null
    }));
  }

  if (!state.categories.length) {
    state.categories = [
      { id: genId(), name: 'طعام', type: 'expense' },
      { id: genId(), name: 'راتب', type: 'income' },
      { id: genId(), name: 'مواصلات', type: 'expense' }
    ];
    save();
  }

  const sw = localStorage.getItem('currentWorkId');
  if (sw && state.works.find(w => w.id === sw)) currentWorkId = sw;

  const ss = localStorage.getItem('workStatsVisible');
  if (ss === '0') workStatsVisible = false;

  const sfo = localStorage.getItem('searchFiltersOpen');
  if (sfo === '1') searchFiltersOpen = true;

  try {
    setTimeout(() => {
      loadTimerStatesFromStorage();
      updateAllWorkTimerDisplays();
    }, 200);
  } catch (e) {}

  const savedLang = localStorage.getItem('appLanguage');
  if (savedLang && (savedLang === 'ar' || savedLang === 'en')) currentLang = savedLang;

  const savedTheme = localStorage.getItem('appTheme');
  if (savedTheme && ['purple', 'blue', 'green', 'orange', 'gray'].includes(savedTheme)) {
    currentTheme = savedTheme;
    document.body.setAttribute('data-theme', currentTheme);
  }
}

// ============ 🔧 HELPERS ============
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

function fmt(n) {
  return (Number(n) || 0).toFixed(2);
}

function cur() {
  return state.settings.currency || 'ر.س';
}

function toast(m, type = 'success') {
  const e = document.getElementById('toast');
  if (!e) return;
  e.textContent = m;
  e.className = 'toast show ' + type;
  setTimeout(() => e.classList.remove('show'), 2500);
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d), today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((today - target) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'اليوم';
  if (diff === 1) return 'أمس';
  if (diff === -1) return 'غداً';
  if (diff > 1 && diff < 7) return `منذ ${diff} أيام`;
  return date.toLocaleDateString(currentLang === 'ar' ? 'ar' : 'en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// ============ 📊 CALCULATIONS (Shared) ============
function calcWorkIncome() {
  let h = 0;
  state.workLogs.forEach(l => {
    const w = state.works.find(x => x.id === l.workId);
    if (w) {
      if (w.calculationType === 'piece') h += Number(w.rate) * Number(l.quantity || 0);
      else h += Number(w.rate) * Number(l.hours || 0);
    }
  });
  const p = state.workPayments.reduce((s, x) => s + Number(x.amount), 0);
  return h - p;
}

function calcTotalDebt(type) {
  const d = state.debts.filter(x => x.type === type);
  const tot = d.reduce((s, x) => s + Number(x.amount), 0);
  const paid = state.payments
    .filter(p => d.find(x => x.id === p.debtId))
    .reduce((s, x) => s + Number(x.amount), 0);
  return Math.max(0, tot - paid);
}

// ============ ✅ تحقق من نجاح التحميل ============
console.log('✅ core.js loaded');