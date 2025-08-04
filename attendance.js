

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
  const selectedDate = document.getElementById("dateSelect").value || "تاريخ غير محدد";
  const printWindow = window.open("", "", "height=600,width=800");
  printWindow.document.write("<html><head><title>سجل الحضور</title>");
  printWindow.document.write("<style>");
  printWindow.document.write("body { font-family: Arial; direction: rtl; padding: 20px; }");
  printWindow.document.write("table { width: 100%; border-collapse: collapse; margin-top: 20px; }");
  printWindow.document.write("th, td { border: 1px solid black; padding: 10px; text-align: center; }");
  printWindow.document.write("h2, h4 { margin: 0; }");
  printWindow.document.write("</style>");
  printWindow.document.write("</head><body>");
  printWindow.document.write("<h2>سجل الحضور</h2>");
  printWindow.document.write(`<h4>تاريخ يوم: ${selectedDate}</h4>`);
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
      const scrollThreshold = -300;
      if (window.scrollY > scrollThreshold) {
        footer.classList.add('visible');
      } else {
        footer.classList.remove('visible');
      }
    });



const container = document.querySelector('.cross-background');

  const svgCross = 
  <?xml version="1.0" encoding="iso-8859-1"?>
<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<!-- License: CC0. Made by SVG Repo: https://www.svgrepo.com/svg/90761/cross -->
<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 60 60" style="enable-background:new 0 0 60 60;" xml:space="preserve">
<path d="M52.247,19.665c-0.396,0-0.785,0.049-1.162,0.145c-0.403-2.214-2.347-3.897-4.675-3.897c-2.396,0-4.382,1.781-4.707,4.087
	H35v-4.811c2.077-0.517,3.594-2.381,3.594-4.599c0-2.188-1.486-4.036-3.503-4.586c0.11-0.404,0.167-0.824,0.167-1.251
	C35.258,2.132,33.126,0,30.506,0c-2.621,0-4.753,2.132-4.753,4.753c0,0.395,0.049,0.785,0.145,1.162C23.684,6.318,22,8.262,22,10.59
	c0,2.364,1.735,4.331,4,4.693V20h-7.812c-0.516-2.077-2.38-3.594-4.599-3.594c-2.188,0-4.035,1.486-4.585,3.503
	c-0.405-0.11-0.825-0.167-1.252-0.167C5.132,19.742,3,21.874,3,24.495s2.132,4.753,4.753,4.753c0.396,0,0.785-0.049,1.162-0.145
	C9.318,31.316,11.262,33,13.59,33c2.365,0,4.332-1.736,4.693-4H26v15.84c-2.026,0.551-3.506,2.405-3.506,4.569
	c0,2.188,1.486,4.036,3.502,4.586c-0.11,0.405-0.167,0.825-0.167,1.252c0,2.621,2.132,4.752,4.753,4.752s4.753-2.132,4.753-4.752
	c0-0.395-0.049-0.785-0.146-1.162c2.215-0.404,3.898-2.347,3.898-4.676c0-2.395-1.781-4.382-4.088-4.706V29h6.84
	c0.552,2.027,2.406,3.506,4.57,3.506c2.188,0,4.035-1.486,4.585-3.503c0.405,0.11,0.825,0.167,1.252,0.167
	c2.621,0,4.753-2.132,4.753-4.752S54.868,19.665,52.247,19.665z"/>
</svg>

  ;

  for (let i = 0; i < 25; i++) {
    const cross = document.createElement('div');
    cross.className = 'cross';
    cross.innerHTML = svgCross;
    cross.style.left = Math.random() * 100 + 'vw';
    cross.style.top = Math.random() * 100 + 'vh';
    cross.style.animationDuration = (12 + Math.random() * 11) + 's';
    container.appendChild(cross);
  }





