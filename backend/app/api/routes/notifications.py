from typing import Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.models.notification import Notification
from app.services.notification_service import NotificationService

router = APIRouter()

def format_notification_response(n: Notification) -> dict:
    return {
        "id": n.id,
        "user_id": n.user_id,
        "title": n.title,
        "message": n.message,
        "read": n.read_flag,
        "created_at": n.created_at,
        "updated_at": n.updated_at
    }

@router.get("", response_model=dict)
def list_my_notifications(
    unread_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    items, total = NotificationService.get_user_notifications(
        db, user=current_user, unread_only=unread_only, skip=skip, limit=limit
    )
    unread_count = NotificationService.get_unread_count(db, current_user)
    return {
        "success": True,
        "data": [format_notification_response(n) for n in items],
        "total": total,
        "unread_count": unread_count,
        "skip": skip,
        "limit": limit
    }

@router.get("/unread-count", response_model=dict)
def get_unread_count(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    count = NotificationService.get_unread_count(db, current_user)
    return {
        "success": True,
        "unread_count": count
    }

@router.patch("/{notification_id}/read", response_model=dict)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    notif = NotificationService.mark_as_read(db, current_user, notification_id)
    return {
        "success": True,
        "message": "Notification marked as read.",
        "data": format_notification_response(notif)
    }

@router.patch("/read-all", response_model=dict)
def mark_all_notifications_read(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    count = NotificationService.mark_all_as_read(db, current_user)
    return {
        "success": True,
        "message": f"Marked {count} notification(s) as read."
    }
