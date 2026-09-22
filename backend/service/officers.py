from datetime import datetime, timezone

import bcrypt
from sqlalchemy import Column, DateTime, Integer, String

from backend.db import Base, SessionLocal, engine


class OfficerModel(Base):
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "district" | "block" | "agriculture" | "admin"
    assigned_block = Column(String, nullable=True)  # only set when role == "block"
    created_at = Column(DateTime(timezone=True), nullable=False)


Base.metadata.create_all(bind=engine)


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _check_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def _to_dict(row: OfficerModel) -> dict:
    return {
        "id": row.id,
        "username": row.username,
        "display_name": row.display_name,
        "role": row.role,
        "assigned_block": row.assigned_block,
        "created_at": row.created_at.isoformat(),
    }


def create_officer(username: str, password: str, display_name: str, role: str, assigned_block: str | None = None):
    now = datetime.now(timezone.utc)

    with SessionLocal() as session:
        row = OfficerModel(
            username=username.strip(),
            password_hash=_hash_password(password),
            display_name=display_name.strip(),
            role=role,
            assigned_block=assigned_block,
            created_at=now,
        )
        session.add(row)
        session.commit()
        session.refresh(row)
        return _to_dict(row)


def list_officers():
    with SessionLocal() as session:
        rows = session.query(OfficerModel).order_by(OfficerModel.created_at.desc()).all()
        return [_to_dict(row) for row in rows]


def get_officer(officer_id: int):
    with SessionLocal() as session:
        row = session.get(OfficerModel, officer_id)
        return _to_dict(row) if row else None


def update_officer(officer_id: int, display_name: str | None = None, role: str | None = None, assigned_block: str | None = None):
    with SessionLocal() as session:
        row = session.get(OfficerModel, officer_id)
        if row is None:
            return None

        if display_name is not None:
            row.display_name = display_name.strip()
        if role is not None:
            row.role = role
            row.assigned_block = assigned_block if role == "block" else None
        elif assigned_block is not None:
            row.assigned_block = assigned_block

        session.commit()
        session.refresh(row)
        return _to_dict(row)


def delete_officer(officer_id: int) -> bool:
    with SessionLocal() as session:
        row = session.get(OfficerModel, officer_id)
        if row is None:
            return False
        session.delete(row)
        session.commit()
        return True


def verify_login(username: str, password: str):
    with SessionLocal() as session:
        row = session.query(OfficerModel).filter(OfficerModel.username == username.strip()).first()
        if row is None or not _check_password(password, row.password_hash):
            return None
        return _to_dict(row)


def username_exists(username: str) -> bool:
    with SessionLocal() as session:
        return session.query(OfficerModel).filter(OfficerModel.username == username.strip()).first() is not None
