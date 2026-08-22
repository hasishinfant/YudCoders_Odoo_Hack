from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User, RoleEnum
from app.models.notification import Notification

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
