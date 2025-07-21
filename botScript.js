const webhookUrl = "https://mina-free.app.n8n.cloud/webhook-test/318b59bf-9f07-436b-8fee-26a705fcd93e"; //test
// const webhookUrl = "https://mina-free.app.n8n.cloud/webhook/318b59bf-9f07-436b-8fee-26a705fcd93e"; 


function toggleChat() {
  const chat = document.getElementById("chat-container");
  chat.style.display = chat.style.display === "flex" ? "none" : "flex";
}

function appendMessage(text, sender) {
  const chatBody = document.getElementById("chat-body");
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.textContent = text;
  chatBody.appendChild(msg);
  chatBody.scrollTop = chatBody.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById("user-input");
  const text = input.value.trim();
  if (!text) return;

  appendMessage(text, "user");
  input.value = "";

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();
    appendMessage(data.reply || "No response", "bot");
  } catch (err) {
    appendMessage("Error contacting bot", "bot");
  }
}
