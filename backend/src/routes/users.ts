import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db';
import { requireAuth } from '../middleware/requireAuth';
import type { RowDataPacket } from 'mysql2';
import { PDFParse } from 'pdf-parse';
import { parseResume } from '../lib/openai';

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
  username: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  linkedin_url: string | null;
  twitter: string | null;
  portfolio_public: number;
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
    username: row.username,
    headline: row.headline,
    bio: row.bio,
    location: row.location,
    website: row.website,
    linkedinUrl: row.linkedin_url,
    twitter: row.twitter,
    portfolioPublic: Boolean(row.portfolio_public),
    createdAt: row.created_at,
    lastLogin: row.last_login,
  };
}

// MySQL DATE requires YYYY-MM-DD; month inputs give YYYY-MM
function toDate(val: string | null | undefined): string | null {
  if (!val) return null;
  return val.length === 7 ? `${val}-01` : val;
}

const router = express.Router();

// ─── Public routes (no auth) ─────────────────────────────────────────────────

// GET /users/u/:username
router.get('/u/:username', async (req, res) => {
  try {
    const [users] = await pool.query<UserRow[]>(
      'SELECT * FROM users WHERE username = ? AND portfolio_public = TRUE',
      [req.params.username]
    );
    if ((users as any[]).length === 0) return res.status(404).json({ error: 'Profile not found' });
    const user = users[0];

    const [workExperience] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM work_experience WHERE user_id = ? ORDER BY display_order ASC',
      [user.id]
    );
    const [skills] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM skills WHERE user_id = ? ORDER BY display_order ASC',
      [user.id]
    );
    const [projects] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM projects WHERE user_id = ? ORDER BY display_order ASC',
      [user.id]
    );
    for (const project of projects as any[]) {
      const [media] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM project_media WHERE project_id = ? ORDER BY display_order ASC',
        [project.id]
      );
      project.media = media;
    }

    res.json({
      displayName: user.display_name,
      avatarUrl:   user.avatar_url,
      headline:    user.headline,
      bio:         user.bio,
      location:    user.location,
      website:     user.website,
      linkedinUrl: user.linkedin_url,
      twitter:     user.twitter,
      workExperience,
      skills,
      projects,
    });
  } catch { res.status(500).json({ error: 'Failed to fetch profile' }); }
});

// ─── Authenticated routes ────────────────────────────────────────────────────
router.use(requireAuth);

// PATCH /users/me
router.patch('/me', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { displayName, resumeText, username, headline, bio, location, website, linkedinUrl, twitter, portfolioPublic } = req.body;

    const setClauses: string[] = [];
    const values: unknown[] = [];

    const strField = (col: string, val: unknown) => { setClauses.push(`${col} = ?`); values.push(val ?? null); };

    if (displayName      !== undefined) strField('display_name',     displayName);
    if (resumeText       !== undefined) strField('resume_text',      resumeText);
    if (username         !== undefined) strField('username',         username);
    if (headline         !== undefined) strField('headline',         headline);
    if (bio              !== undefined) strField('bio',              bio);
    if (location         !== undefined) strField('location',         location);
    if (website          !== undefined) strField('website',          website);
    if (linkedinUrl      !== undefined) strField('linkedin_url',     linkedinUrl);
    if (twitter          !== undefined) strField('twitter',          twitter);
    if (portfolioPublic  !== undefined) { setClauses.push('portfolio_public = ?'); values.push(portfolioPublic ? 1 : 0); }

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

    // Extract text from PDF
    const parser = new PDFParse({ data: req.file.buffer });
    const parsed = await parser.getText();
    const resumeText = parsed.text?.trim() ?? '';

    // Store raw text
    await pool.query('UPDATE users SET resume_text = ? WHERE id = ?', [resumeText, userId]);

    // AI parse into structured data
    const structured = await parseResume(resumeText);

    // Update headline/location/links if the AI found them
    const profileUpdates: string[] = [];
    const profileValues: unknown[] = [];
    if (structured.headline)  { profileUpdates.push('headline = ?');     profileValues.push(structured.headline); }
    if (structured.location)  { profileUpdates.push('location = ?');     profileValues.push(structured.location); }
    if (structured.website)   { profileUpdates.push('website = ?');      profileValues.push(structured.website); }
    if (structured.linkedin)  { profileUpdates.push('linkedin_url = ?'); profileValues.push(structured.linkedin); }
    if (structured.twitter)   { profileUpdates.push('twitter = ?');      profileValues.push(structured.twitter); }
    if (profileUpdates.length > 0) {
      profileValues.push(userId);
      await pool.query(`UPDATE users SET ${profileUpdates.join(', ')} WHERE id = ?`, profileValues);
    }

    // Replace work experience
    await pool.query('DELETE FROM work_experience WHERE user_id = ?', [userId]);
    for (let i = 0; i < structured.workExperience.length; i++) {
      const w = structured.workExperience[i];
      await pool.query(
        `INSERT INTO work_experience (id, user_id, company, title, start_date, end_date, current_role, description, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), userId, w.company, w.title, toDate(w.startDate), toDate(w.endDate), w.current ? 1 : 0, w.description, i]
      );
    }

    // Replace skills
    await pool.query('DELETE FROM skills WHERE user_id = ?', [userId]);
    for (let i = 0; i < structured.skills.length; i++) {
      const s = structured.skills[i];
      await pool.query(
        'INSERT INTO skills (id, user_id, name, category, display_order) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), userId, s.name, s.category, i]
      );
    }

    // Insert projects (don't replace — user may have added media/links manually)
    for (let i = 0; i < structured.projects.length; i++) {
      const p = structured.projects[i];
      await pool.query(
        `INSERT INTO projects (id, user_id, title, description, url, repo_url, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), userId, p.title, p.description, p.url ?? null, p.repoUrl ?? null, i]
      );
    }

    const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE id = ?', [userId]);
    res.json({ user: rowToUser(rows[0]), parsed: structured });
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({ error: 'Failed to process resume' });
  }
});

