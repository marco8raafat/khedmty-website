function saveAttendance() {
    const rows = document.querySelectorAll("#attendanceTable tr");
    let attendance = JSON.parse(localStorage.getItem("attendance") || "[]");
  
    const week = parseInt(document.getElementById("week")?.value || 1);
    const startDateStr = localStorage.getItem("startDate");
  
    const startDate = new Date(startDateStr);
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + (week - 1) * 7);
    const formattedDate = targetDate.toLocaleDateString();
  
    for (let i = 1; i < rows.length; i++) {
      const name = rows[i].children[0].innerText;
      const status = rows[i].children[1].querySelector("select").value;
  
      const existingIndex = attendance.findIndex(
        (entry) => entry.name === name && entry.date === formattedDate
      );
  
      if (existingIndex !== -1) {
        attendance[existingIndex].status = status;
      } else {
        attendance.push({ name, status, date: formattedDate });
      }
    }
  
    localStorage.setItem("attendance", JSON.stringify(attendance));
    alert("✅ تم حفظ الحضور للأسبوع " + week + " بتاريخ " + formattedDate);
  }
  
  function loadAttendanceHistory() {
    const table = document.getElementById("historyTable");
    const data = JSON.parse(localStorage.getItem("attendance") || "[]");
  
    data.forEach(entry => {
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
  
  let students = JSON.parse(localStorage.getItem("students") || "[]");

  function renderStudents() {
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    const table = document.getElementById("studentTable");
    if (!table) return;
  
    table.innerHTML = '<tr><th>الاسم</th><th>تعديل</th><th>حذف</th></tr>';
  
    let studentList = Object.values(users).filter(user => user.role === "student");
  
    studentList.forEach((student, index) => {
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
  
  window.onload = renderStudents;
  
  function addStudent() {
    const name = document.getElementById("studentName").value.trim();
    if (name) {
      students.push(name);
      document.getElementById("studentName").value = "";
      renderStudents();
    }
  }
  
  function editStudent(index) {
    const newName = prompt("اكتب الاسم الجديد:", students[index]);
    if (newName) {
      students[index] = newName.trim();
      renderStudents();
    }
  }
  
  function deleteStudent(index) {
    if (confirm("هل تريد حذف هذا الطالب؟")) {
      students.splice(index, 1);
      renderStudents();
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
window.onload = function () {
  const currentPage = window.location.pathname;

  renderStudents();
  renderAttendanceTable();

  const termName = localStorage.getItem("termName");
  const sessionsCount = parseInt(localStorage.getItem("sessionsCount"));
  const startDate = localStorage.getItem("startDate");

  if (currentPage.includes("AttendanceRegistration.html")) {
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
};

function loadAttendanceHistory() {
    const table = document.getElementById("historyTable");
    const data = JSON.parse(localStorage.getItem("attendance") || "[]");
  
    while (table.rows.length > 1) {
      table.deleteRow(1);
    }
  
    const sortedData = data.slice().reverse();
  
    sortedData.forEach(entry => {
      const row = table.insertRow();
      row.insertCell(0).innerText = entry.date;
      row.insertCell(1).innerText = entry.name;
      row.insertCell(2).innerText = entry.status === "present" ? "حاضر" : "غائب";
    });
  }
  
  function filterAttendanceHistory() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    const table = document.getElementById("historyTable");
    const data = JSON.parse(localStorage.getItem("attendance") || "[]");
    const filteredData = data.filter(entry =>
      entry.name.toLowerCase().includes(searchTerm) ||
      entry.date.toLowerCase().includes(searchTerm)
    );
  
    while (table.rows.length > 1) {
      table.deleteRow(1);
    }
  
    filteredData.reverse().forEach(entry => {
      const row = table.insertRow();
      row.insertCell(0).innerText = entry.date;
      row.insertCell(1).innerText = entry.name;
      row.insertCell(2).innerText = entry.status === "present" ? "حاضر" : "غائب";
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
  

