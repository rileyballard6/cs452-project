import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db';
import type { RowDataPacket } from 'mysql2';

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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const [rows] = await pool.query<UserRow[]>(
          'SELECT * FROM users WHERE google_id = ?',
          [profile.id]
        );

        if (rows.length > 0) {
          await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [rows[0].id]);
          return done(null, rows[0]);
        }

        const id = uuidv4();
        const email = profile.emails?.[0]?.value ?? '';
        const displayName = profile.displayName ?? null;
        const avatarUrl = profile.photos?.[0]?.value ?? null;

        await pool.query(
          'INSERT INTO users (id, google_id, email, display_name, avatar_url) VALUES (?, ?, ?, ?, ?)',
          [id, profile.id, email, displayName, avatarUrl]
        );

        const [newRows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE id = ?', [id]);
        return done(null, newRows[0]);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

passport.serializeUser((user: Express.User, done) => {
  done(null, (user as UserRow).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE id = ?', [id]);
    done(null, rows[0] ?? false);
  } catch (err) {
    done(err);
  }
});

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: (process.env.CORS_ORIGIN ?? 'http://localhost:5173') + '/?error=auth',
  }),
  (_req, res) => {
    res.redirect((process.env.CORS_ORIGIN ?? 'http://localhost:5173') + '/applications');
  }
);

router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json(null);
  const u = req.user as UserRow;
  res.json({
    id: u.id,
    googleId: u.google_id,
    email: u.email,
    displayName: u.display_name,
    avatarUrl: u.avatar_url,
    resumeText: u.resume_text,
    createdAt: u.created_at,
    lastLogin: u.last_login,
  });
});

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ ok: true });
  });
});

export default router;
