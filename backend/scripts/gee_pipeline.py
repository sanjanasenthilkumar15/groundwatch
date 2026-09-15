import ee, json, sys
import pandas as pd
from pathlib import Path
import time

ROOT       = Path(__file__).resolve().parents[2]
KEY_PATH   = Path(r"C:\Users\sanga\Downloads\groundwater-508706-189a296c8a4c.json")
INPUT_CSV  = ROOT / "backend" / "data" / "Salem_ML_Ready_Monthly.csv"
SAT_CSV    = ROOT / "backend" / "data" / "Salem_Satellite_Monthly.csv"
MERGED_CSV = ROOT / "backend" / "data" / "Salem_ML_Ready_Satellite.csv"
BUFFER_M   = 5000

def authenticate():
    with open(KEY_PATH) as f:
        key = json.load(f)
    creds = ee.ServiceAccountCredentials(email=key["client_email"], key_file=str(KEY_PATH))
    ee.Initialize(credentials=creds, project=key["project_id"])
    print(f"AUTH OK", flush=True)

def stations_to_fc(stations_df):
    features = []
    for _, row in stations_df.iterrows():
        pt = ee.Geometry.Point([row["longitude"], row["latitude"]]).buffer(BUFFER_M)
        features.append(ee.Feature(pt, {"station": row["Station"]}))
    return ee.FeatureCollection(features)

def pull_signal_all_stations(collection_id, band, fc, m_start, m_end, scale, multiplier, offset=0.0):
    try:
        img = ee.ImageCollection(collection_id).filterDate(m_start, m_end).select(band).mean()
        reduced = img.reduceRegions(collection=fc, reducer=ee.Reducer.mean(), scale=scale, tileScale=4)
        results = reduced.getInfo()
        out = {}
        for feat in results["features"]:
            name = feat["properties"].get("station")
            val  = feat["properties"].get("mean")
            out[name] = round(val * multiplier + offset, 4) if (name and val is not None) else None
        return out
    except Exception as e:
        print(f" ERR {band}: {str(e)[:60]}", flush=True)
        return {}

def run():
    authenticate()
    df = pd.read_csv(INPUT_CSV)
    stations = (df.groupby("Station").agg(latitude=("latitude","first"),longitude=("longitude","first")).reset_index().dropna(subset=["latitude","longitude"]))
    fc     = stations_to_fc(stations)
    months = pd.period_range(start="2021-04", end="2025-11", freq="M")
    print(f"{len(stations)} stations, {len(months)} months | ~{len(months)*5} API calls | ETA 8-15 min", flush=True)
    all_rows = []
    for i, m in enumerate(months):
        ms = str(m.start_time.date())
        me = str((m.end_time + pd.Timedelta(days=1)).date())
        ym = m.strftime("%Y-%m")
        print(f"[{i+1}/{len(months)}] {ym} ", end="", flush=True)
        ndvi = pull_signal_all_stations("MODIS/061/MOD13Q1",   "NDVI",         fc, ms, me, 250,  0.0001)
        evi  = pull_signal_all_stations("MODIS/061/MOD13Q1",   "EVI",          fc, ms, me, 250,  0.0001)
        lst  = pull_signal_all_stations("MODIS/061/MOD11A2",   "LST_Day_1km",  fc, ms, me, 1000, 0.02, -273.15)
        et   = pull_signal_all_stations("MODIS/061/MOD16A2GF", "ET",           fc, ms, me, 500,  0.1)
        sm   = pull_signal_all_stations("NASA/SMAP/SPL4SMGP/008","sm_surface", fc, ms, me, 9000, 1.0)
        for _, sr in stations.iterrows():
            n = sr["Station"]
            all_rows.append({"Station":n,"month_ym":ym,"ndvi":ndvi.get(n),"evi":evi.get(n),"lst_celsius":lst.get(n),"et_mm":et.get(n),"soil_moisture":sm.get(n)})
        nn = sum(1 for v in ndvi.values() if v); nl = sum(1 for v in lst.values() if v)
        print(f"NDVI:{nn}/{len(stations)} LST:{nl}/{len(stations)}", flush=True)
        if (i+1) % 10 == 0 or (i+1) == len(months):
            pd.DataFrame(all_rows).to_csv(SAT_CSV, index=False)
            print(f"   >> Checkpoint {i+1}/{len(months)}", flush=True)
        sys.stdout.flush()
        time.sleep(0.5)

    sat_df = pd.DataFrame(all_rows)
    sat_df.to_csv(SAT_CSV, index=False)
    print(f"\nSat CSV: {sat_df.shape}", flush=True)
    df["month_ym"] = pd.to_datetime(df["month"]).dt.strftime("%Y-%m")
    merged = df.merge(sat_df, on=["Station","month_ym"], how="left")
    for col in ["ndvi","evi","lst_celsius","et_mm","soil_moisture"]:
        if col in merged.columns:
            pct = merged[col].notna().mean()*100
            print(f"  {col:<18} {pct:.1f}%", flush=True)
    merged.to_csv(MERGED_CSV, index=False)
    print(f"Merged CSV: {merged.shape}\nPIPELINE COMPLETE!", flush=True)

if __name__ == "__main__":
    run()
