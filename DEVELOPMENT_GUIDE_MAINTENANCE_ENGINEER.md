# 台架维护工程师界面开发指南

## 📋 概述

本文档为负责**台架维护工程师**界面的开发者提供详细的实现指南。台架维护工程师界面主要负责HIL联调、接口验证、系统部署和系统监控。

## 🎯 负责的界面组件

你需要实现以下前端组件的后端接口连接：

1. **HILDebugging.tsx** - HIL联调
2. **InterfaceVerification.tsx** - 接口验证
3. **SystemDeployment.tsx** - 系统部署
4. **SystemMonitoring.tsx** - 系统监控
5. **SystemSettings.tsx** - 系统配置（部分）

## 🔌 已实现的后端接口

### ✅ 系统配置接口（部分）

#### 1. 系统配置
- **GET** `/api/system/config` - 获取系统配置（需要实现）
- **PUT** `/api/system/config` - 更新系统配置（需要实现）

**说明**：这些接口用于管理系统配置，包括引擎配置、GAN模型配置等。

### ⚠️ 需要新增的接口

以下接口**目前不存在**，需要你实现：

#### 1. HIL联调接口

需要实现以下接口：

- **GET** `/api/hil/devices` - 获取HIL设备列表
- **GET** `/api/hil/devices/{id}` - 获取设备详情
- **POST** `/api/hil/devices/{id}/connect` - 连接设备
- **POST** `/api/hil/devices/{id}/disconnect` - 断开设备
- **GET** `/api/hil/test-cases` - 获取测试用例列表
- **POST** `/api/hil/test-cases` - 创建测试用例
- **POST** `/api/hil/test-cases/{id}/run` - 运行测试用例
- **POST** `/api/hil/test-cases/{id}/stop` - 停止测试用例
- **GET** `/api/hil/test-cases/{id}/result` - 获取测试结果

**数据结构**：
```python
# HIL设备
{
  "id": "string",
  "name": "string",
  "type": "VCU" | "HIL" | "CAN" | "PowerSupply",
  "status": "connected" | "disconnected" | "error",
  "ip_address": "string",
  "port": number,
  "last_update": "datetime",
  "capabilities": ["capability1", "capability2"]
}

# 测试用例
{
  "id": "string",
  "name": "string",
  "description": "string",
  "device_id": "string",
  "test_script": "string",  # JSON格式的测试脚本
  "status": "pending" | "running" | "passed" | "failed",
  "duration": number,
  "result": "string",
  "created_at": "datetime"
}
```

#### 2. 接口验证接口

需要实现以下接口：

- **GET** `/api/interfaces` - 获取接口列表
- **GET** `/api/interfaces/{id}` - 获取接口详情
- **POST** `/api/interfaces/{id}/verify` - 验证接口
- **GET** `/api/interfaces/{id}/test-history` - 获取测试历史
- **POST** `/api/interfaces/{id}/test` - 执行接口测试

**数据结构**：
```python
# 接口信息
{
  "id": "string",
  "name": "string",
  "type": "CAN" | "LIN" | "Ethernet" | "Serial",
  "endpoint": "string",
  "protocol": "string",
  "status": "active" | "inactive" | "error",
  "last_verified": "datetime",
  "verification_result": "passed" | "failed" | "pending"
}
```

#### 3. 系统部署接口

需要实现以下接口：

- **GET** `/api/deployment/versions` - 获取部署版本列表
- **GET** `/api/deployment/current` - 获取当前部署版本
- **POST** `/api/deployment/deploy` - 执行部署
- **GET** `/api/deployment/status` - 获取部署状态
- **POST** `/api/deployment/rollback` - 回滚部署

**数据结构**：
```python
# 部署版本
{
  "version": "string",
  "description": "string",
  "release_date": "datetime",
  "status": "deployed" | "pending" | "rollback",
  "components": [
    {
      "name": "string",
      "version": "string",
      "status": "string"
    }
  ]
}
```

#### 4. 系统监控接口

需要实现以下接口：

- **GET** `/api/monitoring/system` - 获取系统监控数据
- **GET** `/api/monitoring/resources` - 获取资源使用情况
- **GET** `/api/monitoring/logs` - 获取系统日志
- **GET** `/api/monitoring/alerts` - 获取告警信息

**数据结构**：
```python
# 系统监控数据
{
  "cpu_usage": number,
  "memory_usage": number,
  "disk_usage": number,
  "network_io": {
    "bytes_sent": number,
    "bytes_recv": number
  },
  "active_connections": number,
  "timestamp": "datetime"
}
```

#### 5. 系统配置接口

需要实现以下接口：

