from pydantic import BaseModel, Field
from typing import Optional, List
import datetime

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=2)
    language: Optional[str] = "en"
    category: Optional[str] = None

class ChatSource(BaseModel):
    title: str
    reference: str
    excerpt: str
    category: str
    page_or_section: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    language: str
    is_grounded: bool
    model_used: str
    sources: List[ChatSource] = []
    department_contact: Optional[str] = None

class FAQBase(BaseModel):
    question: str
    answer: str
    category: str
    language: str = "en"
    is_verified: bool = True
    source_reference: Optional[str] = None
    review_date: Optional[str] = None

class FAQCreate(FAQBase):
    pass

class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    is_verified: Optional[bool] = None
    source_reference: Optional[str] = None
    review_date: Optional[str] = None

class FAQOut(FAQBase):
    id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class DocumentOut(BaseModel):
    id: str
    filename: str
    category: str
    file_type: str
    file_size: int
    upload_timestamp: datetime.datetime
    processing_status: str
    chunk_count: int

    class Config:
        from_attributes = True

class UnansweredQuestionOut(BaseModel):
    id: str
    question_text: str
    category: Optional[str] = None
    language: str
    timestamp: datetime.datetime
    review_status: str
    resolved_faq_id: Optional[str] = None

    class Config:
        from_attributes = True

class AdminLogin(BaseModel):
    email: str
    password: str

class AdminUserOut(BaseModel):
    id: str
    username: str
    email: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: AdminUserOut

class EventCreate(BaseModel):
    title: str
    description: str
    category: str
    start_date: str
    end_date: Optional[str] = None
    venue: Optional[str] = None
    registration_link: Optional[str] = None
    source: str
    is_published: bool = True

class EventOut(EventCreate):
    id: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True
