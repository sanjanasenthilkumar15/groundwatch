from sqlalchemy import Boolean, Column, Float, Integer, String

from backend.db import Base, SessionLocal, engine
from backend.service.intelligence import generate_intelligence


class ConstructionProjectModel(Base):
    __tablename__ = "construction_projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    block = Column(String, nullable=False)
    station = Column(String, nullable=False)
    applicant_name = Column(String, nullable=False)
    current_gw = Column(Float, nullable=False)
    forecast_gw = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    confidence = Column(Integer, nullable=False)
    contact_phone = Column(String, nullable=False)
    contact_email = Column(String, nullable=True)
    # Set only for projects auto-created from a public "Construction Worker"
    # registration (keyed by phone, so re-registering updates rather than
    # duplicates). NULL for manually-seeded/admin-entered projects.
    source_phone = Column(String, nullable=True, unique=True)


class ExtractionRequestModel(Base):
    __tablename__ = "extraction_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    applicant_name = Column(String, nullable=False)
    block = Column(String, nullable=False)
    purpose = Column(String, nullable=False)
    required_quantity = Column(String, nullable=False)
    existing_well = Column(Boolean, nullable=False)
    station = Column(String, nullable=False)
    current_gw = Column(Float, nullable=False)
    forecast_gw = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    confidence = Column(Integer, nullable=False)
    contact_phone = Column(String, nullable=False)
    contact_email = Column(String, nullable=True)


Base.metadata.create_all(bind=engine)


def _project_to_dict(row: ConstructionProjectModel) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "block": row.block,
        "station": row.station,
        "applicant_name": row.applicant_name,
        "current_gw": row.current_gw,
        "forecast_gw": row.forecast_gw,
        "risk_level": row.risk_level,
        "confidence": row.confidence,
        "contact_phone": row.contact_phone,
        "contact_email": row.contact_email,
        "source": "registration" if row.source_phone else "manual",
    }


_RELIABILITY_CONFIDENCE = {"normal": 82, "low": 45, "very_low": 20}


def upsert_construction_project_from_registration(
    phone: str, name: str, station: str, contact_email: str | None, block: str | None
) -> dict | None:
    """Auto-create (or refresh, if this phone already registered before) a
    construction project case from a public Construction Worker registration,
    using that station's real live forecast data - not mock numbers."""

    intel = generate_intelligence(station)
    if intel["status"] == "error":
        return None

    forecast_1m = next(
        (f for f in intel["forecast"]["forecasts"] if f["horizon_months"] == 1),
        None
    )
    forecast_gw = forecast_1m["predicted_groundwater"] if forecast_1m else intel["prediction"]["next_month"]
    confidence = _RELIABILITY_CONFIDENCE.get(intel["reliability"]["reliability"], 50)

    values = dict(
        name=f"{station} Construction Site",
        block=block or station,
        station=station,
        applicant_name=name,
        current_gw=intel["current_status"]["groundwater"],
        forecast_gw=forecast_gw,
        risk_level=intel["risk"]["risk_level"],
        confidence=confidence,
        contact_phone=phone,
        contact_email=contact_email or None,
        source_phone=phone,
    )

    with SessionLocal() as session:
        row = session.query(ConstructionProjectModel).filter(ConstructionProjectModel.source_phone == phone).first()
        if row:
            for key, value in values.items():
                setattr(row, key, value)
        else:
            row = ConstructionProjectModel(**values)
            session.add(row)
        session.commit()
        session.refresh(row)
        return _project_to_dict(row)


def _request_to_dict(row: ExtractionRequestModel) -> dict:
    return {
        "id": row.id,
        "applicant_name": row.applicant_name,
        "block": row.block,
        "purpose": row.purpose,
        "required_quantity": row.required_quantity,
        "existing_well": row.existing_well,
        "station": row.station,
        "current_gw": row.current_gw,
        "forecast_gw": row.forecast_gw,
        "risk_level": row.risk_level,
        "confidence": row.confidence,
        "contact_phone": row.contact_phone,
        "contact_email": row.contact_email,
    }


def create_construction_project(**kwargs) -> dict:
    with SessionLocal() as session:
        row = ConstructionProjectModel(**kwargs)
        session.add(row)
        session.commit()
        session.refresh(row)
        return _project_to_dict(row)


def list_construction_projects() -> list[dict]:
    with SessionLocal() as session:
        rows = session.query(ConstructionProjectModel).order_by(ConstructionProjectModel.id).all()
        return [_project_to_dict(row) for row in rows]


def get_construction_project(project_id: int) -> dict | None:
    with SessionLocal() as session:
        row = session.get(ConstructionProjectModel, project_id)
        return _project_to_dict(row) if row else None


def construction_project_exists() -> bool:
    with SessionLocal() as session:
        return session.query(ConstructionProjectModel).first() is not None


def create_extraction_request(**kwargs) -> dict:
    with SessionLocal() as session:
        row = ExtractionRequestModel(**kwargs)
        session.add(row)
        session.commit()
        session.refresh(row)
        return _request_to_dict(row)


def create_extraction_request_live(
    applicant_name: str, purpose: str, required_quantity: str, existing_well: bool,
    station: str, contact_phone: str, contact_email: str | None, block: str | None
) -> dict | None:
    """Officer-logged extraction request: the officer supplies the case details
    (applicant, purpose, quantity, well status, contact), the groundwater
    numbers are pulled live from that station's real forecast - same pattern
    as upsert_construction_project_from_registration."""

    intel = generate_intelligence(station)
    if intel["status"] == "error":
        return None

    forecast_1m = next(
        (f for f in intel["forecast"]["forecasts"] if f["horizon_months"] == 1),
        None
    )
    forecast_gw = forecast_1m["predicted_groundwater"] if forecast_1m else intel["prediction"]["next_month"]
    confidence = _RELIABILITY_CONFIDENCE.get(intel["reliability"]["reliability"], 50)

    return create_extraction_request(
        applicant_name=applicant_name,
        block=block or station,
        purpose=purpose,
        required_quantity=required_quantity,
        existing_well=existing_well,
        station=station,
        current_gw=intel["current_status"]["groundwater"],
        forecast_gw=forecast_gw,
        risk_level=intel["risk"]["risk_level"],
        confidence=confidence,
        contact_phone=contact_phone,
        contact_email=contact_email or None,
    )


def list_extraction_requests() -> list[dict]:
    with SessionLocal() as session:
        rows = session.query(ExtractionRequestModel).order_by(ExtractionRequestModel.id).all()
        return [_request_to_dict(row) for row in rows]


def get_extraction_request(request_id: int) -> dict | None:
    with SessionLocal() as session:
        row = session.get(ExtractionRequestModel, request_id)
        return _request_to_dict(row) if row else None


def extraction_request_exists() -> bool:
    with SessionLocal() as session:
        return session.query(ExtractionRequestModel).first() is not None
