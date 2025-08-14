const webhookUrl = "https://mina8maher.app.n8n.cloud/webhook-test/318b59bf-9f07-436b-8fee-26a705fcd93e"; //test
// const webhookUrl = "https://mina8maher.app.n8n.cloud/webhook/318b59bf-9f07-436b-8fee-26a705fcd93e"; 


function toggleChat() {
  const chat = document.getElementById("chat-container");
  chat.style.display = chat.style.display === "flex" ? "none" : "flex";
  // Focus the input when opening and scroll to bottom
  if (chat.style.display === "flex") {
    const input = document.getElementById("user-input");
    if (input) input.focus();
    const chatBody = document.getElementById("chat-body");
    if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
  }
}

function appendMessage(text, sender) {
  const chatBody = document.getElementById("chat-body");
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.textContent = text;
  chatBody.appendChild(msg);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// --- Typing indicator helpers ---
function showTyping() {
  const chatBody = document.getElementById("chat-body");
  if (!chatBody) return;
  // Prevent duplicates
  if (document.getElementById("typing-indicator")) return;
  const wrap = document.createElement("div");
  wrap.id = "typing-indicator";
  wrap.className = "message bot";
  const bubble = document.createElement("div");
  bubble.className = "typing";
  bubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  wrap.appendChild(bubble);
  chatBody.appendChild(wrap);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById("typing-indicator");
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

async function sendMessage() {
  const input = document.getElementById("user-input");
  const text = input.value.trim();
  if (!text) return;

  appendMessage(text, "user");
  input.value = "";

  showTyping();

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    // Try to parse JSON safely
    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const raw = await res.text();
      try { data = JSON.parse(raw); } catch { data = { reply: raw }; }
    }

    hideTyping();
    appendMessage((data && data.reply) ? data.reply : "No response", "bot");
  } catch (err) {
    hideTyping();
    appendMessage("حدث خطأ في الاتصال", "bot");
  }
}
