"""One-off/idempotent seed script for demo Construction Project and Extraction
Request records (mock data — used to drive the Admin demo SMS/Email previews).

Run with: python -m backend.scripts.seed_case_records
Safe to re-run - skips seeding if rows already exist.
"""

from backend.service.case_records import (
    create_construction_project,
    construction_project_exists,
    create_extraction_request,
    extraction_request_exists,
)

CONSTRUCTION_PROJECTS = [
    dict(name="ABC Commercial Complex", block="Kullampatti", station="Kullampatti-01",
         applicant_name="ABC Constructions Pvt Ltd", current_gw=43.9, forecast_gw=6.1,
         risk_level="HIGH", confidence=84,
         contact_phone="+919876500001", contact_email="projects@abcconstructions.example.com"),
    dict(name="Sunrise Residency", block="Omalur", station="Amaram-01",
         applicant_name="Sunrise Builders Pvt Ltd", current_gw=41.2, forecast_gw=44.8,
         risk_level="HIGH", confidence=79,
         contact_phone="+919876500002", contact_email="site@sunrisebuilders.example.com"),
    dict(name="Metro Industrial Park", block="Mettur", station="Moolakadu-01",
         applicant_name="Metro Infra Developers", current_gw=38.5, forecast_gw=42.1,
         risk_level="HIGH", confidence=88,
         contact_phone="+919876500003", contact_email="ops@metroinfra.example.com"),
    dict(name="Green Valley Apartments", block="Vazhapadi", station="Mannarpalayam-01",
         applicant_name="Green Valley Housing Ltd", current_gw=36.7, forecast_gw=39.9,
         risk_level="HIGH", confidence=81,
         contact_phone="+919876500004", contact_email="contact@greenvalleyhousing.example.com"),
    dict(name="Sankari Textile Hub", block="Sankari", station="Manjakalpatti-01",
         applicant_name="Sankari Textiles Pvt Ltd", current_gw=45.3, forecast_gw=48.6,
         risk_level="HIGH", confidence=90,
         contact_phone="+919876500005", contact_email="admin@sankaritextiles.example.com"),
    dict(name="Kadambur Logistics Park", block="Gangavalli", station="Kadambur-01",
         applicant_name="Kadambur Logistics Pvt Ltd", current_gw=39.8, forecast_gw=43.2,
         risk_level="HIGH", confidence=76,
         contact_phone="+919876500006", contact_email="ops@kadamburlogistics.example.com"),
    dict(name="Attur Grand Mall", block="Attur", station="Ramanaickanpalayam-01",
         applicant_name="Attur Retail Ventures", current_gw=34.9, forecast_gw=37.5,
         risk_level="HIGH", confidence=83,
         contact_phone="+919876500007", contact_email="projects@atturretail.example.com"),
]

EXTRACTION_REQUESTS = [
    dict(applicant_name="ABC Industries", block="Omalur", purpose="Industrial",
         required_quantity="250 m³/day", existing_well=True, station="Amaram_1",
         current_gw=41.2, forecast_gw=44.8, risk_level="HIGH", confidence=88,
         contact_phone="+919876510001", contact_email="water@abcindustries.example.com"),
    dict(applicant_name="Kaveri Textiles Ltd", block="Sankari", purpose="Industrial",
         required_quantity="320 m³/day", existing_well=True, station="Manjakalpatti",
         current_gw=45.3, forecast_gw=48.6, risk_level="HIGH", confidence=90,
         contact_phone="+919876510002", contact_email="ops@kaveritextiles.example.com"),
    dict(applicant_name="Salem Cold Storage", block="Mettur", purpose="Commercial",
         required_quantity="150 m³/day", existing_well=False, station="Moolakadu",
         current_gw=38.5, forecast_gw=42.1, risk_level="HIGH", confidence=85,
         contact_phone="+919876510003", contact_email="admin@salemcoldstorage.example.com"),
    dict(applicant_name="Vazhapadi Dairy Farms", block="Vazhapadi", purpose="Agricultural",
         required_quantity="200 m³/day", existing_well=True, station="Mannarpalayam",
         current_gw=36.7, forecast_gw=39.9, risk_level="HIGH", confidence=80,
         contact_phone="+919876510004", contact_email="farm@vazhapadidairy.example.com"),
    dict(applicant_name="Gangavalli Bottling Co", block="Gangavalli", purpose="Industrial",
         required_quantity="400 m³/day", existing_well=True, station="Kadambur",
         current_gw=39.8, forecast_gw=43.2, risk_level="HIGH", confidence=77,
         contact_phone="+919876510005", contact_email="plant@gangavallibottling.example.com"),
    dict(applicant_name="Attur Construction Materials", block="Attur", purpose="Industrial",
         required_quantity="275 m³/day", existing_well=False, station="Ramanaickanpalayam",
         current_gw=34.9, forecast_gw=37.5, risk_level="HIGH", confidence=82,
         contact_phone="+919876510006", contact_email="supply@atturmaterials.example.com"),
    dict(applicant_name="Edappadi Spinning Mills", block="Edappadi", purpose="Industrial",
         required_quantity="350 m³/day", existing_well=True, station="Kullampatti",
         current_gw=43.9, forecast_gw=46.5, risk_level="HIGH", confidence=86,
         contact_phone="+919876510007", contact_email="mill@edappadispinning.example.com"),
]

if __name__ == "__main__":
    if construction_project_exists():
        print("skip: construction_projects already seeded")
    else:
        for spec in CONSTRUCTION_PROJECTS:
            row = create_construction_project(**spec)
            print(f"created construction project: {row['name']} (id={row['id']})")

    if extraction_request_exists():
        print("skip: extraction_requests already seeded")
    else:
        for spec in EXTRACTION_REQUESTS:
            row = create_extraction_request(**spec)
            print(f"created extraction request: {row['applicant_name']} (id={row['id']})")
