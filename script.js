import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const DATA_PATH = 'apartment/data'; 
let appData = {};
let isAdmin = false;

const TRASH_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="15" width="80" height="15" rx="5" fill="#ef4444"/><rect x="35" y="5" width="30" height="10" rx="4" fill="#ef4444"/><path d="M 15 32 L 85 32 L 75 92 A 10 10 0 0 1 65 100 L 35 100 A 10 10 0 0 1 25 92 Z" fill="#ef4444"/><rect x="32" y="45" width="8" height="35" rx="4" fill="white"/><rect x="46" y="45" width="8" height="35" rx="4" fill="white"/><rect x="60" y="45" width="8" height="35" rx="4" fill="white"/></svg>`;
const CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function fmt(n) { return n === 0 ? '۰' : n.toLocaleString('fa-IR'); }

window.toggleAdminMode = function() {
  if (!isAdmin) {
    const pass = prompt("لطفاً رمز عبور مدیر را وارد کنید (پیش‌فرض: 1234):");
    if (pass === "1234") {
      isAdmin = true;
      document.getElementById('adminToolbar').style.display = 'flex';
      document.getElementById('modeBadge').innerText = "حالت: مدیر ساختمان 👑";
      document.getElementById('modeBadge').style.background = "#d1fae5";
      document.getElementById('modeBadge').style.color = "#047857";
      document.getElementById('adminToggleBtn').innerText = "خروج از حالت مدیر";
      document.getElementById('adminToggleBtn').className = "btn btn-danger";
      render();
    } else {
      alert("رمز عبور اشتباه است!");
    }
  } else {
    isAdmin = false;
    document.getElementById('adminToolbar').style.display = 'none';
    document.getElementById('modeBadge').innerText = "حالت: فقط خواندن";
    document.getElementById('modeBadge').style.background = "#f3f4f6";
    document.getElementById('modeBadge').style.color = "#4b5563";
    document.getElementById('adminToggleBtn').innerText = "🔒 ورود مدیر";
    document.getElementById('adminToggleBtn').className = "btn btn-secondary";
    render();
  }
};

// ─── تابع راه‌اندازی فایربیس ───
function initApp() {
  const dataRef = ref(window.db, DATA_PATH);
  onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      appData = data;
      if (!appData.paid) appData.paid = {};
      if (!appData.details) appData.details = {};
    } else {
      // استفاده از window.initialData
      appData = JSON.parse(JSON.stringify(window.initialData)); 
      appData.paid = appData.paid || {};
      saveData();
    }
    render();
  });
}

// 🔥 راه‌حل مشکل: چک کردن مداوم تا فایربیس لود شود
const checkFirebase = setInterval(() => {
  if (window.db) {
    clearInterval(checkFirebase);
    initApp();
  }
}, 100);

function saveData() {
  if (!window.db) return;
  const dataRef = ref(window.db, DATA_PATH);
  set(dataRef, appData);
}

function render() {
  // 🛡️ خط محافظ: اگر اطلاعات هنوز لود نشده، کاری نکن (جلوگیری از کرش)
  if (!appData || !appData.columns) {
    console.log("منتظر دریافت اطلاعات از دیتابیس...");
    return; 
  }

  const thead = document.getElementById('tableHead');
  const tbody = document.getElementById('tbody');
  const tfoot = document.getElementById('tableFoot');
  
  let thHtml = '<tr><th style="width:3%">#</th>';
  thHtml += `<th style="width:12%">نام واحد ${isAdmin ? `<button class="th-btn add" onclick="openAddPersonModal()">+</button>` : ''}</th>`;
  
  appData.columns.forEach(col => {
    thHtml += `<th>
      ${col.label}
      ${isAdmin ? `<button class="th-btn add" onclick="openAddColumnModal('${col.type}')">+</button>
      <button class="th-btn del" onclick="askDeleteColumn('${col.id}')">×</button>` : ''}
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
      ${isAdmin ? `<button class="th-btn del" onclick="askDeletePerson('${person.id}')">×</button>` : ''}
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
        rowHtml += `<td><div class="paid-anim">${CHECK_SVG} تسویه</div>${isAdmin ? `<button class="tog-btn undo" onclick="togglePaid('${person.id}','${col.id}')">↺</button>` : ''}</td>`;
      } else {
        rowHtml += `<td><span class="amt">${fmt(amount)}</span>${detailText}${isAdmin ? `<button class="tog-btn" onclick="togglePaid('${person.id}','${col.id}')">${TRASH_SVG}</button>` : ''}</td>`;
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
  
  const displayTotal = Math.max(0, sPaidTotal - (appData.resetPaidView || 0));
  document.getElementById('sumPaidTotal').textContent = fmt(displayTotal);
}

// توابع ویرایش (فقط مدیر)
window.togglePaid = function(id, colId) {
  if (!isAdmin) return;
  const key = `${id}:${colId}`;
  if (appData.paid[key]) delete appData.paid[key];
  else appData.paid[key] = true;
  saveData();
}

