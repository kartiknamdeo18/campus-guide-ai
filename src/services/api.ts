import { FAQ, Document, CollegeEvent, ChatSource, UnansweredQuestion, DashboardStats, AdminUser } from '../types/index.ts';

const BASE_URL = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('cg_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // Public
  async checkHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  async askChatbot(question: string, language: 'en' | 'hi' = 'en', category?: string): Promise<{
    answer: string;
    language: 'en' | 'hi';
    is_grounded: boolean;
    model_used: string;
    sources: ChatSource[];
    department_contact?: string;
  }> {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, language, category })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to get answer from AI Assistant');
    }
    return res.json();
  },

  async getFAQs(category?: string, language?: string, search?: string): Promise<{ faqs: FAQ[]; total: number }> {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (language && language !== 'all') params.append('language', language);
    if (search) params.append('search', search);

    const res = await fetch(`${BASE_URL}/faqs?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch FAQs');
    return res.json();
  },

  async getCategories(): Promise<{ categories: string[] }> {
    const res = await fetch(`${BASE_URL}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async getEvents(): Promise<{ events: CollegeEvent[] }> {
    const res = await fetch(`${BASE_URL}/events`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  // Admin Auth
  async loginAdmin(email: string, password: string): Promise<{ token: string; user: AdminUser }> {
    const res = await fetch(`${BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid administrator credentials');
    }
    localStorage.setItem('cg_admin_token', data.token);
    return data;
  },

  async logoutAdmin(): Promise<void> {
    try {
      await fetch(`${BASE_URL}/admin/logout`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } finally {
      localStorage.removeItem('cg_admin_token');
    }
  },

  async getAdminProfile(): Promise<{ user: AdminUser }> {
    const res = await fetch(`${BASE_URL}/admin/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  },

  async getDashboardData(): Promise<{
    stats: DashboardStats;
    recent_faqs: FAQ[];
    recent_documents: Document[];
    recent_unanswered: UnansweredQuestion[];
  }> {
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load dashboard data');
    return res.json();
  },

  // Admin FAQs
  async createFAQ(faq: Partial<FAQ>): Promise<FAQ> {
    const res = await fetch(`${BASE_URL}/admin/faqs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(faq)
    });
    if (!res.ok) throw new Error('Failed to create FAQ');
    return res.json();
  },

  async updateFAQ(id: string, faq: Partial<FAQ>): Promise<FAQ> {
    const res = await fetch(`${BASE_URL}/admin/faqs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(faq)
    });
    if (!res.ok) throw new Error('Failed to update FAQ');
    return res.json();
  },

  async deleteFAQ(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/admin/faqs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete FAQ');
  },

  // Admin Documents
  async getDocuments(): Promise<{ documents: Document[] }> {
    const res = await fetch(`${BASE_URL}/admin/documents`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load documents');
    return res.json();
  },

  async uploadDocument(file: File, category: string): Promise<any> {
    const token = localStorage.getItem('cg_admin_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const res = await fetch(`${BASE_URL}/admin/documents`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to upload document');
    }
    return data;
  },

  async reindexDocument(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/admin/documents/${id}/reindex`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to reindex document');
  },

  async deleteDocument(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/admin/documents/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete document');
  },

  // Admin Unanswered Questions
  async getUnansweredQuestions(): Promise<{ questions: UnansweredQuestion[] }> {
    const res = await fetch(`${BASE_URL}/admin/unanswered-questions`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load review queue');
    return res.json();
  },

  async reviewUnansweredQuestion(id: string, status: 'reviewed' | 'resolved', resolved_faq_id?: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/admin/unanswered-questions/${id}/review`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, resolved_faq_id })
    });
    if (!res.ok) throw new Error('Failed to update question status');
  },

  // Admin Events
  async createEvent(event: Partial<CollegeEvent>): Promise<CollegeEvent> {
    const res = await fetch(`${BASE_URL}/admin/events`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(event)
    });
    if (!res.ok) throw new Error('Failed to create event');
    return res.json();
  },

  async updateEvent(id: string, event: Partial<CollegeEvent>): Promise<CollegeEvent> {
    const res = await fetch(`${BASE_URL}/admin/events/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(event)
    });
    if (!res.ok) throw new Error('Failed to update event');
    return res.json();
  },

  async deleteEvent(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/admin/events/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete event');
  }
};
