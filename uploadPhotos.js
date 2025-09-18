// Firebase configuration
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
      console.log(`[Photo System] Using cached data for ${path}`);
      if (callback) callback(this.cache.get(path));
      return this.cache.get(path);
    }

    // Set up real-time listener if not already exists
    if (!this.listeners.has(path)) {
      console.log(`[Photo System] Setting up real-time listener for ${path}`);
      const listener = database.ref(path).on('value', (snapshot) => {
        const data = snapshot.val() || {};
        this.cache.set(path, data);
        this.lastUpdated.set(path, Date.now());
        console.log(`[Photo System] Data updated for ${path}:`, Object.keys(data).length, 'photos');
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

// Authentication and authorization functions
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

    // Verify elements exist
    const uploadForm = document.getElementById('uploadForm');
    const titleInput = document.getElementById('title');
    const urlInput = document.getElementById('photoUrl');
    const messageDiv = document.getElementById('message');
    const photoList = document.getElementById('photoList');
  
    // Log element status for debugging
    if (!uploadForm || !titleInput || !urlInput || !messageDiv || !photoList) {
      console.error('Required elements missing:', {
        uploadForm: !!uploadForm,
        titleInput: !!titleInput,
        urlInput: !!urlInput,
        messageDiv: !!messageDiv,
        photoList: !!photoList
      });
      if (!titleInput) {
        console.error('Specifically, title input is missing. Check HTML for id="title"');
      }
      if (!urlInput) {
        console.error('Specifically, url input is missing. Check HTML for id="photoUrl"');
      }
      // Continue with partial functionality if possible
    }
  
    // Hide photo list on this page
    if (photoList) {
      photoList.style.display = 'none';
      console.log('Photo list hidden');
    }
  
    // Enhanced utility function to show messages with better design
    function showMessage(text, type = 'info', duration = 4000) {
      if (messageDiv) {
        // Clear any existing timeout
        if (messageDiv.hideTimeout) {
          clearTimeout(messageDiv.hideTimeout);
        }
        
        // Remove all existing classes
        messageDiv.className = '';
        
        // Set the message text and type
        messageDiv.textContent = text;
        messageDiv.className = type;
        messageDiv.style.display = 'block';
        
        // Add a subtle vibration for mobile devices (if supported)
        if (navigator.vibrate && type === 'error') {
          navigator.vibrate([50, 100, 50]);
        }
        
        // Auto-hide message after specified duration
        messageDiv.hideTimeout = setTimeout(() => {
          // Add fade out animation
          messageDiv.style.animation = 'fadeOut 0.3s ease-out forwards';
          
          // Hide after animation completes
          setTimeout(() => {
            messageDiv.style.display = 'none';
            messageDiv.style.animation = '';
          }, 300);
        }, duration);
        
        // Allow manual dismissal by clicking
        const dismissHandler = () => {
          clearTimeout(messageDiv.hideTimeout);
          messageDiv.style.animation = 'fadeOut 0.3s ease-out forwards';
          setTimeout(() => {
            messageDiv.style.display = 'none';
            messageDiv.style.animation = '';
          }, 300);
          messageDiv.removeEventListener('click', dismissHandler);
        };
        
        messageDiv.addEventListener('click', dismissHandler);
        messageDiv.style.cursor = 'pointer';
        messageDiv.title = 'اضغط للإغلاق';
      }
    }

    // Function to validate if URL is a valid image
    function isValidImageUrl(url) {
      const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i;
      return imageExtensions.test(url) || url.includes('imgur.com') || url.includes('drive.google.com') || url.includes('dropbox.com');
    }

    // Function to check if image URL is accessible
    function checkImageUrl(url) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      });
    }
  
    if (uploadForm) {
      uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Check authentication before processing upload
        const isAuthenticated = await checkAuthentication();
        if (!isAuthenticated) {
          return;
        }

        const url = urlInput ? urlInput.value.trim() : '';
        const title = titleInput ? titleInput.value.trim() : '';
        
        if (!title) {
          showMessage('📝 يرجى إدخال عنوان للصورة قبل المتابعة', 'warning', 4000);
          titleInput.focus();
          return;
        }
        
        if (!url) {
          showMessage('🔗 يرجى إدخال رابط الصورة من PostImages', 'warning', 4000);
          urlInput.focus();
          return;
        }
        
        // Validate URL format
        try {
          new URL(url);
        } catch {
          showMessage('⚠️ الرابط غير صحيح. تأكد من نسخ الرابط كاملاً من PostImages', 'error', 5000);
          urlInput.focus();
          return;
        }

        // Show loading message with spinner effect
        showMessage('🔄 جاري التحقق من الرابط والحفظ...', 'info', 8000);

        // Check if the URL is accessible
        const isValidImage = await checkImageUrl(url);
        if (!isValidImage) {
          showMessage('❌ الرابط المدخل لا يؤدي إلى صورة صحيحة أو غير متاح. تأكد من رفع الصورة على PostImages أولاً', 'error', 6000);
          return;
        }
        
        try {
          // Add new photo data
          const newPhoto = {
            id: Date.now(),
            title: title,
            url: url,
            uploadDate: new Date().toISOString(),
            timestamp: Date.now()
          };

          // Save to Firebase
          database.ref("photos").push(newPhoto).then(() => {
            showMessage('✅ تم إضافة الصورة بنجاح! يمكنك الآن عرضها في قائمة الصور', 'success', 5000);
            console.log('[Photo System] Photo saved to Firebase:', newPhoto.title);
            
            // Reset form
            if (uploadForm) {
              uploadForm.reset();
            }

            // The real-time listener will automatically update any photo lists
          }).catch((error) => {
            console.error('[Photo System] Firebase error:', error);
            showMessage('❌ حدث خطأ أثناء حفظ الصورة في قاعدة البيانات. حاول مرة أخرى', 'error', 6000);
          });

        } catch (error) {
          console.error('Processing error:', error);
          showMessage('حدث خطأ أثناء معالجة البيانات', 'error');
        }
      });
    }
  });
  
  // If photos exist on this page, load them from Firebase with caching
  document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('photoList')) {
      // Check authentication before loading photos
      const isAuthenticated = await checkAuthentication();
      if (isAuthenticated) {
        loadPhotosWithCache();
      }
    }
  });
  
  async function loadPhotosWithCache() {
    const photoList = document.getElementById('photoList');
    if (!photoList) return;

    console.log('[Photo System] Loading photos with smart caching...');
    
    // Use cached data with real-time listener
    photoCache.getData('photos', (photosData) => {
      photoList.innerHTML = '';
      
      if (!photosData || Object.keys(photosData).length === 0) {
        photoList.innerHTML = '<p>لا توجد صور حالياً</p>';
        return;
      }

      const photos = Object.entries(photosData);
      console.log('[Photo System] Displaying', photos.length, 'photos');
      
      photos.forEach(([photoKey, photo]) => {
        const photoElement = document.createElement('div');
        photoElement.className = 'photo-item';
        
        // Use URL if available, fallback to data for backward compatibility
        const imageSource = photo.url || photo.data;
        
        photoElement.innerHTML = `
          <h3>${photo.title}</h3>
          <img src="${imageSource}" alt="${photo.title}" style="max-width: 200px; max-height: 200px;" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <div style="display: none; padding: 10px; background: #f0f0f0; color: #666;">
            صورة غير متاحة
          </div>
          <button onclick="deletePhotoFromCache('${photoKey}')">حذف</button>
        `;
        photoList.appendChild(photoElement);
      });

      // Add subtle animation to show data refresh
      photoList.style.opacity = '0.8';
      setTimeout(() => {
        photoList.style.opacity = '1';
      }, 100);
    });
  }

  // Enhanced delete function with cache integration
  async function deletePhotoFromCache(photoKey) {
    // Check authentication before allowing deletion
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      return;
    }

    if (confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
      console.log('[Photo System] Deleting photo:', photoKey);
      database.ref("photos/" + photoKey).remove().then(() => {
        console.log('[Photo System] Photo deleted successfully');
        // The real-time listener will automatically update the UI and cache
      }).catch((error) => {
        console.error('[Photo System] Error deleting photo:', error);
        alert('حدث خطأ أثناء حذف الصورة');
      });
    }
  }

  // Make delete function global for onclick handlers
  window.deletePhotoFromCache = deletePhotoFromCache;

  // Clean up listeners when page is unloaded
  window.addEventListener('beforeunload', function() {
    console.log('[Photo System] Cleaning up Firebase listeners...');
    photoCache.cleanup();
  });

  // Performance monitoring
  window.addEventListener('load', function() {
    console.log('[Photo System] Page loaded, photo cache system active');
  });
