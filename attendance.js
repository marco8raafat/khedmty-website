// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDwcSo_bhqO5svMl3kAL8N1c91nvEZ_sac",
  authDomain: "edad-5odam.firebaseapp.com",
  databaseURL: "https://edad-5odam-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "edad-5odam",
  storageBucket: "edad-5odam.appspot.com",
  messagingSenderId: "679576633778",
  appId: "1:679576633778:web:566e6aaef9b72f71a824ab"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Authentication check function
async function checkAuthentication() {
  const currentUser = sessionStorage.getItem("currentUser");
  
  if (!currentUser) {
    alert("يجب تسجيل الدخول أولاً للوصول إلى هذه الصفحة");
    window.location.href = "login.html";
    return false;
  }

  // Verify user exists in Firebase
  const emailKey = currentUser.replace(/\./g, '_');
  try {
    const snapshot = await db.ref('users/' + emailKey).once('value');
    if (!snapshot.exists()) {
      alert("جلسة المستخدم غير صالحة. يرجى تسجيل الدخول مرة أخرى");
      sessionStorage.removeItem("currentUser");
      window.location.href = "login.html";
      return false;
    }
    
    const userData = snapshot.val();
    // Check if user is a servant (only servants can access attendance)
    if (userData.role !== "servant") {
      alert("غير مسموح لك بالوصول إلى هذه الصفحة. هذه الصفحة مخصصة للخدام فقط");
      window.location.href = userData.role === "student" ? "studentDashboard.html" : "index.html";
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error verifying user:", error);
    alert("حدث خطأ في التحقق من المستخدم. يرجى تسجيل الدخول مرة أخرى");
    window.location.href = "login.html";
    return false;
  }
}

function logout() {
  if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
    sessionStorage.removeItem("currentUser");
    window.location.href = "index.html";
  }
}

// Initialize page
async function initializePage() {
  const isAuthenticated = await checkAuthentication();
  if (isAuthenticated) {
    console.log("User authenticated, loading attendance data...");
    await loadAttendanceHistory();
    await updateStatsSummary();
  }
}

