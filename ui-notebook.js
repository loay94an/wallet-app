// ============================================================
// 📦 ui-notebook.js — المفكرة الكاملة (v2 — مع إصلاح القوائم)
// ============================================================
// ⚠️ يجب تحميله بعد كل ملفات ui-* السابقة
// ✅ v2: إصلاح مشكلة القائمة المنسدلة بنقلها إلى <body>
// ============================================================

// ============ 📚 NOTEBOOK STATE ============
let nb = {
  currentView: 'notebooks',
  currentNotebookId: null,
  currentPath: [],
  currentNoteId: null,
  autoSaveTimer: null,
  linkType: 'transaction',
  selectedLinkId: null,
  viewMode: (localStorage.getItem('nb_viewMode') === 'expanded') ? 'expanded' : 'compact',
  filters: { pinnedOnly: false, starredOnly: false, tag: null },
  tagEditId: null,
  tagDraft: []
};

function nbCurrentNb() { return state.notebooks.find(n => n.id === nb.currentNotebookId) || null; }

function nbGetCurrentNotes() {
  const nbk = nbCurrentNb();
  if (!nbk) return [];
  let notes = nbk.notes || [];
  for (const p of nb.currentPath) {
    const f = notes.find(n => n.id === p.id);
    if (f && f.children) notes = f.children;
    else return [];
  }
  return notes;
}

function nbGetCurrentParent() {
  if (!nb.currentPath.length) return null;
  const nbk = nbCurrentNb();
  if (!nbk) return null;
  let current = null, notes = nbk.notes || [];
  for (const p of nb.currentPath) {
    const f = notes.find(n => n.id === p.id);
    if (!f) return null;
    current = f;
    notes = f.children || [];
  }
  return current;
}

function nbGetNoteInPath() { return nbGetCurrentParent(); }

function nbFindById(notes, id) {
  for (const n of (notes || [])) {
    if (n.id === id) return n;
    if (n.children) { const f = nbFindById(n.children, id); if (f) return f; }
  }
  return null;
}

function nbFindInNotebook(nbk, id) { return nbk ? nbFindById(nbk.notes || [], id) : null; }

function nbFindPath(notes, id, trail = []) {
  for (const n of (notes || [])) {
    const next = [...trail, { id: n.id, title: n.title }];
    if (n.id === id) return next;
    if (n.children) { const f = nbFindPath(n.children, id, next); if (f) return f; }
  }
  return null;
}

function nbAllNotes(notes, out = []) {
  for (const n of (notes || [])) {
    out.push(n);
    if (n.children) nbAllNotes(n.children, out);
  }
  return out;
}

function nbCountAll(notes) { return nbAllNotes(notes).length; }

function nbAllTags(nbk) {
  const map = new Map();
  nbAllNotes(nbk?.notes || []).forEach(n => {
    (n.tags || []).forEach(t => map.set(t, (map.get(t) || 0) + 1));
  });
  return map;
}

function nbGetLinkLabel(note) {
  if (note.linkedType === 'transaction') {
    const tx = state.transactions.find(x => x.id === note.linkedId);
    return tx ? (tx.desc || 'معاملة') : 'معاملة';
  }
  if (note.linkedType === 'work') {
    const w = state.works.find(x => x.id === note.linkedId);
    return w ? w.name : 'عمل';
  }
  if (note.linkedType === 'person') {
    const p = state.people.find(x => x.id === note.linkedId);
    return p ? p.name : 'شخص';
  }
  return 'مرتبط';
}

function nbFilterActive() { const f = nb.filters; return !!(f.pinnedOnly || f.starredOnly || f.tag); }

function nbMatches(note) {
  const f = nb.filters;
  if (f.pinnedOnly && !note.pinned) return false;
  if (f.starredOnly && !note.starred) return false;
  if (f.tag && !(note.tags || []).includes(f.tag)) return false;
  return true;
}

function nbFilterTree(notes) {
  if (!nbFilterActive()) return notes || [];
  const out = [];
  for (const n of (notes || [])) {
    if (nbMatches(n)) out.push(n);
    else {
      const kids = nbFilterTree(n.children || []);
      if (kids.length) out.push({ ...n, children: kids });
    }
  }
  return out;
}

function nbSortNotes(notes) { return [...(notes || [])].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned)); }

function nbFilterLabel() {
  const f = nb.filters, parts = [];
  if (f.pinnedOnly) parts.push('📌 مثبتة');
  if (f.starredOnly) parts.push('⭐ مفضلة');
  if (f.tag) parts.push('🏷️ ' + f.tag);
  return parts.join(' + ');
}

function nbClearFilters(silent = false) {
  nb.filters = { pinnedOnly: false, starredOnly: false, tag: null };
  if (!silent) nbRender();
}

function nbApplyFilters() {
  nbFlushAutoSave();
  if (nb.currentView === 'note') { nb.currentView = 'notes'; nb.currentNoteId = null; }
  nbRender();
}

function nbTogglePinnedFilter() { nb.filters.pinnedOnly = !nb.filters.pinnedOnly; nb.filters.starredOnly = false; nbApplyFilters(); }
function nbToggleStarredFilter() { nb.filters.starredOnly = !nb.filters.starredOnly; nb.filters.pinnedOnly = false; nbApplyFilters(); }
function nbSetTagFilter(tag) { nb.filters.tag = (nb.filters.tag === tag) ? null : tag; nbApplyFilters(); }

function nbFlushAutoSave() {
  if (nb.autoSaveTimer) {
    clearTimeout(nb.autoSaveTimer);
    nb.autoSaveTimer = null;
    save();
  }
}

function nbGoToNotebooks() {
  nbFlushAutoSave();
  nb.currentView = 'notebooks';
  nb.currentNotebookId = null;
  nb.currentPath = [];
  nb.currentNoteId = null;
  nbClearFilters(true);
  nbRender();
}

