
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv("../.env")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def test_email():
    print(f"Testing SMTP: {SMTP_HOST}:{SMTP_PORT}")
    print(f"User: {SMTP_USER}")
    
    if not SMTP_USER or not SMTP_PASSWORD:
        print("❌ Error: SMTP credentials missing in .env")
        return

    try:
        msg = MIMEMultipart()
        msg["From"] = SMTP_USER
        msg["To"] = SMTP_USER
        msg["Subject"] = "ParkNow SMTP Test"
        msg.attach(MIMEText("Test successful!", "plain"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.set_debuglevel(1)
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, SMTP_USER, msg.as_string())
        
        print("✅ Email sent successfully!")
    except Exception as e:
        print(f"❌ Email failed: {e}")

if __name__ == "__main__":
    test_email()