// ─── Work Experience ────────────────────────────────────────────────────────

// GET /users/me/work-experience
router.get('/me/work-experience', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM work_experience WHERE user_id = ? ORDER BY display_order ASC',
      [userId]
    );
    res.json(rows);
  } catch { res.status(500).json({ error: 'Failed to fetch work experience' }); }
});

// POST /users/me/work-experience
router.post('/me/work-experience', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { company, title, startDate, endDate, current, description, displayOrder } = req.body;
    const id = uuidv4();
    await pool.query(
      `INSERT INTO work_experience (id, user_id, company, title, start_date, end_date, current_role, description, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, company ?? null, title ?? null, toDate(startDate), toDate(endDate), current ? 1 : 0, description ?? null, displayOrder ?? 0]
    );
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM work_experience WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ error: 'Failed to create work experience' }); }
});

// PATCH /users/me/work-experience/:id
router.patch('/me/work-experience/:id', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { company, title, startDate, endDate, current, description, displayOrder } = req.body;
    await pool.query(
      `UPDATE work_experience SET company=?, title=?, start_date=?, end_date=?, current_role=?, description=?, display_order=?
       WHERE id = ? AND user_id = ?`,
      [company ?? null, title ?? null, toDate(startDate), toDate(endDate), current ? 1 : 0, description ?? null, displayOrder ?? 0, req.params.id, userId]
    );
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM work_experience WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Failed to update work experience' }); }
});

// DELETE /users/me/work-experience/:id
router.delete('/me/work-experience/:id', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    await pool.query('DELETE FROM work_experience WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to delete work experience' }); }
});

// ─── Skills ─────────────────────────────────────────────────────────────────

// GET /users/me/skills
router.get('/me/skills', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM skills WHERE user_id = ? ORDER BY display_order ASC',
      [userId]
    );
    res.json(rows);
  } catch { res.status(500).json({ error: 'Failed to fetch skills' }); }
});

// POST /users/me/skills
router.post('/me/skills', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { name, category, displayOrder } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO skills (id, user_id, name, category, display_order) VALUES (?, ?, ?, ?, ?)',
      [id, userId, name, category ?? 'other', displayOrder ?? 0]
    );
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM skills WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ error: 'Failed to create skill' }); }
});

// DELETE /users/me/skills/:id
router.delete('/me/skills/:id', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    await pool.query('DELETE FROM skills WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to delete skill' }); }
});

// ─── Projects ────────────────────────────────────────────────────────────────

// GET /users/me/projects
router.get('/me/projects', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const [projects] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM projects WHERE user_id = ? ORDER BY display_order ASC',
      [userId]
    );
    // Attach media to each project
    for (const project of projects as any[]) {
      const [media] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM project_media WHERE project_id = ? ORDER BY display_order ASC',
        [project.id]
      );
      project.media = media;
    }
    res.json(projects);
  } catch { res.status(500).json({ error: 'Failed to fetch projects' }); }
});

// POST /users/me/projects
router.post('/me/projects', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { title, description, url, repoUrl, displayOrder } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO projects (id, user_id, title, description, url, repo_url, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, userId, title ?? null, description ?? null, url ?? null, repoUrl ?? null, displayOrder ?? 0]
    );
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM projects WHERE id = ?', [id]);
    res.status(201).json({ ...(rows[0] as any), media: [] });
  } catch { res.status(500).json({ error: 'Failed to create project' }); }
});

// PATCH /users/me/projects/:id
router.patch('/me/projects/:id', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { title, description, url, repoUrl, displayOrder } = req.body;
    await pool.query(
      'UPDATE projects SET title=?, description=?, url=?, repo_url=?, display_order=? WHERE id = ? AND user_id = ?',
      [title ?? null, description ?? null, url ?? null, repoUrl ?? null, displayOrder ?? 0, req.params.id, userId]
    );
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    const [media] = await pool.query<RowDataPacket[]>('SELECT * FROM project_media WHERE project_id = ? ORDER BY display_order ASC', [req.params.id]);
    res.json({ ...(rows[0] as any), media });
  } catch { res.status(500).json({ error: 'Failed to update project' }); }
});

// DELETE /users/me/projects/:id
router.delete('/me/projects/:id', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    await pool.query('DELETE FROM projects WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to delete project' }); }
});

// POST /users/me/projects/:id/media
router.post('/me/projects/:id/media', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const [projects] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [req.params.id, userId]
    );
    if ((projects as any[]).length === 0) return res.status(404).json({ error: 'Not found' });
    const { type, url, caption, displayOrder } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO project_media (id, project_id, type, url, caption, display_order) VALUES (?, ?, ?, ?, ?, ?)',
      [id, req.params.id, type, url, caption ?? null, displayOrder ?? 0]
    );
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM project_media WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch { res.status(500).json({ error: 'Failed to add media' }); }
});

// DELETE /users/me/projects/:projectId/media/:mediaId
router.delete('/me/projects/:projectId/media/:mediaId', async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const [projects] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [req.params.projectId, userId]
    );
    if ((projects as any[]).length === 0) return res.status(404).json({ error: 'Not found' });
    await pool.query('DELETE FROM project_media WHERE id = ? AND project_id = ?', [req.params.mediaId, req.params.projectId]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to delete media' }); }
});

export default router;
