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

document.addEventListener('DOMContentLoaded', () => {
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
            console.log('Photo saved to Firebase:', newPhoto.title);
            
            // Reset form
            if (uploadForm) {
              uploadForm.reset();
            }
          }).catch((error) => {
            console.error('Firebase error:', error);
            showMessage('❌ حدث خطأ أثناء حفظ الصورة في قاعدة البيانات. حاول مرة أخرى', 'error', 6000);
          });

        } catch (error) {
          console.error('Processing error:', error);
          showMessage('حدث خطأ أثناء معالجة البيانات', 'error');
        }
      });
    }
  });
  
  // If photos exist on this page, load them from Firebase
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('photoList')) {
      loadPhotos();
    }
  });
  
  function loadPhotos() {
    const photoList = document.getElementById('photoList');
    if (!photoList) return;
  
    database.ref("photos").on("value", (snapshot) => {
      photoList.innerHTML = '';
      
      if (!snapshot.exists()) {
        photoList.innerHTML = '<p>لا توجد صور حالياً</p>';
        return;
      }
  
      snapshot.forEach((childSnapshot) => {
        const photo = childSnapshot.val();
        const photoKey = childSnapshot.key;
        
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
          <button onclick="deletePhoto('${photoKey}')">حذف</button>
        `;
        photoList.appendChild(photoElement);
      });
    });
  }
  
  function deletePhoto(photoKey) {
    if (confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
      database.ref("photos/" + photoKey).remove().then(() => {
        console.log('Photo deleted successfully');
      }).catch((error) => {
        console.error('Error deleting photo from Firebase:', error);
        alert('حدث خطأ أثناء حذف الصورة');
      });
    }
  }
