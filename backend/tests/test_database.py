import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.user import User, RoleEnum
from app.schemas.core import UserCreate
from pydantic import ValidationError

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture()
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_user_creation_schema():
    user = UserCreate(email="test@example.com", password="password123")
    assert user.email == "test@example.com"
    assert user.role == RoleEnum.EMPLOYEE

def test_invalid_email():
    with pytest.raises(ValidationError):
        UserCreate(email="invalid-email", password="password123")

def test_required_fields():
    with pytest.raises(ValidationError):
        UserCreate(email="test@example.com") # Missing password

def test_database_model(db):
    new_user = User(email="dbtest@example.com", password_hash="hash")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    assert new_user.id is not None
    assert new_user.email == "dbtest@example.com"
    assert new_user.role == RoleEnum.EMPLOYEE