window.openResetPaidTotalModal = function() {
  if (!isAdmin) return;
  document.getElementById('resetPaidTotalModal').classList.add('active');
}
window.closeResetPaidTotalModal = function() { document.getElementById('resetPaidTotalModal').classList.remove('active'); }
window.confirmResetPaidTotal = function() {
  if (!isAdmin) return;
  const paid = appData.paid || {};
  let currentTotal = 0;
  appData.people.forEach(person => {
    appData.columns.forEach(col => {
      const key = `${person.id}:${col.id}`;
      if (paid[key]) currentTotal += (appData.amounts[key] || 0);
    });
  });
  appData.resetPaidView = currentTotal;
  saveData(); render(); closeResetPaidTotalModal();
}

window.openAddPersonModal = function() {
  if (!isAdmin) return;
  document.getElementById('newPersonName').value = '';
  document.getElementById('newPersonName').classList.remove('invalid');
  document.getElementById('addPersonModal').classList.add('active');
  setTimeout(() => document.getElementById('newPersonName').focus(), 300);
}
window.closeAddPersonModal = function() { document.getElementById('addPersonModal').classList.remove('active'); }
window.confirmAddPerson = function() {
  if (!isAdmin) return;
  const input = document.getElementById('newPersonName');
  const name = input.value.trim();
  if (!name) { input.classList.add('invalid'); setTimeout(() => input.classList.remove('invalid'), 500); return; }
  appData.people.push({ id: 'p_' + Date.now(), name: name });
  saveData(); closeAddPersonModal();
}

window.openAddColumnModal = function(type) {
  if (!isAdmin) return;
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
window.closeAddColumnModal = function() { document.getElementById('addColumnModal').classList.remove('active'); }
window.confirmAddColumn = function() {
  if (!isAdmin) return;
  const type = document.getElementById('addColumnModal').dataset.type;
  const nameInput = document.getElementById('newColumnName');
  const label = nameInput.value.trim();
  const amount = parseInt(document.getElementById('newColumnAmount').value) || 0;
  if (!label) { nameInput.classList.add('invalid'); setTimeout(() => nameInput.classList.remove('invalid'), 500); return; }
  const newCol = { id: 'c_' + Date.now(), label: label, type: type };
  appData.columns.push(newCol);
  appData.people.forEach(p => { appData.amounts[`${p.id}:${newCol.id}`] = amount; });
  saveData(); closeAddColumnModal();
}

let pendingDeletePersonId = null;
window.askDeletePerson = function(id) {
  if (!isAdmin) return;
  pendingDeletePersonId = id;
  const user = appData.people.find(p => p.id === id);
  document.getElementById('deletePersonName').innerText = `شخص «${user.name}» و تمام سوابق مالی او پاک می‌شود.`;
  document.getElementById('deletePersonModal').classList.add('active');
}
window.closeDeletePersonModal = function() { document.getElementById('deletePersonModal').classList.remove('active'); setTimeout(() => pendingDeletePersonId = null, 400); }
window.confirmDeletePerson = function() {
  if (!isAdmin || !pendingDeletePersonId) return;
  appData.people = appData.people.filter(p => p.id !== pendingDeletePersonId);
  Object.keys(appData.amounts).forEach(k => { if (k.startsWith(pendingDeletePersonId + ':')) delete appData.amounts[k]; });
  Object.keys(appData.paid).forEach(k => { if (k.startsWith(pendingDeletePersonId + ':')) delete appData.paid[k]; });
  saveData(); closeDeletePersonModal();
}

let pendingDeleteColumnId = null;
window.askDeleteColumn = function(id) {
  if (!isAdmin) return;
  pendingDeleteColumnId = id;
  const col = appData.columns.find(c => c.id === id);
  document.getElementById('deleteColumnName').innerText = `ستون «${col.label}» برای تمام افراد حذف می‌شود.`;
  document.getElementById('deleteColumnModal').classList.add('active');
}
window.closeDeleteColumnModal = function() { document.getElementById('deleteColumnModal').classList.remove('active'); setTimeout(() => pendingDeleteColumnId = null, 400); }
window.confirmDeleteColumn = function() {
  if (!isAdmin || !pendingDeleteColumnId) return;
  appData.columns = appData.columns.filter(c => c.id !== pendingDeleteColumnId);
  Object.keys(appData.amounts).forEach(k => { if (k.endsWith(':' + pendingDeleteColumnId)) delete appData.amounts[k]; });
  Object.keys(appData.paid).forEach(k => { if (k.endsWith(':' + pendingDeleteColumnId)) delete appData.paid[k]; });
  saveData(); closeDeleteColumnModal();
}

window.backupData = function() {
  if (!isAdmin) return;
  const dataStr = JSON.stringify(appData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `apartment_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

window.restoreData = function(event) {
  if (!isAdmin) return;
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
        saveData(); alert('✅ اطلاعات با موفقیت بازیابی شد!');
      } else { alert('❌ فایل معتبر نیست.'); }
    } catch (err) { alert('❌ خطا در خواندن فایل.'); }
  };
  reader.readAsText(file);
  event.target.value = '';
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('active'); });
});
