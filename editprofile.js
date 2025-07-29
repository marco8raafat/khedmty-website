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

// Fetch user data from Firebase and populate form
database.ref("users/" + emailKey).once("value").then((snapshot) => {
  if (!snapshot.exists()) {
    window.location.href = "login.html";
    return;
  }

  const userData = snapshot.val();
  document.getElementById("edit-name").value = userData.username;
  document.getElementById("edit-email").value = userData.email;
  document.getElementById("edit-phone").value = userData.phone;
  document.getElementById("edit-group").value = userData.group;
}).catch((error) => {
  console.error("Firebase error:", error);
  window.location.href = "login.html";
});

document.getElementById("editForm").addEventListener("submit", function(e) {
  e.preventDefault();

  // Get current user data first, then update
  database.ref("users/" + emailKey).once("value").then((snapshot) => {
    if (!snapshot.exists()) {
      window.location.href = "login.html";
      return;
    }

    const userData = snapshot.val();
    
    const updatedUser = {
      username: document.getElementById("edit-name").value,
      email: userData.email, 
      phone: document.getElementById("edit-phone").value,
      group: document.getElementById("edit-group").value,
      role: userData.role,  
      password: userData.password 
    };

    // Update user data in Firebase
    database.ref("users/" + emailKey).set(updatedUser).then(() => {
      alert("تم تحديث البيانات بنجاح!");
      window.location.href = "profilepage.html";
    }).catch((error) => {
      console.error("Firebase error:", error);
      alert("حدث خطأ أثناء تحديث البيانات.");
    });
  });
});
