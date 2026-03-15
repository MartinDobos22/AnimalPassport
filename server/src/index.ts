import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analyzeRouter from './routes/analyze';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
// Base64 attachments inflate payload size by roughly 33%, so keep a safer limit
// to avoid rejecting valid 5 MB uploads from the UI.
app.use(express.json({ limit: '15mb' }));

// Routes
app.use('/api/analyze', analyzeRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🐕 GranuleCheck server beží na porte ${PORT}`);
});
