import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base, SessionLocal
from .models.models import Admin, CollegeEvent
from .security.auth import hash_password
from .services.faq_service import seed_sample_faqs_if_empty
from .routers import public, admin

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for CampusGuide AI — Smart College FAQ Assistant"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed initial admin and FAQs
@app.on_event("startup")
def startup_populate():
    db = SessionLocal()
    try:
        # Seed default admin if missing
        if not db.query(Admin).filter(Admin.email == "admin@campusguide.edu").first():
            default_admin = Admin(
                id="admin-root-01",
                username="admin",
                email="admin@campusguide.edu",
                password_hash=hash_password("AdminPass123!"),
                role="superadmin",
                status="active"
            )
            db.add(default_admin)
            db.commit()

        # Seed sample FAQs
        csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample_data", "sample_faqs.csv"))
        seed_sample_faqs_if_empty(db, csv_path)

        # Seed sample events if empty
        if db.query(CollegeEvent).count() == 0:
            sample_event = CollegeEvent(
                id="evt-demo-1",
                title="TechSparks 2026 Annual Hackathon",
                description="36-hour inter-college hackathon across AI, CleanTech, and Web3 tracks.",
                category="College Events",
                start_date="2026-11-18",
                end_date="2026-11-20",
                venue="Main Campus Auditorium",
                source="Student Affairs Circular #88"
            )
            db.add(sample_event)
            db.commit()
    finally:
        db.close()

# Include routers
app.include_router(public.router)
app.include_router(admin.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
