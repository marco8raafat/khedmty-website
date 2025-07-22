document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("examForm");
    const submitBtn = form.querySelector("button[type='submit']");
    const timerEl = document.getElementById("timer");
    const totalMinutes = parseInt(timerEl.dataset.minutes || "5");
    let timeLeft = totalMinutes * 60;
  
    const updateTimer = () => {
      const min = Math.floor(timeLeft / 60);
      const sec = timeLeft % 60;
      timerEl.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
  
    //   if (timeLeft <= 60) {
    //     timerEl.style.backgroundColor = "#ff9800"; // برتقالي
    //   }
  
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        alert("انتهى الوقت! سيتم إرسال الامتحان تلقائيًا.");
        form.submit();
      }
  
      timeLeft--;
    };
    const timerInterval = setInterval(updateTimer, 1000);
  
    const updateIndicators = () => {
      const indicators = document.querySelectorAll(".question-indicator [data-qname]");
      indicators.forEach(ind => {
        const qname = ind.dataset.qname;
        const inputs = form.querySelectorAll(`[name='${qname}']`);
        let answered = false;
        inputs.forEach(input => {
          if ((input.type === "radio" && input.checked) ||
              (input.tagName === "TEXTAREA" && input.value.trim() !== "")) {
            answered = true;
          }
        });
        ind.classList.toggle("answered", answered);
      });
    };
  
    const checkAllAnswered = () => {
      const inputs = form.querySelectorAll("input, textarea");
      const names = new Set();
      const answered = new Set();
  
      inputs.forEach(input => {
        if (input.name && input.name.startsWith("q")) {
          names.add(input.name);
          if ((input.type === "radio" && input.checked) ||
              (input.tagName === "TEXTAREA" && input.value.trim() !== "")) {
            answered.add(input.name);
          }
        }
      });
  
      submitBtn.disabled = names.size !== answered.size;
    };
  
    form.addEventListener("input", () => {
      updateIndicators();
      checkAllAnswered();
    });
  
    form.addEventListener("submit", (e) => {
      e.preventDefault();
  
      const questionInputs = [...form.querySelectorAll("input, textarea")]
        .filter(el => el.name && el.name.startsWith("q"));
      const total = new Set(questionInputs.map(el => el.name)).size;
  
      const answered = new Set(
        questionInputs.filter(el =>
          (el.type === "radio" && el.checked) ||
          (el.tagName === "TEXTAREA" && el.value.trim())
        ).map(el => el.name)
      ).size;
  
      const confirmSend = confirm(`أنت جاوبت على ${answered} من ${total} سؤال. هل تريد الإرسال؟`);
      if (confirmSend) {
        form.submit();
      }
    });
  
    updateIndicators();
    checkAllAnswered();
  });
  