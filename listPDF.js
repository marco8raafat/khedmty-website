// Smart Cache Management System for PDFs
class PDFCache {
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
      console.log(`[PDF System] Using cached data for ${path}`);
      if (callback) callback(this.cache.get(path));
      return this.cache.get(path);
    }

    // Set up real-time listener if not already exists
    if (!this.listeners.has(path)) {
      console.log(`[PDF System] Setting up real-time listener for ${path}`);
      const listener = firebase.database().ref(path).on('value', (snapshot) => {
        const data = snapshot.val() || {};
        this.cache.set(path, data);
        this.lastUpdated.set(path, Date.now());
        console.log(`[PDF System] Data updated for ${path}:`, Object.keys(data).length, 'PDFs');
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
const pdfCache = new PDFCache();

// Authentication and authorization functions
async function checkAuthentication() {
  const currentEmail = await requireAuthentication("login.html");
  console.log("Current email from session:", currentEmail);
  
  if (!currentEmail) {
    alert("يرجى تسجيل الدخول أولاً للوصول إلى هذه الصفحة");
    window.location.href = "login.html";
    return false;
  }

  const emailKey = currentEmail.replace(/[.#$\[\]]/g, '_');
  
  try {
    const userSnapshot = await firebase.database().ref(`users/${emailKey}`).once('value');
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

// Debounce function to prevent rapid successive updates
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      return;
    }

    const pdfList = document.getElementById('pdfList');
    const subjectFilter = document.getElementById('subjectFilter');
  
    if (!pdfList || !subjectFilter) {
      console.error('Required elements missing:', {
        pdfList: !!pdfList,
        subjectFilter: !!subjectFilter
      });
      return;
    }

    // Check if Firebase is available
    if (typeof firebase === 'undefined' || !firebase.database) {
      console.error('Firebase not available');
      displayEmptyState();
      return;
    }

    const db = firebase.database();
    let allPdfs = [];
  
    // Fetch PDFs from Firebase with smart caching
    function fetchPDFs() {
      displayLoading();
      console.log('[PDF System] Loading PDFs with smart caching...');
      
      // Use cached data with real-time listener
      pdfCache.getData('educational-resources', (pdfData) => {
        allPdfs = [];
        
        if (!pdfData || Object.keys(pdfData).length === 0) {
          console.log('[PDF System] No educational resources found in Firebase');
          displayEmptyState();
          return;
        }

        // Convert Firebase data to array format with enhanced metadata
        Object.entries(pdfData).forEach(([pdfKey, pdf]) => {
          allPdfs.push({
            ...pdf,
            firebaseKey: pdfKey
          });
        });
        
        // Sort by multiple criteria (newest first)
        allPdfs.sort((a, b) => {
          // Try timestamp first
          if (a.timestamp && b.timestamp) {
            return b.timestamp - a.timestamp;
          }
          
          // Try uploadedAt (ISO string)
          if (a.uploadedAt && b.uploadedAt) {
            return new Date(b.uploadedAt) - new Date(a.uploadedAt);
          }
          
          // Try id (Date.now() based)
          if (a.id && b.id) {
            return b.id - a.id;
          }
          
          // Fallback: Use Firebase push key (time-based)
          // Firebase push keys are lexicographically sortable by time
          return b.firebaseKey.localeCompare(a.firebaseKey);
        });
        
        console.log('[PDF System] Loaded and sorted PDFs (newest first):', allPdfs.length);
        debouncedPopulateSubjectFilter();
        debouncedRenderPDFs('all');
      });
    }

    // Populate subject filter dropdown with smooth updates
    function populateSubjectFilter() {
      const subjects = [...new Set(allPdfs.map(pdf => pdf.subject || 'غير محدد'))].sort();
      
      // Clear existing options except "All"
      subjectFilter.innerHTML = '<option value="all">الكل</option>';
      
      subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectFilter.appendChild(option);
      });
      
      console.log('[PDF System] Updated subject filter with', subjects.length, 'subjects');
    }

    // Debounced version to prevent rapid updates
    const debouncedPopulateSubjectFilter = debounce(populateSubjectFilter, 200);
  
    // Display PDFs based on filter with smooth transitions
    function renderPDFs(filterSubject) {
      pdfList.innerHTML = ''; // Clear current list
      const filteredPDFs = filterSubject === 'all' ? allPdfs : allPdfs.filter(pdf => (pdf.subject || 'غير محدد') === filterSubject);
  
      if (filteredPDFs.length === 0) {
        displayEmptyState();
        return;
      }

      // Add subtle animation
      pdfList.style.opacity = '0.7';
      setTimeout(() => {
        pdfList.style.opacity = '1';
      }, 100);
  
      filteredPDFs.forEach(pdf => {
        const pdfItem = document.createElement('div');
        pdfItem.className = 'pdf-item';
  
        const pdfTitle = document.createElement('span');
        pdfTitle.className = 'pdf-title';
        pdfTitle.textContent = pdf.title;
  
        const pdfSubject = document.createElement('span');
        pdfSubject.className = 'pdf-subject';
        pdfSubject.textContent = `المادة: ${pdf.subject || 'غير محدد'}`;
  
        const pdfActions = document.createElement('div');
        pdfActions.className = 'pdf-actions';
  
        // View button
        const viewLink = document.createElement('a');
        viewLink.href = pdf.link; // Use the link from Firebase
        viewLink.textContent = 'عرض';
        viewLink.setAttribute('target', '_blank'); // Open in new tab
        viewLink.classList.add('firstB');

        // Share button
        const shareButton = document.createElement('button');
        shareButton.textContent = 'مشاركة';
        shareButton.className = 'share-button-pdf';
        shareButton.onclick = function() {
          sharePDF(pdf.link, pdf.title || 'مصدر تعليمي من الكنيسة');
        };
  
        // Delete button (only show if user has permission)
        const deleteLink = document.createElement('a');
        deleteLink.href = '#';
        deleteLink.textContent = 'حذف';
        deleteLink.addEventListener('click', (e) => {
          e.preventDefault();
          if (confirm('هل أنت متأكد من حذف هذا المصدر التعليمي؟')) {
            deletePDF(pdf.firebaseKey, pdfItem);
          }
        });
  
        pdfActions.appendChild(viewLink);
        pdfActions.appendChild(shareButton);
        pdfActions.appendChild(deleteLink);
        
        pdfItem.appendChild(pdfTitle);
        pdfItem.appendChild(pdfSubject);
        pdfItem.appendChild(pdfActions);
        pdfList.appendChild(pdfItem);
      });
      
      console.log('[PDF System] Rendered', filteredPDFs.length, 'PDFs for filter:', filterSubject);
    }

    // Debounced version to prevent rapid updates
    const debouncedRenderPDFs = debounce(renderPDFs, 200);
  
    // Initial load
    fetchPDFs();
  
    // Filter change event with debouncing
    subjectFilter.addEventListener('change', (e) => {
      console.log('[PDF System] Filtering by subject:', e.target.value);
      debouncedRenderPDFs(e.target.value);
    });
  
    async function deletePDF(firebaseKey, pdfItem) {
      // Check authentication before allowing deletion
      const isAuthenticated = await checkAuthentication();
      if (!isAuthenticated) {
        return;
      }

      if (!firebaseKey) {
        console.error('[PDF System] No Firebase key provided for deletion');
        return;
      }

      console.log('[PDF System] Deleting PDF:', firebaseKey);
      db.ref('educational-resources/' + firebaseKey).remove()
        .then(() => {
          console.log(`[PDF System] Deleted PDF with Firebase key: ${firebaseKey}`);
          // The real-time listener will automatically update the UI and cache
          // No need to manually update DOM or arrays
        })
        .catch((error) => {
          console.error('[PDF System] Error deleting PDF from Firebase:', error);
          alert('حدث خطأ أثناء حذف المصدر التعليمي');
        });
    }

    function displayLoading() {
      pdfList.innerHTML = `
        <div class="empty-state">
          <p>جاري تحميل المصادر التعليمية...</p>
        </div>
      `;
      console.log('[PDF System] Displayed loading state');
    }
  
    function displayEmptyState() {
      pdfList.innerHTML = `
        <div class="empty-state">
          <p>لا توجد مصادر تعليمية مرفوعة حاليًا</p>
        </div>
      `;
      console.log('[PDF System] Displayed empty state');
    }
  });

  // Clean up listeners when page is unloaded
  window.addEventListener('beforeunload', function() {
    console.log('[PDF System] Cleaning up Firebase listeners...');
    pdfCache.cleanup();
  });

  // Performance monitoring
  window.addEventListener('load', function() {
    console.log('[PDF System] Page loaded, PDF cache system active');
  });

  // Share PDF functionality
  function sharePDF(pdfUrl, title) {
    // Check if Web Share API is supported
    if (navigator.share && navigator.canShare) {
      navigator.share({
        title: title || 'مصدر تعليمي من الكنيسة',
        text: `شاهد هذا المصدر التعليمي: ${title}`,
        url: pdfUrl
      }).catch(error => {
        console.log('Error sharing:', error);
        fallbackSharePDF(pdfUrl, title);
      });
    } else {
      fallbackSharePDF(pdfUrl, title);
    }
  }

  // Fallback share function for browsers that don't support Web Share API
  function fallbackSharePDF(pdfUrl, title) {
    const textToCopy = `${title}\n${pdfUrl}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showPDFNotification('تم نسخ رابط المصدر التعليمي إلى الحافظة!', 'success');
      }).catch(() => {
        // Fallback for older browsers
        copyToClipboardFallbackPDF(textToCopy);
      });
    } else {
      copyToClipboardFallbackPDF(textToCopy);
    }
  }

  // Legacy clipboard copy method for PDFs
  function copyToClipboardFallbackPDF(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      showPDFNotification('تم نسخ رابط المصدر التعليمي إلى الحافظة!', 'success');
    } catch (err) {
      showPDFNotification('فشل في نسخ الرابط', 'error');
    }
    
    document.body.removeChild(textArea);
  }

  // Simple notification system for PDFs
  function showPDFNotification(message, type = 'info', duration = 3000) {
    // Remove existing notification
    const existing = document.querySelector('.pdf-notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'pdf-notification';
    
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 600;
        font-size: 14px;
        max-width: 300px;
        word-wrap: break-word;
      ">
        ${message}
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, duration);
  }

  