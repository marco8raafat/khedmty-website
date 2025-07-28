const users = JSON.parse(localStorage.getItem("users")) || {};
const currentEmail = localStorage.getItem("currentUser");

if (!currentEmail || !users[currentEmail]) {
  window.location.href = "login.html";
}

const userData = users[currentEmail];

document.getElementById("edit-name").value = userData.username;
document.getElementById("edit-email").value = userData.email;
document.getElementById("edit-phone").value = userData.phone;
document.getElementById("edit-group").value = userData.group;

document.getElementById("editForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const updatedUser = {
    username: document.getElementById("edit-name").value,
    email: userData.email, 
    phone: document.getElementById("edit-phone").value,
    group: document.getElementById("edit-group").value,
    role: userData.role,  
    password: userData.password 
  };

  users[currentEmail] = updatedUser;

  localStorage.setItem("users", JSON.stringify(users));

  window.location.href = "profilepage.html";
});