function nbGoToNotebook(id) {
  nbFlushAutoSave();
  nb.currentView = 'notes';
  nb.currentNotebookId = id;
  nb.currentPath = [];
  nb.currentNoteId = null;
  nbClearFilters(true);
  nbRender();
}

function nbGoToNote(noteId) {
  nbFlushAutoSave();
  const note = nbFindById(nbGetCurrentNotes(), noteId);
  if (!note) return;
  nb.currentPath.push({ id: note.id, title: note.title });
  if (note.children && note.children.length) {
    nb.currentView = 'notes';
    nb.currentNoteId = null;
  } else {
    nb.currentView = 'note';
    nb.currentNoteId = note.id;
  }
  nbRender();
}

function nbGoBack() {
  nbFlushAutoSave();
  if (!nb.currentPath.length) { nbGoToNotebooks(); return; }
  nb.currentPath.pop();
  if (!nb.currentPath.length) {
    nb.currentView = 'notes';
    nb.currentNoteId = null;
  } else {
    const parent = nbGetCurrentParent();
    if (!parent) {
      nb.currentPath = [];
      nb.currentView = 'notes';
      nb.currentNoteId = null;
    } else if (parent.children && parent.children.length) {
      nb.currentView = 'notes';
      nb.currentNoteId = null;
    } else {
      nb.currentView = 'note';
      nb.currentNoteId = parent.id;
    }
  }
  nbRender();
}

function nbSetViewMode(mode) {
  nb.viewMode = mode;
  localStorage.setItem('nb_viewMode', mode);
  nbRender();
  toast(mode === 'expanded' ? '🌳 موسّع' : '🗂️ مضغوط');
}

// ============ 🔽 DROPDOWN MANAGEMENT (v2 — إصلاح كامل) ============
function nbCloseAllDropdowns() {
  document.querySelectorAll('.nb-dropdown.show').forEach(d => {
    d.classList.remove('show');
    d.style.display = '';
    d.style.visibility = '';
    d.style.top = '';
    d.style.left = '';
    d.style.right = '';
    d.style.bottom = '';
    d.style.position = '';
    d.style.zIndex = '';
    // إعادة العنصر إلى مكانه الأصلي في DOM
    if (d.dataset.originalParent && d.parentElement === document.body) {
      const parent = document.getElementById(d.dataset.originalParent);
      if (parent) parent.appendChild(d);
    }
  });
}

function nbPositionDropdown(dd, btn) {
  // ✅ نقل القائمة إلى body مباشرة لتفادي تأثير transform على العناصر الأب
  if (dd.parentElement !== document.body) {
    dd.dataset.originalParent = dd.parentElement ? (dd.parentElement.id || dd.parentElement.className || 'unknown') : '';
    document.body.appendChild(dd);
  }

  // إظهار مؤقت للقياس
  dd.style.display = 'block';
  dd.style.visibility = 'hidden';
  dd.style.position = 'fixed';
  dd.style.top = '-9999px';
  dd.style.left = '0px';
  dd.style.right = 'auto';
  dd.style.bottom = 'auto';
  dd.style.zIndex = '10000';

  // قياس الأبعاد
  const ddW = dd.offsetWidth || 200;
  const ddH = dd.offsetHeight || 100;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 8;

  // محاذاة يمين القائمة مع يمين الزر (RTL)
  let left = btn.right - ddW;
  if (left < margin) left = margin;
  if (left + ddW > vw - margin) left = vw - ddW - margin;

  // تحت الزر أو فوقه
  let top = btn.bottom + 6;
  if (top + ddH > vh - margin) {
    top = btn.top - ddH - 6;
    if (top < margin) top = margin;
  }

  // تطبيق المواضع
  dd.style.left = left + 'px';
  dd.style.top = top + 'px';
  dd.style.visibility = 'visible';
}

function nbToggleDropdown(e, id) {
  e.stopPropagation();
  e.preventDefault();
  const dd = document.getElementById(id);
  if (!dd) return;

  const wasOpen = dd.classList.contains('show');
  nbCloseAllDropdowns();
  if (wasOpen) return;

  // احسب موقع الزر أولًا (قبل نقل القائمة)
  const btnRect = e.currentTarget.getBoundingClientRect();

  dd.classList.add('show');
  nbPositionDropdown(dd, btnRect);
}

function nbToggleGlobalMenu(e) {
  e.stopPropagation();
  e.preventDefault();
  const dd = document.getElementById('nb-global-dropdown');
  if (!dd) return;

  const wasOpen = dd.classList.contains('show');
  nbCloseAllDropdowns();
  if (wasOpen) return;

  dd.innerHTML = nbBuildGlobalMenu();

  const btnRect = e.currentTarget.getBoundingClientRect();

  dd.classList.add('show');
  nbPositionDropdown(dd, btnRect);
}

