import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.models.models import Admin, FAQ, DocumentChunk
from backend.app.security.auth import hash_password

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Seed admin
    admin = Admin(
        id="test-admin-1",
        username="admin",
        email="admin@campusguide.edu",
        password_hash=hash_password("AdminPass123!"),
        role="superadmin"
    )
    db.add(admin)

    # Seed test FAQ in English
    faq_en = FAQ(
        id="faq-test-1",
        question="What are the official library operating hours?",
        answer="The Central College Library operates Monday through Friday from 8:00 AM to 9:00 PM.",
        category="Library",
        language="en",
        is_verified=True,
        source_reference="Library Manual Section 2.1"
    )
    db.add(faq_en)

    # Seed test FAQ in Hindi
    faq_hi = FAQ(
        id="faq-test-2",
        question="कॉलेज लाइब्रेरी का समय क्या है?",
        answer="सेंट्रल कॉलेज लाइब्रेरी सोमवार से शुक्रवार सुबह 8:00 बजे से रात 9:00 बजे तक खुली रहती है।",
        category="Library",
        language="hi",
        is_verified=True,
        source_reference="लाइब्रेरी हैंडबुक धारा 2.1"
    )
    db.add(faq_hi)

    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["rag_active"] is True

def test_faq_listing_and_filtering():
    # All FAQs
    res = client.get("/api/faqs")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 2

    # Filter by category
    res_cat = client.get("/api/faqs?category=Library")
    assert res_cat.status_code == 200
    assert len(res_cat.json()["faqs"]) >= 1

    # Filter by language
    res_hi = client.get("/api/faqs?language=hi")
    assert res_hi.status_code == 200
    for f in res_hi.json()["faqs"]:
        assert f["language"] == "hi"

def test_chat_validation():
    # Empty question should fail validation
    res = client.post("/api/chat", json={"question": ""})
    assert res.status_code in (400, 422)

def test_chat_retrieval_english():
    res = client.post("/api/chat", json={
        "question": "What are the official library operating hours?",
        "language": "en"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["is_grounded"] is True
    assert "8:00 AM" in data["answer"] or "Library" in data["answer"]
    assert len(data["sources"]) > 0

def test_chat_retrieval_hindi():
    res = client.post("/api/chat", json={
        "question": "कॉलेज लाइब्रेरी का समय क्या है?",
        "language": "hi"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["is_grounded"] is True
    assert len(data["sources"]) > 0

def test_unknown_question_honest_fallback():
    # A totally out-of-domain question that does not exist in the knowledge base
    res = client.post("/api/chat", json={
        "question": "How do I build a nuclear fusion reactor on Mars?",
        "language": "en"
    })
    assert res.status_code == 200
    data = res.json()
    # Must decline or trigger fallback without guessing
    assert data["is_grounded"] is False
    assert "cannot verify" in data["answer"].lower() or "student services" in data["answer"].lower()

def test_unauthorized_admin_access():
    res = client.get("/api/admin/dashboard")
    assert res.status_code == 401

def test_admin_login_success():
    res = client.post("/api/admin/login", json={
        "email": "admin@campusguide.edu",
        "password": "AdminPass123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@campusguide.edu"

def test_admin_login_invalid_password():
    res = client.post("/api/admin/login", json={
        "email": "admin@campusguide.edu",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401
