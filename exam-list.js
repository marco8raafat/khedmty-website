const examList = document.getElementById("examList");
let exams = JSON.parse(localStorage.getItem("exams") || "[]");

function renderExams() {
    examList.innerHTML = "";

    if (exams.length === 0) {
    examList.innerHTML = "<li>لا يوجد امتحانات حالياً.</li>";
    return;
}

exams.forEach((exam, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
    <strong>${exam.name}</strong><br>
    <button onclick="openExam('${exam.link}')">فتح الامتحان</button>
    <button class="delete" onclick="deleteExam(${index})">حذف</button>
    `;
    examList.appendChild(li);
});
}

function openExam(link) {
    window.open(link, "_blank");
}

function deleteExam(index) {
if (confirm("هل أنت متأكد من حذف الامتحان؟")) {
    exams.splice(index, 1);
    localStorage.setItem("exams", JSON.stringify(exams));
    renderExams();
}
}

renderExams();
