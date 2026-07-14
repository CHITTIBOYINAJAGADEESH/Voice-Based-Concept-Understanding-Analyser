import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "jagadeeshchittiboyina07@gmail.com")
SMTP_PASS = os.getenv("SMTP_PASS", "zncqnwlbugtcwmmw")
EMAIL_FROM = os.getenv("EMAIL_FROM", "VBCUA <jagadeeshchittiboyina07@gmail.com>")

def send_otp_email(to_email: str, otp: str, purpose: str = "registration") -> bool:
    """
    Sends an email containing a 6-digit OTP code using SMTP.
    Supports registration and forgot-password templates.
    """
    msg = MIMEMultipart()
    msg['From'] = EMAIL_FROM
    msg['To'] = to_email
    
    if purpose == "registration":
        msg['Subject'] = "VBCUA - Verify Your Email Registration"
        body = f"""
        <html>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #1f2937; background-color: #f9fafb;">
            <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 25px;">
                    <span style="font-size: 24px; font-weight: 800; color: #14b8a6; letter-spacing: 0.5px;">VBCUA ANALYSER</span>
                </div>
                <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 10px;">Welcome to VBCUA!</h2>
                <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                    Thank you for registering. To complete your sign-up process, please verify your email using the verification code (OTP) below:
                </p>
                <div style="font-size: 32px; font-weight: 800; background-color: #f0fdfa; padding: 18px; border-radius: 10px; text-align: center; margin: 25px 0; color: #14b8a6; letter-spacing: 4px; border: 1px solid #99f6e4;">
                    {otp}
                </div>
                <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
                    This code is valid for 10 minutes. If you did not initiate this registration, you can safely ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 25px 0;" />
                <p style="font-size: 11px; text-align: center; color: #9ca3af;">
                    Voice-Based Concept Understanding Analyser • Powered by AI
                </p>
            </div>
        </body>
        </html>
        """
    else:
        msg['Subject'] = "VBCUA - Password Reset Verification Code"
        body = f"""
        <html>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #1f2937; background-color: #f9fafb;">
            <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 25px;">
                    <span style="font-size: 24px; font-weight: 800; color: #ef4444; letter-spacing: 0.5px;">VBCUA ANALYSER</span>
                </div>
                <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 10px; color: #ef4444;">Reset Your Password</h2>
                <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                    We received a request to reset your password. Use the following verification code (OTP) to proceed:
                </p>
                <div style="font-size: 32px; font-weight: 800; background-color: #fef2f2; padding: 18px; border-radius: 10px; text-align: center; margin: 25px 0; color: #ef4444; letter-spacing: 4px; border: 1px solid #fecaca;">
                    {otp}
                </div>
                <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
                    This code is valid for 10 minutes. If you did not request a password reset, you can safely ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 25px 0;" />
                <p style="font-size: 11px; text-align: center; color: #9ca3af;">
                    Voice-Based Concept Understanding Analyser • Powered by AI
                </p>
            </div>
        </body>
        </html>
        """
        
    msg.attach(MIMEText(body, 'html'))
    
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send email via SMTP: {e}")
        return False
