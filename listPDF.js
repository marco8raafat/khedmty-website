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

document.addEventListener('DOMContentLoaded', () => {
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

        // Convert Firebase data to array format
        Object.entries(pdfData).forEach(([pdfKey, pdf]) => {
          allPdfs.push({
            ...pdf,
            firebaseKey: pdfKey
          });
        });
        
        console.log('[PDF System] Loaded PDFs from cache/Firebase:', allPdfs.length);
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
  
    function deletePDF(firebaseKey, pdfItem) {
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