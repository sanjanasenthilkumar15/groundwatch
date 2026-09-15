"""
GroundWatch — Retrain XGBoost with Satellite Features
"""
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

ROOT       = Path(__file__).resolve().parents[2]
SAT_CSV    = ROOT / "backend" / "data" / "Salem_ML_Ready_Satellite.csv"
NEW_MODEL  = ROOT / "backend" / "model" / "salem_xgboost_satellite.joblib"

def build_satellite_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values(["Station", "month"]).copy()
    for station in df["Station"].unique():
        mask = df["Station"] == station
        for col in ["ndvi", "lst_celsius", "et_mm", "soil_moisture"]:
            if col in df.columns:
                df.loc[mask, f"{col}_lag_1"] = df.loc[mask, col].shift(1)
        if "ndvi" in df.columns:
            df.loc[mask, "ndvi_rolling_3"] = df.loc[mask, "ndvi"].rolling(3, min_periods=1).mean()
            ndvi_mean = df.loc[mask, "ndvi"].mean()
            ndvi_std  = df.loc[mask, "ndvi"].std()
            if ndvi_std and ndvi_std > 0:
                df.loc[mask, "ndvi_zscore"] = (df.loc[mask, "ndvi"] - ndvi_mean) / ndvi_std
    return df

def run_retrain():
    df = pd.read_csv(SAT_CSV, parse_dates=["month"])
    df = build_satellite_features(df)

    BASE_FEATURES = [
        "groundwater_level_m", "rainfall_mm",
        "gw_lag_1", "gw_lag_2", "gw_lag_3", "gw_rolling_3", "gw_change_1m",
        "rain_lag_1", "rain_lag_2", "rain_lag_3", "rain_rolling_3",
        "month_num", "year",
    ]

    SAT_FEATURES = []
    for col in ["ndvi","evi","lst_celsius","et_mm","soil_moisture",
                "ndvi_lag_1","lst_lag_1","et_lag_1","soil_moisture_lag_1",
                "ndvi_rolling_3","ndvi_zscore"]:
        if col in df.columns and df[col].notna().mean() >= 0.5:
            SAT_FEATURES.append(col)

    ALL_FEATURES = BASE_FEATURES + SAT_FEATURES
    TARGET       = "target_gw_next_month"

    df_clean = df.dropna(subset=[TARGET] + BASE_FEATURES).copy()
    for col in SAT_FEATURES:
        df_clean[col] = df_clean.groupby("Station")[col].transform(lambda x: x.fillna(x.median()))

    X = df_clean[ALL_FEATURES]
    y = df_clean[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    
    model = XGBRegressor(
        n_estimators=500, learning_rate=0.05, max_depth=5,
        subsample=0.8, colsample_bytree=0.8, random_state=42, n_jobs=-1,
        early_stopping_rounds=30, eval_metric="mae",
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    preds = model.predict(X_test)
    print(f"MAE: {mean_absolute_error(y_test, preds):.4f} m | R2: {r2_score(y_test, preds):.4f}")

    joblib.dump({"model": model, "features": ALL_FEATURES}, NEW_MODEL)
    print(f"Model saved: {NEW_MODEL}")

if __name__ == "__main__":
    run_retrain()
