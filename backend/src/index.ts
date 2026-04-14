import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import authRouter from './routes/auth';
import applicationsRouter from './routes/applications';
import usersRouter from './routes/users';

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Required for Railway (and most cloud hosts) which sit behind a reverse proxy
app.set('trust proxy', 1);

app.use(cors({
  origin: (origin, callback) => {
    const allowed = process.env.CORS_ORIGIN || 'http://localhost:5173';
    // Allow the web app, the Chrome extension (any ID), and same-origin requests
    if (!origin || origin === allowed || origin.startsWith('chrome-extension://')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // Cross-domain cookies require sameSite:'none' + secure:true
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRouter);
app.use('/applications', applicationsRouter);
app.use('/users', usersRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
