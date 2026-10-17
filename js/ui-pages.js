// ============================================================
// 📦 ui-pages.js — بناء الواجهة + التنقل
// ============================================================
// ⚠️ يجب تحميله بعد core.js وقبل باقي ملفات ui-*
// ============================================================

// ============ 🏗️ BUILD PAGES ============
function buildPages() {
  // ---------- Dashboard ----------
  document.getElementById('page-dashboard').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="label">💰 الرصيد</div><div class="value" id="stat-balance">0.00</div></div>
      <div class="stat-card income"><div class="label">📈 دخل الشهر</div><div class="value" id="stat-income">0.00</div></div>
      <div class="stat-card expense"><div class="label">📉 مصروفات الشهر</div><div class="value" id="stat-expense">0.00</div></div>
      <div class="stat-card"><div class="label">📊 صافي التدفق</div><div class="value" id="stat-net">0.00</div></div>
      <div class="stat-card expense"><div class="label">🤝 ديون عليك</div><div class="value" id="stat-debt">0.00</div></div>
      <div class="stat-card income"><div class="label">💵 مستحقات لك</div><div class="value" id="stat-receivable">0.00</div></div>
      <div class="stat-card"><div class="label">💼 دخل العمل</div><div class="value" id="stat-work">0.00</div></div>
      <div class="stat-card"><div class="label">📊 المعاملات</div><div class="value" id="stat-count">0</div></div>
    </div>
    <div class="smart-circle-section">
      <div class="smart-circle-title"><span class="material-icons">insights</span>🎯 نظرة شاملة ذكية</div>
      <div class="smart-circle-wrapper">
        <div class="smart-circle">
          <svg viewBox="0 0 200 200">
            <circle class="smart-circle-bg" cx="100" cy="100" r="80"/>
            <g id="smart-circle-segments"></g>
          </svg>
          <div class="smart-circle-center">
            <div class="total-label">الإجمالي</div>
            <div class="total-value" id="circle-total">0</div>
            <div class="total-currency" id="circle-currency">ر.س</div>
          </div>
        </div>
        <div class="smart-circle-legend" id="smart-circle-legend"></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title"><span class="material-icons">lightbulb</span>💡 رؤى ذكية</div>
      <div id="insights-container"><div class="empty"><span class="material-icons">auto_awesome</span><p>أضف معاملاتك لتظهر الرؤى</p></div></div>
    </div>
    <div class="section">
      <div class="section-title"><span class="material-icons">history</span>🕐 آخر المعاملات</div>
      <div id="recent-transactions"><div class="empty"><span class="material-icons">receipt_long</span><p>لا توجد معاملات بعد</p></div></div>
    </div>`;

  // ---------- Wallet ----------
  document.getElementById('page-wallet').innerHTML = `
    <div class="page-title"><span class="material-icons">receipt_long</span>المحفظة</div>
    <div class="search-box">
      <div class="search-row">
        <div class="search-input-wrapper">
          <span class="material-icons search-icon">search</span>
          <input type="text" class="search-input" id="wallet-search" placeholder="ابحث في المعاملات..." oninput="searchTransactions()">
          <button class="search-clear-btn" id="search-clear-btn" onclick="clearSearch()"><span class="material-icons" style="font-size:18px">close</span></button>
        </div>
        <button class="search-toggle-btn" id="search-toggle-btn" onclick="toggleSearchFilters()"><span class="material-icons">tune</span></button>
      </div>
      <div class="search-filters-advanced" id="search-filters-advanced">
        <div class="search-filters-header" style="grid-column:span 2;margin-top:0;padding-top:0;border-top:none">
          <span class="search-filters-label">⚙️ الفلاتر المتقدمة</span>
          <button class="search-reset-btn" onclick="resetSearchFilters()">🔄 إعادة تعيين</button>
        </div>
        <input type="date" class="search-filter" id="search-date-from" onchange="searchTransactions()">
        <input type="date" class="search-filter" id="search-date-to" onchange="searchTransactions()">
        <input type="number" class="search-filter" id="search-amount-min" placeholder="أقل مبلغ" oninput="searchTransactions()">
        <input type="number" class="search-filter" id="search-amount-max" placeholder="أعلى مبلغ" oninput="searchTransactions()">
        <select class="search-filter" id="search-category" onchange="searchTransactions()"><option value="">🏷️ جميع الفئات</option></select>
        <select class="search-filter" id="search-type" onchange="searchTransactions()">
          <option value="">📋 الكل</option>
          <option value="income">💰 دخل فقط</option>
          <option value="expense">💸 مصروف فقط</option>
        </select>
      </div>
      <div class="search-results-count" id="search-results-count"></div>
    </div>
    <div class="tabs" id="wallet-tabs">
      <button class="tab active" onclick="filterWallet('all',this)">الكل</button>
      <button class="tab" onclick="filterWallet('income',this)">💰 دخل</button>
      <button class="tab" onclick="filterWallet('expense',this)">💸 مصروف</button>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
      <button class="btn btn-primary" style="flex:1;min-width:100px" onclick="openModal('transaction')"><span class="material-icons">add</span>معاملة</button>
      <button class="btn btn-ghost" style="flex:1;min-width:100px" onclick="openModal('category')"><span class="material-icons">category</span>الفئات</button>
    </div>
    <div id="transactions-list"></div>`;

  // ---------- People ----------
  document.getElementById('page-people').innerHTML = `
    <div id="people-list-view">
      <div class="page-title"><span class="material-icons">people</span>حساباتي</div>
      <div class="summary-row">
        <div class="summary-card"><div class="label">🔴 ديون</div><div class="value" style="color:var(--red)" id="people-debt">0.00</div></div>
        <div class="summary-card"><div class="label">🟢 مستحقات</div><div class="value" style="color:var(--green)" id="people-receivable">0.00</div></div>
        <div class="summary-card"><div class="label">📊 الصافي</div><div class="value" id="people-net">0.00</div></div>
      </div>
      <button class="btn btn-primary" onclick="openModal('person')" style="margin-bottom:14px"><span class="material-icons">person_add</span>إضافة شخص</button>
      <div id="people-list"></div>
    </div>
    <div id="person-detail-view" class="person-detail">
      <button class="btn btn-ghost btn-sm" onclick="closePersonDetail()" style="margin-bottom:14px;width:auto;display:inline-flex"><span class="material-icons">arrow_forward</span>رجوع</button>
      <div id="person-detail-content"></div>
    </div>`;

  // ---------- Work ----------
  document.getElementById('page-work').innerHTML = `
    <div class="page-title"><span class="material-icons">work</span>إدارة الأعمال</div>
    <div class="tabs" id="work-tabs"></div>
    <button class="btn btn-ghost btn-sm" onclick="toggleWorkStats()" id="toggle-stats-btn" style="margin-bottom:14px;width:auto;display:inline-flex">
      <span class="material-icons" style="font-size:18px">visibility</span>
      <span id="toggle-stats-text">إخفاء التفاصيل</span>
    </button>
    <div class="net-summary-card" id="net-summary-card">
      <div class="net-summary-title"><span class="material-icons">account_balance_wallet</span>💰 الصافي الإجمالي المتبقي</div>
      <div class="net-summary-grid" id="net-summary-grid"></div>
    </div>
    <div id="work-stats-wrapper">
      <div id="work-info-card"></div>
      <div id="work-goals-section"></div>
      <div id="work-analytics-section"></div>
      <div class="work-payment-card">
        <div class="work-payment-title"><span class="material-icons">payments</span>💼 الدفعات والرواتب</div>
        <div class="work-payment-stats">
          <div class="work-payment-stat"><div class="label">💰 إجمالي الدفعات</div><div class="value" id="work-total-payments">0.00</div></div>
          <div class="work-payment-stat"><div class="label">📊 عدد الدفعات</div><div class="value" id="work-payments-count">0</div></div>
        </div>
      </div>
      <div class="work-summary" id="work-stats-grid"></div>
    </div>
    <div class="section">
      <div class="section-title"><span class="material-icons">timer</span>⏱️ مؤقت العمل الحالي</div>
      <div id="work-timer-cards"></div>
    </div>
    <div class="section">
      <div class="section-title"><span class="material-icons">build</span>إجراءات</div>
      <div class="btn-row">
        <button class="btn btn-primary" onclick="openModal('work')"><span class="material-icons">add</span>عمل جديد</button>
        <button class="btn btn-ghost" onclick="openModal('worklog')"><span class="material-icons">edit_note</span>تسجيل إنجاز</button>
      </div>
      <div class="btn-row">
        <button class="btn btn-accent" onclick="openModal('workpayment')"><span class="material-icons">payments</span>💰 دفعة/راتب</button>
        <button class="btn btn-ghost" onclick="openModal('workpaymentslist')"><span class="material-icons">list</span>📋 سجل الدفعات</button>
      </div>
      <div class="btn-row">
        <button class="btn btn-warning" onclick="openModal('workgoal')"><span class="material-icons">flag</span>🎯 إضافة هدف</button>
        <button class="btn btn-ghost" onclick="openModal('workstatus')"><span class="material-icons">update</span>📊 تحديث الحالة</button>
      </div>
      <div class="btn-row">
        <button class="btn btn-success" onclick="openModal('workreport')" style="grid-column:span 2"><span class="material-icons">picture_as_pdf</span>📄 تصدير تقرير PDF</button>
      </div>
    </div>
    <div class="section">
      <div class="section-title"><span class="material-icons">history</span>📋 سجلات العمل</div>
      <div id="work-logs-list"></div>
    </div>`;

  // ---------- Info Hub ----------
  document.getElementById('page-info').innerHTML = `
    <div class="page-title"><span class="material-icons">hub</span>🎯 مركز المعلومات</div>
    <div class="info-hub-tabs">
      <button class="info-hub-tab active" onclick="switchInfoTab('transactions',this)">💱 المعاملات</button>
      <button class="info-hub-tab" onclick="switchInfoTab('people',this)">👥 الأشخاص</button>
      <button class="info-hub-tab" onclick="switchInfoTab('work',this)">💼 العمل</button>
      <button class="info-hub-tab" onclick="switchInfoTab('reports',this)">📈 التقارير</button>
      <button class="info-hub-tab" onclick="switchInfoTab('budget',this)">💰 الميزانية</button>
      <button class="info-hub-tab" onclick="switchInfoTab('goals',this)">🎯 الأهداف</button>
    </div>
    <div id="info-content"></div>`;

  // ---------- Tools ----------
  document.getElementById('page-tools').innerHTML = `
    <div class="page-title"><span class="material-icons">build</span>🛠️ الأدوات المالية</div>
    <div style="font-size:13px;font-weight:700;color:var(--muted);margin-bottom:10px;display:flex;align-items:center;gap:6px"><span class="material-icons" style="font-size:16px">star</span>الأدوات الأساسية</div>
    <div class="tool-grid" style="margin-bottom:18px">
      <div class="tool-card" onclick="openModal('calculator')"><span class="material-icons">calculate</span><div class="name">🧮 الحاسبة</div></div>
      <div class="tool-card" onclick="openModal('currency')"><span class="material-icons">currency_exchange</span><div class="name">💱 محول العملات</div></div>
      <div class="tool-card" onclick="openModal('quickcalc')"><span class="material-icons">functions</span><div class="name">⚡ حسابات سريعة</div></div>
      <div class="tool-card" onclick="showPage('notebook',null)" style="background:linear-gradient(135deg,rgba(124,58,237,.1),rgba(236,72,153,.05));border:2px solid var(--primary)"><span class="material-icons">auto_stories</span><div class="name">📝 المفكرة</div></div>
    </div>
    <div style="font-size:13px;font-weight:700;color:var(--muted);margin-bottom:10px;display:flex;align-items:center;gap:6px"><span class="material-icons" style="font-size:16px">note</span>المفكرات السريعة</div>
    <div class="tool-grid-mini" style="margin-bottom:18px">
      <div class="tool-card-mini" onclick="openModal('quicknote')" style="--card-color:var(--accent)"><div class="tool-icon-mini" style="background:linear-gradient(135deg,var(--accent),var(--accent2))"><span class="material-icons">edit_note</span></div><div class="tool-name-mini">ملاحظة سريعة</div></div>
      <div class="tool-card-mini" onclick="openModal('todolist')" style="--card-color:var(--green)"><div class="tool-icon-mini" style="background:linear-gradient(135deg,var(--green),var(--green2))"><span class="material-icons">checklist</span></div><div class="tool-name-mini">قائمة المهام</div></div>
      <div class="tool-card-mini" onclick="openModal('ideabox')" style="--card-color:var(--orange)"><div class="tool-icon-mini" style="background:linear-gradient(135deg,var(--orange),var(--orange2))"><span class="material-icons">lightbulb</span></div><div class="tool-name-mini">صندوق الأفكار</div></div>
      <div class="tool-card-mini" onclick="openModal('passwords')" style="--card-color:var(--red)"><div class="tool-icon-mini" style="background:linear-gradient(135deg,var(--red),var(--red2))"><span class="material-icons">vpn_key</span></div><div class="tool-name-mini">كلمات المرور</div></div>
    </div>
    <div style="font-size:13px;font-weight:700;color:var(--muted);margin-bottom:10px;display:flex;align-items:center;gap:6px"><span class="material-icons" style="font-size:16px">percent</span>النسب والضرائب</div>
    <div class="tool-grid-mini" style="margin-bottom:18px">
      <div class="tool-card-mini" onclick="openModal('percentcalc')" style="--card-color:var(--primary)"><div class="tool-icon-mini" style="background:linear-gradient(135deg,var(--primary),var(--primary2))"><span class="material-icons">percent</span></div><div class="tool-name-mini">حاسبة النسبة</div></div>
      <div class="tool-card-mini" onclick="openModal('vatcalc')" style="--card-color:var(--green)"><div class="tool-icon-mini" style="background:linear-gradient(135deg,var(--green),var(--green2))"><span class="material-icons">receipt_long</span></div><div class="tool-name-mini">حاسبة الضريبة</div></div>
      <div class="tool-card-mini" onclick="openModal('discountcalc')" style="--card-color:var(--accent)"><div class="tool-icon-mini" style="background:linear-gradient(135deg,var(--accent),var(--accent2))"><span class="material-icons">local_offer</span></div><div class="tool-name-mini">حاسبة الخصم</div></div>
      <div class="tool-card-mini" onclick="openModal('pricecompare')" style="--card-color:var(--orange)"><div class="tool-icon-mini" style="background:linear-gradient(135deg,var(--orange),var(--orange2))"><span class="material-icons">balance</span></div><div class="tool-name-mini">مقارنة الأسعار</div></div>
    </div>
    <div style="font-size:13px;font-weight:700;color:var(--muted);margin-bottom:10px;display:flex;align-items:center;gap:6px"><span class="material-icons" style="font-size:16px">savings</span>التمويل والادخار</div>
    <div class="tool-grid-mini" style="margin-bottom:18px">
      <div class="tool-card-mini" onclick="openModal('loancalc')" style="--card-color:var(--blue)"><div class="tool-icon-mini" style="background:linear-gradient(135deg,var(--blue),#60a5fa)"><span class="material-icons">account_balance</span></div><div class="tool-name-mini">حاسبة القروض</div></div>
      <div class="tool-card-mini" onclick="openModal('savingscalc')" style="--card-color:var(--green)"><div class="tool-icon-mini" style="background:linear-gradient(135deg,#10b981,#34d399)"><span class="material-icons">savings</span></div><div class="tool-name-mini">مخطط الادخار</div></div>
      <div class="tool-card-mini" onclick="openModal('daycounter')" style="--card-color:var(--cyan)"><div class="tool-icon-mini" style="background:linear-gradient(135deg,var(--cyan),#22d3ee)"><span class="material-icons">date_range</span></div><div class="tool-name-mini">عداد الأيام</div></div>
      <div class="tool-card-mini" onclick="openModal('timecalc')" style="--card-color:var(--primary)"><div class="tool-icon-mini" style="background:linear-gradient(135deg,#8b5cf6,#a78bfa)"><span class="material-icons">schedule</span></div><div class="tool-name-mini">محول الوقت</div></div>
    </div>`;

  // ---------- Notebook ----------
  document.getElementById('page-notebook').innerHTML = `
    <button class="nb-global-btn" id="nb-global-btn" onclick="nbToggleGlobalMenu(event)" title="أدوات المفكرة"><span class="material-icons">more_vert</span></button>
    <div class="nb-dropdown nb-global-dropdown" id="nb-global-dropdown"></div>
    <button class="nb-back-btn" id="nb-back-btn" onclick="nbGoBack()" style="display:none"><span class="material-icons">arrow_forward</span><span>رجوع</span></button>
    <div class="nb-breadcrumb" id="nb-breadcrumb"></div>
    <div id="nb-main-view">
      <div class="page-title" id="nb-page-title"><span class="material-icons">auto_stories</span><span>المفكرات</span></div>
      <div id="nb-subtitle" style="font-size:13px;color:var(--muted);margin-bottom:16px"></div>
      <div class="nb-list" id="nb-list"></div>
    </div>
    <div id="nb-note-view" style="display:none">
      <div class="nb-note-view">
        <input type="text" class="nb-note-title" id="nb-note-title" placeholder="العنوان..." oninput="nbAutoSave()">
        <div class="nb-note-date-row">
          <span class="material-icons">calendar_today</span>
          <input type="date" id="nb-note-date" onchange="nbAutoSave()">
          <button class="nb-note-link-badge" id="nb-link-badge" onclick="openLinkModal()" style="display:none">
            <span class="material-icons">link</span>
            <span id="nb-link-text">مرتبط</span>
            <span class="material-icons" style="font-size:12px" onclick="event.stopPropagation();nbUnlinkFromView()">close</span>
          </button>
          <button class="nb-note-link-badge" onclick="openLinkModal()" style="background:rgba(139,139,181,.15);color:var(--muted);border-color:rgba(139,139,181,.3)">
            <span class="material-icons">add_link</span><span>ربط</span>
          </button>
        </div>
        <textarea class="nb-note-content" id="nb-note-content" placeholder="اكتب ملاحظتك هنا..." oninput="nbAutoSave()"></textarea>
        <div class="nb-save-indicator" id="nb-save-indicator"><span class="material-icons">check_circle</span><span>تم الحفظ</span></div>
        <div class="nb-note-actions">
          <button class="btn btn-ghost btn-sm" onclick="nbAddChild()" style="flex:1"><span class="material-icons">add</span><span>إضافة فرعية</span></button>
          <button class="btn btn-ghost btn-sm" onclick="nbOpenTagEditor(nbGetNoteInPath()?.id)"><span class="material-icons">sell</span></button>
          <button class="btn btn-danger btn-sm" onclick="nbDeleteCurrent()"><span class="material-icons">delete</span></button>
        </div>
      </div>
    </div>`;
}

// ============ 🪟 BUILD MODALS ============
function buildModals() {
  document.getElementById('modals-container').innerHTML = `
    <div class="modal" id="modal-transaction"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">receipt_long</span><span id="transaction-modal-title">إضافة معاملة</span></h3><button class="icon-btn" onclick="closeModal('transaction')"><span class="material-icons">close</span></button></div>
      <input type="hidden" id="transaction-id">
      <div class="form-group"><label>التاريخ</label><input type="datetime-local" id="transaction-date"></div>
      <div class="form-group"><label>النوع</label><div class="radio-group"><div class="radio-option active" data-type="expense" onclick="selectRadio(this)">💸 مصروف</div><div class="radio-option" data-type="income" onclick="selectRadio(this)">💰 دخل</div></div></div>
      <div class="form-group"><label>الفئة</label><select id="transaction-category"></select></div>
      <div class="form-group"><label>المبلغ *</label><input type="number" id="transaction-amount" step="0.01" min="0"></div>
      <div class="form-group"><label>الوصف</label><input type="text" id="transaction-desc" maxlength="100"></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="saveTransaction()"><span class="material-icons">save</span>حفظ</button><button class="btn btn-ghost" onclick="closeModal('transaction')">إلغاء</button></div>
    </div></div>

    <div class="modal" id="modal-category"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">category</span>الفئات</h3><button class="icon-btn" onclick="closeModal('category')"><span class="material-icons">close</span></button></div>
      <div id="categories-list"></div>
      <div style="margin-top:14px;padding-top:14px;border-top:2px solid var(--border)">
        <div class="form-group"><label>اسم الفئة *</label><input type="text" id="category-name" maxlength="30"></div>
        <div class="form-group"><label>النوع</label><div class="radio-group"><div class="radio-option active" data-type="expense" onclick="selectRadio(this)">💸 مصروف</div><div class="radio-option" data-type="income" onclick="selectRadio(this)">💰 دخل</div></div></div>
        <button class="btn btn-primary" onclick="saveCategory()"><span class="material-icons">add</span>إضافة</button>
      </div>
    </div></div>

    <div class="modal" id="modal-person"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">person_add</span><span id="person-modal-title">إضافة شخص</span></h3><button class="icon-btn" onclick="closeModal('person')"><span class="material-icons">close</span></button></div>
      <input type="hidden" id="person-id">
      <div class="form-group"><label>الاسم *</label><input type="text" id="person-name" maxlength="50"></div>
      <div class="form-group"><label>الهاتف</label><input type="tel" id="person-phone" maxlength="20"></div>
      <div class="form-group"><label>البريد</label><input type="email" id="person-email" maxlength="100"></div>
      <div class="form-group"><label>ملاحظات</label><textarea id="person-notes" rows="2" maxlength="200"></textarea></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="savePerson()"><span class="material-icons">save</span>حفظ</button><button class="btn btn-ghost" onclick="closeModal('person')">إلغاء</button></div>
    </div></div>

    <div class="modal" id="modal-debt"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">handshake</span>إضافة دين</h3><button class="icon-btn" onclick="closeModal('debt')"><span class="material-icons">close</span></button></div>
      <input type="hidden" id="debt-person-id">
      <div class="form-group"><label>النوع</label><div class="radio-group"><div class="radio-option active" data-type="debt" onclick="selectRadio(this)">🔴 دين عليك</div><div class="radio-option" data-type="receivable" onclick="selectRadio(this)">🟢 مستحق لك</div></div></div>
      <div class="form-group"><label>المبلغ *</label><input type="number" id="debt-amount" step="0.01" min="0"></div>
      <div class="form-group"><label>الوصف</label><input type="text" id="debt-desc" maxlength="100"></div>
      <button class="btn btn-primary" onclick="saveDebt()"><span class="material-icons">save</span>حفظ</button>
    </div></div>

    <div class="modal" id="modal-payment"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">payments</span><span id="payment-modal-title">تسجيل دفعة</span></h3><button class="icon-btn" onclick="closeModal('payment')"><span class="material-icons">close</span></button></div>
      <input type="hidden" id="payment-id"><input type="hidden" id="payment-debt-id">
      <div class="form-group"><label>المبلغ *</label><input type="number" id="payment-amount" step="0.01" min="0"></div>
      <div class="form-group"><label>التاريخ</label><input type="datetime-local" id="payment-date"></div>
      <div class="form-group"><label>الطريقة</label><select id="payment-method"><option value="cash">💵 نقداً</option><option value="bank">🏦 تحويل</option><option value="card">💳 بطاقة</option></select></div>
      <div class="form-group"><label>ملاحظات</label><input type="text" id="payment-notes" maxlength="100"></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="savePayment()"><span class="material-icons">save</span><span id="payment-save-text">حفظ</span></button><button class="btn btn-ghost" onclick="closeModal('payment')">إلغاء</button></div>
    </div></div>

    <div class="modal" id="modal-work"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">work</span><span id="work-modal-title">إضافة عمل</span></h3><button class="icon-btn" onclick="closeModal('work')"><span class="material-icons">close</span></button></div>
      <input type="hidden" id="work-id">
      <div class="form-group"><label>اسم العمل *</label><input type="text" id="work-name" maxlength="50"></div>
      <div class="form-group"><label>العميل</label><input type="text" id="work-client" maxlength="50"></div>
      <div class="form-group"><label>نوع الحساب</label><div class="radio-group"><div class="radio-option active" data-type="hourly" onclick="selectRadio(this);toggleWorkTypeUI()">⏱️ حساب ساعي</div><div class="radio-option" data-type="piece" onclick="selectRadio(this);toggleWorkTypeUI()">📦 حساب بالقطعة</div></div></div>
      <div class="form-group"><label id="work-rate-label">سعر الساعة *</label><input type="number" id="work-rate" step="0.01" min="0"></div>
      <div class="form-group" id="work-unit-group" style="display:none"><label>اسم الوحدة</label><input type="text" id="work-unit" value="قطعة" maxlength="20"></div>
      <div class="form-group"><label>حالة المشروع</label><select id="work-status"><option value="active">🟢 نشط</option><option value="pending">🟡 معلق</option><option value="delayed">🔴 متأخر</option><option value="completed">✅ مكتمل</option><option value="cancelled">⚫ ملغي</option></select></div>
      <div class="form-group"><label>تاريخ البدء</label><input type="date" id="work-start-date"></div>
      <div class="form-group"><label>تاريخ التسليم</label><input type="date" id="work-end-date"></div>
      <div class="form-group"><label>وصف العمل</label><textarea id="work-desc" rows="2" maxlength="200"></textarea></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="saveWork()"><span class="material-icons">save</span>حفظ</button><button class="btn btn-ghost" onclick="closeModal('work')">إلغاء</button></div>
    </div></div>

    <div class="modal" id="modal-worklog"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">edit_note</span><span id="worklog-modal-title">تسجيل إنجاز</span></h3><button class="icon-btn" onclick="closeModal('worklog')"><span class="material-icons">close</span></button></div>
      <input type="hidden" id="worklog-id">
      <div class="form-group"><label>العمل *</label><select id="worklog-work" onchange="updateWorkLogUI(this.value);updateLiveStats()"></select></div>
      <div class="form-group"><label>التاريخ</label><input type="date" id="worklog-date"></div>
      <div id="worklog-hours-section">
        <div class="form-group"><label>الساعات *</label><input type="number" id="worklog-hours" step="0.01" min="0" max="24" oninput="updateLiveStats()"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-group"><label>وقت البدء</label><input type="time" id="worklog-start" onchange="calcWorkHours();updateLiveStats()"></div>
          <div class="form-group"><label>وقت الانتهاء</label><input type="time" id="worklog-end" onchange="calcWorkHours();updateLiveStats()"></div>
        </div>
      </div>
      <div class="form-group" id="worklog-quantity-section" style="display:none"><label id="worklog-quantity-label">عدد القطع *</label><input type="number" id="worklog-quantity" step="1" min="0" oninput="updateLiveStats()"></div>
      <div id="worklog-live-stats" class="live-stats-box" style="display:none">
        <div class="live-stats-title"><span class="material-icons" style="font-size:18px">analytics</span>📊 إحصائيات هذا السجل</div>
        <div class="live-stats-grid">
          <div class="live-stat-item"><div class="label">📦 القطع</div><div class="value" style="color:var(--green)" id="live-pieces">0</div></div>
          <div class="live-stat-item"><div class="label">⏱️ الساعات</div><div class="value" style="color:var(--blue)" id="live-hours">0</div></div>
          <div class="live-stat-item"><div class="label">⚡ قطع/ساعة</div><div class="value" style="color:var(--primary)" id="live-rate">0</div></div>
          <div class="live-stat-item"><div class="label">💰 الأجر/ساعة</div><div class="value" style="color:var(--accent)" id="live-earning">0</div></div>
        </div>
      </div>
      <div class="form-group"><label>الوصف</label><input type="text" id="worklog-desc" maxlength="100"></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="saveWorkLog()"><span class="material-icons">save</span>حفظ</button><button class="btn btn-ghost" onclick="closeModal('worklog')">إلغاء</button></div>
    </div></div>

    <div class="modal" id="modal-workpayment"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">payments</span>💰 استلام دفعة/راتب</h3><button class="icon-btn" onclick="closeModal('workpayment')"><span class="material-icons">close</span></button></div>
      <div class="form-group"><label>العمل *</label><select id="workpayment-work"></select></div>
      <div class="form-group"><label>نوع الدفعة</label><div class="radio-group"><div class="radio-option active" data-type="salary" onclick="selectRadio(this)">💼 راتب</div><div class="radio-option" data-type="payment" onclick="selectRadio(this)">💰 دفعة</div><div class="radio-option" data-type="bonus" onclick="selectRadio(this)">🎁 مكافأة</div></div></div>
      <div class="form-group"><label>المبلغ *</label><input type="number" id="workpayment-amount" step="0.01" min="0"></div>
      <div class="form-group"><label>التاريخ</label><input type="datetime-local" id="workpayment-date"></div>
      <div class="form-group"><label>طريقة الاستلام</label><select id="workpayment-method"><option value="cash">💵 نقداً</option><option value="bank">🏦 تحويل</option><option value="card">💳 بطاقة</option></select></div>
      <div class="form-group"><label>الوصف</label><input type="text" id="workpayment-desc" maxlength="100"></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="saveWorkPayment()"><span class="material-icons">save</span>حفظ</button><button class="btn btn-ghost" onclick="closeModal('workpayment')">إلغاء</button></div>
    </div></div>

    <div class="modal" id="modal-workpaymentslist"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">list</span>📋 سجل الدفعات</h3><button class="icon-btn" onclick="closeModal('workpaymentslist')"><span class="material-icons">close</span></button></div>
      <div id="workpayments-list"></div>
    </div></div>

    <div class="modal" id="modal-workgoal"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">flag</span>🎯 إضافة هدف</h3><button class="icon-btn" onclick="closeModal('workgoal')"><span class="material-icons">close</span></button></div>
      <div class="form-group"><label>العمل *</label><select id="workgoal-work"></select></div>
      <div class="form-group"><label>نوع الهدف</label><div class="radio-group"><div class="radio-option active" data-type="daily" onclick="selectRadio(this)">يومي</div><div class="radio-option" data-type="weekly" onclick="selectRadio(this)">أسبوعي</div><div class="radio-option" data-type="monthly" onclick="selectRadio(this)">شهري</div></div></div>
      <div class="form-group"><label>الكمية المستهدفة *</label><input type="number" id="workgoal-target" step="1" min="1"></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="saveWorkGoal()"><span class="material-icons">save</span>حفظ</button><button class="btn btn-ghost" onclick="closeModal('workgoal')">إلغاء</button></div>
    </div></div>

    <div class="modal" id="modal-workstatus"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">update</span>📊 تحديث الحالة</h3><button class="icon-btn" onclick="closeModal('workstatus')"><span class="material-icons">close</span></button></div>
      <div class="form-group"><label>حالة المشروع</label><select id="workstatus-status"><option value="active">🟢 نشط</option><option value="pending">🟡 معلق</option><option value="delayed">🔴 متأخر</option><option value="completed">✅ مكتمل</option><option value="cancelled">⚫ ملغي</option></select></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="updateWorkStatus()"><span class="material-icons">save</span>تحديث</button><button class="btn btn-ghost" onclick="closeModal('workstatus')">إلغاء</button></div>
    </div></div>

    <div class="modal" id="modal-workreport"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">picture_as_pdf</span>📄 تصدير تقرير PDF</h3><button class="icon-btn" onclick="closeModal('workreport')"><span class="material-icons">close</span></button></div>
      <div style="background:rgba(124,58,237,.1);border:1px solid var(--primary);border-radius:12px;padding:12px;margin-bottom:14px;font-size:13px;color:var(--primary)">💡 سيتم إنشاء تقرير PDF احترافي</div>
      <div class="form-group"><label>نوع التقرير *</label><div class="radio-group"><div class="radio-option active" data-type="daily" onclick="selectRadio(this)">📅 يومي</div><div class="radio-option" data-type="weekly" onclick="selectRadio(this)">📆 أسبوعي</div><div class="radio-option" data-type="monthly" onclick="selectRadio(this)">🗓️ شهري</div><div class="radio-option" data-type="custom" onclick="selectRadio(this)">⚙️ مخصص</div></div></div>
      <div id="report-custom-range" style="display:none"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="form-group"><label>من تاريخ</label><input type="date" id="report-date-from"></div><div class="form-group"><label>إلى تاريخ</label><input type="date" id="report-date-to"></div></div></div>
      <div class="form-group"><label>محتويات التقرير</label><div style="background:var(--bg3);border-radius:10px;padding:12px;border:1px solid var(--border)">
        <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer"><input type="checkbox" id="report-include-summary" checked> 📊 ملخص عام</label>
        <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer"><input type="checkbox" id="report-include-logs" checked> 📋 سجلات العمل</label>
        <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer"><input type="checkbox" id="report-include-payments" checked> 💰 جدول الدفعات</label>
      </div></div>
      <div class="btn-row"><button class="btn btn-success" onclick="generateWorkReport()"><span class="material-icons">download</span>إنشاء PDF</button><button class="btn btn-ghost" onclick="closeModal('workreport')">إلغاء</button></div>
    </div></div>

    <div class="modal" id="modal-security"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">security</span>🔒 إعدادات الأمان</h3><button class="icon-btn" onclick="closeModal('security')"><span class="material-icons">close</span></button></div>
      <div class="form-group"><label>تفعيل القفل</label><div class="radio-group" id="security-type-group"><div class="radio-option" data-value="off" onclick="selectSecurityType(this)">🔓 معطل</div><div class="radio-option" data-value="pin" onclick="selectSecurityType(this)">🔢 PIN</div><div class="radio-option" data-value="pattern" onclick="selectSecurityType(this)">🔷 نمط</div></div></div>
      <div id="pin-setup" style="display:none"><div class="form-group"><label>رمز PIN (4-6 أرقام)</label><input type="password" id="new-pin" maxlength="6"></div><div class="form-group"><label>تأكيد الرمز</label><input type="password" id="confirm-pin" maxlength="6"></div></div>
      <div id="pattern-setup" style="display:none"><div style="background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.3);border-radius:12px;padding:12px;font-size:13px;color:var(--primary);margin-bottom:12px">ارسم النمط (4 نقاط على الأقل)</div><div class="pattern-container" style="width:240px;height:240px"><svg class="pattern-svg" id="setup-pattern-svg" viewBox="0 0 180 180"></svg><div class="pattern-grid" id="setup-pattern-grid"></div></div></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="saveSecurity()"><span class="material-icons">save</span>حفظ</button><button class="btn btn-ghost" onclick="closeModal('security')">إلغاء</button></div>
    </div></div>

    <div class="modal" id="modal-calculator"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">calculate</span>🧮 الحاسبة</h3><button class="icon-btn" onclick="closeModal('calculator')"><span class="material-icons">close</span></button></div>
      <div class="calc-display" id="calc-display">0</div>
      <div class="calc-grid">
        <button class="calc-btn clear" onclick="calcClear()">C</button>
        <button class="calc-btn back" onclick="calcBack()">⌫</button>
        <button class="calc-btn op" onclick="calcInput('%')">%</button>
        <button class="calc-btn op" onclick="calcInput('/')">÷</button>
        <button class="calc-btn" onclick="calcInput('7')">7</button>
        <button class="calc-btn" onclick="calcInput('8')">8</button>
        <button class="calc-btn" onclick="calcInput('9')">9</button>
        <button class="calc-btn op" onclick="calcInput('*')">×</button>
        <button class="calc-btn" onclick="calcInput('4')">4</button>
        <button class="calc-btn" onclick="calcInput('5')">5</button>
        <button class="calc-btn" onclick="calcInput('6')">6</button>
        <button class="calc-btn op" onclick="calcInput('-')">−</button>
        <button class="calc-btn" onclick="calcInput('1')">1</button>
        <button class="calc-btn" onclick="calcInput('2')">2</button>
        <button class="calc-btn" onclick="calcInput('3')">3</button>
        <button class="calc-btn op" onclick="calcInput('+')">+</button>
        <button class="calc-btn" onclick="calcInput('0')">0</button>
        <button class="calc-btn" onclick="calcInput('.')">.</button>
        <button class="calc-btn eq" onclick="calcEqual()">=</button>
      </div>
    </div></div>

    <div class="modal" id="modal-currency"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">currency_exchange</span>💱 محول العملات</h3><button class="icon-btn" onclick="closeModal('currency')"><span class="material-icons">close</span></button></div>
      <div class="form-group"><label>المبلغ</label><input type="number" id="currency-amount" value="1" step="0.01" min="0"></div>
      <div class="form-group"><label>من</label><select id="currency-from"><option value="SAR">🇸🇦 ريال سعودي</option><option value="AED">🇦🇪 درهم</option><option value="EGP">🇪🇬 جنيه</option><option value="USD" selected>🇺🇸 دولار</option><option value="EUR">🇪🇺 يورو</option><option value="GBP">🇬🇧 جنيه</option><option value="KWD">🇰🇼 دينار</option></select></div>
      <div class="form-group"><label>إلى</label><select id="currency-to"><option value="SAR" selected>🇸🇦 ريال سعودي</option><option value="AED">🇦🇪 درهم</option><option value="EGP">🇪🇬 جنيه</option><option value="USD">🇺🇸 دولار</option><option value="EUR">🇪🇺 يورو</option><option value="GBP">🇬🇧 جنيه</option><option value="KWD">🇰🇼 دينار</option></select></div>
      <button class="btn btn-primary" onclick="convertCurrency()"><span class="material-icons">swap_horiz</span>تحويل</button>
      <div class="currency-result" id="currency-result">0.00</div>
    </div></div>

    <div class="modal" id="modal-quickcalc"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">functions</span>⚡ حسابات سريعة</h3><button class="icon-btn" onclick="closeModal('quickcalc')"><span class="material-icons">close</span></button></div>
      <div class="form-group"><label>المبلغ</label><input type="number" id="quick-amount" value="100" step="0.01" min="0" oninput="calcQuick()"></div>
      <div class="form-group"><label>النسبة %</label><input type="number" id="quick-percent" value="15" step="0.01" min="0" max="1000" oninput="calcQuick()"></div>
      <div class="quick-result" id="quick-result"></div>
    </div></div>

    <div class="modal" id="modal-settings"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">settings</span>⚙️ الإعدادات</h3><button class="icon-btn" onclick="closeModal('settings')"><span class="material-icons">close</span></button></div>
      <div class="setting-item" style="flex-direction:column;align-items:stretch;cursor:default"><div class="label" style="margin-bottom:8px"><span class="material-icons">palette</span>🎨 لون التطبيق</div><div class="theme-picker"><div class="theme-option theme-purple active" data-theme="purple" onclick="setTheme('purple')">💜</div><div class="theme-option theme-blue" data-theme="blue" onclick="setTheme('blue')">💙</div><div class="theme-option theme-green" data-theme="green" onclick="setTheme('green')">💚</div><div class="theme-option theme-orange" data-theme="orange" onclick="setTheme('orange')">🧡</div><div class="theme-option theme-gray" data-theme="gray" onclick="setTheme('gray')">💎</div></div></div>
      <div class="setting-item" style="flex-direction:column;align-items:stretch;cursor:default"><div class="label" style="margin-bottom:8px"><span class="material-icons">language</span>🌍 اللغة</div><div class="lang-picker"><div class="lang-option active" data-lang="ar" onclick="setLanguage('ar')"><span class="flag">🇸🇦</span><span>العربية</span></div><div class="lang-option" data-lang="en" onclick="setLanguage('en')"><span class="flag">🇬🇧</span><span>English</span></div></div></div>
      <div class="setting-item"><div class="label"><span class="material-icons">currency_exchange</span>💱 العملة</div><input type="text" id="setting-currency-custom" style="width:120px;text-align:center" placeholder="مثال: ر.س" maxlength="5" onchange="saveSetting('currency',this.value)"></div>
      <div class="setting-item" onclick="openModal('security')"><div class="label"><span class="material-icons">security</span>🔒 الأمان</div><span class="material-icons" style="color:var(--muted)">chevron_left</span></div>
      <div class="setting-item" onclick="showStorageInfo()"><div class="label"><span class="material-icons">storage</span>🗄️ معلومات التخزين</div><span class="material-icons" style="color:var(--muted)">chevron_left</span></div>
      <div class="setting-item" onclick="exportJSON()"><div class="label"><span class="material-icons">download</span>تصدير JSON</div><span class="material-icons" style="color:var(--muted)">chevron_left</span></div>
      <div class="setting-item" onclick="document.getElementById('import-file').click()"><div class="label"><span class="material-icons">upload</span>استيراد</div><span class="material-icons" style="color:var(--muted)">chevron_left</span><input type="file" id="import-file" style="display:none" accept=".json" onchange="importJSON(event)"></div>
      <div class="setting-item" onclick="confirmReset()" style="color:var(--red)"><div class="label"><span class="material-icons" style="color:var(--red)">delete_forever</span>حذف البيانات</div><span class="material-icons" style="color:var(--red)">chevron_left</span></div>
      <button class="btn btn-ghost" onclick="closeModal('settings')" style="margin-top:14px">إغلاق</button>
    </div></div>

    <div class="modal" id="modal-budget"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">account_balance_wallet</span>💰 إضافة ميزانية</h3><button class="icon-btn" onclick="closeModal('budget')"><span class="material-icons">close</span></button></div>
      <div class="form-group"><label>الفئة *</label><select id="budget-category"><option value="">-- اختر الفئة --</option></select></div>
      <div class="form-group"><label>المبلغ الشهري *</label><input type="number" id="budget-amount" step="0.01" min="0"></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="saveBudget()"><span class="material-icons">save</span>حفظ</button><button class="btn btn-ghost" onclick="closeModal('budget')">إلغاء</button></div>
    </div></div>

    <div class="modal" id="modal-financialgoal"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">flag</span>🎯 هدف مالي</h3><button class="icon-btn" onclick="closeModal('financialgoal')"><span class="material-icons">close</span></button></div>
      <input type="hidden" id="fg-id">
      <div class="form-group"><label>اسم الهدف *</label><input type="text" id="fg-name" maxlength="50"></div>
      <div class="form-group"><label>الأيقونة</label><input type="text" id="fg-icon" maxlength="2" value="🎯"></div>
      <div class="form-group"><label>المبلغ المستهدف *</label><input type="number" id="fg-target" step="0.01" min="0"></div>
      <div class="form-group"><label>تاريخ الانتهاء (اختياري)</label><input type="date" id="fg-deadline"></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="saveFinancialGoal()"><span class="material-icons">save</span>حفظ</button><button class="btn btn-ghost" onclick="closeModal('financialgoal')">إلغاء</button></div>
    </div></div>

    <div class="modal" id="modal-nb-notebook"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">library_books</span><span id="nb-modal-title">مفكرة جديدة</span></h3><button class="icon-btn" onclick="closeModal('nb-notebook')"><span class="material-icons">close</span></button></div>
      <input type="hidden" id="nb-notebook-id">
      <div class="form-group"><label>العنوان *</label><input type="text" id="nb-notebook-name" maxlength="50" placeholder="مثال: العمل، المنزل..."></div>
      <div class="form-group"><label>الوصف (اختياري)</label><input type="text" id="nb-notebook-desc" maxlength="100" placeholder="وصف قصير"></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="nbSaveNotebook()"><span class="material-icons">save</span>حفظ</button><button class="btn btn-ghost" onclick="closeModal('nb-notebook')">إلغاء</button></div>
    </div></div>

    <div class="modal" id="modal-nb-note"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">edit_note</span><span id="nb-note-modal-title">ملاحظة جديدة</span></h3><button class="icon-btn" onclick="closeModal('nb-note')"><span class="material-icons">close</span></button></div>
      <input type="hidden" id="nb-note-parent-id"><input type="hidden" id="nb-note-edit-id">
      <div class="form-group"><label>العنوان *</label><input type="text" id="nb-note-title-input" maxlength="100" placeholder="عنوان الملاحظة"></div>
      <div class="form-group"><label>التاريخ</label><input type="date" id="nb-note-date-input"></div>
      <div class="form-group"><label>المحتوى</label><textarea id="nb-note-content-input" placeholder="اكتب ملاحظتك هنا..." maxlength="5000"></textarea></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="nbSaveNote()"><span class="material-icons">save</span><span id="nb-note-save-text">إضافة</span></button><button class="btn btn-ghost" onclick="closeModal('nb-note')">إلغاء</button></div>
    </div></div>

    <div class="modal" id="modal-nb-link"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">link</span>ربط الملاحظة</h3><button class="icon-btn" onclick="closeModal('nb-link')"><span class="material-icons">close</span></button></div>
      <div class="form-group"><label>نوع الربط</label><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"><button class="btn btn-primary btn-sm" onclick="nbSetLinkType('transaction')" id="link-type-transaction">💱 معاملة</button><button class="btn btn-ghost btn-sm" onclick="nbSetLinkType('work')" id="link-type-work">💼 عمل</button><button class="btn btn-ghost btn-sm" onclick="nbSetLinkType('person')" id="link-type-person">👥 شخص</button></div></div>
      <div class="form-group"><label id="link-pick-label">اختر معاملة</label><div class="link-picker-list" id="link-picker-list"></div></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="nbSaveLink()"><span class="material-icons">check</span>ربط</button><button class="btn btn-ghost" onclick="closeModal('nb-link')">إلغاء</button></div>
    </div></div>

    <div class="modal" id="modal-nb-search"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">search</span>بحث في المفكرة</h3><button class="icon-btn" onclick="closeModal('nb-search')"><span class="material-icons">close</span></button></div>
      <input type="text" id="nb-search-input" placeholder="ابحث في العناوين والمحتوى والوسوم..." oninput="nbRunSearch()" autocomplete="off">
      <div class="nb-search-results" id="nb-search-results"><div class="empty" style="padding:25px"><p>اكتب للبحث...</p></div></div>
    </div></div>

    <div class="modal" id="modal-nb-tags"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">sell</span>وسوم الملاحظة</h3><button class="icon-btn" onclick="closeModal('nb-tags')"><span class="material-icons">close</span></button></div>
      <div class="nb-tags-editor" id="nb-tags-editor"></div>
      <div style="display:flex;gap:8px"><input type="text" id="nb-tag-input" placeholder="أضف وسم..." onkeydown="if(event.key==='Enter'){event.preventDefault();nbAddTag()}"><button class="btn btn-primary" style="width:auto;padding:12px 18px" onclick="nbAddTag()"><span class="material-icons">add</span></button></div>
      <div style="margin-top:16px"><div style="font-size:11px;color:var(--muted);margin-bottom:8px">وسوم مستخدمة في المفكرة</div><div class="nb-tag-suggest" id="nb-tag-suggestions"></div></div>
      <div class="btn-row"><button class="btn btn-primary" onclick="nbSaveTags()"><span class="material-icons">save</span>حفظ</button><button class="btn btn-ghost" onclick="closeModal('nb-tags')">إلغاء</button></div>
    </div></div>

    <div class="modal" id="modal-nb-tagfilter"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">filter_alt</span>تصفية بالوسم</h3><button class="icon-btn" onclick="closeModal('nb-tagfilter')"><span class="material-icons">close</span></button></div>
      <div id="nb-tagfilter-list"></div>
    </div></div>

    <div class="modal" id="modal-nb-stats"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">insights</span>إحصائيات المفكرة</h3><button class="icon-btn" onclick="closeModal('nb-stats')"><span class="material-icons">close</span></button></div>
      <div id="nb-stats-content"></div>
    </div></div>

    <div class="modal" id="modal-percentcalc"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">percent</span>📊 حاسبة النسبة</h3><button class="icon-btn" onclick="closeModal('percentcalc')"><span class="material-icons">close</span></button></div>
      <div class="form-group"><label>النوع</label><div class="radio-group"><div class="radio-option active" data-type="of" onclick="selectRadio(this);updatePercentCalc()">🔹 نسبة من رقم</div><div class="radio-option" data-type="is" onclick="selectRadio(this);updatePercentCalc()">🔸 ما النسبة؟</div><div class="radio-option" data-type="change" onclick="selectRadio(this);updatePercentCalc()">🔺 التغير %</div></div></div>
      <div id="percent-inputs"></div>
      <div class="tool-result-box" id="percent-result" style="display:none"><div class="result-label">النتيجة</div><div class="result-value" id="percent-result-value">0</div><div class="result-sub" id="percent-result-sub"></div></div>
    </div></div>

    <div class="modal" id="modal-vatcalc"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">receipt_long</span>🧾 حاسبة الضريبة</h3><button class="icon-btn" onclick="closeModal('vatcalc')"><span class="material-icons">close</span></button></div>
      <div class="form-group"><label>نسبة الضريبة %</label><input type="number" id="vat-rate" value="15" step="0.01" min="0" oninput="calcVat()"></div>
      <div class="form-group"><label>النوع</label><div class="radio-group"><div class="radio-option active" data-type="add" onclick="selectRadio(this);calcVat()">➕ إضافة ضريبة</div><div class="radio-option" data-type="remove" onclick="selectRadio(this);calcVat()">➖ استخراج الضريبة</div></div></div>
      <div class="form-group"><label>المبلغ</label><input type="number" id="vat-amount" step="0.01" min="0" oninput="calcVat()" placeholder="0.00"></div>
      <div class="tool-result-box" id="vat-result" style="display:none"><div class="result-label" id="vat-result-label">المبلغ مع الضريبة</div><div class="result-value" id="vat-result-value">0.00</div><div class="result-sub" id="vat-result-sub"></div></div>
    </div></div>

    <div class="modal" id="modal-discountcalc"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">local_offer</span>🏷️ حاسبة الخصم</h3><button class="icon-btn" onclick="closeModal('discountcalc')"><span class="material-icons">close</span></button></div>
      <div class="form-group"><label>السعر الأصلي</label><input type="number" id="discount-original" step="0.01" min="0" oninput="calcDiscount()" placeholder="0.00"></div>
      <div class="form-group"><label>نسبة الخصم %</label><input type="range" id="discount-percent" min="0" max="100" value="0" oninput="calcDiscount()" style="accent-color:var(--primary)"><div style="text-align:center;font-size:24px;font-weight:900;color:var(--primary);margin-top:6px" id="discount-percent-display">0%</div></div>
      <div class="tool-result-box" id="discount-result" style="display:none"><div class="result-label">السعر بعد الخصم</div><div class="result-value" id="discount-result-value">0.00</div><div class="result-sub" id="discount-result-sub"></div></div>
    </div></div>

    <div class="modal" id="modal-pricecompare"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">balance</span>⚖️ مقارنة الأسعار</h3><button class="icon-btn" onclick="closeModal('pricecompare')"><span class="material-icons">close</span></button></div>
      <div class="tool-compare-grid"><div><div class="form-group"><label>🅰️ المنتج الأول</label><input type="number" id="pc1-price" step="0.01" min="0" placeholder="السعر" oninput="comparePrices()"><input type="number" id="pc1-qty" step="0.01" min="0" placeholder="الكمية" oninput="comparePrices()" style="margin-top:6px"></div></div><div><div class="form-group"><label>🅱️ المنتج الثاني</label><input type="number" id="pc2-price" step="0.01" min="0" placeholder="السعر" oninput="comparePrices()"><input type="number" id="pc2-qty" step="0.01" min="0" placeholder="الكمية" oninput="comparePrices()" style="margin-top:6px"></div></div></div>
      <div class="tool-compare-grid" id="compare-result" style="display:none"><div class="tool-compare-item" id="compare-item-1"><div class="crown" id="crown-1"></div><div class="label">🅰️ سعر الوحدة</div><div class="value" id="compare-unit-1">0.00</div></div><div class="tool-compare-item" id="compare-item-2"><div class="crown" id="crown-2"></div><div class="label">🅱️ سعر الوحدة</div><div class="value" id="compare-unit-2">0.00</div></div></div>
      <div class="tool-result-box" id="compare-verdict" style="display:none"><div class="result-label">🏆 الأرخص</div><div class="result-value" id="compare-winner">-</div><div class="result-sub" id="compare-saving"></div></div>
    </div></div>

    <div class="modal" id="modal-loancalc"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">account_balance</span>🏦 حاسبة القروض</h3><button class="icon-btn" onclick="closeModal('loancalc')"><span class="material-icons">close</span></button></div>
      <div class="form-group"><label>مبلغ القرض</label><input type="number" id="loan-amount" step="0.01" min="0" oninput="calcLoan()" placeholder="0.00"></div>
      <div class="form-group"><label>نسبة الفائدة السنوية %</label><input type="number" id="loan-rate" step="0.01" min="0" value="5" oninput="calcLoan()"></div>
      <div class="form-group"><label>مدة القرض (شهور)</label><input type="number" id="loan-months" step="1" min="1" value="12" oninput="calcLoan()"></div>
      <div class="tool-result-box" id="loan-result" style="display:none"><div class="result-label">💰 القسط الشهري</div><div class="result-value" id="loan-monthly">0.00</div><div class="result-sub" id="loan-details"></div></div>
    </div></div>

    <div class="modal" id="modal-savingscalc"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">savings</span>🎯 مخطط الادخار</h3><button class="icon-btn" onclick="closeModal('savingscalc')"><span class="material-icons">close</span></button></div>
      <div class="form-group"><label>المبلغ المستهدف</label><input type="number" id="sav-target" step="0.01" min="0" oninput="calcSavings()" placeholder="0.00"></div>
      <div class="form-group"><label>المدة (شهور)</label><input type="number" id="sav-months" step="1" min="1" value="12" oninput="calcSavings()"></div>
      <div class="form-group"><label>نسبة العائد السنوي % (اختياري)</label><input type="number" id="sav-rate" step="0.01" min="0" value="0" oninput="calcSavings()"></div>
      <div class="tool-result-box" id="sav-result" style="display:none"><div class="result-label">💵 الادخار الشهري المطلوب</div><div class="result-value" id="sav-monthly">0.00</div><div class="result-sub" id="sav-details"></div></div>
    </div></div>

    <div class="modal" id="modal-daycounter"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">date_range</span>📅 عداد الأيام</h3><button class="icon-btn" onclick="closeModal('daycounter')"><span class="material-icons">close</span></button></div>
      <div class="form-group"><label>من تاريخ</label><input type="date" id="day-from" onchange="calcDays()"></div>
      <div class="form-group"><label>إلى تاريخ</label><input type="date" id="day-to" onchange="calcDays()"></div>
      <div class="tool-result-box" id="day-result" style="display:none"><div class="result-label">📆 المدة</div><div class="result-value" id="day-days">0</div><div class="result-sub" id="day-details"></div></div>
    </div></div>

    <div class="modal" id="modal-timecalc"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">schedule</span>⏰ محول الوقت</h3><button class="icon-btn" onclick="closeModal('timecalc')"><span class="material-icons">close</span></button></div>
      <div class="form-group"><label>القيمة</label><input type="number" id="time-value" step="0.01" min="0" value="1" oninput="convertTime()"></div>
      <div class="form-group"><label>من</label><select id="time-from" onchange="convertTime()"><option value="seconds">ثواني</option><option value="minutes" selected>دقائق</option><option value="hours">ساعات</option><option value="days">أيام</option><option value="weeks">أسابيع</option></select></div>
      <div class="tool-result-box" id="time-result"><div class="result-label">🔄 التحويلات</div><div id="time-conversions" style="text-align:right;margin-top:10px"></div></div>
    </div></div>

    <div class="modal" id="modal-quicknote"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">edit_note</span>📝 ملاحظة سريعة</h3><button class="icon-btn" onclick="closeModal('quicknote')"><span class="material-icons">close</span></button></div>
      <div class="form-group"><label>العنوان</label><input type="text" id="qn-title" maxlength="50" placeholder="عنوان مختصر..."></div>
      <div class="form-group"><label>المحتوى</label><textarea id="qn-content" rows="6" maxlength="1000" placeholder="اكتب ملاحظتك..."></textarea></div>
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" style="flex:1;min-width:80px" onclick="qnSave()"><span class="material-icons" style="font-size:16px">save</span>حفظ</button>
        <button class="btn btn-ghost btn-sm" style="flex:1;min-width:80px" onclick="qnList()"><span class="material-icons" style="font-size:16px">list</span>السجل</button>
        <button class="btn btn-ghost btn-sm" style="flex:1;min-width:80px" onclick="qnClear()"><span class="material-icons" style="font-size:16px">clear_all</span>مسح</button>
      </div>
      <div id="qn-list" style="max-height:300px;overflow-y:auto"></div>
    </div></div>

    <div class="modal" id="modal-todolist"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">checklist</span>✅ قائمة المهام</h3><button class="icon-btn" onclick="closeModal('todolist')"><span class="material-icons">close</span></button></div>
      <div style="display:flex;gap:8px;margin-bottom:14px"><input type="text" id="td-input" placeholder="مهمة جديدة..." style="flex:1" onkeydown="if(event.key==='Enter'){event.preventDefault();tdAdd()}"><button class="btn btn-primary" style="width:auto;padding:12px 18px" onclick="tdAdd()"><span class="material-icons">add</span></button></div>
      <div id="td-list" style="max-height:400px;overflow-y:auto"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);font-size:12px;color:var(--muted)"><span id="td-stats">0 مهام</span><button class="btn btn-ghost btn-sm" style="width:auto;padding:6px 12px;font-size:11px" onclick="tdClearDone()"><span class="material-icons" style="font-size:14px">clear_all</span>حذف المكتملة</button></div>
    </div></div>

    <div class="modal" id="modal-ideabox"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">lightbulb</span>💡 صندوق الأفكار</h3><button class="icon-btn" onclick="closeModal('ideabox')"><span class="material-icons">close</span></button></div>
      <div class="form-group"><label>فكرة جديدة</label><textarea id="ib-input" rows="3" maxlength="500" placeholder="فكرتك..."></textarea></div>
      <div style="display:flex;gap:8px;margin-bottom:14px"><select id="ib-category" style="flex:1"><option value="💡 فكرة">💡 فكرة</option><option value="🚀 مشروع">🚀 مشروع</option><option value="📚 تعلم">📚 تعلم</option><option value="🎯 هدف">🎯 هدف</option></select><button class="btn btn-primary" style="width:auto;padding:12px 18px" onclick="ibAdd()"><span class="material-icons">add</span></button></div>
      <div id="ib-list" style="max-height:350px;overflow-y:auto"></div>
    </div></div>

    <div class="modal" id="modal-passwords"><div class="modal-content">
      <div class="modal-header"><h3><span class="material-icons">vpn_key</span>🔐 كلمات المرور</h3><button class="icon-btn" onclick="closeModal('passwords')"><span class="material-icons">close</span></button></div>
      <div style="background:rgba(239,68,68,.1);border:1px solid var(--red);border-radius:12px;padding:12px;margin-bottom:14px;font-size:12px;color:var(--red)">⚠️ تُحفظ محلياً فقط</div>
      <div class="form-group"><label>الموقع</label><input type="text" id="pw-site" maxlength="50" placeholder="Gmail..."></div>
      <div class="form-group"><label>المستخدم</label><input type="text" id="pw-user" maxlength="100" placeholder="user@example.com"></div>
      <div class="form-group"><label>كلمة المرور</label><div style="display:flex;gap:8px"><input type="password" id="pw-pass" maxlength="100" placeholder="••••••••" style="flex:1"><button class="btn btn-ghost" style="width:auto;padding:12px 14px" onclick="pwToggle()"><span class="material-icons" id="pw-eye">visibility</span></button><button class="btn btn-ghost" style="width:auto;padding:12px 14px" onclick="pwGenerate()"><span class="material-icons">auto_awesome</span></button></div></div>
      <div class="btn-row" style="margin-bottom:14px"><button class="btn btn-primary" onclick="pwSave()"><span class="material-icons">save</span>حفظ</button><button class="btn btn-ghost" onclick="pwList()"><span class="material-icons">list</span>السجل</button></div>
      <div id="pw-list" style="max-height:300px;overflow-y:auto"></div>
    </div></div>
  `;
}

// ============ 🧭 NAVIGATION ============
function showPage(n, b) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + n).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
  if (b) b.classList.add('active');
  if (n === 'notebook') {
    if (typeof nbRender === 'function') nbRender();
    document.getElementById('nb-fab').classList.add('visible');
    const toolsBtn = [...document.querySelectorAll('.nav-item')].find(btn => btn.textContent.includes('الأدوات') || btn.textContent.includes('Tools'));
    if (toolsBtn) toolsBtn.classList.add('active');
  } else {
    document.getElementById('nb-fab')?.classList.remove('visible');
  }
  if (n === 'dashboard') renderDashboard();
  if (n === 'wallet') renderTransactions();
  if (n === 'people') { closePersonDetail(); renderPeople(); }
  if (n === 'work') renderWork();
  if (n === 'info') renderInfoHub();
  window.scrollTo(0, 0);
}

function openModal(n) {
  document.getElementById('modal-' + n).classList.add('active');
  if (n === 'transaction') initTransactionModal();
  if (n === 'category') renderCategories();
  if (n === 'person') initPersonModal();
  if (n === 'debt') initDebtModal();
  if (n === 'payment') initPaymentModal();
  if (n === 'work') initWorkModal();
  if (n === 'worklog') initWorkLogModal();
  if (n === 'workpayment') initWorkPaymentModal();
  if (n === 'workpaymentslist') renderWorkPaymentsList();
  if (n === 'workgoal') initWorkGoalModal();
  if (n === 'workstatus') initWorkStatusModal();
  if (n === 'workreport') initWorkReportModal();
  if (n === 'quickcalc') calcQuick();
  if (n === 'security') initSecurityModal();
  if (n === 'budget') initBudgetModal();
  if (n === 'financialgoal') initFinancialGoalModal();
  if (n === 'settings') { document.getElementById('setting-currency-custom').value = state.settings.currency || 'ر.س'; }
  if (n === 'nb-link') nbRenderLinkList();
  if (n === 'percentcalc') updatePercentCalc();
  if (n === 'vatcalc') calcVat();
  if (n === 'discountcalc') calcDiscount();
  if (n === 'pricecompare') comparePrices();
  if (n === 'loancalc') calcLoan();
  if (n === 'savingscalc') calcSavings();
  if (n === 'daycounter') calcDays();
  if (n === 'timecalc') convertTime();
  if (n === 'quicknote') qnList();
  if (n === 'todolist') tdRender();
  if (n === 'ideabox') ibRender();
  if (n === 'passwords') pwList();
}

function closeModal(n) {
  document.getElementById('modal-' + n).classList.remove('active');
}

function selectRadio(el) {
  el.parentElement.querySelectorAll('.radio-option').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
}

function showConfirm(title, msg, ok) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').innerHTML = msg;
  document.getElementById('confirm-ok').style.display = '';
  document.getElementById('confirm-dialog').classList.add('active');
  document.getElementById('confirm-ok').onclick = () => { closeConfirm(); ok(); };
}

function closeConfirm() {
  document.getElementById('confirm-dialog').classList.remove('active');
}

// ============ ✅ تحقق من نجاح التحميل ============
console.log('✅ ui-pages.js loaded');