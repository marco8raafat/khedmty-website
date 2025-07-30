document.getElementById("examForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const examName = document.getElementById("examName").value.trim();
  const examLink = document.getElementById("examLink").value.trim();
  const currentUser = sessionStorage.getItem("currentUser");

  if (examName === "" || examLink === "") {
    alert("يرجى ملء جميع الحقول.");
    return;
  }

  if (!currentUser) {
    alert("يجب تسجيل الدخول أولاً.");
    return;
  }

  const emailKey = currentUser.replace(/\./g, '_'); // Firebase-safe key

  const newExamRef = firebase.database().ref("exams").push(); // generate new key
  newExamRef.set({
    name: examName,
    link: examLink,
    uploadedBy: emailKey,
    timestamp: Date.now()
  }).then(() => {
    alert("تم رفع الامتحان بنجاح!");
    window.location.href = "exam-list.html";
  }).catch((error) => {
    console.error("خطأ أثناء رفع الامتحان:", error);
    alert("حدث خطأ أثناء رفع الامتحان. حاول مرة أخرى.");
  });
});
