
from fastapi import Depends, FastAPI, HTTPException
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
    get_station_reliability,
    get_station_block,
    get_blocks
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
    find_subscriber_by_phone,
    list_subscribers
)

from backend.service.officers import (
    create_officer,
    list_officers,
    update_officer,
    delete_officer,
    verify_login,
    username_exists
)

from backend.service.auth import (
    create_token,
    get_current_officer,
    get_optional_officer,
    require_admin
)

from backend.service.case_records import (
    list_construction_projects,
    get_construction_project,
    list_extraction_requests,
    get_extraction_request,
    upsert_construction_project_from_registration,
    create_extraction_request_live
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


# ==================================================
# CORS CONFIGURATION
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "*",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# REQUEST MODELS
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


class ScenarioRequest(BaseModel):

    rainfall_modifier: float


class SMSRequest(BaseModel):

    station_name: str
    risk_level: str
    current_groundwater: float
    gw_change_1m: float


class OfficerLoginRequest(BaseModel):

    username: str
    password: str


class OfficerCreateRequest(BaseModel):

    username: str
    password: str
    display_name: str
    role: str  # "district" | "block" | "agriculture" | "admin"
    assigned_block: str | None = None


class OfficerUpdateRequest(BaseModel):

    display_name: str | None = None
    role: str | None = None
    assigned_block: str | None = None


class ExtractionRequestCreateRequest(BaseModel):

    applicant_name: str
    purpose: str
    required_quantity: str
    existing_well: bool
    station: str
    contact_phone: str
    contact_email: str | None = None


# ==================================================
# BLOCK-SCOPING HELPER
# ==================================================

def _enforce_station_access(station_name: str, officer: dict | None):
    """A Block Officer may only view stations inside their own assigned block.
    Everyone else (District/Agriculture/Admin, or no officer at all) is unrestricted."""

    if officer and officer["role"] == "block":
        if get_station_block(station_name) != officer["assigned_block"]:
            raise HTTPException(
                status_code=403,
                detail=f"{station_name} is outside your assigned block ({officer['assigned_block']})"
            )


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
    station_name: str,
    officer: dict | None = Depends(get_optional_officer)
):

    _enforce_station_access(station_name, officer)

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
            predicted_groundwater,

        gw_change_1m=
            data["gw_change_1m"]
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
    station_name: str,
    officer: dict | None = Depends(get_optional_officer)
):

    _enforce_station_access(station_name, officer)

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
def groundwater_risk_map(officer: dict | None = Depends(get_optional_officer)):

    block = officer["assigned_block"] if officer and officer["role"] == "block" else None
    return generate_risk_map(block=block)


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
    # Manual prediction forecast
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
            predicted_groundwater,

        gw_change_1m=
            request.gw_change_1m
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

