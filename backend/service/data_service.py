import pandas as pd
import math
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "Salem_ML_Ready_Satellite.csv"

print("Loading CSV...")
print("CSV path:", DATA_PATH)
df = pd.read_csv(DATA_PATH)
print("CSV loaded!")
print("Rows:", len(df))
print("Columns:", len(df.columns))

df["month"] = pd.to_datetime(df["month"])

BLOCKS_PATH = BASE_DIR / "data" / "station_blocks.csv"
_blocks_df = pd.read_csv(BLOCKS_PATH)
_station_block_map = {
    str(row["station"]).strip().lower(): str(row["block"]).strip()
    for _, row in _blocks_df.iterrows()
    if pd.notna(row["block"]) and str(row["block"]).strip()
}

def get_station_block(station_name: str):
    """Returns the block/taluk a station belongs to, or None if unassigned/unknown."""
    return _station_block_map.get(station_name.strip().lower())

def get_blocks():
    """Distinct list of blocks/taluks that have at least one assigned station."""
    return sorted(set(_station_block_map.values()))

def delta_toward_surface(earlier_raw: float, later_raw: float) -> float:
    """Sign-convention-agnostic 'improvement' delta between two raw depth
    readings taken at different times (earlier, then later).

    Positive means the water moved toward the surface (improving) between
    the two readings; negative means it moved away (declining/worsening).

    Almost all stations in this dataset store depth as a negative number
    (more negative = deeper), but a few (Amaram_1, Ammapet_1, Gundakkal)
    store it as positive instead. A plain `later - earlier` comparison
    silently inverts "declining" and "improving" for those stations. This
    compares magnitude-from-surface instead, which is correct either way.
    """
    return abs(earlier_raw) - abs(later_raw)

def safe_float(val, default=0.0):
    """Convert val to float; return default if None, NaN, or infinite."""
    if val is None:
        return default
    try:
        f = float(val)
        return default if (math.isnan(f) or math.isinf(f)) else f
    except (TypeError, ValueError):
        return default

def get_stations():
    return sorted(df["Station"].dropna().unique().tolist())

def get_station_data(station_name: str):
    station_df = df[df["Station"].str.lower() == station_name.lower()].copy()
    if station_df.empty: return None

    # Calculate on-the-fly features that training used
    station_df = station_df.sort_values("month")
    
    # Lag 1
    for col in ["ndvi", "lst_celsius", "et_mm", "soil_moisture"]:
        if col in station_df.columns:
            station_df[f"{col}_lag_1"] = station_df[col].shift(1)
            
    # Rolling 3 & Z-Score for NDVI
    if "ndvi" in station_df.columns:
        station_df["ndvi_rolling_3"] = station_df["ndvi"].rolling(3, min_periods=1).mean()
        ndvi_mean = station_df["ndvi"].mean()
        ndvi_std  = station_df["ndvi"].std()
        if ndvi_std and ndvi_std > 0:
            station_df["ndvi_zscore"] = (station_df["ndvi"] - ndvi_mean) / ndvi_std
        else:
            station_df["ndvi_zscore"] = 0.0

    latest = station_df.iloc[-1]

    # sf = nullable float (for display-only satellite fields shown in UI)
    def sf(val):
        return float(val) if pd.notna(val) else None

    return {
        "station": latest["Station"],
        "month": latest["month"].strftime("%Y-%m-%d"),
        "latitude":  sf(latest.get("latitude")),
        "longitude": sf(latest.get("longitude")),

        # Core numeric fields — must NEVER be None (used in math/comparisons)
        "current_groundwater": safe_float(latest.get("groundwater_level_m")),
        "rainfall_mm":    safe_float(latest.get("rainfall_mm"),  50.0),
        "gw_lag_1":       safe_float(latest.get("gw_lag_1")),
        "gw_lag_2":       safe_float(latest.get("gw_lag_2")),
        "gw_lag_3":       safe_float(latest.get("gw_lag_3")),
        "gw_rolling_3":   safe_float(latest.get("gw_rolling_3")),
        "gw_change_1m":   safe_float(latest.get("gw_change_1m")),
        "rain_lag_1":     safe_float(latest.get("rain_lag_1"),   50.0),
        "rain_lag_2":     safe_float(latest.get("rain_lag_2"),   50.0),
        "rain_lag_3":     safe_float(latest.get("rain_lag_3"),   50.0),
        "rain_rolling_3": safe_float(latest.get("rain_rolling_3"), 50.0),
        "month_num": int(latest["month_num"]) if pd.notna(latest.get("month_num")) else 1,
        "year":      int(latest["year"])      if pd.notna(latest.get("year"))      else 2024,

        # Satellite base — display only, may legitimately be None
        "ndvi":          sf(latest.get("ndvi")),
        "evi":           sf(latest.get("evi")),
        "lst_celsius":   sf(latest.get("lst_celsius")),
        "et_mm":         sf(latest.get("et_mm")),
        "soil_moisture": sf(latest.get("soil_moisture")),

        # Satellite engineered — model features, default to 0 if missing
        "ndvi_lag_1":         safe_float(latest.get("ndvi_lag_1")),
        "lst_lag_1":          safe_float(latest.get("lst_celsius_lag_1")),
        "et_lag_1":           safe_float(latest.get("et_mm_lag_1")),
        "soil_moisture_lag_1":safe_float(latest.get("soil_moisture_lag_1")),
        "ndvi_rolling_3":     safe_float(latest.get("ndvi_rolling_3")),
        "ndvi_zscore":        safe_float(latest.get("ndvi_zscore")),
    }

def get_station_reliability(station_name: str):
    station_df = df[df["Station"].str.lower() == station_name.lower()].copy()
    if station_df.empty: return None

    training_df = station_df[station_df["month"] <= pd.Timestamp("2024-12-01")]
    training_rows = len(training_df)

    if training_rows > 0:
        training_min = float(training_df["groundwater_level_m"].min())
        training_max = float(training_df["groundwater_level_m"].max())
    else:
        training_min = None
        training_max = None

    latest = station_df.sort_values("month").iloc[-1]
    current_groundwater = float(latest["groundwater_level_m"])

    outside_training_range = False
    if training_min is not None and training_max is not None:
        outside_training_range = (current_groundwater < training_min or current_groundwater > training_max)

    if training_rows < 5:
        reliability = "very_low"
    elif training_rows < 10 or outside_training_range:
        reliability = "low"
    else:
        reliability = "normal"

    return {
        "training_rows": training_rows,
        "training_groundwater_min": training_min,
        "training_groundwater_max": training_max,
        "current_groundwater": current_groundwater,
        "outside_training_range": outside_training_range,
        "reliability": reliability
    }
