const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const fileInput = document.getElementById('file-input');
const chatBox = document.getElementById('chat-box');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userMessage = input.value.trim();
  const file = fileInput.files[0];
  if (!userMessage && !file) return;

  appendMessage('user', userMessage || `📎 ${file.name}`);
  input.value = '';
  fileInput.value = '';

  const placeholder = appendMessage('bot', 'Gemini is thinking...');

  try {
    let response;
    if (file) {
      // kirim file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prompt', userMessage || '');
      response = await fetch('/api/upload', { method: 'POST', body: formData });
    } else {
      // kirim teks biasa
      response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage })
      });
    }

    const data = await response.json();
    placeholder.textContent = data.output || data.response || 'Tidak ada balasan.';
  } catch (err) {
    console.error(err);
    placeholder.textContent = '❌ Gagal terhubung ke server.';
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

