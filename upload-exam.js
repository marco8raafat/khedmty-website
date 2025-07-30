document.addEventListener("DOMContentLoaded", function () {
  const hamburger = document.querySelector(".hamburger");
  const nav = document.getElementById("navLinks");

  if (hamburger && nav) {
    hamburger.addEventListener("click", function () {
      nav.classList.toggle("show");
    });
  }

  const examForm = document.getElementById("examForm");

  if (examForm) {
    examForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const examName = document.getElementById("examName").value.trim();
      const examLink = document.getElementById("examLink").value.trim();

      if (examName === "" || examLink === "") {
        alert("يرجى ملء جميع الحقول.");
        return;
      }

      let exams = JSON.parse(localStorage.getItem("exams") || "[]");
      exams.push({ name: examName, link: examLink });

      localStorage.setItem("exams", JSON.stringify(exams));
      alert("تم رفع الامتحان بنجاح!");
      window.location.href = "exam-list.html";
    });
  }
});
