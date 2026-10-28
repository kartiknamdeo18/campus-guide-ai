from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.models import Admin, FAQ, Document, DocumentChunk, UnansweredQuestion, CollegeEvent
from ..schemas.schemas import AdminLogin, Token, FAQCreate, FAQUpdate, FAQOut, DocumentOut, UnansweredQuestionOut
from ..security.auth import (
    verify_password,
    create_admin_token,
    get_current_admin,
    check_login_rate_limit,
    record_failed_login,
    reset_login_attempts
)
from ..services.faq_service import create_faq, update_faq, delete_faq
from ..services.document_service import process_document

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.post("/login", response_model=Token)
def admin_login(payload: AdminLogin, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    allowed, wait_secs = check_login_rate_limit(ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Please wait {wait_secs} seconds."
        )

    admin = db.query(Admin).filter(Admin.email == payload.email).first()
    if not admin or not verify_password(payload.password, admin.password_hash):
        record_failed_login(ip)
        raise HTTPException(status_code=401, detail="Invalid administrator credentials.")

    reset_login_attempts(ip)
    token = create_admin_token(admin.id, admin.email, admin.role)
    return Token(
        access_token=token,
        token_type="bearer",
        user={
            "id": admin.id,
            "username": admin.username,
            "email": admin.email,
            "role": admin.role
        }
    )

@router.get("/dashboard")
def get_dashboard_stats(current_admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    return {
        "stats": {
            "total_faqs": db.query(FAQ).count(),
            "verified_faqs": db.query(FAQ).filter(FAQ.is_verified == True).count(),
            "total_documents": db.query(Document).count(),
            "total_chunks": db.query(DocumentChunk).count(),
            "unanswered_questions": db.query(UnansweredQuestion).filter(UnansweredQuestion.review_status == "pending").count()
        },
        "recent_faqs": db.query(FAQ).limit(5).all(),
        "recent_documents": db.query(Document).limit(5).all(),
        "recent_unanswered": db.query(UnansweredQuestion).limit(5).all()
    }

@router.post("/faqs", response_model=FAQOut)
def api_create_faq(payload: FAQCreate, current_admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    return create_faq(db, payload)

@router.put("/faqs/{id}", response_model=FAQOut)
def api_update_faq(id: str, payload: FAQUpdate, current_admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    updated = update_faq(db, id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return updated

@router.delete("/faqs/{id}")
def api_delete_faq(id: str, current_admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    if not delete_faq(db, id):
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"success": True}

@router.post("/documents")
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form("General"),
    current_admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    try:
        doc, chunks = process_document(db, contents, file.filename, category)
        return {
            "message": "Document indexed successfully",
            "document": doc,
            "chunk_count": len(chunks)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/documents", response_model=dict)
def list_documents(current_admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    docs = db.query(Document).all()
    return {"documents": docs}

@router.delete("/documents/{id}")
def delete_document_api(id: str, current_admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return {"success": True}

@router.get("/unanswered-questions", response_model=dict)
def list_unanswered(current_admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    items = db.query(UnansweredQuestion).all()
    return {"questions": items}
