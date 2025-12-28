"""
HIL联调服务
负责HIL设备管理和测试用例执行
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import json
from api.database.db import Database
from api.models.schemas import (
    HILDevice, HILTestCase, HILTestCaseCreate,
    HILDeviceStatus, HILTestCaseStatus
)


class HILService:
    """HIL联调服务类"""
    
    def __init__(self):
        self.db = Database()
        # 模拟设备连接状态（实际应该连接真实设备）
        self._device_connections: Dict[str, bool] = {}
        # 模拟运行中的测试用例
        self._running_tests: Dict[str, Dict[str, Any]] = {}
    
    async def get_devices(self) -> List[HILDevice]:
        """获取HIL设备列表"""
        # 实际实现中应该从设备发现服务或配置中获取
        # 这里返回模拟数据
        devices = [
            HILDevice(
                id="hil-001",
                name="VCU HIL台架 #1",
                type="VCU",
                status=HILDeviceStatus.connected if self._device_connections.get("hil-001") else HILDeviceStatus.disconnected,
                ip_address="192.168.1.100",
                port=8080,
                last_update=datetime.now(),
                capabilities=["CAN", "LIN", "PowerControl"]
            ),
            HILDevice(
                id="hil-002",
                name="域控制器HIL台架 #2",
                type="HIL",
                status=HILDeviceStatus.connected if self._device_connections.get("hil-002") else HILDeviceStatus.disconnected,
                ip_address="192.168.1.101",
                port=8080,
                last_update=datetime.now(),
                capabilities=["CAN", "Ethernet"]
            ),
        ]
        return devices
    
    async def get_device(self, device_id: str) -> Optional[HILDevice]:
        """获取设备详情"""
        devices = await self.get_devices()
        for device in devices:
            if device.id == device_id:
                return device
        return None
    
    async def connect_device(self, device_id: str) -> bool:
        """连接HIL设备"""
        # 实际实现中应该调用设备SDK或API进行连接
        # 这里模拟连接过程
        device = await self.get_device(device_id)
        if not device:
            return False
        
        # 模拟连接延迟
        import asyncio
        await asyncio.sleep(0.5)
        
        # 更新连接状态
        self._device_connections[device_id] = True
        return True
    
    async def disconnect_device(self, device_id: str) -> bool:
        """断开HIL设备"""
        # 实际实现中应该调用设备SDK或API进行断开
        if device_id in self._device_connections:
            self._device_connections[device_id] = False
            return True
        return False
    
    async def get_test_cases(self, device_id: Optional[str] = None) -> List[HILTestCase]:
        """获取测试用例列表"""
        # 实际实现中应该从数据库获取
        # 这里返回模拟数据
        test_cases = [
            HILTestCase(
                id="case-001",
                name="CAN总线连接测试",
                description="测试CAN总线通信是否正常",
                device_id="hil-001",
                test_script={"type": "can_test", "can_id": "0x100"},
                status=HILTestCaseStatus.pending,
                created_at=datetime.now()
            ),
            HILTestCase(
                id="case-002",
                name="唤醒信号注入测试",
                description="验证唤醒信号能否正确触发",
                device_id="hil-001",
                test_script={"type": "wakeup_test", "signal": "CC2_VOLTAGE"},
                status=HILTestCaseStatus.pending,
                created_at=datetime.now()
            ),
            HILTestCase(
                id="case-003",
                name="休眠流程验证",
                description="验证休眠流程是否符合预期",
                device_id="hil-001",
                test_script={"type": "sleep_test", "timeout": 5000},
                status=HILTestCaseStatus.pending,
                created_at=datetime.now()
            ),
        ]
        
        if device_id:
            test_cases = [tc for tc in test_cases if tc.device_id == device_id]
        
        return test_cases
    
    async def create_test_case(self, test_case: HILTestCaseCreate) -> HILTestCase:
        """创建测试用例"""
        new_case = HILTestCase(
            id=str(uuid.uuid4()),
            name=test_case.name,
            description=test_case.description,
            device_id=test_case.device_id,
            test_script=test_case.test_script,
            status=HILTestCaseStatus.pending,
            created_at=datetime.now()
        )
        # 实际实现中应该保存到数据库
        return new_case
    
    async def run_test_case(self, test_case_id: str) -> bool:
        """运行测试用例"""
        test_cases = await self.get_test_cases()
        test_case = next((tc for tc in test_cases if tc.id == test_case_id), None)
        
        if not test_case:
            return False
        
        # 检查设备是否连接
        device = await self.get_device(test_case.device_id)
        if not device or device.status != HILDeviceStatus.connected:
            return False
        
        # 模拟测试运行
        self._running_tests[test_case_id] = {
            "started_at": datetime.now(),
            "status": HILTestCaseStatus.running
        }
        
        # 实际实现中应该调用设备API执行测试
        # 这里使用异步任务模拟测试过程
        import asyncio
        asyncio.create_task(self._simulate_test_execution(test_case_id))
        
        return True
    
    async def _simulate_test_execution(self, test_case_id: str):
        """模拟测试执行过程"""
        import asyncio
        await asyncio.sleep(2)  # 模拟测试执行时间
        
        # 模拟测试结果（随机成功或失败）
        import random
        if test_case_id in self._running_tests:
            test_info = self._running_tests[test_case_id]
            test_info["status"] = HILTestCaseStatus.passed if random.random() > 0.3 else HILTestCaseStatus.failed
            test_info["duration"] = 2.0
            test_info["result"] = "测试通过" if test_info["status"] == HILTestCaseStatus.passed else "测试失败"
    
    async def stop_test_case(self, test_case_id: str) -> bool:
        """停止测试用例"""
        if test_case_id in self._running_tests:
            test_info = self._running_tests[test_case_id]
            test_info["status"] = HILTestCaseStatus.pending
            return True
        return False
    
    async def get_test_case_result(self, test_case_id: str) -> Optional[Dict[str, Any]]:
        """获取测试结果"""
        if test_case_id in self._running_tests:
            return self._running_tests[test_case_id]
        
        # 如果不在运行中，从测试用例列表获取
        test_cases = await self.get_test_cases()
        test_case = next((tc for tc in test_cases if tc.id == test_case_id), None)
        
        if test_case:
            return {
                "status": test_case.status,
                "duration": test_case.duration,
                "result": test_case.result
            }
        
        return None

