// ═══════════════════════════════════════════════════════════
//  اسکریپت آفلاین (ذخیره در حافظه مرورگر)
// ═══════════════════════════════════════════════════════════

const DATA_KEY = 'apartment_data_v11'; 
let appData = {};

const TRASH_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="15" width="80" height="15" rx="5" fill="#ef4444"/><rect x="35" y="5" width="30" height="10" rx="4" fill="#ef4444"/><path d="M 15 32 L 85 32 L 75 92 A 10 10 0 0 1 65 100 L 35 100 A 10 10 0 0 1 25 92 Z" fill="#ef4444"/><rect x="32" y="45" width="8" height="35" rx="4" fill="white"/><rect x="46" y="45" width="8" height="35" rx="4" fill="white"/><rect x="60" y="45" width="8" height="35" rx="4" fill="white"/></svg>`;
const CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function fmt(n) { return n === 0 ? '۰' : n.toLocaleString('fa-IR'); }

// ─── مدیریت حافظه ───
function loadData() {
  const saved = localStorage.getItem(DATA_KEY);
  if (saved) {
    appData = JSON.parse(saved);
    if(!appData.details) appData.details = {};
    if(!appData.paid) appData.paid = {};
  } else {
    appData = JSON.parse(JSON.stringify(initialData));
    appData.paid = appData.paid || {};
    saveData();
  }
}
function saveData() { localStorage.setItem(DATA_KEY, JSON.stringify(appData)); }

// ─── رندر جدول ───
function render() {
  const thead = document.getElementById('tableHead');
  const tbody = document.getElementById('tbody');
  const tfoot = document.getElementById('tableFoot');
  
  let thHtml = '<tr><th style="width:3%">#</th>';
  thHtml += `<th style="width:12%">نام واحد <button class="th-btn add" onclick="openAddPersonModal()" title="افزودن شخص جدید">+</button></th>`;
  
  appData.columns.forEach(col => {
    thHtml += `<th>
      ${col.label}
      <button class="th-btn add" onclick="openAddColumnModal('${col.type}')" title="افزودن ستون جدید">+</button>
      <button class="th-btn del" onclick="askDeleteColumn('${col.id}')" title="حذف این ستون">×</button>
    </th>`;
  });
  
  thHtml += `<th style="width:12%">مانده بدهی</th><th class="action-col" style="width:3%"></th></tr>`;
  thead.innerHTML = thHtml;

  tbody.innerHTML = '';
  let visibleCount = 0, grandTotal = 0, sPaidTotal = 0;
  let colSums = {};
  appData.columns.forEach(c => colSums[c.id] = 0);

  appData.people.forEach((person, index) => {
    let rowRemaining = 0;
    let rowHtml = `<tr><td>${(index + 1).toLocaleString('fa-IR')}</td>`;
    
    rowHtml += `<td class="name">
      <span>${person.name}</span>
      <button class="th-btn del" onclick="askDeletePerson('${person.id}')" title="حذف این شخص">×</button>
    </td>`;
    
    appData.columns.forEach(col => {
      const key = `${person.id}:${col.id}`;
      const amount = appData.amounts[key] || 0;
      const isPaid = appData.paid[key] || false;
      
      const detailText = (appData.details && appData.details[key]) ? `<span class="sub">${appData.details[key]}</span>` : '';
      
      if (amount > 0) {
        if (isPaid) sPaidTotal += amount;
        else { rowRemaining += amount; colSums[col.id] += amount; }
      }
      
      if (amount === 0) {
        if (col.type === 'fixed') rowHtml += `<td><span class="prev-paid">تسویه</span></td>`;
        else rowHtml += `<td><span style="color:#9ca3af;">—</span></td>`;
      } else if (isPaid) {
        rowHtml += `<td><div class="paid-anim">${CHECK_SVG} تسویه</div><button class="tog-btn undo" onclick="togglePaid('${person.id}','${col.id}')">↺</button></td>`;
      } else {
        rowHtml += `<td><span class="amt">${fmt(amount)}</span>${detailText}<button class="tog-btn" onclick="togglePaid('${person.id}','${col.id}')">${TRASH_SVG}</button></td>`;
      }
    });
    
    const totalHtml = rowRemaining === 0 ? `<span class="badge-settled">تسویه شد</span>` : `<span class="total-cell">${fmt(rowRemaining)}</span>`;
    rowHtml += `<td>${totalHtml}</td><td class="action-col"></td></tr>`;
    
    tbody.innerHTML += rowHtml;
    if (rowRemaining > 0) visibleCount++;
    grandTotal += rowRemaining;
  });

  let footHtml = `<tr><td colspan="2">جمع</td>`;
  appData.columns.forEach(col => {
    footHtml += `<td>${colSums[col.id] === 0 ? '—' : fmt(colSums[col.id])}</td>`;
  });
  footHtml += `<td class="total-cell">${fmt(grandTotal)}</td><td class="action-col"></td></tr>`;
  tfoot.innerHTML = footHtml;

  document.getElementById('debtCount').textContent = visibleCount.toLocaleString('fa-IR');
  document.getElementById('grandTotal2').textContent = fmt(grandTotal);
  
  // ⬇️ محاسبه و نمایش عدد جمع پرداخت‌شده با در نظر گرفتن خط پایه
  const displayTotal = Math.max(0, sPaidTotal - (appData.resetPaidView || 0));
  document.getElementById('sumPaidTotal').textContent = fmt(displayTotal);
}

// ─── توابع عمومی و پاپ‌آپ‌ها ───
function openAddPersonModal() {
  document.getElementById('newPersonName').value = '';
  document.getElementById('newPersonName').classList.remove('invalid');
  document.getElementById('addPersonModal').classList.add('active');
  setTimeout(() => document.getElementById('newPersonName').focus(), 300);
}
function closeAddPersonModal() { document.getElementById('addPersonModal').classList.remove('active'); }
function confirmAddPerson() {
  const input = document.getElementById('newPersonName');
  const name = input.value.trim();
  if (!name) { input.classList.add('invalid'); setTimeout(() => input.classList.remove('invalid'), 500); return; }
  appData.people.push({ id: 'p_' + Date.now(), name: name });
  saveData(); render(); closeAddPersonModal();
}

function openAddColumnModal(type) {
  document.getElementById('addColumnModal').dataset.type = type;
  document.getElementById('newColumnName').value = '';
  document.getElementById('newColumnAmount').value = '0';
  if (type === 'month') {
    document.getElementById('addColumnTitle').textContent = 'افزودن ماه جدید';
    document.getElementById('addColumnLabel').textContent = 'نام ماه (مثلاً آذر ۱۴۰۵):';
    document.getElementById('newColumnName').placeholder = 'مثلاً: آذر ۱۴۰۵';
  } else {
    document.getElementById('addColumnTitle').textContent = 'افزودن ستون جدید';
    document.getElementById('addColumnLabel').textContent = 'نام ستون (مثلاً تعمیرات):';
    document.getElementById('newColumnName').placeholder = 'مثلاً: تعمیرات';
  }
  document.getElementById('newColumnName').classList.remove('invalid');
  document.getElementById('addColumnModal').classList.add('active');
  setTimeout(() => document.getElementById('newColumnName').focus(), 300);
}
function closeAddColumnModal() { document.getElementById('addColumnModal').classList.remove('active'); }
function confirmAddColumn() {
  const type = document.getElementById('addColumnModal').dataset.type;
  const nameInput = document.getElementById('newColumnName');
  const label = nameInput.value.trim();
  const amount = parseInt(document.getElementById('newColumnAmount').value) || 0;
  if (!label) { nameInput.classList.add('invalid'); setTimeout(() => nameInput.classList.remove('invalid'), 500); return; }
  const newCol = { id: 'c_' + Date.now(), label: label, type: type };
  appData.columns.push(newCol);
  appData.people.forEach(p => { appData.amounts[`${p.id}:${newCol.id}`] = amount; });
  saveData(); render(); closeAddColumnModal();
}

let pendingDeletePersonId = null;
function askDeletePerson(id) {
  pendingDeletePersonId = id;
  const user = appData.people.find(p => p.id === id);
  document.getElementById('deletePersonName').innerText = `شخص «${user.name}» و تمام سوابق مالی او پاک می‌شود.`;
  document.getElementById('deletePersonModal').classList.add('active');
}
function closeDeletePersonModal() { document.getElementById('deletePersonModal').classList.remove('active'); setTimeout(() => pendingDeletePersonId = null, 400); }
function confirmDeletePerson() {
  if (!pendingDeletePersonId) return;
  appData.people = appData.people.filter(p => p.id !== pendingDeletePersonId);
  Object.keys(appData.amounts).forEach(k => { if (k.startsWith(pendingDeletePersonId + ':')) delete appData.amounts[k]; });
  Object.keys(appData.paid).forEach(k => { if (k.startsWith(pendingDeletePersonId + ':')) delete appData.paid[k]; });
  saveData(); render(); closeDeletePersonModal();
}

let pendingDeleteColumnId = null;
function askDeleteColumn(id) {
  pendingDeleteColumnId = id;
  const col = appData.columns.find(c => c.id === id);
  document.getElementById('deleteColumnName').innerText = `ستون «${col.label}» برای تمام افراد حذف می‌شود.`;
  document.getElementById('deleteColumnModal').classList.add('active');
}
function closeDeleteColumnModal() { document.getElementById('deleteColumnModal').classList.remove('active'); setTimeout(() => pendingDeleteColumnId = null, 400); }
function confirmDeleteColumn() {
  if (!pendingDeleteColumnId) return;
  appData.columns = appData.columns.filter(c => c.id !== pendingDeleteColumnId);
  Object.keys(appData.amounts).forEach(k => { if (k.endsWith(':' + pendingDeleteColumnId)) delete appData.amounts[k]; });
  Object.keys(appData.paid).forEach(k => { if (k.endsWith(':' + pendingDeleteColumnId)) delete appData.paid[k]; });
  saveData(); render(); closeDeleteColumnModal();
}

function togglePaid(id, colId) {
  const key = `${id}:${colId}`;
  if (appData.paid[key]) delete appData.paid[key];
  else appData.paid[key] = true;
  saveData(); render();
}

function openResetModal() {
  const list = document.getElementById('resetList');
  list.innerHTML = '';
  appData.people.forEach(d => {
    const hasPaid = Object.keys(appData.paid).some(k => k.startsWith(`${d.id}:`));
    if (!hasPaid) return;
    const li = document.createElement('li');
    li.innerHTML = `<span>${d.name}</span><button class="btn-reset-user" onclick="askResetSingleUser('${d.id}')">بازنشانی</button>`;
    list.appendChild(li);
  });
  if (list.innerHTML === '') list.innerHTML = '<li style="justify-content:center; color:#6b7280;">هیچ پرداختی برای بازنشانی وجود ندارد.</li>';
  document.getElementById('resetModal').classList.add('active');
}
function closeResetModal() { document.getElementById('resetModal').classList.remove('active'); }

let pendingResetId = null;
function askResetSingleUser(id) {
  pendingResetId = id;
  const user = appData.people.find(d => d.id === id);
  document.getElementById('resetConfirmName').innerText = `آیا مطمئنید تمام پرداخت‌های «${user.name}» صفر شود؟`;
  document.getElementById('resetConfirmModal').classList.add('active');
}
function closeResetConfirmModal() { document.getElementById('resetConfirmModal').classList.remove('active'); setTimeout(() => pendingResetId = null, 400); }
function confirmResetSingleUser() {
  if (!pendingResetId) return;
  Object.keys(appData.paid).forEach(k => { if (k.startsWith(`${pendingResetId}:`)) delete appData.paid[k]; });
  saveData(); render(); closeResetConfirmModal(); closeResetModal();
}

// ─── توابع جدید: صفر کردن جمع پرداخت‌شده ───
function openResetPaidTotalModal() {
  document.getElementById('resetPaidTotalModal').classList.add('active');
}
function closeResetPaidTotalModal() {
  document.getElementById('resetPaidTotalModal').classList.remove('active');
}
function confirmResetPaidTotal() {
  const paid = appData.paid || {};
  let currentTotal = 0;
  
  appData.people.forEach(person => {
    appData.columns.forEach(col => {
      const key = `${person.id}:${col.id}`;
      if (paid[key]) {
        currentTotal += (appData.amounts[key] || 0);
      }
    });
  });
  
  appData.resetPaidView = currentTotal;
  saveData();
  render();
  closeResetPaidTotalModal();
}

// ─── پشتیبان‌گیری و بازیابی ───
function backupData() {
  const dataStr = JSON.stringify(appData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `apartment_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

function restoreData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsedData = JSON.parse(e.target.result);
      if (parsedData.people && parsedData.columns && parsedData.amounts) {
        appData = parsedData;
        if (!appData.paid) appData.paid = {};
        if (!appData.details) appData.details = {};
        saveData();
        render();
        alert('✅ اطلاعات با موفقیت بازیابی شد!');
      } else { alert('❌ فایل معتبر نیست.'); }
    } catch (err) { alert('❌ خطا در خواندن فایل.'); }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// بستن مودال‌ها با کلیک روی پس‌زمینه
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('active'); });
});

// شروع
loadData();
render();