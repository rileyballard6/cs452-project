import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db';
import { analyzeResume } from '../lib/openai';
import { requireAuth } from '../middleware/requireAuth';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface AiRow extends RowDataPacket {
  id: string;
  application_id: string;
  fit_score: number | null;
  verdict: string | null;
  missing_keywords: string[] | null;
  strengths: string[] | null;
  suggestions: string | null;
  cover_letter: string | null;
  created_at: Date;
}

interface UserRow extends RowDataPacket {
  resume_text: string | null;
  display_name: string | null;
  headline: string | null;
  location: string | null;
}

interface WorkRow extends RowDataPacket {
  company: string | null;
  title: string | null;
  start_date: string | null;
  end_date: string | null;
  current_role: number;
  description: string | null;
}

interface SkillRow extends RowDataPacket {
  name: string;
  category: string;
}

interface ProjectRow extends RowDataPacket {
  title: string | null;
  description: string | null;
  url: string | null;
  repo_url: string | null;
}

interface EducationRow extends RowDataPacket {
  school: string | null;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  current_student: number;
}

function rowToAnalysis(row: AiRow) {
  return {
    id: row.id,
    applicationId: row.application_id,
    fitScore: row.fit_score,
    verdict: row.verdict,
    missingKeywords: row.missing_keywords ?? null,
    strengths: row.strengths ?? null,
    suggestions: row.suggestions,
    coverLetter: row.cover_letter,
    createdAt: row.created_at,
  };
}

interface AppRow extends RowDataPacket {
  id: string;
  user_id: string;
  company_name: string | null;
  role_title: string | null;
  job_description: string | null;
  job_url: string | null;
  source: string | null;
  status: string;
  date_applied: Date | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  notes: string | null;
  location: string | null;
  remote: number;
  archived: number;
  has_analysis: number;
  created_at: Date;
  updated_at: Date;
}

