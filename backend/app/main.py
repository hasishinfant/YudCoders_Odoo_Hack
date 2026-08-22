from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import health, auth, employees, departments

app = FastAPI(
    title="Dayflow API",
    description="Dayflow HRMS Backend",
    version="0.1.0",
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

@app.get("/")
def read_root():
    return {"message": "Welcome to Dayflow API"}
