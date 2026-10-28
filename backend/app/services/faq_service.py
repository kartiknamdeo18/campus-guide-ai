import csv
import os
import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.models import FAQ
from ..schemas.schemas import FAQCreate, FAQUpdate

def seed_sample_faqs_if_empty(db: Session, csv_path: str):
    if db.query(FAQ).count() > 0:
        return

    if not os.path.exists(csv_path):
        return

    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            faq = FAQ(
                id=f"faq-{row.get('id', uuid.uuid4().hex[:6])}",
                question=row["question"],
                answer=row["answer"],
                category=row["category"],
                language=row.get("language", "en"),
                is_verified=row.get("is_verified", "true").lower() == "true",
                source_reference=row.get("source_reference", ""),
                review_date=row.get("review_date")
            )
            db.add(faq)
        db.commit()

def get_faqs(db: Session, category: Optional[str] = None, language: Optional[str] = None, search: Optional[str] = None) -> List[FAQ]:
    query = db.query(FAQ)
    if category and category != "All":
        query = query.filter(FAQ.category.ilike(category))
    if language and language != "all":
        query = query.filter(FAQ.language == language)
    if search:
        s = f"%{search}%"
        query = query.filter(FAQ.question.ilike(s) | FAQ.answer.ilike(s) | FAQ.category.ilike(s))
    return query.all()

def create_faq(db: Session, data: FAQCreate) -> FAQ:
    faq = FAQ(
        id=f"faq-{uuid.uuid4().hex[:8]}",
        **data.dict()
    )
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return faq

def update_faq(db: Session, faq_id: str, data: FAQUpdate) -> Optional[FAQ]:
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        return None
    for key, value in data.dict(exclude_unset=True).items():
        setattr(faq, key, value)
    db.commit()
    db.refresh(faq)
    return faq

def delete_faq(db: Session, faq_id: str) -> bool:
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        return False
    db.delete(faq)
    db.commit()
    return True
