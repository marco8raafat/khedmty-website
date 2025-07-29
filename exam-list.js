  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDwcSo_bhqO5svMl3kAL8N1c91nvEZ_sac",
    authDomain: "edad-5odam.firebaseapp.com",
    databaseURL: "https://edad-5odam-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "edad-5odam",
    storageBucket: "edad-5odam.appspot.com",
    messagingSenderId: "679576633778",
    appId: "1:679576633778:web:566e6aaef9b72f71a824ab"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  const examList = document.getElementById("examList");

  function renderExamsFromFirebase() {
    examList.innerHTML = "<li>جاري تحميل الامتحانات...</li>";

    db.ref("exams").once("value")
      .then(snapshot => {
        const examsData = snapshot.val();
        examList.innerHTML = "";

        if (!examsData) {
          examList.innerHTML = "<li>لا يوجد امتحانات حالياً.</li>";
          return;
        }

        const exams = Object.entries(examsData); // [ [key, data], ... ]

        exams.forEach(([key, exam]) => {
          const li = document.createElement("li");
          li.innerHTML = `
            <strong>${exam.name}</strong><br>
            <button onclick="openExam('${exam.link}')">فتح الامتحان</button>
            <button class="delete" onclick="deleteExam('${key}')">حذف</button>
          `;
          examList.appendChild(li);
        });
      })
      .catch(error => {
        console.error("حدث خطأ أثناء تحميل الامتحانات:", error);
        examList.innerHTML = "<li>فشل تحميل الامتحانات.</li>";
      });
  }

  function openExam(link) {
    window.open(link, "_blank");
  }

  function deleteExam(examKey) {
    if (confirm("هل أنت متأكد من حذف الامتحان؟")) {
      db.ref("exams/" + examKey).remove()
        .then(() => {
          alert("تم حذف الامتحان.");
          renderExamsFromFirebase(); // Reload after delete
        })
        .catch(error => {
          console.error("خطأ أثناء حذف الامتحان:", error);
          alert("حدث خطأ أثناء حذف الامتحان.");
        });
    }
  }

  // Start rendering
  renderExamsFromFirebase();