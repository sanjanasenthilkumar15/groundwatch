import sys
import os

# Make the repo root importable so `from backend.xxx import ...` works
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app  # noqa: F401  — Vercel picks up `app` automatically
