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
    } else {
      console.warn('photoList element not found, cannot hide photo list');
    }
  
    if (uploadForm && titleInput && fileInput && messageDiv) {
      uploadForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent form from submitting to a server
        console.log('Form submission intercepted');
  
        const title = titleInput.value.trim();
        const file = fileInput.files[0];
  
        // Validate inputs
        if (!title || !file) {
          showMessage('يرجى إدخال عنوان واختيار ملف صورة', 'error');
          console.log('Validation failed: Missing title or file');
          return;
        }
  
        // Validate file type
        if (!file.type.startsWith('image/')) {
          showMessage('يرجى اختيار ملف صورة فقط (مثل JPEG أو PNG)', 'error');
          console.log('Validation failed: File is not an image');
          return;
        }
  
        // Validate file size (limit to 5MB to avoid localStorage issues)
        const maxSizeMB = 5;
        if (file.size > maxSizeMB * 1024 * 1024) {
          showMessage(`حجم الملف كبير جدًا. الحد الأقصى ${maxSizeMB} ميغابايت`, 'error');
          console.log(`Validation failed: File size ${file.size} bytes exceeds ${maxSizeMB}MB`);
          return;
        }
  
        // Read file as data URL
        const reader = new FileReader();
        reader.onload = () => {
          try {
            // Get existing photos from localStorage
            let photos = JSON.parse(localStorage.getItem('photos')) || [];
            console.log('Current photos in localStorage:', photos.length);
  
            // Add new photo data
            const newPhoto = {
              id: Date.now(),
              title: title,
              data: reader.result
            };
            photos.push(newPhoto);
  
            // Save to localStorage
            try {
              localStorage.setItem('photos', JSON.stringify(photos));
              showMessage('تم رفع الصورة بنجاح', 'success');
              console.log('Photo saved to localStorage:', newPhoto);
              uploadForm.reset(); // Reset form after successful save
            } catch (error) {
              showMessage('خطأ في حفظ الصورة: مساحة التخزين ممتلئة أو خطأ آخر', 'error');
              console.error('LocalStorage error:', error);
            }
          } catch (error) {
            showMessage('حدث خطأ أثناء معالجة الصورة', 'error');
            console.error('Error processing file:', error);
          }
        };
  
        reader.onerror = () => {
          showMessage('حدث خطأ أثناء قراءة الملف', 'error');
          console.error('FileReader error:', reader.error);
        };
  
        console.log('Reading file:', file.name);
        reader.readAsDataURL(file);
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
        console.log(`Message displayed: ${text} (${type})`);
        setTimeout(() => {
          messageDiv.style.display = 'none';
        }, 3000);
      } else {
        console.error('Cannot display message: messageDiv not found');
      }
    }
  });