const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const fileInput = document.getElementById('file-input');
const chatBox = document.getElementById('chat-box');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userMessage = input.value.trim();
  const file = fileInput.files[0];
  if (!userMessage && !file) return;

  // tampilkan pesan user
  appendMessage('user', userMessage || `📎 ${file.name}`);
  input.value = '';
  fileInput.value = '';

  // bikin bubble placeholder untuk jawaban AI
  const placeholder = appendMessage('bot', '💭 Gemini sedang berpikir...');

  try {
    let response;
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prompt', userMessage || '');
      console.log("📤 Mengirim file ke /api/upload...");
      response = await fetch('/api/upload', { method: 'POST', body: formData });
    } else {
      console.log("📤 Mengirim prompt ke /api/generate:", userMessage);
      response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage })
      });
    }

    console.log("📥 Status response:", response.status);
    if (!response.ok) throw new Error(`Server error ${response.status}`);

    const textData = await response.text();
    console.log("📦 Data mentah dari server:", textData);

    let data;
    try {
      data = JSON.parse(textData);
    } catch {
      throw new Error("❌ Respons bukan JSON valid: " + textData);
    }

    // tampilkan hasil dengan format markdown
    placeholder.innerHTML = marked.parse(data.output || data.response || 'Tidak ada balasan.');

  } catch (err) {
    console.error("❌ Error:", err);
    placeholder.textContent = '❌ Gagal terhubung ke server. (' + err.message + ')';
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.innerHTML = text; // pakai innerHTML biar bisa parsing markdown nantinya
  chatBox.appendChild(msg);

  // auto-scroll ke bawah
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}