- **GET** `/api/system/config` - 获取系统配置
- **PUT** `/api/system/config` - 更新系统配置
- **GET** `/api/system/config/engines` - 获取引擎配置
- **PUT** `/api/system/config/engines` - 更新引擎配置
- **GET** `/api/system/config/gan-models` - 获取GAN模型列表
- **PUT** `/api/system/config/gan-models/{id}` - 更新GAN模型配置

## 📝 实现步骤

### 步骤1：创建HIL联调接口

1. **创建路由文件** `backend/api/routers/hil.py`：
```python
from fastapi import APIRouter, HTTPException
from typing import List
from api.models.schemas import HILDevice, HILTestCase, HILTestCaseCreate
from api.services.hil_service import HILService

router = APIRouter()
service = HILService()

@router.get("/hil/devices", response_model=List[HILDevice])
async def get_devices():
    """获取HIL设备列表"""
    return await service.get_devices()

@router.post("/hil/devices/{device_id}/connect")
async def connect_device(device_id: str):
    """连接HIL设备"""
    result = await service.connect_device(device_id)
    if not result:
        raise HTTPException(status_code=400, detail="设备连接失败")
    return {"status": "connected"}

# ... 其他接口
```

2. **创建服务文件** `backend/api/services/hil_service.py`：
```python
from typing import List, Optional
from api.database.db import Database

class HILService:
    def __init__(self):
        self.db = Database()
    
    async def get_devices(self) -> List[HILDevice]:
        """获取HIL设备列表"""
        # 实现设备发现和状态查询逻辑
        # 可以连接真实的HIL设备，或使用模拟数据
        pass
    
    async def connect_device(self, device_id: str) -> bool:
        """连接HIL设备"""
        # 实现设备连接逻辑
        # 可能需要调用设备SDK或API
        pass
    
    # ... 其他方法
```

### 步骤2：创建接口验证接口

1. **创建路由文件** `backend/api/routers/interfaces.py`
2. **创建服务文件** `backend/api/services/interface_service.py`
3. **实现接口验证逻辑**

### 步骤3：创建系统部署接口

1. **创建路由文件** `backend/api/routers/deployment.py`
2. **创建服务文件** `backend/api/services/deployment_service.py`
3. **实现部署和版本管理逻辑**

### 步骤4：创建系统监控接口

1. **创建路由文件** `backend/api/routers/system_monitoring.py`
2. **创建服务文件** `backend/api/services/system_monitoring_service.py`
3. **实现系统资源监控和日志收集**

### 步骤5：创建系统配置接口

1. **创建路由文件** `backend/api/routers/system_config.py`
2. **创建服务文件** `backend/api/services/system_config_service.py`
3. **实现系统配置管理**

### 步骤6：连接前端组件

1. **HILDebugging.tsx**
   - 使用 `hilAPI.getDevices()` 获取设备列表
   - 使用 `hilAPI.connect()`, `disconnect()` 连接/断开设备
   - 使用 `hilAPI.getTestCases()`, `runTestCase()` 管理测试用例

2. **InterfaceVerification.tsx**
   - 使用 `interfaceAPI.getAll()` 获取接口列表
   - 使用 `interfaceAPI.verify()` 验证接口
   - 使用 `interfaceAPI.getTestHistory()` 查看测试历史

3. **SystemDeployment.tsx**
   - 使用 `deploymentAPI.getVersions()` 获取版本列表
   - 使用 `deploymentAPI.deploy()` 执行部署
   - 使用 `deploymentAPI.rollback()` 回滚部署

4. **SystemMonitoring.tsx**
   - 使用 `monitoringAPI.getSystem()` 获取系统监控数据
   - 使用 `monitoringAPI.getResources()` 获取资源使用情况
   - 使用 `monitoringAPI.getLogs()` 获取系统日志

5. **SystemSettings.tsx**
   - 使用 `systemConfigAPI.getConfig()` 获取配置
   - 使用 `systemConfigAPI.updateConfig()` 更新配置

### 步骤7：更新API服务层

在 `frontend/src/services/api.ts` 中添加：

