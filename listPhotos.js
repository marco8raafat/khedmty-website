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
  
    // Retrieve photos from localStorage
    let photos = [];
    try {
      photos = JSON.parse(localStorage.getItem('photos')) || [];
      console.log('Retrieved photos:', photos.length);
    } catch (error) {
      console.error('Error parsing photos from localStorage:', error);
      displayEmptyState();
      return;
    }
  
    // Display photos based on filter
    function renderPhotos(filterText = '') {
      photoList.innerHTML = ''; // Clear current list
      const filteredPhotos = photos.filter(photo =>
        photo.title.toLowerCase().includes(filterText.toLowerCase())
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
        photoThumbnail.src = photo.data;
        photoThumbnail.alt = photo.title;
  
        const photoTitle = document.createElement('span');
        photoTitle.className = 'photo-title';
        photoTitle.textContent = photo.title;
  
        const photoActions = document.createElement('div');
        photoActions.className = 'photo-actions';
  
        // View button
        const viewLink = document.createElement('a');
        viewLink.href = photo.data;
        viewLink.textContent = 'تنزيل';
        viewLink.setAttribute('target', '_blank'); // Open in new tab
        viewLink.setAttribute('download', `${photo.title}`); // Suggest download with title
  
        // Delete button
        const deleteLink = document.createElement('a');
        deleteLink.href = '#';
        deleteLink.textContent = 'حذف';
        deleteLink.addEventListener('click', (e) => {
          e.preventDefault();
          deletePhoto(photo.id);
          photoItem.remove(); // Remove item from DOM
          checkEmptyState(); // Check if list is now empty
        });
  
        photoActions.appendChild(viewLink);
        photoActions.appendChild(deleteLink);
        photoItem.appendChild(photoThumbnail);
        photoItem.appendChild(photoTitle);
        photoItem.appendChild(photoActions);
        photoList.appendChild(photoItem);
      });
    }
  
    // Initial render
    renderPhotos();
  
    // Filter input event
    titleFilter.addEventListener('input', (e) => {
      console.log('Filtering by title:', e.target.value);
      renderPhotos(e.target.value);
    });
  
    function deletePhoto(id) {
      try {
        let photos = JSON.parse(localStorage.getItem('photos')) || [];
        photos = photos.filter(photo => photo.id !== id);
        localStorage.setItem('photos', JSON.stringify(photos));
        console.log(`Deleted photo with id ${id}`);
      } catch (error) {
        console.error('Error deleting photo from localStorage:', error);
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
  
    function checkEmptyState() {
      try {
        const filteredPhotos = photos.filter(photo =>
          photo.title.toLowerCase().includes(titleFilter.value.toLowerCase())
        );
        if (filteredPhotos.length === 0) {
          displayEmptyState();
        }
      } catch (error) {
        console.error('Error checking empty state:', error);
        displayEmptyState();
      }
    }
  });