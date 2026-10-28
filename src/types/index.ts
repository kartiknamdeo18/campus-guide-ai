export interface FAQ {
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

export interface Document {
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

export interface ChatSource {
  title: string;
  reference: string;
  excerpt: string;
  category: string;
  page_or_section?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  is_grounded?: boolean;
  sources?: ChatSource[];
  department_contact?: string;
  isError?: boolean;
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

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface DashboardStats {
  total_faqs: number;
  verified_faqs: number;
  total_documents: number;
  total_chunks: number;
  total_categories: number;
  unanswered_questions: number;
  total_queries: number;
  fallback_count: number;
  last_updated: string;
}
