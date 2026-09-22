# ==================================================
# GROUNDWATER RISK MAP ENGINE
# ==================================================

import math

from backend.service.data_service import (
    get_stations,
    get_station_data,
    get_station_reliability,
    get_station_block
)

from backend.service.prediction import predict_groundwater
from backend.service.risk_engine import calculate_risk


def clean_value(value):
    """
    Convert NaN / infinity values into JSON-safe None.
    """

    if value is None:
        return None

    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None

    return value


def generate_risk_map(block: str | None = None) -> dict:

    stations = get_stations()

    if block:
        stations = [s for s in stations if get_station_block(s) == block]

    station_results = []

    for station_name in stations:

        data = get_station_data(station_name)

        if data is None:
            continue

        reliability = get_station_reliability(station_name)

        if reliability is None:
            continue

        prediction_result = predict_groundwater(data)

        predicted_groundwater = float(
            prediction_result["prediction"]
        )

        risk = calculate_risk(
            predicted_groundwater=predicted_groundwater,
            current_groundwater=data["current_groundwater"],
            gw_change_1m=data["gw_change_1m"],
            rainfall_mm=data["rainfall_mm"],
            reliability=reliability["reliability"]
        )

        station_result = {
            "station": data["station"],
            "latitude": clean_value(data["latitude"]),
            "longitude": clean_value(data["longitude"]),
            "latest_month": data["month"],
            "current_groundwater": clean_value(
                data["current_groundwater"]
            ),
            "predicted_groundwater": clean_value(
                round(predicted_groundwater, 3)
            ),
            "rainfall_mm": clean_value(
                data["rainfall_mm"]
            ),
            "risk_score": clean_value(
                risk["risk_score"]
            ),
            "risk_level": risk["risk_level"],
            "reliability": reliability["reliability"]
        }

        station_results.append(station_result)

    # Highest risk first
    station_results.sort(
        key=lambda x: x["risk_score"] or 0,
        reverse=True
    )

    summary = {
        "total_stations": len(station_results),
        "critical": sum(
            1 for x in station_results
            if x["risk_level"] == "CRITICAL"
        ),
        "high": sum(
            1 for x in station_results
            if x["risk_level"] == "HIGH"
        ),
        "moderate": sum(
            1 for x in station_results
            if x["risk_level"] == "MODERATE"
        ),
        "low": sum(
            1 for x in station_results
            if x["risk_level"] == "LOW"
        )
    }

    return {
        "status": "success",

        "map": {
            "region": "Salem",
            "unit": "meters",
            "description": (
                "AI-based groundwater early-warning "
                "risk map using monitoring station data."
            )
        },

        "summary": summary,

        "stations": station_results,

        "note": (
            "Risk levels are project AI early-warning "
            "indicators and are not official CGWB "
            "groundwater classifications."
        )
    }