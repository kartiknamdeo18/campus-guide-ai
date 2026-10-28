import React from 'react';
import {
  Shield,
  LayoutDashboard,
  FileText,
  UploadCloud,
  HelpCircle,
  Calendar,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Check,
  X
} from 'lucide-react';
import { FAQ, Document, UnansweredQuestion, DashboardStats, AdminUser, CollegeEvent } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AdminDashboardProps {
  onClose: () => void;
  onFAQUpdated: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onFAQUpdated }) => {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean>(() => !!localStorage.getItem('cg_admin_token'));
  const [currentUser, setCurrentUser] = React.useState<AdminUser | null>(null);
  const [loginEmail, setLoginEmail] = React.useState('admin@campusguide.edu');
  const [loginPassword, setLoginPassword] = React.useState('AdminPass123!');
  const [loginError, setLoginError] = React.useState('');
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  // Tabs
  const [activeTab, setActiveTab] = React.useState<'overview' | 'faqs' | 'documents' | 'unanswered' | 'events'>('overview');

  // Dashboard Data
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [faqs, setFaqs] = React.useState<FAQ[]>([]);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [unanswered, setUnanswered] = React.useState<UnansweredQuestion[]>([]);
  const [events, setEvents] = React.useState<CollegeEvent[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // FAQ Modal / Form
  const [isEditingFAQ, setIsEditingFAQ] = React.useState(false);
  const [faqForm, setFaqForm] = React.useState<Partial<FAQ>>({
    question: '',
    answer: '',
    category: 'Admissions',
    language: 'en',
    is_verified: true,
    source_reference: 'Official University Handbook 2026',
    review_date: new Date().toISOString().split('T')[0]
  });
  const [editingFaqId, setEditingFaqId] = React.useState<string | null>(null);

  // Document Upload
  const [uploadCategory, setUploadCategory] = React.useState('General Regulations');
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = React.useState<{ text: string; isError?: boolean } | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  // Filter for admin FAQs
  const [faqSearch, setFaqSearch] = React.useState('');

  // Initial check & load
  React.useEffect(() => {
    if (isLoggedIn) {
      loadProfileAndData();
    }
  }, [isLoggedIn]);

  const loadProfileAndData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, dashRes, catRes, evRes] = await Promise.all([
        api.getAdminProfile().catch(() => null),
        api.getDashboardData(),
        api.getCategories(),
        api.getEvents()
      ]);

      if (profileRes) {
        setCurrentUser(profileRes.user);
      }
      setStats(dashRes.stats);
      setFaqs(dashRes.recent_faqs);
      setDocuments(dashRes.recent_documents);
      setUnanswered(dashRes.recent_unanswered);
      setCategories(catRes.categories);
      setEvents(evRes.events);

      // Load full FAQs
      const allFaqs = await api.getFAQs();
      setFaqs(allFaqs.faqs);

      // Load full documents
      const allDocs = await api.getDocuments();
      setDocuments(allDocs.documents);

      // Load full unanswered
      const allUnans = await api.getUnansweredQuestions();
      setUnanswered(allUnans.questions);
    } catch (err: any) {
      if (err.message?.includes('Unauthorized')) {
        setIsLoggedIn(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await api.loginAdmin(loginEmail, loginPassword);
      setCurrentUser(res.user);
      setIsLoggedIn(true);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await api.logoutAdmin();
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  // FAQ handlers
  const handleSaveFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqForm.question || !faqForm.answer) return;

    try {
      if (editingFaqId) {
        await api.updateFAQ(editingFaqId, faqForm);
      } else {
        await api.createFAQ(faqForm);
      }
      setIsEditingFAQ(false);
      setEditingFaqId(null);
      await loadProfileAndData();
      onFAQUpdated();
    } catch (err: any) {
      alert('Error saving FAQ: ' + err.message);
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this verified FAQ?')) return;
    try {
      await api.deleteFAQ(id);
      await loadProfileAndData();
      onFAQUpdated();
    } catch (err: any) {
      alert('Error deleting FAQ: ' + err.message);
    }
  };

  const handleOpenEditFAQ = (faq: FAQ) => {
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      language: faq.language,
      is_verified: faq.is_verified,
      source_reference: faq.source_reference,
      review_date: faq.review_date
    });
    setEditingFaqId(faq.id);
    setIsEditingFAQ(true);
  };

  const handleCreateFAQFromUnanswered = (q: UnansweredQuestion) => {
    setFaqForm({
      question: q.question_text,
      answer: '',
      category: q.category || 'Student Services',
      language: (q.language === 'hi' ? 'hi' : 'en') as 'en' | 'hi',
      is_verified: true,
      source_reference: 'Office of Student Services Verified Response',
      review_date: new Date().toISOString().split('T')[0]
    });
    setEditingFaqId(null);
    setIsEditingFAQ(true);
    setActiveTab('faqs');
  };

  // Document handlers
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadMessage(null);
    try {
      const res = await api.uploadDocument(uploadFile, uploadCategory);
      setUploadMessage({ text: `Document "${uploadFile.name}" indexed with ${res.chunk_count} search chunks!` });
      setUploadFile(null);
      await loadProfileAndData();
      onFAQUpdated();
    } catch (err: any) {
      setUploadMessage({ text: err.message, isError: true });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm('Delete document and all associated RAG index chunks?')) return;
    try {
      await api.deleteDocument(id);
      await loadProfileAndData();
      onFAQUpdated();
    } catch (err: any) {
      alert('Error deleting document: ' + err.message);
    }
  };

  const handleReindex = async (id: string) => {
    try {
      await api.reindexDocument(id);
      alert('Document re-indexed successfully.');
      await loadProfileAndData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Review Unanswered
  const handleReviewUnanswered = async (id: string, status: 'reviewed' | 'resolved') => {
    try {
      await api.reviewUnansweredQuestion(id, status);
      await loadProfileAndData();
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  // -------------------------------------------------------------
  // Render: LOGIN VIEW
  // -------------------------------------------------------------
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Administrator Console</h3>
                <p className="text-xs text-slate-500">Authorized College Staff Authentication</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs text-indigo-900">
              <strong>Demonstration Access:</strong>
              <div className="mt-1 font-mono text-[11px] text-slate-700">
                Email: <span className="font-semibold">admin@campusguide.edu</span>
                <br />
                Password: <span className="font-semibold">AdminPass123!</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors mt-2"
            >
              {isLoggingIn ? 'Verifying...' : 'Sign In as Administrator'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render: LOGGED IN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full h-[90vh] border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">CampusGuide Administrator Dashboard</h3>
                <span className="text-[10px] bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded-full font-medium">
                  {currentUser?.role || 'Superadmin'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logged in as {currentUser?.email || 'admin@campusguide.edu'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-slate-50 flex items-center gap-4 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview Metrics', icon: LayoutDashboard },
            { id: 'faqs', label: `Manage FAQs (${faqs.length})`, icon: FileText },
            { id: 'documents', label: `Documents & RAG (${documents.length})`, icon: UploadCloud },
            { id: 'unanswered', label: `Review Queue (${unanswered.filter(q => q.review_status === 'pending').length})`, icon: HelpCircle },
            { id: 'events', label: `Notices & Events (${events.length})`, icon: Calendar },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* TAB 1: OVERVIEW METRICS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Total FAQs
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    {stats?.total_faqs ?? faqs.length}
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>{stats?.verified_faqs ?? faqs.filter(f => f.is_verified).length} verified</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Indexed Documents
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    {stats?.total_documents ?? documents.length}
                  </div>
                  <div className="text-[11px] text-indigo-600 mt-1">
                    {stats?.total_chunks ?? 0} active search chunks
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Pending Review
                  </div>
                  <div className="text-2xl font-extrabold text-amber-600 tabular-nums">
                    {unanswered.filter(q => q.review_status === 'pending').length}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Student questions lacking evidence
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    AI Queries Handled
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    {stats?.total_queries ?? 0}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {stats?.fallback_count ?? 0} safe fallbacks triggered
                  </div>
                </div>
              </div>

              {/* Quick Action Strip */}
              <div className="bg-indigo-900 text-white rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold">Fast Knowledge Base Expansion</h4>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Upload official academic regulations, admission brochures, or add new verified FAQs.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFaqForm({
                        question: '',
                        answer: '',
                        category: 'Admissions',
                        language: 'en',
                        is_verified: true,
                        source_reference: 'College Administrative Circular 2026',
                        review_date: new Date().toISOString().split('T')[0]
                      });
                      setEditingFaqId(null);
                      setIsEditingFAQ(true);
                      setActiveTab('faqs');
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-indigo-900 bg-white hover:bg-indigo-50 rounded-lg transition-colors whitespace-nowrap"
                  >
                    + Add New FAQ
                  </button>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-600 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Upload Document
                  </button>
                </div>
              </div>

              {/* Recent Unanswered Preview */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Unanswered Questions Needing Verification</h4>
                  <button
                    onClick={() => setActiveTab('unanswered')}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    View All Queue →
                  </button>
                </div>

                {unanswered.filter(q => q.review_status === 'pending').length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    Review queue is clear! All student queries have verified answers in the knowledge base.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {unanswered.filter(q => q.review_status === 'pending').slice(0, 3).map(q => (
                      <div key={q.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between gap-3 text-xs">
                        <span className="font-medium text-slate-800">"{q.question_text}"</span>
                        <button
                          onClick={() => handleCreateFAQFromUnanswered(q)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded shrink-0"
                        >
                          Convert to Verified FAQ
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE FAQS */}
          {activeTab === 'faqs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Search FAQ records..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <button
                  onClick={() => {
                    setFaqForm({
                      question: '',
                      answer: '',
                      category: 'Admissions',
                      language: 'en',
                      is_verified: true,
                      source_reference: 'College Administrative Circular 2026',
                      review_date: new Date().toISOString().split('T')[0]
                    });
                    setEditingFaqId(null);
                    setIsEditingFAQ(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New FAQ</span>
                </button>
              </div>

              {/* FAQs Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                      <tr>
                        <th className="px-4 py-3">Question</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Lang</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Source Ref</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {faqs
                        .filter(f =>
                          !faqSearch ||
                          f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
                          f.answer.toLowerCase().includes(faqSearch.toLowerCase())
                        )
                        .map((f) => (
                          <tr key={f.id} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">
                              {f.question}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-indigo-700 font-medium">
                              {f.category}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap uppercase font-mono">
                              {f.language}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {f.is_verified ? (
                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Verified</span>
                                </span>
                              ) : (
                                <span className="text-amber-600 font-medium">Draft</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                              {f.source_reference}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                              <button
                                onClick={() => handleOpenEditFAQ(f)}
                                className="p-1 text-slate-500 hover:text-indigo-600"
                                title="Edit FAQ"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteFAQ(f.id)}
                                className="p-1 text-slate-500 hover:text-red-600"
                                title="Delete FAQ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS & RAG */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Upload Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-sm font-bold text-slate-900">Upload & Ingest College Documents for RAG</h4>
                <p className="text-xs text-slate-500">
                  Supported formats: <strong>PDF, TXT, CSV</strong> (up to 10MB). Text is automatically extracted, segmented into overlapping chunks, and indexed into the vector/keyword retrieval pipeline.
                </p>

                {uploadMessage && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      uploadMessage.isError
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleFileUpload} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Select Document File</label>
                    <input
                      type="file"
                      accept=".pdf,.txt,.csv"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      required
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      disabled={!uploadFile || isUploading}
                      className="w-full py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{isUploading ? 'Indexing...' : 'Index Document'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Indexed Documents Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Currently Indexed Knowledge Sources ({documents.length})
                  </h5>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                      <tr>
                        <th className="px-4 py-3">Filename</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Size</th>
                        <th className="px-4 py-3">Chunks</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {documents.map(doc => (
                        <tr key={doc.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {doc.filename}
                          </td>
                          <td className="px-4 py-3 text-indigo-700 font-medium">
                            {doc.category}
                          </td>
                          <td className="px-4 py-3 uppercase font-mono">
                            {doc.file_type}
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {(doc.file_size / 1024).toFixed(1)} KB
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                            {doc.chunk_count}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                              Active
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                            <button
                              onClick={() => handleReindex(doc.id)}
                              className="p-1 text-slate-500 hover:text-indigo-600"
                              title="Re-index Chunks"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1 text-slate-500 hover:text-red-600"
                              title="Delete Document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: UNANSWERED QUESTIONS REVIEW QUEUE */}
          {activeTab === 'unanswered' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                <strong>How the Review Queue Works:</strong> When a student asks a query that lacks sufficient evidence in the verified knowledge base, CampusGuide AI honestly admits it cannot verify the answer and logs the inquiry here. Administrators can draft an official answer, verify it, and publish it as a new official FAQ.
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                {unanswered.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No unanswered questions currently recorded in the queue.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                      <tr>
                        <th className="px-4 py-3">Student Question</th>
                        <th className="px-4 py-3">Language</th>
                        <th className="px-4 py-3">Recorded At</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {unanswered.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            "{item.question_text}"
                          </td>
                          <td className="px-4 py-3 uppercase font-mono">
                            {item.language || 'en'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                item.review_status === 'resolved'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : item.review_status === 'reviewed'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {item.review_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                            {item.review_status === 'pending' && (
                              <button
                                onClick={() => handleReviewUnanswered(item.id, 'reviewed')}
                                className="px-2 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
                              >
                                Mark Reviewed
                              </button>
                            )}
                            <button
                              onClick={() => handleCreateFAQFromUnanswered(item)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded"
                            >
                              Convert to FAQ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: EVENTS & NOTICES */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Official Notices & Circulars</h4>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {events.map(evt => (
                  <div key={evt.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-indigo-700">{evt.category}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">Ref: {evt.source}</span>
                      </div>
                      <h5 className="text-sm font-bold text-slate-900">{evt.title}</h5>
                      <p className="text-xs text-slate-600">{evt.description}</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (window.confirm('Remove this notice?')) {
                          await api.deleteEvent(evt.id);
                          await loadProfileAndData();
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal: Add / Edit FAQ */}
        {isEditingFAQ && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-900">
                  {editingFaqId ? 'Edit Verified College FAQ' : 'Create Verified College FAQ'}
                </h4>
                <button
                  onClick={() => setIsEditingFAQ(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFAQ} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Question (English)</label>
                  <input
                    type="text"
                    value={faqForm.question || ''}
                    onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value, language: 'en' })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Verified Answer</label>
                  <textarea
                    rows={4}
                    value={faqForm.answer || ''}
                    onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={faqForm.category || 'Admissions'}
                    onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value, language: 'en' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Source Reference</label>
                  <input
                    type="text"
                    value={faqForm.source_reference || ''}
                    onChange={(e) => setFaqForm({ ...faqForm, source_reference: e.target.value })}
                    required
                    placeholder="e.g. Academic Examination Regulations 2026, Rule 14.3"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingFAQ(false)}
                    className="px-3 py-2 text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    {editingFaqId ? 'Update FAQ' : 'Publish Verified FAQ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
