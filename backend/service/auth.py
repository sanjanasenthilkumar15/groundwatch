import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, Header, HTTPException

from backend.service.officers import get_officer

JWT_SECRET = os.environ.get("JWT_SECRET", "groundwatch-dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24 * 7


def create_token(officer: dict) -> str:
    payload = {
        "officer_id": officer["id"],
        "role": officer["role"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired session")


def get_current_officer(authorization: str | None = Header(default=None)) -> dict:
    """Requires a valid bearer token. Raises 401 if missing/invalid."""

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.removeprefix("Bearer ").strip()
    payload = decode_token(token)

    officer = get_officer(payload["officer_id"])
    if officer is None:
        raise HTTPException(status_code=401, detail="Officer account no longer exists")

    return officer


def get_optional_officer(authorization: str | None = Header(default=None)) -> dict | None:
    """Same as get_current_officer, but returns None instead of raising when no token is
    present. Used on endpoints the public can also reach (e.g. /risk-map), where an officer
    identity - if present - is only used to apply block-scoping."""

    if not authorization:
        return None
    return get_current_officer(authorization)


def require_admin(officer: dict = Depends(get_current_officer)) -> dict:
    if officer["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return officer
