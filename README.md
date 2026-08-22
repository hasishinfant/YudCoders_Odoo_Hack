# Dayflow HRMS — Official Odoo Hackathon Platform

Dayflow HRMS is a modern, enterprise-grade Human Resource Management System built for the Odoo Hackathon using a high-performance **FastAPI (Python 3.12+)** backend and a **React + TypeScript + Vite + Tailwind CSS + shadcn/ui** frontend.

---

## 🚀 Key Modules & Capabilities

1. **Authentication & RBAC**:
   - Auto-generated Login ID format (`OIAS0001`) and initial setup credentials.
   - Force password change workflow on first login.
   - Strict Role-Based Access Control (`ADMIN` vs `EMPLOYEE`).
   - Standardized HTTP status error handling (`401`, `403`, `404`, `422`, `500`).

2. **Employee Management**:
   - Comprehensive employee profile directory.
   - Soft-delete activation/deactivation support.
   - Department assignment, job title, contact information, skills, and certifications.

3. **Attendance Management**:
   - Daily Check-In / Check-Out tracking.
   - Backend calculated worked hours and overtime/extra hours.
   - Approved leave precedence (automatically displayed as `ON LEAVE`).

4. **Time Off / Leave Management**:
   - Configurable leave types (Paid Time Off, Sick Leave, Unpaid Leave).
   - Balance tracking against maximum days entitlement.
   - Overlap validation & entitlement validation.
   - Admin approval / refusal workflow with mandatory refusal comments.

5. **Payroll & Salary Management**:
   - `Decimal` monetary precision strategy preventing IEEE 754 floating-point inaccuracies.
   - Monthly payroll generation for individual employees or batch organization.
   - Controlled status transitions (`DRAFT` $\rightarrow$ `PROCESSED` $\rightarrow$ `PAID` / `CANCELLED`).
   - Professional Odoo-style printable payslips.

6. **Document Management**:
   - Secure local file storage abstraction (`uploads/`).
   - Category tags (`Resume`, `ID Proof`, `Contract`, `Tax`, `Certification`, `General`).
   - Employee self-service upload & Admin global directory.

7. **Notification Center**:
   - Header Bell Icon with real-time unread badge counter and dropdown drawer.
   - Automated event triggers on leave submissions, approvals, refusals, payroll generation/payment, and employee creation.

8. **HR Analytics & Reports**:
   - 4 core executive reports (Employee Headcount, Attendance Summary, Leave Summary, Payroll Expenditure).
   - Backend CSV report export.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.12+, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic V2, JWT (PyJWT), Passlib (Bcrypt), Pytest.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide Icons, React Router DOM, Axios.
- **Database**: PostgreSQL (Production) / SQLite (Development & Testing).

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── alembic/              # Database migration scripts
│   ├── app/
│   │   ├── api/routes/       # FastAPI route handlers
│   │   ├── core/             # Database config, security, JWT dependencies
│   │   ├── models/           # SQLAlchemy 2.x models
│   │   ├── repositories/     # Data repository layer
│   │   ├── schemas/          # Pydantic validation models
│   │   ├── services/         # Core business logic layer
│   │   └── main.py           # Application entrypoint
│   ├── tests/                # Pytest test suite (63 passing tests)
│   └── uploads/              # Local storage directory for document attachments
└── frontend/
    ├── src/
    │   ├── components/       # UI components (Attendance, Payroll, Documents, Notifications)
    │   ├── hooks/            # Custom hooks (Auth context)
    │   ├── layouts/          # Responsive MainLayout with sidebar & header bell
    │   ├── pages/            # Page views (Dashboard, Employees, Attendance, TimeOff, Payroll, Documents, Reports)
    │   └── services/         # Axios API clients
    └── package.json
```

---

## ⚡ Quickstart Setup Guide

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Running Automated Tests

### Backend Tests (Pytest)
```bash
cd backend
venv\Scripts\activate
$env:PYTHONPATH="."
pytest tests/
```

### Frontend Build Check
```bash
cd frontend
npm run build
```

---

## 📄 License
Internal Hackathon Release — All Rights Reserved Dayflow HRMS Team.
