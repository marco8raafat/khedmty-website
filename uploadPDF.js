// Smart Cache Management System for PDF Upload
class PDFUploadCache {
  constructor() {
    this.cache = new Map();
    this.listeners = new Map();
    this.lastUpdated = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache expiry
  }

  // Check if cached data is still valid
  isCacheValid(path) {
    const lastUpdate = this.lastUpdated.get(path);
    if (!lastUpdate) return false;
    return (Date.now() - lastUpdate) < this.cacheExpiry;
  }

  // Get data from cache or Firebase with real-time listener
  async getData(path, callback) {
    // If we have valid cached data, use it immediately
    if (this.isCacheValid(path) && this.cache.has(path)) {
      console.log(`[PDF Upload] Using cached data for ${path}`);
      if (callback) callback(this.cache.get(path));
      return this.cache.get(path);
    }

    // Set up real-time listener if not already exists
    if (!this.listeners.has(path)) {
      console.log(`[PDF Upload] Setting up real-time listener for ${path}`);
      const listener = firebase.database().ref(path).on('value', (snapshot) => {
        const data = snapshot.val() || {};
        this.cache.set(path, data);
        this.lastUpdated.set(path, Date.now());
        console.log(`[PDF Upload] Data updated for ${path}:`, Object.keys(data).length, 'PDFs');
        if (callback) callback(data);
      });
      this.listeners.set(path, listener);
    }

    // Return cached data if available, otherwise return empty object
    return this.cache.get(path) || {};
  }

  // Clean up listeners when not needed
  cleanup() {
    this.listeners.forEach((listener, path) => {
      firebase.database().ref(path).off('value', listener);
    });
    this.listeners.clear();
    this.cache.clear();
    this.lastUpdated.clear();
  }
}

// Initialize cache instance
const pdfUploadCache = new PDFUploadCache();

document.addEventListener('DOMContentLoaded', () => {
  // Verify elements exist
  const uploadForm = document.getElementById('uploadForm');
  const titleInput = document.getElementById('title');
  const subjectInput = document.getElementById('subject');
  const linkInput = document.getElementById('pdfLink');
  const messageDiv = document.getElementById('message');
  const pdfList = document.getElementById('pdfList');

  // Log element status for debugging
  if (!uploadForm || !titleInput || !subjectInput || !linkInput || !messageDiv || !pdfList) {
    console.error('Required elements missing:', {
      uploadForm: !!uploadForm,
      titleInput: !!titleInput,
      subjectInput: !!subjectInput,
      linkInput: !!linkInput,
      messageDiv: !!messageDiv,
      pdfList: !!pdfList
    });
    if (!subjectInput) {
      console.error('Specifically, subject input is missing. Check HTML for id="subject"');
    }
    if (!titleInput) {
      console.error('Specifically, title input is missing. Check HTML for id="title"');
    }
    if (!linkInput) {
      console.error('Specifically, link input is missing. Check HTML for id="pdfLink"');
    }
    // Continue with partial functionality if possible
  }

  // Hide PDF list on this page
  if (pdfList) {
    pdfList.style.display = 'none';
    console.log('PDF list hidden');
  } else {
    console.warn('pdfList element not found, cannot hide PDF list');
  }

  if (uploadForm && titleInput && subjectInput && linkInput && messageDiv) {
    uploadForm.addEventListener('submit', (e) => {
      e.preventDefault(); // Prevent form from submitting to a server
      console.log('Form submission intercepted');

      const title = titleInput.value.trim();
      const subject = subjectInput.value.trim();
      const link = linkInput.value.trim();

      // Validate inputs
      if (!title || !subject || !link) {
        showMessage('يرجى إدخال عنوان وموضوع ورابط الملف', 'error');
        console.log('Validation failed: Missing title, subject, or link');
        return;
      }

      // Validate URL format
      try {
        new URL(link);
      } catch (error) {
        showMessage('يرجى إدخال رابط صحيح', 'error');
        console.log('Validation failed: Invalid URL format');
        return;
      }

      try {
        // Get current user email for Firebase path
        const currentUser = sessionStorage.getItem("currentUser");
        if (!currentUser) {
          showMessage('خطأ: لم يتم العثور على بيانات المستخدم', 'error');
          return;
        }

        // Create new PDF data
        const newPDF = {
          id: Date.now(),
          title: title,
          subject: subject,
          link: link,
          uploadedBy: currentUser,
          uploadedAt: new Date().toISOString()
        };

        // Save to Firebase
        showMessage('جاري رفع الرابط...', 'info');
        
        // Use Firebase database reference
        if (typeof firebase !== 'undefined' && firebase.database) {
          const db = firebase.database();
          
          // Save to Firebase with cache integration
          db.ref('educational-resources').push(newPDF)
            .then(() => {
              showMessage('تم رفع الرابط بنجاح', 'success');
              console.log('[PDF Upload] PDF link saved to Firebase:', newPDF);
              uploadForm.reset(); // Reset form after successful save
              
              // The real-time listener will automatically update any PDF lists
            })
            .catch((error) => {
              showMessage('خطأ في رفع الرابط إلى قاعدة البيانات', 'error');
              console.error('[PDF Upload] Firebase error:', error);
            });
        } else {
          showMessage('خطأ: قاعدة البيانات غير متاحة', 'error');
          console.error('Firebase not initialized');
        }
      } catch (error) {
        showMessage('حدث خطأ أثناء معالجة الرابط', 'error');
        console.error('Error processing link:', error);
      }
    });
  } else {
    console.error('Form functionality disabled due to missing elements');
    showMessage('خطأ: النموذج غير متاح بسبب عناصر مفقودة', 'error');
  }

  function showMessage(text, type) {
    if (messageDiv) {
      messageDiv.textContent = text;
      messageDiv.className = `message ${type}`; // Preserve 'message' class
      messageDiv.style.display = 'block';
      console.log(`[PDF Upload] Message displayed: ${text} (${type})`);
      
      // Only auto-hide success and error messages, keep info messages visible
      if (type !== 'info') {
        setTimeout(() => {
          messageDiv.style.display = 'none';
        }, 3000);
      }
    } else {
      console.error('[PDF Upload] Cannot display message: messageDiv not found');
    }
  }
});

