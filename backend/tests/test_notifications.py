import pytest
import secrets
from app.core import security
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.department import Department
from app.models.notification import Notification
from app.services.notification_service import NotificationService
from tests.conftest import TestingSessionLocal, client

def create_user():
    db = TestingSessionLocal()
    user = User(
        email=f"user_{secrets.token_hex(4)}@dayflow.com",
        password_hash=security.get_password_hash("pass123"),
        role=RoleEnum.EMPLOYEE,
        active=True,
        must_change_password=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = security.create_access_token(user.id)
    db.close()
    return user, token

def test_notification_creation_and_retrieval(client):
    user, token = create_user()

    db = TestingSessionLocal()
    NotificationService.create_notification(db, user_id=user.id, title="Test Notification", message="Hello World")
    db.close()

    res = client.get("/api/notifications", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert data["unread_count"] >= 1
    assert data["data"][0]["title"] == "Test Notification"

def test_mark_notification_as_read(client):
    user, token = create_user()

    db = TestingSessionLocal()
    n = NotificationService.create_notification(db, user_id=user.id, title="Unread Title", message="Unread Message")
    notif_id = n.id
    db.close()

    res = client.patch(f"/api/notifications/{notif_id}/read", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["data"]["read"] is True

def test_mark_all_notifications_read(client):
    user, token = create_user()

    db = TestingSessionLocal()
    NotificationService.create_notification(db, user_id=user.id, title="N1", message="M1")
    NotificationService.create_notification(db, user_id=user.id, title="N2", message="M2")
    db.close()

    res = client.patch("/api/notifications/read-all", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200

    count_res = client.get("/api/notifications/unread-count", headers={"Authorization": f"Bearer {token}"})
    assert count_res.json()["unread_count"] == 0
