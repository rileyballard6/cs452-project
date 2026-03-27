// Detect source from hostname
function detectSource(hostname) {
  if (hostname.includes('linkedin.com')) return 'linkedin';
  if (hostname.includes('indeed.com')) return 'indeed';
  if (hostname.includes('greenhouse.io')) return 'greenhouse';
  if (hostname.includes('lever.co')) return 'lever';
  return 'manual';
}

// Source-specific selectors
const SELECTORS = {
  linkedin: {
    title: '.job-details-jobs-unified-top-card__job-title h1',
    company: '.job-details-jobs-unified-top-card__company-name a',
    description: '.jobs-description__content',
  },
  indeed: {
    title: '[data-testid="jobsearch-JobInfoHeader-title"]',
    company: '[data-testid="inlineHeader-companyName"]',
    description: '#jobDescriptionText',
  },
  greenhouse: {
    title: 'h1.app-title',
    company: 'h2.company-name',
    description: '#content',
  },
  lever: {
    title: '.posting-headline h2',
    company: '.posting-headline .company-name',
    description: '.posting-description',
  },
};

const source = detectSource(window.location.hostname);
const sel = SELECTORS[source] || {};

const jobData = {
  title: document.querySelector(sel.title)?.innerText?.trim() || '',
  company: document.querySelector(sel.company)?.innerText?.trim() || '',
  description: document.querySelector(sel.description)?.innerText?.trim() || '',
  url: window.location.href,
  source,
};

chrome.runtime.sendMessage({ type: 'SAVE_JOB', payload: jobData });
