# ==================================================
# GROUNDWATER BLOCK INTELLIGENCE
# ==================================================

from backend.service.prediction import predict_groundwater
from backend.service.risk_engine import calculate_risk
from backend.service.forecast import generate_forecast
from backend.service.explainability import explain_prediction
from backend.service.stress_clock import calculate_stress_clock
from backend.service.advisory import generate_advisory
from backend.service.data_service import (
    get_station_data,
    get_station_reliability
)


def generate_intelligence(station_name: str) -> dict:
    """
    Combine prediction, forecast, risk, WHY,
    stress clock and advisory into one officer-facing response.
    """

    # --------------------------------------------------
    # 1. Get latest station data
    # --------------------------------------------------

    data = get_station_data(station_name)

    if data is None:
        return {
            "status": "error",
            "message": "Station not found"
        }

    # --------------------------------------------------
    # 2. Get reliability
    # --------------------------------------------------

    reliability = get_station_reliability(station_name)

    # --------------------------------------------------
    # 3. Prediction
    # --------------------------------------------------

    prediction_result = predict_groundwater(data)

    predicted_groundwater = float(
        prediction_result["prediction"]
    )

    # --------------------------------------------------
    # 4. Forecast
    # --------------------------------------------------

    forecast = generate_forecast(data)

    # --------------------------------------------------
    # 5. Risk
    # --------------------------------------------------

    risk = calculate_risk(
        predicted_groundwater=predicted_groundwater,
        current_groundwater=data["current_groundwater"],
        gw_change_1m=data["gw_change_1m"],
        rainfall_mm=data["rainfall_mm"],
        reliability=reliability["reliability"]
    )

    # --------------------------------------------------
    # 6. WHY
    # --------------------------------------------------

    why = explain_prediction(data)

    # --------------------------------------------------
    # 7. Stress Clock
    # --------------------------------------------------

    stress_clock = calculate_stress_clock(
        current_groundwater=data["current_groundwater"],
        predicted_groundwater=predicted_groundwater,
        gw_change_1m=data["gw_change_1m"]
    )

    # --------------------------------------------------
    # 8. Advisory
    # --------------------------------------------------

    advisory = generate_advisory(
        risk["risk_level"],
        data["gw_change_1m"]
    )

    # --------------------------------------------------
    # 9. Build officer-friendly response
    # --------------------------------------------------

    return {
        "status": "success",

        "station": {
            "name": data["station"],
            "latitude": data["latitude"],
            "longitude": data["longitude"],
            "latest_month": data["month"]
        },

        "current_status": {
            "groundwater": data["current_groundwater"],
            "rainfall_mm": data["rainfall_mm"],
            "monthly_change": data["gw_change_1m"]
        },

        "prediction": {
            "next_month": predicted_groundwater,
            "unit": "meters"
        },

        "forecast": forecast,

        "risk": risk,

        "reliability": reliability,
        
        "satellite": {
            "ndvi": data.get("ndvi"),
            "lst_celsius": data.get("lst_celsius"),
            "et_mm": data.get("et_mm"),
            "soil_moisture": data.get("soil_moisture"),
            "ndvi_zscore": data.get("ndvi_zscore")
        },

        "why": why,

        "stress_clock": stress_clock,

        "advisory": advisory
    }