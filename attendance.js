

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

  function checkAuth() {
    const currentUser = sessionStorage.getItem("currentUser");
    if (!currentUser) {
      alert("يجب تسجيل الدخول أولاً للوصول إلى هذه الصفحة");
      window.location.href = "login.html";
      return false;
    }
    return true;
  }

  function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
  }

  function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      sessionStorage.removeItem("currentUser");
      alert("تم تسجيل الخروج بنجاح!");
      window.location.href = "login.html";
    }
  }

  async function loadAvailableDates() {
    try {
      const snapshot = await db.ref('attendance').once('value');
      const data = snapshot.val();
      const dateSelect = document.getElementById('dateSelect');
      dateSelect.innerHTML = '<option value="">-- اختر التاريخ --</option>';

      if (data) {
        const dates = Object.keys(data).sort((a, b) => new Date(b) - new Date(a));
        dates.forEach(date => {
          const option = document.createElement('option');
          option.value = date;
          option.textContent = new Date(date).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          });
          dateSelect.appendChild(option);
        });
      } else {
        dateSelect.innerHTML = '<option value="">لا توجد تواريخ متاحة</option>';
      }
    } catch (error) {
      console.error("Error loading dates:", error);
      alert("❌ حدث خطأ أثناء تحميل التواريخ");
    }
  }

  async function fetchAttendanceByDate() {
    if (!checkAuth()) return;

    const date = document.getElementById('dateSelect').value;
    const tbody = document.getElementById('attendanceBody');
    tbody.innerHTML = '';

    if (!date) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty-state">❌ الرجاء اختيار تاريخ</td></tr>';
      return;
    }

    try {
      const snapshot = await db.ref('attendance/' + date).once('value');
      const data = snapshot.val();

      if (!data) {
        tbody.innerHTML = '<tr><td colspan="3">📭 لا توجد بيانات لهذا اليوم</td></tr>';
        return;
      }

      Object.keys(data).forEach(studentId => {
        const record = data[studentId];
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = record.studentName || 'غير معروف';

        const teamCell = document.createElement('td');
        teamCell.textContent = record.team || 'غير محدد';

        const statusCell = document.createElement('td');
        statusCell.textContent = record.status === 'present' ? 'حاضر ✅' : 'غائب ❌';
        statusCell.className = record.status === 'present' ? 'status-present' : 'status-absent';

        row.appendChild(nameCell);
        row.appendChild(teamCell);
        row.appendChild(statusCell);

        tbody.appendChild(row);
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      tbody.innerHTML = '<tr><td colspan="3">❌ حدث خطأ أثناء تحميل البيانات</td></tr>';
    }
  }

  window.onload = function() {
    checkAuth();
    loadAvailableDates();
  };
  document.querySelector('.menu-toggle').addEventListener('click', function () {
document.querySelector('.nav-right').classList.toggle('show');
});

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
function filterAttendanceHistory() {
const input = document.getElementById("searchInput").value.toLowerCase();
const rows = document.querySelectorAll("#attendanceBody tr");

rows.forEach(row => {
  const name = row.cells[0]?.textContent.toLowerCase() || "";
  const team = row.cells[1]?.textContent.toLowerCase() || "";
  const status = row.cells[2]?.textContent.toLowerCase() || "";

  if (name.includes(input) || team.includes(input) || status.includes(input)) {
    row.style.display = "";
  } else {
    row.style.display = "none";
  }
});
}

function exportToExcel() {
const table = document.getElementById("historyTable");
if (!table || table.rows.length <= 1) {
  alert("⚠️ لا توجد بيانات لتصديرها!");
  return;
}

const RLM = "\u200F"; // Right-To-Left mark
const selectedDate = document.getElementById("dateSelect").value;
const formattedDate = new Date(selectedDate).toLocaleDateString("ar-EG", {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long'
});

// رأس الجدول مع التاريخ
let csvContent = `"${RLM}الاسم","${RLM}المجموعة","${RLM}الحالة","${RLM}التاريخ"\n`;

const rows = table.querySelectorAll("tbody tr");
rows.forEach(row => {
  const cols = row.querySelectorAll("td");
  if (cols.length === 3) {
    let name = cols[0].textContent.trim().replace(/✅|❌/g, "");
    let team = cols[1].textContent.trim();
    let status = cols[2].textContent.includes("حاضر") ? "حاضر" : "غائب";

    csvContent += `"${RLM + name}","${RLM + team}","${RLM + status}","${RLM + formattedDate}"\n`;
  }
});

const BOM = "\uFEFF";
const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
const today = new Date().toLocaleDateString("ar-EG").replace(/\//g, "-");

link.setAttribute("href", url);
link.setAttribute("download", `سجل-الحضور-${today}.csv`);
link.style.display = "none";
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
}

window.addEventListener('scroll', function () {
    const footer = document.querySelector('footer');
    const scrollThreshold = 150; // المسافة اللي عندها الفوتر يظهر

    if (window.scrollY > scrollThreshold) {
      footer.classList.add('visible');
    } else {
      footer.classList.remove('visible');
    }
  });

