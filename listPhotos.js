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

// Smart Cache Management System
class PhotoCache {
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
      console.log(`[Photo List] Using cached data for ${path}`);
      if (callback) callback(this.cache.get(path));
      return this.cache.get(path);
    }

    // Set up real-time listener if not already exists
    if (!this.listeners.has(path)) {
      console.log(`[Photo List] Setting up real-time listener for ${path}`);
      const listener = database.ref(path).on('value', (snapshot) => {
        const data = snapshot.val() || {};
        this.cache.set(path, data);
        this.lastUpdated.set(path, Date.now());
        console.log(`[Photo List] Data updated for ${path}:`, Object.keys(data).length, 'photos');
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
      database.ref(path).off('value', listener);
    });
    this.listeners.clear();
    this.cache.clear();
    this.lastUpdated.clear();
  }
}

// Initialize cache instance
const photoCache = new PhotoCache();

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
    const overlay = document.getElementById('loadingOverlay');
    try {
      if (overlay) overlay.classList.remove('hidden');

      // Check authentication first
      const isAuthenticated = await checkAuthentication();
      if (!isAuthenticated) {
        return; // Exit if not authenticated
      }

      const photoList = document.getElementById('photoList');
      const titleFilter = document.getElementById('titleFilter');
    
      if (!photoList || !titleFilter) {
        console.error('Required elements missing:', {
          photoList: !!photoList,
          titleFilter: !!titleFilter
        });
        return;
      }
    
      let allPhotos = []; // Store all photos for filtering
    
      // Load photos from Firebase with smart caching
      function loadPhotosFromFirebase() {
        console.log('[Photo List] Loading photos with smart caching...');
        
        // Use cached data with real-time listener
        photoCache.getData('photos', (photosData) => {
          allPhotos = []; // Clear the array
          
          if (!photosData || Object.keys(photosData).length === 0) {
            console.log('[Photo List] No photos found in Firebase');
            displayEmptyState();
            return;
          }

          // Convert Firebase data to array format
          Object.entries(photosData).forEach(([photoKey, photo]) => {
            allPhotos.push({
              ...photo,
              firebaseKey: photoKey
            });
          });
          
          console.log('[Photo List] Loaded photos from cache/Firebase:', allPhotos.length);
          debouncedRenderPhotos(); // Use debounced version
        });
      }
    
      // Display photos based on filter with smooth transitions
      function renderPhotos(filterText = '') {
        photoList.innerHTML = ''; // Clear current list
        
        const filteredPhotos = allPhotos.filter(photo =>
          photo.title && photo.title.toLowerCase().includes(filterText.toLowerCase())
        );
    
        if (filteredPhotos.length === 0) {
          displayEmptyState();
          return;
        }

        // Add subtle animation
        photoList.style.opacity = '0.7';
        setTimeout(() => {
          photoList.style.opacity = '1';
        }, 100);
    
        filteredPhotos.forEach(photo => {
          const photoItem = document.createElement('div');
          photoItem.className = 'photo-item';
    
          const photoThumbnail = document.createElement('img');
          photoThumbnail.className = 'photo-thumbnail';
          
          // Use URL if available, fallback to data for backward compatibility
          const imageSource = photo.url || photo.data;
          photoThumbnail.src = imageSource;
          photoThumbnail.alt = photo.title || 'صورة';
          
          // Add error handling for broken images
          photoThumbnail.onerror = function() {
            this.style.display = 'none';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'photo-error';
            errorDiv.textContent = 'صورة غير متاحة';
            errorDiv.style.cssText = 'padding: 20px; background: #f0f0f0; color: #666; text-align: center; border-radius: 5px;';
            this.parentNode.insertBefore(errorDiv, this);
          };
    
          const photoTitle = document.createElement('span');
          photoTitle.className = 'photo-title';
          photoTitle.textContent = photo.title || 'بدون عنوان';
    
          const photoActions = document.createElement('div');
          photoActions.className = 'photo-actions';
    
          // View button - open image in new tab
          const viewLink = document.createElement('a');
          viewLink.href = imageSource;
          viewLink.textContent = 'عرض';
          viewLink.setAttribute('target', '_blank');
          viewLink.setAttribute('rel', 'noopener noreferrer');

          // Share button
          const shareButton = document.createElement('button');
          shareButton.textContent = 'مشاركة';
          shareButton.className = 'share-button';
          shareButton.onclick = function() {
            shareImage(imageSource, photo.title || 'صورة من الكنيسة');
          };
    
          // Delete button
          const deleteLink = document.createElement('a');
          deleteLink.href = '#';
          deleteLink.textContent = 'حذف';
          deleteLink.addEventListener('click', (e) => {
            e.preventDefault();
            deletePhotoFromFirebase(photo.firebaseKey, photo.title);
          });
    
          photoActions.appendChild(viewLink);
          photoActions.appendChild(shareButton);
          photoActions.appendChild(deleteLink);
          photoItem.appendChild(photoThumbnail);
          photoItem.appendChild(photoTitle);
          photoItem.appendChild(photoActions);
          photoList.appendChild(photoItem);
        });
      }

      // Debounced version to prevent rapid updates
      const debouncedRenderPhotos = debounce(renderPhotos, 200);
    
      // Initial load from Firebase
      loadPhotosFromFirebase();
    
      // Filter input event with debouncing
      titleFilter.addEventListener('input', (e) => {
        console.log('[Photo List] Filtering by title:', e.target.value);
        debouncedRenderPhotos(e.target.value);
      });
    
      // Delete photo from Firebase with cache integration
      function deletePhotoFromFirebase(firebaseKey, photoTitle) {
        if (confirm(`هل أنت متأكد من حذف الصورة "${photoTitle}"؟`)) {
          console.log('[Photo List] Deleting photo:', firebaseKey);
          database.ref("photos/" + firebaseKey).remove().then(() => {
            console.log('[Photo List] Photo deleted successfully from Firebase');
            // The real-time listener will automatically update the UI and cache
          }).catch((error) => {
            console.error('[Photo List] Error deleting photo from Firebase:', error);
            alert('حدث خطأ أثناء حذف الصورة');
          });
        }
      }
    
      function displayEmptyState() {
        photoList.innerHTML = `
          <div class="empty-state">
            <p>لا توجد صور مرفوعة حاليًا</p>
          </div>
        `;
        console.log('[Photo List] Displayed empty state');
      }
    } catch (error) {
      console.error('[Photo List] Error during initialization:', error);
    } finally {
      if (overlay) overlay.classList.add('hidden');
    }
  });

  // Clean up listeners when page is unloaded
  window.addEventListener('beforeunload', function() {
    console.log('[Photo List] Cleaning up Firebase listeners...');
    photoCache.cleanup();
  });

  // Performance monitoring
  window.addEventListener('load', function() {
    console.log('[Photo List] Page loaded, photo cache system active');
  });

  // Share image functionality
  function shareImage(imageUrl, title) {
    // Check if Web Share API is supported
    if (navigator.share && navigator.canShare) {
      navigator.share({
        title: title || 'صورة من الكنيسة',
        text: `شاهد هذه الصورة: ${title}`,
        url: imageUrl
      }).catch(error => {
        console.log('Error sharing:', error);
        fallbackShare(imageUrl, title);
      });
    } else {
      fallbackShare(imageUrl, title);
    }
  }

  // Fallback share function for browsers that don't support Web Share API
  function fallbackShare(imageUrl, title) {
    const textToCopy = `${title}\n${imageUrl}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showNotification('تم نسخ رابط الصورة إلى الحافظة!', 'success');
      }).catch(() => {
        // Fallback for older browsers
        copyToClipboardFallback(textToCopy);
      });
    } else {
      copyToClipboardFallback(textToCopy);
    }
  }

  // Legacy clipboard copy method
  function copyToClipboardFallback(text) {
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
      showNotification('تم نسخ رابط الصورة إلى الحافظة!', 'success');
    } catch (err) {
      showNotification('فشل في نسخ الرابط', 'error');
    }
    
    document.body.removeChild(textArea);
  }

  // Simple notification system
  function showNotification(message, type = 'info', duration = 3000) {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'notification';
    
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

      const container = document.querySelector('.cross-background');

    const svgCross = `
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 60" style="enable-background:new 0 0 60 60;">
      <path d="M52.247,19.665c-0.396,0-0.785,0.049-1.162,0.145c-0.403-2.214-2.347-3.897-4.675-3.897
      c-2.396,0-4.382,1.781-4.707,4.087H35v-4.811c2.077-0.517,3.594-2.381,3.594-4.599c0-2.188-1.486-4.036-3.503-4.586
      c0.11-0.404,0.167-0.824,0.167-1.251C35.258,2.132,33.126,0,30.506,0c-2.621,0-4.753,2.132-4.753,4.753
      c0,0.395,0.049,0.785,0.145,1.162C23.684,6.318,22,8.262,22,10.59c0,2.364,1.735,4.331,4,4.693V20h-7.812
      c-0.516-2.077-2.38-3.594-4.599-3.594c-2.188,0-4.035,1.486-4.585,3.503c-0.405-0.11-0.825-0.167-1.252-0.167
      C5.132,19.742,3,21.874,3,24.495s2.132,4.753,4.753,4.753c0.396,0,0.785-0.049,1.162-0.145C9.318,31.316,11.262,33,13.59,33
      c2.365,0,4.332-1.736,4.693-4H26v15.84c-2.026,0.551-3.506,2.405-3.506,4.569c0,2.188,1.486,4.036,3.502,4.586
      c-0.11,0.405-0.167,0.825-0.167,1.252c0,2.621,2.132,4.752,4.753,4.752s4.753-2.132,4.753-4.752
      c0-0.395-0.049-0.785-0.146-1.162c2.215-0.404,3.898-2.347,3.898-4.676c0-2.395-1.781-4.382-4.088-4.706V29h6.84
      c0.552,2.027,2.406,3.506,4.57,3.506c2.188,0,4.035-1.486,4.585-3.503c0.405,0.11,0.825,0.167,1.252,0.167
      c2.621,0,4.753-2.132,4.753-4.752S54.868,19.665,52.247,19.665z"/>
    </svg>`;

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
  try {
    const currentEmail = await requireAuthentication();
    console.log("Current email from session:", currentEmail);
    
    if (!currentEmail) {
      alert("يرجى تسجيل الدخول أولاً للوصول إلى هذه الصفحة");
      window.location.href = "login.html";
      return false;
    }

    const emailKey = currentEmail.replace(/[.#$\[\]]/g, '_');
    
    const userSnapshot = await database.ref(`users/${emailKey}`).once('value');
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