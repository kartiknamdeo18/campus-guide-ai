import assert from 'assert';
import { db } from '../src/server/db.ts';
import { searchKnowledgeBase, detectLanguage } from '../src/server/retrieval.ts';
import { gemmaService } from '../src/server/gemma.ts';
import { checkLoginRateLimit, recordFailedLogin, resetLoginAttempts } from '../src/server/auth.ts';

async function runAllTests() {
  console.log('🧪 Starting CampusGuide AI Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    return Promise.resolve()
      .then(fn)
      .then(() => {
        console.log(`  ✅ PASS: ${name}`);
        passed++;
      })
      .catch((err) => {
        console.error(`  ❌ FAIL: ${name}\n     ${err.message}`);
        failed++;
      });
  }

  // 1. Language Detection Test
  await test('detectLanguage detects English and Hindi correctly', () => {
    assert.strictEqual(detectLanguage('What are library timings?'), 'en');
    assert.strictEqual(detectLanguage('लाइब्रेरी का समय क्या है?'), 'hi');
    assert.strictEqual(detectLanguage('When is the exam?', 'hi'), 'hi');
  });

  // 2. Database Initialization & Seed Data Test
  await test('Database initializes with verified FAQs and sample documents', () => {
    const faqs = db.getFAQs();
    assert.ok(faqs.length >= 20, `Expected at least 20 FAQs, got ${faqs.length}`);
    const docs = db.getDocuments();
    assert.ok(docs.length >= 1, `Expected at least 1 document, got ${docs.length}`);
    const chunks = db.getChunks();
    assert.ok(chunks.length >= 2, `Expected document chunks, got ${chunks.length}`);
  });

  // 3. FAQ Filtering by Category and Language
  await test('FAQ listing filters by category and language accurately', () => {
    const libraryFaqs = db.getFAQs('Library');
    assert.ok(libraryFaqs.length > 0, 'Library FAQs should exist');
    libraryFaqs.forEach(f => assert.strictEqual(f.category, 'Library'));

    const hindiFaqs = db.getFAQs(undefined, 'hi');
    assert.ok(hindiFaqs.length > 0, 'Hindi FAQs should exist');
    hindiFaqs.forEach(f => assert.strictEqual(f.language, 'hi'));
  });

  // 4. RAG Retrieval Engine Test - English Knowledge
  await test('RAG correctly retrieves verified library evidence for English query', () => {
    const { evidence, maxScore } = searchKnowledgeBase('What are the official library operating hours?', 'en');
    assert.ok(evidence.length > 0, 'Evidence should be retrieved');
    assert.ok(maxScore >= 0.3, `Score should be above threshold, got ${maxScore}`);
    assert.ok(evidence[0].content.includes('8:00 AM') || evidence[0].title.toLowerCase().includes('library'));
  });

  // 5. RAG Retrieval Engine Test - Hindi Knowledge
  await test('RAG correctly retrieves verified scholarship evidence for Hindi query', () => {
    const { evidence, maxScore } = searchKnowledgeBase('कॉलेज मेरिट स्कॉलरशिप के लिए कैसे आवेदन करें?', 'hi');
    assert.ok(evidence.length > 0, 'Hindi evidence should be retrieved');
    assert.ok(maxScore >= 0.3, `Score should be above threshold, got ${maxScore}`);
    assert.ok(evidence[0].content.includes('आवेदन') || evidence[0].category === 'Scholarships');
  });

  // 6. Unknown Question Honest Fallback Test
  await test('Out-of-domain question triggers honest fallback without guessing', async () => {
    const { evidence, maxScore } = searchKnowledgeBase('How do I build a spaceship to travel to Alpha Centauri?', 'en');
    const response = await gemmaService.generateAnswer(
      'How do I build a spaceship to travel to Alpha Centauri?',
      evidence,
      maxScore,
      'en'
    );
    assert.strictEqual(response.is_grounded, false, 'Out-of-domain query must NOT be marked grounded');
    assert.ok(
      response.answer.includes('cannot verify') || response.answer.includes('Student Services'),
      'Must admit failure to verify in official records'
    );
  });

  // 7. Grounded Answer with Source Reference Consistency
  await test('Grounded answer includes verified sources with excerpts and references', async () => {
    const { evidence, maxScore } = searchKnowledgeBase('What is the minimum attendance requirement?', 'en');
    const response = await gemmaService.generateAnswer(
      'What is the minimum attendance requirement?',
      evidence,
      maxScore,
      'en'
    );
    assert.strictEqual(response.is_grounded, true);
    assert.ok(response.sources.length > 0, 'Should return source references');
    assert.ok(response.sources[0].reference.length > 0, 'Source reference must not be empty');
    assert.ok(response.sources[0].excerpt.length > 0, 'Source excerpt must not be empty');
  });

  // 8. Admin Rate Limiting & Auth Logic
  await test('Admin rate limiting records attempts and enforces security', () => {
    const testIp = '192.168.1.99';
    resetLoginAttempts(testIp);
    assert.strictEqual(checkLoginRateLimit(testIp).allowed, true);

    // Simulate 5 failed attempts
    for (let i = 0; i < 5; i++) {
      recordFailedLogin(testIp);
    }
    const check = checkLoginRateLimit(testIp);
    assert.strictEqual(check.allowed, false, '5 failed attempts should trigger rate limit block');
    assert.ok((check.waitSeconds || 0) > 0);

    resetLoginAttempts(testIp);
    assert.strictEqual(checkLoginRateLimit(testIp).allowed, true);
  });

  // 9. FAQ Creation, Editing, Deletion Cycle
  await test('Admin FAQ CRUD operations maintain data integrity', () => {
    const newFaq = db.addFAQ({
      question: 'Where is the sports complex located?',
      answer: 'The indoor sports complex is adjacent to Hostel Block C.',
      category: 'Student Services',
      language: 'en',
      is_verified: true,
      source_reference: 'Campus Map & Facility Directory 2026'
    });
    assert.ok(newFaq.id.startsWith('faq-'));

    const updated = db.updateFAQ(newFaq.id, { answer: 'Updated answer for sports complex.' });
    assert.strictEqual(updated?.answer, 'Updated answer for sports complex.');

    const deleted = db.deleteFAQ(newFaq.id);
    assert.strictEqual(deleted, true);
    assert.strictEqual(db.getFAQById(newFaq.id), undefined);
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
