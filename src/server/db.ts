import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  FAQItem,
  DocumentItem,
  DocumentChunk,
  AdminUser,
  UnansweredQuestion,
  CollegeEvent
} from './types.ts';

interface DatabaseSchema {
  faqs: FAQItem[];
  documents: DocumentItem[];
  document_chunks: DocumentChunk[];
  admins: AdminUser[];
  unanswered_questions: UnansweredQuestion[];
  events: CollegeEvent[];
  stats: {
    total_queries: number;
    fallback_count: number;
    last_updated: string;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'campusguide.json');

class DatabaseStore {
  private data: DatabaseSchema = {
    faqs: [],
    documents: [],
    document_chunks: [],
    admins: [],
    unanswered_questions: [],
    events: [],
    stats: {
      total_queries: 0,
      fallback_count: 0,
      last_updated: new Date().toISOString()
    }
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.error('[DB] Failed to load data file, initializing fresh:', err);
      this.seedInitialData();
      this.save();
    }
  }

  private save() {
    try {
      this.data.stats.last_updated = new Date().toISOString();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error writing to data file:', err);
    }
  }

  private seedInitialData() {
    console.log('[DB] Seeding initial verified campus data...');

    // 1. Seed Admin
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync('AdminPass123!', salt);
    const adminUser: AdminUser = {
      id: 'admin-' + crypto.randomUUID().slice(0, 8),
      username: 'admin',
      email: 'admin@campusguide.edu',
      password_hash,
      role: 'superadmin',
      status: 'active',
      created_at: new Date().toISOString()
    };
    this.data.admins = [adminUser];

    // 2. Seed FAQs from CSV
    const csvPath = path.resolve(process.cwd(), 'sample_data', 'sample_faqs.csv');
    if (fs.existsSync(csvPath)) {
      try {
        const content = fs.readFileSync(csvPath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        // Header: id,question,answer,category,language,is_verified,source_reference,review_date
        const faqs: FAQItem[] = [];

        // Simple CSV parser supporting quoted text
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const parts: string[] = [];
          let insideQuotes = false;
          let current = '';

          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
              parts.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          parts.push(current.trim());

          if (parts.length >= 8) {
            faqs.push({
              id: 'faq-' + parts[0],
              question: parts[1],
              answer: parts[2].replace(/^"|"$/g, ''),
              category: parts[3],
              language: 'en',
              is_verified: parts[5] === 'true',
              source_reference: parts[6].replace(/^"|"$/g, ''),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              review_date: parts[7]
            });
          }
        }

        this.data.faqs = faqs;
        console.log(`[DB] Loaded ${faqs.length} FAQs from sample_faqs.csv`);
      } catch (e) {
        console.error('[DB] Error parsing sample_faqs.csv:', e);
      }
    }

    // 3. Seed Document and Chunks
    const handbookPath = path.resolve(process.cwd(), 'sample_data', 'academic_regulations_handbook.txt');
    if (fs.existsSync(handbookPath)) {
      try {
        const text = fs.readFileSync(handbookPath, 'utf-8');
        const docId = 'doc-academic-handbook-2026';
        const docItem: DocumentItem = {
          id: docId,
          filename: 'academic_regulations_handbook.txt',
          category: 'Examinations',
          file_type: 'txt',
          file_size: Buffer.byteLength(text),
          upload_timestamp: new Date().toISOString(),
          processing_status: 'ready',
          content_checksum: crypto.createHash('sha256').update(text).digest('hex'),
          chunk_count: 0
        };

        // Chunk by chapter
        const chapters = text.split(/(?=CHAPTER \d+:)/g).filter(c => c.trim().length > 0);
        const chunks: DocumentChunk[] = [];
        chapters.forEach((chap, idx) => {
          const titleMatch = chap.match(/CHAPTER \d+:([^\n]+)/);
          const sectionTitle = titleMatch ? titleMatch[0].trim() : `Section ${idx + 1}`;
          chunks.push({
            id: `chunk-${docId}-${idx + 1}`,
            document_id: docId,
            document_filename: 'academic_regulations_handbook.txt',
            chunk_text: chap.trim(),
            section_title: sectionTitle,
            page_number: idx + 1,
            category: 'Examinations'
          });
        });

        docItem.chunk_count = chunks.length;
        this.data.documents = [docItem];
        this.data.document_chunks = chunks;
        console.log(`[DB] Ingested document with ${chunks.length} chunks`);
      } catch (e) {
        console.error('[DB] Error ingesting initial document:', e);
      }
    }

    // 4. Seed Verified College Events
    this.data.events = [
      {
        id: 'event-1',
        title: 'TechSparks 2026 — Annual Tech & Innovation Hackathon',
        description: 'A 36-hour inter-college hackathon featuring tracks in AI/ML, CleanTech, and FinTech. Industry mentorship and prizes worth INR 2,50,000.',
        category: 'College Events',
        start_date: '2026-11-18T09:00:00Z',
        end_date: '2026-11-20T18:00:00Z',
        venue: 'Main Campus Innovation Hub & OAT',
        registration_link: 'https://hackathon.campusguide.edu',
        source: 'Office of Student Affairs Notice No. 882',
        is_published: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'event-2',
        title: 'Odd Semester Examination Hall Ticket Download Window',
        description: 'Students who fulfill the mandatory 75% attendance criterion may download their hall tickets via Student ERP. Report discrepancies to Exam Counter 4.',
        category: 'Examinations',
        start_date: '2026-11-05T08:00:00Z',
        end_date: '2026-11-12T23:59:00Z',
        venue: 'Online ERP Portal / Controller of Examinations Block',
        source: 'COE Directive Ref: COE/2026/11-A',
        is_published: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'event-3',
        title: 'National & Institutional Scholarship Verification Desk',
        description: 'Special administrative counters for physical document verification of state and institutional scholarship schemes.',
        category: 'Scholarships',
        start_date: '2026-11-10T10:00:00Z',
        end_date: '2026-11-14T16:00:00Z',
        venue: 'Administrative Block, Counter 2 & 3',
        source: 'Dean of Student Welfare Bulletin',
        is_published: true,
        created_at: new Date().toISOString()
      }
    ];
  }

