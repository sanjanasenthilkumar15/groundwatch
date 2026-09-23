# ==================================================
# GROUNDWATER EXPLAINABILITY ENGINE
# ==================================================

from backend.service.data_service import delta_toward_surface

FEATURE_IMPORTANCE = {
    "gw_lag_2": 0.352141,
    "gw_lag_1": 0.301070,
    "gw_lag_3": 0.240202,
    "gw_rolling_3": 0.069395,
    "gw_change_1m": 0.015733,
    "month_num": 0.005881,
    "year": 0.003705,
    "rainfall_mm": 0.003011,
    "rain_lag_2": 0.002613,
    "rain_rolling_3": 0.002416,
    "rain_lag_1": 0.002302,
    "rain_lag_3": 0.001531
}


FEATURE_NAMES = {
    "gw_lag_1": "Recent groundwater level",
    "gw_lag_2": "2-month groundwater history",
    "gw_lag_3": "3-month groundwater history",
    "gw_rolling_3": "Recent 3-month groundwater trend",
    "gw_change_1m": "Monthly groundwater change",
    "rainfall_mm": "Current rainfall",
    "rain_lag_1": "Previous-month rainfall",
    "rain_lag_2": "2-month rainfall history",
    "rain_lag_3": "3-month rainfall history",
    "rain_rolling_3": "Recent 3-month rainfall",
    "month_num": "Season/month",
    "year": "Year"
}


def get_strength(importance: float) -> str:

    if importance >= 0.25:
        return "Very strong"
    elif importance >= 0.10:
        return "Strong"
    elif importance >= 0.05:
        return "Moderate"
    else:
        return "Low"


def get_explanation(feature: str, value: float) -> str:

    if feature == "gw_lag_1":
        if value < -1:
            return (
                "The previous month's groundwater level "
                "shows a relatively low condition."
            )
        else:
            return (
                "The previous month's groundwater level "
                "is influencing the forecast."
            )

    if feature == "gw_lag_2":
        return (
            "Groundwater conditions from two months earlier "
            "have a strong influence on the forecast."
        )

    if feature == "gw_lag_3":
        return (
            "The groundwater level from three months earlier "
            "contributes significantly to the prediction."
        )

    if feature == "gw_rolling_3":
        return (
            "The recent three-month groundwater pattern "
            "influences the predicted condition."
        )

    if feature == "gw_change_1m":
        if value < -1:
            return (
                "Groundwater has declined noticeably "
                "during the recent month."
            )
        elif value < 0:
            return (
                "Groundwater shows a slight recent decline."
            )
        elif value > 1:
            return (
                "Groundwater has increased during the "
                "recent month."
            )
        else:
            return (
                "Recent groundwater movement is relatively stable."
            )

    if feature == "rainfall_mm":
        return (
            "Current rainfall conditions provide additional "
            "context for the groundwater prediction."
        )

    if feature.startswith("rain_"):
        return (
            "Recent rainfall history contributes to the "
            "prediction, although its model influence is limited."
        )

    if feature == "month_num":
        return (
            "Seasonal timing contributes slightly to the prediction."
        )

    if feature == "year":
        return (
            "The year provides a small amount of temporal context."
        )

    return "This feature contributes to the model prediction."


def explain_prediction(input_data: dict) -> dict:

    explanations = []

    # gw_change_1m is a raw signed delta. Most stations store depth as
    # negative (more negative = deeper), but a few store it as positive
    # instead - a raw threshold check would silently call an improving
    # month a "decline" for those stations. Convert once, up front, to a
    # sign-agnostic "toward/away from surface" delta and use it wherever
    # gw_change_1m would otherwise be read directly below.
    current_groundwater = float(input_data.get("current_groundwater", 0))
    raw_gw_change = float(input_data.get("gw_change_1m", 0))
    effective_gw_change = delta_toward_surface(
        current_groundwater - raw_gw_change,
        current_groundwater
    )

    # Sort features by model importance
    sorted_features = sorted(
        FEATURE_IMPORTANCE.items(),
        key=lambda item: item[1],
        reverse=True
    )

    # Return top 5 most influential features
    for feature, importance in sorted_features[:5]:

        value = effective_gw_change if feature == "gw_change_1m" else float(input_data.get(feature, 0))

        explanations.append(
            {
                "feature": feature,
                "name": FEATURE_NAMES.get(
                    feature,
                    feature
                ),
                "value": round(value, 3),
                "importance": round(importance, 4),
                "strength": get_strength(importance),
                "explanation": get_explanation(
                    feature,
                    value
                )
            }
        )

    # --------------------------------------------------
    # Overall interpretation
    # --------------------------------------------------

    gw_change = effective_gw_change

    rainfall = float(
        input_data.get("rainfall_mm", 0)
    )

    if gw_change < -2:
        overall = (
            "Recent groundwater decline is a major "
            "factor influencing the prediction."
        )

    elif gw_change < 0:
        overall = (
            "Groundwater shows a slight recent decline, "
            "which contributes to the predicted condition."
        )

    elif gw_change > 2:
        overall = (
            "Recent groundwater improvement is visible "
            "in the input trend."
        )

    else:
        overall = (
            "Recent groundwater conditions are relatively stable."
        )

    return {
        "method": "XGBoost feature importance",
        "overall_interpretation": overall,

        "context": {
            "recent_groundwater_change": round(
                gw_change,
                3
            ),
            "current_rainfall_mm": round(
                rainfall,
                2
            )
        },

        "top_features": explanations,

        "note": (
            "These explanations are based on global XGBoost "
            "feature importance and input values. They indicate "
            "which factors influence the model, not causal relationships."
        )
    }