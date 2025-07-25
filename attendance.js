function saveAttendance() {
  const rows = document.querySelectorAll("#attendanceTable tbody tr");
  const week = parseInt(document.getElementById("week")?.value || 1);
  const startDateStr = localStorage.getItem("startDate");
  const startDate = new Date(startDateStr);
  const targetDate = new Date(startDate);
  targetDate.setDate(startDate.getDate() + (week - 1) * 7);
  const dateStr = targetDate.toISOString().split('T')[0];

  let attendance = JSON.parse(localStorage.getItem("attendance") || "[]");

  rows.forEach(row => {
    const name = row.cells[0].innerText;
    const status = row.querySelector("select").value;

    attendance.push({
      name,
      status,
      date: dateStr
    });
  });

  localStorage.setItem("attendance", JSON.stringify(attendance));
  alert("تم حفظ الحضور بنجاح");
}


function loadAttendanceHistory() {
  const table = document.getElementById("historyTable");
  if (!table) return;

  const data = JSON.parse(localStorage.getItem("attendance") || "[]");

  // ترتيب تنازلي حسب التاريخ
  const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));

  // حذف الصفوف القديمة ما عدا الهيدر
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }

  // عرض البيانات في الجدول
  sortedData.forEach(entry => {
    const row = table.insertRow();
    row.insertCell(0).innerText = entry.date;
    row.insertCell(1).innerText = entry.name;
    row.insertCell(2).innerText = entry.status === "present" ? "حاضر" : "غائب";
  });
}


function saveTermData() {
  const name = document.getElementById("termName").value;
  const date = document.getElementById("startDate").value;
  const count = document.getElementById("sessionsCount").value;

  localStorage.setItem("termName", name);
  localStorage.setItem("startDate", date);
  localStorage.setItem("sessionsCount", count);

  document.getElementById("output").innerHTML = "✅ تم حفظ بيانات الترم.";
}

function renderStudents() {
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const table = document.getElementById("studentTable");
  if (!table) return;

  table.innerHTML = '<tr><th>الاسم</th><th>تعديل</th><th>حذف</th></tr>';

  const studentList = Object.values(users).filter(user => user.role === "student");

  studentList.forEach((student) => {
    const row = table.insertRow();
    row.insertCell().innerText = student.username;

    const editBtn = document.createElement("button");
    editBtn.innerText = "✏️";
    editBtn.onclick = () => editStudent(student.email);
    row.insertCell().appendChild(editBtn);

    const delBtn = document.createElement("button");
    delBtn.innerText = "🗑️";
    delBtn.onclick = () => deleteStudent(student.email);
    row.insertCell().appendChild(delBtn);
  });
}

function deleteStudent(email) {
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  delete users[email];
  localStorage.setItem("users", JSON.stringify(users));
  renderStudents();
}

function editStudent(email) {
  const newName = prompt("اكتب الاسم الجديد:");
  if (newName) {
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    if (users[email]) {
      users[email].username = newName;
      localStorage.setItem("users", JSON.stringify(users));
      renderStudents();
    }
  }
}

function renderAttendanceTable() {
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const table = document.getElementById("attendanceTable");
  if (!table) return;

  table.innerHTML = "";

  const studentList = Object.values(users).filter(user => user.role === "student");

  studentList.forEach((student) => {
    const row = table.insertRow();
    const cellName = row.insertCell();
    const cellSelect = row.insertCell();

    cellName.innerText = student.username;

    const select = document.createElement("select");
    select.innerHTML = `
      <option value="present">حاضر</option>
      <option value="absent">غائب</option>
    `;
    cellSelect.appendChild(select);
  });
}

function printAttendance() {
  const printContents = document.getElementById("historyTable").outerHTML;
  const printWindow = window.open("", "", "height=600,width=800");
  printWindow.document.write("<html><head><title>سجل الحضور</title>");
  printWindow.document.write("<style>");
  printWindow.document.write("table { width: 100%; border-collapse: collapse; direction: rtl; font-family: Arial; }");
  printWindow.document.write("th, td { border: 1px solid black; padding: 10px; text-align: center; }");
  printWindow.document.write("</style>");
  printWindow.document.write("</head><body>");
  printWindow.document.write("<h2>سجل الحضور</h2>");
  printWindow.document.write(printContents);
  printWindow.document.write("</body></html>");
  printWindow.document.close();
  printWindow.print();
}

window.onload = function () {
  const currentPage = window.location.pathname;

  if (currentPage.includes("AttendanceRegistration.html")) {
    renderStudents();
    renderAttendanceTable();

    const termName = localStorage.getItem("termName");
    const sessionsCount = parseInt(localStorage.getItem("sessionsCount"));
    const startDate = localStorage.getItem("startDate");

    if (!termName || !sessionsCount || !startDate) {
      alert("⚠️ لم يتم إعداد بيانات الترم. الرجاء إدخالها أولًا.");
      return;
    }

    const termDisplay = document.getElementById("termDisplay");
    if (termDisplay) termDisplay.value = termName;

    const weekSelect = document.getElementById("week");
    if (weekSelect) {
      weekSelect.innerHTML = "";
      for (let i = 1; i <= sessionsCount; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = `الأسبوع ${i}`;
        weekSelect.appendChild(opt);
      }
    }

    const startDateDisplay = document.getElementById("startDateDisplay");
    if (startDateDisplay) startDateDisplay.textContent = `تاريخ أول جمعة: ${startDate}`;
  }

  if (currentPage.includes("AttendanceData.html")) {
    loadAttendanceHistory();
  }
};
