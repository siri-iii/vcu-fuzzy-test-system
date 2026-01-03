"""
测试任务服务
"""
from typing import List, Optional, Dict
from datetime import datetime
import uuid
import asyncio
import logging

from api.models.schemas import (
    TestTaskResponse, TaskStatus, AnomalyResponse, AnomalyType
)
from api.database.db import Database
from api.services.test_plan_service import TestPlanService
from api.services.constraint_service import ConstraintService
from api.services.gan_integration_service import GANIntegrationService
from api.websocket_manager import WebSocketManager

logger = logging.getLogger(__name__)

class TestTaskService:
    def __init__(self):
        self.db = Database()
        self.plan_service = TestPlanService()
        self.constraint_service = ConstraintService()
        self.gan_service = GANIntegrationService()
        self.ws_manager = WebSocketManager()
        self.running_tasks = {}  # 存储正在运行的任务
    
    async def create_task(self, plan_id: str) -> TestTaskResponse:
        """创建测试任务"""
        # 验证测试计划是否存在
        plan = await self.plan_service.get_test_plan(plan_id)
        if not plan:
            raise ValueError(f"测试计划 {plan_id} 不存在")
        
        task_id = str(uuid.uuid4())
        now = datetime.now()
        
        task_data = {
            "id": task_id,
            "plan_id": plan_id,
            "status": TaskStatus.PENDING.value,
            "traditional_stats": {
                "cases": 0,
                "anomalies": 0,
                "anomaly_rate": 0.0
            },
            "gan_stats": {
                "cases": 0,
                "anomalies": 0,
                "anomaly_rate": 0.0
            },
            "total_cases": 0,
            "total_anomalies": 0,
            "started_at": None,
            "paused_at": None,
            "completed_at": None,
            "created_at": now.isoformat()
        }
        
        await self.db.save_test_task(task_data)
        return TestTaskResponse(**task_data)
    
    async def start_task(self, task_id: str) -> Optional[TestTaskResponse]:
        """启动测试任务"""
        task_data = await self.db.get_test_task(task_id)
        if not task_data:
            return None
        
        task_data["status"] = TaskStatus.RUNNING.value
        task_data["started_at"] = datetime.now().isoformat()
        task_data["paused_at"] = None
        
        await self.db.update_test_task(task_id, task_data)
        return TestTaskResponse(**task_data)
    
    async def pause_task(self, task_id: str) -> Optional[TestTaskResponse]:
        """暂停测试任务"""
        task_data = await self.db.get_test_task(task_id)
        if not task_data:
            return None
        
        if task_data["status"] != TaskStatus.RUNNING.value:
            raise ValueError("只能暂停运行中的任务")
        
        task_data["status"] = TaskStatus.PAUSED.value
        task_data["paused_at"] = datetime.now().isoformat()
        
        await self.db.update_test_task(task_id, task_data)
        return TestTaskResponse(**task_data)
    
    async def stop_task(self, task_id: str) -> Optional[TestTaskResponse]:
        """停止测试任务"""
        task_data = await self.db.get_test_task(task_id)
        if not task_data:
            return None
        
        task_data["status"] = TaskStatus.STOPPED.value
        task_data["completed_at"] = datetime.now().isoformat()
        
        # 停止后台任务
        if task_id in self.running_tasks:
            self.running_tasks[task_id].cancel()
            del self.running_tasks[task_id]
        
        await self.db.update_test_task(task_id, task_data)
        return TestTaskResponse(**task_data)
    
    async def get_task(self, task_id: str) -> Optional[TestTaskResponse]:
        """获取测试任务"""
        task_data = await self.db.get_test_task(task_id)
        if task_data:
            return TestTaskResponse(**task_data)
        return None
    
    async def get_tasks(self, skip: int = 0, limit: int = 100) -> List[TestTaskResponse]:
        """获取测试任务列表"""
        tasks_data = await self.db.get_test_tasks(skip=skip, limit=limit)
        return [TestTaskResponse(**task) for task in tasks_data]
    
    async def get_task_anomalies(
        self, 
        task_id: str, 
        top_n: int = 10,
        source: Optional[str] = None,
        min_severity: int = 1
    ) -> List[AnomalyResponse]:
        """获取任务的异常列表"""
        anomalies_data = await self.db.get_task_anomalies(
            task_id, top_n=top_n, source=source, min_severity=min_severity
        )
        return [AnomalyResponse(**anomaly) for anomaly in anomalies_data]
    
    async def execute_test_task(self, task_id: str):
        """
        执行测试任务（后台任务）
        整合GAN生成、约束验证、北汽接口调用和异常检测
        """
        try:
            task_data = await self.db.get_test_task(task_id)
            if not task_data:
                logger.error(f"任务 {task_id} 不存在")
                return
            
            plan = await self.plan_service.get_test_plan(task_data["plan_id"])
            if not plan:
                logger.error(f"测试计划 {task_data['plan_id']} 不存在")
                return
            
            logger.info(f"开始执行测试任务 {task_id}, 计划: {plan.name}")
            
            # 加载GAN模型（如果需要）
            if plan.gan_config and plan.gan_config.enabled:
                try:
                    self.gan_service.load_gan_model()
                except Exception as e:
                    logger.error(f"加载GAN模型失败: {e}")
            
            iteration = 0
            max_iterations = 1000  # 最大迭代次数
            
            # 从配置获取最大测试用例数
            traditional_max = plan.traditional_config.max_cases if plan.traditional_config else 0
            gan_max = plan.gan_config.max_cases if plan.gan_config else 0
            
            while task_data["status"] == TaskStatus.RUNNING.value:
                # 检查是否被暂停或停止
                task_data = await self.db.get_test_task(task_id)
                if task_data["status"] != TaskStatus.RUNNING.value:
                    logger.info(f"任务 {task_id} 已暂停或停止")
                    break
                
                iteration += 1
                logger.debug(f"任务 {task_id} 迭代 {iteration}")
                
                # 执行传统测试
                if plan.traditional_config and plan.traditional_config.enabled:
                    if task_data["traditional_stats"]["cases"] < traditional_max:
                        await self._execute_traditional_test(task_id, task_data, plan)
                
                # 执行GAN测试
                if plan.gan_config and plan.gan_config.enabled:
                    if task_data["gan_stats"]["cases"] < gan_max:
                        await self._execute_gan_test(task_id, task_data, plan)
                
                # 更新总计数
                task_data["total_cases"] = (
                    task_data["traditional_stats"]["cases"] + 
                    task_data["gan_stats"]["cases"]
                )
                task_data["total_anomalies"] = (
                    task_data["traditional_stats"]["anomalies"] + 
                    task_data["gan_stats"]["anomalies"]
                )
                
                # 计算异常率
                if task_data["traditional_stats"]["cases"] > 0:
                    task_data["traditional_stats"]["anomaly_rate"] = (
                        task_data["traditional_stats"]["anomalies"] / 
                        task_data["traditional_stats"]["cases"]
                    )
                
                if task_data["gan_stats"]["cases"] > 0:
                    task_data["gan_stats"]["anomaly_rate"] = (
                        task_data["gan_stats"]["anomalies"] / 
                        task_data["gan_stats"]["cases"]
                    )
                
                # 保存更新
                await self.db.update_test_task(task_id, task_data)
                
                # 通过WebSocket推送实时更新
                await self.ws_manager.broadcast_to_task(task_id, {
                    "type": "metrics_update",
                    "task_id": task_id,
                    "timestamp": datetime.now().isoformat(),
                    "metrics": {
                        "traditional_cases": task_data["traditional_stats"]["cases"],
                        "traditional_anomalies": task_data["traditional_stats"]["anomalies"],
                        "gan_cases": task_data["gan_stats"]["cases"],
                        "gan_anomalies": task_data["gan_stats"]["anomalies"],
                        "total_cases": task_data["total_cases"],
                        "total_anomalies": task_data["total_anomalies"]
                    }
                })
                
                # 检查是否达到测试目标
                traditional_done = not (plan.traditional_config and plan.traditional_config.enabled) or \
                                   task_data["traditional_stats"]["cases"] >= traditional_max
                gan_done = not (plan.gan_config and plan.gan_config.enabled) or \
                           task_data["gan_stats"]["cases"] >= gan_max
                
                if traditional_done and gan_done:
                    logger.info(f"任务 {task_id} 已完成所有测试")
                    task_data["status"] = TaskStatus.COMPLETED.value
                    task_data["completed_at"] = datetime.now().isoformat()
                    await self.db.update_test_task(task_id, task_data)
                    break
                
                # 限制迭代次数
                if iteration >= max_iterations:
                    logger.warning(f"任务 {task_id} 达到最大迭代次数")
                    task_data["status"] = TaskStatus.COMPLETED.value
                    task_data["completed_at"] = datetime.now().isoformat()
                    await self.db.update_test_task(task_id, task_data)
                    break
                
                # 执行间隔
                await asyncio.sleep(1)
            
            logger.info(f"任务 {task_id} 执行完成")
            
        except asyncio.CancelledError:
            logger.info(f"任务 {task_id} 被取消")
            task_data = await self.db.get_test_task(task_id)
            if task_data:
                task_data["status"] = TaskStatus.STOPPED.value
                await self.db.update_test_task(task_id, task_data)
        except Exception as e:
            logger.error(f"任务 {task_id} 执行失败: {e}", exc_info=True)
            task_data = await self.db.get_test_task(task_id)
            if task_data:
                task_data["status"] = TaskStatus.FAILED.value
                await self.db.update_test_task(task_id, task_data)
    
    async def _execute_traditional_test(self, task_id: str, task_data: dict, plan):
        """执行传统测试"""
        try:
            # 传统测试逻辑：生成变异测试用例
            # 这里可以实现边界值测试、随机变异等
            # 为了简化，每次生成一批测试用例
            
            batch_size = 5  # 每次生成5个传统测试用例
            for _ in range(batch_size):
                # 这里应该实现传统的模糊测试逻辑
                # 现在先模拟测试用例生成
                task_data["traditional_stats"]["cases"] += 1
                
                # 模拟异常检测（约2-3%的概率）
                import random
                if random.random() < 0.025:
                    task_data["traditional_stats"]["anomalies"] += 1
                    # 记录异常到数据库
                    await self._save_anomaly(task_id, "traditional", task_data["traditional_stats"]["cases"])
            
            logger.debug(f"传统测试: 生成 {batch_size} 个用例")
        except Exception as e:
            logger.error(f"传统测试执行失败: {e}")
    
    async def _execute_gan_test(self, task_id: str, task_data: dict, plan):
        """执行GAN测试"""
        try:
            # 使用GAN生成测试用例并发送到北汽接口
            sequence_length = 8
            temperature = plan.gan_config.sampling_temperature if plan.gan_config else 1.0
            
            result = await self.gan_service.generate_and_send_test_case(
                condition=None,
                sequence_length=sequence_length,
                temperature=temperature,
                send_to_baic=True
            )
            
            task_data["gan_stats"]["cases"] += 1
            
            # 检测异常
            if result.get("baic_response"):
                anomaly_detected = await self._detect_anomaly_from_response(result["baic_response"])
                if anomaly_detected:
                    task_data["gan_stats"]["anomalies"] += 1
                    # 记录异常到数据库
                    await self._save_anomaly(
                        task_id, 
                        "gan", 
                        task_data["gan_stats"]["cases"],
                        test_case=result.get("gan_data"),
                        baic_response=result.get("baic_response")
                    )
            
            logger.debug(f"GAN测试: 生成1个用例, 发送状态: {result.get('sent_to_baic')}")
        except Exception as e:
            logger.error(f"GAN测试执行失败: {e}")
    
    async def _detect_anomaly_from_response(self, baic_response: dict) -> bool:
        """从北汽接口响应中检测异常"""
        try:
            # 这里应该实现真实的异常检测逻辑
            # 比如检查响应状态、错误码、超时等
            if not baic_response.get("success"):
                return True
            
            # 检查响应数据是否符合预期
            # 这里可以添加更多的异常判定规则
            
            # 模拟异常检测（约2-3%的概率）
            import random
            return random.random() < 0.025
        except Exception as e:
            logger.error(f"异常检测失败: {e}")
            return False
    
    async def _save_anomaly(
        self, 
        task_id: str, 
        source: str, 
        case_number: int,
        test_case: dict = None,
        baic_response: dict = None
    ):
        """保存异常记录到数据库"""
        try:
            anomaly_id = str(uuid.uuid4())
            
            # 确定异常类型和严重程度
            import random
            anomaly_types = [
                AnomalyType.STATE_MACHINE_ERROR.value,
                AnomalyType.TIMEOUT.value,
                AnomalyType.VALUE_OUT_OF_RANGE.value,
                AnomalyType.CRC_ERROR.value
            ]
            
            anomaly_data = {
                "id": anomaly_id,
                "task_id": task_id,
                "anomaly_type": random.choice(anomaly_types),
                "severity": random.randint(1, 3),
                "test_case": test_case or {},
                "context": {
                    "source": source,
                    "case_number": case_number,
                    "baic_response": baic_response
                },
                "detected_at": datetime.now().isoformat(),
                "source": source,
                "reproducible": random.random() > 0.5,
                "min_reproduce_script": None
            }
            
            await self.db.save_anomaly(anomaly_data)
            logger.info(f"保存异常 {anomaly_id}, 来源: {source}, 类型: {anomaly_data['anomaly_type']}")
        except Exception as e:
            logger.error(f"保存异常记录失败: {e}")
    
    async def get_task_logs(
        self, 
        task_id: str, 
        limit: int = 50,
        source: str = None
    ) -> List[Dict]:
        """获取任务日志"""
        try:
            conn = self.db._get_connection()
            cursor = conn.cursor()
            
            if source:
                cursor.execute("""
                    SELECT * FROM test_logs 
                    WHERE task_id = ? AND source = ?
                    ORDER BY timestamp DESC 
                    LIMIT ?
                """, (task_id, source, limit))
            else:
                cursor.execute("""
                    SELECT * FROM test_logs 
                    WHERE task_id = ?
                    ORDER BY timestamp DESC 
                    LIMIT ?
                """, (task_id, limit))
            
            rows = cursor.fetchall()
            conn.close()
            
            logs = []
            for row in rows:
                logs.append({
                    "id": row[0],
                    "task_id": row[1],
                    "timestamp": row[2],
                    "source": row[3],
                    "level": row[4],
                    "message": row[5],
                    "details": row[6]
                })
            
            return logs
        except Exception as e:
            logger.error(f"获取任务日志失败: {e}")
            return []
