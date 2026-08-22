import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from sqlalchemy.orm import Session
from app.models.system_settings import SystemSetting
from app.core.database import SessionLocal

DEFAULT_SMTP_EMAIL = "flipclip0008@gmail.com"
DEFAULT_SMTP_PASSWORD = "cscoohorrehfjcqe" # Stripped spaces from 'csco ohor rehf jcqe'

def get_smtp_credentials(db: Session = None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
    
    try:
        email_setting = db.query(SystemSetting).filter(SystemSetting.key == "smtp_email").first()
        password_setting = db.query(SystemSetting).filter(SystemSetting.key == "smtp_password").first()
        
        email = email_setting.value if email_setting and email_setting.value else DEFAULT_SMTP_EMAIL
        password = password_setting.value if password_setting and password_setting.value else DEFAULT_SMTP_PASSWORD
        
        # Clean up password whitespace
        if password:
            password = "".join(password.split())
            
        return email, password
    finally:
        if close_db:
            db.close()

def send_email(to_email: str, subject: str, body: str, db: Session = None):
    from_email, password = get_smtp_credentials(db)
    
    if not from_email or not password:
        print("SMTP Credentials not set. Skipping email send.")
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(from_email, password)
        server.sendmail(from_email, to_email, msg.as_string())
        server.quit()
        print(f"Successfully sent email to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        return False
