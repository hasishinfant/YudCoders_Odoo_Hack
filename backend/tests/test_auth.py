import pytest
from app.core import security
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.core.utils import generate_login_id, generate_initial_password
from tests.conftest import TestingSessionLocal, client

def create_user_for_test(email, password, role=RoleEnum.EMPLOYEE, must_change_password=True, active=True):
    db = TestingSessionLocal()
    hashed_password = security.get_password_hash(password)
    user = User(
        email=email,
        password_hash=hashed_password,
        role=role,
        active=active,
        must_change_password=must_change_password
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user

def create_employee_for_test(email, password, employee_code):
    user = create_user_for_test(email, password)
    db = TestingSessionLocal()
    emp = Employee(
        user_id=user.id,
        employee_code=employee_code,
        first_name="John",
        last_name="Doe",
    )
    db.add(emp)
    db.commit()
    db.close()

def test_password_hashing():
    password = "secretpassword"
    hashed = security.get_password_hash(password)
    assert security.verify_password(password, hashed)
    assert not security.verify_password("wrongpassword", hashed)

def test_jwt_generation_and_decode():
    token = security.create_access_token(subject="123")
    assert isinstance(token, str)

def test_public_registration_disabled(client):
    response = client.post("/api/auth/register", json={
        "email": "hacker@dayflow.com",
        "password": "password123",
        "role": "ADMIN"
    })
    assert response.status_code == 404

def test_login_success(client):
    create_user_for_test("login@dayflow.com", "password123")
    
    response = client.post("/api/auth/login", json={
        "identifier": "login@dayflow.com",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data["data"]
    assert data["data"]["must_change_password"] is True

def test_login_invalid_password(client):
    create_user_for_test("login2@dayflow.com", "password123")
    response = client.post("/api/auth/login", json={
        "identifier": "login2@dayflow.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_inactive_user_cannot_login(client):
    create_user_for_test("inactive@dayflow.com", "password123", active=False)
    response = client.post("/api/auth/login", json={
        "identifier": "inactive@dayflow.com",
        "password": "password123"
    })
    assert response.status_code == 403

def test_get_current_user(client):
    create_user_for_test("me@dayflow.com", "password123")
    login_res = client.post("/api/auth/login", json={
        "identifier": "me@dayflow.com",
        "password": "password123"
    })
    token = login_res.json()["data"]["access_token"]
    
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["data"]["email"] == "me@dayflow.com"

def test_get_current_user_no_token(client):
    me_res = client.get("/api/auth/me")
    assert me_res.status_code == 401

def test_login_id_generator():
    db = TestingSessionLocal()
    login_id = generate_login_id(db, "Odoo India", "John", "Doe", 2023)
    assert login_id == "OIJD20230001"
    
    user = User(email="j_gen@d.com", password_hash="h", role=RoleEnum.EMPLOYEE)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    emp = Employee(user_id=user.id, employee_code="OIJD20230001", first_name="J", last_name="D")
    db.add(emp)
    db.commit()
    
    login_id_2 = generate_login_id(db, "Odoo India", "John", "Doe", 2023)
    assert login_id_2 == "OIJD20230002"
    db.close()

def test_initial_password_generator():
    pwd = generate_initial_password()
    assert len(pwd) >= 12
    assert any(c.islower() for c in pwd)
    assert any(c.isupper() for c in pwd)
    assert any(c.isdigit() for c in pwd)
    assert any(c in "!@#$%^&*" for c in pwd)

def test_login_by_employee_code(client):
    create_employee_for_test("empcode@dayflow.com", "password123", "OIJD20230099")
    
    response = client.post("/api/auth/login", json={
        "identifier": "OIJD20230099",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["user"]["email"] == "empcode@dayflow.com"

def test_change_password(client):
    create_user_for_test("changepwd@dayflow.com", "oldpassword", must_change_password=True)
    
    login_res = client.post("/api/auth/login", json={
        "identifier": "changepwd@dayflow.com",
        "password": "oldpassword"
    })
    token = login_res.json()["data"]["access_token"]
    
    change_res = client.post(
        "/api/auth/change-password",
        json={
            "current_password": "oldpassword",
            "new_password": "NewSecurePassword123!",
            "confirm_new_password": "NewSecurePassword123!"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert change_res.status_code == 200
    
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.json()["data"]["must_change_password"] is False
    
    fail_res = client.post("/api/auth/login", json={
        "identifier": "changepwd@dayflow.com",
        "password": "oldpassword"
    })
    assert fail_res.status_code == 401
    
    success_res = client.post("/api/auth/login", json={
        "identifier": "changepwd@dayflow.com",
        "password": "NewSecurePassword123!"
    })
    assert success_res.status_code == 200
