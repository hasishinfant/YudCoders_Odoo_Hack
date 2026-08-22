import pytest
import secrets
from datetime import datetime, date, timedelta, timezone
from app.core import security
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.department import Department
from app.models.attendance import Attendance, AttendanceStatusEnum
from app.models.audit_log import AuditLog
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

def create_employee_user(active=True):
    db = TestingSessionLocal()
    dept = Department(name=f"Dept_{secrets.token_hex(3)}")
    db.add(dept)
    db.commit()

    user = User(
        email=f"emp_{secrets.token_hex(4)}@dayflow.com",
        password_hash=security.get_password_hash("emppass123"),
        role=RoleEnum.EMPLOYEE,
        active=active,
        must_change_password=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    emp = Employee(
        user_id=user.id,
        department_id=dept.id,
        employee_code=f"OIJD{secrets.randbelow(8999)+1000}",
        first_name="Test",
        last_name="User",
        job_title="Developer"
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)

    token = security.create_access_token(user.id)
    db.close()
    return user, emp, token

def test_employee_check_in(client):
    user, emp, token = create_employee_user()

    response = client.post(
        "/api/attendance/check-in",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()["data"]

    assert data["employee_id"] == emp.id
    assert data["status"] == "PRESENT"
    assert data["check_in"] is not None
    assert data["check_out"] is None

    # Audit Log check
    db = TestingSessionLocal()
    audit = db.query(AuditLog).filter(AuditLog.action == "CHECK_IN").first()
    assert audit is not None
    assert audit.user_id == user.id
    db.close()

def test_employee_cannot_check_in_twice(client):
    user, emp, token = create_employee_user()

    # First check-in
    res1 = client.post("/api/attendance/check-in", headers={"Authorization": f"Bearer {token}"})
    assert res1.status_code == 200

    # Second check-in
    res2 = client.post("/api/attendance/check-in", headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 400
    assert "Already checked in" in res2.json()["detail"]

def test_employee_check_out_and_hours_calculation(client):
    user, emp, token = create_employee_user()

    # Check in
    client.post("/api/attendance/check-in", headers={"Authorization": f"Bearer {token}"})

    # Check out
    res = client.post("/api/attendance/check-out", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["check_out"] is not None
    assert data["worked_hours"] is not None
    assert data["extra_hours"] is not None

    # Audit Log check
    db = TestingSessionLocal()
    audit = db.query(AuditLog).filter(AuditLog.action == "CHECK_OUT").first()
    assert audit is not None
    assert audit.user_id == user.id
    db.close()

def test_check_out_without_check_in_fails(client):
    user, emp, token = create_employee_user()

    res = client.post("/api/attendance/check-out", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 400
    assert "No check-in record found" in res.json()["detail"]

def test_employee_cannot_check_out_twice(client):
    user, emp, token = create_employee_user()

    client.post("/api/attendance/check-in", headers={"Authorization": f"Bearer {token}"})
    client.post("/api/attendance/check-out", headers={"Authorization": f"Bearer {token}"})

    # Second checkout
    res2 = client.post("/api/attendance/check-out", headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 400
    assert "Already checked out" in res2.json()["detail"]

def test_inactive_employee_cannot_check_in(client):
    user, emp, token = create_employee_user(active=False)

    res = client.post("/api/attendance/check-in", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403

def test_get_today_attendance(client):
    user, emp, token = create_employee_user()

    # Before check in
    res1 = client.get("/api/attendance/today", headers={"Authorization": f"Bearer {token}"})
    assert res1.status_code == 200
    assert res1.json()["data"] is None

    # Check in
    client.post("/api/attendance/check-in", headers={"Authorization": f"Bearer {token}"})

    # After check in
    res2 = client.get("/api/attendance/today", headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 200
    assert res2.json()["data"]["status"] == "PRESENT"

def test_employee_get_own_attendance_history(client):
    user, emp, token = create_employee_user()
    client.post("/api/attendance/check-in", headers={"Authorization": f"Bearer {token}"})

    res = client.get("/api/attendance/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) >= 1
    assert data[0]["employee_id"] == emp.id

def test_employee_cannot_access_admin_attendance(client):
    user, emp, token = create_employee_user()

    res = client.get("/api/attendance", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403

def test_employee_cannot_access_other_employee_attendance_detail(client):
    user1, emp1, token1 = create_employee_user()
    user2, emp2, token2 = create_employee_user()

    # User 2 checks in
    checkin_res = client.post("/api/attendance/check-in", headers={"Authorization": f"Bearer {token2}"})
    att_id = checkin_res.json()["data"]["id"]

    # User 1 tries to access User 2's attendance ID
    res = client.get(f"/api/attendance/{att_id}", headers={"Authorization": f"Bearer {token1}"})
    assert res.status_code == 403

def test_admin_view_and_filter_attendance(client):
    admin, admin_token = create_admin_user()
    user, emp, token = create_employee_user()

    client.post("/api/attendance/check-in", headers={"Authorization": f"Bearer {token}"})

    # Admin lists all attendance
    res = client.get("/api/attendance", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["total"] >= 1

    # Filter by employee_id
    res_emp = client.get(f"/api/attendance?employee_id={emp.id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_emp.status_code == 200
    assert res_emp.json()["total"] == 1

    # Filter by department_id
    res_dept = client.get(f"/api/attendance?department_id={emp.department_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_dept.status_code == 200
    assert res_dept.json()["total"] >= 1
