"""
监控服务
"""
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from api.models.schemas import RealTimeMetrics
from api.database.db import Database

logger = logging.getLogger(__name__)

class MonitoringService:
    def __init__(self):
        self.db = Database()
        self.metrics_cache = {}  # 缓存监控指标历史数据
    
    async def get_task_metrics(self, task_id: str, limit: int = 100) -> List[RealTimeMetrics]:
        """获取测试任务的历史监控指标"""
        # 从数据库获取任务数据
        task_data = await self.db.get_test_task(task_id)
        
        if not task_data:
            logger.warning(f"任务 {task_id} 不存在")
            return []
        
        # 如果任务还未开始或没有数据，返回初始指标
        if task_data.get("total_cases", 0) == 0:
            return [RealTimeMetrics(
                task_id=task_id,
                timestamp=datetime.now(),
                traditional_cases=0,
                traditional_anomalies=0,
                gan_cases=0,
                gan_anomalies=0,
                anomaly_rate=0.0,
                message_acceptance_rate=1.0,
                current_phase=None
            )]
        
        # 生成监控指标时间序列
        metrics = []
        
        # 如果缓存中有历史数据，使用缓存
        if task_id in self.metrics_cache:
            cached_metrics = self.metrics_cache[task_id]
            metrics.extend(cached_metrics[-limit:])
        
        # 添加当前最新指标
        current_metric = RealTimeMetrics(
            task_id=task_id,
            timestamp=datetime.now(),
            traditional_cases=task_data.get("traditional_stats", {}).get("cases", 0),
            traditional_anomalies=task_data.get("traditional_stats", {}).get("anomalies", 0),
            gan_cases=task_data.get("gan_stats", {}).get("cases", 0),
            gan_anomalies=task_data.get("gan_stats", {}).get("anomalies", 0),
            anomaly_rate=task_data.get("total_anomalies", 0) / max(task_data.get("total_cases", 1), 1),
            message_acceptance_rate=0.95,  # 默认值，实际应从约束统计数据计算
            current_phase=self._infer_current_phase(task_data)
        )
        
        # 更新缓存
        if task_id not in self.metrics_cache:
            self.metrics_cache[task_id] = []
        self.metrics_cache[task_id].append(current_metric)
        
        # 限制缓存大小
        if len(self.metrics_cache[task_id]) > 1000:
            self.metrics_cache[task_id] = self.metrics_cache[task_id][-1000:]
        
        # 如果没有历史数据，返回当前指标
        if not metrics:
            metrics = [current_metric]
        
        return metrics[-limit:]
    
    def _infer_current_phase(self, task_data: dict) -> Optional[str]:
        """推断当前测试阶段"""
        # 根据任务状态和统计信息推断测试阶段
        # 这里可以根据实际业务逻辑调整
        status = task_data.get("status")
        if status == "running":
            # 可以根据测试进度判断阶段
            return "wake"  # 示例：唤醒阶段
        return None



