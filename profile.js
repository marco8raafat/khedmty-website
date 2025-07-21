const users = JSON.parse(localStorage.getItem("users")) || {};
const currentEmail = localStorage.getItem("currentUser");

if (!currentEmail || !users[currentEmail]) {
  window.location.href = "login.html";
}

const userData = users[currentEmail];

document.getElementById("username").textContent = userData.username;
document.getElementById("email").textContent = "📧 البريد الإلكتروني: " + userData.email;
document.getElementById("phone").textContent = "📞 رقم التليفون: " + userData.phone;
document.getElementById("group").textContent = "👥 اسم المجموعة: " + userData.group;
document.getElementById("role").textContent = "🎓 الدور: " + (userData.role === "student" ? "طالب" : "خادم");

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
});

document.getElementById("editBtn").addEventListener("click", () => {
  window.location.href = "editprofile.html";
});

const backBtn = document.getElementById("backBtn");

if (userData.role === "student") {
  backBtn.href = "studentDashboard.html"; 
} else if (userData.role === "servant") {
  backBtn.href = "teacherDashboard.html"; 
} else {
  backBtn.href = "index.html";
}
