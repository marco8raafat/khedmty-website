document.addEventListener('DOMContentLoaded', () => {
  // Verify elements exist
  const uploadForm = document.getElementById('uploadForm');
  const titleInput = document.getElementById('title');
  const subjectInput = document.getElementById('subject');
  const fileInput = document.getElementById('pdfFile');
  const messageDiv = document.getElementById('message');
  const pdfList = document.getElementById('pdfList');

  // Log element status for debugging
  if (!uploadForm || !titleInput || !subjectInput || !fileInput || !messageDiv || !pdfList) {
    console.error('Required elements missing:', {
      uploadForm: !!uploadForm,
      titleInput: !!titleInput,
      subjectInput: !!subjectInput,
      fileInput: !!fileInput,
      messageDiv: !!messageDiv,
      pdfList: !!pdfList
    });
    if (!subjectInput) {
      console.error('Specifically, subject input is missing. Check HTML for id="subject"');
    }
    if (!titleInput) {
      console.error('Specifically, title input is missing. Check HTML for id="title"');
    }
    // Continue with partial functionality if possible
  }

  // Hide PDF list on this page
  if (pdfList) {
    pdfList.style.display = 'none';
    console.log('PDF list hidden');
  } else {
    console.warn('pdfList element not found, cannot hide PDF list');
  }

  if (uploadForm && titleInput && subjectInput && fileInput && messageDiv) {
    uploadForm.addEventListener('submit', (e) => {
      e.preventDefault(); // Prevent form from submitting to a server
      console.log('Form submission intercepted');

      const title = titleInput.value.trim();
      const subject = subjectInput.value.trim();
      const file = fileInput.files[0];

      // Validate inputs
      if (!title || !subject || !file) {
        showMessage('يرجى إدخال عنوان وموضوع واختيار ملف PDF', 'error');
        console.log('Validation failed: Missing title, subject, or file');
        return;
      }

      // Validate file type
      if (file.type !== 'application/pdf') {
        showMessage('يرجى اختيار ملف PDF فقط', 'error');
        console.log('Validation failed: File is not a PDF');
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
          // Get existing PDFs from localStorage
          let pdfs = JSON.parse(localStorage.getItem('pdfs')) || [];
          console.log('Current PDFs in localStorage:', pdfs.length);

          // Add new PDF data
          const newPDF = {
            id: Date.now(),
            title: title,
            subject: subject,
            data: reader.result
          };
          pdfs.push(newPDF);

          // Save to localStorage
          try {
            localStorage.setItem('pdfs', JSON.stringify(pdfs));
            showMessage('تم رفع الملف بنجاح', 'success');
            console.log('PDF saved to localStorage:', newPDF);
            uploadForm.reset(); // Reset form after successful save
          } catch (error) {
            showMessage('خطأ في حفظ الملف: مساحة التخزين ممتلئة أو خطأ آخر', 'error');
            console.error('LocalStorage error:', error);
          }
        } catch (error) {
          showMessage('حدث خطأ أثناء معالجة الملف', 'error');
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