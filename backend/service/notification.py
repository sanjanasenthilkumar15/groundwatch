
import os

from dotenv import load_dotenv
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException


# Load environment variables from .env
load_dotenv()


def send_sms_advisory(
    station_name: str,
    risk_level: str,
    current_groundwater: float,
    advisory: str,
):
    """
    Send a real GroundWatch advisory SMS using Twilio.
    """

    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_phone_number = os.getenv("TWILIO_PHONE_NUMBER")
    sms_to_number = os.getenv("SMS_TO_NUMBER")

    # Validate required environment variables
    required_values = {
        "TWILIO_ACCOUNT_SID": account_sid,
        "TWILIO_AUTH_TOKEN": auth_token,
        "TWILIO_PHONE_NUMBER": twilio_phone_number,
        "SMS_TO_NUMBER": sms_to_number,
    }

    missing_values = [
        name
        for name, value in required_values.items()
        if not value
    ]

    if missing_values:
        raise ValueError(
            "Missing environment variables: "
            + ", ".join(missing_values)
        )

    # Prepare SMS message
    message_body = (
        "GroundWatch Alert\n"
        f"Station: {station_name}\n"
        f"Risk Level: {risk_level}\n"
        f"Current Groundwater: {current_groundwater} m\n"
        f"Advisory: {advisory}"
    )

    try:
        # Create Twilio client
        client = Client(account_sid, auth_token)

        # Send SMS
        message = client.messages.create(
            body=message_body,
            from_=twilio_phone_number,
            to=sms_to_number,
        )

        return {
            "status": "success",
            "message_sid": message.sid,
            "twilio_status": message.status,
        }

    except TwilioRestException as error:
        return {
            "status": "error",
            "error_code": error.code,
            "message": error.msg,
        }

    except Exception as error:
        return {
            "status": "error",
            "message": str(error),
        }


def generate_demo_sms(
    station_name: str,
    risk_level: str,
    current_groundwater: float,
    advisory: str,
):
    """
    Generate an SMS preview without sending a real SMS.

    This is useful for demonstrations and testing.
    """

    # Prepare demo SMS message
    message_body = (
        "GroundWatch Alert\n"
        f"Station: {station_name}\n"
        f"Risk Level: {risk_level}\n"
        f"Current Groundwater: {current_groundwater} m\n"
        f"Advisory: {advisory}"
    )

    return {
        "status": "demo",
        "message": message_body,
        "delivery": "Preview only - SMS not sent",
    }