@app.post(
    "/stations/{station_name}/scenario"
)
def station_scenario(

    station_name: str,

    request: ScenarioRequest,

    officer: dict | None = Depends(get_optional_officer)
):

    _enforce_station_access(station_name, officer)

    # ----------------------------------------------
    # Baseline data
    # ----------------------------------------------

    baseline_data = get_station_data(
        station_name
    )

    if baseline_data is None:

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
    # Baseline prediction
    # ----------------------------------------------

    baseline_pred = predict_groundwater(
        baseline_data
    )

    baseline_gw = float(
        baseline_pred["prediction"]
    )

    baseline_risk = calculate_risk(

        predicted_groundwater=
            baseline_gw,

        current_groundwater=
            baseline_data[
                "current_groundwater"
            ],

        gw_change_1m=
            baseline_data[
                "gw_change_1m"
            ],

        rainfall_mm=
            baseline_data[
                "rainfall_mm"
            ],

        reliability=
            reliability[
                "reliability"
            ]
    )

    baseline_forecast = generate_forecast(
        baseline_data
    )

    # ----------------------------------------------
    # Scenario data
    # ----------------------------------------------

    scenario_data = baseline_data.copy()

    # Scale every rainfall-derived feature together, not just the current
    # month. The model leans heavily on the lagged/rolling rainfall trend
    # (rain_lag_1-3, rain_rolling_3); scaling rainfall_mm alone barely moved
    # the prediction since those trend features stayed at baseline - "Below
    # Normal" and "Normal" came out nearly identical.
    for field in ("rainfall_mm", "rain_lag_1", "rain_lag_2", "rain_lag_3", "rain_rolling_3"):
        if scenario_data.get(field) is not None:
            scenario_data[field] *= request.rainfall_modifier

    # ----------------------------------------------
    # Scenario prediction
    # ----------------------------------------------

    scenario_pred = predict_groundwater(
        scenario_data
    )

    scenario_gw = float(
        scenario_pred["prediction"]
    )

    scenario_risk = calculate_risk(

        predicted_groundwater=
            scenario_gw,

        current_groundwater=
            scenario_data[
                "current_groundwater"
            ],

        gw_change_1m=
            scenario_data[
                "gw_change_1m"
            ],

        rainfall_mm=
            scenario_data[
                "rainfall_mm"
            ],

        reliability=
            reliability[
                "reliability"
            ]
    )

    scenario_forecast = generate_forecast(
        scenario_data
    )

    # ----------------------------------------------
    # Response
    # ----------------------------------------------

    return {

        "status": "success",

        "baseline": {

            "risk_level":
                baseline_risk[
                    "risk_level"
                ],

            "risk_score":
                baseline_risk[
                    "risk_score"
                ],

            "forecasts":
                baseline_forecast[
                    "forecasts"
                ]
        },

        "scenario": {

            "risk_level":
                scenario_risk[
                    "risk_level"
                ],

            "risk_score":
                scenario_risk[
                    "risk_score"
                ],

            "forecasts":
                scenario_forecast[
                    "forecasts"
                ]
        }
    }


# ==================================================
# OFFICER LOGIN
# ==================================================

@app.post("/officer/login")
def officer_login(request: OfficerLoginRequest):

    officer = verify_login(request.username, request.password)

    if officer is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {
        "status": "success",
        "token": create_token(officer),
        "officer": officer
    }


# ==================================================
# OFFICER SESSION (WHO AM I)
# ==================================================

@app.get("/officer/me")
def officer_me(officer: dict = Depends(get_current_officer)):

    return {
        "status": "success",
        "officer": officer
    }


# ==================================================
# BLOCKS / TALUKS LIST
# ==================================================

@app.get("/blocks")
def blocks_list():

    return {
        "status": "success",
        "blocks": get_blocks()
    }


# ==================================================
# OFFICER MANAGEMENT (ADMIN ONLY)
# ==================================================

@app.get("/officers")
def officers_list(admin: dict = Depends(require_admin)):

    return {
        "status": "success",
        "officers": list_officers()
    }


