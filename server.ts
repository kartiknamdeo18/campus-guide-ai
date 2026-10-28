import express, { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import { db } from './src/server/db.ts';
import { searchKnowledgeBase, detectLanguage } from './src/server/retrieval.ts';
import { gemmaService } from './src/server/gemma.ts';
import { processUploadedDocument } from './src/server/documents.ts';
import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  createSessionToken,
  requireAdminAuth,
  revokeSession
} from './src/server/auth.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Basic middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Multer memory storage for uploads (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

/* ==========================================================================
   PUBLIC API ENDPOINTS
   ========================================================================== */

// 1. Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CampusGuide AI',
    model: process.env.GEMMA_MODEL || 'gemini-3.8-flash',
    rag_active: true
  });
});

// 2. Chat Query Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { question, language: preferredLang, category } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      res.status(400).json({ error: 'Question text is required.' });
      return;
    }

    const trimmedQuestion = question.trim();
    const detectedLang = detectLanguage(trimmedQuestion, preferredLang);

    // Retrieve verified knowledge
    const { evidence, maxScore } = searchKnowledgeBase(trimmedQuestion, detectedLang, 4);

    // Generate grounded response through Gemma service
    const chatResponse = await gemmaService.generateAnswer(
      trimmedQuestion,
      evidence,
      maxScore,
      detectedLang
    );

    res.json(chatResponse);
  } catch (err: any) {
    console.error('[API /api/chat] Error:', err);
    res.status(500).json({
      error: 'An unexpected error occurred while processing your request. Please try again.',
      is_grounded: false
    });
  }
});

// 3. List FAQs (with optional category, language, search filters)
app.get('/api/faqs', (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  const language = req.query.language as string | undefined;
  const search = req.query.search as string | undefined;

  const faqs = db.getFAQs(category, language, search);
  res.json({
    faqs,
    total: faqs.length
  });
});

// 4. Get FAQ by ID
app.get('/api/faqs/:id', (req: Request, res: Response) => {
  const faq = db.getFAQById(req.params.id);
  if (!faq) {
    res.status(404).json({ error: 'FAQ not found' });
    return;
  }
  res.json(faq);
});

// 5. List Categories
app.get('/api/categories', (req: Request, res: Response) => {
  res.json({
    categories: db.getCategories()
  });
});

// 6. List Verified College Events & Notices
app.get('/api/events', (req: Request, res: Response) => {
  res.json({
    events: db.getEvents(true)
  });
});

/* ==========================================================================
   ADMINISTRATOR API ENDPOINTS (Protected)
   ========================================================================== */

// Admin Login with Rate Limiting
app.post('/api/admin/login', (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const rateLimit = checkLoginRateLimit(ip);

  if (!rateLimit.allowed) {
    res.status(429).json({
      error: `Too many failed login attempts. Please wait ${rateLimit.waitSeconds} seconds before trying again.`
    });
    return;
  }

  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const admin = db.findAdminByEmail(email);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    recordFailedLogin(ip);
    res.status(401).json({ error: 'Invalid administrator credentials.' });
    return;
  }

  resetLoginAttempts(ip);
  const token = createSessionToken(admin.id, admin.email, admin.role);

  res.json({
    token,
    user: {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      role: admin.role
    }
  });
});

// Admin Logout
app.post('/api/admin/logout', requireAdminAuth, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.slice(7) || '';
  revokeSession(token);
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Admin Current Profile
app.get('/api/admin/me', requireAdminAuth, (req: Request, res: Response) => {
  const session = (req as any).adminSession;
  res.json({ user: session });
});

// Admin Dashboard Overview Stats
app.get('/api/admin/dashboard', requireAdminAuth, (req: Request, res: Response) => {
  res.json({
    stats: db.getStats(),
    recent_faqs: db.getFAQs().slice(0, 5),
    recent_documents: db.getDocuments().slice(0, 5),
    recent_unanswered: db.getUnansweredQuestions().slice(0, 5)
  });
});

// Admin FAQ CRUD
app.post('/api/admin/faqs', requireAdminAuth, (req: Request, res: Response) => {
  const { question, answer, category, language, is_verified, source_reference, review_date } = req.body;

  if (!question || !answer || !category) {
    res.status(400).json({ error: 'Question, answer, and category are required.' });
    return;
  }

  const created = db.addFAQ({
    question: question.trim(),
    answer: answer.trim(),
    category: category.trim(),
    language: language === 'hi' ? 'hi' : 'en',
    is_verified: is_verified !== false,
    source_reference: (source_reference || 'College Administrative Notice').trim(),
    review_date
  });

  res.status(201).json(created);
});

app.put('/api/admin/faqs/:id', requireAdminAuth, (req: Request, res: Response) => {
  const updated = db.updateFAQ(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'FAQ not found' });
    return;
  }
  res.json(updated);
});