// Enhanced statistics calculation
async function updateStatsSummary() {
  try {
    const attendanceSnapshot = await db.ref('attendance').once('value');
    const attendanceData = attendanceSnapshot.val();

    if (!attendanceData) {
      document.getElementById('totalRecords').textContent = '0';
      document.getElementById('attendanceRate').textContent = '0%';
      document.getElementById('totalStudents').textContent = '0';
      return;
    }

    let totalRecords = 0;
    let presentCount = 0;
    const uniqueStudents = new Set();

    Object.values(attendanceData).forEach(session => {
      if (session.students) {
        Object.values(session.students).forEach(record => {
          totalRecords++;
          uniqueStudents.add(record.name);
          if (record.status === 'present') {
            presentCount++;
          }
        });
      }
    });

    const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    document.getElementById('totalRecords').textContent = totalRecords;
    document.getElementById('attendanceRate').textContent = attendanceRate + '%';
    document.getElementById('totalStudents').textContent = uniqueStudents.size;

  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

// Export to Excel functionality
function exportToExcel() {
  const table = document.getElementById('historyTable');
  const rows = Array.from(table.rows);
  
  let csvContent = '\uFEFF'; // BOM for UTF-8
  
  rows.forEach(row => {
    const cells = Array.from(row.cells);
    const rowData = cells.map(cell => `"${cell.innerText}"`).join(',');
    csvContent += rowData + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// Load attendance history with proper user name fetching
async function loadAttendanceHistory() {
  const table = document.getElementById("historyTable");
  if (!table) return;

  try {
    // Clear existing rows except header
    while (table.rows.length > 1) {
      table.deleteRow(1);
    }

    console.log("Loading attendance history...");

    // Load both attendance data and user data from Firebase
    const [attendanceSnapshot, usersSnapshot] = await Promise.all([
      database.ref('attendance').once('value'),
      database.ref('users').once('value')
    ]);

    const attendanceData = attendanceSnapshot.val();
    const usersData = usersSnapshot.val();

    console.log("Attendance data:", attendanceData);
    console.log("Users data keys:", usersData ? Object.keys(usersData) : "No users");

    if (!attendanceData) {
      console.log("No attendance data found");
      const row = table.insertRow();
      const cell = row.insertCell(0);
      cell.colSpan = 5;
      cell.innerHTML = '<em style="color: #666;">لا توجد سجلات حضور متاحة</em>';
      cell.style.textAlign = 'center';
      cell.style.padding = '20px';
      return;
    }

    // Convert to array and flatten student records
    const allRecords = [];
    Object.entries(attendanceData).forEach(([sessionKey, session]) => {
      console.log(`Processing session: ${sessionKey}`, session);
      
      if (session.students) {
        Object.entries(session.students).forEach(([studentId, record]) => {
          // Get student name from users data if record.name is missing
          let studentName = record.name;
          if (!studentName && usersData && usersData[studentId]) {
            studentName = usersData[studentId].username;
          }
          
          console.log(`Processing student record:`, {studentId, record, studentName});
          
          allRecords.push({
            ...record,
            name: studentName || 'اسم غير متوفر',
            sessionKey,
            week: session.week,
            term: session.term,
            recordedBy: session.recordedBy,
            studentId: studentId
          });
        });
      } else {
        console.log(`No students data in session: ${sessionKey}`);
      }
    });

    console.log("All processed records:", allRecords);

    if (allRecords.length === 0) {
      console.log("No records found after processing");
      const row = table.insertRow();
      const cell = row.insertCell(0);
      cell.colSpan = 5;
      cell.innerHTML = '<em style="color: #666;">لا توجد سجلات حضور صالحة للعرض</em>';
      cell.style.textAlign = 'center';
      cell.style.padding = '20px';
      return;
    }

    // Sort by date (newest first)
    allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Display records
    allRecords.forEach(record => {
      const row = table.insertRow();
      row.dataset.studentId = record.studentId;
      row.insertCell(0).innerText = record.date;
      row.insertCell(1).innerText = record.name;

      // Status cell with dropdown
      const statusCell = row.insertCell(2);
      const select = document.createElement("select");
      select.innerHTML = `
        <option value="present" ${record.status === "present" ? "selected" : ""}>حاضر ✅</option>
        <option value="absent" ${record.status === "absent" ? "selected" : ""}>غائب ❌</option>
      `;
      select.style.width = '100%';
      select.style.padding = '5px';
      select.style.border = '1px solid #ddd';
      select.style.borderRadius = '4px';
      select.onchange = () => updateAttendanceStatus(record.studentId, record.date, select.value);
      statusCell.appendChild(select);
      
      // Team column
      let teamName = record.team;
      if (!teamName && usersData && usersData[record.studentId]) {
        teamName = usersData[record.studentId].group;
      }
      row.insertCell(3).innerText = teamName || 'غير محدد';
      
      // Delete button
      const actionCell = row.insertCell(4);
      const delBtn = document.createElement("button");
      delBtn.innerText = "🗑️";
      delBtn.onclick = () => deleteAttendanceRecord(record.studentId, record.date);
      delBtn.style.background = "#f44336";
      delBtn.style.color = "white";
      delBtn.style.border = "none";
      delBtn.style.padding = "5px 10px";
      delBtn.style.borderRadius = "4px";
      delBtn.style.cursor = "pointer";
      actionCell.appendChild(delBtn);

      // Color code based on attendance
      if (record.status === "present") {
        row.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
      } else {
        row.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
      }
    });

  } catch (error) {
    console.error("Error loading attendance history:", error);
    const row = table.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = 5;
    cell.innerHTML = '<em style="color: #f44336;">حدث خطأ في تحميل سجل الحضور</em>';
    cell.style.textAlign = 'center';
  }
}

// Update attendance status
async function updateAttendanceStatus(studentId, date, status) {
  try {
    const currentUser = sessionStorage.getItem("currentUser");
    const emailKey = currentUser.replace(/\./g, '_');
    const userSnapshot = await database.ref('users/' + emailKey).once('value');
    const userData = userSnapshot.val();

    const studentSnapshot = await database.ref('users/' + studentId).once('value');
    const studentData = studentSnapshot.val();

    const attendanceData = {
      name: studentData.username,
      status: status,
      team: studentData.group || 'غير محدد',
      date: date,
      recordedBy: userData.username,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    await database.ref(`attendanceHistory/${studentId}/${date}`).set(attendanceData);
    await database.ref(`attendance/${date}_week1/students/${studentId}`).set(attendanceData);

    alert("تم تحديث حالة الحضور بنجاح");
    await loadAttendanceHistory();
    await updateStatsSummary();
  } catch (error) {
    console.error("Error updating attendance status:", error);
    alert("حدث خطأ أثناء تحديث حالة الحضور");
  }
}

// Delete attendance record
async function deleteAttendanceRecord(studentId, date) {
  if (confirm("هل أنت متأكد من حذف سجل الحضور هذا؟")) {
    try {
      await database.ref(`attendanceHistory/${studentId}/${date}`).remove();
      await database.ref(`attendance/${date}_week1/students/${studentId}`).remove();
      alert("تم حذف سجل الحضور بنجاح");
      await loadAttendanceHistory();
      await updateStatsSummary();
    } catch (error) {
      console.error("Error deleting attendance record:", error);
      alert("حدث خطأ أثناء حذف سجل الحضور");
    }
  }
}

// Enhanced search functionality for attendance history
function filterAttendanceHistory() {
  const searchInput = document.getElementById("searchInput");
  const filter = searchInput.value.toLowerCase();
  const table = document.getElementById("historyTable");
  const rows = table.getElementsByTagName("tr");

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName("td");
    let found = false;
    
    for (let j = 0; j < cells.length; j++) {
      if (cells[j].innerText.toLowerCase().includes(filter)) {
        found = true;
        break;
      }
    }
    
    rows[i].style.display = found ? "" : "none";
  }
}

// Enhanced print functionality
function printAttendance() {
  const printContents = document.getElementById("historyTable").outerHTML;
  const printWindow = window.open("", "", "height=700,width=1000");
  printWindow.document.write(`
    <html>
      <head>
        <title>سجل الحضور - كنيسة السيدة العذراء</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { 
            font-family: 'Arial', sans-serif; 
            direction: rtl; 
            margin: 0; 
            padding: 20px;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #233B6E;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #233B6E;
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            font-size: 12px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: center; 
          }
          th {
            background-color: #233B6E;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>سجل الحضور</h1>
          <p>كنيسة السيدة العذراء - عزبة النخل</p>
          <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
        </div>
        ${printContents}
        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام خدمتي</p>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// Enhanced window load function
window.onload = async function () {
  const currentPage = window.location.pathname;
  console.log("Current page:", currentPage);

  if (currentPage.includes("AttendanceData.html")) {
    console.log("Initializing AttendanceData page");
    await initializePage();
  }
};