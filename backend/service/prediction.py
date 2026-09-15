import pandas as pd
import joblib
from pathlib import Path
import xgboost

BASE_DIR = Path(__file__).resolve().parent.parent

# Load new satellite-enriched model
MODEL_PATH = BASE_DIR / "model" / "salem_xgboost_satellite.joblib"
print("Loading Model:", MODEL_PATH)

try:
    loaded = joblib.load(MODEL_PATH)
    if isinstance(loaded, dict):
        model = loaded["model"]
        EXPECTED_FEATURES = loaded["features"]
    else:
        model = loaded
        EXPECTED_FEATURES = model.get_booster().feature_names
    print("Model loaded successfully!")
    print(f"Expected Features ({len(EXPECTED_FEATURES)}):", EXPECTED_FEATURES)
except Exception as e:
    print(f"Error loading model: {e}")
    model = None
    EXPECTED_FEATURES = []

def predict_groundwater(data: dict):
    if not model:
        return {"prediction": 0.0, "unit": "meters"}

    # Build input matching expected features
    input_data = {}
    for f in EXPECTED_FEATURES:
        val = data.get(f)
        input_data[f] = float(val) if val is not None else 0.0
        
    input_df = pd.DataFrame([input_data])
    
    try:
        prediction = model.predict(input_df)[0]
    except Exception as e:
        print(f"Prediction error: {e}")
        prediction = 0.0

    return {
        "prediction": float(prediction),
        "unit": "meters"
    }
