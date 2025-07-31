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

document.addEventListener('DOMContentLoaded', () => {
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
  
        // Delete button
        const deleteLink = document.createElement('a');
        deleteLink.href = '#';
        deleteLink.textContent = 'حذف';
        deleteLink.addEventListener('click', (e) => {
          e.preventDefault();
          deletePhotoFromFirebase(photo.firebaseKey, photo.title);
        });
  
        photoActions.appendChild(viewLink);
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