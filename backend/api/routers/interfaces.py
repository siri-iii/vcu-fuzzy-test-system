"""
接口验证路由
"""
from fastapi import APIRouter, HTTPException, status
from typing import List
from api.models.schemas import (
    Interface, InterfaceTestHistory, InterfaceTestRequest
)
from api.services.interface_service import InterfaceService

router = APIRouter()
service = InterfaceService()

@router.get("/interfaces", response_model=List[Interface])
async def get_interfaces():
    """获取接口列表"""
    try:
        interfaces = await service.get_interfaces()
        return interfaces
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取接口列表失败: {str(e)}"
        )

@router.get("/interfaces/{interface_id}", response_model=Interface)
async def get_interface(interface_id: str):
    """获取接口详情"""
    try:
        interface = await service.get_interface(interface_id)
        if not interface:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"接口 {interface_id} 不存在"
            )
        return interface
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取接口详情失败: {str(e)}"
        )

@router.post("/interfaces/{interface_id}/verify")
async def verify_interface(interface_id: str):
    """验证接口"""
    try:
        result = await service.verify_interface(interface_id)
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "验证失败")
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"验证接口失败: {str(e)}"
        )

@router.get("/interfaces/{interface_id}/test-history", response_model=List[InterfaceTestHistory])
async def get_test_history(interface_id: str, limit: int = 10):
    """获取测试历史"""
    try:
        history = await service.get_test_history(interface_id, limit)
        return history
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取测试历史失败: {str(e)}"
        )

@router.post("/interfaces/{interface_id}/test")
async def test_interface(interface_id: str, test_request: InterfaceTestRequest):
    """执行接口测试"""
    try:
        result = await service.test_interface(interface_id, test_request)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"执行接口测试失败: {str(e)}"
        )