// ============ 🔽 MENU BUILDERS ============
function nbBuildGlobalMenu() {
  const isNote = nb.currentView === 'note';
  const f = nb.filters;
  const tagCount = nbAllTags(nbCurrentNb()).size;
  let h = '';
  if (isNote) {
    const note = nbGetNoteInPath();
    if (note) {
      h += `<button class="nb-dropdown-item ${note.pinned ? 'is-active' : ''}" onclick="nbTogglePin('${note.id}');nbCloseAllDropdowns()"><span class="material-icons">push_pin</span>${note.pinned ? 'إلغاء التثبيت' : 'تثبيت'}<span class="dd-check">✓</span></button>`;
      h += `<button class="nb-dropdown-item ${note.starred ? 'is-active' : ''}" onclick="nbToggleStar('${note.id}');nbCloseAllDropdowns()"><span class="material-icons">star</span>${note.starred ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}<span class="dd-check">✓</span></button>`;
      h += `<button class="nb-dropdown-item" onclick="nbOpenTagEditor('${note.id}');nbCloseAllDropdowns()"><span class="material-icons">sell</span>الوسوم</button>`;
      h += `<div class="nb-dropdown-divider"></div>`;
    }
  }
  h += `<button class="nb-dropdown-item" onclick="nbOpenSearch();nbCloseAllDropdowns()"><span class="material-icons">search</span>بحث</button><div class="nb-dropdown-divider"></div>`;
  if (!isNote) {
    h += `<button class="nb-dropdown-item ${f.pinnedOnly ? 'is-active' : ''}" onclick="nbTogglePinnedFilter();nbCloseAllDropdowns()"><span class="material-icons">push_pin</span>المثبتة فقط<span class="dd-check">✓</span></button>`;
    h += `<button class="nb-dropdown-item ${f.starredOnly ? 'is-active' : ''}" onclick="nbToggleStarredFilter();nbCloseAllDropdowns()"><span class="material-icons">star</span>المفضلة فقط<span class="dd-check">✓</span></button>`;
    h += `<button class="nb-dropdown-item" onclick="nbOpenTagFilter();nbCloseAllDropdowns()"><span class="material-icons">sell</span>تصفية بالوسم${tagCount ? '<span class="nb-tag-more">' + tagCount + '</span>' : ''}</button>`;
    if (nbFilterActive()) h += `<button class="nb-dropdown-item" onclick="nbClearFilters();nbCloseAllDropdowns()"><span class="material-icons">filter_alt_off</span>إلغاء التصفية</button>`;
    h += `<div class="nb-dropdown-divider"></div>`;
    h += `<button class="nb-dropdown-item ${nb.viewMode === 'compact' ? 'is-active' : ''}" onclick="nbSetViewMode('compact');nbCloseAllDropdowns()"><span class="material-icons">view_list</span>عرض مضغوط<span class="dd-check">✓</span></button>`;
    h += `<button class="nb-dropdown-item ${nb.viewMode === 'expanded' ? 'is-active' : ''}" onclick="nbSetViewMode('expanded');nbCloseAllDropdowns()"><span class="material-icons">account_tree</span>عرض موسّع<span class="dd-check">✓</span></button>`;
  }
  h += `<div class="nb-dropdown-divider"></div><button class="nb-dropdown-item" onclick="nbOpenStats();nbCloseAllDropdowns()"><span class="material-icons">insights</span>إحصائيات</button>`;
  return h;
}

function nbNoteMenuHTML(note, prefix) {
  const id = prefix + '-' + note.id;
  const pinned = !!note.pinned, starred = !!note.starred;
  return `<button class="nb-menu-btn" style="opacity:1" onclick="event.stopPropagation();nbToggleDropdown(event,'${id}')"><span class="material-icons">more_vert</span></button><div class="nb-dropdown" id="${id}"><button class="nb-dropdown-item" onclick="event.stopPropagation();nbOpenNoteModal(null,'${note.id}');nbCloseAllDropdowns()"><span class="material-icons">add</span>إضافة فرعية</button><button class="nb-dropdown-item" onclick="event.stopPropagation();nbOpenNoteModal('${note.id}');nbCloseAllDropdowns()"><span class="material-icons">edit</span>تعديل</button><div class="nb-dropdown-divider"></div><button class="nb-dropdown-item ${pinned ? 'is-active' : ''}" onclick="event.stopPropagation();nbTogglePin('${note.id}');nbCloseAllDropdowns()"><span class="material-icons">push_pin</span>${pinned ? 'إلغاء التثبيت' : 'تثبيت'}<span class="dd-check">✓</span></button><button class="nb-dropdown-item ${starred ? 'is-active' : ''}" onclick="event.stopPropagation();nbToggleStar('${note.id}');nbCloseAllDropdowns()"><span class="material-icons">star</span>${starred ? 'إزالة' : 'مفضلة'}<span class="dd-check">✓</span></button><div class="nb-dropdown-divider"></div><button class="nb-dropdown-item danger" onclick="event.stopPropagation();nbDeleteNote('${note.id}');nbCloseAllDropdowns()"><span class="material-icons">delete</span>حذف</button></div>`;
}

// ============ 🎨 UI HELPERS ============
function nbMiniIcons(note) {
  let h = '';
  if (note.pinned) h += '<span class="nb-mini pin"><span class="material-icons">push_pin</span></span>';
  if (note.starred) h += '<span class="nb-mini star"><span class="material-icons">star</span></span>';
  return h;
}

function nbTagsHTML(note, limit = 2) {
  const tags = note.tags || [];
  if (!tags.length) return '';
  let h = tags.slice(0, limit).map(t => `<span class="nb-tag-chip" onclick="event.stopPropagation();nbSetTagFilter('${escapeHtml(t).replace(/'/g, "\\'")}')">${escapeHtml(t)}</span>`).join('');
  if (tags.length > limit) h += `<span class="nb-tag-more">+${tags.length - limit}</span>`;
  return h;
}

// ============ 🖼️ RENDER ============
function nbRender() {
  nbCloseAllDropdowns();
  nbRenderBreadcrumb();
  const back = document.getElementById('nb-back-btn');
  if (back) back.style.display = nb.currentView === 'notebooks' ? 'none' : 'inline-flex';
  const gbtn = document.getElementById('nb-global-btn');
  if (gbtn) gbtn.classList.toggle('visible', !!nb.currentNotebookId && nb.currentView !== 'notebooks');
  const main = document.getElementById('nb-main-view');
  const noteView = document.getElementById('nb-note-view');
  if (!main || !noteView) return;
  if (nb.currentView === 'notebooks') {
    nbRenderNotebooks();
    main.style.display = 'block';
    noteView.style.display = 'none';
  } else if (nb.currentView === 'notes') {
    if (nb.viewMode === 'expanded') nbRenderExpandedTree();
    else nbRenderNotes();
    main.style.display = 'block';
    noteView.style.display = 'none';
  } else {
    nbRenderNote();
    main.style.display = 'none';
    noteView.style.display = 'block';
  }
}

