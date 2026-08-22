import pytest
import secrets
from app.core import security
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.audit_log import AuditLog
from tests.conftest import TestingSessionLocal, client

def create_admin():
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

def create_employee(email=None):
    if not email:
        email = f"emp_{secrets.token_hex(4)}@dayflow.com"
    db = TestingSessionLocal()
    user = User(
        email=email,
        password_hash=security.get_password_hash("emppass123"),
        role=RoleEnum.EMPLOYEE,
        active=True,
        must_change_password=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    code = f"OIJD{secrets.randbelow(8999)+1000}"
    emp = Employee(
        user_id=user.id,
        employee_code=code,
        first_name="Jane",
        last_name="Doe",
        job_title="Software Engineer"
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)
    token = security.create_access_token(user.id)
    db.close()
    return user, emp, token

def test_admin_create_employee(client):
    admin, admin_token = create_admin()
    
    response = client.post(
        "/api/employees",
        json={
            "first_name": "Alice",
            "last_name": "Smith",
            "email": "alice.smith@dayflow.com",
            "job_title": "Product Manager",
            "company_name": "Odoo India"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()["data"]
    
    assert data["first_name"] == "Alice"
    assert data["last_name"] == "Smith"
    assert data["email"] == "alice.smith@dayflow.com"
    assert "login_id" in data
    assert "initial_password" in data
    assert data["login_id"].startswith("OIAS")
    
    db = TestingSessionLocal()
    user_db = db.query(User).filter(User.email == "alice.smith@dayflow.com").first()
    assert user_db is not None
    assert user_db.role == RoleEnum.EMPLOYEE
    assert user_db.must_change_password is True
    assert user_db.password_hash != data["initial_password"]
    
    emp_db = db.query(Employee).filter(Employee.user_id == user_db.id).first()
    assert emp_db is not None
    assert emp_db.employee_code == data["login_id"]
    
    audit = db.query(AuditLog).filter(AuditLog.action == "CREATE_EMPLOYEE").first()
    assert audit is not None
    assert audit.user_id == admin.id
    db.close()

def test_employee_cannot_create_employee(client):
    emp_user, emp, emp_token = create_employee()
    
    response = client.post(
        "/api/employees",
        json={
            "first_name": "Hacker",
            "last_name": "User",
            "email": "hacker@dayflow.com"
        },
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert response.status_code == 403

def test_unauthorized_request_fails(client):
    response = client.get("/api/employees")
    assert response.status_code == 401

def test_duplicate_email_rejected(client):
    admin, admin_token = create_admin()
    create_employee("existing@dayflow.com")
    
    response = client.post(
        "/api/employees",
        json={
            "first_name": "Duplicate",
            "last_name": "User",
            "email": "existing@dayflow.com"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 409

def test_get_employee_list_as_admin(client):
    admin, admin_token = create_admin()
    create_employee("emp1@dayflow.com")
    create_employee("emp2@dayflow.com")
    
    response = client.get(
        "/api/employees",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["total"] >= 2
    for emp_item in res_data["data"]:
        assert "password" not in emp_item
        assert "password_hash" not in emp_item
        assert "initial_password" not in emp_item

def test_get_employee_detail_as_admin(client):
    admin, admin_token = create_admin()
    _, emp, _ = create_employee("emp_detail@dayflow.com")
    
    response = client.get(
        f"/api/employees/{emp.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["id"] == emp.id
    assert data["email"] == "emp_detail@dayflow.com"

def test_employee_can_access_own_profile(client):
    _, emp, emp_token = create_employee("own_profile@dayflow.com")
    
    me_res = client.get(
        "/api/employees/me",
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert me_res.status_code == 200
    assert me_res.json()["data"]["id"] == emp.id

    id_res = client.get(
        f"/api/employees/{emp.id}",
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert id_res.status_code == 200
    assert id_res.json()["data"]["id"] == emp.id

def test_employee_cannot_access_other_employee_profile(client):
    _, emp1, emp1_token = create_employee("emp1_secret@dayflow.com")
    _, emp2, _ = create_employee("emp2_secret@dayflow.com")
    
    response = client.get(
        f"/api/employees/{emp2.id}",
        headers={"Authorization": f"Bearer {emp1_token}"}
    )
    assert response.status_code == 403

def test_admin_update_employee(client):
    admin, admin_token = create_admin()
    _, emp, _ = create_employee("update_me@dayflow.com")
    
    response = client.patch(
        f"/api/employees/{emp.id}",
        json={
            "job_title": "Senior Lead Engineer",
            "company_name": "Dayflow Enterprise"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["job_title"] == "Senior Lead Engineer"
    assert data["company_name"] == "Dayflow Enterprise"

def test_deactivate_employee_and_prevent_login(client):
    admin, admin_token = create_admin()
    user, emp, emp_token = create_employee("deactivate_me@dayflow.com")
    
    response = client.patch(
        f"/api/employees/{emp.id}/status",
        json={"active": False},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert response.json()["data"]["user_active"] is False
    assert response.json()["data"]["employment_status"] == "INACTIVE"
    
    login_res = client.post(
        "/api/auth/login",
        json={
            "identifier": "deactivate_me@dayflow.com",
            "password": "emppass123"
        }
    )
    assert login_res.status_code == 403
