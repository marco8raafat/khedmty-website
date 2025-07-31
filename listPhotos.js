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
  
    // Load photos from Firebase
    function loadPhotosFromFirebase() {
      database.ref("photos").on("value", (snapshot) => {
        allPhotos = []; // Clear the array
        
        if (!snapshot.exists()) {
          console.log('No photos found in Firebase');
          displayEmptyState();
          return;
        }
  
        snapshot.forEach((childSnapshot) => {
          const photo = childSnapshot.val();
          const photoKey = childSnapshot.key;
          
          // Add the Firebase key to the photo object for deletion
          allPhotos.push({
            ...photo,
            firebaseKey: photoKey
          });
        });
        
        console.log('Loaded photos from Firebase:', allPhotos.length);
        renderPhotos(); // Render all photos initially
      }, (error) => {
        console.error('Error loading photos from Firebase:', error);
        displayEmptyState();
      });
    }
  
    // Display photos based on filter
    function renderPhotos(filterText = '') {
      photoList.innerHTML = ''; // Clear current list
      
      const filteredPhotos = allPhotos.filter(photo =>
        photo.title && photo.title.toLowerCase().includes(filterText.toLowerCase())
      );
  
      if (filteredPhotos.length === 0) {
        displayEmptyState();
        return;
      }
  
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
  
    // Initial load from Firebase
    loadPhotosFromFirebase();
  
    // Filter input event
    titleFilter.addEventListener('input', (e) => {
      console.log('Filtering by title:', e.target.value);
      renderPhotos(e.target.value);
    });
  
    // Delete photo from Firebase
    function deletePhotoFromFirebase(firebaseKey, photoTitle) {
      if (confirm(`هل أنت متأكد من حذف الصورة "${photoTitle}"؟`)) {
        database.ref("photos/" + firebaseKey).remove().then(() => {
          console.log('Photo deleted successfully from Firebase');
          // The real-time listener will automatically update the UI
        }).catch((error) => {
          console.error('Error deleting photo from Firebase:', error);
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
      console.log('Displayed empty state');
    }
  });