function nbRenderBreadcrumb() {
  const bc = document.getElementById('nb-breadcrumb');
  if (!bc) return;
  if (nb.currentView === 'notebooks') { bc.style.display = 'none'; return; }
  const nbk = nbCurrentNb();
  if (!nbk) { bc.style.display = 'none'; return; }
  bc.style.display = 'flex';
  let h = `<div class="nb-breadcrumb-item" onclick="nbGoToNotebooks()">المفكرات</div><span class="nb-breadcrumb-sep">‹</span>`;
  if (!nb.currentPath.length) h += `<div class="nb-breadcrumb-item current">${escapeHtml(nbk.name)}</div>`;
  else {
    h += `<div class="nb-breadcrumb-item" onclick="nbGoToNotebook('${nbk.id}')">${escapeHtml(nbk.name)}</div>`;
    nb.currentPath.forEach((p, i) => {
      h += `<span class="nb-breadcrumb-sep">‹</span><div class="nb-breadcrumb-item ${i === nb.currentPath.length - 1 ? 'current' : ''}" onclick="nbGoToPathIndex(${i})">${escapeHtml(p.title)}</div>`;
    });
  }
  bc.innerHTML = h;
}

function nbGoToPathIndex(index) {
  nbFlushAutoSave();
  if (index < 0) { nbGoToNotebooks(); return; }
  nb.currentPath = nb.currentPath.slice(0, index + 1);
  const parent = nbGetCurrentParent();
  if (parent && !parent.children?.length) {
    nb.currentView = 'note';
    nb.currentNoteId = parent.id;
  } else {
    nb.currentView = 'notes';
    nb.currentNoteId = null;
  }
  nbRender();
}

function nbRenderNotebooks() {
  document.getElementById('nb-page-title').innerHTML = '<span class="material-icons">auto_stories</span><span>المفكرات</span>';
  document.getElementById('nb-subtitle').textContent = state.notebooks.length ? `${state.notebooks.length} مفكرة` : 'أنشئ أول مفكرة لك';
  const list = document.getElementById('nb-list');
  if (!state.notebooks.length) {
    list.innerHTML = '<div class="empty"><span class="material-icons">library_books</span><p>لا توجد مفكرات بعد</p><p style="font-size:12px;margin-top:6px">اضغط + لإنشاء أول مفكرة</p></div>';
    return;
  }
  list.innerHTML = state.notebooks.map(nbk => {
    const count = nbCountAll(nbk.notes || []);
    return `<div class="nb-item"><div class="nb-item-icon" onclick="nbGoToNotebook('${nbk.id}')" style="cursor:pointer">📚</div><div class="nb-item-content" onclick="nbGoToNotebook('${nbk.id}')" style="cursor:pointer"><div class="nb-item-title">${escapeHtml(nbk.name)}</div><div class="nb-item-meta">${nbk.desc ? `<span>${escapeHtml(nbk.desc)}</span><span class="dot"></span>` : ''}<span>${count} ملاحظة</span></div></div><div class="nb-item-actions"><button class="nb-menu-btn" style="opacity:1" onclick="event.stopPropagation();nbToggleDropdown(event,'dd-nb-${nbk.id}')"><span class="material-icons">more_vert</span></button><div class="nb-dropdown" id="dd-nb-${nbk.id}"><button class="nb-dropdown-item" onclick="event.stopPropagation();nbOpenNotebookModal('${nbk.id}');nbCloseAllDropdowns()"><span class="material-icons">edit</span>تعديل</button><div class="nb-dropdown-divider"></div><button class="nb-dropdown-item danger" onclick="event.stopPropagation();nbDeleteNotebook('${nbk.id}');nbCloseAllDropdowns()"><span class="material-icons">delete</span>حذف</button></div></div></div>`;
  }).join('');
}

function nbRenderNotes() {
  const nbk = nbCurrentNb();
  if (!nbk) return;
  const parent = nbGetCurrentParent();
  const raw = nbGetCurrentNotes();
  const notes = nbSortNotes(nbFilterTree(raw));
  document.getElementById('nb-page-title').innerHTML = `<span class="material-icons">${parent ? 'folder' : 'auto_stories'}</span><span>${escapeHtml(parent ? parent.title : nbk.name)}</span>`;
  let sub = nbFilterActive() ? `${notes.length} نتيجة` : `${raw.length} ملاحظة`;
  if (nbFilterActive()) sub += `<button class="nb-filter-chip" onclick="nbClearFilters()">${escapeHtml(nbFilterLabel())}<span class="material-icons">close</span></button>`;
  else if (!raw.length) sub = 'أضف أول ملاحظة';
  document.getElementById('nb-subtitle').innerHTML = sub;
  const list = document.getElementById('nb-list');
  if (!notes.length) {
    list.innerHTML = '<div class="empty"><span class="material-icons">note_add</span><p>لا توجد ملاحظات</p></div>';
    return;
  }
  list.innerHTML = notes.map(note => {
    const hasCh = note.children && note.children.length;
    return `<div class="nb-item note"><div class="nb-item-icon" onclick="nbGoToNote('${note.id}')" style="cursor:pointer"><span class="material-icons">${hasCh ? 'folder' : 'description'}</span></div><div class="nb-item-content" onclick="nbGoToNote('${note.id}')" style="cursor:pointer"><div class="nb-item-title">${nbMiniIcons(note)}${escapeHtml(note.title)}</div><div class="nb-item-meta">${note.date ? `<span>📅 ${formatDate(note.date)}</span>` : ''}${hasCh ? `<span class="dot"></span><span>📁 ${note.children.length}</span>` : ''}${nbTagsHTML(note, 2)}</div></div><div class="nb-item-actions">${nbNoteMenuHTML(note, 'dd')}</div></div>`;
  }).join('');
}

