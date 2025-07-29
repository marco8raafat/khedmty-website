const users = JSON.parse(localStorage.getItem("users")) || {};
const currentEmail = localStorage.getItem("currentUser");

if (!currentEmail || !users[currentEmail]) {
  window.location.href = "login.html";
}

const emailKey = currentEmail.replace(/\./g, '_');

// Fetch user data from Firebase
database.ref("users/" + emailKey).once("value").then((snapshot) => {
  if (!snapshot.exists()) {
    window.location.href = "login.html";
    return;
  }

  const userData = snapshot.val();
  document.getElementById("username").textContent = userData.username;
  document.getElementById("email").textContent = "📧 البريد الإلكتروني: " + userData.email;
  document.getElementById("phone").textContent = "📞 رقم التليفون: " + userData.phone;
  document.getElementById("group").textContent = "👥 اسم المجموعة: " + userData.group;
  document.getElementById("role").textContent = "🎓 الدور: " + (userData.role === "student" ? "طالب" : "خادم");
  
  // Set back button based on user role
  const backBtn = document.getElementById("backBtn");
  if (userData.role === "student") {
    backBtn.href = "studentDashboard.html"; 
  } else if (userData.role === "servant") {
    backBtn.href = "teacherDashboard.html"; 
  } else {
    backBtn.href = "index.html";
  }
}).catch((error) => {
  console.error("Firebase error:", error);
  window.location.href = "login.html";
});
