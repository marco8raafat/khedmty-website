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