function nbRenderExpandedTree() {
  const nbk = nbCurrentNb();
  if (!nbk) return;
  const parent = nbGetCurrentParent();
  const raw = nbGetCurrentNotes();
  const notes = nbSortNotes(nbFilterTree(raw));
  document.getElementById('nb-page-title').innerHTML = `<span class="material-icons">${parent ? 'folder' : 'auto_stories'}</span><span>${escapeHtml(parent ? parent.title : nbk.name)}</span>`;
  document.getElementById('nb-subtitle').textContent = `${raw.length} ملاحظة`;
  const list = document.getElementById('nb-list');
  if (!notes.length) {
    list.innerHTML = '<div class="empty"><span class="material-icons">note_add</span><p>لا توجد ملاحظات</p></div>';
    return;
  }
  list.innerHTML = notes.map(n => nbRenderExpandedNote(n, 0)).join('');
}

function nbRenderExpandedNote(note, depth) {
  const hasCh = note.children && note.children.length;
  const kids = nbSortNotes(note.children || []);
  return `<div class="nb-expanded-note"><div class="nb-expanded-header"><div class="nb-expanded-icon"><span class="material-icons">${hasCh ? 'folder' : 'description'}</span></div><div class="nb-expanded-info"><div class="nb-expanded-title">${nbMiniIcons(note)}${escapeHtml(note.title)}</div><div class="nb-expanded-meta">${note.date ? `<span>📅 ${formatDate(note.date)}</span>` : ''}${hasCh ? `<span>📁 ${note.children.length}</span>` : ''}${nbTagsHTML(note, 3)}</div></div><div class="nb-expanded-actions">${nbNoteMenuHTML(note, 'ddx')}</div></div>${note.content ? `<div class="nb-expanded-content">${escapeHtml(note.content)}</div>` : ''}${hasCh ? `<div class="nb-children-container">${kids.map(c => nbRenderExpandedNote(c, depth + 1)).join('')}<button class="nb-add-child-inline" onclick="nbOpenNoteModal(null,'${note.id}')"><span class="material-icons">add</span><span>إضافة فرع</span></button></div>` : `<button class="nb-add-child-inline" onclick="nbOpenNoteModal(null,'${note.id}')"><span class="material-icons">add</span><span>إضافة فرع</span></button>`}</div>`;
}

function nbRenderNote() {
  const note = nbGetNoteInPath();
  if (!note) {
    const nbk = nbCurrentNb();
    nb.currentPath = nbk ? nb.currentPath.filter(p => nbFindInNotebook(nbk, p.id)) : [];
    if (!nb.currentPath.length) {
      if (nbk) nb.currentView = 'notes';
      else { nb.currentView = 'notebooks'; nb.currentNotebookId = null; }
    } else {
      const p = nbGetCurrentParent();
      nb.currentView = (p && p.children?.length) ? 'notes' : 'note';
      nb.currentNoteId = p?.id || null;
    }
    nbRender();
    return;
  }
  document.getElementById('nb-note-title').value = note.title || '';
  document.getElementById('nb-note-date').value = note.date || '';
  document.getElementById('nb-note-content').value = note.content || '';
  const badge = document.getElementById('nb-link-badge');
  if (note.linkedType && note.linkedId) {
    badge.style.display = 'inline-flex';
    document.getElementById('nb-link-text').textContent = nbGetLinkLabel(note);
  } else badge.style.display = 'none';
}

function nbAutoSave() {
  const note = nbGetNoteInPath();
  if (!note) return;
  note.title = document.getElementById('nb-note-title').value.trim();
  note.date = document.getElementById('nb-note-date').value;
  note.content = document.getElementById('nb-note-content').value;
  note.updatedAt = Date.now();
  const last = nb.currentPath[nb.currentPath.length - 1];
  if (last && last.title !== note.title) {
    last.title = note.title;
    nbRenderBreadcrumb();
  }
  clearTimeout(nb.autoSaveTimer);
  nb.autoSaveTimer = setTimeout(() => {
    save();
    const ind = document.getElementById('nb-save-indicator');
    if (ind) {
      ind.classList.add('show');
      setTimeout(() => ind.classList.remove('show'), 1500);
    }
  }, 500);
}

// ============ ⭐ ACTIONS ============
function nbTogglePin(id) {
  const note = nbFindInNotebook(nbCurrentNb(), id);
  if (!note) return;
  note.pinned = !note.pinned;
  note.updatedAt = Date.now();
  save();
  nbRender();
  toast(note.pinned ? '📌 تم التثبيت' : 'تم الإلغاء');
}

function nbToggleStar(id) {
  const note = nbFindInNotebook(nbCurrentNb(), id);
  if (!note) return;
  note.starred = !note.starred;
  note.updatedAt = Date.now();
  save();
  nbRender();
  toast(note.starred ? '⭐ أُضيفت' : 'أُزيلت');
}

// ============ 🏷️ TAGS ============
function nbOpenTagEditor(id) {
  const note = nbFindInNotebook(nbCurrentNb(), id);
  if (!note) return;
  nb.tagEditId = id;
  nb.tagDraft = [...(note.tags || [])];
  document.getElementById('nb-tag-input').value = '';
  nbRenderTagEditor();
  openModal('nb-tags');
}

