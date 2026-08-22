import pytest
import secrets
from datetime import datetime, date, timedelta, timezone
from app.core import security
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.department import Department
from app.models.leave import LeaveType, LeaveRequest, LeaveStatusEnum
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
        employee_code=f"EMP{secrets.token_hex(4)}",
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

def get_default_leave_type():
    db = TestingSessionLocal()
    lt = db.query(LeaveType).filter(LeaveType.name == "Paid Time Off").first()
    if not lt:
        lt = LeaveType(name="Paid Time Off", description="Paid", paid=True, max_days=15, active=True)
        db.add(lt)
        db.commit()
        db.refresh(lt)
    db.close()
    return lt

def test_employee_create_leave_request(client):
    user, emp, token = create_employee_user()
    lt = get_default_leave_type()

    today = date.today()
    start = today + timedelta(days=5)
    end = today + timedelta(days=7)

    res = client.post(
        "/api/leave-requests",
        json={
            "leave_type_id": lt.id,
            "start_date": str(start),
            "end_date": str(end),
            "reason": "Family vacation"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["employee_id"] == emp.id
    assert data["status"] == "PENDING"
    assert data["duration_days"] == 3
    assert data["reason"] == "Family vacation"

    db = TestingSessionLocal()
    audit = db.query(AuditLog).filter(AuditLog.action == "CREATE_LEAVE_REQUEST").first()
    assert audit is not None
    assert audit.user_id == user.id
    db.close()

def test_invalid_date_range_rejected(client):
    user, emp, token = create_employee_user()
    lt = get_default_leave_type()

    today = date.today()
    start = today + timedelta(days=10)
    end = today + timedelta(days=5) # Start after end

    res = client.post(
        "/api/leave-requests",
        json={
            "leave_type_id": lt.id,
            "start_date": str(start),
            "end_date": str(end)
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 400
    assert "Start date cannot be after end date" in res.json()["detail"]

def test_overlapping_leave_request_rejected(client):
    user, emp, token = create_employee_user()
    lt = get_default_leave_type()

    today = date.today()
    # 1. Create first request: 10 to 12
    client.post(
        "/api/leave-requests",
        json={
            "leave_type_id": lt.id,
            "start_date": str(today + timedelta(days=10)),
            "end_date": str(today + timedelta(days=12))
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    # 2. Try overlapping request: 11 to 14
    res = client.post(
        "/api/leave-requests",
        json={
            "leave_type_id": lt.id,
            "start_date": str(today + timedelta(days=11)),
            "end_date": str(today + timedelta(days=14))
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 400
    assert "overlaps" in res.json()["detail"]

def test_employee_cancel_own_pending_request(client):
    user, emp, token = create_employee_user()
    lt = get_default_leave_type()

    today = date.today()
    create_res = client.post(
        "/api/leave-requests",
        json={
            "leave_type_id": lt.id,
            "start_date": str(today + timedelta(days=15)),
            "end_date": str(today + timedelta(days=16))
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    req_id = create_res.json()["data"]["id"]

    cancel_res = client.patch(
        f"/api/leave-requests/{req_id}/cancel",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["data"]["status"] == "CANCELLED"

def test_cancelled_request_does_not_block_new_request(client):
    user, emp, token = create_employee_user()
    lt = get_default_leave_type()

    today = date.today()
    start = today + timedelta(days=20)
    end = today + timedelta(days=22)

    # Create & cancel
    create_res = client.post(
        "/api/leave-requests",
        json={"leave_type_id": lt.id, "start_date": str(start), "end_date": str(end)},
        headers={"Authorization": f"Bearer {token}"}
    )
    req_id = create_res.json()["data"]["id"]
    client.patch(f"/api/leave-requests/{req_id}/cancel", headers={"Authorization": f"Bearer {token}"})

    # Submit new request on same dates
    new_res = client.post(
        "/api/leave-requests",
        json={"leave_type_id": lt.id, "start_date": str(start), "end_date": str(end)},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert new_res.status_code == 200

def test_admin_approve_leave_request(client):
    admin, admin_token = create_admin_user()
    user, emp, emp_token = create_employee_user()
    lt = get_default_leave_type()

    today = date.today()
    create_res = client.post(
        "/api/leave-requests",
        json={"leave_type_id": lt.id, "start_date": str(today + timedelta(days=1)), "end_date": str(today + timedelta(days=3))},
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    req_id = create_res.json()["data"]["id"]

    # Admin approves
    approve_res = client.patch(
        f"/api/leave-requests/{req_id}/approve",
        json={"comment": "Approved by Admin"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert approve_res.status_code == 200
    data = approve_res.json()["data"]
    assert data["status"] == "APPROVED"
    assert data["approver_id"] == admin.id

def test_admin_refuse_leave_request_requires_reason(client):
    admin, admin_token = create_admin_user()
    user, emp, emp_token = create_employee_user()
    lt = get_default_leave_type()

    today = date.today()
    create_res = client.post(
        "/api/leave-requests",
        json={"leave_type_id": lt.id, "start_date": str(today + timedelta(days=2)), "end_date": str(today + timedelta(days=4))},
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    req_id = create_res.json()["data"]["id"]

    # Refuse without comment fails
    fail_res = client.patch(
        f"/api/leave-requests/{req_id}/refuse",
        json={"comment": ""},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert fail_res.status_code == 422 # Pydantic validation error for min_length=1

    # Refuse with comment succeeds
    refuse_res = client.patch(
        f"/api/leave-requests/{req_id}/refuse",
        json={"comment": "Insufficient team coverage"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert refuse_res.status_code == 200
    assert refuse_res.json()["data"]["status"] == "REFUSED"
    assert refuse_res.json()["data"]["comment"] == "Insufficient team coverage"

def test_employee_cannot_approve_or_refuse_leave(client):
    user1, emp1, emp1_token = create_employee_user()
    user2, emp2, emp2_token = create_employee_user()
    lt = get_default_leave_type()

    today = date.today()
    create_res = client.post(
        "/api/leave-requests",
        json={"leave_type_id": lt.id, "start_date": str(today + timedelta(days=1)), "end_date": str(today + timedelta(days=2))},
        headers={"Authorization": f"Bearer {emp1_token}"}
    )
    req_id = create_res.json()["data"]["id"]

    # Employee 2 tries to approve -> 403
    app_res = client.patch(f"/api/leave-requests/{req_id}/approve", headers={"Authorization": f"Bearer {emp2_token}"})
    assert app_res.status_code == 403

    # Employee 2 tries to refuse -> 403
    ref_res = client.patch(f"/api/leave-requests/{req_id}/refuse", json={"comment": "No"}, headers={"Authorization": f"Bearer {emp2_token}"})
    assert ref_res.status_code == 403

def test_get_leave_balances(client):
    user, emp, token = create_employee_user()
    lt = get_default_leave_type()

    res = client.get("/api/leave-requests/balances", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    balances = res.json()["data"]
    assert len(balances) >= 1
    pt = next(b for b in balances if b["leave_type_name"] == "Paid Time Off")
    assert pt["remaining_days"] == pt["max_days"]

def test_approved_leave_recognized_in_today_attendance(client):
    admin, admin_token = create_admin_user()
    user, emp, emp_token = create_employee_user()
    lt = get_default_leave_type()

    today = date.today()
    create_res = client.post(
        "/api/leave-requests",
        json={"leave_type_id": lt.id, "start_date": str(today), "end_date": str(today)},
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    req_id = create_res.json()["data"]["id"]
    client.patch(f"/api/leave-requests/{req_id}/approve", headers={"Authorization": f"Bearer {admin_token}"})

    # Today attendance for this employee should show status ON LEAVE
    att_res = client.get("/api/attendance/today", headers={"Authorization": f"Bearer {emp_token}"})
    assert att_res.status_code == 200
    assert att_res.json()["data"]["status"] == "LEAVE"

def test_real_attendance_takes_priority_over_approved_leave(client):
    admin, admin_token = create_admin_user()
    user, emp, emp_token = create_employee_user()
    lt = get_default_leave_type()

    today = date.today()
    create_res = client.post(
        "/api/leave-requests",
        json={"leave_type_id": lt.id, "start_date": str(today), "end_date": str(today)},
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    req_id = create_res.json()["data"]["id"]
    client.patch(f"/api/leave-requests/{req_id}/approve", headers={"Authorization": f"Bearer {admin_token}"})

    # Employee actually checks in!
    checkin_res = client.post("/api/attendance/check-in", headers={"Authorization": f"Bearer {emp_token}"})
    assert checkin_res.status_code == 200
    assert checkin_res.json()["data"]["status"] == "PRESENT"

    # Today attendance returns PRESENT
    att_res = client.get("/api/attendance/today", headers={"Authorization": f"Bearer {emp_token}"})
    assert att_res.json()["data"]["status"] == "PRESENT"
