from fastapi import APIRouter
from api.services.security_service import SecurityService
from api.models.schemas import SecurityConfig, SecurityVerifyRequest

router = APIRouter()
service = SecurityService()

@router.get("/security/config")
async def get_security_config():
    return await service.get_config()

@router.put("/security/config")
async def update_security_config(config: SecurityConfig):
    await service.update_config(config.dict())
    return {"message": "配置更新成功"}

@router.post("/security/verify")
async def verify_security(req: SecurityVerifyRequest):
    return await service.verify(task_id=req.task_id, payload=req.payload)

@router.get("/security/audit")
async def get_security_audit(limit: int = 50):
    return await service.get_audit_logs(limit)