@app.post("/officers")
def officers_create(request: OfficerCreateRequest, admin: dict = Depends(require_admin)):

    if username_exists(request.username):
        raise HTTPException(status_code=400, detail="Username already exists")

    if request.role not in ("district", "block", "agriculture", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")

    if request.role == "block":
        if not request.assigned_block or request.assigned_block not in get_blocks():
            raise HTTPException(status_code=400, detail="A valid assigned_block is required for the block role")

    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    officer = create_officer(
        username=request.username,
        password=request.password,
        display_name=request.display_name,
        role=request.role,
        assigned_block=request.assigned_block if request.role == "block" else None
    )

    return {
        "status": "success",
        "officer": officer
    }


@app.patch("/officers/{officer_id}")
def officers_update(officer_id: int, request: OfficerUpdateRequest, admin: dict = Depends(require_admin)):

    if request.role is not None and request.role not in ("district", "block", "agriculture", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")

    if request.role == "block" and (not request.assigned_block or request.assigned_block not in get_blocks()):
        raise HTTPException(status_code=400, detail="A valid assigned_block is required for the block role")

    officer = update_officer(
        officer_id,
        display_name=request.display_name,
        role=request.role,
        assigned_block=request.assigned_block
    )

    if officer is None:
        raise HTTPException(status_code=404, detail="Officer not found")

    return {
        "status": "success",
        "officer": officer
    }


@app.delete("/officers/{officer_id}")
def officers_delete(officer_id: int, admin: dict = Depends(require_admin)):

    if not delete_officer(officer_id):
        raise HTTPException(status_code=404, detail="Officer not found")

    return {
        "status": "success"
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

    if request.category == "construction":
        upsert_construction_project_from_registration(
            phone=request.phone,
            name=request.name,
            station=request.area,
            contact_email=request.email,
            block=get_station_block(request.area)
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


# ==================================================
# LIST ALERT SUBSCRIBERS (ADMIN)
# ==================================================

@app.get("/subscribers")
def get_subscribers(area: str | None = None, category: str | None = None):

    return {
        "status": "success",
        "subscribers": list_subscribers(area=area, category=category)
    }


# ==================================================
# NOTIFY SUBSCRIBERS FOR A STATION (ADMIN)
# ==================================================

@app.post("/stations/{station_name}/notify-subscribers")
def notify_subscribers(station_name: str):

    intel = generate_intelligence(station_name)

    if intel["status"] == "error":
        raise HTTPException(status_code=404, detail=intel["message"])

    matched = list_subscribers(area=station_name)

    message = (
        f"GroundWatch Alert\n"
        f"Station: {station_name}\n"
        f"Risk Level: {intel['risk']['risk_level']}\n"
        f"Current Groundwater: {intel['current_status']['groundwater']} m\n\n"
        f"{intel['advisory']['english']}"
    )

    return {
        "status": "demo",
        "station": station_name,
        "risk_level": intel["risk"]["risk_level"],
        "notified_count": len(matched),
        "subscribers": matched,
        "message_preview": message,
        "delivery": "Preview only - SMS/email not sent"
    }


# ==================================================
# DEMO ADVISORY SMS PREVIEW
# ==================================================

@app.post(
    "/send-advisory-sms-demo"
)
def send_advisory_sms_demo(
    request: SMSRequest
):

    """
    Generate a GroundWatch advisory SMS preview.

    Uses the advisory.py function.

    No real SMS is sent.
    """

    # ----------------------------------------------
    # Generate advisory
    # ----------------------------------------------

    advisory = generate_advisory(

        risk_level=
            request.risk_level,

        gw_change_1m=
            request.gw_change_1m
    )

    # ----------------------------------------------
    # Prepare SMS message
    # ----------------------------------------------

    sms_message = (

        f"GroundWatch Alert\n"

        f"Station: "
        f"{request.station_name}\n"

        f"Risk Level: "
        f"{request.risk_level}\n"

        f"Current Groundwater: "
        f"{request.current_groundwater} m\n\n"

        f"English Advisory:\n"
        f"{advisory['english']}\n\n"

        f"Tamil Advisory:\n"
        f"{advisory['tamil']}\n\n"

        f"Officer Action:\n"
        f"{advisory['officer_action']}"
    )

    # ----------------------------------------------
    # Rapid decline warning
    # ----------------------------------------------

    if advisory["rapid_decline_alert"]:

        sms_message += (

            "\n\nRapid Decline Alert:\n"

            f"{advisory['rapid_decline_alert']}"
        )

    # ----------------------------------------------
    # Demo response
    # ----------------------------------------------

    return {

        "status": "demo",

        "message":
            sms_message,

        "delivery":
            "Preview only - SMS not sent"
    }


# ==================================================
# ADMIN — CONSTRUCTION PROJECTS
# ==================================================

@app.get("/admin/construction-projects")
def admin_list_construction_projects(admin: dict = Depends(require_admin)):
    return {
        "status": "success",
        "projects": list_construction_projects()
    }


@app.get("/admin/construction-projects/{project_id}")
def admin_get_construction_project(project_id: int, admin: dict = Depends(require_admin)):
    project = get_construction_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Construction project not found")
    return {
        "status": "success",
        "project": project
    }


@app.post("/admin/construction-projects/{project_id}/send-sms")
def admin_construction_project_send_sms(project_id: int, admin: dict = Depends(require_admin)):
    project = get_construction_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Construction project not found")

    message = (
        f"GROUNDWATCH ALERT\n"
        f"Groundwater forecast alert for Project {project['name']}, Salem.\n"
        f"Forecast groundwater condition for the project area indicates elevated stress for the upcoming period.\n"
        f"Predicted level: {abs(project['forecast_gw']):.1f} m\n"
        f"Risk: {project['risk_level']}\n"
        f"Prediction confidence: {project['confidence']}/100\n"
        f"Please review the groundwater condition with the concerned authority before proceeding with groundwater-dependent activities."
    )

    return {
        "status": "demo",
        "message_preview": message,
        "delivery": "Preview only - SMS not sent"
    }


@app.post("/admin/construction-projects/{project_id}/send-email")
def admin_construction_project_send_email(project_id: int, admin: dict = Depends(require_admin)):
    project = get_construction_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Construction project not found")

    subject = f"⚠️ Groundwater Forecast Alert — Project {project['name']} — Salem"

    body = (
        f"Dear Project Applicant,\n\n"
        f"GroundWatch has identified an elevated groundwater-risk condition for the area associated with Project {project['name']}.\n\n"
        f"Project: {project['name']}\n"
        f"Location: {project['block']}, Salem\n"
        f"Monitoring station: {project['station']}\n"
        f"Current groundwater level: {abs(project['current_gw']):.1f} m\n"
        f"Forecast: {abs(project['forecast_gw']):.1f} m\n"
        f"Forecast horizon: 1 month\n"
        f"Risk level: {project['risk_level']}\n"
        f"Prediction confidence: {project['confidence']}/100\n\n"
        f"The forecast is an AI-based early-warning assessment and does not constitute statutory approval, rejection, or groundwater classification.\n"
        f"We recommend verification with the competent authority before groundwater-dependent construction activities proceed."
    )

    return {
        "status": "demo",
        "subject": subject,
        "body": body,
        "delivery": "Preview only - Email not sent"
    }


# ==================================================
# ADMIN — EXTRACTION REQUESTS
# ==================================================

@app.get("/admin/extraction-requests")
def admin_list_extraction_requests(admin: dict = Depends(require_admin)):
    return {
        "status": "success",
        "requests": list_extraction_requests()
    }


@app.post("/admin/extraction-requests")
def admin_create_extraction_request(request: ExtractionRequestCreateRequest, admin: dict = Depends(require_admin)):
    if not request.applicant_name.strip():
        raise HTTPException(status_code=400, detail="Applicant name is required")

    digits = "".join(ch for ch in request.contact_phone if ch.isdigit())
    if len(digits) < 10:
        raise HTTPException(status_code=400, detail="Enter a valid 10-digit contact number")

    if request.station not in get_stations():
        raise HTTPException(status_code=404, detail="Unknown station")

    result = create_extraction_request_live(
        applicant_name=request.applicant_name,
        purpose=request.purpose,
        required_quantity=request.required_quantity,
        existing_well=request.existing_well,
        station=request.station,
        contact_phone=request.contact_phone,
        contact_email=request.contact_email,
        block=get_station_block(request.station)
    )

    if result is None:
        raise HTTPException(status_code=404, detail="Could not compute groundwater data for this station")

    return {
        "status": "success",
        "request": result
    }


@app.get("/admin/extraction-requests/{request_id}")
def admin_get_extraction_request(request_id: int, admin: dict = Depends(require_admin)):
    req = get_extraction_request(request_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Extraction request not found")
    return {
        "status": "success",
        "request": req
    }


@app.post("/admin/extraction-requests/{request_id}/send-alert")
def admin_extraction_request_send_alert(request_id: int, admin: dict = Depends(require_admin)):
    req = get_extraction_request(request_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Extraction request not found")

    message = (
        f"GROUNDWATCH ALERT\n"
        f"Extraction request review — {req['applicant_name']}, {req['block']}, Salem.\n"
        f"GroundWatch risk assessment for this location: {req['risk_level']}\n"
        f"Current groundwater: {abs(req['current_gw']):.1f} m | Forecast: {abs(req['forecast_gw']):.1f} m\n"
        f"Prediction confidence: {req['confidence']}/100\n"
        f"Field verification is requested before this extraction request is approved."
    )

    return {
        "status": "demo",
        "message_preview": message,
        "delivery": "Preview only - SMS not sent"
    }


# ==================================================
# ADMIN — FARMER ADVISORY (BY BLOCK)
# ==================================================

@app.post("/admin/blocks/{block_name}/notify-farmers")
def admin_notify_farmers_in_block(block_name: str, admin: dict = Depends(require_admin)):
    if block_name not in get_blocks():
        raise HTTPException(status_code=404, detail="Unknown block")

    matched = [
        s for s in list_subscribers(category="farmer")
        if get_station_block(s["area"]) == block_name
    ]

    message_en = (
        f"GROUNDWATCH: Increased groundwater stress is predicted in {block_name}, Salem. "
        f"Farmers are advised to plan the upcoming crop season and irrigation according to expected water availability. "
        f"For crop-specific advice, contact your Agriculture Officer."
    )

    message_ta = (
        f"GROUNDWATCH எச்சரிக்கை: {block_name}, சேலம் பகுதியில் வரும் காலத்தில் நிலத்தடி நீர் அழுத்தம் kuraiya "
        f"வாய்ப்புள்ளதாக கணிக்கப்பட்டுள்ளது. எதிர்பார்க்கப்படும் நீர் இருப்புக்கு ஏற்ப அடுத்த பருவப் பயிர் மற்றும் "
        f"பாசனத் திட்டத்தைத் திட்டமிடவும். பயிர் தொடர்பான குறிப்பிட்ட ஆலோசனைக்கு அருகிலுள்ள வேளாண்மை அலுவலரை அணுகவும்."
    )

    return {
        "status": "demo",
        "block": block_name,
        "notified_count": len(matched),
        "subscribers": matched,
        "message_preview_english": message_en,
        "message_preview_tamil": message_ta,
        "delivery": "Preview only - SMS not sent"
    }


# ==================================================
# ADMIN — CONSTRUCTION WORKER ADVISORY (BY BLOCK)
# ==================================================

@app.post("/admin/blocks/{block_name}/notify-construction-workers")
def admin_notify_construction_workers_in_block(block_name: str, admin: dict = Depends(require_admin)):
    if block_name not in get_blocks():
        raise HTTPException(status_code=404, detail="Unknown block")

    matched = [
        s for s in list_subscribers(category="construction")
        if get_station_block(s["area"]) == block_name
    ]

    message_en = (
        f"GROUNDWATCH: Increased groundwater stress is predicted in {block_name}, Salem. "
        f"Construction sites relying on groundwater extraction are advised to verify water availability "
        f"before proceeding with groundwater-dependent activities. For guidance, contact the concerned authority."
    )

    message_ta = (
        f"GROUNDWATCH எச்சரிக்கை: {block_name}, சேலம் பகுதியில் வரும் காலத்தில் நிலத்தடி நீர் அழுத்தம் அதிகரிக்க "
        f"வாய்ப்புள்ளதாக கணிக்கப்பட்டுள்ளது. நிலத்தடி நீரைச் சார்ந்திருக்கும் கட்டுமானத் தளங்கள், நீர் சார்ந்த "
        f"பணிகளைத் தொடர்வதற்கு முன் நீர் இருப்பை உறுதிசெய்ய அறிவுறுத்தப்படுகின்றனர். வழிகாட்டுதலுக்கு, "
        f"சம்பந்தப்பட்ட அதிகாரியை அணுகவும்."
    )

    return {
        "status": "demo",
        "block": block_name,
        "notified_count": len(matched),
        "subscribers": matched,
        "message_preview_english": message_en,
        "message_preview_tamil": message_ta,
        "delivery": "Preview only - SMS not sent"
    }