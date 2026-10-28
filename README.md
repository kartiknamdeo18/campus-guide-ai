# CampusGuide AI — Smart College FAQ Assistant

> **An evidence-grounded, multilingual AI assistant for college campuses powered by Google's Gemma 4 / Gemini model family, RAG (Retrieval-Augmented Generation), verified policy archives, and an administrative knowledge-base console.**

---

## 1. Problem Statement & Mission

College students often waste critical hours navigating fragmented departmental circulars, outdated bulletin boards, unstructured PDF handbooks, and informal messaging groups to find reliable answers about:
- **Scholarships & Financial Aid** eligibility, forms, and deadlines
- **Semester Examination** schedules, hall tickets, and re-evaluation rules
- **Attendance Mandates** (e.g. 75% rule) and medical condonation procedures
- **Fee Payment** gateways, installments, and receipts
- **Hostel Allocation** rules and bus transit routes
- **Library Facilities**, timings, book renewals, and study rooms
- **Placement & Internship** registration criteria
- **Official Notices & Events**

**CampusGuide AI** solves this problem by providing an interactive, bilingual (English & हिन्दी) assistant that retrieves verified official college records and answers queries with explicit source citations. Crucially, CampusGuide AI strictly obeys a **Zero-Hallucination Policy**: if a policy or fee cannot be verified in official records, it admits lack of evidence and routes students to authorized departmental desks while logging the inquiry for administrator review.

---

## 2. Key Architecture & Features

### A. Grounded Retrieval-Augmented Generation (RAG)
- **Document Ingestion Pipeline:** Supports **PDF**, **TXT**, and **CSV** uploads.
- **Semantic Text Segmentation:** Chunks uploaded documents with chapter/section recognition, page numbering, and category tags.
- **Deduplication:** SHA-256 content checksum prevents duplicate document indexing.
- **Relevance Scoring:** Computes BM25/keyword overlap scores with language affinity weighting and confidence thresholding ($>0.28$).
- **Source Attribution:** Every factual response lists source document names, FAQ IDs, page/section references, and excerpts.

### B. Gemma 4 / Gemini Model Integration
- Integrated via Google Gen AI TypeScript SDK (`@google/genai`) on the server.
- Uses strict system instructions forbidding fabricated rules, dates, or contact channels.
- Configurable model via `GEMMA_MODEL` (defaults to `gemini-3.8-flash` for high throughput and zero latency, compatible with `gemini-4-argon` and Gemma variants).
- Complete isolation: API keys are strictly server-side; zero secrets leaked to the client browser.

### C. Bilingual Intelligence (English & हिन्दी)
- Automatic Devanagari script detection (`[\u0900-\u097F]`) and user language selector (`English` / `हिन्दी`).
- Pre-seeded with 22 verified bilingual college FAQs covering all 10 core student domains.

### D. Full-Featured Student Web Portal
- **Top Bar Contract:** Wordmark brand, single-line links (`Home`, `Ask AI`, `College FAQs`, `Events & Notices`), primary action CTA.
- **Hero Showcase:** High-resolution campus imagery, direct natural language query box, trust markers.
- **10 Quick-Access Categories:** Admissions, Fees & Payments, Scholarships, Examinations, Attendance, Library, Hostel & Transport, Placements & Internships, College Events, Student Services.
- **Searchable FAQ Explorer:** Real-time text search, category filtering, language tabs, expandable answers with source references.
- **Official Noticeboard:** Approved notices with date ranges, venues, registration links, and reference circular numbers.
- **Interactive Chatbot:** User and assistant chat bubbles, suggested starter questions, copy-to-clipboard, retry on network error, typing indicator, and conversation reset.

### E. Administrator Dashboard
- **Secure Authentication:** Server-side token sessions, password hashing via `bcrypt`, and brute-force rate-limiting (5 failed attempts locks IP for 15 minutes).
- **Dashboard Overview Metrics:** Live counts for total FAQs, verified documents, active chunks, unanswered review queue, and total queries.
- **FAQ Management:** Full CRUD (Create, Read, Update, Delete) with verified toggle, language tags, and review dates.
- **Document Management:** Multi-file ingestion (PDF, TXT, CSV), chunk visualizer, re-indexing, and deletion.
- **Unanswered Questions Review Queue:** Inspect questions that triggered fallbacks, with one-click conversion into published verified FAQs.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Plus Jakarta Sans |
| **Full-Stack Server (Live Applet)** | Node.js, Express, tsx, multer, pdf-parse, bcryptjs, @google/genai |
| **Standalone Backend (Python Option)** | Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2, SQLite / PostgreSQL, pytest |
| **AI & Retrieval** | Google Gen AI SDK (`@google/genai`), RAG semantic chunking & scoring |
| **Storage** | SQLite / JSON ACID persistence with auto-seeding |

---

## 4. Project Structure

