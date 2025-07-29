document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("examContainer");

    if (!container) {
        console.error("عنصر examContainer غير موجود في الصفحة.");
        return;
    }

    // Show loading text while fetching
    container.innerHTML = "<p>جاري تحميل الامتحانات...</p>";

    // Fetch exams from Firebase
    firebase.database().ref("exams").once("value")
        .then(snapshot => {
            const data = snapshot.val();
            container.innerHTML = ""; // Clear loading text

            if (!data) {
                container.innerHTML = "<p>لا يوجد امتحانات حالياً.</p>";
                return;
            }

            const exams = Object.values(data); // Convert {key: value} to array

            exams.forEach((exam) => {
                const card = document.createElement("div");
                card.className = "exam-card";

                const title = document.createElement("h3");
                title.textContent = exam.name;

                const button = document.createElement("button");
                button.textContent = "ابدأ الامتحان";
                button.onclick = () => {
                    window.open(exam.link, "_blank");
                };

                card.appendChild(title);
                card.appendChild(button);
                container.appendChild(card);
            });
        })
        .catch(error => {
            console.error("خطأ أثناء تحميل الامتحانات:", error);
            container.innerHTML = "<p>حدث خطأ أثناء تحميل الامتحانات.</p>";
        });
});
