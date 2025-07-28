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
    const fileInput = document.getElementById('photoFile');
    const messageDiv = document.getElementById('message');
    const photoList = document.getElementById('photoList');
  
    // Log element status for debugging
    if (!uploadForm || !titleInput || !fileInput || !messageDiv || !photoList) {
      console.error('Required elements missing:', {
        uploadForm: !!uploadForm,
        titleInput: !!titleInput,
        fileInput: !!fileInput,
        messageDiv: !!messageDiv,
        photoList: !!photoList
      });
      if (!titleInput) {
        console.error('Specifically, title input is missing. Check HTML for id="title"');
      }
      if (!fileInput) {
        console.error('Specifically, file input is missing. Check HTML for id="photoFile"');
      }
      // Continue with partial functionality if possible
    }
  
    // Hide photo list on this page
    if (photoList) {
      photoList.style.display = 'none';
      console.log('Photo list hidden');
    }
  
    // Utility function to show messages
    function showMessage(text, type = 'info') {
      if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = type;
        messageDiv.style.display = 'block';
        setTimeout(() => {
          messageDiv.style.display = 'none';
        }, 3000);
      }
    }
  
    if (uploadForm) {
      uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const file = fileInput ? fileInput.files[0] : null;
        const title = titleInput ? titleInput.value.trim() : '';
        
        if (!title) {
          showMessage('يرجى إدخال عنوان للصورة', 'error');
          return;
        }
        
        if (!file) {
          showMessage('يرجى اختيار صورة', 'error');
          return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          showMessage('يرجى اختيار ملف صورة صحيح', 'error');
          return;
        }
        
        // Validate file size (limit to 2MB to avoid Firebase issues)
        const maxSizeMB = 2;
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
          showMessage(`حجم الملف كبير جدًا. الحد الأقصى ${maxSizeMB} ميغابايت`, 'error');
          console.log(`Validation failed: File size ${file.size} bytes exceeds ${maxSizeMB}MB`);
          return;
        }
  
        // Read file as data URL
        const reader = new FileReader();
        reader.onload = () => {
          try {
            // Add new photo data
            const newPhoto = {
              id: Date.now(),
              title: title,
              data: reader.result,
              uploadDate: new Date().toISOString(),
              timestamp: Date.now()
            };
  
            // Save to Firebase
            database.ref("photos").push(newPhoto).then(() => {
              showMessage('تم رفع الصورة بنجاح', 'success');
              console.log('Photo saved to Firebase:', newPhoto.title);
              
              // Reset form
              if (uploadForm) {
                uploadForm.reset();
              }
            }).catch((error) => {
              console.error('Firebase error:', error);
              showMessage('حدث خطأ أثناء رفع الصورة إلى Firebase', 'error');
            });
  
          } catch (error) {
            console.error('File processing error:', error);
            showMessage('حدث خطأ أثناء معالجة الملف', 'error');
          }
        };
        
        reader.onerror = () => {
          showMessage('حدث خطأ أثناء قراءة الملف', 'error');
        };
        
        reader.readAsDataURL(file);
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
        photoElement.innerHTML = `
          <h3>${photo.title}</h3>
          <img src="${photo.data}" alt="${photo.title}" style="max-width: 200px; max-height: 200px;">
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