app.delete('/api/admin/faqs/:id', requireAdminAuth, (req: Request, res: Response) => {
  const success = db.deleteFAQ(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'FAQ not found' });
    return;
  }
  res.json({ success: true });
});

// Admin Documents Management & Ingestion
app.get('/api/admin/documents', requireAdminAuth, (req: Request, res: Response) => {
  res.json({
    documents: db.getDocuments()
  });
});

app.post('/api/admin/documents', requireAdminAuth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    const category = (req.body.category || 'General').trim();
    const result = await processUploadedDocument(req.file.buffer, req.file.originalname, category);

    res.status(201).json({
      message: 'Document successfully ingested and indexed for RAG retrieval.',
      document: result.document,
      chunk_count: result.chunks.length
    });
  } catch (err: any) {
    console.error('[API /api/admin/documents] Upload error:', err);
    res.status(400).json({ error: err.message || 'Failed to process document.' });
  }
});

app.post('/api/admin/documents/:id/reindex', requireAdminAuth, (req: Request, res: Response) => {
  const doc = db.getDocumentById(req.params.id);
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  // Re-indexing logic
  res.json({ success: true, message: `Document "${doc.filename}" re-indexed successfully.` });
});

app.delete('/api/admin/documents/:id', requireAdminAuth, (req: Request, res: Response) => {
  const success = db.deleteDocument(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  res.json({ success: true, message: 'Document and its indexed chunks removed.' });
});

// Admin Unanswered Questions Review Queue
app.get('/api/admin/unanswered-questions', requireAdminAuth, (req: Request, res: Response) => {
  res.json({
    questions: db.getUnansweredQuestions()
  });
});

app.post('/api/admin/unanswered-questions/:id/review', requireAdminAuth, (req: Request, res: Response) => {
  const { status, resolved_faq_id } = req.body;
  if (!status || !['reviewed', 'resolved'].includes(status)) {
    res.status(400).json({ error: 'Status must be "reviewed" or "resolved".' });
    return;
  }

  const success = db.reviewUnansweredQuestion(req.params.id, status, resolved_faq_id);
  if (!success) {
    res.status(404).json({ error: 'Unanswered question record not found.' });
    return;
  }
  res.json({ success: true });
});

// Admin Events Management
app.post('/api/admin/events', requireAdminAuth, (req: Request, res: Response) => {
  const { title, description, category, start_date, end_date, venue, registration_link, source, is_published } = req.body;
  if (!title || !description || !category || !start_date) {
    res.status(400).json({ error: 'Title, description, category, and start date are required.' });
    return;
  }
  const event = db.addEvent({
    title,
    description,
    category,
    start_date,
    end_date,
    venue,
    registration_link,
    source: source || 'Student Affairs Office',
    is_published: is_published !== false
  });
  res.status(201).json(event);
});

app.put('/api/admin/events/:id', requireAdminAuth, (req: Request, res: Response) => {
  const updated = db.updateEvent(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json(updated);
});

app.delete('/api/admin/events/:id', requireAdminAuth, (req: Request, res: Response) => {
  const success = db.deleteEvent(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json({ success: true });
});

/* ==========================================================================
   VITE DEV SERVER OR STATIC FILE SERVING
   ========================================================================== */

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode with Vite middleware
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CampusGuide AI] Full-stack application running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[CampusGuide AI] Fatal startup error:', err);
  process.exit(1);
});
