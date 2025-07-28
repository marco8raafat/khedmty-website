// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDwcSo_bhqO5svMl3kAL8N1c91nvEZ_sac",
  authDomain: "edad-5odam.firebaseapp.com",
  databaseURL: "https://edad-5odam-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "edad-5odam",
  storageBucket: "edad-5odam.appspot.com",
  messagingSenderId: "679576633778",
  appId: "1:679576633778:web:566e6aaef9b72f71a824ab",
  measurementId: "G-7WB1WPDLRH"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const currentEmail = sessionStorage.getItem("currentUser");

if (!currentEmail) {
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
