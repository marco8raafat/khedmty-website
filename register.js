document.getElementById("registerForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const phone = document.getElementById("phone").value;
  const group = document.getElementById("group").value;
  const selectedRole = document.querySelector('input[name="role"]:checked').value;

  const users = JSON.parse(localStorage.getItem("users")) || {};

  if (users[email]) {
    alert("هذا البريد مسجل بالفعل.");
    return;
  }

  users[email] = {
  name: name,
  phone: phone,
  group: group,
  password: password,
  role: selectedRole, 
};

  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("currentUser", email);

  window.location.href = "login.html";
});
