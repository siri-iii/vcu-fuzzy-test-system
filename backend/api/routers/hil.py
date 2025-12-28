"""
HIL联调路由
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from api.models.schemas import (
    HILDevice, HILTestCase, HILTestCaseCreate
)
from api.services.hil_service import HILService

router = APIRouter()
service = HILService()

@router.get("/hil/devices", response_model=List[HILDevice])
async def get_devices():
    """获取HIL设备列表"""
    try:
        devices = await service.get_devices()
        return devices
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取设备列表失败: {str(e)}"
        )

@router.get("/hil/devices/{device_id}", response_model=HILDevice)
async def get_device(device_id: str):
    """获取设备详情"""
    try:
        device = await service.get_device(device_id)
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"设备 {device_id} 不存在"
            )
        return device
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取设备详情失败: {str(e)}"
        )

@router.post("/hil/devices/{device_id}/connect")
async def connect_device(device_id: str):
    """连接HIL设备"""
    try:
        result = await service.connect_device(device_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="设备连接失败"
            )
        return {"status": "connected", "device_id": device_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"连接设备失败: {str(e)}"
        )

@router.post("/hil/devices/{device_id}/disconnect")
async def disconnect_device(device_id: str):
    """断开HIL设备"""
    try:
        result = await service.disconnect_device(device_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="设备断开失败"
            )
        return {"status": "disconnected", "device_id": device_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"断开设备失败: {str(e)}"
        )

@router.get("/hil/test-cases", response_model=List[HILTestCase])
async def get_test_cases(device_id: Optional[str] = None):
    """获取测试用例列表"""
    try:
        test_cases = await service.get_test_cases(device_id)
        return test_cases
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取测试用例列表失败: {str(e)}"
        )

@router.post("/hil/test-cases", response_model=HILTestCase)
async def create_test_case(test_case: HILTestCaseCreate):
    """创建测试用例"""
    try:
        new_case = await service.create_test_case(test_case)
        return new_case
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建测试用例失败: {str(e)}"
        )

@router.post("/hil/test-cases/{test_case_id}/run")
async def run_test_case(test_case_id: str):
    """运行测试用例"""
    try:
        result = await service.run_test_case(test_case_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="运行测试用例失败，请检查设备连接状态"
            )
        return {"status": "running", "test_case_id": test_case_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"运行测试用例失败: {str(e)}"
        )

@router.post("/hil/test-cases/{test_case_id}/stop")
async def stop_test_case(test_case_id: str):
    """停止测试用例"""
    try:
        result = await service.stop_test_case(test_case_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="停止测试用例失败"
            )
        return {"status": "stopped", "test_case_id": test_case_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"停止测试用例失败: {str(e)}"
        )

@router.get("/hil/test-cases/{test_case_id}/result")
async def get_test_case_result(test_case_id: str):
    """获取测试结果"""
    try:
        result = await service.get_test_case_result(test_case_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"测试用例 {test_case_id} 不存在或未运行"
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取测试结果失败: {str(e)}"
        )

