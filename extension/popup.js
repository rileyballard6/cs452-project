const API = 'http://localhost:3000';
const APP = 'http://localhost:5173';

function parseSalary(str) {
  if (!str) return { salaryMin: null, salaryMax: null };
  const nums = str.match(/\$[\d,]+/g);
  if (!nums) return { salaryMin: null, salaryMax: null };
  const toNum = (s) => parseInt(s.replace(/[$,]/g, ''), 10);
  return {
    salaryMin: toNum(nums[0]),
    salaryMax: nums[1] ? toNum(nums[1]) : toNum(nums[0]),
  };
}

const SOURCE_LABELS = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  greenhouse: 'Greenhouse',
  lever: 'Lever',
};

function show(id) {
  ['view-auth', 'view-job', 'view-success'].forEach((v) => {
    document.getElementById(v).classList.toggle('hidden', v !== id);
  });
}

async function getUser() {
  try {
    const res = await fetch(`${API}/auth/me`, { credentials: 'include' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function saveJob(payload) {
  const res = await fetch(`${API}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to save');
  return res.json();
}

async function getJobData(tabId) {
  try {
    // Inject content script in case it wasn't auto-loaded (unsupported page)
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
  } catch {
    // Already injected or no permission — ignore
  }
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'GET_JOB_DATA' }, (data) => {
      resolve(chrome.runtime.lastError ? null : data);
    });
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.getElementById('btn-signin').addEventListener('click', () => {
  chrome.tabs.create({ url: `${APP}` });
  window.close();
});

(async () => {
  const user = await getUser();

  if (!user) {
    show('view-auth');
    return;
  }

  // Show user chip
  const chip = document.getElementById('user-chip');
  chip.classList.remove('hidden');
  document.getElementById('user-name').textContent = user.displayName?.split(' ')[0] ?? user.email;
  if (user.avatarUrl) {
    document.getElementById('user-avatar').src = user.avatarUrl;
  }

  // Get current tab + job data
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const jobData = await getJobData(tab.id);

  show('view-job');

  if (jobData && jobData.source !== 'other' && (jobData.title || jobData.company)) {
    // Show source badge
    const badge = document.getElementById('source-badge');
    badge.textContent = SOURCE_LABELS[jobData.source] || jobData.source;
    badge.classList.remove('hidden');

    document.getElementById('field-title').value = jobData.title || '';
    document.getElementById('field-company').value = jobData.company || '';
  }

  // Store job data for save
  let currentJobData = jobData;
  let currentTabUrl = tab.url;

  document.getElementById('btn-save').addEventListener('click', async () => {
    const btn = document.getElementById('btn-save');
    const errEl = document.getElementById('save-error');
    errEl.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
      const { salaryMin, salaryMax } = parseSalary(currentJobData?.salary);
      const application = await saveJob({
        roleTitle: document.getElementById('field-title').value.trim() || null,
        companyName: document.getElementById('field-company').value.trim() || null,
        jobDescription: currentJobData?.description || null,
        jobUrl: currentTabUrl || null,
        location: currentJobData?.location || null,
        salaryMin,
        salaryMax,
        status: document.getElementById('field-status').value,
        source: currentJobData?.source || 'extension',
      });

      const successDetail = document.getElementById('success-detail');
      const title = application.roleTitle || document.getElementById('field-title').value;
      const company = application.companyName || document.getElementById('field-company').value;
      successDetail.textContent = title && company ? `${title} at ${company}` : title || company || '';

      const link = document.getElementById('link-open');
      link.href = `${APP}/applications/${application.id}`;

      show('view-success');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Save to Folio';
    }
  });
})();
