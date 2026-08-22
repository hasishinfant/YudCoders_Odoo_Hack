import pytest
import secrets
from datetime import date, timedelta
from app.core import security
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.department import Department
from app.models.leave import LeaveType
from app.services.leave_service import LeaveService
from tests.conftest import TestingSessionLocal, client

def test_full_hrms_end_to_end_workflow(client):
    # 1. Setup Admin
    db = TestingSessionLocal()
    dept = Department(name=f"Engineering_{secrets.token_hex(3)}")
    db.add(dept)
    db.commit()
    dept_id = dept.id

    admin = User(
        email=f"admin_{secrets.token_hex(4)}@dayflow.com",
        password_hash=security.get_password_hash("adminpass123"),
        role=RoleEnum.ADMIN,
        active=True,
        must_change_password=False
    )
    db.add(admin)
    db.commit()
    admin_token = security.create_access_token(admin.id)

    lt = LeaveService.seed_default_leave_types(db)[0]
    db.close()

    # 2. Admin Creates Employee
    emp_res = client.post(
        "/api/employees",
        json={
            "first_name": "Jane",
            "last_name": "Smith",
            "email": f"jane_{secrets.token_hex(4)}@dayflow.com",
            "job_title": "Software Engineer",
            "department_id": dept_id
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert emp_res.status_code == 200
    emp_data = emp_res.json()["data"]
    login_id = emp_data["login_id"]
    initial_password = emp_data["initial_password"]

    # 3. Employee Logs in using Login ID
    login_res = client.post(
        "/api/auth/login",
        json={"identifier": login_id, "password": initial_password}
    )
    login_data = login_res.json()["data"]
    emp_token = login_data["access_token"]
    must_change = login_data["must_change_password"]
    assert must_change is True

    # 4. Employee Changes Password
    pwd_res = client.post(
        "/api/auth/change-password",
        json={
            "current_password": initial_password,
            "new_password": "NewEmpPass123!",
            "confirm_new_password": "NewEmpPass123!"
        },
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert pwd_res.status_code == 200

    # 5. Employee Checks In and Checks Out
    checkin_res = client.post("/api/attendance/check-in", headers={"Authorization": f"Bearer {emp_token}"})
    assert checkin_res.status_code == 200

    checkout_res = client.post("/api/attendance/check-out", headers={"Authorization": f"Bearer {emp_token}"})
    assert checkout_res.status_code == 200
    assert checkout_res.json()["data"]["worked_hours"] is not None

    # 6. Employee Requests Leave
    today = date.today()
    leave_res = client.post(
        "/api/leave-requests",
        json={
            "leave_type_id": lt.id,
            "start_date": str(today + timedelta(days=5)),
            "end_date": str(today + timedelta(days=7)),
            "reason": "Vacation"
        },
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert leave_res.status_code == 200
    leave_id = leave_res.json()["data"]["id"]

    # 7. Admin Approves Leave
    app_res = client.patch(
        f"/api/leave-requests/{leave_id}/approve",
        json={"comment": "Enjoy your vacation"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert app_res.status_code == 200

    # 8. Admin Configures Salary & Generates Payroll
    sal_res = client.post(
        "/api/payroll/salary",
        json={
            "employee_id": emp_data["id"],
            "basic_salary": "65000.00",
            "allowances": "8000.00",
            "deductions": "2500.00"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert sal_res.status_code == 200

    gen_res = client.post(
        "/api/payroll/generate",
        json={"month": 8, "year": 2026, "employee_id": emp_data["id"]},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert gen_res.status_code == 200
    p_id = gen_res.json()["data"][0]["id"]

    # 9. Admin Processes & Pays Payroll
    client.patch(f"/api/payroll/{p_id}/process", headers={"Authorization": f"Bearer {admin_token}"})
    pay_res = client.patch(f"/api/payroll/{p_id}/pay", headers={"Authorization": f"Bearer {admin_token}"})
    assert pay_res.status_code == 200
    assert pay_res.json()["data"]["status"] == "PAID"

    # 10. Employee Views Payslip & Checks Notifications
    payslip_res = client.get(f"/api/payroll/{p_id}", headers={"Authorization": f"Bearer {emp_token}"})
    assert payslip_res.status_code == 200
    assert float(payslip_res.json()["data"]["net_salary"]) == 70500.0

    notif_res = client.get("/api/notifications", headers={"Authorization": f"Bearer {emp_token}"})
    assert notif_res.status_code == 200
    assert notif_res.json()["total"] >= 1

    # 11. Admin Export Reports
    rep_res = client.get("/api/reports/employee", headers={"Authorization": f"Bearer {admin_token}"})
    assert rep_res.status_code == 200
    assert rep_res.json()["data"]["total_employees"] >= 1