function nbRenderTagEditor() {
  const editor = document.getElementById('nb-tags-editor');
  editor.innerHTML = nb.tagDraft.length ? nb.tagDraft.map(t => `<span class="nb-tag-edit-chip">${escapeHtml(t)}<button onclick="nbRemoveTag('${escapeHtml(t).replace(/'/g, "\\'")}')"><span class="material-icons">close</span></button></span>`).join('') : '<span style="font-size:12px;color:var(--muted)">لا توجد وسوم</span>';
  const all = nbAllTags(nbCurrentNb());
  const suggestions = [...all.keys()].filter(t => !nb.tagDraft.includes(t)).slice(0, 15);
  document.getElementById('nb-tag-suggestions').innerHTML = suggestions.length ? suggestions.map(t => `<button class="nb-tag-suggest-chip" onclick="nbAddSuggestedTag('${escapeHtml(t).replace(/'/g, "\\'")}')">+ ${escapeHtml(t)}</button>`).join('') : '<span style="font-size:11px;color:var(--muted)">لا توجد</span>';
}

function nbAddTag() {
  const input = document.getElementById('nb-tag-input');
  const raw = input.value.trim();
  if (!raw) return;
  raw.split(/[,،]/).map(s => s.trim()).filter(Boolean).forEach(t => {
    if (t.length <= 30 && !nb.tagDraft.includes(t)) nb.tagDraft.push(t);
  });
  input.value = '';
  nbRenderTagEditor();
}

function nbAddSuggestedTag(t) {
  if (!nb.tagDraft.includes(t)) nb.tagDraft.push(t);
  nbRenderTagEditor();
}

function nbRemoveTag(t) {
  nb.tagDraft = nb.tagDraft.filter(x => x !== t);
  nbRenderTagEditor();
}

function nbSaveTags() {
  const note = nbFindInNotebook(nbCurrentNb(), nb.tagEditId);
  if (!note) return;
  note.tags = [...nb.tagDraft];
  note.updatedAt = Date.now();
  save();
  closeModal('nb-tags');
  nbRender();
  toast('✅ تم الحفظ');
}

function nbOpenTagFilter() {
  const tags = nbAllTags(nbCurrentNb());
  const list = document.getElementById('nb-tagfilter-list');
  if (!tags.size) {
    list.innerHTML = '<div class="empty"><p>لا توجد وسوم</p></div>';
  } else {
    list.innerHTML = `<button class="nb-search-result" onclick="nb.filters.tag=null;nbApplyFilters();closeModal('nb-tagfilter')"><div class="nb-search-result-title"><span class="material-icons">filter_alt_off</span>عرض الكل</div></button>` + [...tags.entries()].sort((a, b) => b[1] - a[1]).map(([t, c]) => `<button class="nb-search-result" onclick="nbSetTagFilter('${escapeHtml(t).replace(/'/g, "\\'")}');closeModal('nb-tagfilter')"><div class="nb-search-result-title"><span class="material-icons">sell</span>${escapeHtml(t)}</div><div class="nb-search-result-snippet">${c} ملاحظة</div></button>`).join('');
  }
  openModal('nb-tagfilter');
}

// ============ 🔍 SEARCH ============
function nbOpenSearch() {
  document.getElementById('nb-search-input').value = '';
  document.getElementById('nb-search-results').innerHTML = '<div class="empty" style="padding:25px"><p>اكتب للبحث...</p></div>';
  openModal('nb-search');
  setTimeout(() => document.getElementById('nb-search-input').focus(), 100);
}

function nbHighlight(text, q) {
  if (!q) return escapeHtml(text);
  const safe = escapeHtml(text);
  const qSafe = escapeHtml(q);
  const qEsc = qSafe.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp('(' + qEsc + ')', 'gi'), '<mark>$1</mark>');
}

function nbRunSearch() {
  const q = document.getElementById('nb-search-input').value.trim().toLowerCase();
  const out = document.getElementById('nb-search-results');
  const nbk = nbCurrentNb();
  if (!nbk) return;
  if (!q) {
    out.innerHTML = '<div class="empty" style="padding:25px"><p>اكتب للبحث...</p></div>';
    return;
  }
  const all = nbAllNotes(nbk.notes || []);
  const matches = all.filter(n => (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q) || (n.tags || []).some(t => t.toLowerCase().includes(q))).slice(0, 60);
  if (!matches.length) {
    out.innerHTML = '<div class="empty" style="padding:25px"><p>لا توجد نتائج</p></div>';
    return;
  }
  out.innerHTML = matches.map(n => {
    const path = nbFindPath(nbk.notes || [], n.id) || [];
    const pathStr = path.map(p => p.title).join(' ‹ ');
    const snippet = (n.content || '').substring(0, 110);
    return `<button class="nb-search-result" onclick="nbSearchGo('${n.id}')"><div class="nb-search-result-title"><span class="material-icons">${n.children?.length ? 'folder' : 'description'}</span>${nbHighlight(n.title, q)}</div>${snippet ? `<div class="nb-search-result-snippet">${nbHighlight(snippet, q)}</div>` : ''}<div class="nb-search-result-path">${escapeHtml(pathStr)}</div></button>`;
  }).join('');
}

function nbSearchGo(id) {
  const nbk = nbCurrentNb();
  if (!nbk) return;
  const path = nbFindPath(nbk.notes || [], id);
  if (!path) return;
  const note = nbFindById(nbk.notes || [], id);
  nbFlushAutoSave();
  nbClearFilters(true);
  nb.currentNotebookId = nbk.id;
  nb.currentPath = path;
  nb.currentNoteId = id;
  nb.currentView = (note.children && note.children.length) ? 'notes' : 'note';
  closeModal('nb-search');
  showPage('notebook', null);
}

