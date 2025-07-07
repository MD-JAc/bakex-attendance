let employees = [];
let session = null;
let history = [];

// Login
function login() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value.trim();
  if (u === 'bake123' && p === 'bake@123') {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    showSection('employees');
  } else {
    alert('Invalid credentials!');
  }
}

// Sidebar toggle
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('-translate-x-full');
}

document.addEventListener('click', e => {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar.contains(e.target) && !e.target.closest('button[onclick="toggleSidebar()"]')) {
    sidebar.classList.add('-translate-x-full');
  }
});

function showSection(section) {
  ['employeesSection', 'attendanceSection', 'analyticsSection'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById(section + 'Section').classList.remove('hidden');
  ['navEmployees', 'navAttendance', 'navAnalytics'].forEach(id => {
    document.getElementById(id).classList.remove('bg-yellow-200');
  });
  document.getElementById('nav' + capitalize(section)).classList.add('bg-yellow-200');
  toggleSidebar();
  if (section === 'analytics') renderAnalytics();
}

// Employees
function addEmployee() {
  const name = document.getElementById('empName').value.trim();
  const phone = document.getElementById('empPhone').value.trim();
  if (!name) return;
  employees.push({ name, phone });
  document.getElementById('empName').value = '';
  document.getElementById('empPhone').value = '';
  renderEmployees();
}

function renderEmployees() {
  const tbody = document.getElementById('employeeTable');
  tbody.innerHTML = '';
  employees.forEach(e => {
    const row = `<tr><td class="p-2">${e.name}</td><td class="p-2">${e.phone}</td></tr>`;
    tbody.insertAdjacentHTML('beforeend', row);
  });
}

// Attendance
function startSession() {
  const date = document.getElementById('attDate').value;
  const time24 = document.getElementById('attTime').value;
  if (!date || !time24) return alert('Please select date and time!');
  const [hr, min] = time24.split(':').map(Number);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const hr12 = hr % 12 || 12;
  const time12 = `${pad(hr12)}:${pad(min)} ${ampm}`;
  const desc = document.getElementById('attDesc').value.trim();
  const day = getDayOfWeek(date);

  session = {
    date, day, time: time12, desc,
    records: employees.map(e => ({ ...e, present: true }))
  };
  document.getElementById('attDay').innerText = `Day: ${day}`;
  renderSession();
  document.getElementById('closeSessionBtn').classList.remove('hidden');
}

function renderSession() {
  const div = document.getElementById('attendeeList');
  div.innerHTML = '';
  session.records.forEach((r, i) => {
    const btn = document.createElement('button');
    btn.textContent = r.name;
    btn.className = 'p-2 rounded shadow bg-green-500 text-white';
    btn.onclick = () => toggleAttendance(i, btn);
    div.appendChild(btn);
  });
}

function toggleAttendance(i, btn) {
  session.records[i].present = !session.records[i].present;
  btn.className = session.records[i].present
    ? 'p-2 rounded shadow bg-green-500 text-white'
    : 'p-2 rounded shadow bg-red-500 text-white';
}

function closeSession() {
  history.push(session);
  session = null;
  document.getElementById('attendeeList').innerHTML = '';
  document.getElementById('attDay').innerText = '';
  document.getElementById('closeSessionBtn').classList.add('hidden');
  renderHistory();
}

function renderHistory() {
  const tbody = document.getElementById('historyTable');
  tbody.innerHTML = '';
  history.forEach((h, i) => {
    const row = `<tr>
      <td>${h.date} (${h.day})</td>
      <td>${h.time}</td>
      <td>${h.desc}</td>
      <td>
        <button onclick="viewSession(${i})" class="bg-yellow-600 text-white px-2 py-1 rounded shadow">View</button>
      </td>
    </tr>`;
    tbody.insertAdjacentHTML('beforeend', row);
  });
}

function sortHistory(order) {
  history.sort((a, b) => {
    if (order === 'asc') return new Date(a.date) - new Date(b.date);
    else return new Date(b.date) - new Date(a.date);
  });
  renderHistory();
}

function viewSession(index) {
  const h = history[index];
  let html = `<table class="min-w-full border" style="border-collapse:collapse;">
  <thead><tr><th class="border p-1">S.No</th><th class="border p-1">Name</th><th class="border p-1">Status</th></tr></thead><tbody>`;
  h.records.forEach((r, idx) => {
    html += `<tr><td class="border p-1">${idx+1}</td><td class="border p-1">${r.name}</td><td class="border p-1">${r.present?'Present':'Absent'}</td></tr>`;
  });
  html += `</tbody></table>`;
  document.getElementById('viewModalContent').innerHTML = `
    <p>Date: ${h.date} (${h.day}) Time: ${h.time}</p>
    <p>${h.desc}</p>
    ${html}
  `;
  document.getElementById('viewModal').classList.remove('hidden');
}

function closeView() {
  document.getElementById('viewModal').classList.add('hidden');
}

// Analytics
function renderAnalytics() {
  const tbody = document.getElementById('analyticsTable');
  tbody.innerHTML = '';
  employees.forEach(emp => {
    let pres = 0, abs = 0;
    history.forEach(h => {
      const rec = h.records.find(r => r.name === emp.name);
      if (rec) rec.present ? pres++ : abs++;
    });
    const row = `<tr><td>${emp.name}</td><td>${pres}</td><td>${abs}</td></tr>`;
    tbody.insertAdjacentHTML('beforeend', row);
  });
}

function exportAnalyticsPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const rows = employees.map((emp, i) => {
    let pres = 0, abs = 0;
    history.forEach(h => {
      const rec = h.records.find(r => r.name === emp.name);
      if (rec) rec.present ? pres++ : abs++;
    });
    return [i + 1, emp.name, pres, abs];
  });
  doc.text(`BAKEX Since 1997 - Analytics Report`, 14, 15);
  doc.autoTable({
    head: [['S.No', 'Name', 'Presents', 'Absents']],
    body: rows,
    startY: 25,
    theme: 'grid',
    headStyles: { fillColor: [255, 204, 0] }
  });
  doc.save(`Analytics_Report.pdf`);
}

