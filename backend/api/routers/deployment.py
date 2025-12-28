"""
系统部署路由
"""
from fastapi import APIRouter, HTTPException, status
from typing import List
from api.models.schemas import (
    DeploymentVersion, DeploymentRequest, DeploymentStatusResponse,
    RollbackRequest
)
from api.services.deployment_service import DeploymentService

router = APIRouter()
service = DeploymentService()

@router.get("/deployment/versions", response_model=List[DeploymentVersion])
async def get_versions():
    """获取部署版本列表"""
    try:
        versions = await service.get_versions()
        return versions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取版本列表失败: {str(e)}"
        )

@router.get("/deployment/current", response_model=DeploymentVersion)
async def get_current_version():
    """获取当前部署版本"""
    try:
        version = await service.get_current_version()
        if not version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="当前没有部署的版本"
            )
        return version
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取当前版本失败: {str(e)}"
        )

@router.post("/deployment/deploy")
async def deploy(request: DeploymentRequest):
    """执行部署"""
    try:
        result = await service.deploy(request)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "部署失败")
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"执行部署失败: {str(e)}"
        )

@router.get("/deployment/status", response_model=DeploymentStatusResponse)
async def get_deployment_status():
    """获取部署状态"""
    try:
        status_data = await service.get_deployment_status()
        return status_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取部署状态失败: {str(e)}"
        )

@router.post("/deployment/rollback")
async def rollback(request: RollbackRequest):
    """回滚部署"""
    try:
        result = await service.rollback(request)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "回滚失败")
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"回滚部署失败: {str(e)}"
        )

