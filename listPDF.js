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
  
    // Retrieve PDFs from localStorage
    let pdfs = [];
    try {
      pdfs = JSON.parse(localStorage.getItem('pdfs')) || [];
      console.log('Retrieved PDFs:', pdfs.length);
    } catch (error) {
      console.error('Error parsing PDFs from localStorage:', error);
      displayEmptyState();
      return;
    }
  
    // Populate subject filter dropdown
    const subjects = [...new Set(pdfs.map(pdf => pdf.subject || 'غير محدد'))].sort();
    subjects.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject;
      option.textContent = subject;
      subjectFilter.appendChild(option);
    });
  
    // Display PDFs based on filter
    function renderPDFs(filterSubject) {
      pdfList.innerHTML = ''; // Clear current list
      const filteredPDFs = filterSubject === 'all' ? pdfs : pdfs.filter(pdf => (pdf.subject || 'غير محدد') === filterSubject);
  
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
  
        const pdfActions = document.createElement('div');
        pdfActions.className = 'pdf-actions';
  
        // View button
        const viewLink = document.createElement('a');
        viewLink.href = pdf.data; // Base64 data URL
        viewLink.textContent = 'عرض';
        viewLink.setAttribute('target', '_blank'); // Open in new tab
        viewLink.setAttribute('download', `${pdf.title}.pdf`); // Suggest download with title
        viewLink.classList.add('firstB');

  
        // Delete button
        const deleteLink = document.createElement('a');
        deleteLink.href = '#';
        deleteLink.textContent = 'حذف';
        deleteLink.addEventListener('click', (e) => {
          e.preventDefault();
          deletePDF(pdf.id);
          pdfItem.remove(); // Remove item from DOM
          updateSubjects(); // Update dropdown if subject is no longer used
          checkEmptyState(); // Check if list is now empty
        });
  
        pdfActions.appendChild(viewLink);
        pdfActions.appendChild(deleteLink);
        pdfItem.appendChild(pdfTitle);
        pdfItem.appendChild(pdfActions);
        pdfList.appendChild(pdfItem);
      });
    }
  
    // Initial render
    renderPDFs('all');
  
    // Filter change event
    subjectFilter.addEventListener('change', (e) => {
      console.log('Filtering by subject:', e.target.value);
      renderPDFs(e.target.value);
    });
  
    function deletePDF(id) {
      try {
        let pdfs = JSON.parse(localStorage.getItem('pdfs')) || [];
        pdfs = pdfs.filter(pdf => pdf.id !== id);
        localStorage.setItem('pdfs', JSON.stringify(pdfs));
        console.log(`Deleted PDF with id ${id}`);
      } catch (error) {
        console.error('Error deleting PDF from localStorage:', error);
      }
    }
  
    function updateSubjects() {
      try {
        pdfs = JSON.parse(localStorage.getItem('pdfs')) || [];
        const currentSubjects = [...new Set(pdfs.map(pdf => pdf.subject || 'غير محدد'))].sort();
        const selectedSubject = subjectFilter.value;
  
        // Rebuild dropdown
        subjectFilter.innerHTML = '<option value="all">الكل</option>';
        currentSubjects.forEach(subject => {
          const option = document.createElement('option');
          option.value = subject;
          option.textContent = subject;
          subjectFilter.appendChild(option);
        });
  
        // Restore selection or default to 'all' if selected subject is gone
        subjectFilter.value = currentSubjects.includes(selectedSubject) ? selectedSubject : 'all';
        renderPDFs(subjectFilter.value);
      } catch (error) {
        console.error('Error updating subjects:', error);
        displayEmptyState();
      }
    }
  
    function displayEmptyState() {
      pdfList.innerHTML = `
        <div class="empty-state">
          <p>لا توجد مصادر تعليمية مرفوعة حاليًا</p>
        </div>
      `;
      console.log('Displayed empty state');
    }
  
    function checkEmptyState() {
      try {
        const filteredPDFs = subjectFilter.value === 'all' ? pdfs : pdfs.filter(pdf => (pdf.subject || 'غير محدد') === subjectFilter.value);
        if (filteredPDFs.length === 0) {
          displayEmptyState();
        }
      } catch (error) {
        console.error('Error checking empty state:', error);
        displayEmptyState();
      }
    }
  });