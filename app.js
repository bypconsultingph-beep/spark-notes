// 鈹€鈹€ 鏁版嵁灞?鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
const STORAGE_KEY = 'spark-notes-v1';

function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function createNote(type, content, tags, extra = {}) {
  return {
    id: Date.now().toString(),
    type,        // 'text' | 'url' | 'image'
    content,     // 涓诲唴瀹?    tags,        // string[]
    extra,       // { source?, note?, imageData? }
    createdAt: new Date().toISOString()
  };
}

// 鈹€鈹€ 鐘舵€?鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
let notes = loadNotes();
let currentTag = 'all';
let searchQuery = '';
let editingId = null;       // 缂栬緫妯″紡鏃惰褰?id
let currentType = 'text';
let pendingTags = [];
let pendingImageData = null;

// 鈹€鈹€ 宸ュ叿鍑芥暟 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60)   return '鍒氬垰';
  if (diff < 3600) return `${Math.floor(diff / 60)} 鍒嗛挓鍓峘;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 灏忔椂鍓峘;
  const days = Math.floor(diff / 86400);
  if (days < 7)   return `${days} 澶╁墠`;
  return `${d.getMonth()+1}/${d.getDate()}`;
}

function escapeHtml(str = '') {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getAllTags() {
  const set = new Set();
  notes.forEach(n => n.tags.forEach(t => set.add(t)));
  return [...set];
}

// 鈹€鈹€ 娓叉煋 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
function getFilteredNotes() {
  return notes
    .filter(n => currentTag === 'all' || n.tags.includes(currentTag))
    .filter(n => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        n.content.toLowerCase().includes(q) ||
        (n.extra.source || '').toLowerCase().includes(q) ||
        (n.extra.note || '').toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function renderTagBar() {
  const bar = document.getElementById('tagBar');
  const allTags = getAllTags();
  bar.innerHTML = `<div class="tag-chip ${currentTag === 'all' ? 'active' : ''}" data-tag="all">鍏ㄩ儴</div>`;
  allTags.forEach(tag => {
    bar.innerHTML += `<div class="tag-chip ${currentTag === tag ? 'active' : ''}" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</div>`;
  });
}

function renderCards() {
  const list = document.getElementById('cardList');
  const filtered = getFilteredNotes();

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="icon">${searchQuery || currentTag !== 'all' ? '馃攳' : '鉁?}</div>
        <p>${searchQuery || currentTag !== 'all' ? '娌℃湁鎵惧埌鍖归厤鐨勬敹钘? : '杩樻病鏈夋敹钘忥紝鐐瑰嚮 锛?寮€濮嬭褰曠伒鎰熷惂锛?}</p>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(note => renderCard(note)).join('');
}

function renderCard(note) {
  const typeIcon = { text: '馃摑', url: '馃敆', image: '馃柤锔? }[note.type];
  const tags = note.tags.map(t => `<span class="card-tag">#${escapeHtml(t)}</span>`).join('');

  let body = '';
  if (note.type === 'text') {
    body = `<div class="card-content">${escapeHtml(note.content)}</div>`;
    if (note.extra.source) {
      body += `<div style="font-size:12px;color:var(--text-sub);margin-top:6px">鈥?${escapeHtml(note.extra.source)}</div>`;
    }
  } else if (note.type === 'url') {
    body = `<div class="card-content url-content"><a href="${escapeHtml(note.content)}" target="_blank" rel="noopener">${escapeHtml(note.content)}</a></div>`;
    if (note.extra.note) {
      body += `<div class="card-content" style="margin-top:6px;color:var(--text-sub)">${escapeHtml(note.extra.note)}</div>`;
    }
  } else if (note.type === 'image') {
    body = `<img class="card-image" src="${note.extra.imageData}" alt="鏀惰棌鍥剧墖" loading="lazy" />`;
    if (note.extra.note) {
      body += `<div class="card-content" style="margin-top:8px">${escapeHtml(note.extra.note)}</div>`;
    }
  }

  return `
    <div class="note-card type-${note.type}" data-id="${note.id}">
      <div class="card-header">
        <span class="card-type-icon">${typeIcon}</span>
        <span class="card-time">${formatTime(note.createdAt)}</span>
      </div>
      ${body}
      ${tags ? `<div class="card-tags">${tags}</div>` : ''}
      <div class="card-actions">
        <button class="card-btn" data-action="edit" data-id="${note.id}">缂栬緫</button>
        <button class="card-btn del" data-action="delete" data-id="${note.id}">鍒犻櫎</button>
      </div>
    </div>`;
}

function render() {
  renderTagBar();
  renderCards();
}

// 鈹€鈹€ 寮瑰嚭闈㈡澘 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
function openSheet(note = null) {
  editingId = note ? note.id : null;
  pendingTags = note ? [...note.tags] : [];
  pendingImageData = note?.extra?.imageData || null;

  document.getElementById('sheetTitle').textContent = note ? '缂栬緫鏀惰棌' : '鏂板缓鏀惰棌';
  document.getElementById('submitBtn').textContent = note ? '淇濆瓨淇敼' : '淇濆瓨鏀惰棌';

  // 閲嶇疆琛ㄥ崟
  document.getElementById('textContent').value = '';
  document.getElementById('textSource').value = '';
  document.getElementById('urlContent').value = '';
  document.getElementById('urlNote').value = '';
  document.getElementById('imageNote').value = '';
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('imagePreview').src = '';

  // 濉叆缂栬緫鏁版嵁
  if (note) {
    setType(note.type);
    if (note.type === 'text') {
      document.getElementById('textContent').value = note.content;
      document.getElementById('textSource').value = note.extra.source || '';
    } else if (note.type === 'url') {
      document.getElementById('urlContent').value = note.content;
      document.getElementById('urlNote').value = note.extra.note || '';
    } else if (note.type === 'image') {
      document.getElementById('imageNote').value = note.extra.note || '';
      if (note.extra.imageData) {
        const img = document.getElementById('imagePreview');
        img.src = note.extra.imageData;
        img.style.display = 'block';
      }
    }
  } else {
    setType('text');
  }

  renderPendingTags();
  document.getElementById('overlay').classList.add('open');
}

