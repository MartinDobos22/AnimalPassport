import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import analyzeRouter from './routes/analyze';
import episodesRouter from './routes/episodes';
import extractTextRouter from './routes/extractText';
import foodSafetyRouter from './routes/foodSafety';
import interpretPassportRouter from './routes/interpretPassport';
import scanMedicationRouter from './routes/scanMedication';
import consentRouter from './routes/consent';
import petsRouter from './routes/pets';
import healthRouter from './routes/health';
import accountRouter from './routes/account';
import notificationsRouter from './routes/notifications';
import cronRouter from './routes/cron';
import authEmailsRouter from './routes/authEmails';
import articlesRouter from './routes/articles';
import reviewsRouter from './routes/reviews';
import myReviewRouter from './routes/myReview';
import analyticsRouter from './routes/analytics';
import adminRouter from './routes/admin';
import adminAiRouter from './routes/adminAi';
import { requireAdmin } from './middleware/requireAdmin';
import { errorHandler } from './middleware/errorHandler';
import { firebaseAuth } from './middleware/firebaseAuth';
import { ensureUser, ensureUserAllowBlocked } from './middleware/ensureUser';
import { requireAiQuota } from './middleware/aiQuota';
import { assertOpenAIConfigured } from './config/openai';
import { getSupabase } from './config/supabase';
import { logger } from './utils/logger';

dotenv.config();

// Fail-fast: bez OPENAI_API_KEY by všetky AI endpointy ticho vracali 502
// a deploy log by to neukázal. Radšej padnúť hneď pri štarte.
assertOpenAIConfigured();

const app = express();
const PORT = process.env.PORT ?? 3001;

// Za reverzným proxy (Render) — správne klientské IP pre rate-limiter.
app.set('trust proxy', 1);

// Middleware

const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsMiddleware = cors({
  origin: (origin, callback) => {
    // povol aj requests bez Origin (curl, health checks)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

app.use(corsMiddleware);
// Preflight pre všetky route používa rovnakú restrictive cors instanciu —
// bez tohto by `app.options('*', cors())` defaultne odpovedalo s wildcard origin.
app.options('*', corsMiddleware);

const frontendSources = allowedOrigins.length > 0 ? allowedOrigins : ["'self'"];
const isProduction = process.env.NODE_ENV === 'production';

app.use(
  helmet({
    // API beží na Renderi a frontend typicky na Netlify (CORS_ORIGIN).
    // Ak je frontend na rovnakom hoste, CORS_ORIGIN môže zostať prázdny a CSP
    // sa obmedzí na 'self'. Pri oddelenom fronte pridávame povolené origins,
    // aby prípadné same-server HTML/PWA odpovede mohli volať správny frontend/API host.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: [
          "'self'",
          ...frontendSources,
          'https://identitytoolkit.googleapis.com',
          'https://securetoken.googleapis.com',
          'https://*.googleapis.com',
          'https://*.supabase.co',
        ],
        fontSrc: ["'self'", 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://images.unsplash.com'],
        manifestSrc: ["'self'"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        workerSrc: ["'self'", 'blob:'],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Base64 attachments inflate payload size by roughly 33%, so keep a safer limit
// to avoid rejecting valid 5 MB uploads from the UI.
app.use(express.json({ limit: '15mb' }));

// Keep-alive cron na free-tier hostingu pinguje /api/health každých ~10 min.
// Bez tichého zoznamu by request log bol zaplavený a reálne udalosti by sa stratili.
// 4xx/5xx ale logujeme vždy, aby sme nestratili signál o outage.
const SILENT_REQUEST_LOG_PATHS = new Set(['/api/health', '/api/ready']);

app.use((req, res, next) => {
  const startTime = Date.now();
  const silent = SILENT_REQUEST_LOG_PATHS.has(req.path);

  if (!silent) {
    logger.info('Prichádzajúci request', {
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
    });
  }

  res.on('finish', () => {
    if (silent && res.statusCode < 400) return;
    logger.info('Request dokončený', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startTime,
    });
  });

  next();
});

// Rate limiting
const rateLimitedError = (message: string) => ({
  error: { message, code: 'RATE_LIMITED' },
});

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitedError('Príliš veľa požiadaviek, skús neskôr.'),
});

const aiHeavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitedError('Príliš veľa AI požiadaviek, skús o chvíľu.'),
});

// Verejný tracking — vyšší strop (view/scroll/klik počas čítania), ale chráni
// pred spamom jednej IP.
const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitedError('Príliš veľa požiadaviek, skús neskôr.'),
});