// ============ 📊 STATS ============
function nbOpenStats() {
  const nbk = nbCurrentNb();
  if (!nbk) return;
  const all = nbAllNotes(nbk.notes || []);
  const tags = nbAllTags(nbk);
  let h = `<div class="nb-stats-grid"><div class="nb-stat-tile"><div class="label"><span class="material-icons">description</span>الملاحظات</div><div class="value">${all.length}</div></div><div class="nb-stat-tile green"><div class="label"><span class="material-icons">notes</span>بمحتوى</div><div class="value">${all.filter(n => (n.content || '').trim()).length}</div></div><div class="nb-stat-tile orange"><div class="label"><span class="material-icons">push_pin</span>مثبتة</div><div class="value">${all.filter(n => n.pinned).length}</div></div><div class="nb-stat-tile orange"><div class="label"><span class="material-icons">star</span>مفضلة</div><div class="value">${all.filter(n => n.starred).length}</div></div></div>`;
  if (tags.size) {
    const top = [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = top[0][1];
    h += `<div style="font-size:13px;font-weight:700;margin-bottom:10px">أكثر الوسوم</div>`;
    h += top.map(([t, c]) => `<div class="nb-tag-stat-row"><div class="nb-tag-stat-name">${escapeHtml(t)}</div><div class="nb-tag-stat-bar"><div class="nb-tag-stat-fill" style="width:${(c / max) * 100}%"></div></div><div class="nb-tag-stat-count">${c}</div></div>`).join('');
  }
  document.getElementById('nb-stats-content').innerHTML = h;
  openModal('nb-stats');
}

// ============ 📓 NOTEBOOK MODALS ============
function nbOpenNotebookModal(id) {
  const title = document.getElementById('nb-modal-title');
  if (id) {
    const nbk = state.notebooks.find(n => n.id === id);
    if (!nbk) return;
    title.textContent = 'تعديل المفكرة';
    document.getElementById('nb-notebook-id').value = nbk.id;
    document.getElementById('nb-notebook-name').value = nbk.name;
    document.getElementById('nb-notebook-desc').value = nbk.desc || '';
  } else {
    title.textContent = 'مفكرة جديدة';
    document.getElementById('nb-notebook-id').value = '';
    document.getElementById('nb-notebook-name').value = '';
    document.getElementById('nb-notebook-desc').value = '';
  }
  openModal('nb-notebook');
  setTimeout(() => document.getElementById('nb-notebook-name').focus(), 100);
}

function nbSaveNotebook() {
  const id = document.getElementById('nb-notebook-id').value;
  const name = document.getElementById('nb-notebook-name').value.trim();
  const desc = document.getElementById('nb-notebook-desc').value.trim();
  if (!name) { toast('أدخل عنوان المفكرة', 'error'); return; }
  if (id) {
    const nbk = state.notebooks.find(n => n.id === id);
    if (nbk) {
      nbk.name = name;
      nbk.desc = desc;
      nbk.updatedAt = Date.now();
    }
  } else {
    const fresh = { id: genId(), name, desc, notes: [], createdAt: Date.now(), updatedAt: Date.now() };
    state.notebooks.push(fresh);
    nb.currentNotebookId = fresh.id;
    nb.currentView = 'notes';
    nb.currentPath = [];
    nb.currentNoteId = null;
  }
  save();
  closeModal('nb-notebook');
  nbRender();
  toast('✅ تم الحفظ');
}

function nbDeleteNotebook(id) {
  const nbk = state.notebooks.find(n => n.id === id);
  if (!nbk) return;
  showConfirm('حذف المفكرة', `سيتم حذف "${escapeHtml(nbk.name)}" وكل ملاحظاتها.`, () => {
    state.notebooks = state.notebooks.filter(n => n.id !== id);
    if (nb.currentNotebookId === id) {
      nb.currentNotebookId = null;
      nb.currentView = 'notebooks';
      nb.currentPath = [];
      nb.currentNoteId = null;
    }
    save();
    nbRender();
    toast('تم الحذف');
  });
}

function nbOpenNoteModal(noteId, parentId) {
  const nbk = nbCurrentNb();
  if (!nbk) return;
  const title = document.getElementById('nb-note-modal-title');
  const saveText = document.getElementById('nb-note-save-text');
  document.getElementById('nb-note-parent-id').value = parentId || '';
  document.getElementById('nb-note-edit-id').value = noteId || '';
  if (noteId) {
    const note = nbFindInNotebook(nbk, noteId);
    if (!note) return;
    title.textContent = 'تعديل الملاحظة';
    saveText.textContent = 'حفظ';
    document.getElementById('nb-note-title-input').value = note.title || '';
    document.getElementById('nb-note-date-input').value = note.date || '';
    document.getElementById('nb-note-content-input').value = note.content || '';
  } else {
    const parent = parentId ? nbFindInNotebook(nbk, parentId) : null;
    title.textContent = parent ? `فرع لـ "${parent.title}"` : 'ملاحظة جديدة';
    saveText.textContent = 'إضافة';
    document.getElementById('nb-note-title-input').value = '';
    document.getElementById('nb-note-date-input').value = new Date().toISOString().slice(0, 10);
    document.getElementById('nb-note-content-input').value = '';
  }
  openModal('nb-note');
  setTimeout(() => document.getElementById('nb-note-title-input').focus(), 100);
}

function nbSaveNote() {
  const nbk = nbCurrentNb();
  if (!nbk) return;
  const editId = document.getElementById('nb-note-edit-id').value;
  const parentId = document.getElementById('nb-note-parent-id').value;
  const title = document.getElementById('nb-note-title-input').value.trim();
  const date = document.getElementById('nb-note-date-input').value;
  const content = document.getElementById('nb-note-content-input').value.trim();
  if (!title) { toast('أدخل عنوان', 'error'); return; }
  if (editId) {
    const note = nbFindInNotebook(nbk, editId);
    if (note) {
      note.title = title;
      note.date = date;
      note.content = content;
      note.updatedAt = Date.now();
      const pathItem = nb.currentPath.find(p => p.id === editId);
      if (pathItem) pathItem.title = title;
    }
    save();
    closeModal('nb-note');
    nbRender();
    toast('✅ تم التعديل');
    return;
  }
  const fresh = { id: genId(), title, date, content, children: [], tags: [], pinned: false, starred: false, createdAt: Date.now(), updatedAt: Date.now() };
  if (parentId) {
    const parent = nbFindInNotebook(nbk, parentId);
    if (!parent) { toast('الملاحظة الأصلية غير موجودة', 'error'); return; }
    if (!parent.children) parent.children = [];
    parent.children.push(fresh);
    parent.updatedAt = Date.now();
  } else {
    if (!nbk.notes) nbk.notes = [];
    nbGetCurrentNotes().push(fresh);
  }
  nbk.updatedAt = Date.now();
  nbClearFilters(true);
  save();
  closeModal('nb-note');
  nbRender();
  toast('✅ تمت الإضافة');
}

function nbDeleteNote(id) {
  showConfirm('حذف الملاحظة', 'سيتم حذف الملاحظة وكل فروعها.', () => {
    const nbk = nbCurrentNb();
    if (!nbk) return;
    const del = (list, tid) => {
      const idx = list.findIndex(n => n.id === tid);
      if (idx >= 0) { list.splice(idx, 1); return true; }
      for (const n of list) {
        if (n.children && del(n.children, tid)) return true;
      }
      return false;
    };
    del(nbk.notes || [], id);
    nbk.updatedAt = Date.now();
    const pathIdx = nb.currentPath.findIndex(p => p.id === id);
    if (pathIdx >= 0) {
      nb.currentPath = nb.currentPath.slice(0, pathIdx);
      if (!nb.currentPath.length) {
        nb.currentView = 'notes';
        nb.currentNoteId = null;
      } else {
        const p = nbGetCurrentParent();
        nb.currentView = (p && p.children?.length) ? 'notes' : 'note';
        nb.currentNoteId = p?.id || null;
      }
    }
    save();
    nbRender();
    toast('تم الحذف');
  });
}

function nbAddChild() {
  const note = nbGetNoteInPath();
  if (note) nbOpenNoteModal(null, note.id);
}

function nbDeleteCurrent() {
  const note = nbGetNoteInPath();
  if (note) nbDeleteNote(note.id);
}

function nbHandleAdd() {
  if (nb.currentView === 'notebooks') nbOpenNotebookModal();
  else if (nb.currentView === 'note') {
    const note = nbGetNoteInPath();
    if (note) nbOpenNoteModal(null, note.id);
  } else {
    const parent = nbGetCurrentParent();
    if (parent) nbOpenNoteModal(null, parent.id);
    else nbOpenNoteModal();
  }
}

// ============ 🔗 LINKS ============
function nbOpenLinkModal(noteId) {
  nb.currentNoteId = noteId;
  nb.linkType = 'transaction';
  nb.selectedLinkId = null;
  nbUpdateLinkTypeButtons();
  nbRenderLinkList();
  openModal('nb-link');
}

function openLinkModal() {
  const note = nbGetNoteInPath();
  if (note) nbOpenLinkModal(note.id);
}

function nbSetLinkType(type) {
  nb.linkType = type;
  nb.selectedLinkId = null;
  nbUpdateLinkTypeButtons();
  nbRenderLinkList();
}

function nbUpdateLinkTypeButtons() {
  ['transaction', 'work', 'person'].forEach(t => {
    const btn = document.getElementById('link-type-' + t);
    if (btn) {
      btn.classList.toggle('btn-primary', t === nb.linkType);
      btn.classList.toggle('btn-ghost', t !== nb.linkType);
    }
  });
  document.getElementById('link-pick-label').textContent = ({ transaction: 'اختر معاملة', work: 'اختر عمل', person: 'اختر شخص' })[nb.linkType] || 'اختر...';
}

function nbRenderLinkList() {
  const list = document.getElementById('link-picker-list');
  let items = [];
  if (nb.linkType === 'transaction') {
    items = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).map(tx => {
      const ct = state.categories.find(c => c.id === tx.category);
      return { id: tx.id, title: tx.desc || (ct ? ct.name : 'معاملة'), sub: `${fmt(tx.amount)} ${cur()}`, icon: 'receipt_long', color: 'var(--primary)' };
    });
  } else if (nb.linkType === 'work') {
    items = state.works.map(w => ({ id: w.id, title: w.name, sub: `${fmt(w.rate)} ${cur()}`, icon: 'work', color: 'var(--primary)' }));
  } else {
    items = state.people.map(p => ({ id: p.id, title: p.name, sub: p.phone || 'بدون هاتف', icon: 'person', color: 'var(--accent)' }));
  }
  list.innerHTML = items.length ? items.map(it => `<div class="link-picker-item ${nb.selectedLinkId === it.id ? 'selected' : ''}" onclick="nb.selectedLinkId='${it.id}';nbRenderLinkList()"><span class="material-icons" style="color:${it.color}">${it.icon}</span><div class="link-picker-item-info"><div class="link-picker-item-title">${escapeHtml(it.title)}</div><div class="link-picker-item-sub">${escapeHtml(it.sub)}</div></div></div>`).join('') : '<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">لا توجد عناصر</div>';
}

function nbSaveLink() {
  if (!nb.currentNoteId || !nb.selectedLinkId) { toast('اختر عنصراً', 'error'); return; }
  const note = nbFindInNotebook(nbCurrentNb(), nb.currentNoteId);
  if (note) {
    note.linkedType = nb.linkType;
    note.linkedId = nb.selectedLinkId;
    note.updatedAt = Date.now();
    save();
    closeModal('nb-link');
    nbRender();
    toast('✅ تم الربط');
  }
}

function nbUnlinkFromView() {
  const note = nbGetNoteInPath();
  if (!note) return;
  delete note.linkedType;
  delete note.linkedId;
  note.updatedAt = Date.now();
  save();
  nbRender();
  toast('تم الإلغاء');
}

// ============ ✅ تحقق من نجاح التحميل ============
console.log('✅ ui-notebook.js v2 loaded (dropdown fixed)');