function rowToApp(row: AppRow) {
  return {
    id: row.id,
    userId: row.user_id,
    companyName: row.company_name,
    roleTitle: row.role_title,
    jobDescription: row.job_description,
    jobUrl: row.job_url,
    source: row.source,
    status: row.status,
    dateApplied: row.date_applied
      ? new Date(row.date_applied).toISOString().split('T')[0]
      : null,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    currency: row.currency,
    notes: row.notes,
    location: row.location,
    remote: Boolean(row.remote),
    archived: Boolean(row.archived),
    hasAnalysis: Boolean(row.has_analysis),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Maps camelCase body keys to snake_case DB columns
const FIELD_MAP: Record<string, string> = {
  companyName: 'company_name',
  roleTitle: 'role_title',
  jobDescription: 'job_description',
  jobUrl: 'job_url',
  source: 'source',
  status: 'status',
  dateApplied: 'date_applied',
  salaryMin: 'salary_min',
  salaryMax: 'salary_max',
  currency: 'currency',
  notes: 'notes',
  location: 'location',
  remote: 'remote',
};

const router = express.Router();
router.use(requireAuth);

// GET /applications
router.get('/', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const [rows] = await pool.query<AppRow[]>(
      `SELECT a.*,
         EXISTS(SELECT 1 FROM ai_analyses aa WHERE aa.application_id = a.id) AS has_analysis
       FROM applications a
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC`,
      [userId]
    );
    res.json(rows.map(rowToApp));
  } catch {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET /applications/:id/status-history
router.get('/:id/status-history', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const [apps] = await pool.query<AppRow[]>(
      'SELECT id FROM applications WHERE id = ? AND user_id = ?',
      [req.params.id, userId]
    );
    if (apps.length === 0) return res.status(404).json({ error: 'Not found' });
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, old_status, new_status, changed_at FROM status_history WHERE application_id = ? ORDER BY changed_at ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch status history' });
  }
});

// GET /applications/:id/analysis
router.get('/:id/analysis', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const [apps] = await pool.query<AppRow[]>(
      'SELECT id FROM applications WHERE id = ? AND user_id = ?',
      [req.params.id, userId]
    );
    if (apps.length === 0) return res.status(404).json({ error: 'Not found' });

    const [rows] = await pool.query<AiRow[]>(
      'SELECT * FROM ai_analyses WHERE application_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(rows.map(rowToAnalysis));
  } catch {
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// POST /applications/:id/analyze
router.post('/:id/analyze', async (req, res) => {
  try {
    const userId = (req.user as any).id;

    const [apps] = await pool.query<AppRow[]>(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [req.params.id, userId]
    );
    if (apps.length === 0) return res.status(404).json({ error: 'Not found' });
    const app = apps[0];

    if (!app.job_description) {
      return res.status(400).json({ error: 'No job description — paste one and save first.' });
    }

    const [users] = await pool.query<UserRow[]>(
      'SELECT display_name, headline, location, resume_text FROM users WHERE id = ?',
      [userId]
    );
    const user = users[0];

    const [workRows] = await pool.query<WorkRow[]>(
      'SELECT company, title, start_date, end_date, current_role, description FROM work_experience WHERE user_id = ? ORDER BY display_order ASC',
      [userId]
    );
    const [skillRows] = await pool.query<SkillRow[]>(
      'SELECT name, category FROM skills WHERE user_id = ? ORDER BY display_order ASC',
      [userId]
    );
    const [projectRows] = await pool.query<ProjectRow[]>(
      'SELECT title, description, url FROM projects WHERE user_id = ? ORDER BY display_order ASC',
      [userId]
    );
    const [educationRows] = await pool.query<EducationRow[]>(
      'SELECT school, degree, field_of_study, start_date, end_date, current_student FROM education WHERE user_id = ? ORDER BY display_order ASC',
      [userId]
    );

    const hasStructured = workRows.length > 0 || skillRows.length > 0;
    let resumeContext: string;

    if (hasStructured) {
      const lines: string[] = [];

      if (user?.display_name) {
        lines.push(`Candidate: ${user.display_name}${user.headline ? ` — ${user.headline}` : ''}${user.location ? ` · ${user.location}` : ''}`);
      }

      if (workRows.length > 0) {
        lines.push('\nWork Experience:');
        for (const w of workRows) {
          const period = w.current_role
            ? `${w.start_date ?? '?'} – Present`
            : `${w.start_date ?? '?'} – ${w.end_date ?? '?'}`;
          lines.push(`  ${w.title ?? 'Role'} at ${w.company ?? 'Company'} (${period})`);
          if (w.description) lines.push(`    ${w.description}`);
        }
      }

      if (skillRows.length > 0) {
        const byCategory: Record<string, string[]> = {};
        for (const s of skillRows) {
          (byCategory[s.category] ??= []).push(s.name);
        }
        lines.push('\nSkills:');
        for (const [cat, names] of Object.entries(byCategory)) {
          lines.push(`  ${cat}: ${names.join(', ')}`);
        }
      }

      if (educationRows.length > 0) {
        lines.push('\nEducation:');
        for (const e of educationRows) {
          const period = e.current_student
            ? `${e.start_date ?? '?'} – Present`
            : `${e.start_date ?? '?'} – ${e.end_date ?? '?'}`;
          const label = [e.degree, e.field_of_study].filter(Boolean).join(' in ') || 'Degree';
          lines.push(`  ${label} — ${e.school ?? 'School'} (${period})`);
        }
      }

      if (projectRows.length > 0) {
        lines.push('\nProjects:');
        for (const p of projectRows) {
          lines.push(`  ${p.title ?? 'Project'}${p.url ? ` (${p.url})` : ''}`);
          if (p.description) lines.push(`    ${p.description}`);
        }
      }

      resumeContext = lines.join('\n');
    } else if (user?.resume_text) {
      resumeContext = user.resume_text;
    } else {
      return res.status(400).json({ error: 'No resume found — add one on your profile page.' });
    }

    const [countRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as cnt FROM ai_analyses WHERE application_id = ?',
      [req.params.id]
    );
    if ((countRows[0] as any).cnt >= 3) {
      return res.status(400).json({ error: 'Analysis limit reached — max 3 per application.' });
    }

    const raw = await analyzeResume(resumeContext, app.job_description);

    const id = uuidv4();
    await pool.query(
      `INSERT INTO ai_analyses (id, application_id, fit_score, verdict, missing_keywords, strengths, suggestions, cover_letter)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.params.id,
        raw.fitScore ?? null,
        raw.verdict ?? null,
        JSON.stringify(raw.missingKeywords ?? []),
        JSON.stringify(raw.strengths ?? []),
        raw.suggestions ?? null,
        raw.coverLetter ?? null,
      ]
    );

    const [rows] = await pool.query<AiRow[]>(
      'SELECT * FROM ai_analyses WHERE id = ?',
      [id]
    );
    res.json(rowToAnalysis(rows[0]));
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// GET /applications/:id
router.get('/:id', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const [rows] = await pool.query<AppRow[]>(
      `SELECT a.*,
         EXISTS(SELECT 1 FROM ai_analyses aa WHERE aa.application_id = a.id) AS has_analysis
       FROM applications a
       WHERE a.id = ? AND a.user_id = ?`,
      [req.params.id, userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rowToApp(rows[0]));
  } catch {
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// POST /applications
router.post('/', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const {
      companyName, roleTitle, jobDescription, jobUrl, source,
      status = 'saved', dateApplied, salaryMin, salaryMax,
      currency = 'USD', notes, location, remote = false,
    } = req.body;

    const id = uuidv4();
    await pool.query(
      `INSERT INTO applications
        (id, user_id, company_name, role_title, job_description, job_url, source,
         status, date_applied, salary_min, salary_max, currency, notes, location, remote)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, userId,
        companyName ?? null, roleTitle ?? null, jobDescription ?? null,
        jobUrl ?? null, source ?? null, status, dateApplied ?? null,
        salaryMin ?? null, salaryMax ?? null, currency,
        notes ?? null, location ?? null, remote ? 1 : 0,
      ]
    );

    await pool.query(
      'INSERT INTO status_history (id, application_id, old_status, new_status) VALUES (?, ?, ?, ?)',
      [uuidv4(), id, null, status]
    );

    const [rows] = await pool.query<AppRow[]>(
      `SELECT a.*, EXISTS(SELECT 1 FROM ai_analyses aa WHERE aa.application_id = a.id) AS has_analysis
       FROM applications a WHERE a.id = ?`,
      [id]
    );
    res.status(201).json(rowToApp(rows[0]));
  } catch {
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// PATCH /applications/:id
router.patch('/:id', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const [existing] = await pool.query<AppRow[]>(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [req.params.id, userId]
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Not found' });
    const old = existing[0];

    const setClauses: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [];

    for (const [jsKey, dbCol] of Object.entries(FIELD_MAP)) {
      if (jsKey in req.body) {
        let val = req.body[jsKey];
        if (jsKey === 'remote') val = val ? 1 : 0;
        setClauses.push(`${dbCol} = ?`);
        values.push(val ?? null);
      }
    }

    if (setClauses.length > 1) {
      values.push(req.params.id);
      await pool.query(
        `UPDATE applications SET ${setClauses.join(', ')} WHERE id = ?`,
        values
      );
    }

    const newStatus = req.body.status;
    if (newStatus && newStatus !== old.status) {
      await pool.query(
        'INSERT INTO status_history (id, application_id, old_status, new_status) VALUES (?, ?, ?, ?)',
        [uuidv4(), req.params.id, old.status, newStatus]
      );
      // Auto-set date_applied when transitioning to applied and none is set
      if (newStatus === 'applied' && !old.date_applied && !('dateApplied' in req.body)) {
        await pool.query(
          'UPDATE applications SET date_applied = CURDATE() WHERE id = ?',
          [req.params.id]
        );
      }
    }

    const [rows] = await pool.query<AppRow[]>(
      `SELECT a.*, EXISTS(SELECT 1 FROM ai_analyses aa WHERE aa.application_id = a.id) AS has_analysis
       FROM applications a WHERE a.id = ?`,
      [req.params.id]
    );
    res.json(rowToApp(rows[0]));
  } catch {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// PATCH /applications/:id/archive
router.patch('/:id/archive', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE applications SET archived = 1, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [req.params.id, userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to archive application' });
  }
});

// PATCH /applications/:id/unarchive
router.patch('/:id/unarchive', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE applications SET archived = 0, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [req.params.id, userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to unarchive application' });
  }
});

// DELETE /applications/:id
router.delete('/:id', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    // Block deletion if the application has AI analyses
    const [analyses] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM ai_analyses WHERE application_id = ? LIMIT 1',
      [req.params.id]
    );
    if (analyses.length > 0) {
      return res.status(409).json({ error: 'Cannot delete an application with AI analysis. Archive it instead.' });
    }
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM applications WHERE id = ? AND user_id = ?',
      [req.params.id, userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

export default router;
