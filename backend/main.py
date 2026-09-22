from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.service.prediction import (
    predict_groundwater
)

from backend.service.risk_engine import (
    calculate_risk
)

from backend.service.advisory import (
    generate_advisory
)

from backend.service.data_service import (
    get_stations,
    get_station_data,
    get_station_reliability
)

from backend.service.forecast import (
    generate_forecast
)

from backend.service.explainability import (
    explain_prediction
)

from backend.service.stress_clock import (
    calculate_stress_clock
)

from backend.service.intelligence import (
    generate_intelligence
)

from backend.service.risk_map import (
    generate_risk_map
)

from backend.service.registry import (
    register_subscriber,
    find_subscriber_by_phone
)


# ==================================================
# FASTAPI APPLICATION
# ==================================================

app = FastAPI(
    title="Groundwater AI",
    description=(
        "AI-based groundwater risk prediction "
        "and early-warning system"
    ),
    version="1.0.0"
)

# Allow Vite dev server + any localhost origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "*",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================================================
# REQUEST MODEL
# ==================================================

class PredictionRequest(BaseModel):

    gw_lag_1: float
    gw_lag_2: float
    gw_lag_3: float

    gw_rolling_3: float

    gw_change_1m: float

    rainfall_mm: float

    rain_lag_1: float
    rain_lag_2: float
    rain_lag_3: float

    rain_rolling_3: float

    month_num: int

    year: int

    current_groundwater: float


class RegisterRequest(BaseModel):

    name: str
    phone: str
    area: str
    category: str  # "farmer" | "construction"
    email: str | None = None


class LoginRequest(BaseModel):

    phone: str


# ==================================================
# ROOT
# ==================================================

@app.get("/")
def root():

    return {
        "status": "success",
        "message": "Groundwater AI API is running"
    }


# ==================================================
# GET ALL STATIONS
# ==================================================

@app.get("/stations")
def stations():

    return {
        "status": "success",
        "stations": get_stations()
    }


# ==================================================
# GET STATION INFORMATION
# ==================================================

@app.get("/stations/{station_name}")
def station_information(
    station_name: str
):

    data = get_station_data(
        station_name
    )

    if data is None:

        raise HTTPException(
            status_code=404,
            detail="Station not found"
        )

    return {
        "status": "success",
        "data": data
    }


# ==================================================
# STATION PREDICTION
# ==================================================

@app.get("/stations/{station_name}/predict")
def station_prediction(
    station_name: str
):

    # ----------------------------------------------
    # Station data
    # ----------------------------------------------

    data = get_station_data(
        station_name
    )

    if data is None:

        raise HTTPException(
            status_code=404,
            detail="Station not found"
        )

    # ----------------------------------------------
    # Reliability
    # ----------------------------------------------

    reliability = get_station_reliability(
        station_name
    )

    # ----------------------------------------------
    # Prediction
    # ----------------------------------------------

    input_data = data.copy()

    prediction_result = predict_groundwater(
        input_data
    )

    predicted_groundwater = float(
        prediction_result["prediction"]
    )

    # ----------------------------------------------
    # Forecast
    # ----------------------------------------------

    forecast = generate_forecast(
        data
    )

    # ----------------------------------------------
    # Risk
    # ----------------------------------------------

    risk = calculate_risk(

        predicted_groundwater=
            predicted_groundwater,

        current_groundwater=
            data["current_groundwater"],

        gw_change_1m=
            data["gw_change_1m"],

        rainfall_mm=
            data["rainfall_mm"],

        reliability=
            reliability["reliability"]
    )

    # ----------------------------------------------
    # WHY
    # ----------------------------------------------

    why = explain_prediction(
        input_data
    )

    # ----------------------------------------------
    # Stress Clock
    # ----------------------------------------------

    stress_clock = calculate_stress_clock(

        current_groundwater=
            data["current_groundwater"],

        predicted_groundwater=
            predicted_groundwater
    )

    # ----------------------------------------------
    # Advisory
    # ----------------------------------------------

    advisory = generate_advisory(

        risk["risk_level"],

        data["gw_change_1m"]
    )

    # ----------------------------------------------
    # Response
    # ----------------------------------------------

    return {

        "status": "success",

        "station":
            data["station"],

        "current_groundwater":
            data["current_groundwater"],

        "prediction": {

            "predicted_groundwater":
                predicted_groundwater,

            "unit":
                "meters"
        },

        "reliability":
            reliability,

        "forecast":
            forecast,

        "risk":
            risk,

        "why":
            why,

        "stress_clock":
            stress_clock,

        "advisory":
            advisory,

        "debug": {

            "model_inputs":
                prediction_result[
                    "model_inputs"
                ],

            "medians_used":
                prediction_result[
                    "medians_used"
                ],

            "model_features":
                list(
                    prediction_result[
                        "model_inputs"
                    ].keys()
                )
        }
    }


# ==================================================
# BLOCK INTELLIGENCE
# ==================================================

@app.get(
    "/stations/{station_name}/intelligence"
)
def station_intelligence(
    station_name: str
):

    result = generate_intelligence(
        station_name
    )

    if result["status"] == "error":

        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return result


# ==================================================
# GROUNDWATER RISK MAP
# ==================================================

@app.get("/risk-map")
def groundwater_risk_map():

    return generate_risk_map()


# ==================================================
# MANUAL PREDICTION
# ==================================================

