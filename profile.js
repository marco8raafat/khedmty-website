// Enhanced Mobile Menu Toggle Function - matches teacherDashboard behavior
function toggleMobileMenu() {
  const navMenu = document.getElementById('navMenu');
  const navbar = document.querySelector('.navbar');
  const body = document.body;
  
  // Store current scroll position
  if (!body.classList.contains('menu-open')) {
    const scrollY = window.scrollY;
    body.style.top = `-${scrollY}px`;
  } else {
    // Restore scroll position when closing menu
    const scrollY = body.style.top;
    body.style.top = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
  }
  
  navMenu.classList.toggle('active');
  navbar.classList.toggle('menu-open');
  body.classList.toggle('menu-open');
}

// Close menu when clicking on nav links
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      // Don't prevent default navigation for dashboard link since it's dynamically set
      const navMenu = document.getElementById('navMenu');
      const navbar = document.querySelector('.navbar');
      const body = document.body;
      
      // Restore scroll position when closing menu
      if (body.classList.contains('menu-open')) {
        const scrollY = body.style.top;
        body.style.top = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
      
      navMenu.classList.remove('active');
      navbar.classList.remove('menu-open');
      body.classList.remove('menu-open');
    });
  });
});

// Handle screen resize - close menu if screen gets larger
window.addEventListener('resize', () => {
  const navMenu = document.getElementById('navMenu');
  const navbar = document.querySelector('.navbar');
  const body = document.body;
  
  if (window.innerWidth >= 768) {
    // Restore scroll position when closing menu due to resize
    if (body.classList.contains('menu-open')) {
      const scrollY = body.style.top;
      body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    
    navMenu.classList.remove('active');
    navbar.classList.remove('menu-open');
    body.classList.remove('menu-open');
  }
});

// Cross background animation
const container = document.querySelector('.cross-background');

const svgCross = `
<?xml version="1.0" encoding="iso-8859-1"?>
<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg"
	 viewBox="0 0 60 60" xml:space="preserve">
<path d="M52.247,19.665c-0.396,0-0.785,0.049-1.162,0.145c-0.403-2.214-2.347-3.897-4.675-3.897c-2.396,0-4.382,1.781-4.707,4.087
	H35v-4.811c2.077-0.517,3.594-2.381,3.594-4.599c0-2.188-1.486-4.036-3.503-4.586c0.11-0.404,0.167-0.824,0.167-1.251
	C35.258,2.132,33.126,0,30.506,0c-2.621,0-4.753,2.132-4.753,4.753c0,0.395,0.049,0.785,0.145,1.162C23.684,6.318,22,8.262,22,10.59
	c0,2.364,1.735,4.331,4,4.693V20h-7.812c-0.516-2.077-2.38-3.594-4.599-3.594c-2.188,0-4.035,1.486-4.585,3.503
	c-0.405-0.11-0.825-0.167-1.252-0.167C5.132,19.742,3,21.874,3,24.495s2.132,4.753,4.753,4.753c0.396,0,0.785-0.049,1.162-0.145
	C9.318,31.316,11.262,33,13.59,33c2.365,0,4.332-1.736,4.693-4H26v15.84c-2.026,0.551-3.506,2.405-3.506,4.569
	c0,2.188,1.486,4.036,3.502,4.586c-0.11,0.405-0.167,0.825-0.167,1.252c0,2.621,2.132,4.752,4.753,4.752s4.753-2.132,4.753-4.752
	c0-0.395-0.049-0.785-0.146-1.162c2.215-0.404,3.898-2.347,3.898-4.676c0-2.395-1.781-4.382-4.088-4.706V29h6.84
	c0.552,2.027,2.406,3.506,4.57,3.506c2.188,0,4.035-1.486,4.585-3.503c0.405,0.11,0.825,0.167,1.252,0.167c2.621,0,4.753-2.132,4.753-4.752S54.868,19.665,52.247,19.665z"/>
</svg>
`;

const isMobile = window.innerWidth < 768;
const crossCount = isMobile ? 10 : 25;

for (let i = 0; i < crossCount; i++) {
  const cross = document.createElement('div');
  cross.className = 'cross';
  cross.innerHTML = svgCross;
  cross.style.left = Math.random() * 100 + 'vw';
  cross.style.top = Math.random() * 100 + 'vh';
  cross.style.animationDuration = (12 + Math.random() * 11) + 's';
  container.appendChild(cross);
}

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

// Verify session and get current user email
const currentEmail = requireAuthentication();

// Show loading overlay
const loadingOverlay = document.getElementById('loadingOverlay');
if (loadingOverlay) loadingOverlay.classList.remove('hidden');

const emailKey = currentEmail.replace(/\./g, '_');

// Fetch user data from Firebase
database.ref("users/" + emailKey).once("value").then((snapshot) => {
  if (!snapshot.exists()) {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
    window.location.href = "login.html";
    return;
  }

  const userData = snapshot.val();
  document.getElementById("username").textContent = userData.username;
  document.getElementById("email").textContent = "📧 البريد الإلكتروني: " + userData.email;
  document.getElementById("phone").textContent = "📞 رقم التليفون: " + userData.phone;
  document.getElementById("group").textContent = "👥 اسم المجموعة: " + userData.group;
  document.getElementById("role").textContent = "🎓 الدور: " + (userData.role === "student" ? "طالب" : "خادم");
  
  // Set up dashboard link based on user role
  const dashboardLink = document.getElementById("dashboardLink");
  if (userData.role === "student") {
    dashboardLink.href = "studentDashboard.html";
  } else if (userData.role === "teacher" || userData.role === "servant") {
    dashboardLink.href = "teacherDashboard.html";
  } else {
    // Default to student dashboard if role is unclear
    dashboardLink.href = "studentDashboard.html";
  }

  // Hide loading overlay on success
  if (loadingOverlay) loadingOverlay.classList.add('hidden');
  
}).catch((error) => {
  console.error("Firebase error:", error);
  if (loadingOverlay) loadingOverlay.classList.add('hidden');
  window.location.href = "login.html";
});

// Add event listeners for edit and logout buttons
document.getElementById("editBtn").addEventListener("click", function() {
  window.location.href = "editprofile.html";
});

document.getElementById("logoutBtn").addEventListener("click", function() {
  // Clear all session data
  clearSession();
  
  // Show confirmation message
  alert("تم تسجيل الخروج بنجاح!");
  
  // Redirect to login page
  window.location.href = "login.html";
});