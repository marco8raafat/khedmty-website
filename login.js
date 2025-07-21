document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const users = JSON.parse(localStorage.getItem("users")) || {};

  if (users[email]) {
    if (users[email].password === password) {
      localStorage.setItem("currentUser", email); 
      window.location.href = "profilepage.html";
    } else {
      alert("كلمة المرور غير صحيحة.");
    }
  } else {
    alert("المستخدم غير موجود.");
  }
});
