// Firebase configuration (same as in register.js)
const firebaseConfig = {
  apiKey: "AIzaSyDwcSo_bhqO5svMl3kAL8N1c91nvEZ_sac",
  authDomain: "edad-5odam.firebaseapp.com",
  databaseURL: "https://edad-5odam-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "edad-5odam",
  storageBucket: "edad-5odam.appspot.com", // ✅ corrected from .firebasestorage.app
  messagingSenderId: "679576633778",
  appId: "1:679576633778:web:566e6aaef9b72f71a824ab",
  measurementId: "G-7WB1WPDLRH"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Login form handler
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const emailKey = email.replace(/\./g, '_'); // Firebase-safe key

  database.ref("users/" + emailKey).once("value", function(snapshot) {
    if (snapshot.exists()) {
      const userData = snapshot.val();

      if (userData.password === password) {
        // Save session
        sessionStorage.setItem("currentUser", email);

        // Redirect based on role
        if (userData.role === "student") {
          window.location.href = "studentDashboard.html";
        } else if (userData.role === "servant") {
          window.location.href = "teacherDashboard.html";
        } else {
          alert("تم تسجيل الدخول، ولكن لم يتم تحديد دور.");
        }

      } else {
        alert("كلمة المرور غير صحيحة.");
      }

    } else {
      alert("المستخدم غير موجود.");
    }
  });
});
