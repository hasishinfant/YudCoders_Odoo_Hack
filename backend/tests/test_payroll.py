import pytest
import secrets
from datetime import datetime, date, timedelta, timezone
from decimal import Decimal
from app.core import security
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.department import Department
from app.models.payroll import EmployeeSalary, Payroll, PayrollStatusEnum
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

def test_employee_get_own_salary(client):
    user, emp, token = create_employee_user()

    res = client.get("/api/payroll/salary/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["employee_id"] == emp.id
    assert "basic_salary" in data
    assert "gross_salary" in data
    assert "net_salary" in data

def test_employee_cannot_access_other_employee_salary(client):
    user1, emp1, token1 = create_employee_user()
    user2, emp2, token2 = create_employee_user()

    res = client.get(f"/api/payroll/salary/{emp2.id}", headers={"Authorization": f"Bearer {token1}"})
    assert res.status_code == 403

def test_employee_cannot_modify_salary(client):
    user, emp, token = create_employee_user()

    res = client.post(
        "/api/payroll/salary",
        json={"employee_id": emp.id, "basic_salary": 60000.0, "allowances": 5000.0, "deductions": 2000.0},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403

def test_admin_set_and_update_employee_salary(client):
    admin, admin_token = create_admin_user()
    user, emp, emp_token = create_employee_user()

    # Admin sets salary
    res1 = client.post(
        "/api/payroll/salary",
        json={
            "employee_id": emp.id,
            "basic_salary": "75000.00",
            "allowances": "10000.00",
            "deductions": "3000.00",
            "effective_from": str(date.today())
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res1.status_code == 200
    d1 = res1.json()["data"]

    assert Decimal(str(d1["basic_salary"])) == Decimal("75000.00")
    assert Decimal(str(d1["gross_salary"])) == Decimal("85000.00")
    assert Decimal(str(d1["net_salary"])) == Decimal("82000.00")

    # Admin updates salary
    res2 = client.patch(
        f"/api/payroll/salary/{emp.id}",
        json={"basic_salary": "80000.00"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res2.status_code == 200
    d2 = res2.json()["data"]
    assert Decimal(str(d2["basic_salary"])) == Decimal("80000.00")
    assert Decimal(str(d2["gross_salary"])) == Decimal("90000.00")

def test_admin_generate_payroll_and_prevent_duplicates(client):
    admin, admin_token = create_admin_user()
    user, emp, emp_token = create_employee_user()

    # Generate payroll for 8/2026
    gen_res = client.post(
        "/api/payroll/generate",
        json={"month": 8, "year": 2026, "employee_id": emp.id},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert gen_res.status_code == 200
    payrolls = gen_res.json()["data"]
    assert len(payrolls) == 1
    p = payrolls[0]
    assert p["month"] == 8
    assert p["year"] == 2026
    assert p["status"] == "DRAFT"

    # Duplicate generation attempt fails
    dup_res = client.post(
        "/api/payroll/generate",
        json={"month": 8, "year": 2026, "employee_id": emp.id},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

def test_payroll_status_workflow(client):
    admin, admin_token = create_admin_user()
    user, emp, emp_token = create_employee_user()

    # 1. Generate Payroll
    gen_res = client.post(
        "/api/payroll/generate",
        json={"month": 9, "year": 2026, "employee_id": emp.id},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    p_id = gen_res.json()["data"][0]["id"]

    # 2. Process Payroll: DRAFT -> PROCESSED
    proc_res = client.patch(
        f"/api/payroll/{p_id}/process",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert proc_res.status_code == 200
    assert proc_res.json()["data"]["status"] == "PROCESSED"

    # 3. Pay Payroll: PROCESSED -> PAID
    pay_res = client.patch(
        f"/api/payroll/{p_id}/pay",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert pay_res.status_code == 200
    assert pay_res.json()["data"]["status"] == "PAID"

    # 4. Attempt invalid transition PAID -> CANCELLED fails
    cancel_res = client.patch(
        f"/api/payroll/{p_id}/cancel",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert cancel_res.status_code == 400

def test_employee_get_own_payroll_history(client):
    admin, admin_token = create_admin_user()
    user, emp, emp_token = create_employee_user()

    # Generate payroll
    client.post(
        "/api/payroll/generate",
        json={"month": 10, "year": 2026, "employee_id": emp.id},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    # Employee views history
    me_res = client.get("/api/payroll/me", headers={"Authorization": f"Bearer {emp_token}"})
    assert me_res.status_code == 200
    data = me_res.json()["data"]
    assert len(data) >= 1
    assert data[0]["employee_id"] == emp.id

def test_employee_cannot_access_other_employee_payslip(client):
    admin, admin_token = create_admin_user()
    user1, emp1, token1 = create_employee_user()
    user2, emp2, token2 = create_employee_user()

    gen_res = client.post(
        "/api/payroll/generate",
        json={"month": 11, "year": 2026, "employee_id": emp2.id},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    p_id = gen_res.json()["data"][0]["id"]

    # User 1 tries to access User 2's payslip
    res = client.get(f"/api/payroll/{p_id}", headers={"Authorization": f"Bearer {token1}"})
    assert res.status_code == 403

def test_admin_payroll_listing_and_filtering(client):
    admin, admin_token = create_admin_user()
    user, emp, emp_token = create_employee_user()

    client.post(
        "/api/payroll/generate",
        json={"month": 12, "year": 2026, "employee_id": emp.id},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    # Admin lists all payrolls
    res = client.get("/api/payroll", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert res.json()["total"] >= 1

    # Filter by month and year
    filter_res = client.get(f"/api/payroll?month=12&year=2026&employee_id={emp.id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert filter_res.status_code == 200
    assert filter_res.json()["total"] == 1
