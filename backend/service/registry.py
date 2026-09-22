from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String

from backend.db import Base, SessionLocal, engine


class SubscriberModel(Base):
    __tablename__ = "subscribers"

    phone = Column(String(10), primary_key=True)
    name = Column(String, nullable=False)
    area = Column(String, nullable=False)
    category = Column(String, nullable=False)
    email = Column(String, nullable=True)
    registered_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)


Base.metadata.create_all(bind=engine)


def normalize_phone(phone: str) -> str:
    return "".join(ch for ch in phone if ch.isdigit())[-10:]


def _to_dict(row: SubscriberModel) -> dict:
    return {
        "name": row.name,
        "phone": row.phone,
        "area": row.area,
        "category": row.category,
        "email": row.email,
        "registered_at": row.registered_at.isoformat(),
        "updated_at": row.updated_at.isoformat(),
    }


def register_subscriber(name: str, phone: str, area: str, category: str, email: str | None = None):
    phone_key = normalize_phone(phone)
    now = datetime.now(timezone.utc)

    with SessionLocal() as session:
        row = session.get(SubscriberModel, phone_key)

        if row:
            row.name = name.strip()
            row.area = area
            row.category = category
            row.email = (email or "").strip() or None
            row.updated_at = now
        else:
            row = SubscriberModel(
                phone=phone_key,
                name=name.strip(),
                area=area,
                category=category,
                email=(email or "").strip() or None,
                registered_at=now,
                updated_at=now,
            )
            session.add(row)

        session.commit()
        session.refresh(row)
        return _to_dict(row)


def find_subscriber_by_phone(phone: str):
    phone_key = normalize_phone(phone)

    with SessionLocal() as session:
        row = session.get(SubscriberModel, phone_key)
        return _to_dict(row) if row else None
