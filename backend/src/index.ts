import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
// app.use('/auth', require('./routes/auth'));
// app.use('/applications', require('./routes/applications'));
// app.use('/analyze', require('./routes/analyze'));
// app.use('/cover-letter', require('./routes/coverLetter'));
// app.use('/users', require('./routes/users'));
// app.use('/analytics', require('./routes/analytics'));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