function closeSheet() {
  document.getElementById('overlay').classList.remove('open');
  editingId = null;
  pendingTags = [];
  pendingImageData = null;
}

function setType(type) {
  currentType = type;
  document.querySelectorAll('.type-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.type === type);
  });
  ['text', 'url', 'image'].forEach(t => {
    document.getElementById(`panel-${t}`).style.display = t === type ? '' : 'none';
  });
}

// 鈹€鈹€ 鏍囩杈撳叆 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
function renderPendingTags() {
  const wrap = document.getElementById('tagInputWrap');
  const input = document.getElementById('tagInput');
  wrap.innerHTML = '';
  pendingTags.forEach(tag => {
    const pill = document.createElement('span');
    pill.className = 'tag-pill';
    pill.innerHTML = `#${escapeHtml(tag)} <span class="remove-tag" data-tag="${escapeHtml(tag)}">脳</span>`;
    wrap.appendChild(pill);
  });
  wrap.appendChild(input);
  input.value = '';
}

function addPendingTag(raw) {
  const tag = raw.trim().replace(/^#/, '');
  if (tag && !pendingTags.includes(tag)) {
    pendingTags.push(tag);
    renderPendingTags();
  }
}

// 鈹€鈹€ 淇濆瓨閫昏緫 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
function submitNote() {
  let content = '';
  let extra = {};

  if (currentType === 'text') {
    content = document.getElementById('textContent').value.trim();
    if (!content) { alert('璇疯緭鍏ュ唴瀹?); return; }
    extra.source = document.getElementById('textSource').value.trim();
  } else if (currentType === 'url') {
    content = document.getElementById('urlContent').value.trim();
    if (!content) { alert('璇疯緭鍏ラ摼鎺?); return; }
    extra.note = document.getElementById('urlNote').value.trim();
  } else if (currentType === 'image') {
    if (!pendingImageData) { alert('璇烽€夋嫨鍥剧墖'); return; }
    content = '鍥剧墖鏀惰棌';
    extra.imageData = pendingImageData;
    extra.note = document.getElementById('imageNote').value.trim();
  }

  if (editingId) {
    const idx = notes.findIndex(n => n.id === editingId);
    if (idx !== -1) {
      notes[idx] = { ...notes[idx], type: currentType, content, tags: pendingTags, extra };
    }
  } else {
    notes.unshift(createNote(currentType, content, pendingTags, extra));
  }

  saveNotes(notes);
  closeSheet();
  render();
}

// 鈹€鈹€ 浜嬩欢缁戝畾 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

// 鎵撳紑鏂板缓闈㈡澘
document.getElementById('navAdd').addEventListener('click', () => openSheet());

// 鍏抽棴闈㈡澘锛堢偣鍑婚伄缃╋級
document.getElementById('overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('overlay')) closeSheet();
});

// 绫诲瀷鍒囨崲
document.querySelectorAll('.type-tab').forEach(tab => {
  tab.addEventListener('click', () => setType(tab.dataset.type));
});

// 鏍囩杈撳叆鍥炶溅
document.getElementById('tagInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    addPendingTag(e.target.value);
  }
});

// 鏍囩鍒犻櫎锛堜簨浠跺鎵橈級
document.getElementById('tagInputWrap').addEventListener('click', e => {
  if (e.target.classList.contains('remove-tag')) {
    const tag = e.target.dataset.tag;
    pendingTags = pendingTags.filter(t => t !== tag);
    renderPendingTags();
  }
});

// 鍥剧墖涓婁紶
document.getElementById('uploadArea').addEventListener('click', () => {
  document.getElementById('imageFile').click();
});

document.getElementById('imageFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    pendingImageData = ev.target.result;
    const img = document.getElementById('imagePreview');
    img.src = pendingImageData;
    img.style.display = 'block';
  };
  reader.readAsDataURL(file);
});

// 淇濆瓨
document.getElementById('submitBtn').addEventListener('click', submitNote);

// 鎼滅储
document.getElementById('searchInput').addEventListener('input', e => {
  searchQuery = e.target.value.trim();
  render();
});

// 鏍囩绛涢€夛紙浜嬩欢濮旀墭锛?document.getElementById('tagBar').addEventListener('click', e => {
  const chip = e.target.closest('.tag-chip');
  if (!chip) return;
  currentTag = chip.dataset.tag;
  render();
});

// 鍗＄墖鎿嶄綔锛堜簨浠跺鎵橈級
document.getElementById('cardList').addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;

  if (action === 'delete') {
    if (!confirm('纭畾鍒犻櫎杩欐潯鏀惰棌锛?)) return;
    notes = notes.filter(n => n.id !== id);
    saveNotes(notes);
    render();
  }

  if (action === 'edit') {
    const note = notes.find(n => n.id === id);
    if (note) openSheet(note);
  }
});

// 鈹€鈹€ 鍒濆鍖?鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
render();

// 娉ㄥ唽 Service Worker锛圥WA 绂荤嚎鏀寔锛?if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
