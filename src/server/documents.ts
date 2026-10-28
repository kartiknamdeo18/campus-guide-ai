import crypto from 'crypto';
import { createRequire } from 'module';
import { db } from './db.ts';
import { DocumentItem, DocumentChunk } from './types.ts';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export async function processUploadedDocument(
  fileBuffer: Buffer,
  originalName: string,
  category: string
): Promise<{ document: DocumentItem; chunks: DocumentChunk[] }> {
  // Validate file extension
  const ext = originalName.split('.').pop()?.toLowerCase();
  if (!ext || !['pdf', 'txt', 'csv'].includes(ext)) {
    throw new Error('Unsupported file type. Only PDF, TXT, and CSV files are permitted.');
  }

  // Validate size (max 10MB)
  if (fileBuffer.length > 10 * 1024 * 1024) {
    throw new Error('File size exceeds the 10MB limit.');
  }

  let extractedText = '';

  if (ext === 'pdf') {
    const pdfData = await pdfParse(fileBuffer);
    extractedText = pdfData.text || '';
  } else if (ext === 'txt' || ext === 'csv') {
    extractedText = fileBuffer.toString('utf-8');
  }

  if (!extractedText.trim()) {
    throw new Error('Could not extract any readable text from this document.');
  }

  // Normalize whitespace
  const normalizedText = extractedText.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ');

  const docId = 'doc-' + Date.now() + '-' + crypto.randomUUID().slice(0, 6);
  const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // Check for duplicate checksum
  const existingDocs = db.getDocuments();
  const duplicate = existingDocs.find(d => d.content_checksum === checksum);
  if (duplicate) {
    throw new Error(`A document with identical content already exists: "${duplicate.filename}"`);
  }

  // Chunking strategy: chunk by paragraphs or sections (~300-500 words per chunk)
  const chunks: DocumentChunk[] = [];
  const paragraphs = normalizedText.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  let currentChunkText = '';
  let chunkIndex = 1;
  let currentSection = 'General Overview';

  for (const para of paragraphs) {
    // Check if paragraph looks like a heading or chapter
    const headingMatch = para.match(/^(CHAPTER\s+\d+|SECTION\s+\d+|ARTICLE\s+\d+|[A-Z0-9\s]{4,30}:)/i);
    if (headingMatch) {
      currentSection = headingMatch[0].replace(/:$/, '').trim();
    }

    if ((currentChunkText + '\n\n' + para).length > 1200) {
      if (currentChunkText.trim().length > 0) {
        chunks.push({
          id: `chunk-${docId}-${chunkIndex}`,
          document_id: docId,
          document_filename: originalName,
          chunk_text: currentChunkText.trim(),
          section_title: currentSection,
          page_number: Math.ceil(chunkIndex / 2),
          category
        });
        chunkIndex++;
      }
      currentChunkText = para;
    } else {
      currentChunkText = currentChunkText ? currentChunkText + '\n\n' + para : para;
    }
  }

  if (currentChunkText.trim().length > 0) {
    chunks.push({
      id: `chunk-${docId}-${chunkIndex}`,
      document_id: docId,
      document_filename: originalName,
      chunk_text: currentChunkText.trim(),
      section_title: currentSection,
      page_number: Math.ceil(chunkIndex / 2),
      category
    });
  }

  const documentItem: DocumentItem = {
    id: docId,
    filename: originalName,
    category,
    file_type: ext as 'pdf' | 'txt' | 'csv',
    file_size: fileBuffer.length,
    upload_timestamp: new Date().toISOString(),
    processing_status: 'ready',
    content_checksum: checksum,
    chunk_count: chunks.length
  };

  db.addDocument(documentItem, chunks);

  return { document: documentItem, chunks };
}
