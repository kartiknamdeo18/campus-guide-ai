import time
from typing import Dict, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

# In-memory session store & rate limiting
active_tokens: Dict[str, Dict] = {}
login_attempts: Dict[str, Dict] = {}

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def check_login_rate_limit(ip: str) -> Tuple[bool, int]:
    record = login_attempts.get(ip)
    now = time.time()
    if record and record.get("blocked_until", 0) > now:
        return False, int(record["blocked_until"] - now)
    return True, 0

def record_failed_login(ip: str):
    now = time.time()
    rec = login_attempts.get(ip, {"count": 0, "blocked_until": 0})
    rec["count"] += 1
    if rec["count"] >= 5:
        rec["blocked_until"] = now + 900 # 15 minutes
        rec["count"] = 0
    login_attempts[ip] = rec

def reset_login_attempts(ip: str):
    login_attempts.pop(ip, None)

def create_admin_token(admin_id: str, email: str, role: str) -> str:
    import secrets
    token = f"cga_{secrets.token_hex(32)}"
    active_tokens[token] = {
        "admin_id": admin_id,
        "email": email,
        "role": role,
        "expires_at": time.time() + 86400
    }
    return token

def get_current_admin(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials"
        )
    session = active_tokens.get(credentials.credentials)
    if not session or session["expires_at"] < time.time():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token"
        )
    return session