// Clean up listeners when page is unloaded
window.addEventListener('beforeunload', function() {
  console.log('[PDF Upload] Cleaning up Firebase listeners...');
  pdfUploadCache.cleanup();
});

// Performance monitoring
window.addEventListener('load', function() {
  console.log('[PDF Upload] Page loaded, PDF upload cache system active');
});

const container = document.querySelector('.cross-background');

  const svgCross = `
  <?xml version="1.0" encoding="iso-8859-1"?>
<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<!-- License: CC0. Made by SVG Repo: https://www.svgrepo.com/svg/90761/cross -->
<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 60 60" style="enable-background:new 0 0 60 60;" xml:space="preserve">
<path d="M52.247,19.665c-0.396,0-0.785,0.049-1.162,0.145c-0.403-2.214-2.347-3.897-4.675-3.897c-2.396,0-4.382,1.781-4.707,4.087
	H35v-4.811c2.077-0.517,3.594-2.381,3.594-4.599c0-2.188-1.486-4.036-3.503-4.586c0.11-0.404,0.167-0.824,0.167-1.251
	C35.258,2.132,33.126,0,30.506,0c-2.621,0-4.753,2.132-4.753,4.753c0,0.395,0.049,0.785,0.145,1.162C23.684,6.318,22,8.262,22,10.59
	c0,2.364,1.735,4.331,4,4.693V20h-7.812c-0.516-2.077-2.38-3.594-4.599-3.594c-2.188,0-4.035,1.486-4.585,3.503
	c-0.405-0.11-0.825-0.167-1.252-0.167C5.132,19.742,3,21.874,3,24.495s2.132,4.753,4.753,4.753c0.396,0,0.785-0.049,1.162-0.145
	C9.318,31.316,11.262,33,13.59,33c2.365,0,4.332-1.736,4.693-4H26v15.84c-2.026,0.551-3.506,2.405-3.506,4.569
	c0,2.188,1.486,4.036,3.502,4.586c-0.11,0.405-0.167,0.825-0.167,1.252c0,2.621,2.132,4.752,4.753,4.752s4.753-2.132,4.753-4.752
	c0-0.395-0.049-0.785-0.146-1.162c2.215-0.404,3.898-2.347,3.898-4.676c0-2.395-1.781-4.382-4.088-4.706V29h6.84
	c0.552,2.027,2.406,3.506,4.57,3.506c2.188,0,4.035-1.486,4.585-3.503c0.405,0.11,0.825,0.167,1.252,0.167
	c2.621,0,4.753-2.132,4.753-4.752S54.868,19.665,52.247,19.665z"/>
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

  // Check if user is authenticated and has servant role
  async function checkAuthentication() {
    const currentEmail = sessionStorage.getItem("currentUser");
    console.log("Current email from session:", currentEmail);
    
    if (!currentEmail) {
      alert("يرجى تسجيل الدخول أولاً للوصول إلى هذه الصفحة");
      window.location.href = "login.html";
      return false;
    }

    const emailKey = currentEmail.replace(/[.#$\[\]]/g, '_');
    
    try {
      const userSnapshot = await db.ref(`users/${emailKey}`).once('value');
      const userData = userSnapshot.val();
      
      if (!userData || Object.keys(userData).length === 0) {
        console.log("No user data found, redirecting to login");
        alert("لم يتم العثور على بيانات المستخدم. يرجى تسجيل الدخول مرة أخرى");
        window.location.href = "login.html";
        return false;
      }

      // Check if user is a servant/teacher
      if (!checkIfServant(userData)) {
        console.log("User is not a servant, access denied");
        alert("غير مسموح لك بالوصول إلى هذه الصفحة. هذه الصفحة مخصصة للخدام فقط");
        window.location.href = "login.html";
        return false;
      }

      console.log("User authenticated successfully as servant");
      return true;
      
    } catch (error) {
      console.error("Error checking authentication:", error);
      alert("حدث خطأ أثناء التحقق من الصلاحيات. يرجى المحاولة مرة أخرى");
      window.location.href = "login.html";
      return false;
    }
  }

  function checkIfServant(userData) {
    if (!userData || !userData.role) {
      console.log("No role found in user data");
      return false;
    }
    
    const userRole = userData.role.toLowerCase();
    const allowedRoles = ['teacher', 'servant', 'admin', 'خادم', 'معلم', 'مدير'];
    
    console.log("User role:", userRole);
    console.log("Checking against allowed roles:", allowedRoles);
    
    const isServant = allowedRoles.includes(userRole);
    console.log("Is servant:", isServant);
    
    return isServant;
  }