@app.post("/predict")
def manual_prediction(
    request: PredictionRequest
):

    # ----------------------------------------------
    # Convert request
    # ----------------------------------------------

    input_data = request.model_dump()

    # ----------------------------------------------
    # Prediction
    # ----------------------------------------------

    prediction_result = predict_groundwater(
        input_data
    )

    predicted_groundwater = float(
        prediction_result["prediction"]
    )

    # ----------------------------------------------
    # Risk
    # ----------------------------------------------

    risk = calculate_risk(

        predicted_groundwater=
            predicted_groundwater,

        current_groundwater=
            request.current_groundwater,

        gw_change_1m=
            request.gw_change_1m,

        rainfall_mm=
            request.rainfall_mm,

        reliability=
            "normal"
    )

    # ----------------------------------------------
    # Manual prediction does not contain
    # station date context
    # ----------------------------------------------

    forecast = {

        "status":
            "single_prediction_only",

        "message": (
            "Use the station intelligence "
            "endpoint for 1M / 3M / 6M forecasting."
        )
    }

    # ----------------------------------------------
    # WHY
    # ----------------------------------------------

    why = explain_prediction(
        input_data
    )

    # ----------------------------------------------
    # Stress Clock
    # ----------------------------------------------

    stress_clock = calculate_stress_clock(

        current_groundwater=
            request.current_groundwater,

        predicted_groundwater=
            predicted_groundwater
    )

    # ----------------------------------------------
    # Advisory
    # ----------------------------------------------

    advisory = generate_advisory(

        risk["risk_level"],

        request.gw_change_1m
    )

    # ----------------------------------------------
    # Response
    # ----------------------------------------------

    return {

        "status": "success",

        "prediction": {

            "predicted_groundwater":
                predicted_groundwater,

            "unit":
                "meters"
        },

        "forecast":
            forecast,

        "risk":
            risk,

        "why":
            why,

        "stress_clock":
            stress_clock,

        "advisory":
            advisory,

        "debug": {

            "model_inputs":
                prediction_result[
                    "model_inputs"
                ],

            "medians_used":
                prediction_result[
                    "medians_used"
                ],

            "model_features":
                list(
                    prediction_result[
                        "model_inputs"
                    ].keys()
                )
        }
    }
# ==================================================
# SCENARIO SIMULATOR
# ==================================================

class ScenarioRequest(BaseModel):
    rainfall_modifier: float

@app.post("/stations/{station_name}/scenario")
def station_scenario(
    station_name: str,
    request: ScenarioRequest
):
    # 1. Baseline
    baseline_data = get_station_data(station_name)
    if baseline_data is None:
        raise HTTPException(status_code=404, detail="Station not found")
        
    reliability = get_station_reliability(station_name)
    
    baseline_pred = predict_groundwater(baseline_data)
    baseline_gw = float(baseline_pred["prediction"])
    baseline_risk = calculate_risk(
        predicted_groundwater=baseline_gw,
        current_groundwater=baseline_data["current_groundwater"],
        gw_change_1m=baseline_data["gw_change_1m"],
        rainfall_mm=baseline_data["rainfall_mm"],
        reliability=reliability["reliability"]
    )
    baseline_forecast = generate_forecast(baseline_data)
    
    # 2. Scenario
    scenario_data = baseline_data.copy()
    scenario_data["rainfall_mm"] *= request.rainfall_modifier
    
    scenario_pred = predict_groundwater(scenario_data)
    scenario_gw = float(scenario_pred["prediction"])
    scenario_risk = calculate_risk(
        predicted_groundwater=scenario_gw,
        current_groundwater=scenario_data["current_groundwater"],
        gw_change_1m=scenario_data["gw_change_1m"],
        rainfall_mm=scenario_data["rainfall_mm"],
        reliability=reliability["reliability"]
    )
    scenario_forecast = generate_forecast(scenario_data)

    return {
        "status": "success",
        "baseline": {
            "risk_level": baseline_risk["risk_level"],
            "risk_score": baseline_risk["risk_score"],
            "forecasts": baseline_forecast["forecasts"]
        },
        "scenario": {
            "risk_level": scenario_risk["risk_level"],
            "risk_score": scenario_risk["risk_score"],
            "forecasts": scenario_forecast["forecasts"]
        }
    }


# ==================================================
# ALERT SUBSCRIBER REGISTRATION
# ==================================================

@app.post("/register")
def register_for_alerts(request: RegisterRequest):

    if not request.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")

    digits = "".join(ch for ch in request.phone if ch.isdigit())
    if len(digits) < 10:
        raise HTTPException(status_code=400, detail="Enter a valid 10-digit mobile number")

    if request.category not in ("farmer", "construction"):
        raise HTTPException(status_code=400, detail="Category must be 'farmer' or 'construction'")

    if request.area not in get_stations():
        raise HTTPException(status_code=404, detail="Unknown area/station")

    subscriber = register_subscriber(
        name=request.name,
        phone=request.phone,
        area=request.area,
        category=request.category,
        email=request.email
    )

    return {
        "status": "success",
        "message": "Registered for groundwater alerts",
        "subscriber": subscriber
    }


# ==================================================
# ALERT SUBSCRIBER LOGIN
# ==================================================

@app.post("/login")
def login_subscriber(request: LoginRequest):

    subscriber = find_subscriber_by_phone(request.phone)

    if subscriber is None:
        raise HTTPException(status_code=404, detail="No registration found for this number")

    return {
        "status": "success",
        "subscriber": subscriber
    }



