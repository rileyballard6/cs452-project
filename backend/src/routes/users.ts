import express from 'express';
import multer from 'multer';
import { pool } from '../db';
import { requireAuth } from '../middleware/requireAuth';
import type { RowDataPacket } from 'mysql2';
import { PDFParse } from 'pdf-parse';

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

interface UserRow extends RowDataPacket {
  id: string;
  google_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  resume_text: string | null;
  created_at: Date;
  last_login: Date;
}

function rowToUser(row: UserRow) {
  return {
    id: row.id,
    googleId: row.google_id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    resumeText: row.resume_text,
    createdAt: row.created_at,
    lastLogin: row.last_login,
  };
}

const router = express.Router();
router.use(requireAuth);

// PATCH /users/me
router.patch('/me', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { displayName, resumeText } = req.body;

    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (displayName !== undefined) {
      setClauses.push('display_name = ?');
      values.push(displayName ?? null);
    }
    if (resumeText !== undefined) {
      setClauses.push('resume_text = ?');
      values.push(resumeText ?? null);
    }

    if (setClauses.length > 0) {
      values.push(userId);
      await pool.query(
        `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`,
        values
      );
    }

    const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE id = ?', [userId]);
    res.json(rowToUser(rows[0]));
  } catch {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /users/me/resume
router.post('/me/resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const userId = (req.user as any).id;
    const parser = new PDFParse({ data: req.file.buffer });
    const parsed = await parser.getText();
    const resumeText = parsed.text?.trim() ?? '';
    await pool.query('UPDATE users SET resume_text = ? WHERE id = ?', [resumeText, userId]);
    const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE id = ?', [userId]);
    res.json(rowToUser(rows[0]));
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({ error: 'Failed to process resume' });
  }
});

export default router;
