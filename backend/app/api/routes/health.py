from fastapi import APIRouter

router = APIRouter(tags=["health"])

@router.get("/health")
def get_health():
    return {
        "success": True,
        "message": "Dayflow API is running"
    }
