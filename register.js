document.getElementById("registerForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const phone = document.getElementById("phone").value;
  const group = document.getElementById("group").value;
  const selectedRole = document.querySelector('input[name="role"]:checked').value;

  const data = {
    username,
    email,
    password,
    phone,
    group,
    role: selectedRole
  };

  fetch("https://script.google.com/macros/s/AKfycbxHDaSFGPM8PV9qyZxpo94AVYsvSf6C24bg3I3mHJEUe-k9XYz91ppz61cSJdYN0PmOaA/exec", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(response => response.text())
  .then(result => {
    alert(result || "تم التسجيل بنجاح!");
    window.location.href = "login.html";
  })
  .catch(error => {
    console.error("Error:", error);
    alert("حدث خطأ أثناء التسجيل. حاول مرة أخرى.");
  });
});
