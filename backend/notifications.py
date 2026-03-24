import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# ── Logger ──────────────────────────────────────────────────
notif_logger = logging.getLogger("notifications")
notif_logger.setLevel(logging.INFO)
ch = logging.StreamHandler()
ch.setFormatter(logging.Formatter('\n' + '='*50 + '\n%(message)s' + '\n' + '='*50 + '\n'))
notif_logger.addHandler(ch)

# ── Config ──────────────────────────────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

CALLMEBOT_API_KEY = os.getenv("CALLMEBOT_API_KEY", "")
WHATSAPP_PHONE = os.getenv("WHATSAPP_PHONE", "")

# ── Email ───────────────────────────────────────────────────
def send_email(to_email: str, subject: str, body: str):
    """Send a real email via Gmail SMTP. Falls back to console log if creds are missing."""
    if not SMTP_USER or not SMTP_PASSWORD or SMTP_USER == "your-email@gmail.com":
        notif_logger.info(
            f"📧  [MOCK] EMAIL → {to_email}\n"
            f"Subject: {subject}\nBody: {body}\n"
            f"⚠  Set SMTP_USER and SMTP_PASSWORD in .env for real delivery"
        )
        return

    try:
        print(f"📧 Attempting to send email to {to_email}...")
        msg = MIMEMultipart("alternative")
        msg["From"] = SMTP_USER
        msg["To"] = to_email
        msg["Subject"] = subject

        # Plain text part
        msg.attach(MIMEText(body, "plain"))

        # Simple HTML part
        html_body = body.replace("\n", "<br>")
        html = f"""
        <div style="font-family:Arial,sans-serif; max-width:500px; margin:auto;
                    border:1px solid #e0e0e0; border-radius:8px; padding:24px;">
            <h2 style="color:#4F46E5; margin-top:0;">🅿 ParkNow</h2>
            <p>{html_body}</p>
            <hr style="border:none; border-top:1px solid #eee; margin:16px 0;">
            <p style="font-size:12px; color:#888;">This is an automated message from ParkNow.</p>
        </div>
        """
        msg.attach(MIMEText(html, "html"))

        print(f"🔗 Connecting to SMTP: {SMTP_HOST}:{SMTP_PORT}...")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            print(f"🔑 Logging in as {SMTP_USER}...")
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, msg.as_string())

        notif_logger.info(f"📧  EMAIL SENT → {to_email}  |  Subject: {subject}")
        print(f"✅ Email successfully sent to {to_email}")

    except Exception as e:
        notif_logger.warning(f"📧  EMAIL FAILED → {to_email}  |  Error: {e}")
        print(f"❌ Email delivery failed: {str(e)}")


# ── WhatsApp (CallMeBot — free, no signup) ──────────────────
def send_whatsapp(to_phone: str, message: str):
    """Send a WhatsApp message via CallMeBot. Falls back to console log if not configured."""
    api_key = CALLMEBOT_API_KEY
    phone = to_phone.replace(" ", "").replace("-", "")
    if not phone.startswith("+"):
        phone = "+91" + phone

    if not api_key or api_key == "your-callmebot-api-key":
        notif_logger.info(
            f"💬  [MOCK] WHATSAPP → {phone}\n"
            f"Message: {message}\n"
            f"⚠  Set CALLMEBOT_API_KEY in .env for real WhatsApp delivery"
        )
        return

    try:
        import requests
        import urllib.parse
        encoded_msg = urllib.parse.quote_plus(message)
        url = f"https://api.callmebot.com/whatsapp.php?phone={phone}&text={encoded_msg}&apikey={api_key}"
        response = requests.get(url, timeout=15)

        if response.status_code == 200:
            notif_logger.info(f"💬  WHATSAPP SENT → {phone}")
        else:
            notif_logger.warning(f"💬  WHATSAPP FAILED → {phone}  |  Status: {response.status_code}  |  {response.text}")

    except Exception as e:
        notif_logger.warning(f"💬  WHATSAPP FAILED → {phone}  |  Error: {e}")


# ── High-level notification helpers (unchanged API) ─────────
def notify_booking_confirmation(user_email: str, user_phone: str, booking_details: dict):
    """Sends a booking confirmation via Email and SMS."""
    # Email
    subject = "Booking Confirmed - ParkNow"
    body = (
        f"Hello! Your parking booking {booking_details['id']} is confirmed.\n"
        f"Slot: {booking_details['slotId']}\n"
        f"Date: {booking_details['date']}\n"
        f"Time: {booking_details['time']} - {booking_details['endTime']}\n"
        f"Amount Paid: ₹{booking_details['cost']}\n"
        "Thank you for using ParkNow!"
    )
    send_email(user_email, subject, body)

    # WhatsApp
    wa_text = (
        f"🅿 *ParkNow* — Booking Confirmed!\n"
        f"🎫 Booking: {booking_details['id']}\n"
        f"📍 Slot: {booking_details['slotId']}\n"
        f"📅 Date: {booking_details['date']}\n"
        f"🕐 Time: {booking_details['time']} - {booking_details['endTime']}\n"
        f"💰 Amount: ₹{booking_details['cost']}\n"
        f"Show your QR at the gate!"
    )
    send_whatsapp(user_phone, wa_text)


def notify_booking_reminder(user_email: str, user_phone: str, booking_details: dict):
    """Sends a booking reminder via Email and SMS."""
    # Email
    subject = "Reminder: Your Parking Booking Starts Soon - ParkNow"
    body = (
        f"Hello! Just a reminder that your parking booking {booking_details['id']} starts in 30 minutes.\n"
        f"Slot: {booking_details['slotId']}\n"
        f"Starting at: {booking_details['time']}\n"
        "We'll see you there!"
    )
    send_email(user_email, subject, body)

    # WhatsApp
    wa_text = (
        f"🅿 *ParkNow* — Reminder!\n"
        f"🎫 Booking {booking_details['id']} for slot {booking_details['slotId']}\n"
        f"🕐 Starts in 30 minutes ({booking_details['time']})\n"
        f"Drive safe! 🚗"
    )
    send_whatsapp(user_phone, wa_text)