```typescript
// HIL联调API
export const hilAPI = {
  getDevices: () => api.get('/hil/devices'),
  getDeviceById: (id: string) => api.get(`/hil/devices/${id}`),
  connect: (id: string) => api.post(`/hil/devices/${id}/connect`),
  disconnect: (id: string) => api.post(`/hil/devices/${id}/disconnect`),
  getTestCases: () => api.get('/hil/test-cases'),
  createTestCase: (testCase: any) => api.post('/hil/test-cases', testCase),
  runTestCase: (id: string) => api.post(`/hil/test-cases/${id}/run`),
  stopTestCase: (id: string) => api.post(`/hil/test-cases/${id}/stop`),
  getTestCaseResult: (id: string) => api.get(`/hil/test-cases/${id}/result`),
};

// 接口验证API
export const interfaceAPI = {
  getAll: () => api.get('/interfaces'),
  getById: (id: string) => api.get(`/interfaces/${id}`),
  verify: (id: string) => api.post(`/interfaces/${id}/verify`),
  getTestHistory: (id: string) => api.get(`/interfaces/${id}/test-history`),
  test: (id: string, data: any) => api.post(`/interfaces/${id}/test`, data),
};

// 系统部署API
export const deploymentAPI = {
  getVersions: () => api.get('/deployment/versions'),
  getCurrent: () => api.get('/deployment/current'),
  deploy: (version: string) => api.post('/deployment/deploy', { version }),
  getStatus: () => api.get('/deployment/status'),
  rollback: (version: string) => api.post('/deployment/rollback', { version }),
};

// 系统监控API
export const systemMonitoringAPI = {
  getSystem: () => api.get('/monitoring/system'),
  getResources: () => api.get('/monitoring/resources'),
  getLogs: (params?: any) => api.get('/monitoring/logs', { params }),
  getAlerts: () => api.get('/monitoring/alerts'),
};

// 系统配置API
export const systemConfigAPI = {
  getConfig: () => api.get('/system/config'),
  updateConfig: (config: any) => api.put('/system/config', config),
  getEngines: () => api.get('/system/config/engines'),
  updateEngines: (config: any) => api.put('/system/config/engines', config),
  getGANModels: () => api.get('/system/config/gan-models'),
  updateGANModel: (id: string, config: any) => api.put(`/system/config/gan-models/${id}`, config),
};
```

## 🔍 数据流说明

### HIL设备连接流程

```
前端 → POST /api/hil/devices/{id}/connect
    ↓
HILService.connect_device()
    ↓
调用HIL设备SDK/API
    ↓
建立连接
    ↓
更新设备状态（数据库）
    ↓
返回连接结果
```

### 接口验证流程

```
前端 → POST /api/interfaces/{id}/verify
    ↓
InterfaceService.verify_interface()
    ↓
发送测试请求到接口
    ↓
验证响应格式和内容
    ↓
记录验证结果
    ↓
返回验证结果
```

### 系统部署流程

```
前端 → POST /api/deployment/deploy
    ↓
DeploymentService.deploy()
    ↓
备份当前版本
    ↓
下载新版本文件
    ↓
停止服务
    ↓
部署新版本
    ↓
启动服务
    ↓
验证部署
    ↓
更新部署状态
```

## 📚 相关文件

### 后端文件（需要创建）
- `backend/api/routers/hil.py` - HIL联调路由
- `backend/api/routers/interfaces.py` - 接口验证路由
- `backend/api/routers/deployment.py` - 系统部署路由
- `backend/api/routers/system_monitoring.py` - 系统监控路由
- `backend/api/routers/system_config.py` - 系统配置路由
- `backend/api/services/hil_service.py` - HIL服务
- `backend/api/services/interface_service.py` - 接口验证服务
- `backend/api/services/deployment_service.py` - 部署服务
- `backend/api/services/system_monitoring_service.py` - 系统监控服务
- `backend/api/services/system_config_service.py` - 系统配置服务

### 前端文件
- `frontend/src/components/HILDebugging.tsx`
- `frontend/src/components/InterfaceVerification.tsx`
- `frontend/src/components/SystemDeployment.tsx`
- `frontend/src/components/SystemMonitoring.tsx`
- `frontend/src/components/SystemSettings.tsx`
- `frontend/src/services/api.ts` - API服务层

## ⚠️ 注意事项

1. **HIL设备连接**：需要了解HIL设备的通信协议和SDK
2. **接口验证**：需要了解各种接口的验证方法（CAN、LIN、Ethernet等）
3. **系统部署**：需要考虑部署过程中的错误处理和回滚机制
4. **系统监控**：需要实现实时数据采集和告警机制
5. **权限控制**：系统配置和部署操作需要权限验证

## 🚀 快速开始

1. 启动后端：
```bash
cd backend
python3 run_server.py
```

2. 启动前端：
```bash
cd frontend
npm run dev
```

3. 访问前端：http://localhost:3000

4. 切换到"台架维护工程师"角色，开始开发！

## 📞 需要帮助？

如果遇到问题，请检查：
1. 后端日志：查看控制台输出
2. 前端控制台：查看浏览器开发者工具
3. API文档：http://localhost:8000/docs
4. 数据库文件：`backend/data/test_system.db`

祝你开发顺利！🎉

