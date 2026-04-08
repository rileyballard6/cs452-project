function detectSource(hostname) {
  if (hostname.includes('linkedin.com')) return 'linkedin';
  if (hostname.includes('indeed.com')) return 'indeed';
  if (hostname.includes('greenhouse.io')) return 'greenhouse';
  if (hostname.includes('lever.co')) return 'lever';
  return 'other';
}

function getText(selector) {
  const el = document.querySelector(selector);
  if (!el) return '';
  // innerText on an anchor with an SVG can pick up SVG title text — use textContent and clean it
  return (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
}

// Try selectors in order, return first non-empty result
function getFirst(...selectors) {
  for (const sel of selectors) {
    const val = getText(sel);
    if (val) return val;
  }
  return '';
}

const SELECTORS = {
  linkedin: {
    title:       '.job-details-jobs-unified-top-card__job-title h1',
    company:     '.job-details-jobs-unified-top-card__company-name a',
    description: '.jobs-description__content',
    location:    '.job-details-jobs-unified-top-card__bullet',
  },
  indeed: {
    // Title — the h1 inside the testid container
    title:       '[data-testid="jobsearch-JobInfoHeader-title"] span, [data-testid="jobsearch-JobInfoHeader-title"]',
    // Company — grab the anchor text directly to avoid SVG noise
    company:     '[data-testid="inlineHeader-companyName"] a',
    // Description — full job description div
    description: '#jobDescriptionText',
    // Location
    location:    '[data-testid="job-location"]',
    // Salary (bonus)
    salary:      '#salaryInfoAndJobType span:first-child',
  },
  greenhouse: {
    title:       'h1.app-title',
    company:     'h2.company-name',
    description: '#content',
    location:    '.location',
  },
  lever: {
    title:       '.posting-headline h2',
    company:     '.posting-headline .company-name',
    description: '.posting-description',
    location:    '.posting-categories .location',
  },
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_JOB_DATA') {
    const source = detectSource(window.location.hostname);
    const sel = SELECTORS[source] || {};

    // For Indeed title, the h1's innerText contains the span text cleanly
    let title = '';
    if (source === 'indeed') {
      const h1 = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]');
      title = h1?.innerText?.trim() || '';
    } else {
      title = getFirst(sel.title);
    }

    // For company on Indeed, only take text from the first text node of the anchor
    // to avoid picking up "opens in a new tab" from aria-label
    let company = '';
    if (source === 'indeed') {
      const anchor = document.querySelector('[data-testid="inlineHeader-companyName"] a');
      if (anchor) {
        // Get just the first text node child
        const textNode = Array.from(anchor.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
        company = textNode?.textContent?.trim() || anchor.innerText?.split('\n')[0]?.trim() || '';
      }
    } else {
      company = getFirst(sel.company);
    }

    const description = sel.description ? getText(sel.description) : '';
    const location    = sel.location    ? getFirst(sel.location) : '';
    const salary      = sel.salary      ? getText(sel.salary) : '';

    sendResponse({
      title,
      company,
      description,
      location,
      salary,
      url: window.location.href,
      source,
    });
  }
  return true;
});