  // FAQ Methods
  getFAQs(category?: string, language?: string, search?: string): FAQItem[] {
    let result = [...this.data.faqs];
    if (category && category !== 'All') {
      result = result.filter(f => f.category.toLowerCase() === category.toLowerCase());
    }
    if (language && language !== 'all') {
      result = result.filter(f => f.language === language);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(f =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    }
    return result;
  }

  getFAQById(id: string): FAQItem | undefined {
    return this.data.faqs.find(f => f.id === id);
  }

  addFAQ(item: Omit<FAQItem, 'id' | 'created_at' | 'updated_at'>): FAQItem {
    const newFaq: FAQItem = {
      ...item,
      id: 'faq-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.faqs.unshift(newFaq);
    this.save();
    return newFaq;
  }

  updateFAQ(id: string, updates: Partial<FAQItem>): FAQItem | null {
    const idx = this.data.faqs.findIndex(f => f.id === id);
    if (idx === -1) return null;
    this.data.faqs[idx] = {
      ...this.data.faqs[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();
    return this.data.faqs[idx];
  }

  deleteFAQ(id: string): boolean {
    const initialLen = this.data.faqs.length;
    this.data.faqs = this.data.faqs.filter(f => f.id !== id);
    if (this.data.faqs.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Document & Chunk Methods
  getDocuments(): DocumentItem[] {
    return [...this.data.documents];
  }

  getDocumentById(id: string): DocumentItem | undefined {
    return this.data.documents.find(d => d.id === id);
  }

  addDocument(doc: DocumentItem, chunks: DocumentChunk[]): void {
    this.data.documents.unshift(doc);
    this.data.document_chunks.push(...chunks);
    this.save();
  }

  deleteDocument(id: string): boolean {
    const initialDocLen = this.data.documents.length;
    this.data.documents = this.data.documents.filter(d => d.id !== id);
    this.data.document_chunks = this.data.document_chunks.filter(c => c.document_id !== id);
    if (this.data.documents.length !== initialDocLen) {
      this.save();
      return true;
    }
    return false;
  }

  getChunks(): DocumentChunk[] {
    return [...this.data.document_chunks];
  }

  updateDocumentChunks(docId: string, chunks: DocumentChunk[]): void {
    this.data.document_chunks = this.data.document_chunks.filter(c => c.document_id !== docId);
    this.data.document_chunks.push(...chunks);
    const doc = this.data.documents.find(d => d.id === docId);
    if (doc) {
      doc.chunk_count = chunks.length;
      doc.processing_status = 'ready';
    }
    this.save();
  }

  // Categories
  getCategories(): string[] {
    const set = new Set<string>([
      'Admissions',
      'Fees and Payments',
      'Scholarships',
      'Examinations',
      'Attendance',
      'Library',
      'Hostel and Transport',
      'Placements and Internships',
      'College Events',
      'Student Services'
    ]);
    this.data.faqs.forEach(f => set.add(f.category));
    return Array.from(set);
  }

  // Events
  getEvents(isPublishedOnly = true): CollegeEvent[] {
    if (isPublishedOnly) {
      return this.data.events.filter(e => e.is_published);
    }
    return [...this.data.events];
  }

  addEvent(event: Omit<CollegeEvent, 'id' | 'created_at'>): CollegeEvent {
    const newEvent: CollegeEvent = {
      ...event,
      id: 'event-' + Date.now(),
      created_at: new Date().toISOString()
    };
    this.data.events.unshift(newEvent);
    this.save();
    return newEvent;
  }

  updateEvent(id: string, updates: Partial<CollegeEvent>): CollegeEvent | null {
    const idx = this.data.events.findIndex(e => e.id === id);
    if (idx === -1) return null;
    this.data.events[idx] = { ...this.data.events[idx], ...updates };
    this.save();
    return this.data.events[idx];
  }

  deleteEvent(id: string): boolean {
    const len = this.data.events.length;
    this.data.events = this.data.events.filter(e => e.id !== id);
    if (this.data.events.length !== len) {
      this.save();
      return true;
    }
    return false;
  }

  // Unanswered Questions Review Queue
  addUnansweredQuestion(text: string, category?: string, language?: string): UnansweredQuestion {
    const item: UnansweredQuestion = {
      id: 'uq-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      question_text: text,
      category: category || 'Student Services',
      language: language || 'en',
      timestamp: new Date().toISOString(),
      review_status: 'pending'
    };
    this.data.unanswered_questions.unshift(item);
    this.data.stats.fallback_count += 1;
    this.save();
    return item;
  }

  getUnansweredQuestions(): UnansweredQuestion[] {
    return [...this.data.unanswered_questions];
  }

  reviewUnansweredQuestion(id: string, status: 'reviewed' | 'resolved', faqId?: string): boolean {
    const item = this.data.unanswered_questions.find(q => q.id === id);
    if (!item) return false;
    item.review_status = status;
    if (faqId) item.resolved_faq_id = faqId;
    this.save();
    return true;
  }

  // Admin User
  findAdminByEmail(email: string): AdminUser | undefined {
    return this.data.admins.find(a => a.email.toLowerCase() === email.toLowerCase());
  }

  // Stats
  recordQuery(isFallback = false): void {
    this.data.stats.total_queries += 1;
    if (isFallback) {
      this.data.stats.fallback_count += 1;
    }
    this.save();
  }

  getStats() {
    return {
      total_faqs: this.data.faqs.length,
      verified_faqs: this.data.faqs.filter(f => f.is_verified).length,
      total_documents: this.data.documents.length,
      total_chunks: this.data.document_chunks.length,
      total_categories: this.getCategories().length,
      unanswered_questions: this.data.unanswered_questions.filter(q => q.review_status === 'pending').length,
      total_queries: this.data.stats.total_queries,
      fallback_count: this.data.stats.fallback_count,
      last_updated: this.data.stats.last_updated
    };
  }
}

export const db = new DatabaseStore();
