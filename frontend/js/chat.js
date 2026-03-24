/* AI Chatbot Logic */

function toggleChat() {
  const win = document.getElementById('chatWindow');
  const btn = document.getElementById('chatBtn');
  const isOpen = win.style.display !== 'none';
  
  win.style.display = isOpen ? 'none' : 'flex';
  if (isOpen) {
    btn.style.transform = 'scale(1)';
  } else {
    btn.style.transform = 'scale(0) rotate(90deg)';
    document.getElementById('chatInput').focus();
    const msgs = document.getElementById('chatMessages');
    msgs.scrollTop = msgs.scrollHeight;
  }
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const msgText = input.value.trim();
  if (!msgText) return;
  
  appendMessage('user', msgText);
  input.value = '';
  
  const loadingId = 'msg-loading-' + Date.now();
  appendMessage('system', 'Thinking...', loadingId);
  
  try {
    const res = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: msgText })
    });
    
    const loader = document.getElementById(loadingId);
    if (loader) {
        loader.textContent = res.response;
        const msgs = document.getElementById('chatMessages');
        msgs.scrollTop = msgs.scrollHeight;
    }
  } catch (err) {
    const loader = document.getElementById(loadingId);
    if (loader) loader.textContent = "Sorry, I'm having trouble connecting right now.";
  }
}

function appendMessage(sender, text, id = null) {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'msg ' + sender;
  div.textContent = text;
  if (id) div.id = id;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}
