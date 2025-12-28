"""
系统监控服务
负责系统资源监控、日志收集和告警管理
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import psutil
import os
from api.database.db import Database
from api.models.schemas import (
    SystemMonitoringData, ResourceUsage, SystemLog, Alert, NetworkIO
)


class SystemMonitoringService:
    """系统监控服务类"""
    
    def __init__(self):
        self.db = Database()
        # 模拟日志和告警数据
        self._logs: List[SystemLog] = []
        self._alerts: List[Alert] = []
        self._init_mock_data()
    
    def _init_mock_data(self):
        """初始化模拟数据"""
        # 生成一些模拟日志
        log_levels = ["info", "warning", "error"]
        log_sources = ["backend", "frontend", "database", "gan-service"]
        messages = [
            "系统启动完成",
            "数据库连接成功",
            "GAN模型加载完成",
            "测试任务已启动",
            "检测到异常",
            "内存使用率过高",
            "磁盘空间不足",
        ]
        
        for i in range(20):
            self._logs.append(SystemLog(
                id=str(uuid.uuid4()),
                level=log_levels[i % len(log_levels)],
                message=messages[i % len(messages)],
                source=log_sources[i % len(log_sources)],
                timestamp=datetime.now() - timedelta(minutes=20-i)
            ))
        
        # 生成一些模拟告警
        alert_levels = ["info", "warning", "error", "critical"]
        alert_messages = [
            "CPU使用率超过80%",
            "内存使用率超过90%",
            "磁盘空间不足10%",
            "网络连接异常",
            "服务响应时间过长",
        ]
        
        for i in range(5):
            self._alerts.append(Alert(
                id=str(uuid.uuid4()),
                level=alert_levels[i % len(alert_levels)],
                message=alert_messages[i % len(alert_messages)],
                source="system",
                timestamp=datetime.now() - timedelta(hours=5-i),
                resolved=i < 2  # 前两个已解决
            ))
    
    async def get_system_monitoring(self) -> SystemMonitoringData:
        """获取系统监控数据"""
        try:
            # 获取系统资源使用情况
            cpu_usage = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # 获取网络IO
            net_io = psutil.net_io_counters()
            
            # 获取活动连接数（简化实现）
            active_connections = len(psutil.net_connections())
            
            return SystemMonitoringData(
                cpu_usage=cpu_usage,
                memory_usage=memory.percent,
                disk_usage=disk.percent,
                network_io=NetworkIO(
                    bytes_sent=net_io.bytes_sent,
                    bytes_recv=net_io.bytes_recv
                ),
                active_connections=active_connections,
                timestamp=datetime.now()
            )
        except Exception as e:
            # 如果psutil不可用，返回模拟数据
            return SystemMonitoringData(
                cpu_usage=45.5,
                memory_usage=62.3,
                disk_usage=35.8,
                network_io=NetworkIO(
                    bytes_sent=1024000,
                    bytes_recv=2048000
                ),
                active_connections=10,
                timestamp=datetime.now()
            )
    
    async def get_resources(self) -> ResourceUsage:
        """获取资源使用情况"""
        try:
            # 获取系统资源使用情况
            cpu_usage = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # 获取网络IO
            net_io = psutil.net_io_counters()
            
            return ResourceUsage(
                cpu=cpu_usage,
                memory=memory.percent,
                disk=disk.percent,
                network=NetworkIO(
                    bytes_sent=net_io.bytes_sent,
                    bytes_recv=net_io.bytes_recv
                ),
                timestamp=datetime.now()
            )
        except Exception as e:
            # 如果psutil不可用，返回模拟数据
            return ResourceUsage(
                cpu=45.5,
                memory=62.3,
                disk=35.8,
                network=NetworkIO(
                    bytes_sent=1024000,
                    bytes_recv=2048000
                ),
                timestamp=datetime.now()
            )
    
    async def get_logs(
        self,
        level: Optional[str] = None,
        source: Optional[str] = None,
        limit: int = 100,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[SystemLog]:
        """获取系统日志"""
        logs = self._logs.copy()
        
        # 过滤
        if level:
            logs = [log for log in logs if log.level == level]
        if source:
            logs = [log for log in logs if log.source == source]
        if start_time:
            logs = [log for log in logs if log.timestamp >= start_time]
        if end_time:
            logs = [log for log in logs if log.timestamp <= end_time]
        
        # 按时间倒序排序
        logs.sort(key=lambda x: x.timestamp, reverse=True)
        
        return logs[:limit]
    
    async def get_alerts(
        self,
        level: Optional[str] = None,
        resolved: Optional[bool] = None,
        limit: int = 50
    ) -> List[Alert]:
        """获取告警信息"""
        alerts = self._alerts.copy()
        
        # 过滤
        if level:
            alerts = [alert for alert in alerts if alert.level == level]
        if resolved is not None:
            alerts = [alert for alert in alerts if alert.resolved == resolved]
        
        # 按时间倒序排序
        alerts.sort(key=lambda x: x.timestamp, reverse=True)
        
        return alerts[:limit]
    
    async def add_log(self, level: str, message: str, source: str = "system"):
        """添加日志"""
        log = SystemLog(
            id=str(uuid.uuid4()),
            level=level,
            message=message,
            source=source,
            timestamp=datetime.now()
        )
        self._logs.insert(0, log)
        # 保持日志数量在合理范围内
        if len(self._logs) > 1000:
            self._logs = self._logs[:1000]
    
    async def add_alert(self, level: str, message: str, source: str = "system"):
        """添加告警"""
        alert = Alert(
            id=str(uuid.uuid4()),
            level=level,
            message=message,
            source=source,
            timestamp=datetime.now(),
            resolved=False
        )
        self._alerts.insert(0, alert)
        # 保持告警数量在合理范围内
        if len(self._alerts) > 500:
            self._alerts = self._alerts[:500]

