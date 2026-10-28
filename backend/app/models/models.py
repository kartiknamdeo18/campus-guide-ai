from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime
from ..database import Base

class FAQ(Base):
    __tablename__ = "faqs"

    id = Column(String, primary_key=True, index=True)
    question = Column(String, nullable=False, index=True)
    answer = Column(Text, nullable=False)
    category = Column(String, nullable=False, index=True)
    language = Column(String, default="en", index=True)
    is_verified = Column(Boolean, default=True)
    source_reference = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    review_date = Column(String, nullable=True)

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    category = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    upload_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    processing_status = Column(String, default="ready")
    content_checksum = Column(String, unique=True, index=True)
    chunk_count = Column(Integer, default=0)
    error_info = Column(Text, nullable=True)

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String, primary_key=True, index=True)
    document_id = Column(String, ForeignKey("documents.id"))
    document_filename = Column(String, nullable=False)
    chunk_text = Column(Text, nullable=False)
    section_title = Column(String, nullable=True)
    page_number = Column(Integer, default=1)
    category = Column(String, nullable=False)

    document = relationship("Document", back_populates="chunks")

class Admin(Base):
    __tablename__ = "admins"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="admin")
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class UnansweredQuestion(Base):
    __tablename__ = "unanswered_questions"

    id = Column(String, primary_key=True, index=True)
    question_text = Column(Text, nullable=False)
    category = Column(String, nullable=True)
    language = Column(String, default="en")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    review_status = Column(String, default="pending")
    resolved_faq_id = Column(String, nullable=True)

class CollegeEvent(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=True)
    venue = Column(String, nullable=True)
    registration_link = Column(String, nullable=True)
    source = Column(String, nullable=False)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    message_count = Column(Integer, default=0)
