import re
import secrets
import string
from typing import Optional
from sqlalchemy.orm import Session
from app.models.employee import Employee

def generate_initial_password(length: int = 12) -> str:
    """Generate a secure initial password with mixed character types."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        if (any(c.islower() for c in password) and
            any(c.isupper() for c in password) and
            any(c.isdigit() for c in password) and
            any(c in "!@#$%^&*" for c in password)):
            return password

def generate_login_id(
    db: Session,
    company_name: str,
    first_name: str,
    last_name: Optional[str],
    join_year: int
) -> str:
    """
    Generate login ID according to pattern:
    [Company first 2 letters][Employee first + last initials][Joining year][Serial]
    Example: OIJD20230001
    """
    # Clean and extract initials
    words = re.sub(r'[^A-Za-z ]', '', company_name).split()
    if len(words) >= 2:
        comp_prefix = (words[0][0] + words[1][0]).upper()
    else:
        comp_clean = words[0].upper() if words else "XX"
        comp_prefix = (comp_clean + 'XX')[:2]

    f_clean = re.sub(r'[^A-Za-z]', '', first_name).upper()
    l_clean = re.sub(r'[^A-Za-z]', '', last_name).upper() if last_name else ''
    
    first_initial = f_clean[0] if f_clean else 'X'
    last_initial = l_clean[0] if l_clean else 'X'
    emp_initials = first_initial + last_initial

    year_str = str(join_year)
    
    base_id = f"{comp_prefix}{emp_initials}{year_str}"
    
    # Query database to find latest serial for this base_id
    # Assuming employee_code is the login ID in Employee model
    existing_employees = db.query(Employee).filter(
        Employee.employee_code.like(f"{base_id}%")
    ).all()

    max_serial = 0
    for emp in existing_employees:
        serial_part = emp.employee_code[len(base_id):]
        if serial_part.isdigit():
            max_serial = max(max_serial, int(serial_part))
    
    new_serial = max_serial + 1
    return f"{base_id}{new_serial:04d}"
