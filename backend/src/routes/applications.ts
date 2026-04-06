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
      'SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json(rows.map(rowToApp));
  } catch {
    res.status(500).json({ error: 'Failed to fetch applications' });
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
      'SELECT resume_text FROM users WHERE id = ?',
      [userId]
    );
    if (!users[0]?.resume_text) {
      return res.status(400).json({ error: 'No resume found — add one on your profile page.' });
    }

    const [countRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as cnt FROM ai_analyses WHERE application_id = ?',
      [req.params.id]
    );
    if ((countRows[0] as any).cnt >= 3) {
      return res.status(400).json({ error: 'Analysis limit reached — max 3 per application.' });
    }

    const raw = await analyzeResume(users[0].resume_text, app.job_description);

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
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
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

    const [rows] = await pool.query<AppRow[]>('SELECT * FROM applications WHERE id = ?', [id]);
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
    }

    const [rows] = await pool.query<AppRow[]>('SELECT * FROM applications WHERE id = ?', [req.params.id]);
    res.json(rowToApp(rows[0]));
  } catch {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// DELETE /applications/:id
router.delete('/:id', async (req, res) => {
  try {
    const userId = (req.user as any).id;
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
