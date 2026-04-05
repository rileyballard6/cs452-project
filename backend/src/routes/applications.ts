import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db';
import { requireAuth } from '../middleware/requireAuth';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

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
