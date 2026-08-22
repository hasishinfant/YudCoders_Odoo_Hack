import io
import pytest
import secrets
from app.core import security
from app.models.user import User, RoleEnum
from app.models.employee import Employee
from app.models.department import Department
from app.models.document import Document
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
    dept = Department(name=f"Dept_{secrets.token_hex(3)}")
    db.add(dept)
    db.commit()

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

def test_employee_upload_and_get_own_documents(client):
    user, emp, token = create_employee_user()

    file_content = b"Sample resume content"
    file_obj = io.BytesIO(file_content)

    upload_res = client.post(
        "/api/documents/upload",
        data={
            "employee_id": str(emp.id),
            "name": "My Resume",
            "type": "Resume"
        },
        files={"file": ("resume.pdf", file_obj, "application/pdf")},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert upload_res.status_code == 200
    doc_data = upload_res.json()["data"]

    assert doc_data["name"] == "My Resume"
    assert doc_data["employee_id"] == emp.id
    assert doc_data["type"] == "Resume"

    # Fetch own documents
    get_res = client.get("/api/documents/me", headers={"Authorization": f"Bearer {token}"})
    assert get_res.status_code == 200
    items = get_res.json()["data"]
    assert len(items) >= 1
    assert items[0]["name"] == "My Resume"

def test_employee_cannot_upload_document_for_other_employee(client):
    user1, emp1, token1 = create_employee_user()
    user2, emp2, token2 = create_employee_user()

    file_obj = io.BytesIO(b"Unauthorized file")
    res = client.post(
        "/api/documents/upload",
        data={
            "employee_id": str(emp2.id),
            "name": "Hacked Document",
            "type": "General"
        },
        files={"file": ("test.txt", file_obj, "text/plain")},
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert res.status_code == 403

def test_admin_view_and_delete_documents(client):
    admin, admin_token = create_admin_user()
    user, emp, emp_token = create_employee_user()

    # Employee uploads doc
    file_obj = io.BytesIO(b"Tax document")
    upload_res = client.post(
        "/api/documents/upload",
        data={"employee_id": str(emp.id), "name": "Tax Form", "type": "Tax"},
        files={"file": ("tax.pdf", file_obj, "application/pdf")},
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    doc_id = upload_res.json()["data"]["id"]

    # Admin lists all documents
    admin_list = client.get("/api/documents", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_list.status_code == 200
    assert admin_list.json()["total"] >= 1

    # Admin deletes document
    del_res = client.delete(f"/api/documents/{doc_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert del_res.status_code == 200
