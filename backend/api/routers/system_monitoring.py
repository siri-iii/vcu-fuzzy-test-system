"""
系统监控路由
"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
from api.models.schemas import (
    SystemMonitoringData, ResourceUsage, SystemLog, Alert
)
from api.services.system_monitoring_service import SystemMonitoringService

router = APIRouter()
service = SystemMonitoringService()

@router.get("/monitoring/system", response_model=SystemMonitoringData)
async def get_system_monitoring():
    """获取系统监控数据"""
    try:
        data = await service.get_system_monitoring()
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取系统监控数据失败: {str(e)}"
        )

@router.get("/monitoring/resources", response_model=ResourceUsage)
async def get_resources():
    """获取资源使用情况"""
    try:
        data = await service.get_resources()
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取资源使用情况失败: {str(e)}"
        )

@router.get("/monitoring/logs", response_model=List[SystemLog])
async def get_logs(
    level: Optional[str] = Query(None, description="日志级别"),
    source: Optional[str] = Query(None, description="日志来源"),
    limit: int = Query(100, ge=1, le=1000, description="返回数量限制"),
    start_time: Optional[datetime] = Query(None, description="开始时间"),
    end_time: Optional[datetime] = Query(None, description="结束时间")
):
    """获取系统日志"""
    try:
        logs = await service.get_logs(
            level=level,
            source=source,
            limit=limit,
            start_time=start_time,
            end_time=end_time
        )
        return logs
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取系统日志失败: {str(e)}"
        )

@router.get("/monitoring/alerts", response_model=List[Alert])
async def get_alerts(
    level: Optional[str] = Query(None, description="告警级别"),
    resolved: Optional[bool] = Query(None, description="是否已解决"),
    limit: int = Query(50, ge=1, le=500, description="返回数量限制")
):
    """获取告警信息"""
    try:
        alerts = await service.get_alerts(
            level=level,
            resolved=resolved,
            limit=limit
        )
        return alerts
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取告警信息失败: {str(e)}"
        )

