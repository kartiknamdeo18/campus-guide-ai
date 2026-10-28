import hashlib
import uuid
import re
from typing import Tuple, List
from sqlalchemy.orm import Session
from ..models.models import Document, DocumentChunk

def process_document(
    db: Session,
    file_bytes: bytes,
    filename: str,
    category: str
) -> Tuple[Document, List[DocumentChunk]]:
    ext = filename.split(".")[-1].lower()
    if ext not in ("pdf", "txt", "csv"):
        raise ValueError("Unsupported file format. Only PDF, TXT, and CSV are permitted.")

    if len(file_bytes) > 10 * 1024 * 1024:
        raise ValueError("File exceeds 10MB maximum limit.")

    checksum = hashlib.sha256(file_bytes).hexdigest()
    if db.query(Document).filter(Document.content_checksum == checksum).first():
        raise ValueError(f"Document with identical content already exists.")

    text = ""
    if ext == "pdf":
        try:
            import pypdf
            import io
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            text = "\n".join([page.extract_text() or "" for page in reader.pages])
        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF: {e}")
    else:
        text = file_bytes.decode("utf-8", errors="ignore")

    normalized = re.sub(r'\s+', ' ', text).strip()
    if not normalized:
        raise ValueError("No readable text found in document.")

    doc_id = f"doc-{uuid.uuid4().hex[:8]}"
    doc = Document(
        id=doc_id,
        filename=filename,
        category=category,
        file_type=ext,
        file_size=len(file_bytes),
        content_checksum=checksum,
        processing_status="ready"
    )

    # Chunking: split into chunks of ~1000 characters
    chunks: List[DocumentChunk] = []
    chunk_size = 1000
    for idx in range(0, len(normalized), chunk_size):
        chunk_text = normalized[idx:idx + chunk_size + 150]
        chunk = DocumentChunk(
            id=f"chunk-{doc_id}-{len(chunks)+1}",
            document_id=doc_id,
            document_filename=filename,
            chunk_text=chunk_text,
            section_title=f"Section {len(chunks)+1}",
            page_number=(idx // chunk_size) + 1,
            category=category
        )
        chunks.append(chunk)

    doc.chunk_count = len(chunks)
    db.add(doc)
    db.add_all(chunks)
    db.commit()
    db.refresh(doc)

    return doc, chunks
