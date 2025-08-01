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

    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // Show message function
    function showMessage(text, type) {
      const messageContainer = document.getElementById('messageContainer');
      messageContainer.innerHTML = `<div class="message ${type}">${text}</div>`;
      
      // Auto hide after 5 seconds
      setTimeout(() => {
        messageContainer.innerHTML = '';
      }, 5000);
    }

    // Authentication check function
    async function checkAuthentication() {
      const currentUser = sessionStorage.getItem("currentUser");
      
      if (!currentUser) {
        showMessage("يجب تسجيل الدخول أولاً للوصول إلى هذه الصفحة", "error");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
        return false;
      }

      // Verify user exists in Firebase
      const emailKey = currentUser.replace(/\./g, '_');
      try {
        const snapshot = await db.ref('users/' + emailKey).once('value');
        if (!snapshot.exists()) {
          showMessage("جلسة المستخدم غير صالحة. يرجى تسجيل الدخول مرة أخرى", "error");
          sessionStorage.removeItem("currentUser");
          setTimeout(() => {
            window.location.href = "login.html";
          }, 2000);
          return false;
        }
        
        const userData = snapshot.val();
        // Check if user is a servant (only servants can upload exams)
        if (userData.role !== "servant") {
          showMessage("غير مسموح لك بالوصول إلى هذه الصفحة. هذه الصفحة مخصصة للخدام فقط", "error");
          setTimeout(() => {
            window.location.href = userData.role === "student" ? "studentDashboard.html" : "index.html";
          }, 2000);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error("Error verifying user:", error);
        showMessage("حدث خطأ في التحقق من المستخدم. يرجى تسجيل الدخول مرة أخرى", "error");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
        return false;
      }
    }

    function logout() {
      if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        sessionStorage.removeItem("currentUser");
        window.location.href = "index.html";
      }
    }

    // Form submission handler
    document.getElementById("examForm").addEventListener("submit", function(e) {
      e.preventDefault();

      const examName = document.getElementById("examName").value.trim();
      const examLink = document.getElementById("examLink").value.trim();
      const currentUser = sessionStorage.getItem("currentUser");
      const submitBtn = document.getElementById("submitBtn");

      if (examName === "" || examLink === "") {
        showMessage("يرجى ملء جميع الحقول.", "error");
        return;
      }

      // Basic URL validation
      if (!examLink.startsWith('http://') && !examLink.startsWith('https://')) {
        showMessage("يرجى إدخال رابط صحيح يبدأ بـ http:// أو https://", "error");
        return;
      }

      if (!currentUser) {
        showMessage("يجب تسجيل الدخول أولاً.", "error");
        return;
      }

      // Show loading state
      submitBtn.classList.add('loading');
      submitBtn.textContent = 'جاري الرفع...';
      submitBtn.disabled = true;

      const emailKey = currentUser.replace(/\./g, '_');

      const newExamRef = firebase.database().ref("exams").push();
      newExamRef.set({
        name: examName,
        link: examLink,
        uploadedBy: emailKey,
        timestamp: Date.now()
      }).then(() => {
        showMessage("تم رفع الامتحان بنجاح!", "success");
        
        // Reset form
        document.getElementById("examForm").reset();
        
        // Redirect after success
        setTimeout(() => {
          window.location.href = "exam-list.html";
        }, 2000);
      }).catch((error) => {
        console.error("خطأ أثناء رفع الامتحان:", error);
        showMessage("حدث خطأ أثناء رفع الامتحان. حاول مرة أخرى.", "error");
      }).finally(() => {
        // Reset button state
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'رفع الامتحان';
        submitBtn.disabled = false;
      });
    });

    // Initialize page
    async function initializePage() {
      const isAuthenticated = await checkAuthentication();
      if (isAuthenticated) {
        console.log("User authenticated, ready to upload exams");
      }
    }

    // Hamburger menu functionality
    document.addEventListener('DOMContentLoaded', function() {
      const menuToggle = document.getElementById('menuToggle');
      const navLinks = document.getElementById('navLinks');
      const navLinkElements = document.querySelectorAll('.nav-link');

      // Toggle mobile menu
      menuToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('active');
        
        // Update aria-expanded for accessibility
        const isExpanded = navLinks.classList.contains('active');
        menuToggle.setAttribute('aria-expanded', isExpanded);
      });

      // Close mobile menu when clicking on a link
      navLinkElements.forEach(link => {
        link.addEventListener('click', function() {
          navLinks.classList.remove('active');
          menuToggle.classList.remove('active');
          menuToggle.setAttribute('aria-expanded', 'false');
        });
      });

      // Close menu when clicking outside
      document.addEventListener('click', function(event) {
        const isClickInsideNav = navLinks.contains(event.target) || menuToggle.contains(event.target);
        
        if (!isClickInsideNav && navLinks.classList.contains('active')) {
          navLinks.classList.remove('active');
          menuToggle.classList.remove('active');
          menuToggle.setAttribute('aria-expanded', 'false');
        }
      });

      // Close menu on window resize if screen becomes larger
      window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
          navLinks.classList.remove('active');
          menuToggle.classList.remove('active');
          menuToggle.setAttribute('aria-expanded', 'false');
        }
      });

      // Initialize the page
      initializePage();
    });