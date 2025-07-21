document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const users = JSON.parse(localStorage.getItem("users")) || {};

  if (users[email]) {
    if (users[email].password === password) {
      localStorage.setItem("currentUser", email); 

      const role = users[email].role;
      if (role === "student") {
        window.location.href = "studentDashboard.html";
      } else if (role === "servant") {
        window.location.href = "teacherDashboard.html";
      } else {
        window.location.href = "register.html";
      }

    } else {
      alert("كلمة المرور غير صحيحة.");
    }
  } else {
    alert("المستخدم غير موجود.");
  }
});
