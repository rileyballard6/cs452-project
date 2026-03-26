# Job Application Tracker

## Purpose
Keeping track of job applications is messy, and it's hard to know if your resume is actually a good fit for a role before you apply. This project is a web app + Chrome extension that saves jobs as you browse, tracks applications through the hiring process, and uses AI to score your resume against a job description and help draft a cover letter.

---

## Goals
- Replace the "spreadsheet method" with a smarter, structured tracker
- Use AI to give real signal on resume fit before applying
- Make cover letter drafting faster with a personalized scaffold
- Surface insights across all applications (response rates, keyword trends)

---

## Tech Stack
- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MySQL
- **AI:** Anthropic API (Claude)
- **Extension:** Chrome Extension (Vanilla JS)
- **Hosting:** Railway / Render

---

## ERD

```
USERS
  id, email, google_id, display_name, avatar_url, resume_text, created_at

COMPANIES
  id, user_id, name, website, industry, notes

APPLICATIONS
  id, user_id, company_id, role_title, job_description,
  status, date_applied, salary_min, salary_max, job_url, source

AI_ANALYSES
  id, application_id, fit_score, missing_keywords (JSON),
  strengths (JSON), suggestions, cover_letter, created_at

DOCUMENTS
  id, user_id, application_id, label, content, version

CONTACTS
  id, company_id, name, linkedin_url, notes, last_contacted

STATUS_HISTORY (trigger-populated)
  id, application_id, old_status, new_status, changed_at
```

Relationships:
- USERS → APPLICATIONS (one to many)
- USERS → DOCUMENTS (one to many)
- COMPANIES → APPLICATIONS (one to many)
- COMPANIES → CONTACTS (one to many)
- APPLICATIONS → AI_ANALYSES (one to one)
- APPLICATIONS → STATUS_HISTORY (one to many, via trigger)

---

## System Design

```
[ LinkedIn / Indeed / Greenhouse ]
            |
   [ Chrome Extension ]
   content.js scrapes job data
   popup.js shows fit score
            |
            v
   [ Node.js / Express API ]
   REST endpoints
   AI prompt orchestration
       |            |
       v            v
  [ MySQL ]    [ Claude API ]
  applications  fit scoring
  companies     cover letters
  analyses
       ^
       |
  [ React Web App ]
  Kanban board
  Resume manager
  Analytics dashboard
```

---