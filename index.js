document.addEventListener('DOMContentLoaded', () => {
  // Check user authentication status and update navigation
  updateNavigationBasedOnAuth();
  
  // Verify key non-bot elements
  const navLinks = document.querySelectorAll('.nav-right .nav-link');
  const addAlertBtn = document.querySelector('.btn[href="#add-alert"]');
  const viewAlertsBtn = document.querySelector('.btn[href="#view-alerts"]');
  const sections = document.querySelectorAll('section');
  const header = document.querySelector('header');

  // Debugging: Log element presence
  console.log('Element check:', {
    navLinks: navLinks.length,
    addAlertBtn: !!addAlertBtn,
    viewAlertsBtn: !!viewAlertsBtn,
    sections: sections.length,
    header: !!header
  });


  // Button handling for alerts
  if (addAlertBtn) {
    addAlertBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Placeholder path (update when available)
      const targetPage = './addAlert.html';
      console.log('Add Alert button clicked');
      window.location.href = targetPage;
      // Fallback if page doesn't exist
      if (!targetPage) {
        alert('ميزة إضافة تنبيه غير متاحة حاليًا');
        console.warn('Add Alert page not defined');
      }
    });
  } else {
    console.warn('Add Alert button not found');
  }

  if (viewAlertsBtn) {
    viewAlertsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Placeholder path (update when available)
      const targetPage = './listAlerts.html';
      console.log('View Alerts button clicked');
      window.location.href = targetPage;
      // Fallback if page doesn't exist
      if (!targetPage) {
        alert('ميزة عرض التنبيهات غير متاحة حاليًا');
        console.warn('View Alerts page not defined');
      }
    });
  } else {
    console.warn('View Alerts button not found');
  }

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
  const currentUser = sessionStorage.getItem("currentUser");
  const navRight = document.querySelector('.nav-right');
  
  if (!navRight) {
    console.warn('Navigation container not found');
    return;
  }

  if (currentUser) {
    // User is logged in - show logout and hide login/register
    console.log('User is logged in:', currentUser);
    
    // Find existing navigation links
    const loginLink = navRight.querySelector('a[href="login.html"]');
    const registerLink = navRight.querySelector('a[href="register.html"]');
    
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
    
  } else {
    // User is not logged in - show login and register links
    console.log('User is not logged in');
    
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

// Logout function
function logout() {
  if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
    sessionStorage.removeItem("currentUser");
    console.log('User logged out');
    
    // Update navigation immediately
    updateNavigationBasedOnAuth();
    
    // Optionally redirect to home page or refresh
    window.location.reload();
  }
}