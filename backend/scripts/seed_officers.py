"""One-off/idempotent seed script for initial officer accounts.

Run with: python -m backend.scripts.seed_officers
Safe to re-run - skips any username that already exists.
"""

from backend.service.officers import create_officer, username_exists

SEED_OFFICERS = [
    dict(username="district_officer", password="District@123", display_name="Salem District Officer", role="district", assigned_block=None),
    dict(username="agri_officer",     password="Agri@123",     display_name="Salem Agriculture Officer", role="agriculture", assigned_block=None),
    dict(username="admin",            password="Admin@123",    display_name="GroundWatch Admin", role="admin", assigned_block=None),
    dict(username="block_omalur",     password="Omalur@123",   display_name="Omalur Block Officer", role="block", assigned_block="Omalur"),
    dict(username="block_edappadi",   password="Edappadi@123", display_name="Edappadi Block Officer", role="block", assigned_block="Edappadi"),
]

if __name__ == "__main__":
    for spec in SEED_OFFICERS:
        if username_exists(spec["username"]):
            print(f"skip (already exists): {spec['username']}")
            continue
        create_officer(**spec)
        print(f"created: {spec['username']} / role={spec['role']} block={spec['assigned_block']}")
