document.addEventListener("DOMContentLoaded", function () {
    const exams = JSON.parse(localStorage.getItem("exams") || "[]");
    const container = document.getElementById("examContainer");

    if (!container) {
        console.error("عنصر examContainer غير موجود في الصفحة.");
        return;
    }

    if (exams.length === 0) {
        container.innerHTML = "<p>لا يوجد امتحانات حالياً.</p>";
    } else {
        // نفرغ المحتوى أولاً (احتياطي)
        container.innerHTML = "";

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
    }
});
