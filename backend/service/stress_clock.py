# ==================================================
# GROUNDWATER STRESS CLOCK
# ==================================================

from backend.service.data_service import delta_toward_surface


def calculate_stress_clock(
    current_groundwater: float,
    predicted_groundwater: float,
    gw_change_1m: float = 0.0
) -> dict:
    """
    Two distinct signals, kept separate on purpose:

    - "outlook": forward-looking, current vs. the model's next-month
      forecast. This can diverge sharply from what actually just
      happened (e.g. a real recent decline with a forecast rebound).
    - "recent_trend": backward-looking, the real last-month change
      from observed data. This is what actually happened, and is the
      same signal the risk score itself is based on.

    IMPORTANT:
    The threshold used here is an AI monitoring reference,
    not an official CGWB groundwater classification.
    """

    STABLE_THRESHOLD = 0.10

    # ----------------------------------------------
    # Outlook (forecast-based)
    # ----------------------------------------------

    outlook_change = delta_toward_surface(current_groundwater, predicted_groundwater)

    if abs(outlook_change) < STABLE_THRESHOLD:
        outlook_status = "stable"
    elif outlook_change < 0:
        outlook_status = "declining"
    else:
        outlook_status = "improving"

    if outlook_status == "declining":
        outlook_message = (
            "The model's forecast points toward a further decline. "
            "Continue monitoring and verify conditions "
            "through field observations."
        )
    elif outlook_status == "improving":
        outlook_message = (
            "The model's forecast points toward improvement. "
            "Continue monitoring to confirm whether "
            "it persists."
        )
    else:
        outlook_message = (
            "The model's forecast is approximately stable over "
            "the next interval."
        )

    # ----------------------------------------------
    # Recent trend (real last-month data)
    # ----------------------------------------------

    previous_groundwater = current_groundwater - gw_change_1m
    recent_change = delta_toward_surface(previous_groundwater, current_groundwater)

    if abs(recent_change) < STABLE_THRESHOLD:
        recent_status = "stable"
    elif recent_change < 0:
        recent_status = "declining"
    else:
        recent_status = "improving"

    recent_magnitude = abs(recent_change)

    if recent_status == "declining":
        recent_message = f"Water table dropped {recent_magnitude:.2f}m over the last month."
    elif recent_status == "improving":
        recent_message = f"Water table rose {recent_magnitude:.2f}m over the last month."
    else:
        recent_message = "Water table was approximately stable over the last month."

    return {
        "outlook": {
            "status": outlook_status,
            "estimated_change": round(outlook_change, 3),
            "message": outlook_message,
        },

        "recent_trend": {
            "status": recent_status,
            "change_m": round(gw_change_1m, 3),
            "magnitude_m": round(recent_magnitude, 3),
            "message": recent_message,
        },

        "current_groundwater": round(
            current_groundwater,
            3
        ),

        "predicted_groundwater": round(
            predicted_groundwater,
            3
        ),

        "threshold_status": (
            "No official critical threshold applied"
        ),

        "note": (
            "This stress clock is an AI-based trend "
            "monitoring indicator. It is not an official "
            "CGWB groundwater classification or threshold."
        )
    }
