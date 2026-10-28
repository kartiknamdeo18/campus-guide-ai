/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { CategoryCards } from './components/CategoryCards.tsx';
import { FAQExplorer } from './components/FAQExplorer.tsx';
import { EventsSection } from './components/EventsSection.tsx';
import { Chatbot } from './components/Chatbot.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AboutModal } from './components/AboutModal.tsx';
import { Footer } from './components/Footer.tsx';
import { api } from './services/api.ts';
import { FAQ, CollegeEvent } from './types/index.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [initialChatQuestion, setInitialChatQuestion] = useState<string>('');

  // Modals
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => !!localStorage.getItem('cg_admin_token'));

  // Load initial data
  const loadData = async () => {
    try {
      const [faqData, catData, eventData] = await Promise.all([
        api.getFAQs(),
        api.getCategories(),
        api.getEvents()
      ]);
      setFaqs(faqData.faqs);
      setCategories(catData.categories);
      setEvents(eventData.events);
    } catch (err) {
      console.error('[App] Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadData();
    setIsAdminLoggedIn(!!localStorage.getItem('cg_admin_token'));
  }, []);

  const handleStartChat = (query?: string) => {
    if (query) {
      setInitialChatQuestion(query);
    }
    setActiveTab('chat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    setActiveTab('faqs');
    setTimeout(() => {
      document.getElementById('college-faqs')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleAskCategory = (catName: string, samplePrompt: string) => {
    handleStartChat(samplePrompt);
  };

  const handleAskAIAboutFAQ = (question: string) => {
    handleStartChat(`Please explain in detail: "${question}"`);
  };

  const handleAskAIAboutEvent = (eventTitle: string) => {
    handleStartChat(`Can you give me all verified details, timing, and rules for "${eventTitle}"?`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <>
            <Hero
              onStartChat={handleStartChat}
              onExploreFAQs={() => {
                setActiveTab('faqs');
                setTimeout(() => {
                  document.getElementById('college-faqs')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
            />

            <CategoryCards
              onSelectCategory={handleSelectCategory}
              onAskCategory={handleAskCategory}
            />

            <FAQExplorer
              faqs={faqs}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categories={categories}
              onAskAIAboutFAQ={handleAskAIAboutFAQ}
            />

            <EventsSection
              events={events}
              onAskAIAboutEvent={handleAskAIAboutEvent}
            />
          </>
        )}

        {activeTab === 'chat' && (
          <div className="py-6">
            <div className="max-w-4xl mx-auto px-4 mb-4">
              <button
                onClick={() => setActiveTab('home')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1"
              >
                ← Back to Campus Portal
              </button>
            </div>
            <Chatbot
              initialQuestion={initialChatQuestion}
              onClearInitialQuestion={() => setInitialChatQuestion('')}
            />
          </div>
        )}

        {activeTab === 'faqs' && (
          <div className="py-6">
            <FAQExplorer
              faqs={faqs}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categories={categories}
              onAskAIAboutFAQ={handleAskAIAboutFAQ}
            />
          </div>
        )}

        {activeTab === 'events' && (
          <div className="py-6">
            <EventsSection
              events={events}
              onAskAIAboutEvent={handleAskAIAboutEvent}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        onSelectCategory={handleSelectCategory}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Admin Dashboard Modal */}
      {isAdminOpen && (
        <AdminDashboard
          onClose={() => {
            setIsAdminOpen(false);
            setIsAdminLoggedIn(!!localStorage.getItem('cg_admin_token'));
          }}
          onFAQUpdated={loadData}
        />
      )}

      {/* About Project Modal */}
      {isAboutOpen && (
        <AboutModal onClose={() => setIsAboutOpen(false)} />
      )}
    </div>
  );
}