```
├── server.ts                       # Full-stack Express server with Vite middleware & API routes
├── index.html                      # HTML entry with metadata, OpenGraph & Plus Jakarta Sans
├── package.json                    # Full-stack scripts, dependencies, devDependencies
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite build configuration with path aliases
├── metadata.json                   # AI Studio applet metadata & major capabilities
├── .env.example                    # Environment variable template
├── src/
│   ├── main.tsx                    # React client entry point
│   ├── App.tsx                     # Main layout router and modal management
│   ├── index.css                   # Global Tailwind v4 theme & typography
│   ├── types/
│   │   └── index.ts                # Shared TypeScript type definitions
│   ├── services/
│   │   └── api.ts                  # Client API service with token authorization
│   ├── components/
│   │   ├── Navbar.tsx              # Top Bar Contract navigation & mobile menu
│   │   ├── Hero.tsx                # Hero section with query box & campus imagery
│   │   ├── CategoryCards.tsx       # 10 interactive college category cards
│   │   ├── FAQExplorer.tsx         # Searchable FAQ explorer with language tabs
│   │   ├── EventsSection.tsx       # Verified college noticeboard cards
│   │   ├── Chatbot.tsx             # Interactive RAG chatbot interface
│   │   ├── AdminDashboard.tsx      # Admin console (Metrics, FAQs, Docs, Queue)
│   │   ├── AboutModal.tsx          # Architecture & zero-hallucinations explanation
│   │   └── Footer.tsx              # Footer with campus support desk info
│   ├── server/
│   │   ├── db.ts                   # Database store & auto-seeding logic
│   │   ├── retrieval.ts            # RAG tokenizer, scoring & language detection
│   │   ├── gemma.ts                # Gemma AI service with strict system prompt
│   │   ├── documents.ts            # PDF, TXT, CSV parsing & chunking pipeline
│   │   ├── auth.ts                 # Bcrypt auth, sessions & rate limiting
│   │   └── types.ts                # Server-side TypeScript interfaces
│   └── assets/images/              # Generated high-fidelity campus visuals
├── backend/                        # Standalone Python FastAPI Backend
│   ├── requirements.txt            # Python dependencies (FastAPI, SQLAlchemy, etc.)
│   ├── .env.example                # Backend environment template
│   ├── app/
│   │   ├── main.py                 # FastAPI application & startup seeder
│   │   ├── config.py               # Pydantic Settings
│   │   ├── database.py             # SQLAlchemy sessionmaker & engine
│   │   ├── models/models.py        # FAQ, Document, Chunk, Admin, Event models
│   │   ├── schemas/schemas.py      # Request / Response schemas
│   │   ├── security/auth.py        # Token & rate-limiting utilities
│   │   ├── services/               # gemma_service, retrieval_service, document_service, faq_service
│   │   └── routers/                # public.py, admin.py
│   └── tests/
│       └── test_api.py             # Pytest test suite
├── sample_data/
│   ├── sample_faqs.csv             # 22 verified fictional college FAQs (EN & HI)
│   ├── academic_regulations_handbook.txt # Sample handbook for RAG testing
│   └── README.md                   # Sample data guide
└── tests/
    └── server.test.ts              # Automated test suite (9 test cases)
```

---

## 5. Local Setup & Execution Instructions

### A. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- Optional: **Python** 3.10+ (for standalone FastAPI testing)

### B. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
# Google Gen AI Key (injected automatically in AI Studio)
GEMINI_API_KEY="your_api_key_here"

# Model name (default gemini-3.8-flash for fast response)
GEMMA_MODEL="gemini-3.8-flash"

# Port (defaults to 3000)
PORT="3000"
```

### C. Running the Full-Stack Application (Interactive Web App)
```bash
# 1. Install dependencies
npm install

# 2. Start full-stack server (runs Express + RAG + Vite dev server on port 3000)
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### D. Administrator Demonstration Credentials
- **Email:** `admin@campusguide.edu`
- **Password:** `AdminPass123!`

---

## 6. Running Automated Tests

Run the built-in test suite:
```bash
npm test
```
**Test Coverage:**
1. `detectLanguage`: English vs. Hindi Devanagari detection
2. `db.init`: Database auto-seeding with 22 FAQs and parsed document chunks
3. `FAQ filtering`: Category isolation and language filtering
4. `RAG English`: Library operating hours search and score thresholding
5. `RAG Hindi`: Scholarship application inquiry matching in Hindi
6. `Out-of-domain fallback`: Space/astronomy question triggers honest non-hallucinated fallback
7. `Grounded sources`: Ensures references and excerpts are attached to verified answers
8. `Admin rate limiting`: Blocks IPs exceeding 5 failed login attempts for 15 minutes
9. `FAQ CRUD cycle`: Add, update, and delete integrity

---

## 7. Python FastAPI Backend (Standalone Option)

If running the Python FastAPI backend separately:
```bash
# 1. Navigate to backend and create virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 4. Run Pytest suite
pytest tests/test_api.py -v
```

---

## 8. Deployment Recommendations

1. **Hosting:** Deploy as a single container on **Google Cloud Run** or Docker.
2. **Persistent Storage:** For production scaling, configure Cloud SQL (PostgreSQL) or mount a persistent Cloud Storage volume for uploaded PDF documents.
3. **CORS & HTTPS:** Set `ALLOWED_ORIGINS` to your registered domain and enforce HTTPS.
4. **API Quotas & Billing:** Model requests to Gemini / Gemma use the Google Gen AI API; verify adequate project quota in Google Cloud Console.

---

## 9. Disclaimers & Limitations

- **Sample College Data:** All demonstration campus rules, phone extensions, room numbers, and dates are fictional templates designed for evaluation. College administrators can update them with verified university circulars at any time via the Admin Dashboard.
- **Model Grounding:** If external model connectivity is interrupted, the RAG engine seamlessly presents the verified source passage directly to the student without crashing.
