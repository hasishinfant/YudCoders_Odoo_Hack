from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import (
    health, 
    auth, 
    employees, 
    departments, 
    attendance, 
    leave_types, 
    leave_requests, 
    payroll, 
    documents, 
    notifications, 
    reports,
    company_info
)
from app.core.database import Base, engine
import app.models

# Auto create database tables for SQLite
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Dayflow API",
    description="Dayflow HRMS Backend",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(employees.router, prefix="/api/employees", tags=["employees"])
app.include_router(departments.router, prefix="/api/departments", tags=["departments"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["attendance"])
app.include_router(leave_types.router, prefix="/api/leave-types", tags=["leave-types"])
app.include_router(leave_requests.router, prefix="/api/leave-requests", tags=["leave-requests"])
app.include_router(payroll.router, prefix="/api/payroll", tags=["payroll"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(company_info.router, prefix="/api", tags=["company-info"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Dayflow API"}
