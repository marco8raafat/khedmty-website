

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
    const currentUser = verifySecureSession();
    if (!currentUser) {
      alert("يجب تسجيل الدخول أولاً للوصول إلى هذه الصفحة");
      window.location.href = "login.html";
      return false;
    }
    return true;
  }

  // Check if user is authenticated and has servant role
  async function checkAuthentication() {
    const currentEmail = await requireAuthentication("login.html");
    console.log("Current email from session:", currentEmail);
    
    if (!currentEmail) {
      alert("يرجى تسجيل الدخول أولاً للوصول إلى هذه الصفحة");
      window.location.href = "login.html";
      return false;
    }

    const emailKey = currentEmail.replace(/[.#$\[\]]/g, '_');
    
    try {
      const userSnapshot = await db.ref(`users/${emailKey}`).once('value');
      const userData = userSnapshot.val();
      
      if (!userData || Object.keys(userData).length === 0) {
        console.log("No user data found, redirecting to login");
        alert("لم يتم العثور على بيانات المستخدم. يرجى تسجيل الدخول مرة أخرى");
        window.location.href = "login.html";
        return false;
      }

      // Check if user is a servant/teacher
      if (!checkIfServant(userData)) {
        console.log("User is not a servant, access denied");
        alert("غير مسموح لك بالوصول إلى هذه الصفحة. هذه الصفحة مخصصة للخدام فقط");
        window.location.href = "login.html";
        return false;
      }

      console.log("User authenticated successfully as servant");
      return true;
      
    } catch (error) {
      console.error("Error checking authentication:", error);
      alert("حدث خطأ أثناء التحقق من الصلاحيات. يرجى المحاولة مرة أخرى");
      window.location.href = "login.html";
      return false;
    }
  }


  function checkIfServant(userData) {
    if (!userData || !userData.role) {
      console.log("No role found in user data");
      return false;
    }
    
    const userRole = userData.role.toLowerCase();
    const allowedRoles = ['teacher', 'servant', 'admin', 'خادم', 'معلم', 'مدير'];
    
    console.log("User role:", userRole);
    console.log("Checking against allowed roles:", allowedRoles);
    
    const isServant = allowedRoles.includes(userRole);
    console.log("Is servant:", isServant);
    
    return isServant;
  }

  function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
  }

  function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
       clearSession();
      alert("تم تسجيل الخروج بنجاح!");
      window.location.href = "login.html";
    }
  }

  // Pagination variables
  let allDates = [];
  let currentPage = 0;
  const DATES_PER_PAGE = 30;
  let hasMoreDates = false;

  async function loadAvailableDates() {
    // Check authentication before loading data
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      return;
    }

    try {
      // OPTIMIZED: Only fetch last 100 dates instead of ALL attendance data
      const snapshot = await db.ref('attendance').orderByKey().limitToLast(100).once('value');
      const data = snapshot.val();
      const dateSelect = document.getElementById('dateSelect');
      const periodSelect = document.getElementById('periodSelect');
      const loadMoreBtn = document.getElementById('loadMoreDatesBtn');
      
      dateSelect.innerHTML = '<option value="">-- اختر التاريخ --</option>';
      periodSelect.style.display = 'none';
      periodSelect.innerHTML = '<option value="">-- اختر الفترة --</option>';

      if (data) {
        // Store all dates sorted newest first
        allDates = Object.keys(data).sort((a, b) => new Date(b) - new Date(a));
        
        // Show first page of dates
        currentPage = 0;
        displayDatesPage(data);
        
        // Show "Load More" button if there are more dates
        if (allDates.length > DATES_PER_PAGE) {
          hasMoreDates = true;
          if (loadMoreBtn) {
            loadMoreBtn.style.display = 'inline-block';
            loadMoreBtn.textContent = `⬇️ تحميل المزيد (${allDates.length - DATES_PER_PAGE} تاريخ متبقي)`;
          }
        } else {
          hasMoreDates = false;
          if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        }
        
        // Add event listener to show period select when date is selected
        dateSelect.addEventListener('change', function() {
          const selectedDate = this.value;
          periodSelect.innerHTML = '<option value="">-- اختر الفترة --</option>';
          
          if (selectedDate && data[selectedDate]) {
            const periods = Object.keys(data[selectedDate]);
            if (periods.includes('period1') || periods.includes('period2')) {
              // New structure with periods
              if (periods.includes('period1')) {
                const option1 = document.createElement('option');
                option1.value = 'period1';
                option1.textContent = 'الفترة الأولى';
                periodSelect.appendChild(option1);
              }
              if (periods.includes('period2')) {
                const option2 = document.createElement('option');
                option2.value = 'period2';
                option2.textContent = 'الفترة الثانية';
                periodSelect.appendChild(option2);
              }
              periodSelect.style.display = 'inline-block';
            } else {
              // Old structure without periods - hide period select
              periodSelect.style.display = 'none';
            }
          } else {
            periodSelect.style.display = 'none';
          }
        });
      } else {
        dateSelect.innerHTML = '<option value="">لا توجد تواريخ متاحة</option>';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      }
    } catch (error) {
      console.error("Error loading dates:", error);
      alert("❌ حدث خطأ أثناء تحميل التواريخ");
    }
  }

  function displayDatesPage(data) {
    const dateSelect = document.getElementById('dateSelect');
    const startIndex = currentPage * DATES_PER_PAGE;
    const endIndex = Math.min(startIndex + DATES_PER_PAGE, allDates.length);
    
    // Keep the placeholder option
    const placeholder = dateSelect.querySelector('option[value=""]');
    
    // Add dates for current page
    for (let i = startIndex; i < endIndex; i++) {
      const date = allDates[i];
      const option = document.createElement('option');
      option.value = date;
      option.textContent = new Date(date).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
      dateSelect.appendChild(option);
    }
    
    console.log(`[Attendance] Loaded dates ${startIndex + 1}-${endIndex} of ${allDates.length}`);
  }

  function loadMoreDates() {
    const loadMoreBtn = document.getElementById('loadMoreDatesBtn');
    
    if (!hasMoreDates || currentPage >= Math.floor(allDates.length / DATES_PER_PAGE)) {
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }
    
    currentPage++;
    const dateSelect = document.getElementById('dateSelect');
    const startIndex = currentPage * DATES_PER_PAGE;
    const endIndex = Math.min(startIndex + DATES_PER_PAGE, allDates.length);
    
    // Add next page of dates
    for (let i = startIndex; i < endIndex; i++) {
      const date = allDates[i];
      // Skip if already exists
      if (dateSelect.querySelector(`option[value="${date}"]`)) continue;
      
      const option = document.createElement('option');
      option.value = date;
      option.textContent = new Date(date).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
      dateSelect.appendChild(option);
    }
    
    // Update button text
    const remainingDates = allDates.length - endIndex;
    if (remainingDates > 0) {
      loadMoreBtn.textContent = `⬇️ تحميل المزيد (${remainingDates} تاريخ متبقي)`;
    } else {
      loadMoreBtn.style.display = 'none';
      hasMoreDates = false;
    }
    
    console.log(`[Attendance] Loaded dates ${startIndex + 1}-${endIndex} of ${allDates.length}`);
  }

  // Make function globally available
  window.loadMoreDates = loadMoreDates;

  async function fetchAttendanceByDate() {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      return;
    }

    const date = document.getElementById('dateSelect').value;
    const periodSelect = document.getElementById('periodSelect');
    const period = periodSelect.style.display !== 'none' ? periodSelect.value : null;
    const tbody = document.getElementById('attendanceBody');
    const editButton = document.getElementById('editButton');
    tbody.innerHTML = '';

    if (!date) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty-state">❌ الرجاء اختيار تاريخ</td></tr>';
      editButton.style.display = 'none';
      return;
    }

    try {
      let attendanceRef;
      let data;
      
      // Check if this date uses the new period structure
      const dateSnapshot = await db.ref('attendance/' + date).once('value');
      const dateData = dateSnapshot.val();
      
      if (!dateData) {
        tbody.innerHTML = '<tr><td colspan="3">📭 لا توجد بيانات لهذا اليوم</td></tr>';
        editButton.style.display = 'none';
        return;
      }
      
      // Check if data has period structure
      const hasPeriods = dateData.hasOwnProperty('period1') || dateData.hasOwnProperty('period2');
      
      if (hasPeriods) {
        // New structure with periods
        if (!period) {
          tbody.innerHTML = '<tr><td colspan="3" class="empty-state">❌ الرجاء اختيار الفترة</td></tr>';
          editButton.style.display = 'none';
          return;
        }
        attendanceRef = db.ref('attendance/' + date + '/' + period);
        const snapshot = await attendanceRef.once('value');
        data = snapshot.val();
        
        if (!data) {
          const periodText = period === 'period1' ? 'الفترة الأولى' : 'الفترة الثانية';
          tbody.innerHTML = `<tr><td colspan="3">📭 لا توجد بيانات لـ ${periodText}</td></tr>`;
          editButton.style.display = 'none';
          return;
        }
      } else {
        // Old structure without periods
        data = dateData;
      }

      // Show edit button when data is loaded
      editButton.style.display = 'inline-block';
      
      // Store current data for editing
      window.currentAttendanceData = data;
      window.currentDate = date;
      window.currentPeriod = period;

      // Convert data to array and sort by student name in Arabic
      const recordsArray = Object.keys(data).map(studentId => ({
        studentId,
        ...data[studentId]
      }));

      // Sort by student name in Arabic alphabetical order
      recordsArray.sort((a, b) => {
        const nameA = a.studentName || 'غير معروف';
        const nameB = b.studentName || 'غير معروف';
        return nameA.localeCompare(nameB, 'ar', { 
          numeric: true, 
          sensitivity: 'base' 
        });
      });

      recordsArray.forEach(record => {
        const row = document.createElement('tr');
        row.setAttribute('data-student-id', record.studentId);

        const nameCell = document.createElement('td');
        nameCell.textContent = record.studentName || 'غير معروف';

        const teamCell = document.createElement('td');
        teamCell.textContent = record.team || 'غير محدد';

        const statusCell = document.createElement('td');
        statusCell.className = 'status-cell';
        statusCell.innerHTML = `
          <span class="status-display ${record.status === 'present' ? 'status-present' : 'status-absent'}">
            ${record.status === 'present' ? 'حاضر ✅' : 'غائب ❌'}
          </span>
          <select class="status-select" style="display: none;" data-student-id="${record.studentId}">
            <option value="present" ${record.status === 'present' ? 'selected' : ''}>حاضر ✅</option>
            <option value="absent" ${record.status === 'absent' ? 'selected' : ''}>غائب ❌</option>
          </select>
        `;

        row.appendChild(nameCell);
        row.appendChild(teamCell);
        row.appendChild(statusCell);

        tbody.appendChild(row);
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      tbody.innerHTML = '<tr><td colspan="3">❌ حدث خطأ أثناء تحميل البيانات</td></tr>';
      editButton.style.display = 'none';
    }
  }

  window.onload = function() {
    loadAvailableDates();
  };
  document.querySelector('.menu-toggle').addEventListener('click', function () {
document.querySelector('.nav-right').classList.toggle('show');
});

function printAttendance() {
  const table = document.getElementById("historyTable");
  const selectedDate = document.getElementById("dateSelect").value || "تاريخ غير محدد";
  const periodSelect = document.getElementById("periodSelect");
  const selectedPeriod = periodSelect.style.display !== 'none' && periodSelect.value 
    ? (periodSelect.value === 'period1' ? 'الفترة الأولى' : 'الفترة الثانية')
    : '';
  
  // Clone the table to modify it for printing
  const tableClone = table.cloneNode(true);
  
  // If in edit mode, update cloned table to show selected values instead of dropdowns
  const isInEditMode = document.getElementById('historyTable').classList.contains('edit-mode');
  if (isInEditMode) {
    const clonedRows = tableClone.querySelectorAll('tbody tr');
    const originalRows = table.querySelectorAll('tbody tr');
    
    clonedRows.forEach((clonedRow, index) => {
      const originalRow = originalRows[index];
      if (originalRow && originalRow.cells.length === 3) {
        const statusCell = clonedRow.cells[2];
        const originalStatusCell = originalRow.cells[2];
        const statusSelect = originalStatusCell.querySelector('.status-select');
        
        if (statusSelect) {
          const selectedValue = statusSelect.value;
          const statusText = selectedValue === 'present' ? 'حاضر ✅' : 'غائب ❌';
          statusCell.textContent = statusText;
        }
      }
    });
  }
  
  const printContents = tableClone.outerHTML;
  
  const printWindow = window.open("", "", "height=600,width=800");
  printWindow.document.write("<html><head><title>سجل الحضور</title>");
  printWindow.document.write("<style>");
  printWindow.document.write("body { font-family: Arial; direction: rtl; padding: 20px; }");
  printWindow.document.write("table { width: 100%; border-collapse: collapse; margin-top: 20px; }");
  printWindow.document.write("th, td { border: 1px solid black; padding: 10px; text-align: center; }");
  printWindow.document.write("h2, h4 { margin: 0; }");
  printWindow.document.write(".status-select { display: none; }"); // Hide any select elements
  printWindow.document.write("</style>");
  printWindow.document.write("</head><body>");
  printWindow.document.write("<h2>سجل الحضور</h2>");
  printWindow.document.write(`<h4>تاريخ يوم: ${selectedDate}</h4>`);
  if (selectedPeriod) {
    printWindow.document.write(`<h4>الفترة: ${selectedPeriod}</h4>`);
  }
  printWindow.document.write(printContents);
  printWindow.document.write("</body></html>");
  printWindow.document.close();
  printWindow.print();
}

function filterAttendanceHistory() {
const input = document.getElementById("searchInput").value.toLowerCase().trim();
const rows = document.querySelectorAll("#attendanceBody tr");

rows.forEach(row => {
  // Skip empty state rows
  if (row.cells.length < 3) {
    return;
  }

  const name = row.cells[0]?.textContent.toLowerCase() || "";
  const team = row.cells[1]?.textContent.toLowerCase() || "";
  
  // Get status from both display span and select (for edit mode)
  const statusCell = row.cells[2];
  const statusDisplay = statusCell.querySelector('.status-display')?.textContent.toLowerCase() || "";
  const statusSelect = statusCell.querySelector('.status-select')?.selectedOptions[0]?.textContent.toLowerCase() || "";
  const status = (statusDisplay + " " + statusSelect).toLowerCase();

  // Check if input matches name, team, or status
  // Support searching for: حاضر, غائب, present, absent
  const matchesSearch = name.includes(input) || 
                        team.includes(input) || 
                        status.includes(input) ||
                        (input.includes('حاضر') && status.includes('حاضر')) ||
                        (input.includes('غائب') && status.includes('غائب'));

  if (matchesSearch) {
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

const periodSelect = document.getElementById("periodSelect");
const selectedPeriod = periodSelect.style.display !== 'none' && periodSelect.value 
  ? (periodSelect.value === 'period1' ? 'الفترة الأولى' : 'الفترة الثانية')
  : '';

let csvContent = `"${RLM}الاسم","${RLM}المجموعة","${RLM}الحالة","${RLM}التاريخ"`;
if (selectedPeriod) {
  csvContent = `"${RLM}الاسم","${RLM}المجموعة","${RLM}الحالة","${RLM}الفترة","${RLM}التاريخ"\n`;
} else {
  csvContent += "\n";
}

const rows = table.querySelectorAll("tbody tr");
rows.forEach(row => {
  const cols = row.querySelectorAll("td");
  if (cols.length === 3) {
    let name = cols[0].textContent.trim().replace(/✅|❌/g, "");
    let team = cols[1].textContent.trim();
    
    // Get status - check if in edit mode (select visible) or normal mode (display visible)
    let status = "";
    const statusCell = cols[2];
    const statusSelect = statusCell.querySelector('.status-select');
    const statusDisplay = statusCell.querySelector('.status-display');
    
    // If in edit mode (select is visible), get value from select
    if (statusSelect && statusSelect.style.display !== 'none') {
      status = statusSelect.value === 'present' ? "حاضر" : "غائب";
    } 
    // Otherwise get from display text
    else if (statusDisplay) {
      status = statusDisplay.textContent.includes("حاضر") ? "حاضر" : "غائب";
    }
    // Fallback to cell text content
    else {
      status = cols[2].textContent.includes("حاضر") ? "حاضر" : "غائب";
    }

    if (selectedPeriod) {
      csvContent += `"${RLM + name}","${RLM + team}","${RLM + status}","${RLM + selectedPeriod}","${RLM + formattedDate}"\n`;
    } else {
      csvContent += `"${RLM + name}","${RLM + team}","${RLM + status}","${RLM + formattedDate}"\n`;
    }
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

  const svgCross = `
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

  `;

 const isMobile = window.innerWidth < 768;
const crossCount = isMobile ? 10 : 25;

for (let i = 0; i < crossCount; i++) {
  const cross = document.createElement('div');
  cross.className = 'cross';
  cross.innerHTML = svgCross;
  cross.style.left = Math.random() * 100 + 'vw';
  cross.style.top = Math.random() * 100 + 'vh';
  cross.style.animationDuration = (12 + Math.random() * 11) + 's';
  container.appendChild(cross);
}

// Edit attendance functionality
let isEditMode = false;
window.attendanceChanges = {};

function toggleEditMode() {
  const editButton = document.getElementById('editButton');
  const saveButton = document.getElementById('saveChangesBtn');
  const table = document.getElementById('historyTable');
  
  isEditMode = !isEditMode;
  
  if (isEditMode) {
    // Enter edit mode
    editButton.textContent = '❌ إلغاء التعديل';
    editButton.className = 'btn-edit editing';
    table.classList.add('edit-mode');
    saveButton.classList.add('show');
    
    // Show select dropdowns, hide text
    document.querySelectorAll('.status-display').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.status-select').forEach(el => el.style.display = 'block');
    
    // Reset changes
    window.attendanceChanges = {};
    
    // Add change listeners
    document.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', function() {
        const studentId = this.getAttribute('data-student-id');
        const newStatus = this.value;
        const originalStatus = window.currentAttendanceData[studentId].status;
        
        if (newStatus !== originalStatus) {
          window.attendanceChanges[studentId] = {
            ...window.currentAttendanceData[studentId],
            status: newStatus
          };
        } else {
          delete window.attendanceChanges[studentId];
        }
        
        // Update save button state
        const hasChanges = Object.keys(window.attendanceChanges).length > 0;
        saveButton.style.opacity = hasChanges ? '1' : '0.6';
        saveButton.disabled = !hasChanges;
      });
    });
    
  } else {
    // Exit edit mode
    exitEditMode();
  }
}

function exitEditMode() {
  const editButton = document.getElementById('editButton');
  const saveButton = document.getElementById('saveChangesBtn');
  const table = document.getElementById('historyTable');
  
  isEditMode = false;
  editButton.textContent = '✏️ تعديل الحضور';
  editButton.className = 'btn-edit';
  table.classList.remove('edit-mode');
  saveButton.classList.remove('show');
  
  // Show text, hide select dropdowns
  document.querySelectorAll('.status-display').forEach(el => el.style.display = 'inline');
  document.querySelectorAll('.status-select').forEach(el => el.style.display = 'none');
  
  // Reset changes
  window.attendanceChanges = {};
}

async function saveAttendanceChanges() {
  if (Object.keys(window.attendanceChanges).length === 0) {
    alert('لا توجد تغييرات للحفظ');
    return;
  }
  
  const saveButton = document.getElementById('saveChangesBtn');
  const originalText = saveButton.textContent;
  
  try {
    saveButton.textContent = '⏳ جاري الحفظ...';
    saveButton.disabled = true;
    
    const updates = {};
    const basePath = window.currentPeriod 
      ? `attendance/${window.currentDate}/${window.currentPeriod}`
      : `attendance/${window.currentDate}`;
    
    Object.keys(window.attendanceChanges).forEach(studentId => {
      updates[`${basePath}/${studentId}`] = window.attendanceChanges[studentId];
    });
    
    await db.ref().update(updates);
    
    alert('✅ تم حفظ التعديلات بنجاح!');
    
    // Refresh the data
    await fetchAttendanceByDate();
    
    // Exit edit mode
    exitEditMode();
    
  } catch (error) {
    console.error('Error saving changes:', error);
    alert('❌ حدث خطأ أثناء حفظ التعديلات. يرجى المحاولة مرة أخرى.');
  } finally {
    saveButton.textContent = originalText;
    saveButton.disabled = false;
  }
}




