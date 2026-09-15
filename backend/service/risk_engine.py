# ==================================================
# GROUNDWATER RISK ENGINE
# ==================================================


def calculate_risk(
    predicted_groundwater: float,
    current_groundwater: float,
    gw_change_1m: float,
    rainfall_mm: float,
    reliability: str = "normal"
) -> dict:

    # --------------------------------------------------
    # NULL GUARD — coerce None/NaN to safe defaults
    # --------------------------------------------------

    predicted_groundwater = float(predicted_groundwater) if predicted_groundwater is not None else float(current_groundwater or 0)
    current_groundwater   = float(current_groundwater)   if current_groundwater   is not None else 0.0
    gw_change_1m          = float(gw_change_1m)          if gw_change_1m          is not None else 0.0
    rainfall_mm           = float(rainfall_mm)           if rainfall_mm           is not None else 50.0

    # --------------------------------------------------
    # INITIAL SCORE
    # --------------------------------------------------

    risk_score = 0

    # --------------------------------------------------
    # 1. RECENT GROUNDWATER TREND
    # --------------------------------------------------

    if gw_change_1m < -2:
        risk_score += 40

    elif gw_change_1m < -1:
        risk_score += 30

    elif gw_change_1m < 0:
        risk_score += 15

    # --------------------------------------------------
    # 2. PREDICTION COMPONENT
    #
    # Only trust the prediction strongly when
    # station reliability is normal.
    # --------------------------------------------------

    prediction_score = 0

    if predicted_groundwater > current_groundwater + 2:

        prediction_score = 0

    elif predicted_groundwater >= current_groundwater - 1:

        prediction_score = 10

    elif predicted_groundwater >= current_groundwater - 3:

        prediction_score = 25

    else:

        prediction_score = 40

    # --------------------------------------------------
    # RELIABILITY-AWARE PREDICTION WEIGHT
    # --------------------------------------------------

    if reliability == "normal":

        risk_score += prediction_score

        prediction_weight = "full"

    elif reliability == "low":

        # Prediction is used cautiously.
        # Only 25% of its original contribution.

        risk_score += round(
            prediction_score * 0.25
        )

        prediction_weight = "reduced"

    elif reliability == "very_low":

        # Do not use unreliable prediction
        # for the risk score.

        risk_score += 0

        prediction_weight = "suppressed"

    else:

        # Unknown reliability → safest option
        # is to reduce prediction influence.

        risk_score += round(
            prediction_score * 0.25
        )

        prediction_weight = "reduced"

    # --------------------------------------------------
    # 3. RAINFALL CONDITION
    # --------------------------------------------------

    if rainfall_mm < 25:

        risk_score += 20

    elif rainfall_mm < 50:

        risk_score += 10

    # --------------------------------------------------
    # LIMIT SCORE TO 0–100
    # --------------------------------------------------

    risk_score = max(
        0,
        min(risk_score, 100)
    )

    # --------------------------------------------------
    # 4. RISK LEVEL
    # --------------------------------------------------

    if risk_score >= 70:

        risk_level = "CRITICAL"

    elif risk_score >= 50:

        risk_level = "HIGH"

    elif risk_score >= 25:

        risk_level = "MODERATE"

    else:

        risk_level = "LOW"

    # --------------------------------------------------
    # 5. RELIABILITY WARNING
    # --------------------------------------------------

    reliability_warning = None

    if reliability == "very_low":

        reliability_warning = (
            "Very low prediction reliability. "
            "The station has very limited historical "
            "training data. Field verification is "
            "strongly recommended."
        )

    elif reliability == "low":

        reliability_warning = (
            "Low prediction reliability. "
            "The station condition is poorly represented "
            "by its historical training data. "
            "Field verification is recommended before "
            "major intervention."
        )

    # --------------------------------------------------
    # FINAL RESULT
    # --------------------------------------------------

    return {

        "risk_score": risk_score,

        "risk_level": risk_level,

        "prediction_reliability": reliability,

        "prediction_weight": prediction_weight,

        "reliability_warning": reliability_warning
    }