const firebaseConfig = {
      apiKey: "AIzaSyDwcSo_bhqO5svMl3kAL8N1c91nvEZ_sac",
      authDomain: "edad-5odam.firebaseapp.com",
      databaseURL: "https://edad-5odam-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "edad-5odam",
      storageBucket: "edad-5odam.appspot.com",
      messagingSenderId: "679576633778",
      appId: "1:679576633778:web:566e6aaef9b72f71a824ab"
    };
    
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
document.addEventListener('DOMContentLoaded', () => {
  // Check user authentication status and update navigation
  updateNavigationBasedOnAuth();
  
  // Verify key non-bot elements
  const navLinks = document.querySelectorAll('.nav-right .nav-link');

  const sections = document.querySelectorAll('section');
  const header = document.querySelector('header');

  // Debugging: Log element presence
  console.log('Element check:', {
    navLinks: navLinks.length,

    sections: sections.length,
    header: !!header
  });




  // Dynamic section animations
  if (sections.length && header) {
    // Fade-in effect for header and sections
    header.style.opacity = '0';
    header.style.transform = 'translateY(20px)';
    sections.forEach(section => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(20px)';
    });

    setTimeout(() => {
      header.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      header.style.opacity = '1';
      header.style.transform = 'translateY(0)';
      console.log('Header animated');

      sections.forEach((section, index) => {
        setTimeout(() => {
          section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          section.style.opacity = '1';
          section.style.transform = 'translateY(0)';
          console.log(`Section ${index + 1} animated`);
        }, (index + 1) * 200); // Staggered animation
      });
    }, 100);
  } else {
    console.warn('Sections or header not found for animation');
  }

  // Responsive adjustments for non-bot elements
  function handleResize() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      // Adjust buttons for touch-friendliness
      const buttons = document.querySelectorAll('.btn');
      buttons.forEach(btn => {
        btn.style.padding = '8px 16px';
        btn.style.fontSize = '0.9em';
        btn.style.minWidth = '120px'; // Ensure touch-friendly size
      });
      // Adjust section padding
      sections.forEach(section => {
        section.style.padding = '16px';
        section.style.marginBottom = '24px';
      });
      // Adjust header padding
      if (header) {
        header.style.padding = '24px 16px 16px';
      }
      console.log('Non-bot elements adjusted for mobile');
    } else {
      // Revert to desktop styles
      const buttons = document.querySelectorAll('.btn');
      buttons.forEach(btn => {
        btn.style.padding = '12px 24px';
        btn.style.fontSize = '1em';
        btn.style.minWidth = 'auto';
      });
      sections.forEach(section => {
        section.style.padding = '20px';
        section.style.marginBottom = '40px';
      });
      if (header) {
        header.style.padding = '40px 20px 20px';
      }
    }
  }

  // Run on load and resize
  handleResize();
  window.addEventListener('resize', handleResize);
  console.log('Initial window width:', window.innerWidth);
});

// Function to update navigation based on authentication status
function updateNavigationBasedOnAuth() {
  const currentUser = verifySecureSession();
  const navRight = document.querySelector('.nav-right');
  
  if (!navRight) {
    console.warn('Navigation container not found');
    return;
  }

  if (currentUser) {
    // User is logged in - show dashboard, logout and hide login/register
    console.log('User is logged in:', currentUser);
    
    // Get user data from Firebase to determine role
    getUserRole(currentUser).then(userRole => {
      // Find existing navigation links
      const loginLink = navRight.querySelector('a[href="login.html"]');
      const registerLink = navRight.querySelector('a[href="register.html"]');
      
      // Check if dashboard link already exists
      let dashboardLink = navRight.querySelector('a[data-dashboard="true"]');
      
      if (!dashboardLink && loginLink) {
        // Create dashboard link before login link
        dashboardLink = document.createElement('a');
        dashboardLink.className = 'nav-link';
        dashboardLink.setAttribute('data-dashboard', 'true');
        dashboardLink.textContent = 'لوحة التحكم';
        
        // Set dashboard URL based on user role
        if (userRole === 'student') {
          dashboardLink.href = 'studentDashboard.html';
        } else if (userRole === 'servant') {
          dashboardLink.href = 'teacherDashboard.html';
        } else {
          dashboardLink.href = 'index.html'; // fallback
        }
        
        // Insert dashboard link before login link
        navRight.insertBefore(dashboardLink, loginLink);
      }
      
      if (loginLink) {
        // Replace login link with logout
        loginLink.href = 'javascript:void(0)';
        loginLink.textContent = 'تسجيل الخروج';
        loginLink.onclick = function(e) {
          e.preventDefault();
          logout();
        };
      }
      
      if (registerLink) {
        // Hide register link for logged in users
        registerLink.style.display = 'none';
      }
    }).catch(error => {
      console.error('Error getting user role:', error);
      // Fallback: still show logout without dashboard
      const loginLink = navRight.querySelector('a[href="login.html"]');
      if (loginLink) {
        loginLink.href = 'javascript:void(0)';
        loginLink.textContent = 'تسجيل الخروج';
        loginLink.onclick = function(e) {
          e.preventDefault();
          logout();
        };
      }
    });
    
  } else {
    // User is not logged in - show login and register links, hide dashboard
    console.log('User is not logged in');
    
    // Remove dashboard link
    const dashboardLink = navRight.querySelector('a[data-dashboard="true"]');
    if (dashboardLink) {
      dashboardLink.remove();
    }
    
    // Find logout link and revert to login
    const logoutLink = navRight.querySelector('a[onclick*="logout"]');
    if (logoutLink) {
      logoutLink.href = 'login.html';
      logoutLink.textContent = 'تسجيل الدخول';
      logoutLink.onclick = null;
    }
    
    // Show register link
    const registerLink = navRight.querySelector('a[href="register.html"]');
    if (registerLink) {
      registerLink.style.display = '';
    }
  }
}

// Function to get user role from Firebase
async function getUserRole(email) {
  // Check if Firebase is available
  if (typeof firebase === 'undefined' || !firebase.database) {
    console.warn('Firebase not available for role check');
    return 'student'; // Default fallback
  }
  
  try {
    const snapshot = await firebase.database().ref("users/" + email.replace(/\./g, "_")).once('value');
    const userData = snapshot.val();
    
    if (userData && userData.role) {
      console.log('User role:', userData.role);
      return userData.role;
    } else {
      console.warn('User role not found, defaulting to student');
      return 'student'; // Default fallback
    }
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'student'; // Default fallback
  }
}

// Logout function
function logout() {
  if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
    clearSession();
    console.log('User logged out');
    
    // Remove dashboard link immediately
    const navRight = document.querySelector('.nav-right');
    const dashboardLink = navRight?.querySelector('a[data-dashboard="true"]');
    if (dashboardLink) {
      dashboardLink.remove();
    }
    
    // Update navigation immediately
    updateNavigationBasedOnAuth();
    
    // Optionally redirect to home page or refresh
    window.location.reload();
  }
}