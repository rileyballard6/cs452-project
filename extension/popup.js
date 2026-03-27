const API_BASE = 'http://localhost:3000';

async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get('jwt', (data) => resolve(data.jwt || null));
  });
}

function showStatus(msg, isError = false) {
  const el = document.getElementById('status-msg');
  el.textContent = msg;
  el.className = isError ? 'error' : 'success';
}

async function saveJob(payload) {
  const token = await getToken();
  if (!token) { showStatus('Please log in first.', true); return; }

  const res = await fetch(`${API_BASE}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    showStatus('Job saved!');
  } else {
    const err = await res.json().catch(() => ({}));
    showStatus(err.message || 'Failed to save.', true);
  }
}

// Pre-fill from active tab via content script
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  chrome.scripting.executeScript(
    { target: { tabId: tab.id }, files: ['content.js'] },
    () => {
      chrome.runtime.onMessage.addListener(function handler(msg) {
        if (msg.type === 'SAVE_JOB') {
          document.getElementById('field-title').value = msg.payload.title;
          document.getElementById('field-company').value = msg.payload.company;
          document.getElementById('field-description').value = msg.payload.description;
          chrome.runtime.onMessage.removeListener(handler);
        }
      });
    }
  );
});

document.getElementById('btn-save').addEventListener('click', () => {
  saveJob({
    role_title: document.getElementById('field-title').value,
    company_name: document.getElementById('field-company').value,
    job_description: document.getElementById('field-description').value,
    job_url: '',
    source: 'extension',
  });
});

document.getElementById('btn-manual-save').addEventListener('click', () => {
  saveJob({
    role_title: document.getElementById('manual-title').value,
    company_name: document.getElementById('manual-company').value,
    job_description: document.getElementById('manual-description').value,
    job_url: document.getElementById('manual-url').value,
    source: 'manual',
  });
});
