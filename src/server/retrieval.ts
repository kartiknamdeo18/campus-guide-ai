import { db } from './db.ts';
import { RetrievedEvidence, FAQItem, DocumentChunk } from './types.ts';

// Common stop words for English
const EN_STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'about', 'what', 'where', 'when', 'how', 'why', 'who', 'which', 'can', 'i',
  'do', 'does', 'please', 'tell', 'me', 'college', 'student', 'university'
]);

export function detectLanguage(_text?: string, _requestedLang?: string): 'en' {
  return 'en';
}

function tokenize(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !EN_STOP_WORDS.has(w));
  return words;
}

export function searchKnowledgeBase(
  query: string,
  _preferredLang: string = 'en',
  limit: number = 4
): { evidence: RetrievedEvidence[]; maxScore: number } {
  const queryTokens = tokenize(query);
  const rawQuery = query.toLowerCase().trim();

  const evidence: RetrievedEvidence[] = [];

  if (queryTokens.length === 0 && rawQuery.length < 3) {
    return { evidence: [], maxScore: 0 };
  }

  // 1. Search FAQs
  const allFaqs = db.getFAQs();
  for (const faq of allFaqs) {
    if (!faq.is_verified) continue;

    let score = 0;
    const faqQuestion = faq.question.toLowerCase();
    const faqAnswer = faq.answer.toLowerCase();
    const faqCategory = faq.category.toLowerCase();

    // Exact or near-exact match boost
    if (faqQuestion === rawQuery || faqQuestion.includes(rawQuery) || rawQuery.includes(faqQuestion)) {
      score += 1.5;
    }

    // Token matching
    let tokenMatches = 0;
    for (const token of queryTokens) {
      if (faqQuestion.includes(token)) {
        tokenMatches += 1;
        score += 0.35;
      } else if (faqAnswer.includes(token)) {
        tokenMatches += 0.5;
        score += 0.15;
      }
      if (faqCategory.includes(token)) {
        score += 0.2;
      }
    }

    // Relative match ratio
    if (queryTokens.length > 0) {
      const matchRatio = tokenMatches / queryTokens.length;
      score += matchRatio * 0.5;
    }

    if (score >= 0.25) {
      evidence.push({
        source_type: 'faq',
        title: faq.question,
        reference: faq.source_reference || `FAQ Ref #${faq.id}`,
        content: faq.answer,
        category: faq.category,
        score
      });
    }
  }

  // 2. Search Document Chunks
  const allChunks = db.getChunks();
  for (const chunk of allChunks) {
    let score = 0;
    const chunkText = chunk.chunk_text.toLowerCase();
    const sectionTitle = (chunk.section_title || '').toLowerCase();

    let tokenMatches = 0;
    for (const token of queryTokens) {
      if (chunkText.includes(token)) {
        tokenMatches += 1;
        score += 0.2;
      }
      if (sectionTitle.includes(token)) {
        score += 0.35;
      }
    }

    if (queryTokens.length > 0) {
      const matchRatio = tokenMatches / queryTokens.length;
      score += matchRatio * 0.4;
    }

    if (score >= 0.28) {
      evidence.push({
        source_type: 'document',
        title: chunk.document_filename,
        reference: `${chunk.document_filename} (${chunk.section_title || 'Section ' + (chunk.page_number || 1)})`,
        content: chunk.chunk_text,
        category: chunk.category,
        page_or_section: chunk.section_title || `Page ${chunk.page_number || 1}`,
        score
      });
    }
  }

  // Sort descending by score
  evidence.sort((a, b) => b.score - a.score);

  const topEvidence = evidence.slice(0, limit);
  const maxScore = topEvidence.length > 0 ? topEvidence[0].score : 0;

  return { evidence: topEvidence, maxScore };
}
