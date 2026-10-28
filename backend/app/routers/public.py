from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas.schemas import ChatRequest, ChatResponse, FAQOut, EventOut
from ..services.retrieval_service import search_knowledge_base, detect_language
from ..services.gemma_service import gemma_service
from ..services.faq_service import get_faqs
from ..models.models import CollegeEvent, UnansweredQuestion

router = APIRouter(prefix="/api", tags=["Public"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CampusGuide AI FastAPI",
        "rag_active": True
    }

@router.post("/chat", response_model=ChatResponse)
def chat_with_campusguide(req: ChatRequest, db: Session = Depends(get_db)):
    lang = detect_language(req.question, req.language)
    evidence, score = search_knowledge_base(db, req.question, lang, limit=4)

    # Log unanswered if score is low
    if not evidence or score < 0.28:
        unans = UnansweredQuestion(
            id=f"uq-{req.question[:10]}",
            question_text=req.question,
            category=req.category or "Student Services",
            language=lang,
            review_status="pending"
        )
        db.add(unans)
        db.commit()

    return gemma_service.generate_answer(req.question, evidence, score, lang)

@router.get("/faqs", response_model=dict)
def list_faqs(
    category: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    faqs = get_faqs(db, category, language, search)
    return {"faqs": faqs, "total": len(faqs)}

@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    cats = [
        "Admissions", "Fees and Payments", "Scholarships", "Examinations",
        "Attendance", "Library", "Hostel and Transport", "Placements and Internships",
        "College Events", "Student Services"
    ]
    return {"categories": cats}

@router.get("/events", response_model=dict)
def list_events(db: Session = Depends(get_db)):
    events = db.query(CollegeEvent).filter(CollegeEvent.is_published == True).all()
    return {"events": events}