app.use('/api/', globalLimiter);

// Liveness probe (verejný, bez autentifikácie). Lacný ping — slúži aj ako
// keep-alive target pre externý cron na free-tier hostingoch (Render). NEČÍTA
// DB ani externé služby, aby cron nezvyšoval Supabase request count zbytočne.
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness probe — kontroluje že DB skutočne odpovedá. Použi na deploy gate
// alebo monitor (Pingdom/Better Uptime), NIE na keep-alive (každý hit ide do
// Supabase). 503 ak Supabase nedostupné; uptime monitor potom alertne reálny
// outage namiesto falošne-zeleného stavu z /health.
app.get('/api/ready', async (_req, res) => {
  const startedAt = Date.now();
  try {
    const { error } = await getSupabase().from('users').select('id').limit(1);
    if (error) throw error;
    res.json({
      status: 'ready',
      checks: { database: 'ok' },
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    logger.warn('Readiness check zlyhal', { message });
    res.status(503).json({
      status: 'unavailable',
      checks: { database: 'fail' },
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  }
});

// Cron endpoint — autentifikuje sa shared secretom (x-cron-secret), nie Firebase tokenom.
// Preto musí byť PRED firebaseAuth.
app.use('/api/cron', cronRouter);

// /api/auth/* — auth-related endpointy. Per-route middleware (verifikácia
// vyžaduje token+gate-skip, password reset je úplne unauth). Definované v
// samotnom routeri kvôli prehľadu a flexibilite per endpoint.
app.use('/api/auth', authEmailsRouter);

// /api/articles — verejný read-only obsah poradne. Žiadny token (mountuje sa
// PRED firebaseAuth). Pokrytý globalLimiterom.
app.use('/api/articles', articlesRouter);

// /api/reviews — verejné schválené recenzie pre landing page (bez tokenu, PRED
// firebaseAuth). Zápis vlastnej recenzie ide cez /api/my-review (authed nižšie).
app.use('/api/reviews', reviewsRouter);

// /api/analytics — verejný tracking eventov z poradne (bez tokenu, PRED
// firebaseAuth). Vlastný rate limit proti spamu.
app.use('/api/analytics', analyticsLimiter, analyticsRouter);

// Všetky ostatné /api/ endpointy vyžadujú platný Firebase ID token + email verified gate
app.use('/api/', firebaseAuth());

// Routes
// AI generovanie článkov — admin only + AI rate limit + denný AI cap.
app.use('/api/admin/ai', aiHeavyLimiter, ensureUser, requireAiQuota(), requireAdmin, adminAiRouter);
app.use('/api/admin', ensureUser, adminRouter);
app.use('/api/pets', ensureUser, petsRouter);
app.use('/api/health', ensureUser, healthRouter);
// Zámerne ensureUserAllowBlocked: export dát, audit log a výmaz účtu sú
// GDPR práva, o ktoré používateľ nesmie prísť ani po zablokovaní účtu.
app.use('/api/account', ensureUserAllowBlocked, accountRouter);
app.use('/api/notifications', ensureUser, notificationsRouter);
app.use('/api/consent', ensureUser, consentRouter);
app.use('/api/my-review', ensureUser, myReviewRouter);
app.use('/api/analyze', aiHeavyLimiter, ensureUser, requireAiQuota(), analyzeRouter);
app.use('/api/episodes', aiHeavyLimiter, ensureUser, episodesRouter);
app.use('/api/extract-text', aiHeavyLimiter, ensureUser, requireAiQuota(), extractTextRouter);
app.use('/api/food-safety', aiHeavyLimiter, ensureUser, requireAiQuota(), foodSafetyRouter);
app.use(
  '/api/interpret-passport',
  aiHeavyLimiter,
  ensureUser,
  requireAiQuota(),
  interpretPassportRouter
);
app.use('/api/scan-medication', aiHeavyLimiter, ensureUser, requireAiQuota(), scanMedicationRouter);

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info('Pawly server spustený', { port: PORT });
});
