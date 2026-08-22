import pytest
import secrets
from app.core import security
from app.models.user import User, RoleEnum
from tests.conftest import TestingSessionLocal, client

def create_admin_user():
    db = TestingSessionLocal()
    user = User(
        email=f"admin_{secrets.token_hex(4)}@dayflow.com",
        password_hash=security.get_password_hash("adminpass123"),
        role=RoleEnum.ADMIN,
        active=True,
        must_change_password=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = security.create_access_token(user.id)
    db.close()
    return user, token

def create_employee_user():
    db = TestingSessionLocal()
    user = User(
        email=f"emp_{secrets.token_hex(4)}@dayflow.com",
        password_hash=security.get_password_hash("emppass123"),
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

def test_admin_access_reports(client):
    admin, token = create_admin_user()

    r1 = client.get("/api/reports/employee", headers={"Authorization": f"Bearer {token}"})
    assert r1.status_code == 200
    assert "total_employees" in r1.json()["data"]

    r2 = client.get("/api/reports/attendance", headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 200
    assert "total_worked_hours" in r2.json()["data"]

    r3 = client.get("/api/reports/leave", headers={"Authorization": f"Bearer {token}"})
    assert r3.status_code == 200
    assert "total_requests" in r3.json()["data"]

    r4 = client.get("/api/reports/payroll", headers={"Authorization": f"Bearer {token}"})
    assert r4.status_code == 200
    assert "total_payrolls" in r4.json()["data"]

def test_admin_export_reports_csv(client):
    admin, token = create_admin_user()

    exp_res = client.get("/api/reports/export?type=employee", headers={"Authorization": f"Bearer {token}"})
    assert exp_res.status_code == 200
    assert "text/csv" in exp_res.headers["content-type"]
    assert "Total Employees" in exp_res.text

def test_employee_cannot_access_reports(client):
    user, token = create_employee_user()

    res = client.get("/api/reports/employee", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403

    exp_res = client.get("/api/reports/export?type=payroll", headers={"Authorization": f"Bearer {token}"})
    assert exp_res.status_code == 403