function exportAnalyticsExcel() {
  const wb = XLSX.utils.book_new();
  const wsData = [['S.No', 'Name', 'Presents', 'Absents']];
  employees.forEach((emp, i) => {
    let pres = 0, abs = 0;
    history.forEach(h => {
      const rec = h.records.find(r => r.name === emp.name);
      if (rec) rec.present ? pres++ : abs++;
    });
    wsData.push([i+1, emp.name, pres, abs]);
  });
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Analytics');
  XLSX.writeFile(wb, `Analytics_Report.xlsx`);
}

// Attendance History export
function exportHistoryPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text(`BAKEX Since 1997 - Attendance History`, 14, 15);

  history.forEach((h, idx) => {
    const rows = h.records.map((r, i) => [
      i + 1, r.name, r.present ? 'Present' : 'Absent'
    ]);
    doc.text(`Session ${idx+1}: ${h.date} ${h.time} (${h.day})`, 14, doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 25);
    doc.text(`Description: ${h.desc}`, 14, (doc.lastAutoTable ? doc.lastAutoTable.finalY + 16 : 31));
    doc.autoTable({
      head: [['S.No', 'Name', 'Status']],
      body: rows,
      startY: (doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 35),
      theme: 'grid',
      headStyles: { fillColor: [255, 204, 0] }
    });
  });

  doc.save(`Attendance_History.pdf`);
}

function exportHistoryExcel() {
  const wb = XLSX.utils.book_new();
  history.forEach((h, idx) => {
    const wsData = [['S.No', 'Name', 'Status']];
    h.records.forEach((r, i) => {
      wsData.push([i+1, r.name, r.present ? 'Present' : 'Absent']);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, `${h.date}_${h.time}`);
  });
  XLSX.writeFile(wb, `Attendance_History.xlsx`);
}

// Utilities
function pad(n) { return n < 10 ? '0' + n : n; }

function getDayOfWeek(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}