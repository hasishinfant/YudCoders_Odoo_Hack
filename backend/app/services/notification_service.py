from typing import Optional, List, Tuple
import threading
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User, RoleEnum
from app.models.notification import Notification
from app.core.mail import send_email

def send_notification_email(to_email: str, title: str, message: str):
    subject = f"[Dayflow Notification] {title}"
    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #fff;">
          <div style="background-color: #0052FF; color: #fff; padding: 15px 20px; border-radius: 8px 8px 0 0; font-weight: bold; font-size: 16px;">
            Dayflow Hub - Notification
          </div>
          <div style="padding: 20px 0;">
            <h2 style="margin-top: 0; color: #1e293b;">{title}</h2>
            <p style="font-size: 14px; color: #475569;">{message}</p>
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 15px; font-size: 11px; color: #94a3b8; text-align: center;">
            This is an automated notification from your Dayflow HR Portal.
          </div>
        </div>
      </body>
    </html>
    """
    send_email(to_email, subject, body)

class NotificationService:
    @staticmethod
    def create_notification(db: Session, user_id: int, title: str, message: str) -> Notification:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            read_flag=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        
        # Send Email in background thread
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.email:
                threading.Thread(target=send_notification_email, args=(user.email, title, message), daemon=True).start()
        except Exception as e:
            print(f"Failed to queue notification email: {e}")
            
        return notif

    @staticmethod
    def notify_admins(db: Session, title: str, message: str) -> List[Notification]:
        admins = db.query(User).filter(User.role == RoleEnum.ADMIN, User.active == True).all()
        created = []
        for admin in admins:
            notif = Notification(
                user_id=admin.id,
                title=title,
                message=message,
                read_flag=False
            )
            db.add(notif)
            created.append(notif)
            
            # Send Email in background thread
            if admin.email:
                try:
                    threading.Thread(target=send_notification_email, args=(admin.email, title, message), daemon=True).start()
                except Exception as e:
                    print(f"Failed to queue notification email for admin: {e}")
                    
        db.commit()
        for n in created:
            db.refresh(n)
        return created

    @staticmethod
    def get_user_notifications(db: Session, user: User, unread_only: bool = False, skip: int = 0, limit: int = 20) -> Tuple[List[Notification], int]:
        q = db.query(Notification).filter(Notification.user_id == user.id)
        if unread_only:
            q = q.filter(Notification.read_flag == False)
        q = q.order_by(Notification.created_at.desc())
        total = q.count()
        items = q.offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def get_unread_count(db: Session, user: User) -> int:
        return db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.read_flag == False
        ).count()

    @staticmethod
    def mark_as_read(db: Session, user: User, notification_id: int) -> Notification:
        notif = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notif:
            raise HTTPException(status_code=404, detail="Notification not found.")
        if notif.user_id != user.id:
            raise HTTPException(status_code=403, detail="Cannot access another user's notification.")

        notif.read_flag = True
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def mark_all_as_read(db: Session, user: User) -> int:
        count = db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.read_flag == False
        ).update({"read_flag": True})
        db.commit()
        return count
