const API_BASE = 'http://localhost:3000';

async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get('jwt', (data) => resolve(data.jwt || null));
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'SAVE_JOB') {
    (async () => {
      const token = await getToken();
      if (!token) {
        sendResponse({ success: false, error: 'Not authenticated' });
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/applications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(msg.payload),
        });
        const data = await res.json();
        sendResponse({ success: res.ok, data });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // keep message channel open for async response
  }
});
