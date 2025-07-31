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
  
    // Fetch PDFs from Firebase
    function fetchPDFs() {
      displayLoading();
      
      db.ref('educational-resources').once('value')
        .then((snapshot) => {
          allPdfs = [];
          
          if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
              const pdf = childSnapshot.val();
              pdf.firebaseKey = childSnapshot.key; // Store Firebase key for deletion
              allPdfs.push(pdf);
            });
            
            console.log('Retrieved PDFs from Firebase:', allPdfs.length);
            populateSubjectFilter();
            renderPDFs('all');
          } else {
            console.log('No educational resources found in Firebase');
            displayEmptyState();
          }
        })
        .catch((error) => {
          console.error('Error fetching PDFs from Firebase:', error);
          displayEmptyState();
        });
    }

    // Populate subject filter dropdown
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
    }
  
    // Display PDFs based on filter
    function renderPDFs(filterSubject) {
      pdfList.innerHTML = ''; // Clear current list
      const filteredPDFs = filterSubject === 'all' ? allPdfs : allPdfs.filter(pdf => (pdf.subject || 'غير محدد') === filterSubject);
  
      if (filteredPDFs.length === 0) {
        displayEmptyState();
        return;
      }
  
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
    }
  
    // Initial load
    fetchPDFs();
  
    // Filter change event
    subjectFilter.addEventListener('change', (e) => {
      console.log('Filtering by subject:', e.target.value);
      renderPDFs(e.target.value);
    });
  
    function deletePDF(firebaseKey, pdfItem) {
      if (!firebaseKey) {
        console.error('No Firebase key provided for deletion');
        return;
      }

      db.ref('educational-resources/' + firebaseKey).remove()
        .then(() => {
          console.log(`Deleted PDF with Firebase key: ${firebaseKey}`);
          pdfItem.remove(); // Remove item from DOM
          
          // Update local array
          allPdfs = allPdfs.filter(pdf => pdf.firebaseKey !== firebaseKey);
          
          // Update subject filter and re-render if needed
          populateSubjectFilter();
          
          // Check if current filter still has items
          const currentFilter = subjectFilter.value;
          const filteredPDFs = currentFilter === 'all' ? allPdfs : allPdfs.filter(pdf => (pdf.subject || 'غير محدد') === currentFilter);
          
          if (filteredPDFs.length === 0) {
            displayEmptyState();
          }
        })
        .catch((error) => {
          console.error('Error deleting PDF from Firebase:', error);
          alert('حدث خطأ أثناء حذف المصدر التعليمي');
        });
    }

    function displayLoading() {
      pdfList.innerHTML = `
        <div class="empty-state">
          <p>جاري تحميل المصادر التعليمية...</p>
        </div>
      `;
      console.log('Displayed loading state');
    }
  
    function displayEmptyState() {
      pdfList.innerHTML = `
        <div class="empty-state">
          <p>لا توجد مصادر تعليمية مرفوعة حاليًا</p>
        </div>
      `;
      console.log('Displayed empty state');
    }
  });