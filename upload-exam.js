document.getElementById("examForm").addEventListener("submit", function(e) {
  e.preventDefault();
  
  const examName = document.getElementById("examName").value.trim();
  const examLink = document.getElementById("examLink").value.trim();

  if (examName === "" || examLink === "") {
    alert("يرجى ملء جميع الحقول.");
    return;
  }

  let exams = JSON.parse(localStorage.getItem("exams") || "[]");
  exams.push({
    name: examName,
    link: examLink
  });
  localStorage.setItem("exams", JSON.stringify(exams));

  // console.log("تم رفع الامتحان:");
  // console.log("اسم الامتحان:", examName);
  // console.log("لينك الامتحان:", examLink);

  alert("تم رفع الامتحان بنجاح!");

  window.location.href = "exam-list.html";
});
