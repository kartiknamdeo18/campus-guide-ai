export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  language: 'en' | 'hi';
  is_verified: boolean;
  source_reference: string;
  created_at: string;
  updated_at: string;
  review_date?: string;
}

export interface DocumentItem {
  id: string;
  filename: string;
  category: string;
  file_type: 'pdf' | 'txt' | 'csv';
  file_size: number;
  upload_timestamp: string;
  processing_status: 'ready' | 'processing' | 'error';
  content_checksum: string;
  chunk_count: number;
  error_info?: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  document_filename: string;
  chunk_text: string;
  section_title?: string;
  page_number?: number;
  category: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'superadmin' | 'admin' | 'moderator';
  status: 'active' | 'suspended';
  created_at: string;
}

export interface UnansweredQuestion {
  id: string;
  question_text: string;
  category?: string;
  language?: string;
  timestamp: string;
  review_status: 'pending' | 'reviewed' | 'resolved';
  resolved_faq_id?: string;
}

export interface CollegeEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  start_date: string;
  end_date?: string;
  venue?: string;
  registration_link?: string;
  source: string;
  is_published: boolean;
  created_at: string;
}

export interface RetrievedEvidence {
  source_type: 'faq' | 'document';
  title: string;
  reference: string;
  content: string;
  category: string;
  score: number;
  page_or_section?: string;
}

export interface ChatResponse {
  answer: string;
  language: 'en' | 'hi';
  is_grounded: boolean;
  model_used: string;
  sources: Array<{
    title: string;
    reference: string;
    excerpt: string;
    category: string;
    page_or_section?: string;
  }>;
  suggested_followups?: string[];
  department_contact?: string;
}
