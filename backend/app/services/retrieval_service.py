import re
from typing import List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from ..models.models import FAQ, DocumentChunk

EN_STOP_WORDS = {
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'about', 'what', 'where', 'when', 'how', 'why', 'who', 'which', 'can', 'i',
    'do', 'does', 'please', 'tell', 'me', 'college', 'student', 'university'
}

HI_STOP_WORDS = {
    'क्या', 'कहाँ', 'कब', 'कैसे', 'क्यों', 'कौन', 'है', 'हैं', 'था', 'थी', 'थे', 'में',
    'पर', 'से', 'को', 'के', 'की', 'का', 'लिए', 'और', 'या', 'कृपया', 'मुझे', 'बताएं'
}

def detect_language(text: str, requested_lang: str = "en") -> str:
    if requested_lang in ("hi", "en"):
        return requested_lang
    # Check for Devanagari script range
    if re.search(r'[\u0900-\u097F]', text):
        return "hi"
    return "en"

def tokenize(text: str, lang: str) -> List[str]:
    if lang == "hi":
        words = re.findall(r'[\u0900-\u097Fa-zA-Z0-9]+', text.lower())
        return [w for w in words if len(w) > 1 and w not in HI_STOP_WORDS]
    else:
        words = re.findall(r'[a-zA-Z0-9]+', text.lower())
        return [w for w in words if len(w) > 2 and w not in EN_STOP_WORDS]

def search_knowledge_base(db: Session, query: str, preferred_lang: str = "en", limit: int = 4) -> Tuple[List[Dict[str, Any]], float]:
    lang = detect_language(query, preferred_lang)
    tokens = tokenize(query, lang)
    raw_query = query.lower().strip()

    if not tokens and len(raw_query) < 3:
        return [], 0.0

    scored_results = []

    # 1. Search verified FAQs
    faqs = db.query(FAQ).filter(FAQ.is_verified == True).all()
    for faq in faqs:
        score = 0.0
        q_lower = faq.question.lower()
        a_lower = faq.answer.lower()
        cat_lower = faq.category.lower()

        if q_lower == raw_query or q_lower in raw_query or raw_query in q_lower:
            score += 1.5

        token_matches = 0
        for token in tokens:
            if token in q_lower:
                token_matches += 1
                score += 0.35
            elif token in a_lower:
                token_matches += 0.5
                score += 0.15
            if token in cat_lower:
                score += 0.2

        if faq.language == lang:
            score *= 1.25

        if tokens:
            score += (token_matches / len(tokens)) * 0.5

        if score >= 0.25:
            scored_results.append({
                "source_type": "faq",
                "title": faq.question,
                "reference": faq.source_reference or f"FAQ Ref #{faq.id}",
                "content": faq.answer,
                "category": faq.category,
                "score": score
            })

    # 2. Search Document Chunks
    chunks = db.query(DocumentChunk).all()
    for chunk in chunks:
        score = 0.0
        c_text = chunk.chunk_text.lower()
        s_title = (chunk.section_title or "").lower()

        token_matches = 0
        for token in tokens:
            if token in c_text:
                token_matches += 1
                score += 0.2
            if token in s_title:
                score += 0.35

        if tokens:
            score += (token_matches / len(tokens)) * 0.4

        if score >= 0.28:
            scored_results.append({
                "source_type": "document",
                "title": chunk.document_filename,
                "reference": f"{chunk.document_filename} ({chunk.section_title or f'Page {chunk.page_number}'})",
                "content": chunk.chunk_text,
                "category": chunk.category,
                "page_or_section": chunk.section_title or f"Page {chunk.page_number}",
                "score": score
            })

    scored_results.sort(key=lambda x: x["score"], reverse=True)
    top_results = scored_results[:limit]
    max_score = top_results[0]["score"] if top_results else 0.0

    return top_results, max_score
